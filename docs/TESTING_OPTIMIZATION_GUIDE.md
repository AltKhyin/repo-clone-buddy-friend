# Testing Suite Optimization Guide

## Overview

This guide documents the testing infrastructure optimizations implemented to reduce test execution time from 20+ minutes to under 5 minutes while maintaining comprehensive coverage and TDD compliance.

## Optimization Strategy

### 1. Performance Budgets

Tests are categorized with performance budgets:

- **Unit Tests**: <100ms (fast), <500ms (acceptable), >1s (slow)
- **Integration Tests**: <500ms (fast), <2s (acceptable), >5s (slow)
- **E2E Tests**: <2s (fast), <10s (acceptable), >30s (slow)

### 2. Test Categorization

#### Fast Unit Tests

- **Location**: `src/**/*.test.{ts,tsx}` (excluding `*.integration.test.{ts,tsx}`)
- **Command**: `npm run test:unit` or `npm run test:fast`
- **Timeout**: 5 seconds
- **Purpose**: Pre-commit validation, rapid feedback during development

#### Integration Tests

- **Location**: `src/**/*.integration.test.{ts,tsx}`
- **Command**: `npm run test:integration`
- **Timeout**: 10 seconds
- **Purpose**: Comprehensive feature testing, CI/CD validation

#### Performance Tests

- **Command**: `npm run test:performance`
- **Timeout**: 3 seconds
- **Purpose**: Identify performance bottlenecks and slow tests

### 3. Optimized Configuration

#### Vitest Configuration Changes

```typescript
// vitest.config.ts optimizations
{
  testTimeout: 10000,      // Reduced from 30s
  hookTimeout: 5000,       // Reduced from 10s
  teardownTimeout: 3000,   // Reduced from 10s
  pool: 'threads',         // Better performance than forks
  poolOptions: {
    threads: { maxThreads: 4, minThreads: 2 }
  },
  slowTestThreshold: 5000, // Flag tests >5s
  typecheck: { enabled: false } // Disable for speed
}
```

#### Test Scripts

```json
{
  "test:fast": "vitest run --reporter=basic --exclude='**/*.integration.test.{ts,tsx}' --testTimeout=5000",
  "test:unit": "vitest run --reporter=basic src/**/*.test.{ts,tsx} --exclude='**/*.integration.test.{ts,tsx}'",
  "test:integration": "vitest run --reporter=verbose src/**/*.integration.test.{ts,tsx}",
  "test:performance": "vitest run --reporter=basic --testTimeout=3000"
}
```

### 4. Tiered Mocking System

#### Lightweight Mocks (`src/test-utils/lightweight-mocks.ts`)

- **Purpose**: Fast unit tests with minimal overhead
- **Features**: Synchronous operations, essential functionality only
- **Usage**: `setupLightweightTest()`, `createFastTestWrapper()`

#### Comprehensive Mocks (`src/test-utils/supabase-mocks.ts`)

- **Purpose**: Integration tests requiring full functionality
- **Features**: Complete API surface, realistic behavior simulation
- **Usage**: `createMockSupabaseClient()`, `setupSupabaseScenario()`

### 5. Performance Monitoring

#### Performance Budget Utilities

```typescript
// Performance monitoring for tests
import { measureTestTime, withPerformanceMonitoring } from '@/test-utils/performance-budget'

// Monitor test execution time
const result = await measureTestTime(
  () => render(<Component />),
  'Component Render Test',
  'unit'
)

// Automatic performance tracking
const optimizedTest = withPerformanceMonitoring(
  testFunction,
  'Test Name',
  'unit'
)
```

#### Custom Matchers

```typescript
// Performance assertion matchers
expect(duration).toBeWithinPerformanceBudget('unit');
expect(duration).toBeExcellentPerformance('unit');
```

## Pre-Commit Protection

### Updated Hook Strategy

