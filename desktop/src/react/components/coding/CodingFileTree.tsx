/**
 * CodingFileTree — 编程模式文件浏览器侧栏
 *
 * 复用 DeskTree 渲染（保留 CR / 拖拽等所有原有能力），
 * 仅通过 onFileOpen 把"打开文件"行为重定向到 Monaco 编辑器，
 * 而不是默认的 PreviewPanel 预览。
 */

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../stores';
import { loadDeskTreeFiles } from '../../stores/desk-actions';
import { deskFileToEditorArgs } from '../../stores/editor-slice';
import { ContextMenu } from '../../ui';
import { DeskSearchBox, DeskFilterButton, DeskSortButton } from '../desk/DeskToolbar';
import { DeskTree, type InlineCreateKind, type InlineTreeEdit } from '../desk/DeskTree';
import { DeskDropZone } from '../desk/DeskDropZone';
import { DeskEmptyOverlay } from '../desk/DeskEmptyOverlay';
import type { DeskFile } from '../../types';
import {
  DESK_SORT_KEY,
  type CtxMenuState,
  type FileTypeFilter,
  type SortMode,
} from '../desk/desk-types';
import styles from './coding.module.css';
import s from '../desk/Desk.module.css';

const DESK_FILTER_KEY = 'hana-coding-type-filters';
const VALID_TYPE_FILTERS = new Set<FileTypeFilter>(['image', 'text', 'video']);

function normalizeSubdir(value: string): string {
  return (value || '').replace(/^\/+|\/+$/g, '');
}

function uniqueDraftName(baseName: string, files: Array<{ name: string }>): string {
  const existing = new Set(files.map(file => file.name));
  if (!existing.has(baseName)) return baseName;
  const dotIndex = baseName.lastIndexOf('.');
  const hasExtension = dotIndex > 0;
  const stem = hasExtension ? baseName.slice(0, dotIndex) : baseName;
  const ext = hasExtension ? baseName.slice(dotIndex) : '';
  let index = 2;
  while (existing.has(`${stem} ${index}${ext}`)) index += 1;
  return `${stem} ${index}${ext}`;
}

function getInitialTypeFilters(): FileTypeFilter[] {
  try {
    const raw = localStorage.getItem(DESK_FILTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FileTypeFilter => VALID_TYPE_FILTERS.has(item));
  } catch {
    return [];
  }
}

export function CodingFileTree() {
  const deskBasePath = useStore(s => s.deskBasePath);
  const deskWorkspaceMountId = useStore(s => s.deskWorkspaceMountId);
  const nativeRootDir = useStore(s => s.deskWorkspaceNativeRoot);
  const deskExpandedPaths = useStore(s => s.deskExpandedPaths);
  const deskTreeFilesByPath = useStore(s => s.deskTreeFilesByPath);
  const setDeskExpandedPaths = useStore(s => s.setDeskExpandedPaths);
  const setCodingFileTreeOpen = useStore(s => s.setCodingFileTreeOpen);
  const openFile = useStore(s => s.openFile);
  const setActiveTab = useStore(s => s.setActiveTab);

  const [sortMode, setSortMode] = useState<SortMode>(
    () => (localStorage.getItem(DESK_SORT_KEY) as SortMode) || 'mtime-desc',
  );
  const [typeFilters, setTypeFilters] = useState<FileTypeFilter[]>(getInitialTypeFilters);
  const [inlineEdit, setInlineEdit] = useState<InlineTreeEdit>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);

  const t = window.t ?? ((p: string) => p);

  // 编程模式首次挂载：加载根目录树
  useEffect(() => {
    if (!deskBasePath) return;
    void loadDeskTreeFiles('', { force: false });
  }, [deskBasePath]);

  const handleTypeFiltersChange = useCallback((filters: FileTypeFilter[]) => {
    localStorage.setItem(DESK_FILTER_KEY, JSON.stringify(filters));
    setTypeFilters(filters);
  }, []);

  const handleShowMenu = useCallback((state: CtxMenuState) => {
    setCtxMenu(state);
  }, []);

  const handleStartCreate = useCallback(async (parentSubdir: string, kind: InlineCreateKind) => {
    const normalizedParent = normalizeSubdir(parentSubdir);
    if (normalizedParent && !deskExpandedPaths.includes(normalizedParent)) {
      setDeskExpandedPaths([...deskExpandedPaths, normalizedParent]);
    }
    if (normalizedParent && !deskTreeFilesByPath[normalizedParent]) {
      await loadDeskTreeFiles(normalizedParent);
    }
    const latest = useStore.getState();
    const siblings = latest.deskTreeFilesByPath?.[normalizedParent]
      || (normalizedParent === '' ? latest.deskFiles : []);
    const baseName = kind === 'markdown'
      ? t('desk.newMarkdownFileName')
      : t('desk.newFolder');
    setInlineEdit({
      mode: 'create',
      parentSubdir: normalizedParent,
      kind,
      draftName: uniqueDraftName(baseName, siblings || []),
      content: '',
      phase: 'editing',
    });
  }, [deskExpandedPaths, deskTreeFilesByPath, setDeskExpandedPaths, t]);

  const handleFileOpen = useCallback(async (file: DeskFile, subdir: string) => {
    const args = deskFileToEditorArgs(file, subdir, deskBasePath, nativeRootDir);
    if (!args) return;
    const id = await openFile(args.filePath, args.fileName, args.subdir);
    if (id) setActiveTab(id);
  }, [deskBasePath, nativeRootDir, openFile, setActiveTab]);

  return (
    <>
      <aside
        className={styles.codingFileTree}
        data-coding-file-tree=""
        aria-label={t('coding.fileTree.title')}
      >
        <div className={styles.codingFileTreeHeader}>
          <span>{t('coding.fileTree.title')}</span>
          <button
            type="button"
            className={s.sortBtn}
            aria-label={t('coding.fileTree.collapse')}
            style={{ marginLeft: 'auto', padding: '2px 6px' }}
            onClick={() => setCodingFileTreeOpen(false)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
        <div className={styles.codingFileTreeBody}>
          <DeskDropZone
            onShowMenu={handleShowMenu}
            onStartCreate={handleStartCreate}
            framed={false}
            rightWorkspaceLayout={false}
          >
            <DeskSearchBox />
            <div className={s.toolbar}>
              <div className={s.toolbarActions}>
                <DeskFilterButton
                  filters={typeFilters}
                  onFiltersChange={handleTypeFiltersChange}
                  onShowMenu={handleShowMenu}
                />
                <DeskSortButton
                  sortMode={sortMode}
                  onSort={setSortMode}
                  onShowMenu={handleShowMenu}
                />
              </div>
            </div>
            <DeskTree
              sortMode={sortMode}
              typeFilters={typeFilters}
              onShowMenu={handleShowMenu}
              inlineEdit={inlineEdit}
              onInlineEditChange={setInlineEdit}
              onStartCreate={handleStartCreate}
              onFileOpen={handleFileOpen}
            />
            <DeskEmptyOverlay />
          </DeskDropZone>
        </div>
      </aside>
      {ctxMenu && (
        <ContextMenu
          items={ctxMenu.items}
          position={ctxMenu.position}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}