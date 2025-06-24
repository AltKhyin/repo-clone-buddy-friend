
// ABOUTME: Enhanced error boundary for community module with categorized error handling and retry mechanisms.

import React from 'react';
import { ErrorFallback, type ErrorInfo } from '../ui/error-fallback';

interface CommunityErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  context?: string;
  showDetails?: boolean;
}

interface CommunityErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class CommunityErrorBoundary extends React.Component<
  CommunityErrorBoundaryProps,
  CommunityErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;
  private readonly maxRetries = 3;

  constructor(props: CommunityErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CommunityErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'CommunityErrorBoundary'
    };
    
    this.setState({ errorInfo: enhancedErrorInfo });
    
    // Enhanced logging with context
    console.group('🚨 Community Error Boundary');
    console.error('Error caught in Community module:', error);
    console.error('Error info:', errorInfo);
    console.error('Context:', this.props.context || 'Community');
    console.error('Retry count:', this.state.retryCount);
    console.groupEnd();

    // Auto-retry for network errors (with exponential backoff)
    if (this.isNetworkError(error) && this.state.retryCount < this.maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000);
      
      console.log(`🔄 Auto-retrying in ${delay}ms (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
      
      this.resetTimeoutId = window.setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prevState.retryCount + 1
        }));
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private isNetworkError = (error: Error): boolean => {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('fetch') || 
           errorMessage.includes('network') || 
           errorMessage.includes('failed to fetch') ||
           errorMessage.includes('load');
  };

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      // Use enhanced error fallback with community context
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
          context={this.props.context || 'comunidade'}
          showDetails={this.props.showDetails ?? false}
          showHomeButton={true}
          showBackButton={true}
        />
      );
    }

    return this.props.children;
  }
}
