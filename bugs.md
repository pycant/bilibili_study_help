# B站学习专注提醒助手 - Bug 记录

## 待修复的 Bug

### 1. ✅ 已修复 - 在学习提醒中选择视频课程选项后点击返回学习无反应

**根因**：内联 onclick 中使用了单引号字符串包裹 `${course.name}`，导致模板字符串变量未求值；按钮使用了 `disabled` 属性，导致 `addEventListener` 绑定的 click 事件无法触发。

**修复**：移除内联 onclick，改用 `data-*` 属性 + 事件委托；移除 disabled，改用 `opacity: 0.5; cursor: not-allowed` 样式。

**代码位置**：`showConfirmModal()` (约第 2330-2470 行)

---

### 2. ✅ 已修复 - 学习提醒没有暗色模式适配

**根因**：`applyTheme()` 函数只对统计详情面板（modalElement）应用 `bilibili-study-dark-mode` class，三个干预弹窗（确认弹窗、Stage2 弹窗、单词验证弹窗）在创建时未应用该 class。

**修复**：
1. 创建辅助函数 `applyCurrentThemeToModal(el)`，获取当前主题并添加/移除 dark-mode class
2. 在所有弹窗创建后调用该函数
3. 修复单词验证弹窗提示文字的暗色模式颜色（移除 inline style，改用 CSS class 控制）

**代码位置**：
- `applyCurrentThemeToModal()` (约第 2233 行)
- `showConfirmModal()` (约第 2418 行)
- `showStage2Modal()` (约第 2569 行)
- `showSimpleStage2Modal()` (约第 2693 行)
- `showWordVerifierModal()` (约第 2730 行)

---

### 3. ✅ 已修复 - 在全屏模式中没有学习提醒弹窗

**根因**：B站播放器使用 Fullscreen API 全屏时，`document.body` 中 `z-index` 再高也无法覆盖在全屏元素之上。弹窗需要挂载到全屏元素内部才能显示。

**修复**：创建 `getModalContainer()` 函数，检测当前是否有全屏元素，返回全屏元素（若有）或 `document.body`（若没有）。所有干预弹窗改用 `getModalContainer().appendChild(modal)` 替代 `document.body.appendChild(modal)`。

**代码位置**：`getModalContainer()` (约第 2247 行)，所有弹窗的 append 逻辑
