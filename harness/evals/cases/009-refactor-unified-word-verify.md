# Eval Case: 统一分心阶段弹窗为渐进式单词验证
- 类型: refactor
- 来源: v1.0.5
- 难度: hard
- 相关模块: InterventionController, WordVerifier

## 需求描述
将 Stage 2/3/4 的分心弹窗统一为渐进式单词验证，移除单独的 Stage 2 弹窗。

## 成功标准
1. 所有分心阶段（Stage 2/3/4）统一使用 `showWordVerifierModal()`
2. 移除 `showStage2Modal()` 和 `showSimpleStage2Modal()`
3. 渐进式揭示：初始只显示中文，字母为下划线
4. 输入正确直接关闭弹窗
5. 输入错误后每次随机揭示 1-3 个字母
6. 全部揭示后固定 6 秒展示完整单词，自动关闭
7. 显示揭示进度「已揭示 X/Y 个字母」
8. 使用 Fisher-Yates 部分洗牌算法随机选择揭示位置

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `showStage2Modal()`, `showWordVerifierModal()`, 相关状态管理
