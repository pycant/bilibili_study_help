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
├── bilibili-study-focus-assistant.user.js    # 主脚本（~3100+行 IIFE 模块化）
├── bilibili-study-focus-assistant.test.js    # 属性测试
├── AGENTS.md                                 # ← 本文件：Agent 简报
├── CHANGELOG.md                              # 完整版本历史
├── SCRIPT_LOGIC.md                           # 脚本运行逻辑详解
├── design-spec-v1.3.0.md                     # v1.3.0 设计规范
├── design-spec-v1.3.0-multiwindow.md         # 多窗口设计规范
├── bugs.md                                   # Bug 记录
├── bug-analysis.md / bug_fix_plan.md 等      # 分析文档
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
- **运行测试**: `npm test`（需先 `npm install`）
- **本地提交**: `git add -A && git commit -m "vX.Y.Z: 改动说明"`

## 核心架构（IIFE 模块化）
| 模块 | 行号范围 | 职责 |
|------|----------|------|
| STYLES | 19–575 | 全局 CSS |
| USER_CONFIG | 590–643 | 默认配置 |
| ConfigManager | 648–857 | 配置管理 |
| StorageManager | 862–929 | 存储封装 |
| PageMonitor | 997–1102 | URL/BV 监控 |
| FloatingWindow | 1107–1360 | 悬浮窗 |
| DetailPanel | 1365–1920 | 统计面板 |
| WordVerifier | 1925–2061 | 单词验证 |
| StatisticsTracker | 2066–2202 | 时间统计 |
| InterventionController | 2207–2982 | 核心状态机 |
| Main IIFE | 2987–3134 | 入口/主循环 |

## 关键约定
- `__bilibiliStudyAppState` 为全局状态对象
- `bilibiliStudyAssistant_*` 为 localStorage 键前缀
- CSS class 统一使用 `bilibili-study-` 前缀
- 所有 UI 必须暗色模式适配（`.bilibili-study-dark-mode`）
- 版本号格式：`vX.Y.Z`（主版本.次版本.补丁），小修复用 `vX.Y.Z.Z`

## 当前版本
v1.2.6.1 — 多窗口 Master 选举 + 引导弹窗（见 CHANGELOG.md）

## 后续路线
- v1.2.6.2+：多窗口引导弹窗重复 / toast 逻辑异常修復
- v1.3.0：P0 自动跳转 + P2 三级干预整合
