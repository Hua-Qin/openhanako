/**
 * CodingPage — 编程模式主页面（四栏布局的核心两栏）
 *
 * 第一栏（ChatSidebar）和第四栏（WorkspaceCompanionRail）由 App.tsx / AppPages.tsx 框架固定渲染。
 * 本组件只渲染中间区域：第二栏（编辑器）+ 第三栏（AI 聊天）。
 */

import { useEffect } from 'react';
import { useStore } from '../../stores';
import { CodingFileTree } from '../coding/CodingFileTree';
import { EditorTabBar } from '../coding/EditorTabBar';
import { MonacoEditorPane } from '../coding/MonacoEditorPane';
import { ChatArea } from '../chat/ChatArea';
import { InputArea } from '../InputArea';
import { RegionalErrorBoundary } from '../RegionalErrorBoundary';
import styles from '../coding/coding.module.css';

const tr = (key: string, vars?: Record<string, string | number>): string => {
  return (window.t ?? ((p: string, _vars?: Record<string, string | number>) => p))(key, vars);
};

export function CodingPage() {
  const codingFileTreeOpen = useStore(s => s.codingFileTreeOpen);
  const setCodingFileTreeOpen = useStore(s => s.setCodingFileTreeOpen);
  const currentSessionPath = useStore(s => s.currentSessionPath);

  // 编程模式自动展开右侧工作区栏
  useEffect(() => {
    const s = useStore.getState();
    if (!s.jianOpen) {
      // 保留用户偏好：若用户曾主动关闭，则不强制打开
      const savedRight = localStorage.getItem('hana-jian');
      if (savedRight !== 'closed') {
        useStore.setState({ jianOpen: true, jianAutoCollapsed: false });
      }
    }
  }, []);

  return (
    <div className={styles.codingPage} data-coding-page="">
      {/* 第二栏：代码编辑器（含文件树侧栏、标签栏、Monaco 编辑器） */}
      <div className={styles.codingEditorColumn}>
        {codingFileTreeOpen && (
          <RegionalErrorBoundary region="coding-file-tree" resetKeys={[currentSessionPath]}>
            <CodingFileTree />
          </RegionalErrorBoundary>
        )}

        <div className={styles.codingEditorMain}>
          <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 0 }}>
            {!codingFileTreeOpen && (
              <button
                type="button"
                onClick={() => setCodingFileTreeOpen(true)}
                title={tr('coding.fileTree.expand')}
                aria-label={tr('coding.fileTree.expand')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  minHeight: 36,
                  border: 'none',
                  background: 'var(--coding-filetree-bg, #fafafa)',
                  color: 'var(--text-color-secondary, #888)',
                  cursor: 'pointer',
                  borderRight: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                  borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.08))',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <EditorTabBar />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <RegionalErrorBoundary region="coding-editor" resetKeys={[currentSessionPath]}>
              <MonacoEditorPane />
            </RegionalErrorBoundary>
          </div>
        </div>
      </div>

      {/* 第三栏：AI 聊天区 */}
      <div className={styles.codingChatColumn}>
        <div className={styles.codingChatHeader}>
          {tr('coding.chat.title')}
        </div>
        <div className={styles.codingChatBody}>
          <RegionalErrorBoundary region="coding-chat" resetKeys={[currentSessionPath]}>
            <ChatArea />
          </RegionalErrorBoundary>
          <RegionalErrorBoundary
            region="coding-input"
            resetKeys={[currentSessionPath]}
          >
            <InputArea key={currentSessionPath || '__new'} surface="desktop" />
          </RegionalErrorBoundary>
        </div>
      </div>
    </div>
  );
}