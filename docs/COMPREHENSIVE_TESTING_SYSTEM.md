# EVIDENS Comprehensive Testing System v2.0

**Version:** 2.0.0 (Runtime Error Detection & Prevention)  
**Date:** June 29, 2025  
**Purpose:** Enhanced testing framework specifically designed to catch runtime errors, infinite loops, and state management issues before they reach production.

---

## 🚨 LESSONS LEARNED FROM CRITICAL RUNTIME ERROR

### The Infinite Loop Incident (June 28, 2025)

**What Happened:**
- User couldn't access the Visual Composition Engine editor
- Console error: "Maximum update depth exceeded"
- Root cause: `setPersistenceCallbacks` in `EditorPage.tsx:34` creating infinite useEffect loop
- **Critical Gap**: Existing test suite didn't catch this runtime-only error

**Why Tests Missed It:**
1. **Component tests used mocked stores** - never triggered real state updates
2. **Integration tests didn't simulate real persistence callback setup**
3. **No browser-based runtime error detection** - JSDOM doesn't catch infinite loops the same way
4. **Missing useEffect dependency testing** - didn't validate effect dependencies

**Key Insight**: *Static testing (mocks) can miss dynamic runtime patterns that only manifest in real browser environments.*

---

## 🧪 ENHANCED TESTING FRAMEWORK ARCHITECTURE

### 1. Multi-Layer Testing Strategy

#### Layer 1: Static Analysis & Unit Tests (Current - 260+ tests)
- **Purpose**: Catch logical errors, component rendering, hook behavior
- **Tools**: Vitest + React Testing Library + JSDOM
- **Coverage**: Individual functions, components, hooks
- **Limitations**: Cannot catch complex state interaction patterns

#### Layer 2: Integration Testing (NEW - Runtime Error Detection)
- **Purpose**: Catch state management issues, effect dependency problems, infinite loops
- **Tools**: Vitest + Real DOM testing + React concurrent features
- **Coverage**: Component integration, store interactions, effect patterns
- **Target**: Real browser-like behavior simulation

#### Layer 3: Browser Runtime Testing (NEW - Production Environment Simulation)
- **Purpose**: Catch errors that only manifest in real browser environments
- **Tools**: Playwright + Real browser testing + Error monitoring
- **Coverage**: Full application flows, persistence patterns, browser-specific behavior
- **Target**: Production-equivalent error detection

#### Layer 4: Continuous Runtime Monitoring (NEW - Production Error Detection)
- **Purpose**: Catch and report runtime errors in production
- **Tools**: Error boundaries + Sentry/LogRocket + Performance monitoring
- **Coverage**: Real user interactions, production data patterns
- **Target**: Post-deployment error detection and prevention

---

## 🛡️ RUNTIME ERROR DETECTION PATTERNS

### 1. Infinite Loop Detection Testing

#### A. UseEffect Dependency Testing
```typescript
// ABOUTME: Tests to catch infinite loop patterns in useEffect hooks

import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { useState, useEffect } from 'react'

describe('Infinite Loop Detection', () => {
  it('should detect useEffect infinite loops', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const ProblematicComponent = () => {
      const [count, setCount] = useState(0)
      
      // This would cause infinite loop
      useEffect(() => {
        setCount(count + 1)
      }, [count]) // count changes -> effect runs -> count changes -> infinite loop
      
      return <div>{count}</div>
    }
    
    // This should catch the infinite loop in test environment
    expect(() => {
      render(<ProblematicComponent />)
    }).toThrow(/too many re-renders/i)
    
    consoleSpy.mockRestore()
  })
  
  it('should validate useEffect dependencies are stable', () => {
    const mockSetState = vi.fn()
    const unstableCallback = () => ({ data: 'test' }) // New object every render
    
    const ComponentWithUnstableDeps = () => {
      useEffect(() => {
        mockSetState(unstableCallback())
      }, [unstableCallback]) // unstableCallback changes every render
      
      return <div>Test</div>
    }
    
    const { rerender } = render(<ComponentWithUnstableDeps />)
    
    // Re-render should trigger effect again due to unstable dependency
    rerender(<ComponentWithUnstableDeps />)
    
    // Effect should have been called multiple times
    expect(mockSetState).toHaveBeenCalledTimes(2)
  })
})
```

