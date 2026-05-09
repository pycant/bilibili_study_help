#!/bin/bash
# ==============================================
# Harness 统一检查脚本
# 用法: bash harness/scripts/check.sh
# ==============================================

set -e

echo "🔍 Harness 完整性检查"
echo "====================="

ERRORS=0
WARNINGS=0

# 0. 共享接口文件检查
echo ""
echo "[共享接口检查]"
if [ -f ".harness-shared-interfaces.md" ]; then
    echo "✅ 共享接口定义: .harness-shared-interfaces.md"
else
    echo "⚠️  共享接口文件缺失（仅多Agent并行时需要）"
fi

# 1. 核心文件存在性检查
check_file() {
    local file="$1"
    local desc="$2"
    if [ -f "$file" ]; then
        echo "✅ $desc: $file"
    else
        echo "❌ 缺少 $desc: $file"
        ERRORS=$((ERRORS + 1))
    fi
}

echo ""
echo "[文件完整性检查]"
check_file "bilibili-study-focus-assistant.user.js" "主脚本"
check_file "AGENTS.md" "Agent 简报"
check_file "package.json" "测试配置"
check_file "CHANGELOG.md" "更新日志"
check_file "SCRIPT_LOGIC.md" "运行逻辑文档"

# 2. 脚本基本结构检查
echo ""
echo "[脚本结构检查]"
if [ -f "bilibili-study-focus-assistant.user.js" ]; then
    # 检查 @match 声明
    if grep -q "@match.*bilibili.com/video/BV" "bilibili-study-focus-assistant.user.js" 2>/dev/null; then
        echo "✅ @match 声明正确"
    else
        echo "⚠️  @match 声明可能缺失"
        WARNINGS=$((WARNINGS + 1))
    fi

    # 检查 @version
    VERSION=$(grep "@version" "bilibili-study-focus-assistant.user.js" | head -1 | awk '{print $2}')
    if [ -n "$VERSION" ]; then
        echo "✅ 版本号: $VERSION"
    else
        echo "⚠️  未找到版本号"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# 3. Harness 目录结构检查
echo ""
echo "[Harness 结构检查]"
HARNESS_STRUCTURE=(
    "harness/scripts/init.sh"
    "harness/scripts/check.sh"
    "harness/tasks"
    "harness/evals/cases"
)
for item in "${HARNESS_STRUCTURE[@]}"; do
    if [ -e "$item" ]; then
        echo "✅ $item"
    else
        echo "⚠️  缺少 $item"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# 4. 依赖检查
echo ""
echo "[依赖检查]"
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node --version)"
    if [ -d "node_modules" ] && [ -f "package.json" ]; then
        echo "✅ npm 依赖已安装"
    else
        echo "⚠️  npm 依赖未安装 (运行 npm install)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "⚠️  Node.js 未安装"
    WARNINGS=$((WARNINGS + 1))
fi

# 5. Git 状态检查
echo ""
echo "[Git 状态]"
if [ -d ".git" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "✅ 分支: $BRANCH"
    STATUS=$(git status --porcelain 2>/dev/null | wc -l)
    if [ "$STATUS" -gt 0 ]; then
        echo "⚠️  有 $STATUS 个未提交的变更"
    else
        echo "✅ 工作区干净"
    fi
else
    echo "⚠️  不是 Git 仓库"
fi

# 6. 模块依赖方向检查（如果存在）
echo ""
echo "[模块依赖方向检查]"
if [ -f "harness/scripts/lint-modules.sh" ]; then
    echo "↳ 运行 lint 检查..."
    bash harness/scripts/lint-modules.sh || true
else
    echo "⚠️  模块 lint 脚本未安装"
    WARNINGS=$((WARNINGS + 1))
fi

# 7. 技术债交叉验证
echo ""
echo "[技术债一致性检查]"
if [ -f "harness/scripts/verify-techdebt.sh" ]; then
    echo "↳ 运行验证..."
    bash harness/scripts/verify-techdebt.sh || true
else
    echo "⚠️  技术债验证脚本未安装"
    WARNINGS=$((WARNINGS + 1))
fi

# 8. 检查 eval cases
echo ""
echo "[Eval 集检查]"
EVAL_COUNT=$(ls -1 harness/evals/cases/ 2>/dev/null | wc -l)
if [ "$EVAL_COUNT" -gt 0 ]; then
    echo "✅ 评估用例数: $EVAL_COUNT"
else
    echo "⚠️  评估用例为空"
fi

# 7. 集成验证检查（如果存在）
echo ""
echo "[集成验证检查]"
if [ -f "harness/scripts/integration-check.sh" ]; then
    echo "↳ 运行集成检查..."
    # 运行但不阻断主流程
    bash harness/scripts/integration-check.sh || true
else
    echo "⚠️  集成验证脚本未安装"
    WARNINGS=$((WARNINGS + 1))
fi

# 8. Eval 自动检查（如果存在）
echo ""
echo "[Eval 自动检查]"
if [ -f "harness/scripts/eval-check.sh" ]; then
    echo "↳ 运行 Eval 检查..."
    bash harness/scripts/eval-check.sh || true
else
    echo "⚠️  Eval 自动检查脚本未安装"
    WARNINGS=$((WARNINGS + 1))
fi

# 总结
echo ""
echo "====================="
if [ "$ERRORS" -gt 0 ]; then
    echo "❌ $ERRORS 个错误, ⚠️  $WARNINGS 个警告"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo "⚠️  $WARNINGS 个警告（均可忽略）"
else
    echo "✅ 全部检查通过"
fi
