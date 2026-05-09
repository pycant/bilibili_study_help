#!/bin/bash
# ==============================================
# Health Report for Telemetry Dashboard
# 运行所有 Harness 检查，输出 JSON
# 用法: bash harness/scripts/health-report.sh
# ==============================================

set -o pipefail 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

TIMESTAMP=$(date -Iseconds 2>/dev/null || date +"%Y-%m-%dT%H:%M:%S+08:00" 2>/dev/null || echo "unknown")

# ---- 1. shared_interface ----
if [ -f ".harness-shared-interfaces.md" ]; then
    SI_STATUS="pass"
    SI_DETAIL=".harness-shared-interfaces.md 存在"
else
    SI_STATUS="fail"
    SI_DETAIL=".harness-shared-interfaces.md 缺失"
fi

# ---- 2. file_integrity ----
FI_FILES=(
    "bilibili-study-focus-assistant.user.js"
    "AGENTS.md"
    "package.json"
    "CHANGELOG.md"
    "SCRIPT_LOGIC.md"
)
FI_FOUND=0
FI_TOTAL=${#FI_FILES[@]}
for f in "${FI_FILES[@]}"; do
    if [ -f "$f" ]; then
        FI_FOUND=$((FI_FOUND + 1))
    fi
done
if [ "$FI_FOUND" -eq "$FI_TOTAL" ]; then
    FI_STATUS="pass"
elif [ "$FI_FOUND" -gt 0 ]; then
    FI_STATUS="warn"
else
    FI_STATUS="fail"
fi
FI_DETAIL="${FI_FOUND}/${FI_TOTAL} 文件存在"

# ---- 3. structure ----
STRUCT_OK=true
STRUCT_DETAIL=""
MAIN_JS="bilibili-study-focus-assistant.user.js"
if grep -q "@match.*bilibili.com/video/BV" "$MAIN_JS" 2>/dev/null; then
    STRUCT_DETAIL="@match 正确"
else
    STRUCT_DETAIL="@match 缺失"
    STRUCT_OK=false
fi
STRUCT_VERSION=$(grep "@version" "$MAIN_JS" 2>/dev/null | head -1 | awk '{print $2}')
if [ -n "$STRUCT_VERSION" ]; then
    STRUCT_DETAIL="${STRUCT_DETAIL}, @version ${STRUCT_VERSION}"
else
    STRUCT_DETAIL="${STRUCT_DETAIL}, @version 缺失"
    STRUCT_OK=false
fi
if [ "$STRUCT_OK" = true ]; then
    STRUCT_STATUS="pass"
else
    STRUCT_STATUS="fail"
fi
STRUCT_DETAIL="@match + @version 正确"

# ---- 4. harness_structure ----
HS_ITEMS=("harness/scripts/init.sh" "harness/scripts/check.sh" "harness/tasks" "harness/evals/cases")
HS_FOUND=0
HS_TOTAL=${#HS_ITEMS[@]}
for item in "${HS_ITEMS[@]}"; do
    if [ -e "$item" ]; then
        HS_FOUND=$((HS_FOUND + 1))
    fi
done
if [ "$HS_FOUND" -eq "$HS_TOTAL" ]; then
    HS_STATUS="pass"
elif [ "$HS_FOUND" -gt 0 ]; then
    HS_STATUS="warn"
else
    HS_STATUS="fail"
fi
HS_DETAIL="${HS_FOUND}/${HS_TOTAL} 组件存在"

# ---- 5. dependencies ----
if command -v node &> /dev/null; then
    NODE_OK="pass"
    if [ -d "node_modules" ] && [ -f "package.json" ]; then
        DEP_STATUS="pass"
        DEP_DETAIL="Node $(node --version 2>/dev/null), npm 依赖已安装"
    else
        DEP_STATUS="warn"
        DEP_DETAIL="npm 依赖未安装"
    fi
else
    DEP_STATUS="warn"
    DEP_DETAIL="Node.js 未安装"
fi

# ---- 6. git_status ----
if [ -d ".git" ]; then
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    GIT_STATUS=$(git status --porcelain 2>/dev/null | wc -l)
    if [ "$GIT_STATUS" -gt 0 ]; then
        GIT_DETAIL="${GIT_BRANCH} 分支, ${GIT_STATUS} 个未提交变更"
        GIT_STATUS_CHECK="warn"
    else
        GIT_DETAIL="${GIT_BRANCH} 分支, 工作区干净"
        GIT_STATUS_CHECK="pass"
    fi
else
    GIT_DETAIL="不是 Git 仓库"
    GIT_STATUS_CHECK="fail"
fi

# ---- 7. eval ----
EVAL_OUTPUT=$(bash harness/scripts/eval-check.sh 2>&1) || true
EVAL_RESULT_LINE=$(echo "$EVAL_OUTPUT" | grep "^结果:" | head -1)
EVAL_PASSED=$(echo "$EVAL_RESULT_LINE" | grep -oP '\d+(?=/\d+ PASS)' || echo "0")
EVAL_TOTAL=$(echo "$EVAL_RESULT_LINE" | grep -oP '(?<=\d/)\d+(?= PASS)' || echo "0")
if echo "$EVAL_OUTPUT" | grep -q "FAIL"; then
    EVAL_STATUS="fail"
else
    EVAL_STATUS="pass"
fi
EVAL_DETAIL="${EVAL_PASSED}/${EVAL_TOTAL} PASS"

# ---- 8. integration ----
INT_OUTPUT=$(bash harness/scripts/integration-check.sh 2>&1) || true
MISSING_CSS=$(echo "$INT_OUTPUT" | grep -oP "缺失的 class \((\d+) 个\)" | grep -oP '\d+' || echo "0")
MISSING_DARK=$(echo "$INT_OUTPUT" | grep -oP "缺失暗色适配 \((\d+) 个 UI class\)" | grep -oP '\d+' || echo "0")
LINE_ISSUES=0
if echo "$INT_OUTPUT" | grep -q "无法定位"; then
    LINE_ISSUES=$(echo "$INT_OUTPUT" | grep "无法定位" | wc -l)
fi
if echo "$INT_OUTPUT" | grep -q "行号偏差"; then
    LINE_ISSUES=$((LINE_ISSUES + $(echo "$INT_OUTPUT" | grep "行号偏差" | wc -l)))
fi
if echo "$INT_OUTPUT" | grep -q "^结果: 0 个错误"; then
    INT_STATUS="pass"
    INT_DETAIL="全部通过"
else
    INT_STATUS="warn"
    INT_DETAIL="CSS: ${MISSING_CSS}个缺失, 暗色: ${MISSING_DARK}个缺失, 行号: ${LINE_ISSUES}个偏差"
fi

# ---- 9. lint ----
LINT_OUTPUT=$(bash harness/scripts/lint-modules.sh 2>&1) || true
LINT_VIOLATIONS=$(echo "$LINT_OUTPUT" | grep "❌" | grep -c "内部引用" || true)
if [ "$LINT_VIOLATIONS" -gt 0 ]; then
    LINT_STATUS="fail"
    LINT_DETAIL="${LINT_VIOLATIONS} 个架构违规"
else
    LINT_STATUS="pass"
    LINT_DETAIL="0 个架构违规"
fi

# ---- Summary ----
PASSED=0
WARNINGS=0
FAILED=0

for s in "$SI_STATUS" "$FI_STATUS" "$STRUCT_STATUS" "$HS_STATUS" "$DEP_STATUS" "$GIT_STATUS_CHECK" "$EVAL_STATUS" "$INT_STATUS" "$LINT_STATUS"; do
    case "$s" in
        pass) PASSED=$((PASSED + 1)) ;;
        warn) WARNINGS=$((WARNINGS + 1)) ;;
        fail) FAILED=$((FAILED + 1)) ;;
    esac
