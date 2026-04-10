# B站学习专注提醒助手 功能改进文档

## 版本记录
- v1.1.0 (当前): 修复Bug + 新增功能
- v1.0.0: 初始版本

---

## 一、Bug修复 (已完成)

### 1.1 ✅ 阶段0确认弹窗点击"确认离开"后没有记录分心次数

**问题描述**：
点击"确认离开学习"后，没有调用 `StatisticsTracker.incrementDistractionCount()` 来记录分心触发次数。

**修复方案**：
在"确认离开"按钮点击事件中添加 `StatisticsTracker.incrementDistractionCount()` 调用。

**代码位置**：`InterventionController.showConfirmModal()`

---

### 1.2 ✅ Stage 2弹窗未实现

**问题描述**：
`showPopupIfNeeded()` 函数只对 stage >= 3 调用 `showWordVerifierModal()`，但阶段2应该弹出"您已在无关视频停留超过5分钟"的提示弹窗（每2分钟一次）。

**修复方案**：
1. 创建 `showStage2Modal()` 函数，显示"返回学习"/"知道了"弹窗
2. 在 `showPopupIfNeeded()` 中对 stage === 2 调用 `showStage2Modal()`

**代码位置**：`InterventionController.showStage2Modal()`, `showPopupIfNeeded()`

---

### 1.3 ✅ 弹窗间隔计时逻辑错误

**问题描述**：
1. `lastPopupTime` 在弹窗**显示时**就被设置为 `now`，而不是在弹窗**关闭后**才重置
2. `wordVerifierModalShown` 在点击提交后有1.5秒延迟才重置，导致弹窗显示期间无法触发新弹窗

**修复方案**：
1. 引入 `modalState` 状态管理变量，区分"无弹窗"、"确认弹窗"、"提示弹窗"、"单词验证弹窗"
2. 只有在弹窗**完全关闭后**才重置对应的状态和计时器
3. `showPopupIfNeeded` 检查 `modalState`，如果已有弹窗显示则不重复触发

**代码位置**：`InterventionController.MODAL_STATES`, `modalState`

---

### 1.4 ✅ 阶段3/4单词验证规则错误

**问题描述**：
阶段3要求输入错误时显示1-3个随机字母提示，直到单词完整显示后停留6秒自动关闭。当前代码错误后只是显示反馈就关闭了。

**修复方案**：
实现完整的单词提示逻辑：
- 错误后随机显示1个字母
- 单词完整显示后停留6秒再关闭
- 在 `handleWordSubmit()` 中实现错误处理和提示显示逻辑

**代码位置**：`handleWordSubmit()`, `renderWordModalContent()`, `getDisplayWord()`

---

### 1.5 ⏳ 页面离开时计时未正确暂停

**问题描述**：
当页面不可见（切换标签页、最小化）时，`distractionStartTime` 没有被暂停，导致恢复时计算出错误的时间差。

**修复方案**：
暂未实现（需要更复杂的多标签页状态管理）

**相关问题**：多标签页状态共享导致冲突（见1.6）

---

### 1.6 ⚠️ 多标签页状态共享导致冲突

**问题描述**：
`window.__bilibiliStudyAppState` 是全局单例，当用户同时打开多个B站视频标签页时状态互相干扰。

**修复方案**：
使用 `sessionStorage` + 标签页唯一ID来实现标签页隔离（暂未完全实现）

**当前状态**：代码结构支持，但尚未完全隔离

---

### 1.7 ✅ 视觉干预CSS选择器错误

**问题描述**：
CSS选择器是 `.bpx-player-container`（播放器本身），但需求要求的是"仅作用于播放器以外的页面元素"。

**修复方案**：
修改CSS选择器，改为选择页面容器元素，排除播放器区域：
- `.video-container`, `.main-container`, `.left-container`
- `.reCMD-list`, `.recommend-list`, `.sidebar`
- 通过检查元素是否在 `.bilibili-player-wrap` 内来排除播放器

**代码位置**：`updateProgressiveVisualEffect()`, `removeVisualIntervention()`

---

## 二、功能改进 (已完成)

### 2.1 ✅ 点击"立即返回"跳转学习网页

**问题描述**：
点击"立即返回学习"按钮后不会跳转到任何页面，只是关闭弹窗并重置状态。

