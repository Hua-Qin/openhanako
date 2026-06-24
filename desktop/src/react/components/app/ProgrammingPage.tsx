/**
 * ProgrammingPage — 编程模式主页面
 *
 * 布局：
 *   ┌─ 中央工作台（DeskSection 文件树 + JianEditor 指令编辑器）┐
 *   │   复用已有的 DeskSection / JianEditor 组件，full-width 模式 │
 *   │   若未设置工作台路径，显示 DeskEmptyOverlay 引导          │
 *   └────────────────────────────────────────────────────────┘
 *
 * 右侧 AI 副驾驶（WorkspaceCompanionRail + ChatArea + InputArea）
 * 由 AppPages 层全局渲染，无需在此重复。
 */

import { useStore } from '../../stores';
import { DeskSection } from '../DeskSection';
import { JianEditor } from '../desk/DeskEditor';
import { DeskEmptyOverlay } from '../desk/DeskEmptyOverlay';

const tr = (key: string, vars?: Record<string, string | number>) => window.t?.(key, vars) ?? key;

function ProgrammingEmpty() {
  return (
    <div className="programming-empty">
      <div className="programming-empty-card">
        <div className="programming-empty-icon" aria-hidden="true">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
            <line x1="14" y1="4" x2="10" y2="20" />
          </svg>
        </div>
        <div className="programming-empty-title">{tr('desk.programmingWelcomeTitle', { defaultValue: '编程工作区' })}</div>
        <div className="programming-empty-hint">{tr('desk.programmingWelcomeHint', { defaultValue: '在右上角选择一个工作台文件夹，或在下方指令编辑器中输入需求让 AI 帮你搭建。' })}</div>
      </div>
    </div>
  );
}

export function ProgrammingPage() {
  const deskBasePath = useStore(s => s.deskBasePath);
  const selectedFolder = useStore(s => s.selectedFolder);
  const deskFiles = useStore(s => s.deskFiles);
  const deskWorkspaceMountId = useStore(s => s.deskWorkspaceMountId);
  const hasWorkspace = !!deskWorkspaceMountId || !!(deskBasePath || selectedFolder) || deskFiles.length > 0;

  return (
    <div className="programming-page">
      <div className="programming-workspace">
        {hasWorkspace ? (
          <DeskSection
            framed={false}
            showHeader={true}
            rightWorkspaceLayout={false}
            fullWidthMode
          />
        ) : (
          <>
            <DeskEmptyOverlay />
            <ProgrammingEmpty />
          </>
        )}
      </div>
      <div className="programming-instructions">
        <JianEditor showHeader={true} />
      </div>
    </div>
  );
}