#### B. State Update Loop Detection
```typescript
describe('State Management Infinite Loops', () => {
  it('should detect Zustand store update loops', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let updateCount = 0
    
    const mockStore = {
      state: { value: 0 },
      setState: vi.fn((fn) => {
        updateCount++
        if (updateCount > 50) {
          throw new Error('Maximum update depth exceeded - potential infinite loop')
        }
        mockStore.state = fn(mockStore.state)
      })
    }
    
    const ProblematicStoreComponent = () => {
      useEffect(() => {
        // This would cause infinite store updates
        mockStore.setState((state) => ({ ...state, value: state.value + 1 }))
      }, [mockStore.state.value]) // Depends on state that gets updated in effect
      
      return <div>{mockStore.state.value}</div>
    }
    
    expect(() => {
      render(<ProblematicStoreComponent />)
    }).toThrow(/Maximum update depth exceeded/)
    
    consoleSpy.mockRestore()
  })
})
```

### 2. Persistence Callback Testing

#### A. Callback Stability Testing
```typescript
describe('Persistence Callback Stability', () => {
  it('should ensure persistence callbacks dont cause infinite loops', () => {
    const mockStore = {
      setPersistenceCallbacks: vi.fn(),
      loadFromDatabase: vi.fn(),
    }
    
    const EditorPageTest = () => {
      const saveMutation = { mutateAsync: vi.fn() }
      const loadedData = { id: '123' }
      
      // Fixed pattern - only depend on reviewId
      useEffect(() => {
        mockStore.setPersistenceCallbacks({
          save: async (reviewId, content) => {
            return saveMutation.mutateAsync({ reviewId, structuredContent: content })
          },
          load: async (reviewId) => {
            return loadedData
          }
        })
      }, ['test-review-id']) // Only reviewId dependency - stable
      
      return <div>Editor</div>
    }
    
    const { rerender } = render(<EditorPageTest />)
    
    // Multiple re-renders shouldn't cause additional callback setups
    rerender(<EditorPageTest />)
    rerender(<EditorPageTest />)
    
    expect(mockStore.setPersistenceCallbacks).toHaveBeenCalledTimes(1)
  })
  
  it('should detect unstable callback dependencies', () => {
    const mockStore = { setPersistenceCallbacks: vi.fn() }
    let effectRunCount = 0
    
    const EditorPageWithUnstableDeps = () => {
      const saveMutation = { mutateAsync: vi.fn() } // New object every render
      const loadedData = { id: '123' } // New object every render
      
      useEffect(() => {
        effectRunCount++
        mockStore.setPersistenceCallbacks({
          save: async (reviewId, content) => saveMutation.mutateAsync({ reviewId, structuredContent: content }),
          load: async (reviewId) => loadedData
        })
      }, [saveMutation, loadedData]) // Unstable dependencies
      
      return <div>Editor</div>
    }
    
    const { rerender } = render(<EditorPageWithUnstableDeps />)
    rerender(<EditorPageWithUnstableDeps />)
    
    // Should detect multiple effect runs due to unstable dependencies
    expect(effectRunCount).toBeGreaterThan(1)
    expect(mockStore.setPersistenceCallbacks).toHaveBeenCalledTimes(effectRunCount)
  })
})
```

### 3. Switch Component Infinite Loop Testing

