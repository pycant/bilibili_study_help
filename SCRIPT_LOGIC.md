# B站学习专注提醒助手 — 脚本运行逻辑详解

> 版本：v1.2.0 | 更新日期：2026-04-18

---

## 一、整体架构

脚本采用 **IIFE 模块化模式**，由以下核心模块组成：

```
┌─────────────────────────────────────────────────────┐
│                   Main IIFE (入口)                    │
│  初始化 → 主定时器(setInterval 1s) → SPA路由监听      │
└──────────┬──────────┬──────────┬──────────┬──────────┘
           │          │          │          │
     ┌─────▼────┐ ┌───▼────┐ ┌──▼──────┐ ┌▼──────────────┐
     │PageMonitor│ │Floating│ │ Detail  │ │ Intervention  │
     │ URL/BV监控│ │ Window │ │ Panel   │ │ Controller    │
     │ SPA路由   │ │ 状态显示│ │ 统计面板 │ │ 状态机+弹窗   │
     └─────┬────┘ └───┬────┘ └──┬──────┘ └──┬──────────┬─┘
           │          │         │            │          │
     ┌─────▼──────────▼─────────▼────────────▼──────────▼─┐
     │              ConfigManager (配置管理)                │
     │   学习时段判断 / 白名单管理 / 干预配置 / 词汇配置    │
     └──────────────────────┬─────────────────────────────┘
                            │
     ┌──────────────────────▼─────────────────────────────┐
     │              StorageManager (存储管理)               │
     │           localStorage 读写 + 内存回退               │
     └──────────────────────┬─────────────────────────────┘
                            │
     ┌──────────┬───────────▼───────────┬────────────────┐
     │userConfig│      timeStats        │   wordRecords  │
     │ 用户配置  │ 学习/分心时间统计     │  单词掌握记录   │
     └──────────┴───────────────────────┴────────────────┘
```

| 模块 | 行号范围 | 职责 |
|------|----------|------|
| **STYLES** | 19–575 | 全局 CSS：浮动窗、弹窗、干预视觉效果、暗色模式 |
| **USER_CONFIG** | 590–643 | 用户可编辑的默认配置常量 |
| **ConfigManager** | 648–857 | 配置加载/保存/查询，白名单管理，学习时段判断 |
| **StorageManager** | 862–929 | localStorage 读写封装，带内存回退机制 |
| **DEFAULT_DATA_STRUCTURES** | 936–992 | 三个数据模块的默认结构定义和初始化 |
| **PageMonitor** | 997–1102 | URL/BV号监控、SPA路由变更检测、页面可见性/全屏状态 |
| **FloatingWindow** | 1107–1360 | 悬浮窗创建、拖拽、状态显示 |
| **DetailPanel** | 1365–1920 | 详细统计面板（5个模块），主题切换，白名单管理 |
| **WordVerifier** | 1925–2061 | 单词选择、答案校验、掌握度追踪 |
| **StatisticsTracker** | 2066–2202 | 学习/分心时间统计，每日归档 |
| **InterventionController** | 2207–2982 | 核心状态机、视觉干预、弹窗控制 |
| **Main IIFE** | 2987–3134 | 初始化入口、主定时器循环、SPA导航处理 |

---

## 二、初始化流程

脚本加载后按以下顺序执行：

```
1. CSS 注入（第577-585行）
   ├─ 优先使用 GM_addStyle（Tampermonkey API）
   └─ 回退到 document.createElement('style') 手动注入

2. 生成 Tab ID（第2993-3016行）
   ├─ generateTabId() → 'tab_{timestamp}_{random}' 格式
   ├─ 存入 sessionStorage（跨页不共享，同标签页持久）
   └─ 回退到内存随机ID

3. 初始化全局状态 window.__bilibiliStudyAppState（第3020-3026行）
   ├─ tabId: 标签页唯一标识
   ├─ currentStage: 0
   ├─ distractionStartTime: null
   ├─ isStudying: true
   └─ lastDistractionCount: 0

4. ConfigManager.load()（第3029行）
   └─ 从 localStorage 读取配置，与 USER_CONFIG 合并

5. 初始化数据模块（第3033-3035行）
   ├─ getOrInitModule('userConfig')
   ├─ getOrInitModule('timeStats')
   └─ getOrInitModule('wordRecords')

6. PageMonitor.init()（第3045行）
   └─ 读取当前URL中的BV号存入 currentBV

7. StatisticsTracker.init()（第3048行）
   └─ checkDailyArchive() 检查是否需要归档昨日数据

8. 创建浮动窗（第3051-3057行）
   ├─ 仅在视频页面创建
   └─ 设置点击回调 → DetailPanel.open()

9. 启动主定时器（第3060-3096行）
   └─ setInterval(1000ms) 每秒执行

10. 设置 SPA 导航监听（第3099-3120行）
    ├─ PageMonitor.observeSPAChanges(callback)
    └─ 路由变化时重置干预状态
```

