# 当前任务 — Harness MVP 构建
- 状态: 进行中
- 创建: 2026-05-08
- 目标: 搭建最小 Harness 闭环

## 已完成
- [x] AGENTS.md — 项目简报
- [x] harness/scripts/init.sh — 环境初始化
- [x] harness/scripts/check.sh — 统一检查入口
- [x] harness/evals/cases/ — 10 个评估用例（从历史任务提炼）
- [x] harness/tasks/active.md — 任务跟踪

## 下一步
- [ ] 运行 check.sh 验证
- [ ] 蒸馏 harness-builder Skill
- [ ] 使用 skill 自我改进

## 已知风险
- 评估用例目前是 Markdown 描述，无自动化验证脚本（后续可加 grader）
