# Eval Case: 修复后台标签页误触发多窗口引导
- 类型: bugfix
- 来源: v1.2.6.1
- 难度: medium
- 相关模块: InterventionController, TabManager

## 问题描述
用户只有前台一个窗口在看视频，但后台标签页的心跳还在更新，`hasMixedWindowTypes()` 误判为混合类型，触发引导弹窗。

## 成功标准
1. 当前窗口在后台（`document.hidden`）时不触发多窗口引导
2. 后台标签页的心跳信息不干扰多窗口类型判断
3. 只有当前窗口可见时才执行完整的引导逻辑

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `hasMixedWindowTypes()`, 多窗口检测
