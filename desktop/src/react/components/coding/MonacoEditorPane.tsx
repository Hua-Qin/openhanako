/**
 * MonacoEditorPane — Monaco 编辑器主面板
 *
 * 监听 editor-slice.activeTabId，渲染对应文件的 Monaco 编辑器。
 * 支持 Ctrl/Cmd+S 保存、视图状态（光标/滚动/折叠）持久化、脏状态跟踪。
 */

import { useCallback, useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as monacoNs from 'monaco-editor';
import { useStore } from '../../stores';
import styles from './coding.module.css';

// 不调用 loader.config()，让 @monaco-editor/react 自动从 npm 包加载本地 monaco-editor。
// 注释：loader.config({ monaco: undefined }) 会导致它回退到 CDN 加载（破坏离线场景）。

interface MonacoEditorPaneProps {
  /** 可选主题（默认 vs） */
  theme?: 'vs' | 'vs-dark' | 'hc-black';
}

export function MonacoEditorPane({ theme = 'vs' }: MonacoEditorPaneProps) {
  const activeTabId = useStore(s => s.activeTabId);
  const tabs = useStore(s => s.openTabs);
  const updateContent = useStore(s => s.updateContent);
  const saveTab = useStore(s => s.saveTab);

  const activeTab = tabs.find(t => t.id === activeTabId) || null;
  const editorRef = useRef<monacoNs.editor.IStandaloneCodeEditor | null>(null);
  const saveRef = useRef(saveTab);

  // 保留最新的 store action 引用，供 monaco 回调（命令、cursor 监听）调用，
  // 避免 useCallback 重建闭包导致 listener 引用过期。
  useEffect(() => { saveRef.current = saveTab; }, [saveTab]);

  const handleMount: OnMount = useCallback((editor, _monaco) => {
    editorRef.current = editor;
    // 注册保存命令（Ctrl/Cmd+S）
    editor.addCommand(_monaco.KeyMod.CtrlCmd | _monaco.KeyCode.KeyS, () => {
      const tabId = useStore.getState().activeTabId;
      if (!tabId) return;
      void saveRef.current(tabId);
    });

    // 监听视图状态变化（光标/滚动/折叠），存储到 slice
    editor.onDidChangeCursorPosition(() => {
      const tabId = useStore.getState().activeTabId;
      if (!tabId) return;
      const viewState = editor.saveViewState();
      useStore.getState().updateViewState(tabId, viewState);
    });
  }, []);

  // 切换 tab 时恢复视图状态
  useEffect(() => {
    if (!editorRef.current || !activeTab) return;
    if (activeTab.viewState) {
      try {
        editorRef.current.restoreViewState(activeTab.viewState as monacoNs.editor.ICodeEditorViewState);
      } catch (err) {
        console.warn('[MonacoEditorPane] restoreViewState failed', err);
      }
    }
    editorRef.current.focus();
  }, [activeTab?.id, activeTab?.viewState]); // eslint-disable-line react-hooks/exhaustive-deps

  // 切到没有 tab 的状态：卸载编辑器
  useEffect(() => {
    if (!activeTab && editorRef.current) {
      editorRef.current.dispose();
      editorRef.current = null;
    }
  }, [activeTab]);

  if (!activeTab) {
    return (
      <div className={styles.empty} data-coding-editor-empty="">
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <div className={styles.emptyTitle}>
          {(window.t ?? ((p: string) => p))('coding.editor.emptyTitle')}
        </div>
        <div className={styles.emptyHint}>
          {(window.t ?? ((p: string) => p))('coding.editor.emptyHint')}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorWrap} data-coding-editor-wrap="">
      <Editor
        key={activeTab.id}
        value={activeTab.content}
        language={activeTab.language}
        theme={theme}
        onMount={handleMount}
        onChange={(value) => {
          const tabId = useStore.getState().activeTabId;
          if (!tabId) return;
          updateContent(tabId, value ?? '');
        }}
        options={{
          fontSize: 13,
          fontFamily: 'var(--code-font-family, "SF Mono", "Cascadia Code", "JetBrains Mono", Consolas, monospace)',
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: 'selection',
          tabSize: 2,
          wordWrap: 'off',
          automaticLayout: true,
          fixedOverflowWidgets: true,
          bracketPairColorization: { enabled: true },
          guides: { indentation: true, bracketPairs: true },
          formatOnPaste: false,
          formatOnType: false,
          renderLineHighlight: 'all',
          padding: { top: 12, bottom: 12 },
        }}
        loading={
          <div className={styles.loading}>
            {(window.t ?? ((p: string) => p))('coding.editor.loading')}
          </div>
        }
      />
    </div>
  );
}
