# Eval Case: DebugTelemetry 可观测性系统
- 类型: feature
- 来源: v1.2.6.2
- 难度: medium
- 相关模块: DebugTelemetry, TabManager

## 需求描述
构建轻量级可观测性系统，用于捕获瞬态 Bug 的关键上下文，灵感来自 OpenAI 的 Harness Engineering 可观测性原则。

## 成功标准
1. **事件日志**：环形缓冲保留最近 500 条事件，按分类（STATE/MULTI_TAB/INTERVENTION/TIMING/ERROR/PERF/USER_ACTION/SNAPSHOT）标记
2. **状态快照**：关键事件（触发引导/关闭引导/mixed状态变化）自动捕获注册表快照
3. **localStorage 持久化**：快照保存到 `bilibiliStudy_telemetry`，保留最近 20 条
4. **查询能力**：`query()`, `dumpMultiWindowTrace()` 可按条件筛选事件
5. **控制台调试**：`window.__bilibiliStudyDebugTelemetry` 可全局访问
6. **零外部依赖**：纯 localStorage + 内存实现

## 相关文件
- `bilibili-study-focus-assistant.user.js` — DebugTelemetry 模块 + TabManager 中的埋点
