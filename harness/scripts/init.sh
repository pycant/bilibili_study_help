#!/bin/bash
# ==============================================
# Harness 环境初始化脚本
# 用法: bash harness/scripts/init.sh
# ==============================================

set -e

echo "🔧 初始化 B站学习专注提醒助手 - 开发环境"
echo "======================================"

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js >= 18"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# 2. 安装依赖
if [ -f "package.json" ]; then
    echo "📦 安装 npm 依赖..."
    npm install
    echo "✅ 依赖安装完成"
else
    echo "ℹ️  未找到 package.json，跳过依赖安装"
fi

# 3. 检查 git 仓库
if [ -d ".git" ]; then
    echo "✅ Git 仓库就绪"
    echo "   当前分支: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
else
    echo "⚠️  不是 Git 仓库，建议初始化"
fi

# 4. 检查项目文件完整性
REQUIRED_FILES=(
    "bilibili-study-focus-assistant.user.js"
    "AGENTS.md"
)
for f in "${REQUIRED_FILES[@]}"; do
    if [ -f "$f" ]; then
        echo "✅ 发现 $f"
    else
        echo "⚠️  缺少 $f"
    fi
done

# 5. 检查 harness 目录
HARNESS_DIRS=(
    "harness/scripts"
    "harness/evals/cases"
    "harness/tasks"
)
for d in "${HARNESS_DIRS[@]}"; do
    if [ -d "$d" ]; then
        echo "✅ Harness 目录 $d 就绪"
    else
        echo "⚠️  Harness 目录 $d 不存在"
    fi
done

# 6. 检查测试环境
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo "🧪 测试环境就绪"
fi

echo ""
echo "✅ 开发环境初始化完成"
echo "======================================"
echo "下一步:"
echo "  bash harness/scripts/check.sh  # 运行完整性检查"
echo "  npm test                       # 运行测试"
