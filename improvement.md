# B站学习专注提醒助手 功能改进文档

> 当前版本：v1.0.6 | 更新日期：2026-04-14

---

## 一、已完成的功能改进

### 1.1 ✅ 将返回学习按钮取消全部替换为填词（v1.0.3）

**需求描述**：将学习提醒中的返回学习按钮取消全部替换为填词，确保高频率记背单词。

**实现方案**：
- Stage 2 弹窗中用单词填空练习替代简单的"返回学习/知道了"选项
- 从词汇库随机选择单词，隐藏40%字母形成填空
- 回答正确才能继续浏览，错误可重试
- 添加30秒倒计时跳过按钮，防止无限卡住
- 无词汇库时回退到 `showSimpleStage2Modal()` 备用弹窗

**代码位置**：
- `InterventionController.showStage2Modal()` — Stage 2 填空弹窗
- `InterventionController.createHiddenWord()` — 隐藏字母逻辑
- `InterventionController.showSimpleStage2Modal()` — 备用弹窗

---

### 1.2 ✅ 点击立即返回学习按钮改为选择指定链接返回（v1.0.3）

**需求描述**：将学习提醒中的"立即返回学习"选项返回默认链接改为选择指定链接返回，选项显示课程名称。

**实现方案**：
- 确认弹窗中动态生成白名单课程列表
- 用户点击选择课程后，按钮文字更新为"返回学习：课程名称"
- 点击返回按钮跳转到选中课程的 BV 号
- 无白名单时显示原始"立即返回学习"按钮

**代码位置**：
- `InterventionController.showConfirmModal()` — 确认弹窗（含课程选择）
- `ConfigManager.getWhitelistArray()` — 获取白名单课程数组
- `ConfigManager.addToWhitelist()` / `removeFromWhitelist()` — 白名单管理

---

### 1.3 ✅ 点击"立即返回"跳转学习网页（v1.0.2）

**问题描述**：点击"立即返回学习"按钮后不会跳转到任何页面，只是关闭弹窗。

**改进方案**：
1. 在配置中添加 `learningVideoPanel.defaultBV` 配置项
2. 实现 `returnToLearning()` 函数，优先跳转到配置的BV视频页
3. 无配置时执行 `window.history.back()`

**代码位置**：
- `ConfigManager.getDefaultReturnBV()` — 获取默认返回BV号
- `InterventionController.returnToLearning()` — 返回学习跳转

---

### 1.4 ✅ 白名单视频课程名称映射（v1.0.2）

**问题描述**：用户添加视频到白名单时只能看到BV号，无法知道对应的课程内容。

**改进方案**：
1. 白名单存储结构改为对象，支持 `name` 和 `addedAt`
2. 添加 `showAddWhitelistModal()` 支持输入课程名称
3. 实现课程名称重复检查
4. 新增辅助函数：`addToWhitelist()`, `removeFromWhitelist()`, `getWhitelistArray()`, `getCourseName()`

**代码位置**：
- `ConfigManager.addToWhitelist()` / `removeFromWhitelist()` / `getWhitelistArray()`

---

### 1.5 ✅ 白名单格式兼容旧数据（v1.0.2）

**改进说明**：自动检测旧格式数组 `["BV1", "BV2"]`，转换为新格式对象，不影响用户现有数据。

---

### 1.6 ✅ 详细统计面板暗色模式（v1.0.3）

**实现内容**：
- 完整的暗色模式 CSS 样式（`.bilibili-study-dark-mode`）
- 主题切换按钮（🌙/☀️），偏好持久化保存
- 自动应用上次选择的主题

**代码位置**：
- CSS：`STYLES` 常量中的 `.bilibili-study-dark-mode` 样式
- JS：`DetailPanel.loadTheme()` / `saveTheme()` / `toggleTheme()` / `applyTheme()`

---

### 1.7 ✅ Bug修复：课程选择后返回学习无反应（v1.0.4）

**问题描述**：选择课程后点击"返回学习"按钮无反应。

