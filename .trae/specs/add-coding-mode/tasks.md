# Tasks

## 阶段一：类型与 i18n 基础设施

- [x] Task 1: 扩展 TabType 类型并添加 i18n 键
  - [x] SubTask 1.1: 在 `desktop/src/react/types.ts` 中将 `TabType` 扩展为 `'chat' | 'code' | 'channels' | \`plugin:${string}\``
  - [x] SubTask 1.2: 在所有 locale 文件（zh.json、en.json、ja.json、ko.json、zh-TW.json）中添加编程模式 i18n 键

## 阶段二：模式切换 UI

- [x] Task 2: 在 AppTitlebar 中实现"聊天/编程"模式切换按钮组
  - [x] SubTask 2.1: 在 `AppTitlebar.tsx` 的 `tb-left-group` 之后新增模式切换按钮组（`tb-mode-switch`）
  - [x] SubTask 2.2: 按钮组读取 `useStore(s => s.currentTab)` 判断当前模式，点击调用 `setCurrentTab`
  - [x] SubTask 2.3: 在 `styles.css` 中添加 `.tb-mode-switch` 样式

## 阶段三：编辑器标签页组件

- [x] Task 3: 创建 EditorTabs 组件（复用 preview store 数据）
  - [x] SubTask 3.1: 创建 `desktop/src/react/components/code/EditorTabs.tsx`
  - [x] SubTask 3.2: 渲染标签页列表，单击切换，双击/X 关闭
  - [x] SubTask 3.3: 无标签页时返回 null

## 阶段四：编程模式主页面

- [x] Task 4: 创建 CodePage 组件
  - [x] SubTask 4.1: 创建 `desktop/src/react/components/app/CodePage.tsx`
  - [x] SubTask 4.2: 编辑器区域 + 空状态提示
  - [x] SubTask 4.3: AI 对话区域（InputArea + ChatArea）
  - [x] SubTask 4.4: 从 preview store 读取 activeTabId 对应的 previewItem

## 阶段五：页面路由集成

- [x] Task 5: 在 AppPages 中集成编程模式
  - [x] SubTask 5.1: 添加 `{currentTab === 'code' && <CodePage />}`
  - [x] SubTask 5.2: PreviewPanel 改为 `{currentTab !== 'code' && <PreviewPanel />}`
  - [x] SubTask 5.3: WorkspaceCompanionRail 保持不变（始终渲染）

## 阶段六：样式

- [x] Task 6: 添加编程模式布局样式
  - [x] SubTask 6.1: `.code-page` 布局样式
  - [x] SubTask 6.2: `.code-editor-area` 样式
  - [x] SubTask 6.3: `.code-empty-state` 空状态样式
  - [x] SubTask 6.4: `.code-ai-area` AI 对话区域样式

## 阶段七：验证

- [x] Task 7: 全面验证功能完整性
  - [x] SubTask 7.1: 所有文件零 TypeScript 诊断错误
  - [x] SubTask 7.2: 代码审查确认数据流正确（工作台 → openPreview → previewItems → CodePage 编辑器）
  - [x] SubTask 7.3: 标签页管理复用 preview store（openTabs/activeTabId/closeTab/setActiveTab）
  - [x] SubTask 7.4: AI 对话复用 ChatArea + InputArea，与聊天模式共享 session 数据

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 3
- Task 5 depends on Task 4
- Task 6 depends on Task 5
- Task 7 depends on Task 6
