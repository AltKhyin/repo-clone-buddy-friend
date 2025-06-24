
// ABOUTME: Enhanced hierarchical error boundary component with contextual recovery mechanisms and consistent design.

import React from 'react';
import { ErrorFallback, type ErrorInfo } from './ui/error-fallback';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  context?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  tier?: 'root' | 'page' | 'feature';
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: `ErrorBoundary-${this.props.tier || 'unknown'}`
    };
    
    this.setState({ errorInfo: enhancedErrorInfo });
    
    // Enhanced logging with tier context
    console.group(`🚨 Error Boundary (${this.props.tier || 'unknown'} tier)`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', this.props.context || 'Unknown context');
    console.error('Tier:', this.props.tier || 'unknown');
    console.groupEnd();
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      // Use enhanced error fallback with tier-specific configuration
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
          context={this.props.context || 'aplicação'}
          showDetails={this.props.showDetails ?? (process.env.NODE_ENV === 'development')}
          showHomeButton={this.props.showHomeButton ?? (this.props.tier !== 'root')}
          showBackButton={this.props.showBackButton ?? (this.props.tier === 'page')}
        />
      );
    }

    return this.props.children;
  }
}

// Keep both exports for maximum compatibility
export default ErrorBoundary;
