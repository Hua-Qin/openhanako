# 编程模式（Coding Mode）验证清单

## 类型与 i18n
- [x] `TabType` 类型已扩展，包含 `'code'` 选项
- [x] 所有 locale 文件已添加编程模式相关 i18n 键

## 模式切换 UI
- [x] AppTitlebar 中显示"聊天"和"编程"两个模式切换按钮
- [x] 当前模式按钮高亮显示（`.tb-mode-btn.active`）
- [x] 点击按钮正确切换模式（调用 `setCurrentTab`）
- [x] 模式切换按钮样式与现有 titlebar 按钮风格一致

## 编辑器区域
- [x] 编程模式中间区域显示编辑器（上方）和 AI 对话（下方）
- [x] 从右侧工作台双击文件，文件在编辑器中打开（复用 openPreview 机制）
- [x] 编辑器根据文件类型自动选择语法高亮（PreviewEditor mode 分流）
- [x] 编辑内容自动保存到磁盘（PreviewEditor autosave）
- [x] 多文件标签页可正常切换和关闭（EditorTabs 复用 preview store）
- [x] 无文件时显示空状态提示

## 三栏布局保留
- [x] 左侧会话列表在编程模式下正常显示（ChatSidebar 未修改）
- [x] 右侧工作台文件浏览器在编程模式下正常显示（WorkspaceCompanionRail 始终渲染）
- [x] 两侧行栏折叠/展开功能正常（未修改相关逻辑）

## AI 协同
- [x] 编程模式底部保留 AI 对话输入区（InputArea）
- [x] 可以在编程模式下向 AI 发送消息并收到回复（ChatArea 共享 session）

## 向后兼容
- [x] 原有聊天模式功能完全不受影响（currentTab='chat' 时渲染 ChatPage）
- [x] 原有频道模式功能完全不受影响（currentTab='channels' 时渲染 ChannelPage）
- [x] 原有 PreviewPanel 在非编程模式下正常工作（currentTab !== 'code' 时渲染）
