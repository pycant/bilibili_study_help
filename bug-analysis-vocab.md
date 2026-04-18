# Bug 分析报告：词库统计与刷新按钮问题

> **状态：已修复** ✅（v1.0.9 合入，v1.1.0 补充调试增强）

## 一、Bug 现象

| # | 现象 | 用户操作 |
|---|------|----------|
| 1 | 显示"总单词数：5，已掌握：5，可学习：0" + "词库已全部掌握"提示 | 更新脚本后打开详细统计 |
| 2 | 刷新词库按钮无反应（控制台有日志但页面不变） | 点击 🔄 刷新词库 |
| 3 | 重置后显示"总单词数：0，已掌握：0，可学习：5" + "词库不足提醒" | 点击 🗑️ 重置记录 |
| 4 | 一直弹出"词库已全部掌握"提示 | 每次打开详细统计 |

---

## 二、根因分析

### Bug 1 & 4：统计数据来源错误

**根因**：`renderModule3()` 的"总单词数"来自 **localStorage 答题记录**，而非**词库配置**。

```javascript
// renderModule3() 第1750行
const wordData = getWordRecords();        // ← 从 localStorage 读答题记录
const words = wordData.words || {};       // ← 只有答过的词才在这里
const totalWords = Object.keys(words).length;  // ← 答过几个词就显示几个！
```

**因果链**：
1. v1.0.8 之前词库只有5个基础词（学习/专注/进步/努力/坚持）
2. 用户答对这5个词8次后，localStorage `wordRecords.words` 中只有5条记录，且全部 `mastered: true`
3. v1.0.8 扩充词库到362词，但 `renderModule3` 仍然读 localStorage 记录数量
4. 显示"总单词数：5，已掌握：5"——词库配置变了，统计逻辑没跟上

**对比**：`WordVerifier.getUnmasteredCount()` 是正确的——它用 `parseVocabulary()` 读词库配置：
```javascript
// getUnmasteredCount() 第2244行
const words = parseVocabulary();  // ← 从 ConfigManager 读362词配置
```

**重置后为什么显示5？** 重置清空 `wordRecords` → `totalWords = 0`，但 `getUnmasteredCount()` 用 `parseVocabulary()` 算出362词全部未掌握。不过用户看到的是5——说明 `parseVocabulary()` 也有问题（见下方 Bug 5）。

---

### Bug 2：刷新词库按钮跨作用域调用失败

**根因**：`refreshVocabDisplay()` 在 `WordVerifier` IIFE 内部，但调用了 `DetailPanel` IIFE 内部的私有函数。

```
DetailPanel IIFE (line 1520)
├── renderModule3()        ← 私有函数
├── handleRefreshVocabBtn  ← 私有函数
├── handleResetVocabBtn    ← 私有函数
│
WordVerifier IIFE (line 2178)
├── refreshVocabDisplay()  ← 调用 renderModule3() → ReferenceError!
│                          ← 调用 handleRefreshVocabBtn → ReferenceError!
```

`refreshVocabDisplay()` 第2362行调用 `renderModule3()`，第2366/2368行调用 `handleResetVocabBtn`/`handleRefreshVocabBtn`——这些在另一个 IIFE 里，根本访问不到。控制台有 `[B站学习助手] handleRefreshVocabBtn: 刷新词库显示` 日志说明 handleRefreshVocabBtn 本身执行了，但调 `refreshVocabDisplay()` 时内部就报错了。

---

### Bug 3：重置后"可学习：5"——parseVocabulary() 读到了旧配置

**根因**：`ConfigManager.get()` 有缓存机制。

```javascript
// ConfigManager 第842行
function get() {
    if (!currentConfig) {   // ← 缓存不为null就直接返回旧配置
        load();
    }
    return currentConfig;   // ← 返回的可能是包含旧5词的缓存
}
```

脚本更新后 `USER_CONFIG.vocabulary` 已有362词，但如果 localStorage 中存了旧配置（5词），`load()` 会用 `...USER_CONFIG, ...parsed` 合并——`parsed.vocabulary` 覆盖了 `USER_CONFIG.vocabulary`，所以 `parseVocabulary()` 仍然只读到5个词。

---

### Bug 5（隐藏）：词库更新不生效

**根因**：localStorage 中的旧 `vocabulary` 配置覆盖了代码中的新配置。

