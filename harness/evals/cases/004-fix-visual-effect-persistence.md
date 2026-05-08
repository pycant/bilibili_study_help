# Eval Case: 修复色彩翻转效果不继承
- 类型: bugfix
- 来源: v1.2.4
- 难度: medium
- 相关模块: GlobalStateManager, InterventionController

## 问题描述
多窗口播放/关闭后重新打开时，干预状态（currentStage）虽从 localStorage 继承，但 CSS 视觉效果（色彩翻转、灰度）未恢复。

## 成功标准
1. `GlobalStateManager.init()` 后根据持久化的 `currentStage` 调用 `applyVisualIntervention()` 恢复 CSS
2. 页面重新打开时，视觉干预效果与持久化状态一致
3. 各干预等级（温和/标准/严格）对应的效果正确应用

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `GlobalStateManager.init()`, `applyVisualIntervention()`