---

## 三、核心状态机

### 3.1 状态判定流程（InterventionController.check()，第2900-2969行）

```
                    ┌────────────────┐
                    │  每秒定时器触发  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐    否
                    │ 是视频页且可见？ │──────→ 返回
                    └───────┬────────┘
                            │ 是
                    ┌───────▼────────┐    否
                    │  处于学习时段？  │──────→ 清除干预，重置为学习状态
                    └───────┬────────┘
                            │ 是
                    ┌───────▼────────┐    是
                    │ BV号在白名单？  │──────→ 清除干预，重置为学习状态
                    └───────┬────────┘
                            │ 否
                    ┌───────▼──────────────┐
                    │ distractionStartTime  │
                    │     === null ?        │
                    └───┬──────────────┬───┘
                        │ 是            │ 否
              ┌─────────▼────┐   ┌─────▼──────────────┐
              │ 设置分心开始  │   │ 计算分心持续时长     │
              │ 显示确认弹窗  │   │ 确定当前阶段         │
              │ (Stage 0)    │   │ 应用视觉干预         │
              └──────────────┘   │ 检查是否需要弹窗     │
                                 └─────────────────────┘
```

### 3.2 分心状态阶段

| Stage | 分心时长阈值 | 弹窗间隔 | 视觉效果 | 弹窗类型 |
|-------|-------------|----------|----------|----------|
| **0** | 0秒 | — | 无 | 确认弹窗 `showConfirmModal()` |
| **1** | 60秒 | 无弹窗 | 渐进视觉干扰（0%→100%反色+灰度） | 无 |
| **2** | 300秒（5分钟） | 120秒 | 反色+灰度(80%)+透明度0.7 | 填空弹窗 `showStage2Modal()` |
| **3** | 600秒（10分钟） | 30秒 | 同Stage 2 | 单词验证 `showWordVerifierModal()` |
| **4** | 1200秒（20分钟） | 15秒 | 反色+灰度(80%)+透明度0.6+红色闪烁边框 | 单词验证 `showWordVerifierModal()` |

### 3.3 Stage 1 渐进视觉效果

Stage 1 不是静态效果，而是**随时间渐进增强**的：

```
stage1Duration = distractionDuration - 60   (Stage1已持续时间)
stage1Total    = 240                        (Stage1总持续时间4分钟)
progress       = min(1, max(0, stage1Duration / stage1Total))

invert    = progress * 100%     (反色从 0% → 100%)
grayscale = progress * 80%      (灰度从 0% → 80%)
opacity   = 1 - progress * 0.3  (透明度从 1.0 → 0.7)
```

应用目标选择器（**排除播放器本身**）：
- `.video-container`, `.main-container`, `.left-container`
- `#viewbox_report`, `.reCMD-list`, `.recommend-list`
- `.sidebar`, `.relative-ul`, `.bpx-player-area`, `.player-area`
- `.right-container`, `.video-info-container`, `.comment-container`

播放器排除规则：`.bilibili-player-wrap` 及其子元素始终 `filter: none; opacity: 1`

### 3.4 用户交互与状态转换

```
用户点击"确认离开学习":
  → incrementDistractionCount()
  → 重置 distractionStartTime = Date.now()
  → currentStage = 1
  → lastPopupTime = Date.now()

用户点击"选择课程返回":
  → returnToLearning()
  → window.location.href = 白名单课程BV号

用户点击"立即返回学习"（无白名单时）:
  → returnToLearning()
  → 跳转默认BV号 或 history.back()
```