**根因**：内联 `onclick` 中模板字符串 `${course.name}` 被单引号包裹导致未求值；按钮 `disabled` 属性导致 `addEventListener('click')` 无法触发。

**修复方案**：
- 移除内联 onclick，改用 `data-bv` / `data-name` 属性 + 事件委托
- 移除 `disabled` 属性，改用 `opacity: 0.5; cursor: not-allowed` 视觉禁用

---

### 1.8 ✅ Bug修复：学习提醒弹窗缺少暗色模式适配（v1.0.4）

**根因**：`applyTheme()` 只对统计详情面板应用暗色 class，三个干预弹窗创建时未调用。

**修复方案**：新增 `applyCurrentThemeToModal()` 辅助函数，在所有弹窗创建后调用。

---

### 1.9 ✅ Bug修复：全屏模式下弹窗不显示（v1.0.4）

**根因**：B站全屏用 Fullscreen API，弹窗 append 到 `document.body` 无法覆盖 `fullscreenElement`。

**修复方案**：新增 `getModalContainer()` 检测全屏元素，弹窗挂载到全屏元素内部。

---

### 1.10 ✅ 统一分心阶段弹窗为渐进式单词验证（v1.0.5）

**需求描述**：将分心状态阶段的弹窗类型全部改为单词验证 `showWordVerifierModal()`，修改单词验证逻辑使其符合渐进式学习习惯。

**实现方案**：
- **统一弹窗类型**：移除 `showStage2Modal()` 和 `showSimpleStage2Modal()`，所有分心阶段（Stage 2/3/4）统一使用 `showWordVerifierModal()`
- **渐进式揭示逻辑**：
  - 初始：只显示中文释义，所有英文字母显示为下划线 `_`
  - 输入正确：直接关闭弹窗
  - 输入错误：每次随机揭示1-3个新字母作为提示
  - 全部字母揭示：固定显示完整单词6秒用于记忆，然后自动关闭，重置计时进入下一轮
- **随机揭示算法**：使用 Fisher-Yates 部分洗牌从未揭示位置中随机选取
- **揭示进度追踪**：显示"已揭示 X/Y 个字母"的进度指示
- **记忆模式 UI**：全部揭示后输入框禁用，显示完整单词和记忆倒计时提示

**代码位置**：
- `InterventionController.showWordVerifierModal()` — 统一弹窗入口
- `InterventionController.renderWordModalContent()` — 渐进式弹窗内容渲染
- `InterventionController.getDisplayWord()` — 基于索引集合生成展示字符串
- `InterventionController.handleWordSubmit()` — 渐进式揭示+记忆模式逻辑
- `InterventionController.showPopupIfNeeded()` — Stage 2/3/4 统一调用

### 1.11 ✅ 修复单词验证弹窗不显示的回归Bug（v1.0.6）

**问题描述**：v1.0.5 统一弹窗为单词验证后，学习提醒弹窗完全不显示。

**根因分析**：

### 1.12 ✅ 修复SPA导航导致干预状态重置（v1.0.7）

**问题描述**：用户在分心期间切换视频（SPA路由变化），学习提醒弹窗永远无法触发。

**根因分析**：
- `observeSPAChanges` 回调在每次路由变化时无条件执行 `InterventionController.reset()`，重置所有干预状态
- 切到另一个非白名单视频时，`distractionStartTime` 被设为 null
- 下一秒 `check()` 重新开始计时，又弹出确认弹窗，但永远累积不到5分钟

**修复方案**：
- SPA导航时区分白名单/非白名单视频
- 白名单视频 → 重置干预状态（用户已回到学习）
- 非白名单视频 → 保留干预状态，只关闭当前弹窗，干预计时延续
- `showWordVerifierModal()` 创建空 `div` 后调用 `renderWordModalContent(modal, word, revealedIndices)`
- `renderWordModalContent()` 查找 `.bilibili-study-modal-body`，但首次调用时 modal 是空 div，不存在该子元素
- `if (!body) return` 直接返回，弹窗被挂载到 DOM 但内容为空，用户看不到任何东西

