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

# ---- 提取 CSS 中定义的 class 和 keyframes（从 STYLES 常量区域） ----
if [ -n "$STYLES_START" ] && [ -n "$STYLES_END" ]; then
    awk -v start="$STYLES_START" -v end="$STYLES_END" 'NR>start && NR<end' "$MAIN_JS" > "$TMPDIR/css_area.txt"

    # 提取 .bilibili-study-xxx 常规 class 定义
    grep -oP '\.bilibili-study-\w+(?:-\w+)*' "$TMPDIR/css_area.txt" \
        | sed 's/^\.//' > "$TMPDIR/_css_regular.txt" || true

    # 提取 @keyframes bilibili-study-xxx 动画名（有效 CSS 定义）
    grep -oP '(?<=@keyframes\s)bilibili-study-\w+(?:-\w+)*' "$TMPDIR/css_area.txt" \
        > "$TMPDIR/_css_keyframes.txt" 2>/dev/null || true

    # 提取 class="bilibili-study-xxx" 内联定义（CSS 区域中可能的 HTML 模板）
    grep -oP '(?<=class=")bilibili-study-\w+(?:-\w+)*(?=")' "$TMPDIR/css_area.txt" \
        > "$TMPDIR/_css_inline.txt" 2>/dev/null || true

    # 合并所有 CSS 定义
    cat "$TMPDIR/_css_regular.txt" "$TMPDIR/_css_keyframes.txt" "$TMPDIR/_css_inline.txt" \
        | sort -u > "$TMPDIR/css_classes.txt"

    # ---- 提取 JS 中的 class 引用，并识别上下文（排除 ID / 动画名 / 动态模板） ----
    awk -v start="$STYLES_START" -v end="$STYLES_END" '
    BEGIN { q = sprintf("%c", 39) }
    NR < start || NR > end {
        rest = $0
        while (match(rest, /bilibili-study-[a-zA-Z0-9-]+/)) {
            name = substr(rest, RSTART, RLENGTH)
            before = substr(rest, 1, RSTART - 1)
            after = substr(rest, RSTART + RLENGTH)

            ctx = "CLASS"
            # getElementById(\x27xxx\x27) → DOM ID，不是 CSS class
            if (before ~ ("getElementById\\(" q "$")) ctx = "ID"
            # @keyframes xxx → 动画名，不是 CSS class
            if (before ~ /@keyframes[[:space:]]+$/) ctx = "KEYFRAME"
            # xxx${...} → 动态构建的 class 前缀
            if (after ~ /\$\{/) ctx = "TEMPLATE_PREFIX"
            # id="xxx" → DOM HTML 属性 ID
            if (before ~ /id="$/ || before ~ ("id=" q "$")) ctx = "ID"
            # .id = "xxx" → DOM ID 赋值
            if (before ~ /\.id[[:space:]]*=[[:space:]]*"$/ || before ~ ("\\.id[[:space:]]*=[[:space:]]*" q "$")) ctx = "ID"

            print name "|" ctx
            rest = substr(rest, RSTART + RLENGTH)
        }
    }' "$MAIN_JS" > "$TMPDIR/_js_classified.txt" || true

    # 按类型分离
    grep '\|CLASS$' "$TMPDIR/_js_classified.txt" | cut -d'|' -f1 | sort -u > "$TMPDIR/_js_class_refs.txt" || true
    grep '\|ID$' "$TMPDIR/_js_classified.txt" | cut -d'|' -f1 | sort -u > "$TMPDIR/_js_ids.txt" || true
    grep '\|KEYFRAME$' "$TMPDIR/_js_classified.txt" | cut -d'|' -f1 | sort -u > "$TMPDIR/_js_keyframes.txt" || true
    grep '\|TEMPLATE_PREFIX$' "$TMPDIR/_js_classified.txt" | cut -d'|' -f1 | sort -u > "$TMPDIR/_js_templates_all.txt" || true

    # 如果一个名字同时出现为 CLASS 和 TEMPLATE_PREFIX，那么它是真正的 class 引用
    comm -23 "$TMPDIR/_js_ids.txt" "$TMPDIR/_js_class_refs.txt" 2>/dev/null > "$TMPDIR/_js_ids_only.txt" || true
    comm -23 "$TMPDIR/_js_keyframes.txt" "$TMPDIR/_js_class_refs.txt" 2>/dev/null > "$TMPDIR/_js_keyframes_only.txt" || true
    comm -23 "$TMPDIR/_js_templates_all.txt" "$TMPDIR/_js_class_refs.txt" 2>/dev/null > "$TMPDIR/_js_template_prefixes.txt" || true

    # 真正的 class 引用（排除纯 ID / 纯 keyframe 后）
    cp "$TMPDIR/_js_class_refs.txt" "$TMPDIR/js_refs_only.txt"

    # ====== 交叉检查：JS 引用 vs CSS 定义 ======

    # 真正缺失的 class：CLASS 类型且不在 CSS 中
    if [ -s "$TMPDIR/js_refs_only.txt" ] && [ -s "$TMPDIR/css_classes.txt" ]; then
        grep -F -x -v -f "$TMPDIR/css_classes.txt" "$TMPDIR/js_refs_only.txt" 2>/dev/null \
            | grep -v '^bilibili-study-dark-mode$' > "$TMPDIR/_truly_missing.txt" || true
    fi

    # 可能是假阳性的：ID/KEYFRAME/TEMPLATE_PREFIX 类型且不在 CSS 中
    : > "$TMPDIR/_fp_report.txt"
    if [ -s "$TMPDIR/_js_ids_only.txt" ]; then
        grep -F -x -v -f "$TMPDIR/css_classes.txt" "$TMPDIR/_js_ids_only.txt" 2>/dev/null \
            | sed 's/^/   - [DOM ID] /' > "$TMPDIR/_fp_ids.txt" || true
        [ -s "$TMPDIR/_fp_ids.txt" ] && cat "$TMPDIR/_fp_ids.txt" >> "$TMPDIR/_fp_report.txt"
    fi
    if [ -s "$TMPDIR/_js_keyframes_only.txt" ]; then
        grep -F -x -v -f "$TMPDIR/css_classes.txt" "$TMPDIR/_js_keyframes_only.txt" 2>/dev/null \
            | sed 's/^/   - [动画名] /' > "$TMPDIR/_fp_keyframes.txt" || true
        [ -s "$TMPDIR/_fp_keyframes.txt" ] && cat "$TMPDIR/_fp_keyframes.txt" >> "$TMPDIR/_fp_report.txt"
    fi
    if [ -s "$TMPDIR/_js_template_prefixes.txt" ]; then
        grep -F -x -v -f "$TMPDIR/css_classes.txt" "$TMPDIR/_js_template_prefixes.txt" 2>/dev/null \
            | sed 's/^/   - [动态前缀] /' > "$TMPDIR/_fp_template.txt" || true
        [ -s "$TMPDIR/_fp_template.txt" ] && cat "$TMPDIR/_fp_template.txt" >> "$TMPDIR/_fp_report.txt"
    fi

    # 输出真正缺失
    TRULY_MISSING_COUNT=0
    if [ -s "$TMPDIR/_truly_missing.txt" ]; then
        TRULY_MISSING_COUNT=$(wc -l < "$TMPDIR/_truly_missing.txt")
        printf "\n真正缺失的 class (%d 个):\n" "$TRULY_MISSING_COUNT"
        cat "$TMPDIR/_truly_missing.txt" | sed 's/^/   - /'
        ERRORS=$((ERRORS + TRULY_MISSING_COUNT))
    fi

    # 输出可能是假阳性的
    FP_COUNT=0
    if [ -s "$TMPDIR/_fp_report.txt" ]; then
        FP_COUNT=$(wc -l < "$TMPDIR/_fp_report.txt")
        printf "\n可能是假阳性 (%d 个):\n" "$FP_COUNT"
        cat "$TMPDIR/_fp_report.txt"
        WARNINGS=$((WARNINGS + FP_COUNT))
    fi

    if [ "$TRULY_MISSING_COUNT" -eq 0 ] && [ "$FP_COUNT" -eq 0 ]; then
        echo "所有 JS 引用的 class 在 CSS 中都有定义"
    fi

else
    echo "警告: 无法确定 STYLES 常量边界，回退到全文件搜索"
    grep -oP '\.bilibili-study-\w+(?:-\w+)*' "$MAIN_JS" | sed 's/^\.//' | sort -u > "$TMPDIR/css_classes.txt"
    grep -oP 'bilibili-study-\w+(?:-\w+)*' "$MAIN_JS" | sort -u > "$TMPDIR/js_refs_only.txt"

    # 回退模式的简单检查
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
