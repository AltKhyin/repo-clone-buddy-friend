# Testing Quick Reference Guide

**Purpose:** Fast reference for common testing scenarios and commands in EVIDENS development

---

## 🚀 Quick Commands

```bash
# Essential Testing Commands
npm test                    # Run all tests once
npm run test:watch         # Watch mode for development
npm run test:coverage      # Run with coverage report
npm run test:ui           # Visual test runner

# TDD Workflow
npm test -- --watch ComponentName    # Start TDD for specific component
npm test -- --related file.tsx       # Test only related files
npm run dev:with-tests               # Dev server + test watching
```

---

## 📋 Test File Templates

### Component Test (Copy & Paste)
```typescript
// ABOUTME: Tests for ComponentName ensuring [behavior description]

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils'
import { createMockData } from '../../test-utils/test-data-factories'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with correct data', () => {
    const mockData = createMockData()
    renderWithProviders(<ComponentName data={mockData} />)
    
    expect(screen.getByText(mockData.title)).toBeInTheDocument()
  })

  it('should handle loading state', () => {
    renderWithProviders(<ComponentName isLoading={true} />)
    
    expect(screen.getByTestId('loading-skeleton')).toBeInLoadingState()
  })

  it('should be accessible and responsive', () => {
    const { container } = renderWithProviders(<ComponentName />)
    
    expect(container.firstChild).toBeAccessible()
    expect(container.firstChild).toBeResponsive()
  })
})
```

### Hook Test (Copy & Paste)
```typescript
// ABOUTME: Tests for useCustomHook ensuring proper data fetching

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithQuery } from '../../src/test-utils'
import { useCustomHook } from './useCustomHook'

vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionGet: vi.fn(),
}))

describe('useCustomHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch data successfully', async () => {
    const { invokeFunctionGet } = await import('../../src/lib/supabase-functions')
    vi.mocked(invokeFunctionGet).mockResolvedValue({ success: true })

    const { result } = renderHookWithQuery(() => useCustomHook())

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current).toBeValidQueryResult()
  })
})
```

---

## 🛠️ Common Testing Scenarios

### 1. Test Component Props
```typescript
it('should render different variants', () => {
  const variants = ['primary', 'secondary', 'outline']
  
  variants.forEach(variant => {
    const { container } = renderMinimal(<Button variant={variant}>Test</Button>)
    expect(container.firstChild).toHaveClass(`variant-${variant}`)
  })
})
```

### 2. Test User Interactions
```typescript
it('should handle click events', async () => {
  const mockOnClick = vi.fn()
  renderWithProviders(<Button onClick={mockOnClick}>Click me</Button>)
  
  await fireEvent.click(screen.getByRole('button'))
  
  expect(mockOnClick).toHaveBeenCalledOnce()
})
```

### 3. Test Navigation
```typescript
it('should navigate correctly', async () => {
  const mockNavigate = vi.fn()
  vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  
  renderWithProviders(<NavigationComponent />)
  await fireEvent.click(screen.getByRole('link'))
  
  expect(mockNavigate).toHaveBeenCalledWith('/expected-path')
})
```

### 4. Test Authentication States
```typescript
it('should handle authenticated user', () => {
  mockUseAuthStore.mockReturnValue({
    user: { id: 'user-123' },
    session: { access_token: 'token' },
    isLoading: false
  })
  
  renderWithProviders(<AuthComponent />)
  
  expect(screen.getByText('Welcome back!')).toBeInTheDocument()
})
```

### 5. Test Loading States
```typescript
it('should show loading skeleton', () => {
  renderWithProviders(<Component isLoading={true} />)
  
  const skeleton = screen.getByTestId('loading-skeleton')
  expect(skeleton).toBeInLoadingState()
  expect(skeleton).toHaveClass('animate-pulse')
})
```

### 6. Test Error States
```typescript
it('should handle errors gracefully', () => {
  const error = new Error('Something went wrong')
  renderWithProviders(<Component error={error} />)
  
  expect(screen.getByText('Error loading data')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
})
```

---

