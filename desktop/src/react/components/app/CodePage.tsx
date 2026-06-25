/**
 * CodePage — 编程模式主页面
 *
 * 三栏布局的中间区域：上方编辑器 + 下方 AI 对话。
 * 编辑器复用 PreviewEditor + preview store 数据。
 * 从右侧工作台双击文件 → openPreview 机制 → 编辑器加载。
 */

import { useCallback } from 'react';
import { useStore } from '../../stores';
import { selectPreviewItems, selectActiveTabId } from '../../stores/preview-slice';
import { upsertPreviewItem } from '../../stores/preview-actions';
import { EditorTabs } from '../code/EditorTabs';
import { PreviewEditor } from '../PreviewEditor';
import { InputArea } from '../InputArea';
import { ChatArea } from '../chat/ChatArea';
import { RegionalErrorBoundary } from '../RegionalErrorBoundary';
import type { PreviewItem } from '../../types';

declare function t(key: string, vars?: Record<string, string | number>): string;

/** 判断 previewItem 是否可编辑 */
function isEditable(item: PreviewItem | null): boolean {
  if (!item) return false;
  if (item.status === 'missing') return false;
  return ['markdown', 'code', 'csv'].includes(item.type) && !!item.filePath;
}

/** 根据文件类型获取编辑器模式 */
function getEditorMode(item: PreviewItem): 'markdown' | 'code' | 'csv' | 'text' {
  if (item.type === 'markdown') return 'markdown';
  if (item.type === 'csv') return 'csv';
  return 'code';
}

function EditorArea() {
  const activeTabId = useStore(selectActiveTabId);
  const previewItems = useStore(selectPreviewItems);
  const previewItem = previewItems.find(a => a.id === activeTabId) ?? null;
  const editable = isEditable(previewItem);

  const handleContentChange = useCallback((content: string, fileVersion?: PreviewItem['fileVersion']) => {
    if (!previewItem) return;
    upsertPreviewItem({
      ...previewItem,
      content,
      fileVersion: fileVersion === undefined ? previewItem.fileVersion : fileVersion,
    });
  }, [previewItem]);

  if (!previewItem) {
    return (
      <div className="code-empty-state">
        <div className="code-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <p className="code-empty-text">{t('code.noFileOpen')}</p>
        <p className="code-empty-hint">{t('code.openFileHint')}</p>
      </div>
    );
  }

  return (
    <div className="code-editor-content">
      {editable ? (
        <PreviewEditor
          content={previewItem.content}
          filePath={previewItem.filePath}
          fileVersion={previewItem.fileVersion ?? null}
          mode={getEditorMode(previewItem)}
          language={previewItem.language}
          onContentChange={handleContentChange}
        />
      ) : (
        <div className="code-editor-readonly">
          <pre className="code-readonly-pre">{previewItem.content}</pre>
        </div>
      )}
    </div>
  );
}

export function CodePage() {
  const currentSessionPath = useStore(s => s.currentSessionPath);

  return (
    <div className="code-page">
      <div className="code-editor-area">
        <EditorTabs />
        <RegionalErrorBoundary region="code-editor" resetKeys={[currentSessionPath]}>
          <EditorArea />
        </RegionalErrorBoundary>
      </div>
      <div className="code-ai-area">
        <RegionalErrorBoundary region="code-chat">
          <ChatArea />
        </RegionalErrorBoundary>
        <div className="code-input-area">
          <InputArea key={currentSessionPath || '__new'} surface="desktop" />
        </div>
      </div>
    </div>
  );
}
