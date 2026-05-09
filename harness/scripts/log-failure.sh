#!/bin/bash
# ==============================================
# 失败模式记录脚本
# 在 Agent 卡死/超时/崩溃时调用
# 用法: bash harness/scripts/log-failure.sh <agent_name> <failure_type> [detail]
# 示例: bash harness/scripts/log-failure.sh agent-integration TIMEOUT "awk处理9000行超30分钟"
# ==============================================

AGENT_NAME="${1:-unknown}"
FAILURE_TYPE="${2:-GENERIC}"
DETAIL="${3:-无详情}"
TIMESTAMP=$(date -Iseconds 2>/dev/null || date "+%Y-%m-%dT%H:%M:%S+08:00")

mkdir -p "$(dirname "$0")/../evals/failures"

cat >> "$(dirname "$0")/../evals/failures/failures.jsonl" << EOF
{"ts":"$TIMESTAMP","agent":"$AGENT_NAME","type":"$FAILURE_TYPE","detail":"$DETAIL"}
EOF

echo "✅ 失败已记录: $FAILURE_TYPE - $AGENT_NAME"
