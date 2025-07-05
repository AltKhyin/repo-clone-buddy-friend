// ABOUTME: Debug script to test vitest execution
const { execSync } = require('child_process');

console.log('🔍 Starting vitest debug...');
console.log('⏰ Current time:', new Date().toISOString());

try {
  console.log('📦 Testing vitest CLI directly...');
  const result = execSync('npx vitest --version', { 
    encoding: 'utf8', 
    timeout: 5000,
    stdio: 'pipe'
  });
  console.log('✅ Vitest CLI works:', result.trim());
} catch (error) {
  console.log('❌ Vitest CLI failed:', error.message);
  process.exit(1);
}

try {
  console.log('🧪 Testing basic vitest execution...');
  const testResult = execSync('timeout 10s npx vitest run src/test-ultra-simple.test.ts --config=vitest.debug.config.ts --no-watch 2>&1 || true', { 
    encoding: 'utf8',
    timeout: 15000
  });
  console.log('📊 Test result:', testResult);
} catch (error) {
  console.log('❌ Test execution error:', error.message);
}

console.log('✅ Debug script completed');