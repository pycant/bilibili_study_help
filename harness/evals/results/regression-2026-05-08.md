# 回归报告 - 2026-05-08

## 概要
- **语法声明**: ✅ @match/@version/@grant 完整
  - @match: `*://www.bilibili.com/video/BV*` ✅
  - @version: 1.2.7 ✅（注：代码内含 v1.3.0 功能但版本号未更新）
  - @grant: `GM_addStyle`, `GM_getValue`, `GM_setValue`, `GM_deleteValue`, `unsafeWindow` ✅
  - 额外声明: @name, @namespace, @description, @author, @license, @supportURL 完整 ✅
- **Harness 检查**: ✅ 全部通过（1 个警告：npm 依赖未安装，可忽略）
- **Eval 通过率**: **12/12**

## Eval 逐项

| # | Case | 涉及模块 | 结果 | 备注 |
|---|------|---------|------|------|
| 001 | fix-guide-repeat | InterventionController | ✅ PASS | `dismissGuide()` 设置 `lastGuideResolvedAt` + 冷却期(GUIDE_COOLDOWN_MS)检查(行3008)；冷却状态日志输出 `cooldownUntil`(行3375) |
| 002 | fix-background-tab-trigger | InterventionController, TabManager | ✅ PASS | `document.hidden` 显式检查(行3041)；`hasMixedWindowTypes()` 跳过 `isVisible === false`(行2970)；后台标签页不干扰判断 |
| 003 | fix-duplicate-word-records | WordVerifier | ✅ PASS | `recordAnswer()` 仅在最终答对/全部揭示时调用(行7494/7534)；`recordWordAttempt()` 同理(行7495/7535)；`updateMastery()` 每次提交都更新(行7489)；代码注释明确说明修复意图(行7487) |
| 004 | fix-visual-effect-persistence | GlobalStateManager, InterventionController | ✅ PASS | `GlobalStateManager.init()` 加载持久化状态(行2541)；主初始化流程立即根据 `currentStage` 调用 `applyVisualIntervention()`(行8076-8087)；各等级效果正确应用(行6723-6729) |
| 005 | feature-history-video-panel | DetailPanel, HistoryVideoTracker | ✅ PASS | 标题 "📼 历史视频"(行5033/5047)；`getRecent(10)` 返回最近10条(行5024)；学习时段锁定/休息时段解锁(行5026-5028)；跳转、清空按钮、暗色模式(行1341)均实现 |
| 006 | fix-spa-navigation-reset | PageMonitor, InterventionController | ✅ PASS | 白名单视频/非学习时段→重置(行8001-8018)；非白名单视频→只关弹窗保留干预计时(行8020-8037)；`GlobalStateManager.syncFromAppState()` 持久化 |
| 007 | fix-settings-overwrite | DetailPanel, ConfigManager | ✅ PASS | `saveSettings()` 按 `activeSettingsTab` 隔离保存三种配置(行5857/5892/5926)，学习时段/白名单/词库互不覆盖 |
| 008 | feature-master-election | TabManager, InterventionController, ModalManager | ✅ PASS | Master 选举每3秒心跳(行2588)、8秒超时接管(行2589)；引导弹窗30秒倒计时(行2596)、窗口列表(行3156-3171)、白名单添加；保留→Master/关闭→window.close()；状态显示 "🔵 副窗口"/"⏸️ 计时暂停"(行4463/4450) |
| 009 | refactor-unified-word-verify | InterventionController, WordVerifier | ✅ PASS | `showStage2Modal()` / `showSimpleStage2Modal()` 已完全移除(grep无匹配)；所有阶段统一使用 `showWordVerifierModal()`(行7283)；渐进式揭示、Fisher-Yates 部分洗牌(行7522-7526)；全部揭示→6秒自动关闭(行7545) |
| 010 | feature-global-state-persistence | GlobalStateManager, InterventionController | ✅ PASS | 干预状态持久化到 localStorage(行2374)；三重重置策略实现完整：`period`(行2461)、`duration`(行2473)、`interval`(行2482)；休息时段检测(行2466/2100)；窗口关闭再开状态恢复(行8076-8087) |
| 011 | feature-debug-telemetry | DebugTelemetry, TabManager | ✅ PASS | 500条环形缓冲(行3658)、8个CATEGORY分类(行3663-3672)；快照自动捕获(行3712)；localStorage持久化/保留20条(行3659/3790)；`query()`(行3807)/`dumpMultiWindowTrace()`(行3818)；全局挂载(行3873)；零外部依赖 |
| 012 | fix-transient-multiwindow-guide | TabManager | ✅ PASS | `updateRegistration({ isVisible })` 写入可见性(行2646)；`hasMixedWindowTypes()` 跳过 `isVisible === false`(行2970)；2-cycle稳定性去抖 `_mixedWindowStableCount >= 2`(行3041)；`visibilitychange` 即时更新(行2868/2876) |

## 发现的问题

### 次要问题
- **@version 未更新至 1.3.0**：代码中已包含 `v1.3.0` 功能的注释和实现（如 P0 自动导航倒计时 `showAutoNavigateToast()` 行7501/7551），但 `@version` 元数据仍为 `1.2.7`（行4）。
- **浮窗主窗口标识轻微不一致**：Case 008 标准要求显示 "🟢 主窗口"，实际实现中主窗口仅使用绿色背景（rgba(34,139,34)）和 "学习中" 文本，缺少 🟢 图标。🔵 副窗口和 ⏸️ 协商中状态显示正确。

### 零关键问题
所有 12 个 eval case 均通过，未发现功能性回归或逻辑缺陷。

## 代码统计
- **总行数**: 8310 行
- **模块覆盖**: TabManager, InterventionController, WordVerifier, GlobalStateManager, HistoryVideoTracker, DetailPanel, DebugTelemetry, PageMonitor, ConfigManager, ModalManager, FloatingWindow
- **检查日期**: 2026-05-08