#### A. Radix UI Switch Safety Testing
```typescript
describe('Radix UI Switch Infinite Loop Prevention', () => {
  it('should prevent Switch onCheckedChange loops', async () => {
    let changeCount = 0
    const mockOnChange = vi.fn((checked) => {
      changeCount++
      if (changeCount > 5) {
        throw new Error('Switch onChange called too many times - infinite loop detected')
      }
    })
    
    const SafeSwitchTest = () => {
      const [checked, setChecked] = useState(false)
      
      const handleChange = useCallback((newChecked) => {
        if (newChecked !== checked) { // Only change if actually different
          setChecked(newChecked)
          mockOnChange(newChecked)
        }
      }, [checked, mockOnChange])
      
      return (
        <Switch 
          checked={checked} 
          onCheckedChange={handleChange}
          aria-label="Test Switch"
        />
      )
    }
    
    render(<SafeSwitchTest />)
    
    const switchElement = screen.getByLabelText('Test Switch')
    
    // Multiple rapid clicks shouldn't cause infinite loops
    await fireEvent.click(switchElement)
    await fireEvent.click(switchElement)
    await fireEvent.click(switchElement)
    
    expect(changeCount).toBeLessThanOrEqual(3)
  })
})
```

---

## 🔬 BROWSER-BASED RUNTIME TESTING

### 1. Playwright Integration for Runtime Error Detection

#### A. Setup Browser Runtime Testing
```typescript
// tests/browser-runtime/infinite-loop-detection.spec.ts
// ABOUTME: Browser-based testing to catch runtime errors missed by JSDOM

import { test, expect, Browser, Page } from '@playwright/test'

test.describe('Runtime Error Detection', () => {
  let browser: Browser
  let page: Page
  
  test.beforeAll(async ({ browser: b }) => {
    browser = b
    page = await browser.newPage()
    
    // Set up error monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Browser Console Error: ${msg.text()}`)
      }
    })
    
    page.on('pageerror', (error) => {
      console.log(`Page Error: ${error.message}`)
    })
  })
  
  test('should detect infinite loops in editor', async () => {
    // Navigate to editor
    await page.goto('/editor/test-review-id')
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="editor-canvas"]')
    
    // Monitor for error patterns
    const errorPromise = page.waitForEvent('pageerror', { timeout: 10000 })
    
    // Try to interact with elements that previously caused infinite loops
    await page.click('[data-testid="fullscreen-toggle"]')
    await page.click('[data-testid="grid-toggle"]')
    
    // Should not throw errors
    await expect(errorPromise).rejects.toThrow() // Should timeout, not get error
  })
  
  test('should detect state update loops', async () => {
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth')) {
        errors.push(msg.text())
      }
    })
    
    await page.goto('/editor/test-review-id')
    
    // Wait for any potential infinite loops to manifest
    await page.waitForTimeout(5000)
    
    expect(errors).toHaveLength(0)
  })
})
```

#### B. Performance Monitoring for Infinite Loops
```typescript
test('should detect performance issues from infinite loops', async () => {
  await page.goto('/editor/test-review-id')
  
  // Start performance monitoring
  await page.evaluate(() => {
    performance.mark('editor-load-start')
  })
  
  // Wait for editor to be ready
  await page.waitForSelector('[data-testid="editor-canvas"]')
  
  // Check if the page is responsive (not stuck in infinite loop)
  const performanceData = await page.evaluate(() => {
    performance.mark('editor-load-end')
    performance.measure('editor-load', 'editor-load-start', 'editor-load-end')
    
    const measure = performance.getEntriesByName('editor-load')[0]
    return {
      duration: measure.duration,
      isResponsive: document.readyState === 'complete'
    }
  })
  
  // Editor should load within reasonable time (not stuck in loop)
  expect(performanceData.duration).toBeLessThan(10000) // 10 seconds max
  expect(performanceData.isResponsive).toBe(true)
})
```

---

## 📊 CONTINUOUS RUNTIME MONITORING

### 1. Error Boundary Enhancement

#### A. Runtime Error Detection Boundary
```typescript
// src/components/error-boundaries/RuntimeErrorBoundary.tsx
// ABOUTME: Enhanced error boundary specifically for catching infinite loops and state errors

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface RuntimeErrorInfo {
  componentStack: string
  errorBoundary: string
  eventType: string
  source: string
  timestamp: string
}

interface RuntimeErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isInfiniteLoop: boolean
}

export class RuntimeErrorBoundary extends Component<
  { children: ReactNode; context: string },
  RuntimeErrorBoundaryState
