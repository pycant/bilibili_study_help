# Eval Case: 修复 SPA 导航导致干预状态重置
- 类型: bugfix
- 来源: v1.0.7
- 难度: hard
- 相关模块: PageMonitor, InterventionController

## 问题描述
用户在分心期间切换非白名单视频（SPA 路由变化），`observeSPAChanges` 回调无条件重置所有干预状态，导致干预计时从零开始，永远累积不到 Stage 2 弹窗。

## 成功标准
1. 切到白名单视频或非学习时段 → 重置干预状态
2. 切到非白名单视频 → 保留干预状态，只关闭当前弹窗
3. 干预计时延续而非从零开始

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `observeSPAChanges()`, 路由变化回调
