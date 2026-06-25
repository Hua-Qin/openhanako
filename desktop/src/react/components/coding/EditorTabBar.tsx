/**
 * EditorTabBar — 编辑器标签栏
 *
 * 显示已打开的文件标签。支持切换、关闭（dirty 时确认），
 * 提供"关闭其他/全部已保存"等批量操作。
 */

import { useCallback, useMemo, useState } from 'react';
import { useStore } from '../../stores';
import { ContextMenu, type ContextMenuItem } from '../../ui';
import styles from './coding.module.css';

interface MenuState {
  items: ContextMenuItem[];
  position: { x: number; y: number };
}

export function EditorTabBar() {
  const openTabs = useStore(s => s.openTabs);
  const activeTabId = useStore(s => s.activeTabId);
  const setActiveTab = useStore(s => s.setActiveTab);
  const closeTab = useStore(s => s.closeTab);
  const closeAllSaved = useStore(s => s.closeAllSaved);
  const saveTab = useStore(s => s.saveTab);
  const [menu, setMenu] = useState<MenuState | null>(null);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    void closeTab(tabId);
  }, [closeTab]);

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;
    const items: ContextMenuItem[] = [
      { label: '保存', disabled: !tab.dirty, action: () => void saveTab(tabId) },
      { label: '关闭', action: () => void closeTab(tabId) },
      {
        label: '关闭其他',
        action: async () => {
          for (const other of openTabs) {
            if (other.id !== tabId) {
              const ok = await closeTab(other.id);
              if (!ok) break; // 取消（用户拒绝 dirty 关闭）
            }
          }
        },
      },
      {
        label: '关闭所有已保存',
        disabled: !openTabs.some(t => !t.dirty),
        action: () => closeAllSaved(),
      },
    ];
    setMenu({
      items,
      position: { x: e.clientX, y: e.clientY },
    });
  }, [openTabs, closeTab, closeAllSaved, saveTab]);

  // 当只有一个或没有 tab 时不渲染滚动条占位
  const hasTabs = openTabs.length > 0;
  const tabList = useMemo(() => openTabs, [openTabs]);

  if (!hasTabs) {
    return (
      <div className={styles.tabBar} data-coding-tabbar="" data-empty="true">
        <div className={styles.empty} style={{ flexDirection: 'row', gap: 8, padding: '0 12px' }}>
          <span style={{ fontSize: 12 }}>
            {(window.t ?? ((p: string) => p))('coding.editor.tabbarEmpty')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tabBar} data-coding-tabbar="">
        {openTabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const cls = `${styles.tab}${isActive ? ` ${styles.tabActive}` : ''}`;
          return (
            <button
              key={tab.id}
              type="button"
              className={cls}
              data-coding-tab=""
              data-tab-id={tab.id}
              data-active={isActive ? 'true' : 'false'}
              title={tab.filePath}
              onClick={() => handleTabClick(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
            >
              <span className={styles.tabName}>{tab.fileName}</span>
              {tab.dirty && <span className={styles.tabDirtyDot} aria-label="dirty" />}
              <span
                className={styles.tabClose}
                role="button"
                aria-label="close"
                onClick={(e) => handleTabClose(e, tab.id)}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </span>
            </button>
          );
        })}
      </div>
      {menu && <ContextMenu items={menu.items} position={menu.position} onClose={() => setMenu(null)} />}
    </>
  );
}