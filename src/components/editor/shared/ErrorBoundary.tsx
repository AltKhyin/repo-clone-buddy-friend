// ABOUTME: Error boundary components for Rich Block editor with graceful failure handling

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Props for error boundary components
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

/**
 * Generic error boundary for Rich Block editor components
 */
export class RichBlockErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show error UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('RichBlockErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In a real application, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    console.warn('Error reporting not configured for production');
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    const { componentName } = this.props;

    if (!error) return 'An unknown error occurred';

    // User-friendly error messages
    if (error.message.includes('ChunkLoadError')) {
      return 'Failed to load editor resources. Please refresh the page.';
    }

    if (error.message.includes('Network')) {
      return 'Network connection issue. Please check your internet connection.';
    }

    if (componentName === 'TableComponent') {
      return 'Table editor encountered an error. Your data is safe.';
    }

    if (componentName === 'PollComponent') {
      return 'Poll editor encountered an error. Your data is safe.';
    }

    return `Editor component error: ${error.message}`;
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Component Error</AlertTitle>
            <AlertDescription className="mt-2">{this.getErrorMessage()}</AlertDescription>
          </Alert>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={this.handleRetry}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Try Again
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={() => console.log('Error details:', this.state)}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bug size={14} />
                Debug Info
              </Button>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                {this.state.error.stack}
                {this.state.errorInfo && (
                  <>
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized error boundary for table components
 */
export function TableErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <RichBlockErrorBoundary
      componentName="TableComponent"
      fallback={
        <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={16} />
            <span className="font-medium">Table Temporarily Unavailable</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            The table editor encountered an issue. Your table data is preserved and will be restored
            when the editor recovers.
          </p>
        </div>
      }
    >
      {children}
    </RichBlockErrorBoundary>
  );
}

/**
 * Specialized error boundary for poll components
 */
export function PollErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <RichBlockErrorBoundary
      componentName="PollComponent"
      fallback={
        <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={16} />
            <span className="font-medium">Poll Temporarily Unavailable</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            The poll editor encountered an issue. Your poll data and votes are preserved and will be
            restored when the editor recovers.
          </p>
        </div>
      }
    >
      {children}
    </RichBlockErrorBoundary>
  );
}

/**
 * Inspector error boundary for graceful inspector failures
 */
export function InspectorErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <RichBlockErrorBoundary
      componentName="Inspector"
      fallback={
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 text-gray-700">
            <AlertTriangle size={16} />
            <span className="font-medium">Inspector Unavailable</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            The component inspector encountered an error. You can still edit the component directly.
          </p>
        </div>
      }
    >
      {children}
    </RichBlockErrorBoundary>
  );
}

/**
 * Hook for reporting errors from functional components
 */
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);

    // In production, report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } });
      console.warn('Error reporting not configured for production');
    }
  }, []);

  return { reportError };
}

/**
 * Hook for safe async operations with error handling
 */
export function useSafeAsync() {
  const { reportError } = useErrorReporting();

  const safeAsync = React.useCallback(
    async <T,>(
      asyncOperation: () => Promise<T>,
      context?: string
    ): Promise<{ data?: T; error?: Error }> => {
      try {
        const data = await asyncOperation();
        return { data };
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        reportError(errorObj, context);
        return { error: errorObj };
      }
    },
    [reportError]
  );

  return { safeAsync };
}
