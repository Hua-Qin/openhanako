/**
 * EditorTabs — 编程模式编辑器标签页
 *
 * 复用 preview store 的 openTabs / activeTabId / previewItems 数据。
 * 单击切换激活，双击或点 X 关闭。
 */

import { useStore } from '../../stores';
import { selectPreviewItems, selectActiveTabId } from '../../stores/preview-slice';
import { setActiveTab, closeTab } from '../../stores/preview-actions';

export function EditorTabs() {
  const openTabs = useStore(s => s.openTabs);
  const activeTabId = useStore(selectActiveTabId);
  const previewItems = useStore(selectPreviewItems);

  if (openTabs.length === 0) return null;

  return (
    <div className="editor-tabs" role="tablist">
      {openTabs.map(tabId => {
        const item = previewItems.find(a => a.id === tabId);
        if (!item) return null;
        const active = tabId === activeTabId;
        return (
          <div
            key={tabId}
            className={`editor-tab${active ? ' active' : ''}`}
            role="tab"
            aria-selected={active}
            title={item.title}
            onClick={() => setActiveTab(tabId)}
            onDoubleClick={() => closeTab(tabId)}
          >
            <span className="editor-tab-name">{item.title}</span>
            <button
              className="editor-tab-close"
              type="button"
              aria-label="Close tab"
              onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}