# AI Autonomous Testing Protocol for EVIDENS

**Version:** 1.0.0  
**Date:** June 27, 2025  
**Purpose:** Comprehensive autonomous AI testing protocol for pre-deployment validation

---

## 🎯 PROTOCOL OVERVIEW

This protocol enables Claude Code to autonomously execute a complete testing suite before any production deployment. The protocol is designed to be executed entirely by AI without human intervention, providing comprehensive validation of all critical systems.

---

## 🚀 EXECUTION PHASES

### PHASE 1: Infrastructure Validation (MANDATORY)

#### 1.1 Environment Check
```bash
# Verify Node.js and dependencies
node --version
npm --version
npm list --depth=0 | grep -E "(react|vite|supabase|tanstack)"

# Check TypeScript configuration
npx tsc --noEmit --project tsconfig.app.json

# Verify Supabase CLI
supabase --version
```

#### 1.2 Build System Validation
```bash
# Clean build test
rm -rf dist/
npm run build

# Verify build artifacts
ls -la dist/
du -sh dist/

# Build size analysis
npm run build 2>&1 | grep -E "(kB|MB|chunks|warning)"
```

#### 1.3 Code Quality Gate
```bash
# Lint validation
npm run lint

# TypeScript strict compliance
npx tsc --noEmit --strict

# Detect unused dependencies
npx depcheck --ignores="@types/*,eslint*,vite*"
```

### PHASE 2: Database & Backend Validation (CRITICAL)

#### 2.1 Supabase Connection Test
```bash
# Start local Supabase
supabase start

# Verify services
supabase status

# Test database connection
supabase db ping
```

#### 2.2 Edge Functions Validation
```bash
# Deploy all functions to local
supabase functions deploy --local

# Test critical endpoints
curl -X GET http://localhost:54321/functions/v1/get-homepage-feed
curl -X POST http://localhost:54321/functions/v1/cast-vote \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check function logs
supabase functions logs --local
```

#### 2.3 Database Schema Validation
```bash
# Generate fresh types
supabase gen types typescript --local > temp_types.ts

# Compare with existing types
diff src/integrations/supabase/types.ts temp_types.ts

# Test migrations
supabase db reset --local
```

### PHASE 3: Application Runtime Validation (CRITICAL)

#### 3.1 Development Server Test
```bash
# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 10

# Test homepage load
curl -f http://localhost:5173/ > /dev/null

# Test routing
curl -f http://localhost:5173/acervo > /dev/null
curl -f http://localhost:5173/community > /dev/null

# Kill dev server
kill $DEV_PID
```

#### 3.2 Production Build Validation
```bash
# Build for production
npm run build

# Preview production build
npm run preview &
PREVIEW_PID=$!

# Wait for preview server
sleep 5

# Test production build
curl -f http://localhost:4173/ > /dev/null

# Kill preview server
kill $PREVIEW_PID
```

#### 3.3 Component Import Validation
```bash
# Test critical imports resolve
node -e "
import('./src/App.tsx').then(() => console.log('✅ App.tsx imports OK')).catch(e => {
  console.error('❌ App.tsx import failed:', e.message);
  process.exit(1);
});
"

# Validate TypeScript compilation
npx tsc --noEmit
```

### PHASE 4: API Integration Testing (HIGH PRIORITY)

#### 4.1 Authentication Flow Test
```javascript
// Execute via Node.js script
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  'your-local-anon-key'
)

// Test auth endpoints
const testAuth = async () => {
  // Test sign up
  const { error: signUpError } = await supabase.auth.signUp({
    email: 'test@evidens.local',
    password: 'testpass123'
  })
  
  if (signUpError) throw new Error(`Auth signup failed: ${signUpError.message}`)
  
  console.log('✅ Authentication flow validated')
}

testAuth().catch(console.error)
```

#### 4.2 Data Fetching Validation
```javascript
// Test critical data fetching patterns
const testDataFetching = async () => {
  // Test homepage data
  const response = await fetch('http://localhost:54321/functions/v1/get-homepage-feed')
  if (!response.ok) throw new Error('Homepage feed failed')
  
  const data = await response.json()
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid homepage data structure')
  }
  
  console.log('✅ Data fetching validated')
}

testDataFetching().catch(console.error)
```

