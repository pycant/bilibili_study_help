# B站学习专注提醒助手 — Agent 简报

## 项目目标
一个 Tampermonkey 油猴脚本，在 B 站视频页面提供渐进式、非侵入性的学习专注干预。
核心解决「学习启动难、易被视频分心」痛点。

## 技术栈
- JavaScript (ES6+) — 单一 `.user.js` 文件
- Tampermonkey API（`GM_addStyle`, `GM_getValue`, `GM_setValue`, `GM_deleteValue`）
- CSS3（含暗色模式）
- localStorage / sessionStorage
- Jest + fast-check（属性测试）

## 项目结构
```
f:\all_proj\study_help_web_app\
├── bilibili-study-focus-assistant.user.js    # 主脚本（~8936行 IIFE 模块化）
├── bilibili-study-focus-assistant.test.js    # 属性测试
├── AGENTS.md                                 # ← 本文件：Agent 简报
├── CHANGELOG.md                              # 完整版本历史
├── SCRIPT_LOGIC.md                           # 脚本运行逻辑详解
├── docs/                                     # 设计文档 + 维护报告目录
│   ├── design-spec-v1.3.0.md                 # v1.3.0 设计规范
│   ├── design-spec-v1.3.0-multiwindow.md     # 多窗口设计规范
│   ├── bugs.md                               # Bug 记录
│   ├── bug-analysis.md / bug_fix_plan.md 等  # 分析文档
│   ├── CLEANUP_CANDIDATES.md                 # 候选删除文件报告（自动生成）
│   └── MAINTENANCE_LOG.md                    # 维护日志
├── package.json                              # 测试依赖
├── harness/                                  # Agent 开发 Harness
│   ├── scripts/                              # 构建/检查脚本
│   ├── evals/                                # 评估集
│   └── tasks/                                # 任务跟踪
└── .workbuddy/                               # WorkBuddy 工作记忆
    ├── SOUL.md / IDENTITY.md / USER.md
    └── memory/
```

## 标准命令
- **环境初始化**: `bash harness/scripts/init.sh`
- **运行检查**: `bash harness/scripts/check.sh`
- **集成验证**: `bash harness/scripts/integration-check.sh`
- **Eval 自动检查**: `bash harness/scripts/eval-check.sh`
- **运行测试**: `npm test`（需先 `npm install`）
- **本地提交**: `git add -A && git commit -m "vX.Y.Z: 改动说明"`

## 重要：多 Agent 并行开发时必须读的文件
| 文件 | 用途 |
|------|------|
| `.harness-shared-interfaces.md` | **所有 Agent 开工前必须读**。定义 CSS class 命名空间、API 签名、模块边界 |
| `AGENTS.md`（本文件） | 项目简报：技术栈、结构、模块行号 |
| `.workbuddy/skills/bilibili-dev-conventions/SKILL.md` | 项目级编码规范 Skill |

> **并行开发前 Orchestrator 必须做的事**：
> 1. 确认 `.harness-shared-interfaces.md` 已更新到最新
> 2. 创建独立分支：`feat/agent-a`, `feat/agent-b`, ...
> 3. 每个 Agent 的提示词开头写：先读 `.harness-shared-interfaces.md` + 加载 bilibili-dev-conventions Skill
> 4. 合并后跑集成验证：`bash harness/scripts/integration-check.sh`

## 核心架构（IIFE 模块化）
| 模块 | 行号范围 | 职责 |
|------|----------|------|
| STYLES | 20–2016 | 全局 CSS |
| USER_CONFIG | 2025–2202 | 默认配置 |
| ConfigManager | 2205–2612 | 配置管理 |
| GlobalStateManager | 2619–2813 | 全局状态持久化 |
| TabManager | 2820–3899 | 多窗口 Master + BroadcastChannel |
| DebugTelemetry | 3906–4222 | 可观测性系统 |
| HistoryVideoTracker | 4229–4311 | 离开视频记录 |
| StorageManager | 4313–4380 | 存储封装 |
| PageMonitor | 4449–4562 | URL/BV 监控 |
| FloatingWindow | 4567–4843 | 悬浮窗 |
| TelemetryUI | 4846–5357 | 调试面板 UI |
| DetailPanel | 5362–6893 | 统计面板 |
| WordVerifier | 6898–7089 | 单词验证 |
| StatisticsTracker | 7094–7230 | 时间统计 |
| ModalManager | 7234–7372 | 弹窗层级管理 |
| InterventionController | 7377–8585 | 核心状态机 |
| Main IIFE | 8588–8924 | 入口/主循环 |

## 关键约定
- `__bilibiliStudyAppState` 为全局状态对象
- `bilibiliStudyAssistant_*` 为 localStorage 键前缀
- CSS class 统一使用 `bilibili-study-` 前缀
- 所有 UI 必须暗色模式适配（`.bilibili-study-dark-mode`）
- 版本号格式：`vX.Y.Z`（主版本.次版本.补丁），小修复用 `vX.Y.Z.Z`

## 当前版本
v1.4.1 — Telemetry Dashboard 浮动窗 + 11指标 + 用户操作追踪（见 CHANGELOG.md）

## 后续路线
- ✅ v1.2.6.2：DebugTelemetry + 多窗口瞬态修复
- ✅ v1.2.7：BroadcastChannel + 多窗口同步 + BV记忆
- ✅ v1.3.0：P0自动导航 + P2三级阻拦 + Stage动态化
- ✅ v1.3.1：内联样式修复 + 暗色适配补全
- ✅ v1.4.0：Telemetry Dashboard（Logs/Metrics/Traces）
- ✅ v1.4.1：浮动窗重构 + 用户操作追踪
- ✅ 下一轮：Eval自动化 + 集成验证 + Harness升级（2026-05-08 完成）
- 🔲 待定：后续功能/修复
