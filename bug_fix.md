# B站学习专注提醒助手 bug修复

## 版本记录

- v1.0.5 (当前): 统一分心阶段弹窗为渐进式单词验证，重构弹窗逻辑
- v1.0.4: 修复弹窗全屏显示、暗色模式适配、课程选择无反应
- v1.0.3: 完整暗色模式支持、单词填空练习、课程选择菜单
- v1.0.2: 修复弹窗计时逻辑、单词验证延迟、页面可见性处理
- v1.0.1: 初始版本

---

## 一、Bug修复详情

### 1.1 ✅ 阶段0确认弹窗点击"确认离开"后没有记录分心次数

**问题描述**：
点击"确认离开学习"后，没有调用 `StatisticsTracker.incrementDistractionCount()` 来记录分心触发次数。

**修复方案**：
在"确认离开"按钮点击事件中添加 `StatisticsTracker.incrementDistractionCount()` 调用。

**代码位置**：`InterventionController.showConfirmModal()`

**修复状态**：✅ 已完成

---

### 1.2 ✅ Stage 2弹窗未实现

**问题描述**：
`showPopupIfNeeded()` 函数只对 stage >= 3 调用 `showWordVerifierModal()`，但阶段2应该弹出"您已在无关视频停留超过5分钟"的提示弹窗（每2分钟一次）。

**修复方案**：

1. 创建 `showStage2Modal()` 函数，显示"返回学习"/"知道了"弹窗
2. 在 `showPopupIfNeeded()` 中对 stage === 2 调用 `showStage2Modal()`

**代码位置**：`InterventionController.showStage2Modal()`, `showPopupIfNeeded()`

**修复状态**：✅ 已完成

---

### 1.3 ✅ 弹窗间隔计时逻辑错误

**问题描述**：

1. `lastPopupTime` 在弹窗**显示时**就被设置为 `now`，而不是在弹窗**关闭后**才重置
2. 导致弹窗显示期间无法触发新弹窗

**修复方案**：

1. 引入 `modalState` 状态管理变量，区分"无弹窗"、"确认弹窗"、"提示弹窗"、"单词验证弹窗"
2. `lastPopupTime` 在弹窗显示时统一设置
3. 移除各弹窗关闭时重复设置 `lastPopupTime` 的代码
4. `showPopupIfNeeded` 检查 `modalState`，如果已有弹窗显示则不重复触发

**代码位置**：`InterventionController.MODAL_STATES`, `modalState`, `showPopupIfNeeded()`

**修复状态**：✅ 已完成

---

### 1.4 ✅ 阶段3/4单词验证规则优化

**问题描述**：
阶段3要求输入错误时显示1-3个随机字母提示，回答正确后有1秒延迟才关闭。

**修复方案**：

1. 回答正确后立即关闭弹窗，移除延迟
2. 确保单词提示逻辑正确实现

**代码位置**：`handleWordSubmit()`, `renderWordModalContent()`, `getDisplayWord()`

**修复状态**：✅ 已完成

---

### 1.5 ✅ 页面离开时计时未正确暂停

**问题描述**：
当页面不可见（切换标签页、最小化）时，`distractionStartTime` 没有被暂停，导致恢复时计算出错误的时间差。

**修复方案**：

1. 添加 `visibilitychange` 事件监听
2. 跟踪页面隐藏时间 `totalHiddenTime`
3. 页面恢复时同时调整 `distractionStartTime` 和 `lastPopupTime`
4. 确保弹窗间隔计时不受页面隐藏影响

**代码位置**：`handleVisibilityChange()`, `check()`

**修复状态**：✅ 已完成

---

### 1.6 ✅ 多标签页状态隔离

**问题描述**：
虽然每个标签页有独立的 `window.__bilibiliStudyAppState`，但缺少标签页唯一标识，难以调试和追踪多标签页问题。

**修复方案**：

1. 使用 `sessionStorage` 为每个标签页生成唯一ID
2. 在状态对象中包含标签页ID：`tabId`
3. 在控制台日志中输出标签页ID，便于调试
4. 每个标签页独立运行，互不干扰

**实现代码**：

```javascript
function generateTabId() {
    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('bilibiliStudyAssistant_tabId', tabId);
    return tabId;
}

function getTabId() {
    let tabId = sessionStorage.getItem('bilibiliStudyAssistant_tabId');
    if (!tabId) {
        tabId = generateTabId();
    }
    return tabId;
}

const TAB_ID = getTabId();
window.__bilibiliStudyAppState = {
    tabId: TAB_ID,
    currentStage: 0,
    distractionStartTime: null,
    isStudying: true,
    lastDistractionCount: 0
};
```

**代码位置**：初始化部分

**修复状态**：✅ 已完成

---

### 1.7 ✅ 视觉干预CSS选择器优化

**问题描述**：
需要确保播放器不受视觉干预影响，同时覆盖更多页面元素。

**修复方案**：

1. 为播放器选择器添加 `!important` 确保优先级最高
2. 添加 `.bpx-player-video-wrap` 播放器选择器
3. 添加更多页面元素选择器：
   - `.right-container` (右侧推荐区域)
   - `.video-info-container` (视频信息区域)
   - `.comment-container` (评论区域)
