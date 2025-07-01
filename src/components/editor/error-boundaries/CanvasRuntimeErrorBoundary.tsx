// ABOUTME: Specialized runtime error boundary for React Flow canvas with infinite loop detection

import React from 'react';
import { RuntimeErrorBoundary } from '@/components/error-boundaries/RuntimeErrorBoundary';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Zap, Eye } from 'lucide-react';

interface CanvasErrorFallbackProps {
  error: Error;
  errorCount: number;
  isInfiniteLoop: boolean;
  onReset: () => void;
  onReload: () => void;
}

function CanvasErrorFallback({
  error,
  errorCount,
  isInfiniteLoop,
  onReset,
  onReload,
}: CanvasErrorFallbackProps) {
  const handleClearCanvas = () => {
    // Clear canvas-specific state
    localStorage.removeItem('canvas-state');
    localStorage.removeItem('selected-node');
    localStorage.removeItem('canvas-transform');
    onReload();
  };

  const handleResetView = () => {
    // Reset canvas view without losing content
    localStorage.removeItem('canvas-transform');
    localStorage.removeItem('canvas-zoom');
    onReset();
  };

  if (isInfiniteLoop) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="max-w-md text-center p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <Zap className="w-8 h-8 text-red-600" />
          </div>

          <h3 className="text-lg font-semibold text-red-800 mb-2">Canvas Infinite Loop Detected</h3>

          <p className="text-red-700 mb-4">
            The canvas is stuck in an infinite update cycle. This often happens when:
          </p>

          <ul className="text-sm text-red-600 text-left mb-4 space-y-1">
            <li>• A block has invalid or circular data references</li>
            <li>• React Flow nodes are updating continuously</li>
            <li>• Theme or layout calculations are in a loop</li>
          </ul>

          <div className="bg-red-100 p-3 rounded mb-4">
            <p className="text-xs text-red-600">
              <strong>Error Count:</strong> {errorCount} rapid errors detected
            </p>
            <p className="text-xs text-red-600">
              <strong>Message:</strong> {error.message}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleResetView}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Canvas View
            </Button>

            <Button
              onClick={handleClearCanvas}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Clear Canvas State
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-yellow-50 border-2 border-yellow-200 rounded-lg">
      <div className="max-w-md text-center p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
          <Eye className="w-8 h-8 text-yellow-600" />
        </div>

        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Canvas Rendering Error</h3>

        <p className="text-yellow-700 mb-4">
          The canvas failed to render properly. This might be due to:
        </p>

        <ul className="text-sm text-yellow-600 text-left mb-4 space-y-1">
          <li>• Corrupted block data</li>
          <li>• React Flow rendering issues</li>
          <li>• Invalid layout configuration</li>
          <li>• Theme application problems</li>
        </ul>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 p-3 rounded mb-4 text-left">
            <p className="text-xs text-yellow-600">
              <strong>Error:</strong> {error.message}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              <strong>Error Count:</strong> {errorCount}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={onReset} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry Canvas
          </Button>

          <Button
            onClick={handleResetView}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Reset View Only
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CanvasRuntimeErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RuntimeErrorBoundary
      context="EditorCanvas"
      fallback={
        <CanvasErrorFallback
          error={new Error('Canvas rendering failed')}
          errorCount={0}
          isInfiniteLoop={false}
          onReset={() => window.location.reload()}
          onReload={() => window.location.reload()}
        />
      }
      onError={(error, errorInfo) => {
        // Enhanced logging for canvas errors
        console.error('Canvas Runtime Error:', {
          error: error.message,
          errorType: errorInfo.eventType,
          timestamp: errorInfo.timestamp,
          errorCount: errorInfo.errorCount,
          source: errorInfo.source,
        });

        // Report to monitoring in production
        if (process.env.NODE_ENV === 'production' && window.Sentry) {
          window.Sentry.captureException(error, {
            tags: {
              component: 'CanvasRuntimeErrorBoundary',
              eventType: errorInfo.eventType,
              isInfiniteLoop: errorInfo.eventType === 'infinite-loop',
            },
            extra: {
              ...errorInfo,
              canvasState: {
                nodes: localStorage.getItem('canvas-nodes'),
                transform: localStorage.getItem('canvas-transform'),
                selectedNode: localStorage.getItem('selected-node'),
              },
            },
          });
        }
      }}
    >
      {children}
    </RuntimeErrorBoundary>
  );
}
