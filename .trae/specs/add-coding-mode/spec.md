# 编程模式（Coding Mode）功能规格

## Why

openhanako 当前仅支持"聊天"和"频道"两种核心模式，缺少代码编辑能力。应用已具备三栏布局（左：会话列表，中：聊天/预览，右：工作台文件浏览器），但中间区域的文件编辑能力仅在 PreviewPanel 侧边弹出时可用。需要在顶部新增"编程"模式，使中间区域成为专职的代码编辑器，同时保留 AI 对话能力。

## What Changes

- 在顶部导航栏 `AppTitlebar` 中新增"聊天 / 编程"模式切换按钮组
- 扩展 `TabType` 类型，新增 `'code'` 作为第二个核心功能模式
- 创建 `CodePage` 组件作为编程模式中间区域：上方编辑器（复用 PreviewEditor + preview store 数据），下方 AI 对话区
- 左右两侧现有功能（会话列表、工作台文件浏览器）完全保留不变
- 从右侧工作台双击文件 → 现有 `openPreview` 机制 → CodePage 编辑器区域显示文件

## Impact

- **Affected code**:
  - [types.ts](file:///c:/Users/Administrator/Desktop/IDE/openhanako-main/desktop/src/react/types.ts) — TabType 扩展
  - [AppTitlebar.tsx](file:///c:/Users/Administrator/Desktop/IDE/openhanako-main/desktop/src/react/components/app/AppTitlebar.tsx) — 模式切换 UI
  - [AppPages.tsx](file:///c:/Users/Administrator/Desktop/IDE/openhanako-main/desktop/src/react/components/app/AppPages.tsx) — 编程模式页面路由
  - 新建 `CodePage.tsx` — 编程模式主页面
  - 新建 `EditorTabs.tsx` — 编辑器标签页（复用 preview store 的 openTabs/activeTabId）
  - [styles.css](file:///c:/Users/Administrator/Desktop/IDE/openhanako-main/desktop/src/styles.css) — 布局样式
  - [zh.json](file:///c:/Users/Administrator/Desktop/IDE/openhanako-main/desktop/src/locales/zh.json) 等 — i18n

## ADDED Requirements

### Requirement: 模式切换机制

系统 SHALL 在顶部导航栏提供"聊天"和"编程"两个模式切换按钮。

#### Scenario: 切换到编程模式
- **WHEN** 用户点击"编程"模式按钮
- **THEN** 中间区域切换为代码编辑器布局（上方编辑器 + 下方 AI 对话）
- **AND** 左侧会话列表和右侧工作台保持不变

#### Scenario: 切换回聊天模式
- **WHEN** 用户点击"聊天"模式按钮
- **THEN** 界面恢复为原有聊天界面
- **AND** 原有聊天功能不受任何影响

### Requirement: 编程模式中间区域

系统 SHALL 在编程模式下将中间区域分为编辑器区域和 AI 对话区域。

#### Scenario: 编辑器区域
- **WHEN** 用户从右侧工作台双击文件
- **THEN** 文件内容加载到中间编辑器区域（通过现有 openPreview 机制）
- **AND** 编辑器自动识别文件类型并应用对应语法高亮
- **AND** 编辑器顶部显示已打开文件的标签页

#### Scenario: AI 对话区域
- **WHEN** 编程模式下底部输入区
- **THEN** 保留 AI 对话输入能力
- **AND** AI 回复正常显示

#### Scenario: 空状态
- **WHEN** 编程模式下未打开任何文件
- **THEN** 编辑器区域显示提示信息（引导用户从右侧工作台打开文件）

### Requirement: 文件在线编辑

系统 SHALL 复用现有 PreviewEditor 组件和 preview store 数据实现文件编辑。

#### Scenario: 编辑文件
- **WHEN** 用户在编辑器中修改文件内容
- **THEN** 修改自动保存到磁盘（复用 PreviewEditor autosave 机制）

#### Scenario: 多文件标签页
- **WHEN** 用户打开多个文件
- **THEN** 编辑器顶部显示文件标签页（复用 preview store 的 openTabs/activeTabId）
- **AND** 支持切换和关闭标签页

## MODIFIED Requirements

### Requirement: TabType 类型扩展

原有定义：
```typescript
export type TabType = 'chat' | 'channels' | `plugin:${string}`;
```

修改为：
```typescript
export type TabType = 'chat' | 'code' | 'channels' | `plugin:${string}`;
```

### Requirement: AppTitlebar 导航栏增强

在 AppTitlebar 中新增模式切换按钮组，包含"聊天"和"编程"两个按钮。

### Requirement: AppPages 页面路由

在 AppPages 中添加 `{currentTab === 'code' && <CodePage />}` 条件渲染。编程模式下不渲染 PreviewPanel（编辑器已集成在 CodePage 中）。
