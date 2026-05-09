#!/bin/bash
# ==============================================
# 模块依赖方向检查脚本 (lint-modules.sh)
# 检查 IIFE 模块间的引用方向，防止后定义模块
# 反向引用前定义模块的内部状态
# ==============================================

SCRIPT="bilibili-study-focus-assistant.user.js"
ERRORS=0

echo "🔍 模块依赖方向检查"
echo "====================="

# 模块定义顺序（从先到后）
# 格式：序号:模块名:起始行关键词
MODULES=(
    "1:ConfigManager:^const ConfigManager = (function"
    "2:GlobalStateManager:^const GlobalStateManager = (function"
    "3:TabManager:^const TabManager = (function"
    "4:DebugTelemetry:^const DebugTelemetry = (function"
    "5:HistoryVideoTracker:^const HistoryVideoTracker = (function"
    "6:StorageManager:^const StorageManager = (function"
    "7:PageMonitor:^const PageMonitor = (function"
    "8:FloatingWindow:^const FloatingWindow = (function"
    "9:TelemetryUI:^const TelemetryUI = (function"
    "10:DetailPanel:^function open\|DetailPanel\.open"
    "11:WordVerifier:^const WordVerifier = (function"
    "12:StatisticsTracker:^const StatisticsTracker = (function"
    "13:ModalManager:^const ModalManager = (function"
    "14:InterventionController:^const InterventionController = (function"
    "15:MainIIFE:^// Main Initialization"
)

echo ""
echo "[反向引用检查]"
echo "规则：后定义的模块不应直接调用前定义模块的内部方法"

# 检查规则：后模块:前模块:禁止的调用模式
check_rule() {
    local from_name="$1"   # 后定义的模块名
    local to_name="$2"     # 前定义的模块名
    local pattern="$3"     # 禁止的调用模式

    # 找到 from 模块的起始行
    from_line=""
    from_end="99999"
    for i in "${!MODULES[@]}"; do
        local entry="${MODULES[$i]}"
        local name=$(echo "$entry" | cut -d: -f2)
        local kw=$(echo "$entry" | cut -d: -f3-)
        if [ "$name" = "$from_name" ]; then
            from_line=$(grep -n "$kw" "$SCRIPT" | head -1 | cut -d: -f1)
            # 下一个模块的起始行就是本模块的结束行
            local next_idx=$((i + 1))
            if [ "$next_idx" -lt "${#MODULES[@]}" ]; then
                local next_entry="${MODULES[$next_idx]}"
                local next_kw=$(echo "$next_entry" | cut -d: -f3-)
                from_end=$(grep -n "$next_kw" "$SCRIPT" | head -1 | cut -d: -f1)
            fi
            break
        fi
    done
    [ -z "$from_line" ] && return

    # 检查 pattern 是否出现在 from 模块的定义范围内
    local hit_lines=$(grep -n "$pattern" "$SCRIPT" 2>/dev/null | grep -v "^[0-9]*:#\|^[0-9]*://" || true)
    while IFS=: read -r line_num content; do
        [ -z "$line_num" ] && continue
        # 只在模块定义范围内检查（from_line 到 from_end 之间）
        if [ "$line_num" -gt "$from_line" ] 2>/dev/null && [ "$line_num" -lt "$from_end" ] 2>/dev/null; then
            echo "❌ $from_name 内部引用 $to_name（$pattern 在 $line_num 行）"
            ERRORS=$((ERRORS + 1))
        fi
    done <<< "$hit_lines"
}

# 核心检查：后定义的模块不应直接访问 __bilibiliStudyAppState（应由 GlobalStateManager 代理）
check_rule "DetailPanel" "GlobalStateManager" "__bilibiliStudyAppState"
check_rule "InterventionController" "GlobalStateManager" "__bilibiliStudyAppState"
check_rule "WordVerifier" "GlobalStateManager" "__bilibiliStudyAppState"

# TabManager 的内部变量不应被后定义的模块直接访问
check_rule "DetailPanel" "TabManager" "TabManager\.isMaster"
check_rule "DetailPanel" "TabManager" "TabManager\.TAB_ID"
check_rule "InterventionController" "TabManager" "TabManager\.isMaster"

# 总结
echo ""
echo "====================="
if [ "$ERRORS" -gt 0 ]; then
    echo "❌ $ERRORS 个依赖方向违规"
    exit 1
else
    echo "✅ 依赖方向检查通过"
fi