**改进方案**：
1. 在配置中添加 `learningVideoPanel.defaultBV` 配置项，允许用户设置返回目标BV号
2. 实现 `returnToLearning()` 函数，优先跳转到配置的BV视频页，如果没有配置则执行 `window.history.back()`
3. "立即返回"按钮点击事件改为调用 `returnToLearning()`

**代码位置**：
- `ConfigManager.getDefaultReturnBV()`
- `InterventionController.returnToLearning()`
- `USER_CONFIG.learningVideoPanel`

**用户配置**：
```javascript
learningVideoVideoPanel: {
    enabled: true,
    defaultBV: "BV1EpNjzgEcs"  // 点击立即返回时默认跳转的BV号
}
```

---

### 2.2 ✅ 白名单视频课程名称映射

**问题描述**：
用户添加视频到白名单时只能看到BV号，无法知道对应的课程内容。

**改进方案**：
1. 白名单存储结构改为对象：
```javascript
whitelist: {
    "BV1xx411c7mZ": { name: "高等数学第一章", addedAt: "2024-01-01" },
    "BV2xx411c7mY": { name: "大学英语词汇", addedAt: "2024-01-02" }
}
```

2. 添加 `showAddWhitelistModal()` 函数，在详细统计面板中添加视频到白名单时弹出输入框让用户输入课程名称

3. 实现课程名称重复检查：
   - 如果输入的课程名称已存在，拒绝新增并提示用户
   - 如果留空，使用视频BV号作为名称

4. 新增辅助函数：
   - `addToWhitelist(bv, courseName)` - 添加到白名单（支持重名检查）
   - `removeFromWhitelist(bv)` - 从白名单移除
   - `getWhitelistArray()` - 获取白名单数组
   - `getCourseName(bv)` - 获取课程名称

**代码位置**：
- `ConfigManager.addToWhitelist()`
- `ConfigManager.removeFromWhitelist()`
- `DetailPanel.showAddWhitelistModal()`

**详细统计面板改进**：
- 添加视频到白名单时弹出输入框
- 从白名单移除按钮
- 错误提示（课程名称重复）

---

### 2.3 ✅ 白名单格式兼容旧数据

**改进说明**：
- 自动检测旧格式数组 `["BV1", "BV2"]`
- 转换为新格式对象 `{ "BV1": { name: "BV1", addedAt: ... } }`
- 不影响用户现有数据

---

## 三、待修复/待改进项

| 优先级 | 内容 | 复杂度 | 状态 |
|--------|------|--------|------|
| P1 | 页面离开计时暂停 | 高 | 待修复 |
| P1 | 多标签页状态隔离 | 高 | 待修复 |
| P2 | 自动从B站API获取视频标题 | 中 | 待实现 |
| P2 | 在详细面板显示白名单课程列表 | 低 | 待实现 |

---

## 四、测试用例

### 4.1 Bug修复测试

| 测试项 | 操作步骤 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 分心次数统计 | 点击"确认离开" | distractionCount +1 | ✅ |
| Stage 2弹窗 | 停留5分钟后 | 每2分钟弹出"返回学习/知道了"弹窗 | ✅ |
| Stage 3弹窗 | 停留10分钟后 | 每30秒弹出单词验证弹窗 | ✅ |
| 单词提示 | 单词验证错误3次 | 显示完整单词，6秒后自动关闭 | ✅ |
| 页面切换 | 切换标签页后切回 | 计时正确，不跳过阶段 | ⏳ |

### 4.2 功能改进测试

| 测试项 | 操作步骤 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 返回跳转 | 点击"立即返回" | 跳转到配置的BV视频页 | ✅ |
| 课程映射 | 添加白名单时输入课程名 | 白名单列表显示课程名 | ✅ |
| 名称重复 | 添加已存在课程名 | 拒绝新增，提示重复 | ✅ |
| 白名单移除 | 点击"从白名单移除" | 视频从白名单中删除 | ✅ |

---

## 五、配置项说明

### 5.1 白名单配置（新格式）

```javascript
whitelist: {
    "BV号": { name: "课程名称", addedAt: timestamp }
}
```

### 5.2 学习视频面板配置

```javascript
learningVideoPanel: {
    enabled: true,
    defaultBV: "BV号"  // 点击立即返回时跳转的目标
}
```
