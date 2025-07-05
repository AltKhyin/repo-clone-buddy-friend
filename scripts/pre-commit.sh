#!/usr/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🎨 Running lint-staged..."
npx lint-staged

echo "🧪 Running linting checks..."
npm run lint

echo "🔧 Running build check..."
npm run build > /dev/null 2>&1

echo "🧪 Running full test suite with timeout..."
timeout 300 npm run test || {
  echo "⚠️  Tests timed out after 5 minutes or failed"
  echo "📋 You can run 'npm test' manually to debug specific issues"
  exit 1
}

echo "✅ All pre-commit checks passed!"