# B站学习专注提醒助手 Bug 分析文档

## 一、问题概述

用户反馈的主要问题：
1. **未能间隔时长按时弹提示窗** - 弹窗没有按照设定的时间间隔出现
2. **超时后仍然是点击继续学习按钮，而没有单词输入** - 到了阶段3/4应该出现单词验证，但仍然显示简单的"继续浏览"按钮

用户怀疑原因：**多开窗口造成的问题，同时打开学习网页和视频网页导致算法失效**

---

## 二、代码问题分析

### 问题1：阶段0确认弹窗点击后没有正确记录分心次数

**代码位置**：`InterventionController.showConfirmModal()` (约第1680行)

**问题描述**：
```javascript
// Yes button - continue with intervention
document.getElementById('bilibili-study-confirm-yes').addEventListener('click', function() {
    modal.remove();
    confirmModalShown = false;
    // Start tracking distraction
    if (window.__bilibiliStudyAppState) {
        window.__bilibiliStudyAppState.distractionStartTime = Date.now();
        window.__bilibiliStudyAppState.currentStage = 1;
    }
});
```

**问题**：点击"确认离开学习"后，**没有调用 `StatisticsTracker.incrementDistractionCount()`** 来记录分心触发次数。这导致 `distractionCount` 统计不准确。

---

### 问题2：`showPopupIfNeeded` 的计时逻辑存在严重缺陷

**代码位置**：`InterventionController.showPopupIfNeeded()` (约第1760行)

**问题描述**：
```javascript
function showPopupIfNeeded(stage) {
    const config = ConfigManager.get();
    const stages = config.interventionStages || [];
    const stageConfig = stages[stage];

    if (!stageConfig || stageConfig.interval === 0) {
        return; // No popup for this stage
    }

    const now = Date.now();
    const intervalMs = stageConfig.interval * 1000;

    if (now - lastPopupTime >= intervalMs) {
        lastPopupTime = now;

        // Stage 3+ requires word verification
        if (stage >= 3) {
            showWordVerifierModal();
        }
        // 注意：Stage 2 没有弹窗逻辑！
    }
}
```

**严重问题**：
1. **Stage 2 (5-10分钟) 没有实现弹窗** - 代码只对 stage >= 3 调用 `showWordVerifierModal()`，但阶段2应该弹出"您已在无关视频停留超过5分钟"的提示弹窗
2. **弹窗关闭与计时器重置机制错误** - `lastPopupTime` 在弹窗显示时就被设置为 `now`，而不是在弹窗**关闭后**才重置。导致如果弹窗一直显示，下次检查时 `now - lastPopupTime` 仍然小于间隔时间
3. **`wordVerifierModalShown` 标志在弹窗关闭时没有正确重置** - 当单词验证弹窗显示后，即使关闭了，`wordVerifierModalShown` 仍然为 true，导致下一次 `showPopupIfNeeded` 直接 return

---

### 问题3：单词验证弹窗的显示条件逻辑混乱

**代码位置**：`showWordVerifierModal()` 和 `showPopupIfNeeded()`

**问题描述**：
1. `showWordVerifierModal()` 内部有 `if (wordVerifierModalShown) return;` 保护，但关闭时没有重置为 false
2. 阶段2应该有简单弹窗（"返回学习"/"知道了"），但代码完全没有实现

---

### 问题4：Stage 3/4 的单词验证弹窗关闭逻辑错误

**代码位置**：`WordVerifier` 模块的 `showWordVerifierModal()`

**问题描述**：
```javascript
// Submit button
document.getElementById('bilibili-study-word-submit').addEventListener('click', function() {
    // ... 更新单词记录 ...
    
    setTimeout(() => {
        modal.remove();
        wordVerifierModalShown = false;  // 这里才设置为 false
    }, 1500);
});

// Skip button
document.getElementById('bilibili-study-word-skip').addEventListener('click', function() {
    modal.remove();
    wordVerifierModalShown = false;  // 跳过时也设置为 false
});
```

**问题**：虽然关闭时正确重置了 `wordVerifierModalShown`，但是：
1. **点击提交后有1.5秒延迟才重置**，这期间如果 `check()` 被调用，会因为 `wordVerifierModalShown === true` 而无法触发新的弹窗
2. **单词正确后弹窗直接关闭，没有"停留6秒"的要求**（需求中阶段3要求单词完整显示后停留6秒）

---

### 问题5：多标签页状态共享导致冲突

