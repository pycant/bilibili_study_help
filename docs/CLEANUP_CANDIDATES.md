# 候选删除文件

> 自动生成于 2026-05-09
> 规则：检查 `docs/` 下每个文件是否被外部（非 `docs/`）的 `.md` / `.js` 文件引用。
> 未被引用的列为「候选删除」。**注意：不执行实际删除，仅报告。**

## 候选列表

| 文件 | 原因 |
|------|------|
| `COMPLETION_REPORT.md` | 未被任何 `.md` / `.js` 文件引用（doc 自引用不计），可能为历史遗留完成报告 |
| `bug-analysis-vocab.md` | 未被任何 `.md` / `.js` 文件引用，词汇问题专项分析，已归档 |
| `bug_fix_summary.md` | 未被任何 `.md` / `.js` 文件引用，可能已被 `bug_fix.md` 或 `bugs.md` 覆盖 |
| `improvement_completed.md` | 未被任何 `.md` / `.js` 文件引用，已完成改进归档，信息可能已合并到 `improvement.md` |

## 排除说明

以下 `docs/` 文件仍被外部引用，**不列入**候选删除：

| 文件 | 引用来源 |
|------|----------|
| `README.md` | `CHANGELOG.md` |
| `bug-analysis.md` | `AGENTS.md` |
| `bug_fix.md` | `.workbuddy/memory/2026-04-13.md` |
| `bug_fix_plan.md` | `AGENTS.md` |
| `bugs.md` | `AGENTS.md` |
| `design-spec-v1.3.0-multiwindow.md` | `AGENTS.md` |
| `design-spec-v1.3.0.md` | `AGENTS.md`, `.workbuddy/memory/2026-04-19.md` |
| `improvement.md` | `.workbuddy/memory/*.md` |
| `improvement_plan.md` | `.workbuddy/memory/2026-04-19.md` |
