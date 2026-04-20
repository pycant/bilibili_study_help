# 设计规格文档：阶段一（v1.3.0）— P0 自动导航 + P2 三级渐进式阻拦

> **目标**：降低回归成本 + 渐进式干预，同时为后续 P1/P3/P4/P5/P6 预留架构扩展性

---

## 一、现有架构分析

### 模块依赖关系

```
主定时器 (1s loop)
  ├─ PageMonitor          → URL检测/BV号提取/页面可见性/SPA导航监听
  ├─ ConfigManager        → 配置加载/保存/白名单操作/学习时段判断
  ├─ StatisticsTracker    → 学习时间/分心时间/单词正确率统计
  ├─ FloatingWindow       → 浮窗创建/拖拽/状态更新
  ├─ InterventionController → 核心干预逻辑
  │    ├─ check()         → 每秒检测，判断是否分心+阶段升阶
  │    ├─ showConfirmModal()    → Stage 0: 确认弹窗
  │    ├─ showWordVerifierModal() → Stage 2+: 单词验证弹窗
  │    ├─ applyVisualIntervention() → 视觉效果(CSS class)
  │    └─ returnToLearning()    → 跳转白名单视频
  ├─ WordVerifier         → 单词选择/验证/掌握度
  └─ DetailPanel          → 详情面板/主题管理/设置面板
```

### 核心状态

```javascript
// window.__bilibiliStudyAppState (行4377-4383)
{
    tabId: string,
    currentStage: 0,            // 0-4 干预阶段
    distractionStartTime: null, // 分心起始时间戳
    isStudying: true,           // 是否学习中
    lastDistractionCount: 0
}
```

### 现有阶段配置 (行1078-1084)

| Stage | 阈值 | 弹窗间隔 | 行为 |
|-------|------|---------|------|
| 0 | 0s | - | 确认弹窗（showConfirmModal） |
| 1 | 60s | - | 仅视觉效果（渐进灰度+反色） |
| 2 | 180s | 60s | 视觉 + 单词弹窗 |
| 3 | 600s | 30s | 视觉 + 单词弹窗（更频繁） |
| 4 | 1200s | 15s | 视觉 + 单词弹窗（最频繁） |

### check() 流程 (行4243-4326)

```
check()
│
├─ state 为空? → return
├─ !isVideoPage || !isPageActive? → return
├─ 隐藏时间补偿
├─ !isStudyTime? → 重置一切, return
├─ isWhitelisted? → 重置一切, return
└─ !isWhitelisted:
    ├─ 首次分心 (distractionStartTime===null)?
    │   → 设分心时间, showConfirmModal(), return
    ├─ 计算阶段 (getCurrentStage)
    ├─ 阶段变更? → applyVisualIntervention
    ├─ Stage 1? → updateProgressiveVisualEffect
    └─ showPopupIfNeeded(newStage)
```

### returnToLearning() (行3732-3740)

```javascript
function returnToLearning() {
    closeCurrentModal();
    const defaultBV = ConfigManager.getDefaultReturnBV();
    if (defaultBV) {
        window.location.href = `https://www.bilibili.com/video/${defaultBV}`;
    } else {
        window.history.back();
    }
}
```

---

## 二、P0 改造设计 — 自动导航到学习视频

### 2.1 功能概述

分心关闭弹窗后，自动跳转到白名单中的学习视频，而非停留在当前刷视频页面。

### 2.2 现有跳转点分析

| 位置 | 行号 | 触发条件 | 当前行为 | 需要改造 |
|------|------|---------|---------|---------|
| `returnToLearning()` | 3732 | 确认弹窗"返回学习"按钮 | 跳转默认BV或后退 | ✅ 需优化 |
| 确认弹窗课程选择 | 3869 | 选择课程后点击返回 | 跳转选定BV | ❌ 已OK |
| 确认弹窗"确认离开" | 3850 | 用户确认离开 | 关闭弹窗，留在当前页面 | ⚠️ 需改造 |
| 单词弹窗"跳过" | 3949 | 用户跳过单词测试 | 关闭弹窗，留在当前页面 | ⚠️ 需改造 |
| 单词弹窗答对后 | 4110 | 正确回答 | 关闭弹窗，留在当前页面 | ⚠️ 需改造 |
| 全部揭示6秒后 | 4153 | 记忆模式结束 | 关闭弹窗，留在当前页面 | ⚠️ 需改造 |

### 2.3 改造方案

**核心原则**：不是所有关闭弹窗都应该跳转。只有在"强拦截"阶段才自动跳转。

**新增函数 `navigateToStudyVideo()`**：

```javascript
function navigateToStudyVideo() {
    const whitelist = ConfigManager.getWhitelistArray();
    if (!whitelist || whitelist.length === 0) return;
    
    // 优先跳转最近学习的视频（后续 P6 休闲时段也可用）
    // 目前先简单使用默认BV
    const targetBV = ConfigManager.getDefaultReturnBV();
    if (targetBV) {
        window.location.href = `https://www.bilibili.com/video/${targetBV}`;
    }
}
```

**跳转时机**：

| 场景 | 是否跳转 | 理由 |
|------|---------|------|
| Stage 0 确认弹窗 → 点击"返回学习" | ❌ 已有课程选择 | 用户主动选择 |
| Stage 0 确认弹窗 → 点击"确认离开" | ❌ | 用户刚开始分心，给予自主权 |
| Stage 2+ 单词弹窗 → 答对 | ❌ | 用户已完成学习任务 |
| Stage 2+ 单词弹窗 → 跳过 | ❌ | 保留用户选择权 |
| Stage 3+ 分心持续10分钟 | ✅ | 配合 P2 强拦截 |
| 休闲时段结束（P6） | ✅ | 预留接口 |

**结论**：P0 的跳转逻辑与 P2 的三级阻拦深度绑定，Stage 3（强拦截）才触发自动跳转。

### 2.4 ConfigManager 扩展

新增方法供后续功能使用：

```javascript
// 获取最近学习的BV号（P6休闲时段也可调用）
function getRecentStudyBV() {
    // 从 StatisticsTracker 的历史记录中获取
    // 目前先返回 null，后续 P1 实现后再补全
    return null;
}
```

### 2.5 为 P6 预留

`navigateToStudyVideo()` 设计为**可配置跳转行为**的函数，后续 P6 的休闲时段结束后直接调用即可：

```javascript
// P6 时可扩展为：
function navigateToStudyVideo(options = {}) {
    const { force = false, reason = 'distraction' } = options;
    // reason: 'distraction'(分心强制) | 'leisure_end'(休闲结束) | 'startup'(2分钟启动)
    ...
}
```

---

## 三、P2 改造设计 — 三级渐进式阻拦

### 3.1 功能概述

将现有的"单一递增式干预"改造为"三级分级式干预"：

| 级别 | 现有对应 | 触发条件 | 行为 | 可关闭性 |
|------|---------|---------|------|---------|
| 🟡 轻提醒 | Stage 0/1 | 首次分心 | Toast提示+倒计时 | 自动消失 |
| 🟠 中干预 | Stage 2 | 分心3分钟 | 单词弹窗（现有逻辑） | 需交互关闭 |
| 🔴 强拦截 | Stage 3+ | 分心10分钟 | 全屏遮罩+自动跳转学习视频 | 仅跳转可解除 |

### 3.2 现有阶段配置改造

**现有的 `interventionStages` 是纯时间驱动**，需要增加"级别"概念：

```javascript
// 改造前 (行1078-1084)
interventionStages: [
    { threshold: 0, interval: 0 },
    { threshold: 60, interval: 0 },
    { threshold: 180, interval: 60 },
    { threshold: 600, interval: 30 },
    { threshold: 1200, interval: 15 }
]

