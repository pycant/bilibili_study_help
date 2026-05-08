# Eval Case: 修复答题记录多条重复
- 类型: bugfix
- 来源: v1.2.4
- 难度: medium
- 相关模块: WordVerifier

## 问题描述
词汇验证时，同一词出现多条重复答题记录（如 `✗复杂的 ✗复杂的 ✓复杂的`）。

## 成功标准
1. `recordAnswer()` 和 `recordWordAttempt()` 只在最终结果确定时调用（答对/全部字母揭示）
2. `updateMastery()` 保持每次提交都更新
3. 同一单词在单次验证中只产生一条最终记录

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `handleWordSubmit()`, `recordAnswer()`, `recordWordAttempt()`