---

## 四、计时机制

### 4.1 主定时器（第3060-3096行）

```
setInterval(1000ms) 每秒执行：
  1. 判断当前页面状态（视频页？可见？学习时段？白名单？）
  2. 更新统计（学习/分心时间 +1秒）
  3. 调用 InterventionController.check() 执行状态机
  4. 更新浮动窗状态显示
```

### 4.2 弹窗间隔控制

```javascript
// showPopupIfNeeded(stage)
const intervalMs = stageConfig.interval * 1000;
if (now - lastPopupTime >= intervalMs) {
    // 显示弹窗
    lastPopupTime = now;  // 弹窗显示后更新
}
```

阶段切换时 `lastPopupTime` 的设置（第2958-2960行）：
```
newStage >= 2 时:
  lastPopupTime = distractionStartTime + 阶段阈值秒数 * 1000
  // Stage 2 → +300s, Stage 3 → +600s, Stage 4 → +1200s
```
这样确保阶段切换后不会立刻弹窗，而是从阶段阈值时间开始计算间隔。

### 4.3 页面可见性修正（第2883-2898行）

```
页面隐藏时：记录 lastVisibilityChange = Date.now()
页面恢复时：累加 totalHiddenTime
下次 check() 时：
  - distractionStartTime += totalHiddenTime（补偿隐藏期间的时间差）
  - lastPopupTime += totalHiddenTime
  - totalHiddenTime = 0
```

---

## 五、白名单机制

### 5.1 存储格式

```javascript
// 新格式（当前）
whitelist: {
    "BV1xx411c7mZ": { name: "高等数学第一章", addedAt: 1710000000000 },
    "BV2xx411c7mY": { name: "大学英语词汇", addedAt: 1710000001000 }
}

// 旧格式（兼容）
whitelist: ["BV1xx411c7mZ", "BV2xx411c7mY"]
```

### 5.2 关键函数

| 函数 | 功能 |
|------|------|
| `ConfigManager.isWhitelisted(bv)` | 检查BV号是否在白名单（兼容新旧格式） |
| `ConfigManager.addToWhitelist(bv, courseName)` | 添加到白名单（含重名检查） |
| `ConfigManager.removeFromWhitelist(bv)` | 从白名单移除 |
| `ConfigManager.getWhitelistArray()` | 获取白名单数组 `[{bv, name}, ...]` |
| `ConfigManager.getCourseName(bv)` | 获取课程名称 |
| `ConfigManager.getDefaultReturnBV()` | 获取默认返回BV号（配置 > 白名单第一项 > null） |

---

## 六、配置系统（ConfigManager）

### 6.1 加载流程

```
1. localStorage.getItem("bilibiliStudyAssistant_config")
2. JSON.parse(stored)
3. 与 USER_CONFIG 合并（浅合并，floatingWindow 单独深合并）
4. 返回 currentConfig
```

### 6.2 配置项一览

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `studyPeriods` | `string[][]` | 学习时段 `[["08:00","12:00"], ...]` |
| `whitelist` | `object` | 白名单 `{BV号: {name, addedAt}}` |
| `learningVideoPanel.defaultBV` | `string` | 默认返回BV号 |
| `interventionStages` | `array` | 干预阶段配置 `[{threshold, interval}]` |
| `vocabulary` | `string[]` | 词汇库 `["中文:english", ...]` |
| `masteryThreshold` | `number` | 连续正确次数达标（默认3） |
| `includeMasteredWords` | `boolean` | 是否包含已掌握单词 |
| `floatingWindow` | `object` | 浮动窗配置 `{enabled, defaultPosition, showStats}` |
| `statsPeriod` | `string` | 统计周期 `"day"` / `"week"` |

### 6.3 学习时段判断（isStudyTime）

```
1. 获取当前时间的"分钟数"（hours * 60 + minutes）
2. 遍历 studyPeriods 配置
3. 支持跨日时段（如 22:00 → 06:00）
4. 任一时段匹配即返回 true
```

---

## 七、统计系统（StatisticsTracker）

### 7.1 数据结构

