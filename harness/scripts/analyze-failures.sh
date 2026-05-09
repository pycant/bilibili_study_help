#!/bin/bash
# ==============================================
# 失败模式分析脚本
# 读取 failures.jsonl，输出分析报告
# ==============================================

FAILURES_FILE="$(dirname "$0")/../evals/failures/failures.jsonl"

echo "🔍 失败模式分析"
echo "=================="

if [ ! -f "$FAILURES_FILE" ]; then
    echo "暂无失败记录"
    exit 0
fi

TOTAL=$(wc -l < "$FAILURES_FILE")
echo "总失败次数: $TOTAL"

# 按类型分组
echo ""
echo "按类型统计:"
grep -o '"type":"[^"]*"' "$FAILURES_FILE" 2>/dev/null | sort | uniq -c | sort -rn || echo "  (无)"

# 按 Agent 分组
echo ""
echo "按 Agent 统计:"
grep -o '"agent":"[^"]*"' "$FAILURES_FILE" 2>/dev/null | sort | uniq -c | sort -rn || echo "  (无)"

# 最近 5 条
echo ""
echo "最近 5 条:"
tail -5 "$FAILURES_FILE" 2>/dev/null || echo "  (无)"
