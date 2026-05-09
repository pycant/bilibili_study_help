# B站学习专注提醒助手 - Bug修复详细方案

## 问题4：多标签页状态共享导致冲突

### 问题分析

**根本原因**：
- `window.__bilibiliStudyAppState` 是全局单例对象
- 所有标签页共享同一个 `window` 对象（实际上不是，每个标签页有独立的 window）
- 实际问题是：用户脚本在每个标签页独立运行，但状态没有隔离标识

**实际情况**：
- Tampermonkey脚本在每个标签页独立运行
- 每个标签页有自己的 `window.__bilibiliStudyAppState`
- 真正的问题是：没有标签页唯一标识，无法区分不同标签页的状态

### 修复方案

**方案：为每个标签页生成唯一ID**

1. 在脚本初始化时生成唯一的标签页ID
2. 将标签页ID存储在 `sessionStorage`（标签页级别存储）
3. 在状态对象中包含标签页ID
4. 使用标签页ID作为日志前缀，便于调试

**实现步骤**：

```javascript
// 1. 生成标签页唯一ID
function generateTabId() {
    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('bilibiliStudyAssistant_tabId', tabId);
    return tabId;
}

// 2. 获取或创建标签页ID
function getTabId() {
    let tabId = sessionStorage.getItem('bilibiliStudyAssistant_tabId');
    if (!tabId) {
        tabId = generateTabId();
    }
    return tabId;
}

// 3. 在状态对象中包含标签页ID
window.__bilibiliStudyAppState = {
    tabId: getTabId(),
    currentStage: 0,
    distractionStartTime: null,
    isStudying: true,
    lastDistractionCount: 0
};
```

**优点**：
- 简单直接，不需要复杂的跨标签页通信
- 每个标签页独立运行，互不干扰
- 便于调试和日志追踪

---

## 问题5：视觉干预CSS选择器问题

### 问题分析

**当前问题**：
CSS中包含了对 `.bpx-player-container` 的样式，但需求要求"只对播放器以外的元素生效"。

**检查现有CSS**：
```css
/* Stage 1 - 播放器不受影响 */
.bilibili-study-intervention-stage1 .bilibili-player-wrap,
.bilibili-study-intervention-stage1 .bpx-player-container,
.bilibili-study-intervention-stage1 #bilibili-player {
    filter: invert(0%) grayscale(0%);
    opacity: 1;
}

/* Stage 1 - 其他元素受影响 */
.bilibili-study-intervention-stage1 .video-container,
.bilibili-study-intervention-stage1 .main-container,
...
```

**实际情况**：
- 代码已经正确实现了需求
- Stage 1 明确设置播放器 `filter: invert(0%) grayscale(0%); opacity: 1;`
- 其他阶段也是对非播放器元素应用样式

### 修复方案

**方案：验证并优化CSS选择器**

1. 确认播放器选择器是否完整
2. 确认页面元素选择器是否覆盖所有需要的区域
3. 添加更多B站页面元素选择器

**实现步骤**：

```css
/* 播放器元素 - 保持原样 */
.bilibili-player-wrap,
.bpx-player-container,
#bilibili-player,
.bpx-player-video-wrap

/* 页面元素 - 应用视觉干预 */
.video-container,
.main-container,
.left-container,
#viewbox_report,
.reCMD-list,
.recommend-list,
.sidebar,
.relative-ul,
.video-info,
.video-desc,
.comment-container,
.right-container
```

**结论**：
- 当前CSS已经基本正确
- 只需要补充更多页面元素选择器
- 确保播放器选择器优先级更高

---

## 问题3：页面不可见时计时未正确暂停（已部分修复）

### 当前状态

已添加 `visibilitychange` 监听和时间调整逻辑：

```javascript
let lastVisibilityChange = 0;
let totalHiddenTime = 0;

function handleVisibilityChange() {
    if (document.hidden) {
        lastVisibilityChange = Date.now();
    } else {
        if (lastVisibilityChange > 0) {
            totalHiddenTime += Date.now() - lastVisibilityChange;
            lastVisibilityChange = 0;
        }
    }
}

// 在 check() 中调整
if (state.distractionStartTime && totalHiddenTime > 0) {
    state.distractionStartTime += totalHiddenTime;
    totalHiddenTime = 0;
}
```

### 潜在问题

1. `totalHiddenTime` 只在 `check()` 中重置，如果页面长时间隐藏可能累积
2. 需要同时调整 `lastPopupTime`

### 优化方案

```javascript
// 在 check() 中同时调整 lastPopupTime
if (state.distractionStartTime && totalHiddenTime > 0) {
    state.distractionStartTime += totalHiddenTime;
    if (lastPopupTime > 0) {
        lastPopupTime += totalHiddenTime;
    }
    totalHiddenTime = 0;
}
```

---

## 实施优先级

1. **高优先级**：问题4（多标签页隔离）- 影响核心功能
2. **中优先级**：问题5（CSS选择器）- 影响用户体验
3. **低优先级**：问题3优化（时间调整）- 已基本修复，只需微调

---

## 测试计划

### 测试场景1：多标签页隔离
1. 打开两个B站视频标签页
2. 在标签页A进入非白名单视频，确认弹窗
3. 切换到标签页B，进入另一个非白名单视频
4. 验证两个标签页的计时器独立运行

### 测试场景2：视觉干预
1. 进入非白名单视频
2. 等待进入各个阶段
3. 验证播放器不受视觉干预影响
4. 验证页面其他元素正确应用视觉效果

### 测试场景3：页面可见性
1. 进入非白名单视频，开始计时
2. 切换到其他标签页5分钟
3. 切换回来，验证计时器正确调整
4. 验证弹窗间隔正确