**修复方案**：
- 区分首次渲染与后续渲染
- 首次渲染时：创建完整弹窗外壳（含 header + body），然后填充内容
- 后续渲染时（答错后更新）：只替换 `.bilibili-study-modal-body` 的 innerHTML

**调试增强**：
- 在 `showConfirmModal`、`showWordVerifierModal`、`showPopupIfNeeded`、`renderWordModalContent` 添加 `console.log` 调试输出
- 打开浏览器 F12 控制台可快速定位弹窗流程卡在哪一步

---

## 二、待修复/待改进项

| 优先级 | 内容 | 复杂度 | 状态 |
|--------|------|--------|------|
| P2 | 自动从B站API获取视频标题 | 中 | 待实现 |
| P2 | 在详细面板显示白名单课程列表 | 低 | 待实现 |
| P3 | 学习激励系统（成就/连续学习天数） | 高 | 待规划 |
| P3 | 学习疲劳提醒（休息/眼保健操） | 中 | 待规划 |
| P3 | 数据可视化增强（专注度分析） | 高 | 待规划 |

---

## 三、测试用例

### 3.1 Bug修复测试

| 测试项 | 操作步骤 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 分心次数统计 | 点击"确认离开" | distractionCount +1 | ✅ |
| Stage 2弹窗 | 停留5分钟后 | 弹出单词验证弹窗（渐进式） | ✅ |
| Stage 3弹窗 | 停留10分钟后 | 弹出单词验证弹窗（渐进式） | ✅ |
| 渐进式揭示 | 单词验证答错 | 每次揭示1-3个新字母 | ✅ |
| 记忆模式 | 所有字母全部揭示 | 显示完整单词6秒后自动关闭 | ✅ |
| 正确输入 | 输入正确单词 | 弹窗立即关闭 | ✅ |
| 课程选择返回 | 选择课程后点击返回按钮 | 跳转到选中课程BV号 | ✅ |
| 暗色模式弹窗 | 切换暗色后触发弹窗 | 弹窗显示暗色主题 | ✅ |
| 全屏模式弹窗 | 全屏播放时触发弹窗 | 弹窗在播放器上层显示 | ✅ |

### 3.2 功能改进测试

| 测试项 | 操作步骤 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 返回跳转 | 点击"立即返回" | 跳转到配置的BV视频页 | ✅ |
| 课程映射 | 添加白名单时输入课程名 | 白名单列表显示课程名 | ✅ |
| 名称重复 | 添加已存在课程名 | 拒绝新增，提示重复 | ✅ |
| 白名单移除 | 点击"从白名单移除" | 视频从白名单中删除 | ✅ |

---

## 四、配置项说明

### 4.1 白名单配置（新格式）

```javascript
whitelist: {
    "BV号": { name: "课程名称", addedAt: timestamp }
}
```

### 4.2 学习视频面板配置

```javascript
learningVideoPanel: {
    enabled: true,
    defaultBV: "BV号"  // 点击立即返回时跳转的目标
}
```

### 4.3 干预阶段配置

```javascript
interventionStages: [
    { threshold: 0,    interval: 0 },    // Stage 0: 确认弹窗
    { threshold: 60,   interval: 0 },    // Stage 1: 渐进视觉干扰
    { threshold: 300,  interval: 120 },  // Stage 2: 渐进式单词验证（5分钟）
    { threshold: 600,  interval: 30 },   // Stage 3: 渐进式单词验证（10分钟）
    { threshold: 1200, interval: 15 }    // Stage 4: 渐进式单词验证（20分钟）
]
```

> 注：Stage 2/3/4 统一使用 `showWordVerifierModal()`，仅弹窗间隔不同。

### 4.4 词汇库配置

```javascript
vocabulary: ["学习:study", "专注:focus", "进步:progress", ...]
masteryThreshold: 3          // 连续正确次数达标掌握
includeMasteredWords: false  // 是否包含已掌握单词
```
