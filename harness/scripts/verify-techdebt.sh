#!/bin/bash
# ==============================================
# 技术债交叉验证脚本 (verify-techdebt.sh)
# 检查 tech-debt.md 和 STATUS.md 之间的一致性
# ==============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TECH_DEBT="$SCRIPT_DIR/harness/tasks/tech-debt.md"
STATUS="$SCRIPT_DIR/STATUS.md"
ERRORS=0

echo "🔗 技术债交叉验证"
echo "=================="
echo ""

# 检查两个文件都存在
if [ ! -f "$TECH_DEBT" ]; then
    echo "❌ 文件不存在: $TECH_DEBT"
    exit 1
fi
if [ ! -f "$STATUS" ]; then
    echo "❌ 文件不存在: $STATUS"
    exit 1
fi

# ---- 1. 检查 tech-debt.md 中「已完成」的条目 ----
echo "[tech-debt.md → STATUS.md 一致性检查]"
echo "检查：已完成的条目在 STATUS.md 中是否反映？"
echo ""

# 提取已完成项
while IFS='|' read -r num desc ignore; do
    # 去除首尾空格
    num=$(echo "$num" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    desc=$(echo "$desc" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "$num" ] && continue
    [ "$num" = "#" ] && continue

    # 检查 STATUS.md 是否有对应的"已完成"标记
    # 提取关键词（第一个词或函数名）
    keyword=$(echo "$desc" | grep -oP '`[^`]+`' | head -1 | tr -d '`')
    if [ -z "$keyword" ]; then
        keyword=$(echo "$desc" | grep -oP '\w+' | head -1)
    fi

    if grep -qi "$keyword.*已完成\|已完成.*$keyword" "$STATUS" 2>/dev/null; then
        echo "✅ P1-$num: $keyword — STATUS.md 已同步"
    else
        echo "⚠️  P1-$num: $keyword — STATUS.md 可能未同步（在 STATUS.md 中未找到「已完成」标记）"
        ERRORS=$((ERRORS + 1))
    fi
done < <(grep -A20 "^## P1" "$TECH_DEBT" | grep "✅ 已完成" | while IFS='|' read -r line; do
    num=$(echo "$line" | cut -d'|' -f1)
    desc=$(echo "$line" | cut -d'|' -f2)
    echo "$num|$desc"
done)

# ---- 2. 检查 STATUS.md 中的 P1 项是否与 tech-debt.md 一致 ----
echo ""
echo "[STATUS.md → tech-debt.md 反向检查]"
echo "检查：STATUS.md 中标记的完成数是否与 tech-debt.md 一致？"
echo ""

# 统计 tech-debt.md 中已完成 P1 条目数
DONE_IN_DEBT=$(grep -c "✅ 已完成" "$TECH_DEBT" 2>/dev/null || echo 0)

# 从 STATUS.md 提取"P1  N/9 完成"或类似模式
DONE_IN_STATUS=$(grep -c "✅.*已完成" "$STATUS" 2>/dev/null || echo 0)

echo "  tech-debt.md 已完成: $DONE_IN_DEBT 项"
echo "  STATUS.md 已完成:   $DONE_IN_STATUS 项"

if [ "$DONE_IN_DEBT" -ne "$DONE_IN_STATUS" ]; then
    echo "❌ 不一致！tech-debt.md 标记了 $DONE_IN_DEBT 项已完成，STATUS.md 标记了 $DONE_IN_STATUS 项"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ 一致"
fi

# ---- 3. 检查是否有"已清偿"节 ----
echo ""
echo "[清偿记录检查]"
echo "检查：tech-debt.md 是否有本次迭代的清偿记录？"
echo ""

PAID_OFF=$(grep -c "本次迭代已清偿\|已清偿" "$TECH_DEBT" 2>/dev/null || echo 0)
if [ "$PAID_OFF" -gt 0 ]; then
    grep -A5 "本次迭代已清偿" "$TECH_DEBT" 2>/dev/null | head -5 | sed 's/^/  /'
else
    echo "  ⚠️ tech-debt.md 缺少「本次迭代已清偿」节"
fi

# ---- 汇总 ----
echo ""
echo "=================="
if [ "$ERRORS" -gt 0 ]; then
    echo "❌ $ERRORS 个一致性问题"
    exit 1
else
    echo "✅ tech-debt.md 与 STATUS.md 一致"
fi
