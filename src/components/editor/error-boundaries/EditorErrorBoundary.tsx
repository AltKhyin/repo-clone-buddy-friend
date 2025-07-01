// ABOUTME: Enhanced error boundary specifically for Visual Composition Engine components

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home, ArrowLeft } from 'lucide-react';

interface EditorErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: string;
}

function EditorErrorFallback({ error, resetError, context = 'editor' }: EditorErrorFallbackProps) {
  const handleReloadEditor = () => {
    // Clear any editor state from localStorage
    const editorKeys = Object.keys(localStorage).filter(
      key => key.startsWith('editor-') || key.startsWith('canvas-') || key.startsWith('block-')
    );
    editorKeys.forEach(key => localStorage.removeItem(key));

    // Reload the page
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const isCanvasError = context.includes('canvas') || context.includes('Canvas');
  const isInspectorError = context.includes('inspector') || context.includes('Inspector');
  const isThemeError = error.message.includes('theme') || error.message.includes('Theme');

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-lg w-full bg-white border border-red-200 rounded-lg shadow-lg">
        <div className="p-6">
          {/* Error Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          {/* Error Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {isCanvasError && 'Canvas Error'}
            {isInspectorError && 'Inspector Error'}
            {isThemeError && 'Theme Error'}
            {!isCanvasError && !isInspectorError && !isThemeError && 'Editor Error'}
          </h3>

          {/* Error Description */}
          <p className="text-gray-600 text-center mb-6">
            {isCanvasError &&
              "An error occurred while rendering the canvas. Your content is safe and this won't affect your saved work."}
            {isInspectorError &&
              'The inspector panel encountered an error. Try selecting a different block or refreshing the editor.'}
            {isThemeError &&
              'A theme-related error occurred. The editor will fallback to the default theme.'}
            {!isCanvasError &&
              !isInspectorError &&
              !isThemeError &&
              'An unexpected error occurred in the editor. Your work has been automatically saved.'}
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 p-3 bg-gray-50 rounded border">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Error Details
              </summary>
              <div className="mt-2 text-xs text-gray-600">
                <p>
                  <strong>Context:</strong> {context}
                </p>
                <p>
                  <strong>Error:</strong> {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {error.stack.slice(0, 500)}...
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={resetError}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <div className="flex gap-3">
              <Button onClick={handleReloadEditor} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload Editor
              </Button>

              <Button onClick={handleGoHome} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>

          {/* Recovery Tips */}
          <div className="mt-6 p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Recovery Tips:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              {isCanvasError && (
                <>
                  <li>• Try refreshing the page to reload the canvas</li>
                  <li>• Check if any blocks have invalid data</li>
                  <li>• Clear browser cache if the problem persists</li>
                </>
              )}
              {isInspectorError && (
                <>
                  <li>• Try selecting a different block</li>
                  <li>• Clear the current selection</li>
                  <li>• Refresh the editor if needed</li>
                </>
              )}
              {isThemeError && (
                <>
                  <li>• Theme will fallback to default automatically</li>
                  <li>• Try refreshing to reload theme settings</li>
                  <li>• Check theme configuration if custom theme</li>
                </>
              )}
              {!isCanvasError && !isInspectorError && !isThemeError && (
                <>
                  <li>• Your work is automatically saved</li>
                  <li>• Try refreshing the page</li>
                  <li>• Contact support if the issue persists</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized Error Boundaries for different editor contexts

export function EditorPageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      tier="page"
      context="EditorPage"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
      fallback={EditorErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}

export function EditorCanvasErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      tier="feature"
      context="EditorCanvas"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={false}
      showBackButton={false}
      fallback={props => <EditorErrorFallback {...props} context="canvas" />}
    >
      {children}
    </ErrorBoundary>
  );
}

export function InspectorErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      tier="feature"
      context="InspectorPanel"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={false}
      showBackButton={false}
      fallback={props => <EditorErrorFallback {...props} context="inspector" />}
    >
      {children}
    </ErrorBoundary>
  );
}

export function BlockPaletteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      tier="feature"
      context="BlockPalette"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={false}
      showBackButton={false}
      fallback={props => <EditorErrorFallback {...props} context="palette" />}
    >
      {children}
    </ErrorBoundary>
  );
}

export function BlockNodeErrorBoundary({
  children,
  blockType,
}: {
  children: React.ReactNode;
  blockType?: string;
}) {
  return (
    <ErrorBoundary
      tier="feature"
      context={`BlockNode-${blockType || 'unknown'}`}
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={false}
      showBackButton={false}
      fallback={props => (
        <div className="border-2 border-red-300 bg-red-50 rounded p-4 m-2">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Block Error ({blockType || 'unknown'})</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            This block failed to render. Try refreshing or deleting this block.
          </p>
          <Button size="sm" variant="outline" onClick={props.resetError} className="mt-2 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