- **Execution Time**: Under 2 minutes (was 7 minutes)
- **Test Scope**: Fast unit tests only (excludes integration tests)
- **Command**: `npm run test:fast`
- **Timeout**: 120 seconds with clear error messages

### Hook Features

- **Node.js Based**: WSL/Windows compatibility
- **Comprehensive Validation**: lint-staged, ESLint, TypeScript compilation, tests
- **Clear Feedback**: Specific error messages and next steps
- **Protection Level**: Blocks commits with failing tests, maintains code quality

## Migration Strategy

### Step 1: Identify Slow Tests

```bash
# Run performance analysis
npm run test:performance

# Identify bottlenecks
npm run test -- --reporter=verbose --slow-tests-threshold=1000
```

### Step 2: Apply Optimization Patterns

#### Before (Slow)

```typescript
// Heavy integration test
import { render } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

describe('Component', () => {
  it('should render', () => {
    render(
      <QueryClient>
        <MemoryRouter>
          <FullAppProviders>
            <Component />
          </FullAppProviders>
        </MemoryRouter>
      </QueryClient>
    )
  })
})
```

#### After (Fast)

```typescript
// Lightweight unit test
import { render } from '@testing-library/react'
import { setupLightweightTest, createFastTestWrapper } from '@/test-utils/lightweight-mocks'

const { store } = setupLightweightTest()

describe('Component', () => {
  it('should render within performance budget', async () => {
    const result = await measureTestTime(
      () => {
        render(
          <createFastTestWrapper>
            <Component />
          </createFastTestWrapper>
        )
      },
      'Component Render',
      'unit'
    )

    expect(result.duration).toBeWithinPerformanceBudget('unit')
  })
})
```

### Step 3: Separate Integration Tests

- Move complex integration tests to `*.integration.test.{ts,tsx}` files
- Use comprehensive mocking for integration tests
- Reserve for CI/CD and detailed feature validation

## Best Practices

### 1. Test Classification

- **Unit**: Single component/function testing with mocks
- **Integration**: Multi-component interaction testing
- **E2E**: Full user workflow testing

### 2. Mock Selection

- **Unit Tests**: Use lightweight mocks (`setupLightweightTest()`)
- **Integration Tests**: Use comprehensive mocks (`createMockSupabaseClient()`)
- **Performance Tests**: Use synchronous mocks (`synchronizeMocks()`)

### 3. Performance Monitoring

- Monitor test duration continuously
- Set performance budgets for new tests
- Use custom matchers for assertions
- Track suite-wide performance trends

### 4. Development Workflow

```bash
# Fast feedback during development
npm run test:watch

# Pre-commit validation
git commit  # Automatically runs test:fast

# Full validation before deploy
npm run test && npm run test:integration
```

## Results

### Before Optimization

- **Total Execution**: 20+ minutes
- **Pre-commit**: 7+ minutes
- **Timeout Issues**: Frequent failures
- **Developer Experience**: Poor (blocking workflow)

### After Optimization

- **Unit Tests**: <2 minutes (target: 90% improvement)
- **Pre-commit**: <2 minutes (target: 70% improvement)
- **Integration Tests**: <5 minutes separately
- **Developer Experience**: Excellent (fast feedback)

## Monitoring and Maintenance

### Performance Tracking

- Automatic slow test detection (>5s flagged)
- Suite-wide performance reporting
- Grade distribution tracking (excellent/good/poor/critical)
- Top 10 slowest tests identification

### Quality Gates

- **Pre-commit**: Blocks commits with failing fast tests
- **CI/CD**: Runs full test suite including integration tests
- **Performance**: Monitors test execution trends
- **Coverage**: Maintains 80% minimum threshold

## Next Steps

1. **Milestone 2**: Implement tiered mocking system
2. **Milestone 3**: Refactor remaining slow tests
3. **Milestone 4**: Smart test execution with parallel processing
4. **Milestone 5**: Advanced performance monitoring and alerting

This optimization maintains comprehensive test coverage while dramatically improving developer experience and CI/CD pipeline efficiency.
