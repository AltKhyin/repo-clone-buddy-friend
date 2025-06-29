// ABOUTME: Enhanced error boundary specifically for catching infinite loops and runtime state errors

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface RuntimeErrorInfo {
  componentStack: string
  errorBoundary: string
  eventType: string
  source: string
  timestamp: string
  errorCount: number
}

interface RuntimeErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isInfiniteLoop: boolean
  errorCount: number
}

interface RuntimeErrorBoundaryProps {
  children: ReactNode
  context: string
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: RuntimeErrorInfo) => void
}

export class RuntimeErrorBoundary extends Component<
  RuntimeErrorBoundaryProps,
  RuntimeErrorBoundaryState
> {
  private errorTimestamps: number[] = []
  private infiniteLoopDetected = false
  
  constructor(props: RuntimeErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isInfiniteLoop: false,
      errorCount: 0
    }
  }
  
  static getDerivedStateFromError(error: Error): Partial<RuntimeErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now()
    this.errorTimestamps.push(now)
    
    // Remove timestamps older than 5 seconds
    this.errorTimestamps = this.errorTimestamps.filter(timestamp => now - timestamp < 5000)
    
    // Detect infinite loop patterns
    const isInfiniteLoop = this.detectInfiniteLoopPattern(error)
    
    if (isInfiniteLoop && !this.infiniteLoopDetected) {
      this.infiniteLoopDetected = true
      console.error('🚨 INFINITE LOOP DETECTED by RuntimeErrorBoundary:', {
        context: this.props.context,
        errorMessage: error.message,
        errorCount: this.errorTimestamps.length
      })
    }
    
    const runtimeErrorInfo: RuntimeErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.context,
      eventType: isInfiniteLoop ? 'infinite-loop' : 'runtime-error',
      source: error.stack || 'unknown',
      timestamp: new Date().toISOString(),
      errorCount: this.errorTimestamps.length
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, runtimeErrorInfo)
    }
    
    // Log for monitoring
    console.error('RuntimeErrorBoundary caught error:', {
      error: error.message,
      context: this.props.context,
      isInfiniteLoop,
      errorCount: this.errorTimestamps.length,
      runtimeErrorInfo
    })
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
      isInfiniteLoop,
      errorCount: this.errorTimestamps.length
    })
  }
  
  private detectInfiniteLoopPattern = (error: Error): boolean => {
    // Pattern 1: React's maximum update depth error
    if (error.message.includes('Maximum update depth exceeded')) {
      return true
    }
    
    // Pattern 2: Too many re-renders error
    if (error.message.includes('Too many re-renders')) {
      return true
    }
    
    // Pattern 3: Multiple errors in rapid succession (>10 errors in 5 seconds)
    if (this.errorTimestamps.length > 10) {
      return true
    }
    
    // Pattern 4: Stack overflow patterns
    if (error.stack && error.stack.includes('RangeError: Maximum call stack size exceeded')) {
      return true
    }
    
    return false
  }
  
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isInfiniteLoop: false,
      errorCount: 0
    })
    this.errorTimestamps = []
    this.infiniteLoopDetected = false
  }
  
  private handleReload = () => {
    window.location.reload()
  }
  
  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      if (this.state.isInfiniteLoop) {
        return (
          <div className="p-6 border-2 border-red-500 bg-red-50 rounded-lg mx-4 my-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <h3 className="text-lg font-semibold text-red-800">
                Infinite Loop Detected
              </h3>
            </div>
            
            <p className="text-red-700 mb-3">
              A component in <strong>{this.props.context}</strong> is stuck in an infinite update loop. 
              This has been prevented to protect your browser performance.
            </p>
            
            <div className="bg-red-100 p-3 rounded mb-4">
              <p className="text-sm text-red-600">
                <strong>Error:</strong> {this.state.error?.message}
              </p>
              <p className="text-sm text-red-600 mt-1">
                <strong>Error Count:</strong> {this.state.errorCount} errors detected
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={this.handleReload}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reload Page
              </Button>
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          </div>
        )
      }
      
      return (
        <div className="p-6 border-2 border-yellow-500 bg-yellow-50 rounded-lg mx-4 my-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">⚠</span>
            </div>
            <h3 className="text-lg font-semibold text-yellow-800">
              Runtime Error in {this.props.context}
            </h3>
          </div>
          
          <p className="text-yellow-700 mb-3">
            An unexpected error occurred while rendering this component.
          </p>
          
          <div className="bg-yellow-100 p-3 rounded mb-4">
            <p className="text-sm text-yellow-600">
              <strong>Error:</strong> {this.state.error?.message}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-2">
                <summary className="text-sm text-yellow-600 cursor-pointer">
                  Component Stack
                </summary>
                <pre className="text-xs text-yellow-600 mt-1 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={this.handleReset}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Try Again
            </Button>
            <Button 
              onClick={this.handleReload}
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Reload Page
            </Button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Hook for using runtime error boundary in functional components
export const useRuntimeErrorHandler = (context: string) => {
  const handleError = React.useCallback((error: Error, errorInfo: RuntimeErrorInfo) => {
    console.error(`Runtime error in ${context}:`, error, errorInfo)
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'RuntimeErrorBoundary',
          context,
          eventType: errorInfo.eventType
        },
        extra: errorInfo
      })
    }
  }, [context])
  
  return { handleError }
}