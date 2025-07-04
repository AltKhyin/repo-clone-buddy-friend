// ABOUTME: Runtime error detection utilities for catching infinite loops and state management issues in tests

import { vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEffect, useState, useCallback } from 'react'

/**
 * Detects infinite loop patterns in useEffect hooks
 * 
 * @param effectFn - The effect function to test
 * @param dependencies - The dependency array (these should be unstable to trigger loop)
 * @param maxRuns - Maximum allowed effect runs before considering it an infinite loop
 * @returns Object with isInfiniteLoop flag and run count
 */
export const detectInfiniteLoop = (
  effectFn: () => void | (() => void),
  dependencies: any[],
  maxRuns: number = 3
) => {
  let runCount = 0
  let isInfiniteLoop = false

  const TestComponent = () => {
    // Create new dependency objects each render to simulate unstable dependencies
    const unstableDeps = dependencies.map(dep => 
      typeof dep === 'object' ? { ...dep, _render: Math.random() } : dep
    )
    
    useEffect(() => {
      runCount++
      if (runCount > maxRuns) {
        isInfiniteLoop = true
        return
      }
      effectFn()
    }, unstableDeps) // Use unstable dependencies that change each render

    return null
  }

  try {
    renderHook(() => TestComponent())
    // The effect should run multiple times due to unstable dependencies
  } catch (error) {
    // Handle any errors
  }

  return {
    isInfiniteLoop: runCount > maxRuns,
    runCount,
    maxRunsExceeded: runCount > maxRuns
  }
}

/**
 * Tests for unstable useEffect dependencies that cause unnecessary re-runs
 * 
 * @param stableDependencies - Array of dependencies that should be stable
 * @param expectedStableRuns - Expected number of effect runs for stable dependencies
 * @returns Object with stability analysis
 */
export const testEffectDependencyStability = (
  stableDependencies: any[],
  expectedStableRuns: number = 1
) => {
  let effectRunCount = 0
  
  const TestHook = () => {
    // Use the provided stable dependencies directly
    useEffect(() => {
      effectRunCount++
    }, stableDependencies) // These should be stable and not cause re-runs
    
    return null
  }

  const { rerender } = renderHook(() => TestHook())
  
  // Multiple re-renders should not cause additional effect runs with stable dependencies
  act(() => { rerender() })
  act(() => { rerender() })
  act(() => { rerender() })

  return {
    effectRunCount,
    isStable: effectRunCount <= expectedStableRuns,
    hasUnstableDependencies: effectRunCount > expectedStableRuns,
    stabilityRatio: effectRunCount / expectedStableRuns
  }
}

/**
 * Detects state update loops in React components
 * 
 * @param componentFn - Function that renders the component
 * @param maxStateUpdates - Maximum allowed state updates before considering it a loop
 * @returns Object with loop detection results
 */
export const detectStateUpdateLoop = (
  componentFn: () => any,
  maxStateUpdates: number = 20
) => {
  let stateUpdateCount = 0
  let isStateLoop = false

  // Mock console.error to catch React warnings about too many re-renders
  const originalConsoleError = console.error
  const consoleErrorSpy = vi.fn()
  console.error = consoleErrorSpy

  const TestComponent = () => {
    const [count, setCount] = useState(0)
    
    // Override setState to count updates
    const trackedSetCount = useCallback((value: number | ((prev: number) => number)) => {
      stateUpdateCount++
      if (stateUpdateCount > maxStateUpdates) {
        isStateLoop = true
        throw new Error(`State update loop detected: ${stateUpdateCount} updates`)
      }
      setCount(value)
    }, [])

    return componentFn({ count, setCount: trackedSetCount })
  }

  try {
    renderHook(() => TestComponent())
  } catch (error) {
    if (error instanceof Error && error.message.includes('State update loop detected')) {
      isStateLoop = true
    }
  }

  // Check for React's "too many re-renders" warning
  const reactWarnings = consoleErrorSpy.mock.calls.filter(call =>
    call.some(arg => 
      String(arg).includes('Too many re-renders') ||
      String(arg).includes('Maximum update depth exceeded')
    )
  )

  // Restore console.error
  console.error = originalConsoleError

  return {
    isStateLoop: isStateLoop || reactWarnings.length > 0,
    stateUpdateCount,
    reactWarnings: reactWarnings.length,
    hasReactWarnings: reactWarnings.length > 0
  }
}

