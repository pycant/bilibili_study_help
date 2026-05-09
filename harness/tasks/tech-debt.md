# 技术债清单

## 当前统计
- **文件总行数**: 8936 行（含尾部空行）
- **实际内容行数**: 8020 行（非空行）
- **IIFE 模块数**: 14 个
- **函数总数**: 407+ 个
- **最长 IIFE 模块**: DetailPanel — 1532 行
- **次长 IIFE 模块**: InterventionController — 1209 行
- **最长可验证函数**: `open()` (DetailPanel) — 169 行
- **console.* 调用**: 124 次
- **try-catch 块**: 46 个
- **innerHTML 赋值**: 38 处
- **addEventListener / removeEventListener**: 80 / 6 处

---

## P0 - 架构债
(无)

> 无 eval()/new Function() 使用；模块间通过明确的 IIFE 返回值接口通信，无循环依赖。

---

## P1 - 设计债

| # | 位置 | 描述 | 建议 | 状态 |
|---|------|------|------|------|
| 1 | `DetailPanel` (5362-6893) | 单模块 1532 行，承担面板渲染、事件绑定、主题管理、词汇学习界面等多重职责 | 按职责拆分为 PanelRenderer / VocabPanel / SettingsPanel 子模块 | ❌ 未开始 |
| 2 | `InterventionController` (7377-8585) | 单模块 1209 行，包含弹窗管理、视觉干预、计时逻辑、单词验证流水线 | 拆分出 ModalRenderer / ProgressiveTimer 独立模块 | ❌ 未开始 |
| 3 | `TabManager` (2820-3899) | 单模块 1080 行，包含 Master选举、心跳、多窗口检测、引导弹窗 | 分离 MasterElection / HeartbeatManager / GuideModal 子模块 | ❌ 未开始 |
| 4 | `saveSettings()` 第 6707 行 | 函数体 164 行，嵌套 HTML 模板+遍历逻辑，可读性差 | 将 HTML 生成抽离为纯函数，设定值拼接统一管理 | ✅ 已完成（2026-05-09 前已提前完成） |
| 5 | `open()` 第 5972 行 | 函数体 169 行，包含大量 DOM 创建+事件绑定+条件分支 | 拆分为 createPanelContent / bindPanelEvents / renderStatusSections | ✅ 已完成（2026-05-09） |
| 6 | `showConfirmModal()` 第 7939 行 | 函数体 166 行，HTML 模板+事件绑定+样式混合 | 提取为独立渲染函数，减少行内 HTML 字面量 | ✅ 已完成（2026-05-09） |
| 7 | `formatTime()` (4603, 5444) | `FloatingWindow` 和 `DetailPanel` 中各定义一次相同的 `formatTime(seconds)` | 提取到共享模块或全局 util 对象 | ✅ 已完成（2026-05-09） |
| 8 | 全局 | 42 个 try-catch 块，大量用 `console.error` 静默吞异常，无结构化错误上报 | 统一错误处理函数，区分可恢复/不可恢复错误并上报到 DebugTelemetry | ❌ 未开始 |
| 9 | `USER_CONFIG.interventionStages` 第 4395 行 | 硬编码的干预阶段配置（threshold/interval 数组），与 `getInterventionProfile` 中的 gentle/standard/strict 配置语义重叠 | 移除 `USER_CONFIG.interventionStages`，统一用 `getInterventionProfile` 配置体系 | ✅ 已完成（2026-05-09） |

---

## P2 - 代码债

| # | 位置 | 描述 | 建议 |
|---|------|------|------|
| 1 | `window.__bilibiliStudyAppState` (多处, 如 2758-2784) | 全局变量挂在 `window` 上作为状态总线，多个模块直接读写 | 改用 BroadcastChannel + StorageManager 的统一状态订阅模式 |
| 2 | `unsafeWindow.__bilibiliStudyDebugTelemetry` (4183) | 调试对象直接暴露到 `unsafeWindow`，可能被页面脚本改写 | 使用 Tampermonkey `@grant unsafeWindow` 隔离 |
| 3 | `refreshVocabDisplay()` (5539) 和 `handleResetVocabBtn()` (5505) | 两处实现几乎相同的 DOM 刷新逻辑（`temp.innerHTML = renderModule3()` 替换） | 抽取公共方法 `_replaceModuleContent(moduleId, renderFn, bindFn)` |
| 4 | `renderModule3()` (5659) / `renderModule6()` (5863) | 102+89 行的大型 HTML 模板字面量，难以维护 | 拆分为小组件函数，或使用模板编译预处理 |
| 5 | 第 8567 行 | 魔法数字表达式：`newStage === 2 ? 300 : newStage === 3 ? 600 : 1200` | 提取为命名常量映射 `POPUP_COOLDOWN: { 2: 300, 3: 600, 4: 1200 }` |
| 6 | 第 3141 行 | 硬编码 `1000`（毫秒）：`if (Date.now() - master.heartbeat > 1000)` | 定义为 `const HEARTBEAT_TOLERANCE_MS = 1000` |
| 7 | 多处 | 31 处 `innerHTML` 赋值，存在 XSS 风险（尤其动态字符串拼接处如 `renderModule3`） | 优先使用 `textContent` + `createElement`，或对动态字符串做 `escapeHtml` 转义 |
| 8 | 第 4603、5444 行 | 两处相同的 `if (seconds >= 3600)` 分支逻辑（`formatTime` 中） | 相同逻辑已在两个模块中重复定义，建议统一 |
| 9 | 第 2943、3178、3191 行 | `let changed = false`、`let count = 0` 此类可变变量在函数内用于累加 | 可改用 `Array.reduce` 或纯函数方式减少可变状态 |
| 10 | 多处 | 68 个 `addEventListener` 但仅 4 个 `removeEventListener`，浮窗/弹窗销毁时可能内存泄漏 | 在 `destroy()` / `close()` 中清理已注册的事件监听器 |
| 11 | `_mainTimerLogCounter` (8713) | 主循环用计数器实现节流日志，约 30 秒输出一次 | 引入简单的时间戳节流函数 `throttleLog(fn, interval)` |

---

## P3 - 文档债

| # | 位置 | 描述 | 建议 |
|---|------|------|------|
| 1 | `InterventionController` (7377-8585) | 1209 行模块，仅 `showWordVerifierModal` / `renderWordModalContent` 有 JSDoc 注释，其余函数缺少说明 | 为 `check` / `getCurrentStage` / `reset` 等核心接口补充 JSDoc |
| 2 | `showAggressiveIntervention()` (约 7842) | 该函数涉及全屏遮罩+自动跳转等关键用户阻断行为，缺少行为文档 | 添加注释说明触发条件、倒计时结束后行为、以及如何用户退出 |
| 3 | `bindSettingsTabEvents()` (6545) | 162 行函数，内部嵌套大量事件绑定+DOM 操作，无任何段注释 | 添加分区注释，按 Settings Tab 分组说明 |
| 4 | `handleWordSubmit()` (8288) | 120 行函数，涉及单词校验、渐进揭示、掌握度更新完整流程，缺少流程注释 | 添加分步注释说明"输入校验→答案比对→揭示新字母→掌握度更新"流程 |

---

## 本次迭代已清偿

- P3-5: 文件头部 `@version` 已从 1.2.7 更新至 1.4.0（脚本头部行 5）