```javascript
// ConfigManager.load() 第813行
currentConfig = {
    ...USER_CONFIG,          // ← 新代码的362词
    ...parsed,               // ← localStorage的5词 ← 覆盖了！
};
```

用户更新脚本后，代码中 `USER_CONFIG.vocabulary` 变成362词，但 localStorage 里还是5词。`...parsed` 把 `vocabulary` 字段覆盖回5词了。

---

## 三、修复方案

### 方案 A：最小改动（推荐 ✅）

| Bug | 修复内容 | 改动量 |
|-----|----------|--------|
| 1 & 4 | `renderModule3()` 的 `totalWords` 改用 `parseVocabulary().length`，`masteredWords` 用 `WordVerifier.getMasteredWords().length` | ~5行 |
| 2 | `refreshVocabDisplay()` 移到 `DetailPanel` IIFE 内部，通过 `WordVerifier.refreshVocabDisplay = refreshVocabDisplay` 桥接 | ~20行移动 |
| 3 & 5 | `ConfigManager.load()` 合并时，vocabulary 字段始终用代码中的新值（不读 localStorage 的旧词库） | ~3行 |

**具体改动**：

1. **修复统计来源**（Bug 1&4）：
```javascript
// renderModule3() 修改
const vocabList = WordVerifier.parseVocabulary();  // 需导出此函数
const totalWords = vocabList.length;               // 词库配置的总词数
const masteredWords = WordVerifier.getMasteredWords().length;
const unmasteredCount = totalWords - masteredWords;
```

2. **修复跨作用域调用**（Bug 2）：
```javascript
// 把 refreshVocabDisplay() 从 WordVerifier 移到 DetailPanel 内部
// WordVerifier 只保留数据操作，不涉及 DOM 渲染
// DetailPanel 内部可以直接调 renderModule3() 和 handleXxxBtn

// WordVerifier 中删除 refreshVocabDisplay
// DetailPanel 中新增 refreshVocabDisplay()
// handleRefreshVocabBtn 直接调用 DetailPanel 内的 refreshVocabDisplay
```

3. **修复词库配置缓存**（Bug 3&5）：
```javascript
// ConfigManager.load() 修改
currentConfig = {
    ...USER_CONFIG,
    ...parsed,
    vocabulary: USER_CONFIG.vocabulary,  // ← 始终用代码中的最新词库
    floatingWindow: {
        ...USER_CONFIG.floatingWindow,
        ...(parsed.floatingWindow || {})
    }
};
```

### 方案 B：重构方案

将 `DetailPanel` 和 `WordVerifier` 的 DOM 渲染逻辑统一到一个 UI 模块，数据逻辑留在各自模块。改动较大但更干净。

---

## 四、风险评估

| 方案 | 优点 | 风险 | 建议顺序 |
|------|------|------|----------|
| A | 改动小（~30行），不影响其他功能 | `parseVocabulary` 需要导出 | ✅ 优先 |
| B | 架构更清晰 | 改动大，可能引入新 Bug | A验证后再考虑 |

---

## 五、验证清单

修复后需验证：

- [x] 打开详细统计：总单词数显示362（非5）
- [x] 已掌握数量 = 已连续正确8次的词数
- [x] 可学习 = 362 - 已掌握（非0或5）
- [x] 点击刷新词库 → Module3 内容原地刷新
- [x] 点击重置记录 → 确认后所有数据归零，总单词仍显示362
- [x] 不再弹出"词库已全部掌握"（除非真的全掌握）
- [x] 词库不足提醒仅在可学习 < 50 时出现

---

## 六、修复记录

| Bug | 修复版本 | 修复方式 |
|-----|----------|----------|
| 1 & 4 | v1.0.9 | `totalWords` 改用 `parseVocabulary().length` |
| 2 | v1.0.9 | `refreshVocabDisplay()` 移入 DetailPanel IIFE |
| 3 & 5 | v1.0.9 | `load()` 始终用 `vocabulary: USER_CONFIG.vocabulary` |
| 暗色模式 | v1.0.9 | JS 内联样式 + CSS `!important` 双重覆盖 |
| 弹窗不出现调试 | v1.1.0 | check() 节流日志 + 主定时器心跳 + unsafeWindow 暴露 state |
