import { useEffect, useState } from 'react';
import type { ActivePanel } from '../../types';
import { useStore } from '../../stores';
import { useAnyBrowserRunning } from '../../stores/browser-slice';
import { ChannelListSidebar } from '../channels/ChannelList';
import { RegionalErrorBoundary } from '../RegionalErrorBoundary';
import { SessionList } from '../SessionList';
import { SidebarNoticeSlot } from '../notices/SidebarNoticeSlot';
import { DeskSection } from '../DeskSection';

interface ChatSidebarContentProps {
  showSettingsButton?: boolean;
  showActivityBars?: boolean;
  onNewSession: () => void;
  onCollapse: () => void;
  onOpenSettings?: () => void;
  onTogglePanel?: (panel: ActivePanel) => void;
  region?: string;
}

interface ChatSidebarProps extends ChatSidebarContentProps {
  open: boolean;
  includeChannels?: boolean;
}

function AutomationBadge() {
  const count = useStore(s => s.automationCount);
  return <span className="automation-count-badge">{count > 0 ? String(count) : ''}</span>;
}

function BridgeDot() {
  const connected = useStore(s => s.bridgeDotConnected);
  return <span className={`sidebar-bridge-dot${connected ? ' connected' : ''}`}></span>;
}

export function ChatSidebarContent({
  showSettingsButton = true,
  showActivityBars = true,
  onNewSession,
  onCollapse,
  onOpenSettings,
  onTogglePanel,
  region = 'sidebar',
}: ChatSidebarContentProps) {
  const currentAgentId = useStore(s => s.currentAgentId);
  const browserRunning = useAnyBrowserRunning();
  const t = window.t ?? ((p: string) => p);

  return (
    <>
      <div className="sidebar-header">
        <span className="sidebar-title">{t('sidebar.title')}</span>
        <div className="sidebar-header-actions">
          <button className="sidebar-action-btn" title={t('sidebar.newChat')} onClick={onNewSession}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          {showSettingsButton && (
            <button className="sidebar-action-btn" title={t('settings.title')} onClick={onOpenSettings}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          )}
          <button className="sidebar-action-btn" title={t('sidebar.collapse')} onClick={onCollapse}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 6 9 12 15 18"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {showActivityBars && (
        <>
          <button className="sidebar-activity-bar sidebar-bridge-card" onClick={() => onTogglePanel?.('bridge')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>{t('sidebar.bridgeShort')}</span>
            <BridgeDot />
          </button>
          <button className="sidebar-activity-bar" onClick={() => onTogglePanel?.('activity')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span>{t('sidebar.activity')}</span>
          </button>
          <button className="sidebar-activity-bar" onClick={() => onTogglePanel?.('automation')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{t('automation.title')}</span>
            <AutomationBadge />
          </button>
          <button className="sidebar-activity-bar" onClick={() => onTogglePanel?.('skills')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <span>{t('skills.panel.title')}</span>
          </button>
          <button className={`sidebar-activity-bar browser-bg-bar${browserRunning ? '' : ' hidden'}`} title={t('browser.backgroundHint')} onClick={() => window.platform?.openBrowserViewer?.()}>
            <svg className="browser-bg-globe" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>{t('browser.background')}</span>
          </button>
        </>
      )}

      <div className="session-list">
        <RegionalErrorBoundary region={region} resetKeys={[currentAgentId]}>
          <SessionList />
        </RegionalErrorBoundary>
        <SidebarNoticeSlot />
      </div>
    </>
  );
}

// ── IDE 模式：Chats / Files 分段控件（仅在 currentTab === 'ide' 时启用） ──

type SidebarMode = 'chats' | 'files';

function readSidebarMode(tab: string): SidebarMode {
  try {
    const v = localStorage.getItem(`hana-sidebar-mode-${tab}`);
    return v === 'files' ? 'files' : 'chats';
  } catch {
    return 'chats';
  }
}

function writeSidebarMode(tab: string, mode: SidebarMode): void {
  try {
    localStorage.setItem(`hana-sidebar-mode-${tab}`, mode);
  } catch {
    /* ignore */
  }
}

function SegmentIcon({ kind }: { kind: SidebarMode }) {
  // 极简的内联图标（不依赖外部 SVG 库）
  if (kind === 'chats') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function SidebarSegmented({
  mode,
  onChange,
}: {
  mode: SidebarMode;
  onChange: (m: SidebarMode) => void;
}) {
  const t = window.t ?? ((k: string) => k);
  return (
    <div className="sidebar-segmented" role="tablist">
      <button
        type="button"
        className={mode === 'chats' ? 'active' : ''}
        role="tab"
        aria-selected={mode === 'chats'}
        onClick={() => onChange('chats')}
      >
        <SegmentIcon kind="chats" />
        <span style={{ marginLeft: 4 }}>{t('sidebar.chatsTab', { defaultValue: '会话' })}</span>
      </button>
      <button
        type="button"
        className={mode === 'files' ? 'active' : ''}
        role="tab"
        aria-selected={mode === 'files'}
        onClick={() => onChange('files')}
      >
        <SegmentIcon kind="files" />
        <span style={{ marginLeft: 4 }}>{t('sidebar.filesTab', { defaultValue: '文件' })}</span>
      </button>
    </div>
  );
}

export function ChatSidebar({
  open,
  includeChannels = true,
  ...contentProps
}: ChatSidebarProps) {
  const currentTab = useStore(s => s.currentTab);
  const isIdeMode = currentTab === 'ide';
  const [ideSidebarMode, setIdeSidebarMode] = useState<SidebarMode>(() =>
    readSidebarMode('ide')
  );

  // 当切换 Tab 时重置到该 Tab 上次保存的模式
  useEffect(() => {
    if (isIdeMode) setIdeSidebarMode(readSidebarMode('ide'));
  }, [currentTab, isIdeMode]);

  const handleIdeModeChange = (m: SidebarMode) => {
    setIdeSidebarMode(m);
    writeSidebarMode('ide', m);
  };

  return (
    <aside className={`sidebar${open ? '' : ' collapsed'}`} id="sidebar">
      <div className="sidebar-inner">
        <div className={`sidebar-chat-content${currentTab === 'chat' || currentTab === 'ide' ? '' : ' hidden'}`}>
          {isIdeMode && <SidebarSegmented mode={ideSidebarMode} onChange={handleIdeModeChange} />}
          {isIdeMode && ideSidebarMode === 'files' ? (
            <div className="sidebar-files">
              <DeskSection
                framed={false}
                showHeader={true}
                rightWorkspaceLayout={false}
                fullWidthMode={false}
              />
            </div>
          ) : (
            <ChatSidebarContent {...contentProps} />
          )}
        </div>

        {includeChannels && (
          <div className={`sidebar-channel-content${currentTab === 'channels' ? '' : ' hidden'}`}>
            <ChannelListSidebar />
          </div>
        )}
      </div>
      <div className="resize-handle resize-handle-right" id="sidebarResizeHandle"></div>
    </aside>
  );
}
