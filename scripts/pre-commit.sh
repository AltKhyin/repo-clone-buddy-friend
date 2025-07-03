#!/usr/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🎨 Running lint-staged..."
npx lint-staged

echo "🧪 Running tests to ensure code quality..."
npm run test

echo "✅ All pre-commit checks passed!"