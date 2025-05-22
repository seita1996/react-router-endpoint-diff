#!/bin/bash
# デバッグ用スクリプト

set -e

PROJECT_DIR="/Users/tahara/Documents/prj/react-router-endpoint-diff"
cd "$PROJECT_DIR"

echo "🔧 React Router Endpoint Diff - Debug Mode"
echo "==========================================="

case "${1:-help}" in
  "help")
    echo "使用方法:"
    echo "  ./debug.sh help        - このヘルプを表示"
    echo "  ./debug.sh test        - テスト実行"
    echo "  ./debug.sh build       - ビルド"
    echo "  ./debug.sh run         - 基本実行"
    echo "  ./debug.sh verbose     - verbose実行"
    echo "  ./debug.sh json        - JSON出力"
    echo "  ./debug.sh custom      - カスタムオプション"
    ;;
  "test")
    echo "📝 テスト実行中..."
    npm test
    ;;
  "build")
    echo "🔨 ビルド中..."
    npm run build
    ;;
  "run")
    echo "🚀 基本実行..."
    npx ts-node src/cli.ts --routes-dir . --summary-only
    ;;
  "verbose")
    echo "🔍 verbose実行..."
    npx ts-node src/cli.ts --routes-dir . --verbose --summary-only
    ;;
  "json")
    echo "📄 JSON出力..."
    npx ts-node src/cli.ts --routes-dir . --json
    ;;
  "custom")
    echo "⚙️  カスタム実行..."
    echo "オプションを入力してください："
    read -r options
    npx ts-node src/cli.ts $options
    ;;
  *)
    echo "❌ 不明なコマンド: $1"
    echo "   ./debug.sh help でヘルプを確認してください"
    exit 1
    ;;
esac