**问题描述**：
`window.__bilibiliStudyAppState` 是全局单例对象。当用户同时打开多个B站视频标签页时：
- 所有标签页共享同一个 `__bilibiliStudyAppState`
- `lastPopupTime`、`confirmModalShown`、`wordVerifierModalShown` 等变量在 `InterventionController` 模块内也是单例
- 这导致多标签页互相干扰计时逻辑

**表现**：
- 在标签页A点击"继续浏览"，状态被设置
- 切换到标签页B操作，`lastPopupTime` 被更新
- 切换回标签页A时，时间间隔计算错误

---

### 问题6：页面离开时计时未正确暂停

**代码位置**：`check()` 函数 (约第1815行)

**问题描述**：
```javascript
// Not on video page or page not active
if (!isVideoPage || !isPageActive) {
    return;  // 直接返回，没有暂停任何计时
}
```

当页面不可见（如切换标签页）时，`distractionStartTime` 没有被暂停，导致：
- 切换回页面时，`distractionDuration` 计算出错误的时间差
- 可能直接跳过中间阶段

---

### 问题7：视觉干预样式的CSS选择器问题

**代码位置**：`STYLES` 常量

**问题描述**：
```css
.bilibili-study-intervention-stage1 .bpx-player-container { filter: invert(10%); }
.bilibili-study-intervention-stage2 .bpx-player-container { filter: grayscale(20%); }
.bilibili-study-intervention-stage3 .bpx-player-container { opacity: 0.8; }
.bilibili-study-intervention-stage4 .bpx-player-container { opacity: 0.6; filter: grayscale(10%); }
```

**问题**：
1. **需求要求只对播放器以外的元素生效**，但这里却选择了 `.bpx-player-container`（播放器本身）
2. **样式没有真正实现需求**：需求要求的是页面整体反相、灰度、不透明度变化，而不是播放器

---

## 三、修复方案建议

### 1. 修复分心次数统计
在点击"确认离开学习"按钮时，添加 `StatisticsTracker.incrementDistractionCount()` 调用

### 2. 修复弹窗间隔计时逻辑
- `lastPopupTime` 应该在弹窗**完全关闭后**才重置
- 或者改用状态机管理弹窗状态

### 3. 实现Stage 2弹窗
阶段2需要实现"返回学习/知道了"弹窗，不是单词验证

### 4. 多标签页隔离
- 使用标签页ID隔离不同标签页的状态
- 或者使用 `BroadcastChannel` API 进行标签页间通信

### 5. 页面可见性变化时正确处理计时
- 页面不可见时暂停计时
- 恢复时正确计算时间差

### 6. 修复CSS样式
- 视觉干预应该作用于页面内容，而非播放器
- 符合需求中的"反相、灰度、不透明度"要求

---

## 四、测试建议

### 复现步骤：
1. 打开两个B站视频标签页（一个白名单视频，一个非白名单视频）
2. 确保处于学习时段
3. 在非白名单视频页面停留，观察计时器行为
4. 检查切换标签页后计时是否正确

### 预期行为：
- 阶段0：立即弹出确认框
- 阶段1（1-5分钟）：视觉渐进变化，无弹窗
- 阶段2（5-10分钟）：每2分钟弹出提示框
- 阶段3（10-20分钟）：每30秒弹出单词验证
- 阶段4（20分钟以上）：每15秒弹出严格单词验证

---

## 五、关键代码流程图

```
用户进入非白名单视频页面
         │
         ▼
   检查学习时段
         │
    ┌────┴────┐
    │         │
  否         是
    │         │
    ▼         ▼
  不触发    显示Stage0确认弹窗
  干预      "确认离开学习" / "立即返回学习"
                   │
         ┌─────────┴─────────┐
         │                   │
    点击"确认离开"      点击"立即返回"
         │                   │
         ▼                   ▼
   记录分心次数      重置状态为学习中
   开始计时
         │
         ▼
   计时达到1分钟
         │
         ▼
   进入Stage1 - 视觉干预
         │
         ▼
   计时达到5分钟
         │
         ▼
   进入Stage2 - 低频弹窗(每2分钟)
         │
         ▼
   计时达到10分钟
         │
         ▼
   进入Stage3 - 中频弹窗+单词验证(每30秒)
         │
         ▼
   计时达到20分钟
         │
         ▼
   进入Stage4 - 高频弹窗+严格验证(每15秒)
```
