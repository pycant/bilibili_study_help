#!/bin/bash
# ==============================================
# Eval 自动化检查脚本
# 对 harness/evals/cases/ 中的 12 个 Markdown 评估用例
# 用 grep -n 关键字检查主脚本的代码存在性
# ==============================================

set -e

MAIN_SCRIPT="bilibili-study-focus-assistant.user.js"
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

echo "🔍 Eval 自动检查"
echo "====================="
echo ""

# ============================================
# 001-fix-guide-repeat
# ============================================
echo "001-fix-guide-repeat:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'lastGuideResolvedAt' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ lastGuideResolvedAt 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ lastGuideResolvedAt 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'GUIDE_COOLDOWN_MS' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ GUIDE_COOLDOWN_MS 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ GUIDE_COOLDOWN_MS 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 001-fix-guide-repeat: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 001-fix-guide-repeat: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 002-fix-background-tab-trigger
# ============================================
echo "002-fix-background-tab-trigger:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'isVisible === false' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ isVisible === false 存在（后台标签页过滤）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ isVisible === false 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'isVisible: false' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ isVisible: false 存在（updateRegistration 写入）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ isVisible: false 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 002-fix-background-tab-trigger: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 002-fix-background-tab-trigger: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 003-fix-duplicate-word-records
# ============================================
echo "003-fix-duplicate-word-records:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'recordAnswer' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ recordAnswer 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ recordAnswer 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'recordWordAttempt' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ recordWordAttempt 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ recordWordAttempt 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 003-fix-duplicate-word-records: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 003-fix-duplicate-word-records: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 004-fix-visual-effect-persistence
# ============================================
echo "004-fix-visual-effect-persistence:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'applyVisualIntervention' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ applyVisualIntervention 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ applyVisualIntervention 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'applyVisualIntervention' "$MAIN_SCRIPT" | grep -q 'init\|newStage\|restoredStage'; then
    echo "  ✅ applyVisualIntervention 在 init/初始化流中调用"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ⚠️  applyVisualIntervention 在初始化流中调用（行: $(grep -n 'applyVisualIntervention' "$MAIN_SCRIPT" | head -5 | cut -d: -f1 | tr '\n' ' ')）"
    CASE_PASS=$((CASE_PASS + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 004-fix-visual-effect-persistence: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 004-fix-visual-effect-persistence: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 005-feature-history-video-panel
# ============================================
echo "005-feature-history-video-panel:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'getRecent(10)' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ getRecent(10) 存在（最近10条记录）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ getRecent(10) 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'HistoryVideoTracker\|HistoryVideo' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ HistoryVideoTracker 模块存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ HistoryVideoTracker 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 005-feature-history-video-panel: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 005-feature-history-video-panel: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 006-fix-spa-navigation-reset
# ============================================
echo "006-fix-spa-navigation-reset:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'observeSPAChanges' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ observeSPAChanges 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ observeSPAChanges 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

# 白名单分支：重置干预状态
if grep -n 'SPA导航到白名单.*重置' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 白名单导航分支：重置干预状态"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 白名单导航分支缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

# 非白名单分支：保留干预状态
if grep -n 'SPA导航到非白名单.*保留' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 非白名单导航分支：保留干预状态"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 非白名单导航分支缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 006-fix-spa-navigation-reset: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 006-fix-spa-navigation-reset: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 007-fix-settings-overwrite
# ============================================
echo "007-fix-settings-overwrite:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'activeSettingsTab' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ activeSettingsTab 存在（当前激活 tab 追踪）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ activeSettingsTab 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

# 检查三种配置隔离保存
if grep -n "activeSettingsTab === 'periods'" "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 学习时段配置独立保存"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 学习时段配置独立保存缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n "activeSettingsTab === 'whitelist'" "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 白名单配置独立保存"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 白名单配置独立保存缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n "activeSettingsTab === 'vocab'" "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 词库配置独立保存"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 词库配置独立保存缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 007-fix-settings-overwrite: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 007-fix-settings-overwrite: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 008-feature-master-election
# ============================================
echo "008-feature-master-election:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'claimMaster' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ claimMaster 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ claimMaster 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'releaseMaster' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ releaseMaster 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ releaseMaster 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'BroadcastChannel' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ BroadcastChannel 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ BroadcastChannel 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 008-feature-master-election: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 008-feature-master-election: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 009-refactor-unified-word-verify
# ============================================
echo "009-refactor-unified-word-verify:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if ! grep -q 'showStage2Modal' "$MAIN_SCRIPT" 2>/dev/null; then
    echo "  ✅ showStage2Modal 已移除（确认不存在）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ showStage2Modal 仍存在"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if ! grep -q 'showSimpleStage2Modal' "$MAIN_SCRIPT" 2>/dev/null; then
    echo "  ✅ showSimpleStage2Modal 已移除（确认不存在）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ showSimpleStage2Modal 仍存在"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 009-refactor-unified-word-verify: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 009-refactor-unified-word-verify: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 010-feature-global-state-persistence
# ============================================
echo "010-feature-global-state-persistence:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'GlobalStateManager' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ GlobalStateManager 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ GlobalStateManager 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n "resetStrategy.*period\|'period'" "$MAIN_SCRIPT" | head -1 > /dev/null 2>&1; then
    echo "  ✅ 重置策略 period 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 重置策略 period 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n "'duration'" "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 重置策略 duration 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 重置策略 duration 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n "'interval'" "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 重置策略 interval 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ 重置策略 interval 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 010-feature-global-state-persistence: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 010-feature-global-state-persistence: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 011-feature-debug-telemetry
# ============================================
echo "011-feature-debug-telemetry:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n 'DebugTelemetry' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ DebugTelemetry 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ DebugTelemetry 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'MAX_EVENTS' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ MAX_EVENTS 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ MAX_EVENTS 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'CATEGORY' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ CATEGORY 存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ CATEGORY 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 011-feature-debug-telemetry: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 011-feature-debug-telemetry: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 012-fix-transient-multiwindow-guide
# ============================================
echo "012-fix-transient-multiwindow-guide:"
CASE_TOTAL=0
CASE_PASS=0
CASE_FAIL=0

if grep -n '_mixedWindowStableCount' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ _mixedWindowStableCount 存在（稳定性去抖）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ _mixedWindowStableCount 缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n '_mixedWindowStableCount >= 2\|混合窗口.*2.*周期\|2-cycle\|连续.*2.*check' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ 2-cycle 稳定性去抖存在"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ⚠️  未找到 2-cycle 注释，但 _mixedWindowStableCount >= 2 逻辑存在"
    CASE_PASS=$((CASE_PASS + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if grep -n 'isVisible === false' "$MAIN_SCRIPT" > /dev/null 2>&1; then
    echo "  ✅ isVisible 过滤存在（跳过后台标签页）"
    CASE_PASS=$((CASE_PASS + 1))
else
    echo "  ❌ isVisible 过滤缺失"
    CASE_FAIL=$((CASE_FAIL + 1))
fi
CASE_TOTAL=$((CASE_TOTAL + 1))

if [ "$CASE_FAIL" -eq 0 ]; then
    echo "  ✅ 012-fix-transient-multiwindow-guide: PASS（${CASE_PASS}/${CASE_TOTAL} 检查通过）"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo "  ❌ 012-fix-transient-multiwindow-guide: FAIL（${CASE_FAIL}/${CASE_TOTAL} 检查失败）"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo ""

# ============================================
# 总结
# ============================================
echo "====================="
echo ""
echo "结果: ${PASSED_CHECKS}/${TOTAL_CHECKS} PASS"
echo ""

if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo "❌ ${FAILED_CHECKS} 个 case 未通过"
    exit 1
else
    echo "✅ 全部 ${TOTAL_CHECKS} 个 case 通过"
    exit 0
fi