```javascript
timeStats: {
    lastResetDate: "2026-04-12",     // 日期字符串
    today: {
        studyTime: 0,                 // 有效学习秒数
        distractionTime: 0,           // 分心秒数
        distractionCount: 0,          // 分心次数
        wordAccuracy: { correct: 0, total: 0 }
    },
    history: [                        // 最近30天历史
        { date, studyTime, distractionTime, distractionCount, wordAccuracy }
    ]
}
```

### 7.2 每日归档（checkDailyArchive）

```
1. 比较 lastResetDate 与当天日期
2. 若不一致 → 将 today 数据 push 到 history
3. history 保留最近30天
4. 重置 today 数据
```

### 7.3 统计更新时机

| 函数 | 调用时机 |
|------|----------|
| `addStudyTime(1)` | 主定时器每秒，当前BV在白名单且在学习时段 |
| `addDistractionTime(1)` | 主定时器每秒，当前BV不在白名单且在学习时段 |
| `incrementDistractionCount()` | 用户点击"确认离开学习" |
| `recordWordAttempt(correct)` | 单词验证/填空提交答案时 |

---

## 八、UI系统

### 8.1 弹窗/面板类型

| 类型 | 函数 | 触发条件 | 弹窗ID |
|------|------|----------|--------|
| 确认弹窗 | `showConfirmModal()` | 首次检测到非白名单视频 | `bilibili-study-confirm-modal` |
| 填空弹窗 | `showStage2Modal()` | Stage 2，每120秒 | `bilibili-study-stage2-modal` |
| 单词验证弹窗 | `showWordVerifierModal()` | Stage 3/4，按间隔 | `bilibili-study-word-modal` |
| 简易提醒弹窗 | `showSimpleStage2Modal()` | Stage 2 但无词汇库 | `bilibili-study-stage2-modal` |
| 添加白名单弹窗 | `showAddWhitelistModal()` | 点击"添加到白名单" | `bilibili-study-add-whitelist-modal` |
| 详细统计面板 | `DetailPanel.open()` | 点击浮动窗 | `bilibili-study-detail-modal` |

### 8.2 弹窗状态机（MODAL_STATES）

```
NONE → CONFIRM      (首次非白名单访问)
NONE → STAGE2       (Stage 2 弹窗间隔到达)
NONE → WORD_VERIFY  (Stage 3/4 弹窗间隔到达)
* → NONE            (关闭弹窗)
```

同一时间只允许一个弹窗存在（`modalState !== NONE` 时跳过新弹窗）。

### 8.3 浮动窗状态

| 状态 | 背景色 | 文字内容 |
|------|--------|----------|
| 学习中 | `rgba(34, 139, 34, 0.7)` 绿色 | "学习中" + 今日学习时长 |
| 分心中 | `rgba(220, 20, 60, opacity)` 红色 | "分心中" + 已停留时长 |

全屏时浮动窗自动隐藏。

---

## 九、主题系统（暗色模式）

### 9.1 实现方式

```
CSS 层级：
  .bilibili-study-dark-mode .bilibili-study-modal     → background: #1e1e1e
  .bilibili-study-dark-mode .bilibili-study-modal-header → background: #252525
  .bilibili-study-dark-mode .bilibili-study-btn         → background: #333
  ...

JS 触发：
  DetailPanel.toggleTheme()
    → saveTheme(newTheme)          → localStorage 持久化
    → applyTheme(newTheme)         → 给 modalElement 加/删 CSS class
    → applyCurrentThemeToModal()   → 给干预弹窗加/删 CSS class
```

### 9.2 存储键

```
THEME_KEY = 'bilibiliStudyAssistant_theme'
值: 'light' | 'dark'
```

---

## 十、全屏兼容

### 10.1 问题描述

B站播放器全屏使用 Fullscreen API，`document.fullscreenElement` 会在视觉层级上覆盖 `document.body` 的子元素，无论 `z-index` 多高。

### 10.2 解决方案

```javascript
function getModalContainer() {
    const fsEl = document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement;
    return fsEl || document.body;
}
```

弹窗创建时使用 `getModalContainer().appendChild(modal)`，确保：
- **全屏时**：弹窗挂载到全屏元素内部，可以正常显示
- **非全屏时**：挂载到 `document.body`，与之前行为一致

### 10.3 全屏监听