done

# ---- Build JSON ----
JSON=$(cat <<JSONEOF
{
  "timestamp": "${TIMESTAMP}",
  "summary": {
    "passed": ${PASSED},
    "warnings": ${WARNINGS},
    "failed": ${FAILED}
  },
  "checks": {
    "shared_interface": { "status": "${SI_STATUS}", "detail": "${SI_DETAIL}" },
    "file_integrity": { "status": "${FI_STATUS}", "detail": "${FI_DETAIL}" },
    "structure": { "status": "${STRUCT_STATUS}", "detail": "${STRUCT_DETAIL}" },
    "harness_structure": { "status": "${HS_STATUS}", "detail": "${HS_DETAIL}" },
    "dependencies": { "status": "${DEP_STATUS}", "detail": "${DEP_DETAIL}" },
    "git_status": { "status": "${GIT_STATUS_CHECK}", "detail": "${GIT_DETAIL}" },
    "eval": { "status": "${EVAL_STATUS}", "detail": "${EVAL_DETAIL}" },
    "integration": { 
      "status": "${INT_STATUS}", 
      "detail": "${INT_DETAIL}",
      "missing_css": ${MISSING_CSS},
      "missing_dark": ${MISSING_DARK},
      "line_issues": ${LINE_ISSUES}
    },
    "lint": {
      "status": "${LINT_STATUS}",
      "detail": "${LINT_DETAIL}",
      "violations": ${LINT_VIOLATIONS}
    }
  }
}
JSONEOF
)

# 同时保存到文件（供 Telemetry Dashboard 读取）
echo "$JSON" > "$SCRIPT_DIR/harness/health-status.json" 2>/dev/null || true

# Format JSON
if command -v jq &>/dev/null; then
    echo "$JSON" | jq .
elif command -v python &>/dev/null && python -c "import json; print('ok')" &>/dev/null; then
    echo "$JSON" | python -m json.tool
elif command -v python3 &>/dev/null && python3 -c "import json; print('ok')" &>/dev/null; then
    echo "$JSON" | python3 -m json.tool
else
    echo "$JSON"
fi