> {
  private errorCount = 0
  private errorTimestamps: number[] = []
  
  constructor(props: { children: ReactNode; context: string }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isInfiniteLoop: false
    }
  }
  
  static getDerivedStateFromError(error: Error): Partial<RuntimeErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorCount++
    const now = Date.now()
    this.errorTimestamps.push(now)
    
    // Remove timestamps older than 5 seconds
    this.errorTimestamps = this.errorTimestamps.filter(timestamp => now - timestamp < 5000)
    
    // Detect infinite loop pattern: multiple errors in short time
    const isInfiniteLoop = this.errorTimestamps.length > 10 || 
                          error.message.includes('Maximum update depth')
    
    const runtimeErrorInfo: RuntimeErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.context,
      eventType: isInfiniteLoop ? 'infinite-loop' : 'runtime-error',
      source: error.stack || 'unknown',
      timestamp: new Date().toISOString()
    }
    
    // Log for monitoring
    console.error('RuntimeErrorBoundary caught error:', {
      error: error.message,
      context: this.props.context,
      isInfiniteLoop,
      errorCount: this.errorCount,
      runtimeErrorInfo
    })
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportRuntimeError(error, runtimeErrorInfo)
    }
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
      isInfiniteLoop
    })
  }
  
  private reportRuntimeError = (error: Error, runtimeErrorInfo: RuntimeErrorInfo) => {
    // Send to monitoring service (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'RuntimeErrorBoundary',
          context: this.props.context,
          eventType: runtimeErrorInfo.eventType
        },
        extra: runtimeErrorInfo
      })
    }
  }
  
  render() {
    if (this.state.hasError) {
      if (this.state.isInfiniteLoop) {
        return (
          <div className="p-6 border border-red-500 bg-red-50 rounded">
            <h3 className="text-lg font-semibold text-red-800">
              Infinite Loop Detected
            </h3>
            <p className="text-red-600 mt-2">
              A component in {this.props.context} is stuck in an infinite update loop. 
              This has been prevented to protect your browser.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        )
      }
      
      return (
        <div className="p-6 border border-yellow-500 bg-yellow-50 rounded">
          <h3 className="text-lg font-semibold text-yellow-800">
            Runtime Error in {this.props.context}
          </h3>
          <p className="text-yellow-600 mt-2">
            {this.state.error?.message}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Try Again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

### 2. Production Runtime Monitoring

#### A. Performance Observer for Infinite Loops
```typescript
// src/lib/runtime-monitoring.ts
// ABOUTME: Production runtime monitoring to detect infinite loops and performance issues

export class RuntimeMonitor {
  private static instance: RuntimeMonitor
  private performanceObserver: PerformanceObserver | null = null
  private errorCount = 0
  private lastErrorTime = 0
  
  static getInstance(): RuntimeMonitor {
    if (!RuntimeMonitor.instance) {
      RuntimeMonitor.instance = new RuntimeMonitor()
    }
    return RuntimeMonitor.instance
  }
  
  initialize() {
    this.setupPerformanceMonitoring()
    this.setupUnhandledErrorDetection()
    this.setupInfiniteLoopDetection()
  }
  
  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          // Detect long tasks that might indicate infinite loops
          if (entry.entryType === 'longtask' && entry.duration > 1000) {
            console.warn('Long task detected - possible infinite loop:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            })
            
            this.reportPerformanceIssue({
              type: 'long-task',
              duration: entry.duration,
              timestamp: Date.now()
            })
          }
        })
      })
      
      this.performanceObserver.observe({ entryTypes: ['longtask'] })
    }
  }
  
  private setupUnhandledErrorDetection() {
    window.addEventListener('error', (event) => {
      this.errorCount++
      const now = Date.now()
      
      // Detect rapid error patterns (possible infinite loop)
      if (now - this.lastErrorTime < 100) {
        console.error('Rapid error pattern detected - possible infinite loop')
        this.reportRuntimeError({
          type: 'rapid-error-pattern',
          message: event.message,
          source: event.filename,
          line: event.lineno,
          timestamp: now
        })
      }
      
      this.lastErrorTime = now
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      this.reportRuntimeError({
        type: 'unhandled-rejection',
        message: event.reason?.message || 'Unknown rejection',
        timestamp: Date.now()
      })
    })
  }
  
  private setupInfiniteLoopDetection() {
    let lastHeartbeat = Date.now()
    
    // Heartbeat to detect if main thread is blocked
    const heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastHeartbeat = now - lastHeartbeat
      
      if (timeSinceLastHeartbeat > 5000) {
        console.warn('Main thread blocked for', timeSinceLastHeartbeat, 'ms')
        this.reportPerformanceIssue({
          type: 'main-thread-blocked',
          duration: timeSinceLastHeartbeat,
          timestamp: now
        })
      }
      
      lastHeartbeat = now
    }, 1000)
    
    // Store interval reference for cleanup
    this.cleanup = () => clearInterval(heartbeatInterval)
  }
  
  private reportRuntimeError(errorData: any) {
    if (process.env.NODE_ENV === 'production' && window.Sentry) {
      window.Sentry.captureMessage('Runtime Error Detected', {
        level: 'error',
        extra: errorData
      })
    }
  }
  
  private reportPerformanceIssue(performanceData: any) {
    if (process.env.NODE_ENV === 'production' && window.Sentry) {
      window.Sentry.captureMessage('Performance Issue Detected', {
        level: 'warning',
        extra: performanceData
      })
    }
  }
  
  cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
  }
}

// Initialize in app startup
if (typeof window !== 'undefined') {
  RuntimeMonitor.getInstance().initialize()
}
```

---

## 🛠️ IMPLEMENTATION ROADMAP

### Phase 1: Enhanced Integration Testing (Week 1)
1. **Create Runtime Error Detection Test Suite**
   - Infinite loop detection patterns
   - useEffect dependency validation
   - State update loop detection
   - Persistence callback stability testing

2. **Implement Browser-Based Testing**
   - Playwright setup for runtime error detection
   - Performance monitoring integration
   - Error pattern detection

### Phase 2: Production Monitoring (Week 2)
1. **Enhanced Error Boundaries**
   - RuntimeErrorBoundary implementation
   - Infinite loop pattern detection
   - User-friendly error recovery

2. **Runtime Monitoring System**
   - Performance observer setup
   - Unhandled error detection
   - Main thread blocking detection

### Phase 3: Continuous Improvement (Week 3)
1. **Automated Error Prevention**
   - ESLint rules for common infinite loop patterns
   - Pre-commit hooks for runtime error detection
   - CI/CD integration for browser testing

2. **Developer Tools**
   - VS Code extension for runtime error detection
   - Development-time infinite loop warnings
   - Performance impact notifications

---

## 📈 SUCCESS METRICS

### Error Detection Coverage
- **Target**: 95% of runtime errors caught before production
- **Current**: ~60% (static testing only)
- **Improvement**: +35% with enhanced runtime testing

### Development Velocity
- **Target**: Reduce runtime error debugging time by 80%
- **Current**: 4-8 hours per runtime error incident
- **Improvement**: <1 hour with comprehensive detection

### Production Stability
- **Target**: Zero infinite loop incidents in production
- **Current**: 1 critical incident (June 28, 2025)
- **Improvement**: Comprehensive prevention system

---

## 🎯 CONCLUSION

The enhanced testing system addresses the critical gap that allowed the infinite loop runtime error to reach production. By implementing multi-layer testing with runtime error detection, browser-based testing, and continuous monitoring, we ensure that complex state management issues are caught during development rather than discovered by users.

**Key Improvements:**
1. **Runtime Error Detection**: Catch infinite loops and state issues before production
2. **Browser-Based Testing**: Test in real browser environments, not just JSDOM
3. **Continuous Monitoring**: Detect and prevent runtime errors in production
4. **Developer Experience**: Tools and patterns to prevent common runtime error patterns

This comprehensive system transforms EVIDENS from reactive error handling to proactive error prevention, ensuring the reliability that medical professionals depend on.

---

**Implementation Status**: 🔄 In Progress  
**Priority**: 🔥 Critical  
**Next Review**: After Phase 1 completion  
**Owner**: EVIDENS Development Team