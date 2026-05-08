# Eval Case: 多窗口 Master 选举 + 引导弹窗
- 类型: feature
- 来源: v1.2.6
- 难度: hard
- 相关模块: TabManager, InterventionController, ModalManager

## 需求描述
实现多窗口 Master 选举机制和引导弹窗，解决多标签页/多窗口并行时的状态冲突。

## 成功标准
1. **Master 选举**：visible/focus 的窗口成为 Master
2. **心跳机制**：Master 每 3 秒写心跳，非 Master 每 3 秒检查，8 秒无心跳自动接管
3. **引导弹窗触发**：检测到不同类型窗口并存时触发
4. **引导弹窗内容**：显示所有窗口列表、30 秒倒计时、白名单快速添加
5. **倒计时结束**：默认分心窗口成为 Master
6. **用户选择**：保留本窗口 → 成为 Master；关闭本窗口 → 尝试 `window.close()`
7. **同类型不弹引导**：两个学习窗口或两个分心窗口并存时不触发
8. 浮窗正确显示 🟢 主窗口 / 🔵 副窗口 / ⏸️ 协商中状态

## 相关文件
- `bilibili-study-focus-assistant.user.js` — 全部多窗口相关逻辑
