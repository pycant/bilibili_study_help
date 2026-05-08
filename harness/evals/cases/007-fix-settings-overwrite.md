# Eval Case: 设置面板保存覆盖其他配置
- 类型: bugfix
- 来源: v1.2.1
- 难度: medium
- 相关模块: DetailPanel, ConfigManager

## 问题描述
在设置面板修改学习时段后保存，白名单和词库被清空。

## 成功标准
1. 修改学习时段保存后，白名单和词库数据完整保留
2. 修改白名单保存后，学习时段和词库数据完整保留
3. 修改词库保存后，学习时段和白名单数据完整保留
4. `saveSettings()` 只保存当前激活 tab 的数据

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `saveSettings()`, `ConfigManager.load()`
