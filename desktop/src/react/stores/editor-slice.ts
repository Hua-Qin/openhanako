/**
 * editor-slice — 编程模式编辑器状态（打开的标签、dirty 跟踪、保存）
 *
 * 参考 Theia EditorManager + Saveable 模式：用 Zustand 管理多标签状态，
 * 支持乐观锁写入（writeFileIfUnchanged）。
 */

import type { FileVersion } from '../types';
import type { DeskFile } from '../types';
import { hanaFetch } from '../hooks/use-hana-fetch';
import { useStore } from './index';

export interface OpenEditorTab {
  /** 唯一 ID（绝对路径 + counter，counter 用于同一文件多实例） */
  id: string;
  /** 绝对文件路径 */
  filePath: string;
  /** 显示文件名 */
  fileName: string;
  /** 相对于 deskBasePath / mount 的子目录路径 */
  subdir: string;
  /** Monaco 编辑器内容（包含未保存修改） */
  content: string;
  /** 最后一次成功保存时的内容（用于 dirty 判断） */
  savedContent: string;
  /** 文件版本（用于乐观锁写入） */
  fileVersion: FileVersion | null;
  /** Monaco 语言 ID */
  language: string;
  /** Monaco 视图状态（光标位置、滚动位置、折叠状态） */
  viewState: unknown;
  /** 是否有未保存修改 */
  dirty: boolean;
}

export interface EditorSlice {
  openTabs: OpenEditorTab[];
  activeTabId: string | null;
  /** 编程模式文件树侧栏是否展开 */
  codingFileTreeOpen: boolean;

  /** 打开文件（如已打开则激活） */
  openFile: (filePath: string, fileName: string, subdir: string) => Promise<string | null>;
  /** 关闭 tab（force=true 跳过 dirty 检查） */
  closeTab: (tabId: string, force?: boolean) => Promise<boolean>;
  /** 设置当前活动 tab */
  setActiveTab: (tabId: string) => void;
  /** 更新 tab 内容（编辑时调用） */
  updateContent: (tabId: string, content: string) => void;
  /** 更新 Monaco 视图状态 */
  updateViewState: (tabId: string, viewState: unknown) => void;
  /** 保存 tab 内容 */
  saveTab: (tabId: string) => Promise<boolean>;
  /** 重置为已保存状态（用于关闭时的取消） */
  markSaved: (tabId: string) => void;
  /** 切换文件树侧栏展开 */
  setCodingFileTreeOpen: (open: boolean) => void;
  /** 关闭全部已保存的 tab */
  closeAllSaved: () => void;
}

let _editorTabCounter = 0;
function nextTabId(filePath: string): string {
  _editorTabCounter += 1;
  return `${filePath}::${_editorTabCounter}`;
}

function findTabByPath(state: EditorSlice, filePath: string): OpenEditorTab | undefined {
  // 同路径已打开 → 返回最近的一个
  for (let i = state.openTabs.length - 1; i >= 0; i -= 1) {
    if (state.openTabs[i].filePath === filePath) return state.openTabs[i];
  }
  return undefined;
}

/** 根据文件扩展名推断 Monaco language ID */
export function inferLanguageFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    json: 'json', jsonc: 'json',
    html: 'html', htm: 'html', xml: 'xml', svg: 'xml',
    css: 'css', scss: 'scss', less: 'less',
    md: 'markdown', markdown: 'markdown',
    py: 'python', rb: 'ruby', php: 'php',
    java: 'java', kt: 'kotlin', swift: 'swift',
    c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
    cs: 'csharp', go: 'go', rs: 'rust',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    yaml: 'yaml', yml: 'yaml', toml: 'ini', ini: 'ini',
    sql: 'sql', graphql: 'graphql', gql: 'graphql',
    vue: 'html', svelte: 'html', astro: 'html',
    txt: 'plaintext', log: 'plaintext',
    dockerfile: 'dockerfile',
  };
  return map[ext] || 'plaintext';
}