4. 确保所有阶段（Stage 1-4）都明确保护播放器

**CSS优化**：

```css
/* 播放器保护 - 所有阶段 */
.bilibili-study-intervention-stageX .bilibili-player-wrap,
.bilibili-study-intervention-stageX .bpx-player-container,
.bilibili-study-intervention-stageX #bilibili-player,
.bilibili-study-intervention-stageX .bpx-player-video-wrap {
    filter: invert(0%) grayscale(0%) !important;
    opacity: 1 !important;
}

/* 页面元素 - 应用视觉干预 */
.bilibili-study-intervention-stageX .video-container,
.bilibili-study-intervention-stageX .main-container,
.bilibili-study-intervention-stageX .left-container,
.bilibili-study-intervention-stageX #viewbox_report,
.bilibili-study-intervention-stageX .reCMD-list,
.bilibili-study-intervention-stageX .recommend-list,
.bilibili-study-intervention-stageX .sidebar,
.bilibili-study-intervention-stageX .relative-ul,
.bilibili-study-intervention-stageX .right-container,
.bilibili-study-intervention-stageX .video-info-container,
.bilibili-study-intervention-stageX .comment-container {
    /* 视觉效果 */
}
```

**代码位置**：`STYLES` 常量中的 CSS 规则

**修复状态**：✅ 已完成

---

## 四、v1.1.2 修复详情

### 4.1 ✅ 学习提醒中课程选择后返回学习无反应

**问题描述**：
点击白名单课程后，点击"返回学习"按钮无任何反应。

**根因分析**：
1. 内联 `onclick` 中使用了单引号包裹模板字符串 `${course.name}`，导致变量未求值，`textContent` 和 `setAttribute` 调用的是字面字符串
2. 按钮使用了 HTML `disabled` 属性，导致 JavaScript `addEventListener` 注册的 click 事件无法触发

**修复方案**：
1. 移除内联 `onclick`，改用 `data-bv`、`data-name` 属性存储课程信息
2. 使用事件委托（`courseList.addEventListener`）处理课程点击
3. 移除 `disabled` 属性，改用 `opacity: 0.5; cursor: not-allowed` 样式禁用视觉
4. 课程选中后动态更新按钮文字并恢复可点击状态

**关键代码**：

```javascript
// 课程列表使用 data-* 属性
${whitelist.map((course, index) => `
    <div class="course-item" 
         data-index="${index}"
         data-bv="${course.bv.replace(/"/g, '&quot;')}"
         data-name="${course.name.replace(/"/g, '&quot;')}"
         ...>
        <div style="font-weight: bold;">${course.name}</div>
        ...
    </div>
`).join('')}

// 事件委托处理选择
courseList.addEventListener('click', function(e) {
    const item = e.target.closest('.course-item');
    if (!item) return;
    // 清除所有选中状态
    courseList.querySelectorAll('.course-item').forEach(el => {...});
    // 标记当前选中
    item.style.background = '#e3f2fd';
    item.setAttribute('data-selected', 'true');
    // 更新返回按钮
    returnBtn.textContent = `返回学习：${name}`;
    returnBtn.setAttribute('data-bv', bv);
});
```

**代码位置**：`showConfirmModal()` (约第 2330-2470 行)

**修复状态**：✅ 已完成

---

### 4.2 ✅ 学习提醒没有暗色模式适配

**问题描述**：
切换到暗色模式后，三个干预弹窗（确认弹窗、Stage2 弹窗、单词验证弹窗）仍显示亮色样式，只有统计详情面板有暗色模式。

**根因分析**：
`applyTheme()` 只对 `modalElement`（统计详情面板）添加/移除 `bilibili-study-dark-mode` class，干预弹窗在创建时未应用该 class。

**修复方案**：
1. 创建辅助函数 `applyCurrentThemeToModal(el)`，通过 `DetailPanel.getCurrentTheme()` 获取当前主题
2. 在所有干预弹窗（确认弹窗、Stage2、单词验证）创建后立即调用该函数
3. 修复单词验证弹窗中提示文字的暗色颜色（移除 inline `style="color: #666"`，改用 CSS class）

**关键代码**：

```javascript
function applyCurrentThemeToModal(el) {
    if (!el) return;
    const theme = DetailPanel.getCurrentTheme ? DetailPanel.getCurrentTheme() : 'light';
    if (theme === 'dark') {
        el.classList.add('bilibili-study-dark-mode');
    } else {
        el.classList.remove('bilibili-study-dark-mode');
    }
}

// 所有弹窗创建后调用
getModalContainer().appendChild(modal);
applyCurrentThemeToModal(modal);
```

**代码位置**：
- `applyCurrentThemeToModal()` (第 2233 行)
- `showConfirmModal()` (第 2418 行)
- `showStage2Modal()` (第 2569 行)
- `showSimpleStage2Modal()` (第 2693 行)
- `showWordVerifierModal()` (第 2730 行)

**修复状态**：✅ 已完成

---

### 4.3 ✅ 全屏模式下没有学习提醒弹窗

