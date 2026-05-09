#!/bin/bash
# ============================================================
# 集成验证检查脚本
# 检测多 Agent 并行开发后的集成问题：
#   1. CSS class 名一致性（JS引用 vs CSS定义）
#   2. 暗色模式完整性（每个UI class 是否有 dark-mode 版本）
#   3. 模块行号一致性（AGENTS.md 行号 vs 实际行号）
# 用法: bash harness/scripts/integration-check.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 1
cd "$SCRIPT_DIR" || exit 1

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
    echo "错误: 主脚本文件不存在: $MAIN_JS"
    exit 1
fi

# 找到 STYLES 常量的起止行号
STYLES_START=$(grep -n "^const STYLES = " "$MAIN_JS" | head -1 | cut -d: -f1)
# 闭合反引号+分号行（整行只有 `;）
BTICK=$(printf '\140;')
STYLES_END=$(grep -n "^${BTICK}$" "$MAIN_JS" | head -1 | cut -d: -f1)
if [ -z "$STYLES_END" ]; then
  STYLES_END=$(grep -n "^${BTICK}$" "$MAIN_JS" | head -1 | cut -d: -f1)
fi

# 提取 CSS 中定义的 class（只从 STYLES 常量区域）
if [ -n "$STYLES_START" ] && [ -n "$STYLES_END" ]; then
    awk -v start="$STYLES_START" -v end="$STYLES_END" 'NR>start && NR<end' "$MAIN_JS" \
        | grep -oP '\.bilibili-study-\w+(?:-\w+)*' \
        | sed 's/^\.//' | sort -u > "$TMPDIR/css_classes.txt" || true

    # 提取 JS 引用的 class（只从非 STYLES 区域）
    awk -v start="$STYLES_START" -v end="$STYLES_END" 'NR<start || NR>end' "$MAIN_JS" \
        | grep -oP 'bilibili-study-\w+(?:-\w+)*' \
        | sort -u > "$TMPDIR/js_refs_only.txt" || true
else
    echo "警告: 无法确定 STYLES 常量边界，回退到全文件搜索"
    grep -oP '\.bilibili-study-\w+(?:-\w+)*' "$MAIN_JS" | sed 's/^\.//' | sort -u > "$TMPDIR/css_classes.txt"
    grep -oP 'bilibili-study-\w+(?:-\w+)*' "$MAIN_JS" | sort -u > "$TMPDIR/js_refs_only.txt"
fi

# 检查 JS 引用但 CSS 没定义的缺失类
MISSING_COUNT=0
if [ -s "$TMPDIR/js_refs_only.txt" ] && [ -s "$TMPDIR/css_classes.txt" ]; then
    grep -F -x -v -f "$TMPDIR/css_classes.txt" "$TMPDIR/js_refs_only.txt" 2>/dev/null \
        | grep -v '^bilibili-study-dark-mode$' > "$TMPDIR/js_unmatched.txt" || true
fi

if [ -s "$TMPDIR/js_unmatched.txt" ]; then
    MISSING_COUNT=$(wc -l < "$TMPDIR/js_unmatched.txt")
    printf "\n缺失 CSS 定义 (%d 个 class):\n" "$MISSING_COUNT"
    cat "$TMPDIR/js_unmatched.txt" | sed 's/^/   - /'
    ERRORS=$((ERRORS + MISSING_COUNT))
else
    echo "所有 JS 引用的 class 在 CSS 中都有定义"
fi

# 检查 CSS 定义了但 JS 未引用的死代码
DEAD_COUNT=0
if [ -s "$TMPDIR/css_classes.txt" ] && [ -s "$TMPDIR/js_refs_only.txt" ]; then
    grep -F -x -v -f "$TMPDIR/js_refs_only.txt" "$TMPDIR/css_classes.txt" 2>/dev/null > "$TMPDIR/dead_css.txt" || true
fi

if [ -s "$TMPDIR/dead_css.txt" ]; then
    DEAD_COUNT=$(wc -l < "$TMPDIR/dead_css.txt")
    printf "\n死代码: %d 个 class 在 CSS 中已定义但 JS 未引用\n" "$DEAD_COUNT"
    cat "$TMPDIR/dead_css.txt" | sed 's/^/   - /'
    WARNINGS=$((WARNINGS + DEAD_COUNT))
else
    echo "无死代码 class"
fi

# --------------------------------------------------
# 2. 暗色模式完整性检查
# --------------------------------------------------
echo ""
echo "[暗色模式]"
echo "------------------------"

if [ -n "$STYLES_START" ] && [ -n "$STYLES_END" ]; then
    # 提取已有暗色适配的 class（只从 STYLES 区域提取）
    awk -v start="$STYLES_START" -v end="$STYLES_END" 'NR>start && NR<end' "$MAIN_JS" \
        | grep -oP '\.bilibili-study-dark-mode\s*\.bilibili-study-\w+(?:-\w+)*' \
        | sed 's/.*\.bilibili-study-dark-mode\s*\.//' | sort -u > "$TMPDIR/dark_mode_classes.txt" || true