```javascript
// FloatingWindow 中的全屏监听
document.addEventListener('fullscreenchange', handleFullscreenChange);
// 全屏时隐藏浮动窗，非全屏时恢复显示
element.style.display = isFullscreen ? 'none' : 'block';
```

---

## 十一、SPA路由处理

B站是 SPA 应用，页面切换不会重新加载，需要特殊处理。

### 11.1 路由变更检测（PageMonitor.observeSPAChanges）

```
1. 监听 popstate 事件（浏览器前进/后退）
2. Hook history.pushState / history.replaceState
3. MutationObserver 监听 DOM 变化
4. 以上任一触发时 → onRouteChange()
```

### 11.2 路由变更处理

```
路由变化时：
  1. 重置 __bilibiliStudyAppState（currentStage=0, distractionStartTime=null）
  2. 调用 InterventionController.reset()
  3. 移除所有视觉干预 CSS class
  4. 重新创建/销毁浮动窗
```

---

## 十二、单词学习系统

### 12.1 词汇库格式

```javascript
vocabulary: ["学习:study", "专注:focus", "进步:progress", ...]
// 格式："中文:英文"
```

### 12.2 单词选择逻辑

```
1. parseVocabulary() → [{chinese, english}, ...]
2. 根据 includeMasteredWords 过滤已掌握单词
3. 若全部掌握，回退到使用全部单词
4. 随机选择一个
```

### 12.3 掌握度追踪

```javascript
wordRecords: {
    words: {
        "学习": {
            chinese: "学习",
            english: "study",
            consecutiveCorrect: 0,    // 连续正确次数
            mastered: false,          // 是否已掌握
            totalAttempts: 0,         // 总尝试次数
            correctAttempts: 0        // 正确次数
        }
    },
    recentAnswers: [                  // 最近50条答题记录
        { word: "学习", correct: true, timestamp: 1710000000000 }
    ]
}
```

### 12.4 填空逻辑（Stage 2）

```javascript
function createHiddenWord(word) {
    const hiddenCount = Math.max(1, Math.floor(word.length * 0.4));  // 隐藏40%
    // 随机选择要隐藏的字母位置，替换为下划线
    // 结果用空格分隔显示，如 "s _ u _ y"
}
```

### 12.5 逐步提示逻辑（Stage 3/4 单词验证）

```
每次回答错误 → revealedLetters++
重新渲染弹窗，显示更多字母：
  第0次提示: _ _ _ _ _
  第1次提示: s _ _ _ _
  第2次提示: s t _ _ _
  ...
全部字母揭示后 → 5~6秒后自动关闭弹窗
```

---

## 十三、存储系统

### 13.1 存储键映射

| 模块 | 存储键 |
|------|--------|
| 配置 | `bilibiliStudyAssistant_config` |
| 统计 | `bilibiliStudyAssistant_stats` |
| 单词 | `bilibiliStudyAssistant_words` |
| 主题 | `bilibiliStudyAssistant_theme` |
| 浮动窗位置 | `bilibiliStudyAssistant_floatingPosition` |
| Tab ID | `sessionStorage:bilibiliStudyAssistant_tabId` |

### 13.2 内存回退

当 `localStorage` 不可用时（如隐私模式），自动回退到内存对象 `memoryStorage`，确保脚本功能不中断。

---

## 十四、关键数据流

```
用户访问B站视频页
    │
    ├─ URL匹配 /video/BV* ?
    │     └─ 否 → 脚本不生效
    │     └─ 是 ↓
    │
    ├─ 初始化（配置、数据模块、页面监控）
    │
    └─ 主定时器每秒运行
          │
          ├─ 判断学习时段 + 白名单 → 更新统计
          │
          └─ InterventionController.check()
                │
                ├─ 白名单内 → isStudying=true, 清除干预
                │
                └─ 非白名单 → 进入分心状态
                      │
                      ├─ Stage 0: 显示确认弹窗
                      ├─ Stage 1: 渐进视觉干扰
                      ├─ Stage 2: 填空弹窗 + 强视觉干扰
                      ├─ Stage 3: 单词验证 + 强视觉干扰
                      └─ Stage 4: 高频单词验证 + 最强视觉干扰
```
