# 项目状态速览

> 最后更新：2026-05-09 | 版本：v1.4.1 | 代码行：8936

---

## 一、当前 Harness 组件 (82% 完成)

| 组件 | 状态 | 说明 |
|------|------|------|
| `check.sh` | ✅ | 统一检查入口，7道串联 |
| `eval-check.sh` | ✅ | 12/12 PASS |
| `integration-check.sh` | ✅ | CSS一致性+暗色适配+行号 |
| `lint-modules.sh` | ✅ | 模块依赖方向检查 |
| `health-report.sh` | ✅ | JSON输出，供Dashboard消费 |
| `.harness-shared-interfaces.md` | ✅ | 多Agent共享接口定义 |
| `docs/` | ✅ | 12个设计文档已移入 + README |
| **Generator-Evaluator 分离** | ✅ **实验通过** | 第一轮验证成功 |

### 未完成

| 缺口 | 优先级 | 说明 |
|------|--------|------|
| 架构语义 linter | P0 | 目前 `lint-modules.sh` 只能查模式匹配，不能检查「应该用 A 而不是 B」的语义约束 |
| health-report → Telemetry Dashboard 动态接入 | P1 | JSON已有但数字还是硬编码的 |
| 自动化失败模式采集 | P2 | Agent 卡死/超时→自动写 JSON 到 `harness/evals/failures/` |
| 自动化 Skill 更新 | P2 | Meta Agent 读取失败模式 → 自动更新 SKILL.md |
| npm test 回归 | P3 | `package.json` 配了 Jest 但从未跑过 |

---

## 二、技术债 (P1/P2/P3)

来源：`docs/bug-analysis.md`、`docs/bugs.md`、`harness/tasks/tech-debt.md`

### P1 — 设计债（模块过大）

| # | 模块 | 行数 | 描述 | 影响 |
|---|------|------|------|------|
| 1 | `DetailPanel` | ~1531 | 面板渲染+事件绑定+主题+词汇=4职责揉一起 | 修改其中一个功能可能影响其他三个 |
| 2 | `InterventionController` | ~1209 | 弹窗+视觉干预+计时+单词验证揉一起 | 代码量最大的模块，变更风险高 |
| 3 | `TabManager` | ~1080 | Master选举+心跳+多窗口检测+引导弹窗揉一起 | 多窗口逻辑与引导弹窗耦合 |
| 4-9 | 各处 | — | 重复函数`formatTime`、42个try-catch吞异常、硬编码魔法数字 | 见 `harness/tasks/tech-debt.md` P1-4~9 |

### P2 — 代码债

| # | 问题 | 严重 | 说明 |
|---|------|------|------|
| 1 | `__bilibiliStudyAppState` 多处直接读写 | 🟡 | 刚修了5处但还有。根因分析见 `docs/bug-analysis.md` |
| 2 | addEventListener 80个 / removeEventListener 6个 | 🟡 | 内存泄漏风险，弹窗销毁时未清理监听器 |
| 3 | innerHTML 38处 | 🟡 | XSS 风险，尤其动态字符串拼接 |
| 4 | 多处硬编码魔法数字 | 🟢 | 1000、300、600 等数字散落各处 |

### P3 — 文档债

| # | 问题 | 说明 |
|---|------|------|
| 1 | 技术债行号已修正 | ✅ 本轮完成 |
| 2 | docs/ 有4个候选删除文件 | 见 `docs/CLEANUP_CANDIDATES.md` |
| 3 | CHANGELOG 已去重 | ✅ 本轮完成 |

---

## 三、插件功能路线图

来源：`AGENTS.md`、`docs/design-spec-v1.3.0.md`

### 已实现

| 版本 | 功能 | 状态 |
|------|------|------|
| v1.2.6.2 | DebugTelemetry + 多窗口瞬态修复 | ✅ |
| v1.2.7 | BroadcastChannel 多窗口同步 + BV记忆 | ✅ |
| v1.3.0 | P0自动导航 + P2三级干预 + Stage动态化 | ✅ |
| v1.3.1 | 内联样式修复 + 暗色适配补全 | ✅ |
| v1.4.0 | Telemetry Dashboard (Logs/Metrics/Traces) | ✅ |
| v1.4.1 | 浮动窗重构 + 11指标 + 用户操作追踪 + Harness升级 | ✅ |

### 待实现

| 功能 | 类型 | 参考 |
|------|------|------|
| 架构语义 linter | Harness | P0 |
| Generator-Evaluator 正式推广 | 工作流 | P0 |
| DetailPanel 模块拆分 (1531行→3个) | 重构 | `tech-debt.md` P1-1 |
| InterventionController 模块拆分 (1209行) | 重构 | `tech-debt.md` P1-2 |
| TabManager 模块拆分 (1080行) | 重构 | `tech-debt.md` P1-3 |
| 统一错误处理 (46个try-catch) | 重构 | `tech-debt.md` P1-8 |
| 事件监听器清理 (80→6的差距) | Bug预防 | `tech-debt.md` P2-10 |
| 学习激励系统 (时长统计+成就) | 新功能 | 远期 |
| 数据可视化 (趋势图+专注度分析) | 新功能 | 远期 |

---

## 四、已知 Bug / 异常

| Bug | 状态 | 来源 |
|-----|------|------|
| `autoNavigate is not defined` | ✅ 已修 | v1.4.0 设置面板崩溃 |
| CSS class 名不一致 (float vs float-window) | ✅ 已修 | v1.4.1 浮动窗白板 |
| integration-check 假阳性96个 | 🟡 剩余 | ID/动画名/动态class（非致命） |
| 暗色模式缺失68处 | 🟡 待确认 | 部分可能是误报 |

---

## 五、关键引用文件

| 文件 | 内容 |
|------|------|
| `harness/tasks/tech-debt.md` | 完整技术债清单（P1-9、P2-11、P3-5） |
| `harness/tasks/active.md` | 当前迭代的任务跟踪 |
| `docs/CLEANUP_CANDIDATES.md` | 候选删除的文档 |
| `docs/MAINTENANCE_LOG.md` | 每日维护日志 |
| `docs/bug-analysis.md` | Bug 根因分析记录 |
| `docs/bugs.md` | Bug 汇总 |
| `docs/design-spec-v1.3.0.md` | 核心设计规范 |
| `docs/design-spec-v1.3.0-multiwindow.md` | 多窗口设计规范 |
| `.harness-shared-interfaces.md` | 多Agent共享接口定义 |
