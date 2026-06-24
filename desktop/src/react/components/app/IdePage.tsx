/**
 * IdePage — IDE 模式主页面（编辑器 + AI 聊天并列）
 *
 * 布局：
 *   ┌──────────┬─────────────────────────────┐
 *   │          │ resize-handle (chat↔editor) │
 *   │ ChatPage ├─────────────────────────────┤
 *   │          │   PreviewPanel              │
 *   │ (chat)   │   (CodeMirror 文件编辑器)   │
 *   └──────────┴─────────────────────────────┘
 *   ├──────────────────────────────────────┤
 *   │ JianEditor (指令编辑器)              │
 *   └──────────────────────────────────────┘
 *
 * 复用 ChatPage / PreviewPanel / JianEditor（已有组件，不重写）。
 * 左侧 ChatSidebar 由 App.tsx 层全局渲染（session 列表 + 文件树）。
 * WorkspaceCompanionRail 也由 AppPages 层渲染（AI 副驾驶 Agent 活动面板）。
 */

import { ChatPage } from './ChatPage';
import { JianEditor } from '../desk/DeskEditor';
import { useStore } from '../../stores';

const tr = (key: string, vars?: Record<string, string | number>) => window.t?.(key, vars) ?? key;

export function IdePage() {
  // 订阅 locale（驱动子树重渲染）— 与 ChatPage 行为一致
  useStore(s => s.locale);

  return (
    <div className="ide-page">
      <div className="ide-editor-split">
        {/* 左侧：AI 聊天（复用 ChatPage） */}
        <div className="ide-chat-pane">
          <ChatPage />
        </div>

        {/* 中间：可拖动分隔条（永久可见） */}
        <div
          className="resize-handle resize-handle-vertical"
          id="chatEditorResizeHandle"
          role="separator"
          aria-orientation="vertical"
          aria-label={tr('ide.resizeSplit', { defaultValue: '拖动调整聊天与编辑器宽度' })}
        />

        {/* 右侧：文件编辑器（PreviewPanel 由 AppPages 层全局渲染，本页只放 chat pane 与分隔条；编辑器复用布局外层） */}
        {/* 中央编辑器由 AppPages 中的 PreviewPanel 渲染 —— 这里只负责 chat↔resize split */}
      </div>

      {/* 底部：指令编辑器（保留 JianEditor，max-height 35%） */}
      <div className="ide-instructions">
        <JianEditor showHeader />
      </div>
    </div>
  );
}