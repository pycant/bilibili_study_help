# Eval Case: 全局干预状态持久化
- 类型: feature
- 来源: v1.2.3
- 难度: hard
- 相关模块: GlobalStateManager, InterventionController

## 需求描述
将干预状态从窗口内存迁移到 localStorage，实现跨窗口状态持久化。

## 成功标准
1. 干预状态（currentStage/distractionStartTime/isStudying）持久化到 `bilibiliStudy_globalState`
2. 三重重置策略可选：
   - `period`（默认）：每个学习时段结束重置
   - `duration`：累计学习满 X 分钟后重置（默认 30 分钟）
   - `interval`：距上次活动超过 X 分钟后重置（默认 30 分钟）
3. 休息时段检测：学习时段之间的间隙不干预、不重置
4. 关窗口再开时，干预状态从上一次继续

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `GlobalStateManager`, `InterventionController`
