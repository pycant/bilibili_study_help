# Eval Case: 新增历史视频面板（Module 6）
- 类型: feature
- 来源: v1.2.4
- 难度: hard
- 相关模块: DetailPanel, HistoryVideoTracker

## 需求描述
在详细统计面板底部新增「历史视频」模块，显示最近离开的视频记录。

## 成功标准
1. 模块位于详细统计面板底部，标题为「📼 历史视频」
2. 学习时段内显示🔒锁定状态，非学习时段/休息时段解锁
3. 显示最近10条记录（含标题、BV号、观看时长、离开时间、离开原因）
4. 点击标题可跳转回原视频
5. 提供清空按钮
6. 完整暗色模式适配

## 相关文件
- `bilibili-study-focus-assistant.user.js` — `DetailPanel`, CSS 样式
