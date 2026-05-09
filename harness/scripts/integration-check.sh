#!/bin/bash
# ============================================================
# 集成验证检查脚本
# 检测多 Agent 并行开发后的集成问题：
#   1. CSS class 名一致性（JS引用 vs CSS定义）
#   2. 暗色模式完整性（每个UI class 是否有 dark-mode 版本）
#   3. 模块行号一致性（AGENTS.md 行号 vs 实际行号）
# 用法: bash harness/scripts/integration-check.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

MAIN_JS="bilibili-study-focus-assistant.user.js"
AGENTS_MD="AGENTS.md"
TMPDIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'icXXXX')
trap 'rm -rf "$TMPDIR"' EXIT

ERRORS=0
WARNINGS=0

echo "============================================"
echo "  集成验证检查"
echo "============================================"

# --------------------------------------------------
# 1. CSS class 名一致性检查
# --------------------------------------------------
echo ""
echo "[CSS class 一致性]"
echo "------------------------"

if [ ! -f "$MAIN_JS" ]; then
    echo "❌ 主脚本文件不存在: $MAIN_JS"
    ERRORS=$((ERRORS + 1))
    exit 1
fi

# 找到 STYLES 常量的起止行号
STYLES_START=$(grep -n "^const STYLES = \`" "$MAIN_JS" | head -1 | cut -d: -f1)
# STYLES 结束：找到模板字面量的闭合反引号行
STYLES_END=$(awk "NR>=$STYLES_START && /^\`$/ {print NR; exit}" "$MAIN_JS")

# 提取 CSS 中定义的 class（只从 STYLES 常量区域提取）
awk "NR>=$((STYLES_START + 1)) && NR<$STYLES_END" "$MAIN_JS" | grep -oP '\.bilibili-study-\w+(?:-\w+)*' | sed 's/^\.//' | sort -u > "$TMPDIR/css_classes.txt"

# 提取 JS 引用的 class（只从非 STYLES 区域提取）
awk "NR<$STYLES_START || NR>$STYLES_END" "$MAIN_JS" | grep -oP 'bilibili-study-\w+(?:-\w+)*' | sort -u > "$TMPDIR/js_refs_only.txt" || true

# 检查 JS 引用但 CSS 没定义的缺失类
MISSING_COUNT=0
# 从 js_refs 中排除纯 CSS 查询（.bilibili-study 属于 CSS 选择器引用）和 dark-mode（特殊标志）
grep -F -x -v -f "$TMPDIR/css_classes.txt" "$TMPDIR/js_refs_only.txt" 2>/dev/null | grep -v '^bilibili-study-dark-mode$' > "$TMPDIR/js_unmatched.txt" || true

if [ -s "$TMPDIR/js_unmatched.txt" ]; then
    MISSING_COUNT=$(wc -l < "$TMPDIR/js_unmatched.txt")
    echo "❌ 缺失 CSS 定义: $MISSING_COUNT 个 class"
    cat "$TMPDIR/js_unmatched.txt" | sed 's/^/   - /'
    ERRORS=$((ERRORS + MISSING_COUNT))
else
    echo "✅ 所有 JS 引用的 class 在 CSS 中都有定义"
fi

# 检查 CSS 定义了但 JS 未引用的死代码
grep -F -x -v -f "$TMPDIR/js_refs_only.txt" "$TMPDIR/css_classes.txt" 2>/dev/null > "$TMPDIR/dead_css.txt" || true

DEAD_COUNT=0
if [ -s "$TMPDIR/dead_css.txt" ]; then
    DEAD_COUNT=$(wc -l < "$TMPDIR/dead_css.txt")
    echo "⚠️  死代码: $DEAD_COUNT 个 class 在 CSS 中已定义但 JS 未引用"
    cat "$TMPDIR/dead_css.txt" | sed 's/^/   - /'
    WARNINGS=$((WARNINGS + DEAD_COUNT))
else
    echo "✅ 无死代码 class"
fi

# --------------------------------------------------
# 2. 暗色模式完整性检查
# --------------------------------------------------
echo ""
echo "[暗色模式]"
echo "------------------------"

# 提取所有外观相关 class（从 CSS 定义中排除布局/功能类）
# 使用 CSS 定义的 class 作为检查范围
grep -oP '\.bilibili-study-\w+(?:-\w+)*' "$MAIN_JS" | sed 's/^\.//' | sort -u > "$TMPDIR/ui_classes.txt"

# 排除纯功能/布局 class（无视觉效果的内部逻辑 class）
EXCLUDED_CLASSES="bilibili-study-dark-mode"
echo "$EXCLUDED_CLASSES" > "$TMPDIR/excluded_classes.txt"

