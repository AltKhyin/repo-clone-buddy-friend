#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🎨 Running lint-staged..."
npx lint-staged

echo "🧪 Running linting checks..."
npm run lint || {
  echo "❌ Linting failed! Fix ESLint errors before committing."
  echo "💡 Pre-commit BLOCKED - You are not allowed to commit with linting errors."
  exit 1
}

echo "🔧 Running TypeScript compilation check..."
npm run build > /dev/null 2>&1 || {
  echo "❌ Build failed! Fix TypeScript errors before committing."
  echo "💡 Pre-commit BLOCKED - You are not allowed to commit with build errors."
  exit 1
}

echo "🧪 Running test suite validation..."
echo "⏰ This may take several minutes - please wait..."

# First, try a quick syntax and basic import check
echo "🔍 Step 1: Running syntax validation..."
npm run build > /dev/null 2>&1 || {
  echo "❌ Build failed during test phase - TypeScript syntax errors detected."
  exit 1
}

echo "🔍 Step 2: Running test suite with timeout protection..."
# Run tests with a 3-minute timeout for faster feedback
timeout 180 npm run test || {
  exit_code=$?
  echo ""
  if [ $exit_code -eq 124 ]; then
    echo "⏰ ❌ TESTS TIMED OUT AFTER 3 MINUTES! ❌ ⏰"
    echo "💡 Pre-commit BLOCKED - Tests are hanging or have configuration issues."
    echo "🔧 Test infrastructure needs attention - likely infinite loops or async issues."
    echo "📋 You can investigate by running 'npm test' manually for detailed output."
    echo "🚫 COMMIT PREVENTED for your protection."
  else
    echo "❌ ❌ ❌ TESTS FAILED! ❌ ❌ ❌" 
    echo "💡 Pre-commit BLOCKED - You are not allowed to commit with failing tests."
    echo "🔧 Run 'npm test' to see detailed test failures and fix them."
    echo "🚫 COMMIT PREVENTED for your protection."
  fi
  exit 1
}

echo ""
echo "✅ ✅ ✅ ALL CHECKS PASSED! ✅ ✅ ✅"
echo "🛡️  Your commit is safe - all tests pass!"
echo "🚀 Proceeding with commit..."