// 改造后：增加 level 字段
interventionStages: [
    { threshold: 0,   interval: 0,   level: 'gentle' },     // Stage 0: 轻提醒
    { threshold: 60,  interval: 0,   level: 'gentle' },     // Stage 1: 轻提醒(渐进视觉)
    { threshold: 180, interval: 60,  level: 'moderate' },   // Stage 2: 中干预
    { threshold: 600, interval: 30,  level: 'aggressive' }, // Stage 3: 强拦截
    { threshold: 1200,interval: 15,  level: 'aggressive' }, // Stage 4: 强拦截
]
```

**兼容性**：旧配置没有 `level` 字段 → `getInterventionLevel(stage)` 函数提供默认值映射。

### 3.3 轻提醒（🟡 gentle level）实现

**现状**：Stage 0 是确认弹窗（强干预），Stage 1 是视觉效果。

**改造**：Stage 0 从确认弹窗改为 Toast 提示。

#### 新增 Toast 提醒组件

```
┌─────────────────────────────────────────────┐
│  ⏸️ 你正在学习时段中  剩余专注时间 3h25m       │
│  已分心 0m45s  [返回学习]  [我知道了]          │
└─────────────────────────────────────────────┘
```

- 位置：页面底部中央（不遮挡视频）
- 自动消失：15秒后
- 用户可手动关闭
- 点击"返回学习"→ 跳转学习视频（复用 returnToLearning）
- 点击"我知道了"→ 关闭 Toast，开始分心计时

**关键决策**：首次分心不再弹出确认弹窗，而是 Toast 提醒。如果用户3分钟内未返回学习，则升级到中干预。

#### 数据流

```
首次进入非白名单视频 (distractionStartTime === null)
  → 设 distractionStartTime = Date.now()
  → currentStage = 0
  → showToastReminder()    ← 替代 showConfirmModal()
  → 不阻塞用户操作
```

### 3.4 中干预（🟠 moderate level）实现

**现状**：Stage 2 的单词弹窗，已经实现。

**改造**：基本保持不变，增加弹窗中的上下文信息：

```
┌──────────────────────────────────┐
│  📝 专注验证                      │
│                                   │
│  你已分心 3m15s                   │  ← 新增
│  💰 继续学习可赚更多休闲时间       │  ← P6 预留位
│                                   │
│  [单词测试内容...]                │
│  [提交]  [跳过]                   │
└──────────────────────────────────┘
```

**改动点**：`renderWordModalContent()` 中增加分心时长显示和 P6 预留位。

### 3.5 强拦截（🔴 aggressive level）实现

**现状**：Stage 3/4 是更高频的单词弹窗。

**改造**：Stage 3+ 改为全屏遮罩 + 自动跳转。

#### 全屏遮罩

```
┌════════════════════════════════════════════┐
║                                            ║
║         ⚠️ 你已分心超过 10 分钟            ║
║                                            ║
║         即将在 10 秒后跳转回学习视频        ║
║                                            ║
║     [立即跳转]  [再答一题争取时间]          ║
║                                            ║
└════════════════════════════════════════════┘
```

- 全屏遮罩，不可关闭
- 10秒倒计时后自动跳转（配合 P0）
- "再答一题"→ 弹出单词测试，答对可延迟5分钟
- 每次延迟最多5分钟，Stage 4 不可延迟

**数据流**：

```
Stage 3+ (分心 ≥ 600s)
  → showAggressiveIntervention()
  → 全屏遮罩 + 10秒倒计时
  → 倒计时结束 → navigateToStudyVideo() (P0)
  → 用户点"再答一题" → showWordVerifierModal()
     → 答对 → 延迟5分钟（lastPopupTime 调整）
     → 答错/跳过 → 立即跳转
