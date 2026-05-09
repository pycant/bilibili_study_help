#!/bin/bash
# ==============================================
# Meta 更新建议脚本
# 读取失败记录 → 分析模式 → 输出 Skill 更新建议
# ==============================================

FAILURES_FILE="$(dirname "$0")/../evals/failures/failures.jsonl"
SKILLS_DIR="$HOME/.workbuddy/skills"
PROJECT_SKILL_DIR="$(dirname "$0")/../../.workbuddy/skills"

echo "🔁 Meta 更新分析"
echo "=================="
echo ""

if [ ! -f "$FAILURES_FILE" ] || [ ! -s "$FAILURES_FILE" ]; then
    echo "暂无失败记录，无需更新"
    exit 0
fi

TOTAL=$(wc -l < "$FAILURES_FILE")
echo "共 $TOTAL 条失败记录"
echo ""

# 1. 按类型统计
echo "--- 按类型统计 ---"
grep -o '"type":"[^"]*"' "$FAILURES_FILE" | sort | uniq -c | sort -rn | awk '{printf "  %s: %s次\n", $2, $1}'

# 2. 按 Agent 统计
echo ""
echo "--- 按 Agent 统计 ---"
grep -o '"agent":"[^"]*"' "$FAILURES_FILE" | sort | uniq -c | sort -rn | awk '{printf "  %s: %s次\n", $2, $1}'

# 3. 高频模式分析（前 3 条 detail 的关键词）
echo ""
echo "--- 高频失败模式 ---"
grep -o '"detail":"[^"]*"' "$FAILURES_FILE" | sort | uniq -c | sort -rn | head -3 | awk '{printf "  %s: %s\n", $1, $2}'

# 4. 生成 Skill 更新建议
echo ""
echo "--- Skill 更新建议 ---"

# 检测超时模式
TIMEOUT_COUNT=$(grep -c '"type":"TIMEOUT"' "$FAILURES_FILE" 2>/dev/null || echo 0)
if [ "$TIMEOUT_COUNT" -gt 0 ]; then
    echo "  [P0] 检测到 $TIMEOUT_COUNT 次超时失败"
    echo "   建议在 bilibili-dev-conventions SKILL.md 中新增："
    echo "   - 所有复杂 awk/multipipe 命令必须设 timeout 参数"
    echo "   - 超时后不重试，拆成多步"
    echo "   参考命令:"
    echo "   bash harness/scripts/log-failure.sh <agent> TIMEOUT \"<detail>\""
fi

# 检测语法错误模式
SYNTAX_COUNT=$(grep -c '"type":"SYNTAX_ERROR"' "$FAILURES_FILE" 2>/dev/null || echo 0)
if [ "$SYNTAX_COUNT" -gt 0 ]; then
    echo "  [P0] 检测到 $SYNTAX_COUNT 次语法错误"
    echo "   建议在 bilibili-dev-conventions SKILL.md 中新增："
    echo "   - 每次修改 JS 后必须运行 node --check"
    echo "   - 禁止使用 template literal 拼接 class 名"
fi

# 检测找不到文件模式
NOTFOUND_COUNT=$(grep -c '"type":"FILE_NOT_FOUND"' "$FAILURES_FILE" 2>/dev/null || echo 0)
if [ "$NOTFOUND_COUNT" -gt 0 ]; then
    echo "  [P1] 检测到 $NOTFOUND_COUNT 次文件未找到"
    echo "   建议在 .harness-shared-interfaces.md 中："
    echo "   - 更新所有模块的文件路径和行号"
fi

# 检测 agent 卡死模式
STUCK_COUNT=$(grep -c '"type":"STUCK"' "$FAILURES_FILE" 2>/dev/null || echo 0)
if [ "$STUCK_COUNT" -gt 0 ]; then
    echo "  [P1] 检测到 $STUCK_COUNT 次 Agent 卡死"
    echo "   建议在 harness-builder SKILL.md 中新增："
    echo "   - Agent 卡死时最大等待时间 300 秒"
    echo "   - 超时后强制中断并报告"
fi

echo ""
echo "=================="
echo "建议手动执行以下命令更新 Skill:"
echo "  # 更新项目级 Skill"
echo "  cat > .workbuddy/skills/bilibili-dev-conventions/SKILL.md"
echo "  # 更新用户级 Skill"
echo "  cat > ~/.workbuddy/skills/harness-builder/SKILL.md"
