# 当前任务 — v1.2.6.2 DebugTelemetry + 瞬态Bug修复
- 状态: 进行中
- 创建: 2026-05-08
- 目标: 搭建轻量级可观测性系统 + 修复多窗口瞬态弹窗Bug

## 已完成
- [x] AGENTS.md — 项目简报
- [x] harness/scripts/init.sh — 环境初始化
- [x] harness/scripts/check.sh — 统一检查入口
- [x] harness/evals/cases/ — 11 个评估用例
- [x] harness/tasks/active.md — 任务跟踪
- [x] DebugTelemetry 模块 — 三层可观测性系统
- [x] hasMixedWindowTypes Bug修复 — isVisible过滤 + 2-cycle稳定性
- [x] Telemetry 日志埋点 — TabManager关键路径

## 下一步
- [ ] 使用 DebugTelemetry.dumpMultiWindowTrace() 检查真实运行效果
- [ ] 在控制台验证：window.__bilibiliStudyDebugTelemetry

## 已知风险
- 评估用例目前是 Markdown 描述，无自动化验证脚本（后续可加 grader）