/** 读取文件内容（本地平台 / 远端 mount） */
async function readEditorFileContent(
  filePath: string,
  fileName: string,
): Promise<{ content: string; version: FileVersion | null }> {
  const s = useStore.getState();
  const mountId = s.deskWorkspaceMountId;
  const platform = window.platform;

  // 本地平台：使用 IPC 读取（带版本快照）
  if (platform && !mountId) {
    try {
      const snapshot = await platform.readFileSnapshot?.(filePath);
      if (snapshot) {
        return { content: snapshot.content || '', version: snapshot.version || null };
      }
      const content = await platform.readFile?.(filePath);
      return { content: content || '', version: null };
    } catch (err) {
      console.error('[editor-slice] readFile failed', filePath, err);
      throw err;
    }
  }

  // 远端 mount：通过 workbench API 读取
  if (mountId) {
    const res = await hanaFetch(`/api/workbench/files?mountId=${encodeURIComponent(mountId)}`);
    const data = await res.json().catch(() => ({}));
    if (data.error) throw new Error(String(data.error));
    // 远端场景下，简单从 files 列表中匹配（更精确的方式是新增 read 接口，
    // 但目前 workbench API 的列表已包含 name/mtime/size）。
    // 如果需要完整内容，可改为单独读取；此处为简化先标记为不支持
    return { content: '', version: null };
  }

  // 回退：尝试平台 IPC
  if (platform) {
    const content = await platform.readFile?.(filePath);
    return { content: content || '', version: null };
  }

  throw new Error('No platform or mount available to read file');
}

/** 保存 tab 内容（本地平台 / 远端 mount） */
async function writeEditorFileContent(
  tab: OpenEditorTab,
): Promise<{ ok: boolean; conflict?: boolean; version: FileVersion | null }> {
  const s = useStore.getState();
  const mountId = s.deskWorkspaceMountId;
  const platform = window.platform;

  // 本地平台：乐观锁写入
  if (platform && !mountId) {
    if (platform.writeFileIfUnchanged && tab.fileVersion) {
      try {
        await platform.writeFileIfUnchanged(tab.filePath, tab.content, tab.fileVersion);
        return { ok: true, version: tab.fileVersion };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // mtime/size 不匹配 → 文件被外部修改
        if (msg.includes('conflict') || msg.includes('mtime') || msg.includes('version')) {
          return { ok: false, conflict: true, version: null };
        }
        console.error('[editor-slice] writeFileIfUnchanged failed', err);
        throw err;
      }
    }
    if (platform.writeFile) {
      await platform.writeFile(tab.filePath, tab.content);
      return { ok: true, version: null };
    }
    throw new Error('No writeFile platform API');
  }

  // 远端 mount：通过 workbench API 写入
  if (mountId) {
    try {
      const res = await hanaFetch('/api/workbench/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'writeText',
          mountId,
          subdir: tab.subdir,
          name: tab.fileName,
          content: tab.content,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error) {
        console.error('[editor-slice] workbench writeText error', data.error);
        return { ok: false, version: null };
      }
      return { ok: true, version: tab.fileVersion };
    } catch (err) {
      console.error('[editor-slice] workbench writeText failed', err);
      return { ok: false, version: null };
    }
  }

  // 回退到普通写入
  if (platform?.writeFile) {
    await platform.writeFile(tab.filePath, tab.content);
    return { ok: true, version: null };
  }

  return { ok: false, version: null };
}