# 提取已有暗色适配的 class
grep -oP '\.bilibili-study-dark-mode\s*\.bilibili-study-\w+(?:-\w+)*' "$MAIN_JS" | sed 's/.*\.bilibili-study-dark-mode\s*\.//' | sort -u > "$TMPDIR/dark_mode_classes.txt"

# 找出缺暗色适配的 class
comm -23 <(sort "$TMPDIR/ui_classes.txt") <(sort "$TMPDIR/dark_mode_classes.txt" "$TMPDIR/excluded_classes.txt" | sort -u) > "$TMPDIR/missing_dark.txt" || true

MISSING_DARK=0
if [ -s "$TMPDIR/missing_dark.txt" ]; then
    MISSING_DARK=$(wc -l < "$TMPDIR/missing_dark.txt")
    echo "❌ 缺失暗色适配: $MISSING_DARK 个 UI class"
    cat "$TMPDIR/missing_dark.txt" | sed 's/^/   - /'
    ERRORS=$((ERRORS + MISSING_DARK))
else
    echo "✅ 所有 UI class 都有暗色适配"
fi

# --------------------------------------------------
# 3. 模块行号一致性检查
# --------------------------------------------------
echo ""
echo "[模块行号]"
echo "------------------------"

if [ ! -f "$AGENTS_MD" ]; then
    echo "⚠️  AGENTS.md 不存在，跳过行号检查"
    WARNINGS=$((WARNINGS + 1))
else
    # 从 AGENTS.md 提取模块行号表
    # 格式: | ModuleName | start-end | desc |
    awk '/^| 模块/ {found=1; next} found && /^|/ && !/^|------/ {print}' "$AGENTS_MD" | while IFS='|' read -r _ name range _; do
        name=$(echo "$name" | xargs)
        range=$(echo "$range" | xargs)
        expected_start=$(echo "$range" | awk -F'[–-]' '{print $1}' | xargs)

        [ -z "$name" ] && continue
        [ "$name" = "模块" ] && continue

        actual_start=""

        case "$name" in
            STYLES)
                actual_start=$(grep -n "^const STYLES" "$MAIN_JS" | head -1 | cut -d: -f1)
                ;;
            USER_CONFIG)
                actual_start=$(grep -n "const USER_CONFIG\b" "$MAIN_JS" | head -1 | cut -d: -f1)
                ;;
            "Main IIFE"|Main*IIFE)
                actual_start=$(grep -n "^}(),*/" "$MAIN_JS" 2>/dev/null | head -1 | cut -d: -f1)
                if [ -z "$actual_start" ]; then
                    actual_start=$(grep -n "()=>{return " "$MAIN_JS" 2>/dev/null | tail -1 | cut -d: -f1)
                fi
                if [ -z "$actual_start" ]; then
                    actual_start=$(grep -n "^})()" "$MAIN_JS" 2>/dev/null | head -1 | cut -d: -f1)
                    [ -n "$actual_start" ] && actual_start=$((actual_start + 1))
                fi
                ;;
            *)
                # 对其他模块，用 const Name = (function()
                pattern="$name"
                actual_start=$(grep -n "const $pattern = (function" "$MAIN_JS" | head -1 | cut -d: -f1)
                if [ -z "$actual_start" ]; then
                    # 尝试移除空格
                    compact=$(echo "$name" | tr -d ' ')
                    actual_start=$(grep -n "const $compact = (function" "$MAIN_JS" | head -1 | cut -d: -f1)
                fi
                ;;
        esac

        if [ -n "$actual_start" ] && [ -n "$expected_start" ]; then
            diff=$((actual_start - expected_start))
            diff_abs=${diff#-}
            if [ "$diff_abs" -gt 10 ]; then
                echo "⚠️  行号偏差: $name AGENTS.md=$expected_start 实际=$actual_start (差 $diff_abs 行)"
                WARNINGS=$((WARNINGS + 1))
            fi
        elif [ -n "$actual_start" ] && [ -z "$expected_start" ]; then
            echo "⚠️  $name 在 AGENTS.md 中无行号记录 (实际始于 $actual_start)"
            WARNINGS=$((WARNINGS + 1))
        elif [ -z "$actual_start" ]; then
            echo "⚠️  无法定位模块: $name"
            WARNINGS=$((WARNINGS + 1))
        fi
    done

    echo "✅ 模块行号检查完成"
fi

# --------------------------------------------------
# 结果汇总
# --------------------------------------------------
echo ""
echo "============================================"
if [ "$ERRORS" -gt 0 ]; then
    echo "❌ $ERRORS 个错误, ⚠️  $WARNINGS 个警告"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo "⚠️  $WARNINGS 个警告"
    exit 0
else
    echo "✅ 全部通过"
fi