```

### 3.6 新增函数清单

| 函数名 | 所属模块 | 说明 |
|--------|---------|------|
| `showToastReminder()` | InterventionController | 🟡轻提醒 Toast |
| `showAggressiveIntervention()` | InterventionController | 🔴强拦截全屏遮罩 |
| `navigateToStudyVideo(options)` | InterventionController | 自动跳转学习视频 |
| `getInterventionLevel(stage)` | ConfigManager | 获取阶段对应级别 |
| `getRecentStudyBV()` | ConfigManager | 获取最近学习的BV（P1预留） |

### 3.7 修改函数清单

| 函数名 | 修改内容 |
|--------|---------|
| `check()` | Stage 0 → showToastReminder() 替代 showConfirmModal(); Stage 3+ → showAggressiveIntervention() |
| `showPopupIfNeeded()` | 根据 level 分流：moderate → 单词弹窗; aggressive → 强拦截 |
| `USER_CONFIG.interventionStages` | 增加 level 字段 |
| `renderWordModalContent()` | 增加分心时长显示 + P6 预留位 |
| `ConfigManager` return 对象 | 新增 getInterventionLevel, getRecentStudyBV |

---

## 四、全局扩展性设计

### 4.1 事件系统（为 P1/P3/P4/P5/P6 解耦）

当前各模块通过直接调用耦合（如 `StatisticsTracker.addStudyTime(1)` 在主定时器中）。新增功能后调用点会爆炸式增长。

**方案**：引入轻量级事件总线，各模块通过事件通信：

```javascript
const EventBus = {
    _handlers: {},
    on(event, handler) {
        if (!this._handlers[event]) this._handlers[event] = [];
        this._handlers[event].push(handler);
    },
    emit(event, data) {
        (this._handlers[event] || []).forEach(h => h(data));
    }
};