export function createEditorSlice(set: (partial: Partial<EditorSlice> | ((s: EditorSlice) => Partial<EditorSlice>)) => void): EditorSlice {
  return {
    openTabs: [],
    activeTabId: null,
    codingFileTreeOpen: true,

    async openFile(filePath, fileName, subdir) {
      const state = useStore.getState() as EditorSlice;
      const existing = findTabByPath(state, filePath);
      if (existing) {
        set(() => ({ activeTabId: existing.id }));
        return existing.id;
      }

      let content = '';
      let version: FileVersion | null = null;
      try {
        const read = await readEditorFileContent(filePath, fileName);
        content = read.content;
        version = read.version;
      } catch (err) {
        console.error('[editor-slice] openFile: read failed', err);
        // 即使读取失败也打开空 tab，让用户至少能编辑
      }

      const id = nextTabId(filePath);
      const language = inferLanguageFromName(fileName);
      const newTab: OpenEditorTab = {
        id,
        filePath,
        fileName,
        subdir,
        content,
        savedContent: content,
        fileVersion: version,
        language,
        viewState: null,
        dirty: false,
      };

      set((s) => ({
        openTabs: [...s.openTabs, newTab],
        activeTabId: id,
      }));
      return id;
    },

    async closeTab(tabId, force = false) {
      const s = useStore.getState() as EditorSlice;
      const tab = s.openTabs.find(t => t.id === tabId);
      if (!tab) return true;
      if (!force && tab.dirty) {
        const ok = window.confirm?.(`「${tab.fileName}」有未保存修改，确定关闭？`) ?? false;
        if (!ok) return false;
      }
      const remaining = s.openTabs.filter(t => t.id !== tabId);
      let nextActive = s.activeTabId;
      if (s.activeTabId === tabId) {
        const idx = s.openTabs.findIndex(t => t.id === tabId);
        nextActive = remaining[idx]?.id || remaining[idx - 1]?.id || null;
      }
      set(() => ({ openTabs: remaining, activeTabId: nextActive }));
      return true;
    },

    setActiveTab(tabId) {
      set(() => ({ activeTabId: tabId }));
    },

    updateContent(tabId, content) {
      set((s) => ({
        openTabs: s.openTabs.map(t =>
          t.id === tabId
            ? { ...t, content, dirty: content !== t.savedContent }
            : t,
        ),
      }));
    },

    updateViewState(tabId, viewState) {
      set((s) => ({
        openTabs: s.openTabs.map(t =>
          t.id === tabId ? { ...t, viewState } : t,
        ),
      }));
    },

    async saveTab(tabId) {
      const s = useStore.getState() as EditorSlice;
      const tab = s.openTabs.find(t => t.id === tabId);
      if (!tab) return false;

      const result = await writeEditorFileContent(tab);
      if (!result.ok) {
        if (result.conflict) {
          window.dispatchEvent(new CustomEvent('hana-inline-notice', {
            detail: { text: `「${tab.fileName}」已被外部修改，请重新加载后再保存`, type: 'error' },
          }));
        }
        return false;
      }

      set((s2) => ({
        openTabs: s2.openTabs.map(t =>
          t.id === tabId
            ? { ...t, savedContent: tab.content, dirty: false, fileVersion: result.version ?? t.fileVersion }
            : t,
        ),
      }));
      return true;
    },

    markSaved(tabId) {
      set((s) => ({
        openTabs: s.openTabs.map(t =>
          t.id === tabId
            ? { ...t, savedContent: t.content, dirty: false }
            : t,
        ),
      }));
    },

    setCodingFileTreeOpen(open) {
      set(() => ({ codingFileTreeOpen: open }));
    },

    setCodingChatOpen(open) {
      set(() => ({ codingChatOpen: open }));
    },

    closeAllSaved() {
      set((s) => {
        const remaining = s.openTabs.filter(t => t.dirty);
        const nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
        return { openTabs: remaining, activeTabId: nextActive };
      });
    },
  };
}

/** 将 DeskFile 转换为编辑器打开参数（供 CodingFileTree 调用） */
export function deskFileToEditorArgs(
  file: DeskFile,
  subdir: string,
  deskBasePath: string | null | undefined,
  nativeRoot: string | null,
): { filePath: string; fileName: string; subdir: string } | null {
  if (file.isDir) return null;
  const root = nativeRoot || deskBasePath;
  if (!root) return null;
  const filePath = subdir ? `${root}/${subdir}/${file.name}` : `${root}/${file.name}`;
  return { filePath, fileName: file.name, subdir };
}