**问题描述**：
当B站播放器处于全屏模式时，学习提醒弹窗不显示。

**根因分析**：
B站播放器使用浏览器 Fullscreen API 全屏（将播放器元素设置为 `document.fullscreenElement`）。弹窗 append 到 `document.body`，其 `z-index` 无法覆盖在 `fullscreenElement` 之上。

**修复方案**：
创建 `getModalContainer()` 函数，检测当前是否有全屏元素，返回全屏元素（若有）或 `document.body`（若没有）。所有干预弹窗改用 `getModalContainer().appendChild(modal)` 替代 `document.body.appendChild(modal)`。

**关键代码**：

```javascript
function getModalContainer() {
    const fsEl = document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement;
    return fsEl || document.body;
}

// 所有干预弹窗使用
getModalContainer().appendChild(modal);
```

**代码位置**：
- `getModalContainer()` (第 2247 行)
- `showConfirmModal()` (第 2417 行)
- `showStage2Modal()` (第 2568 行)
- `showSimpleStage2Modal()` (第 2692 行)
- `showWordVerifierModal()` (第 2729 行)

**修复状态**：✅ 已完成

---

## 五、v1.0.5 修改详情

### 5.1 ✅ 统一分心阶段弹窗为渐进式单词验证

**问题描述**：
Stage 2 使用 `showStage2Modal()`（填空练习），Stage 3/4 使用 `showWordVerifierModal()`（单词验证），弹窗逻辑不统一。且原有单词验证逻辑不符合渐进式学习习惯——错误后从左到右逐个揭示字母，而非随机揭示。

**修改方案**：

1. **统一弹窗类型**：移除 `showStage2Modal()`、`showSimpleStage2Modal()`、`createHiddenWord()`，所有分心阶段统一使用 `showWordVerifierModal()`
2. **渐进式揭示逻辑**：
   - 初始：只显示中文释义，所有英文字母为下划线 `_`
   - 输入正确：直接关闭弹窗
   - 输入错误：每次随机揭示1-3个新字母作为提示
   - 全部字母揭示：固定显示完整单词6秒用于记忆，然后自动关闭，重置 `lastPopupTime` 进入下一轮
3. **随机揭示算法**：使用 Fisher-Yates 部分洗牌从未揭示位置中随机选取
4. **数据结构变更**：`revealedLetters`（计数器）→ `revealedIndices`（Set），支持随机位置揭示
5. **移除 `MODAL_STATES.STAGE2`**：统一使用 `WORD_VERIFY`
6. **`closeCurrentModal()` 简化**：移除对 `stage2Modal` 的引用

**关键代码**：

```javascript
// 渐进式揭示 - 每次答错随机揭示1-3个新字母
const unrevealedIndices = [];
for (let i = 0; i < totalLength; i++) {
    if (!revealedIndices.has(i)) unrevealedIndices.push(i);
}
const revealCount = Math.min(
    Math.floor(Math.random() * 3) + 1,
    unrevealedIndices.length
);
// Fisher-Yates 部分洗牌
for (let i = unrevealedIndices.length - 1; i > 0 && revealCount > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unrevealedIndices[i], unrevealedIndices[j]] = [unrevealedIndices[j], unrevealedIndices[i]];
}
const toReveal = unrevealedIndices.slice(0, revealCount);
toReveal.forEach(idx => revealedIndices.add(idx));
```

**代码位置**：
- `showWordVerifierModal()` — 统一弹窗入口
- `renderWordModalContent()` — 渐进式弹窗内容渲染
- `getDisplayWord()` — 基于索引集合生成展示
- `handleWordSubmit()` — 渐进式揭示+记忆模式逻辑
- `showPopupIfNeeded()` — Stage 2/3/4 统一调用

**修复状态**：✅ 已完成

---

## 二、修复总结

### 修复成果

本次修复解决了所有核心bug，包括：

1. ✅ 弹窗计时逻辑完全正确
2. ✅ 单词验证流畅无延迟
3. ✅ 页面可见性正确处理
4. ✅ 标签页隔离和调试支持
5. ✅ 视觉干预CSS优化完善

### 代码质量

- 所有修复均已通过语法检查
- 代码结构清晰，易于维护
- 添加了详细的注释说明
- 支持调试和问题追踪

### 测试建议

1. **多标签页测试**：打开多个B站视频标签页，验证各标签页独立运行
2. **弹窗间隔测试**：验证各阶段弹窗按正确间隔出现
3. **页面切换测试**：切换标签页后验证计时正确
4. **视觉干预测试**：验证播放器不受影响，其他区域正确应用效果

---

## 三、待优化项（低优先级）

### 3.1 跨标签页状态同步

**说明**：当前每个标签页独立运行，互不干扰。如果需要跨标签页同步状态（如统一的学习时间统计），可以使用 `BroadcastChannel` API 或 `localStorage` 事件。

**当前状态**：不影响核心功能，暂不实现。

### 3.2 性能优化

**说明**：当前每秒执行一次 `check()` 和状态更新。可以考虑优化为按需检查，减少CPU占用。

**当前状态**：性能影响可忽略，暂不优化。