else
    # 回退
    grep -oP '\.bilibili-study-dark-mode\s*\.bilibili-study-\w+(?:-\w+)*' "$MAIN_JS" \
        | sed 's/.*\.bilibili-study-dark-mode\s*\.//' | sort -u > "$TMPDIR/dark_mode_classes.txt" || true
fi

# 用 CSS 定义的所有 class 作为 UI class 检查范围
cp "$TMPDIR/css_classes.txt" "$TMPDIR/ui_classes.txt" 2>/dev/null || true

# 排除 dark-mode 自身
echo "bilibili-study-dark-mode" > "$TMPDIR/excluded_classes.txt"

# 找出缺暗色适配的 class
MISSING_DARK=0
if [ -s "$TMPDIR/ui_classes.txt" ]; then
    sort "$TMPDIR/ui_classes.txt" > "$TMPDIR/_ui_sorted.txt"
    sort "$TMPDIR/dark_mode_classes.txt" "$TMPDIR/excluded_classes.txt" 2>/dev/null | sort -u > "$TMPDIR/_dark_sorted.txt"
    comm -23 "$TMPDIR/_ui_sorted.txt" "$TMPDIR/_dark_sorted.txt" > "$TMPDIR/missing_dark.txt" || true
fi

if [ -s "$TMPDIR/missing_dark.txt" ]; then
    MISSING_DARK=$(wc -l < "$TMPDIR/missing_dark.txt")
    printf "\n缺失暗色适配 (%d 个 UI class):\n" "$MISSING_DARK"
    cat "$TMPDIR/missing_dark.txt" | sed 's/^/   - /'
else
    echo "所有 UI class 都有暗色适配"
fi

# --------------------------------------------------
# 3. 模块行号一致性检查
# --------------------------------------------------
echo ""
echo "[模块行号]"
echo "------------------------"

if [ ! -f "$AGENTS_MD" ]; then
    echo "AGENTS.md 不存在，跳过行号检查"
    WARNINGS=$((WARNINGS + 1))
else
    LINE_ISSUES=0

    # 预处理：提取模块名和行号
    awk 'BEGIN {found=0} /^\| 模块/ {found=1; next} found && /^\|/ && !/^\|------/ {
        gsub(/^[[:space:]]*\|[[:space:]]*/, ""); gsub(/[[:space:]]*\|[[:space:]]*/, "|");
        n = split($0, a, "|");
        if (n >= 2) {
            name = a[1]; gsub(/^[[:space:]]*|[[:space:]]*$/, "", name);
            range = a[2]; gsub(/^[[:space:]]*|[[:space:]]*$/, "", range);
            if (name != "" && name != "模块") {
                split(range, r, /[–-]/);
                start = r[1]; gsub(/[~[:space:]]/, "", start);
                if (start ~ /^[0-9]+$/) print name "|" start;
            }
        }
    }' "$AGENTS_MD" > "$TMPDIR/agents_modules.txt" || true

    while IFS='|' read -r name expected_start; do
        [ -z "$name" ] && continue
        actual_start=""

        case "$name" in
            STYLES)
                actual_start=$(grep -n "^const STYLES " "$MAIN_JS" | head -1 | cut -d: -f1 || true)
                ;;
            USER_CONFIG)
                actual_start=$(grep -n "^const USER_CONFIG " "$MAIN_JS" | head -1 | cut -d: -f1 || true)
                ;;
            *)
                # 用 const Name = (function()
                actual_start=$(grep -n "const $name = (function" "$MAIN_JS" | head -1 | cut -d: -f1 || true)
                if [ -z "$actual_start" ]; then
                    compact=$(echo "$name" | tr -d ' ')
                    actual_start=$(grep -n "const $compact = (function" "$MAIN_JS" | head -1 | cut -d: -f1 || true)
                fi
                ;;
        esac

        if [ -n "$actual_start" ] && [ -n "$expected_start" ]; then
            diff=$((actual_start - expected_start))
            diff_abs=${diff#-}
            if [ "$diff_abs" -gt 10 ]; then
                echo "行号偏差: $name AGENTS.md=$expected_start 实际=$actual_start (差 $diff_abs 行)"
                LINE_ISSUES=$((LINE_ISSUES + 1))
            fi
        elif [ -z "$actual_start" ]; then
            echo "无法定位模块: $name"
            LINE_ISSUES=$((LINE_ISSUES + 1))
        fi
    done < "$TMPDIR/agents_modules.txt"

    if [ "$LINE_ISSUES" -gt 0 ]; then
        WARNINGS=$((WARNINGS + LINE_ISSUES))
    else
        echo "AGENTS.md 行号准确"
    fi
fi

# --------------------------------------------------
# 结果汇总
# --------------------------------------------------
echo ""
echo "============================================"
if [ "$ERRORS" -gt 0 ]; then
    echo "结果: $ERRORS 个错误, $WARNINGS 个警告"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo "结果: $WARNINGS 个警告（建议清理）"
    exit 0
else
    echo "结果: 全部通过"
fi