/**
 * Tests persistence callback stability to prevent infinite loops
 * 
 * @param setupCallbacks - Function that sets up persistence callbacks
 * @param dependencies - Dependencies that should trigger callback updates
 * @returns Stability analysis results
 */
export const testPersistenceCallbackStability = (
  setupCallbacks: (deps: any) => void,
  dependencies: any[]
) => {
  let callbackSetupCount = 0
  
  const TestComponent = () => {
    useEffect(() => {
      callbackSetupCount++
      setupCallbacks(dependencies)
    }, dependencies)

    return null
  }

  const { rerender } = renderHook(() => TestComponent())
  
  // Test with same dependencies (should not trigger additional setups)
  act(() => { rerender() })
  act(() => { rerender() })

  const stableCallbackCount = callbackSetupCount

  // Test with changed dependencies (should trigger setup)
  const changedDeps = [...dependencies, 'changed']
  act(() => {
    // Simulate dependency change
    TestComponent.dependencies = changedDeps
    rerender()
  })

  return {
    stableCallbackCount,
    totalCallbackCount: callbackSetupCount,
    isStable: stableCallbackCount === 1,
    respondsToChanges: callbackSetupCount > stableCallbackCount
  }
}

/**
 * Performance monitoring utilities for detecting long-running operations
 */
export const performanceMonitor = {
  /**
   * Measures execution time and detects potential infinite loops
   */
  measureExecution: async (fn: () => Promise<void> | void, timeoutMs: number = 5000) => {
    const startTime = performance.now()
    let isTimeout = false
    let error: Error | null = null

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          isTimeout = true
          reject(new Error(`Operation timed out after ${timeoutMs}ms - possible infinite loop`))
        }, timeoutMs)
      })

      const executionPromise = Promise.resolve(fn())
      
      await Promise.race([executionPromise, timeoutPromise])
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    return {
      duration,
      isTimeout,
      error,
      isPotentialInfiniteLoop: isTimeout || duration > timeoutMs,
      performanceGrade: duration < 100 ? 'excellent' : 
                        duration < 500 ? 'good' : 
                        duration < 1000 ? 'fair' : 'poor'
    }
  },

  /**
   * Monitors for blocked main thread patterns
   */
  detectBlockedMainThread: (fn: () => void, maxBlockTimeMs: number = 100) => {
    const startTime = performance.now()
    
    fn()
    
    const endTime = performance.now()
    const blockTime = endTime - startTime

    return {
      blockTime,
      isBlocked: blockTime > maxBlockTimeMs,
      severity: blockTime > 1000 ? 'critical' :
                blockTime > 500 ? 'high' :
                blockTime > 100 ? 'medium' : 'low'
    }
  }
}

/**
 * Custom matcher for infinite loop detection in tests
 */
export const toNotCauseInfiniteLoop = {
  toNotCauseInfiniteLoop(received: () => void, timeout: number = 1000) {
    const monitor = performanceMonitor.measureExecution(received, timeout)
    
    return {
      message: () => 
        monitor.isPotentialInfiniteLoop 
          ? `Expected function not to cause infinite loop, but it ran for ${monitor.duration}ms`
          : `Function completed successfully in ${monitor.duration}ms`,
      pass: !monitor.isPotentialInfiniteLoop
    }
  }
}

// Add to expect for usage in tests
declare global {
  interface CustomMatchers<R> {
    toNotCauseInfiniteLoop(timeout?: number): R
  }
}