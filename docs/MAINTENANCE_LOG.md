# 维护日志

## 2026-05-09

### 技术债更新（tech-debt.md）
- 行号修正：更新了 P1/P2/P3 所有 25 处行号引用（偏移 200-1400 行）
- 指标扫描更新：
  - 总行数 8310 → 8936（+7.5%）
  - 非空行 7254 → 8020（+10.6%）
  - IIFE 模块 13 → 14（+7.7%）
  - 函数 212+ → 407+
  - console.* 127 → 124（-2.4%）
  - try-catch 42 → 46（+9.5%）
  - innerHTML 31 → 38（+22.6%）
  - addEventListener 68 → 80（+17.6%）
  - removeEventListener 4 → 6（+50%）
- P3-5（版本号 1.2.7 → 已更新）移入「本次迭代已清偿」

### 已更新文件

| 文件 | 改动 |
|------|------|
| `harness/tasks/tech-debt.md` | 「当前统计」刷新 + 所有行号修正 + P3-5 清偿 |
| `docs/CLEANUP_CANDIDATES.md` | 新增，4 个候选删除文件 |
| `CHANGELOG.md` | 追加 v1.2.6.2 / v1.2.7 / v1.3.0 / v1.3.1 / v1.4.0 / v1.4.1 |
| `AGENTS.md` | 行数 ~8100 → ~8936，docs 结构更新，路线图「下一轮」标记 ✅ |
| `docs/MAINTENANCE_LOG.md` | 本文件 |

### 文档清理（docs/ 目录）
- 扫描 13 个文件，4 个候选删除：
  - `COMPLETION_REPORT.md` — 历史遗留完成报告，无外部引用
  - `bug-analysis-vocab.md` — 词汇问题专项分析，已归档
  - `bug_fix_summary.md` — 修复摘要，信息已被 `bug_fix.md`/`bugs.md` 覆盖
  - `improvement_completed.md` — 已完成改进归档

### CHANGELOG 更新
- 在 v1.0.5 之前插入了 6 个缺失版本条目（v1.2.6.2 → v1.4.1）
- 最后更新日期 2026-04-16 → 2026-05-09

### AGENTS.md 版本同步
- 项目结构主脚本行数：~8100 → ~8936
- docs 目录结构已反映新文件（CLEANUP_CANDIDATES.md, MAINTENANCE_LOG.md）
- 路线图「下一轮：Eval自动化 + 集成验证 + Harness升级」标记为 ✅

### ⚠️ 发现的问题
- **@version 不一致**：`bilibili-study-focus-assistant.user.js` 头部的 `@version` 为 **1.4.0**，但 `AGENTS.md` 当前版本描述为 **v1.4.1**。AGENTS.md 描述的功能（浮动窗重构、11指标、用户操作追踪）已在 git 中实现，但脚本头部版本号未同步至 1.4.1。需在下次迭代中更新 `.user.js` 文件头部的 `@version` 字段。