// 事件列表（v1.3.0 只定义，后续版本使用）
// - 'study:start'      → P1 打卡、P3 两分钟启动、P4 承诺
// - 'study:end'        → P1 打卡、P4 承诺回顾
// - 'distraction:start' → P2 Toast、P6 休闲币消耗
// - 'distraction:end'   → P6 休闲币结算
// - 'word:correct'      → P6 经验值+休闲币
// - 'word:wrong'        → P6 提示揭示
// - 'leisure:start'     → P6 休闲时段开始
// - 'leisure:end'       → P0 自动跳转
// - 'streak:checkin'    → P1 连续打卡
// - 'commitment:create' → P4 承诺创建
// - 'task:complete'     → P5 任务完成
```

**v1.3.0 实施策略**：
1. 定义 EventBus 模块
2. 在现有关键调用点添加 `emit`（不影响现有逻辑）
3. P2 的 Toast/强拦截通过 `on('distraction:start')` 监听
4. 后续 P1/P6 直接使用 `emit/on`，无需改动核心流程

### 4.2 干预级别可配置化

为 P2 的设置面板和 P6 的等级解锁做准备：

```javascript
// 干预级别配置（可在设置面板中调整阈值）
interventionLevels: {
    gentle: {
        enabled: true,
        toastDuration: 15,       // Toast 显示秒数
        showProgressiveVisual: true  // Stage 1 是否显示渐进视觉效果
    },
    moderate: {
        enabled: true,
        threshold: 180,          // 可自定义阈值（默认3分钟）
        popupInterval: 60        // 可自定义弹窗间隔
    },
    aggressive: {
        enabled: true,
        threshold: 600,          // 可自定义阈值（默认10分钟）
        countdownSeconds: 10,    // 跳转倒计时
        allowDelay: true,        // 是否允许"再答一题"延迟
        maxDelayMinutes: 5       // 最大延迟分钟数
    }
}
```

### 4.3 状态扩展

为后续功能预留 `window.__bilibiliStudyAppState` 的扩展字段：

```javascript
// v1.3.0 新增
window.__bilibiliStudyAppState = {
    tabId: string,
    currentStage: 0,
    distractionStartTime: null,
    isStudying: true,
    lastDistractionCount: 0,
    
    // === v1.3.0 新增 ===
    interventionLevel: 'none',  // 'none' | 'gentle' | 'moderate' | 'aggressive'
    toastShown: false,          // 当前 Toast 是否已显示
    
    // === 后续版本预留 ===
    // activeLeisure: null,     // P6: 休闲时段状态
    // currentCommitment: null, // P4: 当前承诺
    // todayTasks: [],          // P5: 今日任务
};
```

---

## 五、关键决策点

| # | 问题 | 选项 | 决定 | 理由 |
|---|------|------|------|------|
| D1 | 首次分心用 Toast 还是保留确认弹窗？ | A.Toast B.确认弹窗 C.可配置 | A.Toast | Toast 更温和，不阻塞用户；配合 P2 渐进逻辑，3分钟内未返回再升级 |
| D2 | 强拦截是否允许延迟？ | A.完全不允许 B.允许答一题延迟 C.可配置 | C.可配置 | Stage 3 允许延迟（给用户最后机会），Stage 4 不允许（分心太久了） |
| D3 | EventBus 是否在 v1.3.0 引入？ | A.立即引入 B.后续再引入 | A.立即引入 | 现在引入成本低，后续 P1/P6 直接用，不用回头改 |
| D4 | 干预级别配置放哪里？ | A.USER_CONFIG B.独立 localStorage C.合并到现有配置 | A.USER_CONFIG | 保持配置统一管理，设置面板已有，可直接扩展 |
| D5 | 自动跳转是否需要用户确认？ | A.直接跳转 B.倒计时确认 | B.倒计时确认 | 10秒倒计时给用户反应时间，避免突然跳转造成困惑 |

---

## 六、边界情况

| 场景 | 处理策略 |
|------|---------|
| 白名单为空 | Toast/强拦截仍显示，但不显示"返回学习"按钮，不触发自动跳转 |
| 休闲时段中（P6） | 不触发干预（预留：`if (state.activeLeisure) return`） |
| 全屏模式下 | Toast 和强拦截需挂载到 fullscreenElement（复用 `getModalContainer()`） |
| SPA导航到另一个非白名单视频 | 保留干预状态（现有逻辑），Toast 不重复弹出 |
| 页面不可见时 | 不弹 Toast/弹窗，页面可见后根据当前阶段补弹 |
| 用户快速来回切换页面 | `distractionStartTime` 在 SPA 导航到非白名单时不重置（现有逻辑），阶段延续 |
| 暗色模式 | 所有新增 UI（Toast、强拦截遮罩）必须同步适配暗色模式 |

---

## 七、实施检查单

按先后顺序，每步可独立验证：

### 步骤 1：基础设施
- [ ] 新增 `EventBus` 模块
- [ ] 在主定时器关键点添加 `emit`（`study:start`, `distraction:start` 等）
- [ ] 验证：控制台能看到事件输出，现有功能不受影响

### 步骤 2：P0 自动导航
- [ ] 新增 `navigateToStudyVideo()` 函数
- [ ] 新增 `ConfigManager.getRecentStudyBV()`（返回 null，占位）
- [ ] 验证：手动调用 `navigateToStudyVideo()` 能跳转到默认白名单视频

### 步骤 3：P2 轻提醒 Toast
- [ ] 新增 Toast CSS 样式（亮色+暗色）
- [ ] 新增 `showToastReminder()` 函数
- [ ] 修改 `check()`：首次分心 → `showToastReminder()` 替代 `showConfirmModal()`
- [ ] 验证：进入非白名单视频 → 底部出现 Toast → 15秒后自动消失

### 步骤 4：P2 强拦截遮罩
- [ ] 新增强拦截 CSS 样式（全屏遮罩+倒计时+暗色适配）
- [ ] 新增 `showAggressiveIntervention()` 函数
- [ ] 修改 `showPopupIfNeeded()`：aggressive level → 强拦截替代单词弹窗
- [ ] 验证：分心10分钟 → 全屏遮罩 → 倒计时后自动跳转

### 步骤 5：配置扩展
- [ ] `USER_CONFIG.interventionStages` 增加 `level` 字段
- [ ] 新增 `ConfigManager.getInterventionLevel()`
- [ ] 新增 `interventionLevels` 配置项
- [ ] `__bilibiliStudyAppState` 扩展字段
- [ ] 验证：配置加载正常，现有功能兼容

### 步骤 6：中干预弹窗增强
- [ ] `renderWordModalContent()` 增加分心时长显示
- [ ] 添加 P6 预留位（条件渲染，暂不显示）
- [ ] 验证：单词弹窗显示分心时长

### 步骤 7：文档更新
- [ ] 更新 CHANGELOG.md (v1.3.0)
- [ ] 更新 SCRIPT_LOGIC.md
- [ ] 更新 README.md
- [ ] 更新 improvement_plan.md 标记阶段一完成

---

## 八、多窗口计时与弹窗体系（全局基础设施）

> ⚠️ 本章已迁移至独立文件：**`design-spec-v1.3.0-multiwindow.md`**
> 
> 该文件包含以下完整设计：
> - 8.1 问题全景
> - 8.2 多窗口场景全览（场景矩阵 + 引导优先策略）
> - 8.3 多窗口检测与引导流程（注册表 + 引导弹窗 + BV号记忆）
> - 8.4 Master 窗口机制（仲裁规则 + 焦点切换 + TabManager）
> - 8.5 BroadcastChannel 通信（消息类型 + 广播状态包 + 非 Master 行为表）
> - 8.6 弹窗优先级体系（8级层级 + 互斥规则 + ModalManager）
> - 8.7 主定时器改造
> - 8.8 分版本实施计划（v1.2.3 → v1.3.0）

---

*以下为旧版内容，仅供历史参考，以 multiwindow 文件为准*

### 8.1 问题全景

油猴脚本在每个 B站标签页中独立运行。每个实例有自己的 `setInterval(1s)`、`state`、`StatisticsTracker`。浏览器机制保证同一窗口同一时刻只有1个标签页是 `visible`，但以下场景会打破这个假设：

### 8.2 场景矩阵

| # | 场景 | visible窗口数 | 现有行为 | 是否正确 | 风险等级 |
|---|------|-------------|---------|---------|---------|
| A | 1个标签页看学习视频 | 1 | +1s 学习时间 | ✅ | 无 |
| B | 1个标签页看分心视频 | 1 | +1s 分心时间 | ✅ | 无 |
| C | 2个标签页同窗口：学习→切到分心 | 1 | 只有分心窗口计时 | ✅ | 无 |
| D | 2个标签页同窗口：分心→切到学习 | 1 | 只有学习窗口计时 | ✅ | 无 |
| E | **2个窗口并排：都在看学习视频** | **2** | **两个都 +1s 学习时间** | ❌ **重复计时** | 🔴 高 |
| F | **2个窗口并排：1学习+1分心** | **2** | **同时 +1s 学习 + +1s 分心** | ❌ **逻辑矛盾** | 🔴 高 |
| G | **2个窗口并排：都在看分心视频** | **2** | **两个都 +1s 分心时间** | ❌ **重复计时** | 🟡 中 |
| H | 学习窗口最小化，分心窗口在前台 | 1 | 只有分心窗口计时 | ✅ | 无 |
| I | 2个标签页的 StatisticsTracker 写 localStorage | - | **读→改→写竞态** | ❌ **数据丢失** | 🔴 高 |

### 8.3 核心问题总结

**问题1：多 visible 窗口 → 重复计时**（场景 E/F/G）

当用户把标签页拖成独立窗口并排时，两个窗口都是 `visible`，两个定时器同时执行。

**问题2：localStorage 读写竞态**（场景 I）

`addStudyTime(1)` 的流程是 `读→+1→写`，如果两个实例在同一秒内执行：
```
实例A: 读 studyTime=60 → +1 → 写 61
实例B: 读 studyTime=60 → +1 → 写 61  ← 丢失了1秒！
```

**问题3：跨标签页干预状态不感知**（场景 F）

- 窗口1（学习）：stage=0, isStudying=true
- 窗口2（分心）：stage=2, isStudying=false
- 两个窗口独立执行干预逻辑，互不感知

**问题4：P6 休闲币/XP 的重复计算**（未来）

如果按学习时间发休闲币，多窗口并排学 → 休闲币翻倍

### 8.4 解决方案对比

| 方案 | 机制 | 优点 | 缺点 | 复杂度 |
|------|------|------|------|--------|
| **A. 主标签页选举** | 用 localStorage 存 `masterTabId`，只有 master 有权计时和写统计 | 精确控制，无竞态 | master 窗口关闭时需要重新选举；其他窗口浮窗不更新 | 中 |
| **B. BroadcastChannel 同步** | 标签页间通过 BroadcastChannel 通信，协商谁计时 | 实时同步，可共享状态 | 需要额外的消息协议；不兼容极老浏览器 | 中 |
| **C. localStorage 锁+时间戳** | 写入前获取锁，用 `storage` 事件监听变化 | 简单，兼容性好 | 锁粒度难控制；storage 事件异步 | 低 |
| **D. 服务端统一计时** | 在后台脚本(GM_background)中计时 | 最精确 | 油猴脚本不支持 GM_background | ❌ 不可行 |

### 8.5 推荐方案：A（主标签页选举）+ B（BroadcastChannel）

**理由**：
- 方案 A 解决核心问题（谁有权写统计），实现最简单
- 方案 B 作为补充，让非 master 窗口也能显示状态（浮窗/Toast）
- BroadcastChannel 在现代浏览器中支持良好（Chrome 54+, Firefox 38+, Edge 79+）
- 油猴脚本运行环境就是现代浏览器，兼容性不是问题

#### 8.5.1 主标签页选举机制

```javascript
const TabManager = (function() {
    const TAB_ID = 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    const MASTER_KEY = 'bilibiliStudy_masterTab';
    const HEARTBEAT_KEY = 'bilibiliStudy_masterHeartbeat';
    const HEARTBEAT_INTERVAL = 3000;  // 3秒心跳
    const HEARTBEAT_TIMEOUT = 8000;   // 8秒无心跳视为失联

    let isMaster = false;
    let heartbeatTimer = null;

    function elect() {
        const now = Date.now();
        const current = getMasterInfo();
        
        if (!current || now - current.heartbeat > HEARTBEAT_TIMEOUT) {
            // 无 master 或 master 失联 → 我来当
            claimMaster();
        } else {
            isMaster = false;
            // 监听 master 失联
            startWatching();
        }
    }

    function claimMaster() {
        localStorage.setItem(MASTER_KEY, JSON.stringify({
            tabId: TAB_ID,
            heartbeat: Date.now()
        }));
        isMaster = true;
        startHeartbeat();
    }

    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
            localStorage.setItem(HEARTBEAT_KEY, Date.now().toString());
            // 确认自己还是 master
            const current = getMasterInfo();
            if (current && current.tabId !== TAB_ID) {
                // 被抢了（极端情况），让步
                isMaster = false;
                clearInterval(heartbeatTimer);
                startWatching();
            }
        }, HEARTBEAT_INTERVAL);
    }

    function startWatching() {
        // 定期检查 master 心跳
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
            const current = getMasterInfo();
            const now = Date.now();
            if (!current || now - current.heartbeat > HEARTBEAT_TIMEOUT) {
                elect(); // 重新选举
            }
        }, HEARTBEAT_INTERVAL);
    }

    function getMasterInfo() {
        try {
            return JSON.parse(localStorage.getItem(MASTER_KEY));
        } catch { return null; }
    }

    // 页面关闭时主动让出 master
    window.addEventListener('beforeunload', () => {
        if (isMaster) {
            localStorage.removeItem(MASTER_KEY);
        }
    });

    return {
        TAB_ID,
        elect,
        isMaster: () => isMaster,
        init: elect
    };
})();
```

#### 8.5.2 BroadcastChannel 通信

```javascript
const TabMessenger = (function() {
    let channel = null;
    const handlers = {};

    function init() {
        try {
            channel = new BroadcastChannel('bilibili_study_channel');
            channel.onmessage = (event) => {
                const { type, data, from } = event.data;
                if (handlers[type]) {
                    handlers[type].forEach(h => h(data, from));
                }
            };
        } catch(e) {
            // 降级：不通信，各标签页独立运行
            console.warn('[B站学习助手] BroadcastChannel 不可用，多标签页功能降级');
        }
    }

    function on(type, handler) {
        if (!handlers[type]) handlers[type] = [];
        handlers[type].push(handler);
    }

    function emit(type, data) {
        if (channel) {
            channel.postMessage({ type, data, from: TabManager.TAB_ID });
        }
    }

    return { init, on, emit };
})();
```

#### 8.5.3 通信协议

```javascript
// 消息类型定义
const TabMessages = {
    // Master → All: 广播状态更新
    STATE_UPDATE: 'state_update',       // { isStudying, stage, studyTime, distractionTime }
    
    // Master → All: 广播干预事件
    INTERVENTION_TRIGGERED: 'intervention_triggered',  // { level, stage }
    
    // Slave → Master: 请求状态同步
    REQUEST_SYNC: 'request_sync',       // {}
    
    // Master → Slave: 响应同步请求
    SYNC_RESPONSE: 'sync_response',     // { fullState, stats }
    
    // 任一 → All: 页面导航通知
    NAVIGATION: 'navigation',           // { bv, isWhitelisted }
    
    // P6 预留
    LEISURE_START: 'leisure_start',     // { duration, tabId }
    LEISURE_END: 'leisure_end',         // { tabId }
    XP_EARNED: 'xp_earned',            // { amount, reason }
};
```

#### 8.5.4 计时逻辑改造

**核心原则：只有 Master 标签页有权写统计和执行干预**

```javascript
// 主定时器改造（替换现有的 setInterval 逻辑）
setInterval(function() {
    const state = window.__bilibiliStudyAppState;
    if (!state) return;

    const isVideoPage = PageMonitor.isVideoPage();
    const isPageActive = PageMonitor.isPageActive();
    const isStudyTime = ConfigManager.isStudyTime();
    const currentBV = PageMonitor.getCurrentBV();
    const isWhitelisted = ConfigManager.isWhitelisted(currentBV);

    // ===== 核心改造：只有 Master 才执行统计和干预 =====
    if (TabManager.isMaster()) {
        // 统计逻辑（只有 master 写 localStorage）
        if (isVideoPage && isPageActive && isStudyTime) {
            if (isWhitelisted) {
                state.isStudying = true;
                StatisticsTracker.addStudyTime(1);
            } else {
                state.isStudying = false;
                StatisticsTracker.addDistractionTime(1);
            }
        }

        // 干预逻辑（只有 master 执行 check）
        InterventionController.check();

        // 广播状态给其他标签页
        TabMessenger.emit(TabMessages.STATE_UPDATE, {
            isStudying: state.isStudying,
            stage: state.currentStage,
            studyTime: StatisticsTracker.getTodayStats().studyTime,
            distractionTime: StatisticsTracker.getTodayStats().distractionTime
        });
    } else {
        // 非 Master：只更新本地浮窗显示（不写 localStorage）
        if (isVideoPage && isPageActive && isStudyTime) {
            state.isStudying = isWhitelisted;
        }
        // 浮窗仍然显示，但数据来自 Master 广播
    }

    // 浮窗更新（所有标签页都做）
    if (FloatingWindow.create()) {
        FloatingWindow.updateStatus({
            isStudying: state.isStudying,
            stage: state.currentStage,
            studyTime: todayStats.studyTime,
            distractionTime: todayStats.distractionTime
        });
    }
}, 1000);
```

#### 8.5.5 非 Master 标签页的行为

| 功能 | Master | 非 Master |
|------|--------|----------|
| 统计计时 | ✅ 写 localStorage | ❌ 不写 |
| 干预弹窗 | ✅ 正常弹出 | ❌ 不弹（避免多窗口同时弹） |
| 浮窗显示 | ✅ 实时更新 | ✅ 用 Master 广播数据更新 |
| Toast 提醒 | ✅ 正常显示 | ✅ 正常显示（轻量级，不写数据） |
| 单词测试 | ✅ 正常弹窗 | ⚠️ 不弹弹窗，但可答 Toast 中的轻量题 |
| 详情面板 | ✅ 显示完整数据 | ✅ 显示完整数据（读 localStorage） |
| 学习/分心跳转 | ✅ 正常执行 | ✅ 正常执行 |

**关键设计决策**：非 Master 的 Toast 提醒仍然要显示！用户可能在非 Master 窗口分心，需要看到提醒。但**不执行干预弹窗**（避免两个窗口同时弹）。

#### 8.5.6 Master 选举的特殊情况

| 情况 | 处理 |
|------|------|
| Master 关闭 | `beforeunload` 清除标记 → 其他标签页检测到心跳超时 → 重新选举 |
| Master 崩溃（无 beforeunload） | 心跳超时（8秒）→ 自动重新选举 |
| 用户关闭所有标签页后重新打开 | 正常选举，无冲突 |
| 同一标签页内 SPA 导航 | 不影响，TAB_ID 不变 |
| 浏览器休眠/唤醒 | 心跳超时 → 可能触发重选，但唤醒后新选举很快完成 |

### 8.6 分版本实施计划

这部分是全局基础设施，建议在 v1.2.x 系列中逐步引入：

| 版本 | 内容 | 风险 |
|------|------|------|
| v1.2.3 | TabManager 选举机制 + 主定时器改造 | 低（只在现有逻辑上加 if 判断） |
| v1.2.4 | TabMessenger (BroadcastChannel) + 状态广播 | 低（新增模块，不影响现有功能） |
| v1.2.5 | 非 Master 窗口的 Toast/浮窗适配 | 低（显示层改造） |
| v1.3.0 | P0 + P2（基于稳定的多窗口基础设施） | 中（新功能叠加） |

**v1.2.3 的核心改动极小**：在主定时器的统计和干预逻辑外面包一层 `if (TabManager.isMaster())`，现有功能不受影响。

---

## 十、广播状态与行为逻辑

### 10.1 Master 跟随焦点走

**核心原则**：谁被看见谁是 Master，切换窗口自动切换 Master。

```
触发条件                        Master 变化
─────────────────────────────────────────────
Tab A 可见，无其他 Master      → A 成为 Master
Tab A 切到后台                 → A 释放 Master
Tab B 可见，无其他 Master      → B 成为 Master
两个窗口并排，用户点击 A       → A 成为 Master
两个窗口并排，用户点击 B       → B 成为 Master
Master 窗口关闭               → 剩余窗口中可见的那个成为 Master
```

**仲裁规则**（并排窗口场景）：
- `visibilitychange` 事件：visible 时尝试成为 Master
- `window.focus` 事件：获得焦点时尝试成为 Master
- `localStorage` 存储 Master 标记 + 心跳时间戳
- 心跳超时（8秒）→ 其他窗口可接管

### 10.2 广播状态定义

Master 每秒向其他窗口广播当前状态，非 Master 窗口据此决定自己的行为。

```javascript
// Master 广播的状态包
{
    // 基础状态
    tabId: 'tab_xxx',              // Master 的 tab 标识
    isStudying: true,              // Master 是否在学习
    currentStage: 0,               // Master 的干预阶段
    interventionLevel: 'none',     // none | gentle | moderate | aggressive
    
    // 统计数据（从 StatisticsTracker 读取）
    studyTime: 3600,               // 今日学习秒数
    distractionTime: 300,          // 今日分心秒数
    
    // 干预状态
    distractionElapsed: 0,         // 当前分心已持续秒数
    activeModal: null,             // Master 当前弹出的弹窗类型
    
    // P6 预留
    // leisureCoins: 35,
    // xp: 1250,
    // level: 6,
}
```

### 10.3 广播消息类型

| 消息类型 | 方向 | 触发时机 | 数据 |
|---------|------|---------|------|
| `STATE_UPDATE` | Master→All | 每秒主定时器 | 完整状态包 |
| `MASTER_CLAIM` | 新Master→All | 成为 Master 时 | { tabId, timestamp } |
| `MASTER_RELEASE` | 旧Master→All | 释放 Master 时 | { tabId } |
| `INTERVENTION_TRIGGERED` | Master→All | 干预触发时 | { level, stage, distractionElapsed } |
| `REQUEST_SYNC` | 任意→Master | 非 Master 需要完整状态 | {} |
| `SYNC_RESPONSE` | Master→请求者 | 响应同步请求 | 完整状态包 |
| `NAVIGATION` | 任意→All | SPA 导航发生 | { bv, isWhitelisted } |

### 10.4 非 Master 窗口行为逻辑

根据收到的广播状态，非 Master 窗口的行为表：

| 广播状态 | 非 Master 行为 | 说明 |
|---------|---------------|------|
| Master `isStudying=true` | 浮窗显示"学习中"，不弹任何提示 | Master 在学习，我安静 |
| Master `interventionLevel=gentle` | 不额外操作 | Toast 已由 Master 自己处理 |
| Master `interventionLevel=moderate` | 如果本窗口也是非白名单视频 → 显示 Toast「你正在学习时段中」 | 本窗口也在分心，给个轻提醒 |
| Master `interventionLevel=aggressive` | 如果本窗口也是非白名单视频 → 显示 Toast「请返回学习视频」 | 提醒力度稍大 |
| Master `activeModal=word_verify` | 不操作 | Master 在弹单词题 |
| Master `activeModal=aggressive_overlay` | 不操作 | Master 在全屏拦截 |
| Master 心跳丢失 | 尝试成为新 Master | 自动接管 |
| 本窗口切换到前台 | 成为新 Master，旧 Master 自动降级 | 焦点切换 |

**关键规则**：
1. **非 Master 永远不弹全屏弹窗**——避免两个窗口同时弹的糟糕体验
2. **非 Master 可以弹 Toast**——轻量级，不打断操作
3. **非 Master 的浮窗只读**——显示 Master 广播的统计数据
4. **非 Master 的干预检测暂停**——不执行 `check()`，不做阶段升级

---

## 十一、弹窗优先级体系

### 11.1 现有弹窗盘点

| ID | 类型 | 当前 z-index | 触发条件 | 阻塞程度 |
|----|------|-------------|---------|---------|
| `bilibili-study-floating-window` | 浮窗 | 999999 | 始终存在 | 不阻塞 |
| `bilibili-study-detail-modal` | 详情面板 | 999998 | 点击浮窗 | 全屏阻塞 |
| `bilibili-study-confirm-modal` | 确认弹窗 | 999998 | Stage 0 分心 | 全屏阻塞 |
| `bilibili-study-word-modal` | 单词弹窗 | 999998 | Stage 2+ 分心 | 全屏阻塞 |
| `bilibili-study-add-whitelist-modal` | 添加白名单弹窗 | 999998 | 点击"添加白名单" | 全屏阻塞 |
| `bilibili-study-settings-modal` | 设置面板 | 999999 | 详情面板内打开 | 全屏阻塞 |
| Toast 提示（详情面板内） | Toast | 999999 | 操作反馈 | 不阻塞 |

**问题**：
1. 所有弹窗共用 `z-index: 999998`，可能出现覆盖混乱
2. 没有"谁盖在谁上面"的明确规则
3. 新增 Toast/强拦截遮罩后，层级关系更复杂
4. 多个弹窗同时存在时，关闭逻辑不清晰

### 11.2 弹窗层级设计

从低到高，**数字越大越在上面**：

```
┌─────────────────────────────────────────────────────────┐
│  Level 6 (z-index: 1000005) 🔴 强拦截全屏遮罩          │  最高优先级
│  ── 不可关闭，倒计时跳转，覆盖一切                       │
├─────────────────────────────────────────────────────────┤
│  Level 5 (z-index: 1000004) 🟠 单词验证弹窗            │
│  ── 需交互关闭，可以被强拦截覆盖                         │
├─────────────────────────────────────────────────────────┤
│  Level 4 (z-index: 1000003) 🟡 确认弹窗/添加白名单弹窗  │
│  ── 需交互关闭，可以被单词弹窗覆盖                       │
├─────────────────────────────────────────────────────────┤
│  Level 3 (z-index: 1000002) 📋 设置面板                 │
│  ── 用户主动打开，可以被干预弹窗覆盖                     │
├─────────────────────────────────────────────────────────┤
│  Level 2 (z-index: 1000001) 📊 详情面板                 │
│  ── 用户主动打开，可以被设置面板覆盖                     │
├─────────────────────────────────────────────────────────┤
│  Level 1 (z-index: 1000000) 💬 Toast 提醒              │
│  ── 不阻塞，自动消失，谁都不挡                           │
├─────────────────────────────────────────────────────────┤
│  Level 0 (z-index: 999999)  🟢 浮窗                    │  最低优先级
│  ── 始终存在，在所有弹窗下面                             │
└─────────────────────────────────────────────────────────┘
```

### 11.3 弹窗互斥规则

**规则1：同级弹窗互斥**
- 同时只能有1个 Level 4 弹窗（确认弹窗 OR 添加白名单弹窗，不能同时存在）
- 同时只能有1个 Level 5 弹窗（单词验证弹窗）

**规则2：高级弹窗可以覆盖低级弹窗**
- 强拦截出现时，自动关闭底下的确认弹窗和单词弹窗
- 单词弹窗出现时，自动关闭底下的确认弹窗
- 干预弹窗可以覆盖设置面板（用户分心太久，优先级高于手动操作）

**规则3：用户主动弹窗不被自动关闭**
- 详情面板和设置面板是用户主动打开的
- 干预弹窗出现时，详情面板不关闭，但被盖在下面
- 用户关闭干预弹窗后，详情面板还在

**规则4：Toast 独立存在**
- Toast 不受任何其他弹窗影响
- Toast 可以在弹窗之上显示（如单词答对的反馈）
- 同时最多显示1条 Toast，新的替换旧的

### 11.4 弹窗管理器设计

```javascript
const ModalManager = (function() {
    // 弹窗优先级定义
    const LEVELS = {
        FLOATING:   0,  // 浮窗
        TOAST:      1,  // Toast
        DETAIL:     2,  // 详情面板
        SETTINGS:   3,  // 设置面板
        CONFIRM:    4,  // 确认弹窗/添加白名单
        WORD:       5,  // 单词验证弹窗
        AGGRESSIVE: 6,  // 强拦截全屏遮罩
    };

    // z-index 基数
    const Z_BASE = 999999;
    
    // 当前激活的弹窗栈（可能有多个弹窗同时存在）
    let activeModals = [];  // [{ id, level, element }]

    // 获取弹窗的 z-index
    function getZIndex(level) {
        return Z_BASE + level;
    }

    // 注册弹窗
    function register(id, level, element) {
        // 同级互斥：关闭已有的同级弹窗
        const existing = activeModals.find(m => m.level === level);
        if (existing) {
            dismiss(existing.id);
        }
        
        // 设置 z-index
        element.style.zIndex = getZIndex(level);
        
        activeModals.push({ id, level, element });
        
        // 广播弹窗状态（P2 新增）
        TabMessenger.emit('INTERVENTION_TRIGGERED', {
            level: Object.keys(LEVELS).find(k => LEVELS[k] === level),
            activeModal: id
        });
    }

    // 关闭弹窗
    function dismiss(id) {
        const index = activeModals.findIndex(m => m.id === id);
        if (index !== -1) {
            const modal = activeModals[index];
            if (modal.element && modal.element.parentNode) {
                modal.element.remove();
            }
            activeModals.splice(index, 1);
        }
    }

    // 关闭所有干预弹窗（保留用户主动打开的详情面板和设置面板）
    function dismissAllIntervention() {
        activeModals = activeModals.filter(m => {
            if (m.level >= LEVELS.CONFIRM) {
                if (m.element && m.element.parentNode) {
                    m.element.remove();
                }
                return false;
            }
            return true;
        });
    }

    // 获取当前最高优先级弹窗
    function getTopModal() {
        if (activeModals.length === 0) return null;
        return activeModals.reduce((a, b) => a.level > b.level ? a : b);
    }

    // 检查是否有干预弹窗激活（用于主定时器判断）
    function hasInterventionModal() {
        return activeModals.some(m => m.level >= LEVELS.CONFIRM);
    }

    return {
        LEVELS,
        register,
        dismiss,
        dismissAllIntervention,
        getTopModal,
        hasInterventionModal
    };
})();
```

### 11.5 弹窗层级与 P2 三级干预的对应

| P2 干预级别 | 弹窗类型 | 层级 | z-index | 可关闭性 | 被 Master 控制 |
|------------|---------|------|---------|---------|--------------|
| 🟡 gentle | Toast | 1 | 1000000 | 自动消失(15s) | 所有窗口 |
| 🟠 moderate | 单词弹窗 | 5 | 1000004 | 需交互 | 仅 Master 弹 |
| 🔴 aggressive | 全屏遮罩 | 6 | 1000005 | 仅跳转可解除 | 仅 Master 弹 |

**非 Master 窗口的弹窗行为**：

| 窗口状态 | 弹窗行为 |
|---------|---------|
| 非 Master + 在白名单视频 | 无弹窗，浮窗显示正常 |
| 非 Master + 在非白名单视频 + Master 在学 | Toast：「你的学习视频还在播放哦」 |
| 非 Master + 在非白名单视频 + Master 在干预 | Toast：「请返回学习视频」 |
| 非 Master + 在非白名单视频 + Master 失联 | 尝试接管为 Master |

### 11.6 弹窗切换场景示例

**场景1：用户在详情面板中，分心3分钟触发单词弹窗**
```
时间线：
  0s   详情面板打开（Level 2, z-index: 1000001）
  180s 单词弹窗触发（Level 5, z-index: 1000004）
       → 单词弹窗盖在详情面板上面
       → 详情面板不关闭
  185s 用户答对，单词弹窗关闭
       → 详情面板重新可见