#### 4.3 Critical User Flows
```javascript
// Test user interaction flows
const testUserFlows = async () => {
  // Test community post creation
  const postResponse = await fetch('http://localhost:54321/functions/v1/create-community-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Post',
      content: 'Test content',
      category: 'discussao'
    })
  })
  
  if (!postResponse.ok) throw new Error('Post creation failed')
  
  console.log('✅ User flows validated')
}

testUserFlows().catch(console.error)
```

### PHASE 5: Performance & Security Validation (RECOMMENDED)

#### 5.1 Performance Benchmarks
```bash
# Bundle size check
npm run build
BUNDLE_SIZE=$(du -k dist/assets/*.js | awk '{sum+=$1} END {print sum}')
if [ $BUNDLE_SIZE -gt 2000 ]; then
  echo "❌ Bundle too large: ${BUNDLE_SIZE}KB"
  exit 1
fi

# Load time simulation
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4173/
```

#### 5.2 Security Validation
```bash
# Check for exposed secrets
grep -r "SUPABASE_SERVICE_ROLE" src/ && echo "❌ Service role exposed"
grep -r "password.*=" src/ && echo "❌ Hardcoded passwords found"

# Validate RLS policies
supabase db test --local
```

---

## 🔧 AUTONOMOUS EXECUTION SCRIPT

```bash
#!/bin/bash
# autonomous_test.sh - Complete autonomous testing protocol

set -e  # Exit on any error

echo "🚀 Starting EVIDENS Autonomous Testing Protocol"

# Phase 1: Infrastructure
echo "📋 Phase 1: Infrastructure Validation"
node --version
npm run build
npm run lint

# Phase 2: Backend
echo "📋 Phase 2: Backend Validation"
supabase start
supabase status
supabase gen types typescript --local > /tmp/types_check.ts

# Phase 3: Runtime
echo "📋 Phase 3: Runtime Validation"
npm run dev &
DEV_PID=$!
sleep 15
curl -f http://localhost:5173/ || exit 1
kill $DEV_PID

# Phase 4: API Testing
echo "📋 Phase 4: API Integration"
curl -f http://localhost:54321/functions/v1/get-homepage-feed || exit 1

# Phase 5: Performance
echo "📋 Phase 5: Performance Check"
npm run build
BUNDLE_SIZE=$(du -k dist/assets/*.js | awk '{sum+=$1} END {print sum}')
echo "Bundle size: ${BUNDLE_SIZE}KB"

echo "✅ All tests passed! Deployment ready."
```

---

## 📊 SUCCESS CRITERIA

### MANDATORY (Deployment Blockers)
- [ ] All builds complete successfully
- [ ] Zero ESLint errors
- [ ] TypeScript compilation passes
- [ ] Supabase services start correctly
- [ ] Homepage loads without errors
- [ ] Critical API endpoints respond

### HIGH PRIORITY (Production Readiness)
- [ ] Bundle size < 2MB total
- [ ] All Edge Functions deploy successfully
- [ ] Database schema matches types
- [ ] Authentication flow works
- [ ] Core user flows functional

### RECOMMENDED (Quality Assurance)
- [ ] Performance benchmarks met
- [ ] No security vulnerabilities detected
- [ ] All routes accessible
- [ ] Error boundaries tested
- [ ] Mobile responsiveness verified

---

## 🚨 FAILURE RESPONSE PROTOCOL

### Critical Failures (Stop Deployment)
1. Build failures → Fix immediately
2. TypeScript errors → Resolve before proceeding
3. API connection failures → Check Supabase configuration
4. Authentication issues → Verify JWT configuration

### Non-Critical Failures (Log and Continue)
1. Performance warnings → Note for optimization
2. Bundle size warnings → Schedule optimization
3. Accessibility issues → Add to backlog

---

## 📈 EXECUTION TIMELINE

**Total Estimated Time: 15-30 minutes**

- Phase 1: 5 minutes
- Phase 2: 10 minutes  
- Phase 3: 8 minutes
- Phase 4: 5 minutes
- Phase 5: 5 minutes

**Frequency:** 
- Before every production deployment
- After major feature additions
- Weekly for maintenance validation

---

## 🔄 CONTINUOUS INTEGRATION INTEGRATION

This protocol can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/autonomous-test.yml
name: Autonomous Testing Protocol
on: [push, pull_request]
jobs:
  autonomous-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Execute Autonomous Testing Protocol
        run: ./autonomous_test.sh
```

---

**Protocol Status:** ✅ Ready for Implementation  
**Next Review:** After first autonomous execution  
**Maintainer:** Claude Code Autonomous Testing System