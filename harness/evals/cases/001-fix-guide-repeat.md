# Eval Case: 修复引导弹窗重复弹出
- 类型: bugfix
- 来源: v1.2.6.1
- 难度: medium
- 相关模块: InterventionController

## 问题描述
用户点击"保留本窗口"后，引导弹窗关闭又立刻重新弹出。

## 成功标准
1. 用户做出选择（保留/关闭）后，弹窗在冷却期（60秒）内不再弹出
2. 冷却期结束后，若多窗口条件仍满足，可再次弹出
3. 日志输出 `lastGuideResolvedAt` 冷却状态
4. 不影响正常的单窗口计时

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `dismissGuide()`, 多窗口检测逻辑
