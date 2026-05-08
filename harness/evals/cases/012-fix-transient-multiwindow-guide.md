# Eval Case: 修复多窗口瞬态引导弹窗（isVisible + 稳定性去抖）
- 类型: bugfix
- 来源: v1.2.6.2
- 难度: medium
- 相关模块: TabManager

## 问题描述
切换到娱乐视频时，学习视频放到后台后，多窗口检测仍认为存在"1学+1分"混合状态，引导弹窗闪现后消失。

## 根因
1. `hasMixedWindowTypes()` 遍历注册表中所有活跃标签页，不区分前台/后台
2. 后台标签页的 `isWhitelisted: true` 仍残留在注册表中 3~8 秒
3. 单次 check 满足条件就触发引导，无稳定性去抖

## 成功标准
1. **isVisible 过滤**：`updateRegistration()` 每次更新时写入 `isVisible: !document.hidden`
2. **hasMixedWindowTypes()**：跳过后台隐藏标签页（`isVisible === false`）
3. **2-cycle 稳定性**：mixed 状态必须连续出现 2 个 check 周期（~10秒）才触发引导
4. **visibilitychange 即时更新**：页面隐藏/恢复时立即调用 `updateRegistration({ isVisible })`
5. 引导弹出后若状态在短时间内恢复（window_resolved），自动捕获快照

## 相关文件
- `bilibili-study-focus-assistant.user.js` — TabManager 模块