## 🎯 Mock Quick Reference

### Mock Auth Store
```typescript
const mockUseAuthStore = vi.mocked(useAuthStore)
mockUseAuthStore.mockReturnValue({
  user: { id: 'test-user', email: 'test@example.com' },
  session: { access_token: 'mock-token' },
  isLoading: false,
  setSession: vi.fn(),
  initialize: vi.fn()
})
```

### Mock Navigation
```typescript
const mockNavigate = vi.fn()
vi.mocked(useNavigate).mockReturnValue(mockNavigate)
vi.mocked(useParams).mockReturnValue({ id: '123' })
```

### Mock Supabase Functions
```typescript
vi.mock('../../src/lib/supabase-functions', () => ({
  invokeFunctionGet: vi.fn(),
  invokeFunctionPost: vi.fn()
}))

// In test:
const { invokeFunctionGet } = await import('../../src/lib/supabase-functions')
vi.mocked(invokeFunctionGet).mockResolvedValue(mockData)
```

### Mock TanStack Query Hook
```typescript
vi.mock('../../../packages/hooks/useCustomQuery', () => ({
  useCustomQuery: vi.fn()
}))

// In test:
mockUseCustomQuery.mockReturnValue({
  data: mockData,
  isLoading: false,
  isError: false,
  isSuccess: true
})
```

---

## 🧪 Custom Matchers Cheat Sheet

```typescript
// Accessibility
expect(component).toBeAccessible()

// Responsive design
expect(component).toBeResponsive()

// TanStack Query validation
expect(result.current).toBeValidQueryResult()
expect(result.current).toBeValidMutationResult()

// Loading states
expect(skeleton).toBeInLoadingState()
expect(errorComponent).toBeInErrorState()

// CSS classes
expect(element).toHaveTailwindClass('bg-blue-500')
```

---

## 📁 Test Utilities Import Guide

```typescript
// Essential imports for most tests
import { renderWithProviders } from '../../test-utils'
import { createMockData } from '../../test-utils/test-data-factories'

// Hook testing
import { renderHookWithQuery } from '../../src/test-utils'

// Minimal UI component testing
import { renderMinimal } from '../../test-utils'

// Navigation testing
import { renderWithRouter } from '../../test-utils'

// Error boundary testing
import { renderWithErrorBoundary } from '../../test-utils'
```

---

## 🚨 Troubleshooting Common Issues

### Issue: "useTheme must be used within a CustomThemeProvider"
**Solution:** Use `renderWithProviders()` instead of React Testing Library's `render()`

### Issue: "useNavigate.mockReturnValue is not a function"
**Solution:** 
```typescript
const mockNavigate = vi.fn()
vi.mocked(useNavigate).mockReturnValue(mockNavigate)
```

### Issue: Test timeout in waitFor()
**Solution:** Increase timeout or check async mock setup:
```typescript
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
}, { timeout: 5000 })
```

### Issue: "Cannot find module" for relative imports
**Solution:** Check tsconfig.json paths and Vitest resolve aliases

### Issue: Mock not being called
**Solution:** Ensure `vi.clearAllMocks()` in `beforeEach()`

---

## 📊 Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html

# Check specific file coverage
npm test -- --coverage ComponentName.test.tsx
```

---

## 🔄 TDD Workflow Checklist

- [ ] Create failing test first (`npm test -- --watch ComponentName`)
- [ ] Write minimal code to pass (`npm test -- --related file.tsx`)
- [ ] Refactor while keeping tests green (`npm test`)
- [ ] Ensure coverage meets 80% threshold
- [ ] Run full test suite before commit (`npm test`)
- [ ] Check accessibility and responsive requirements

---

## 📚 Documentation References

- **Complete Framework Docs:** `docs/[DOC_9]_TESTING_FRAMEWORK.md`
- **Implementation Patterns:** `docs/blueprints/11_TESTING_BLUEPRINT.md`
- **Architecture Integration:** `CLAUDE.md` testing section

---

**Last Updated:** June 28, 2025  
**Status:** Active Reference  
**Maintenance:** Update as patterns evolve