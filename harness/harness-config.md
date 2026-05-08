# Harness 配置

## 概述
本项目的 Harness 遵循 **Agent = Model + Harness** 范式，为 AI Agent 提供结构化的开发环境。

## 架构一览
```
Context Eng     → AGENTS.md, docs/, .workbuddy/  (信息供给)
Constraint Eng  → scripts/, harness/  (行为约束)
Feedback Eng    → evals/  (反馈闭环)
```

## 组件清单

| 组件 | 路径 | 功能 |
|------|------|------|
| **项目简报** | `AGENTS.md` | Agent 导航和项目上下文 |
| **初始化脚本** | `harness/scripts/init.sh` | 环境准备 |
| **检查脚本** | `harness/scripts/check.sh` | 统一验证入口 |
| **评估集** | `harness/evals/cases/` | 12 个代表性任务 |
| **任务跟踪** | `harness/tasks/` | 当前进度管理 |
| **工作记忆** | `.workbuddy/memory/` | 跨会话上下文 |
| **主脚本** | `bilibili-study-focus-assistant.user.js` | 交付物 |
| **DebugTelemetry** | 内嵌于主脚本 | 可观测性系统 |

## 评估集使用
```bash
# 每次修改 Harness 后，手动遍历评估用例：
ls harness/evals/cases/
# 逐一检查相关模块是否满足成功标准
```

## 演进日志
| 日期 | 变更 | 原因 |
|------|------|------|
| 2026-05-08 | 初始 MVP | Harness 构建第一条记录 |
| 2026-05-08 | v1.2.6.2 同步 | Eval 集扩充至 12 个，新增 DebugTelemetry 组件 |