```

**场景2：用户在单词弹窗中，分心10分钟触发强拦截**
```
时间线：
  0s   单词弹窗打开（Level 5, z-index: 1000004）
  600s 强拦截触发（Level 6, z-index: 1000005）
       → 强拦截盖在单词弹窗上面
       → 单词弹窗不关闭（但被遮住）
  610s 倒计时结束，自动跳转
       → dismissAllIntervention()，关闭强拦截+单词弹窗
```

**场景3：非 Master 窗口分心**
```
时间线：
  0s   Tab A (Master) 在看学习视频
       Tab B (非 Master) 在看分心视频
  3s   Tab B 检测到自己不在白名单 + Master 在学习
       → Tab B 弹出 Toast（Level 1）：「你正在学习时段中哦」
       → 不弹全屏弹窗
  15s  Toast 自动消失
```

---

## 十二、文件改动预估

| 文件 | 改动量 | 主要内容 |
|------|--------|---------|
| `bilibili-study-focus-assistant.user.js` | ~300行 | EventBus + Toast + 强拦截 + 配置扩展 + check()改造 |
| `CHANGELOG.md` | ~20行 | v1.3.0 更新日志 |
| `SCRIPT_LOGIC.md` | ~30行 | 新逻辑说明 |
| `README.md` | ~15行 | 新功能说明 |
