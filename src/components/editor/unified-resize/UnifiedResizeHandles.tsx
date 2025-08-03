// ABOUTME: Enhanced resize handles component that integrates with UnifiedResizeController

import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  ResizeHandle, 
  UnifiedResizeHandlers,
  useResizeHandleEvents,
  getResizeHandleCursor,
  getResizeHandlePosition,
} from './useUnifiedResize';

export interface UnifiedResizeHandlesProps {
  width: number;
  height: number;
  resizeHandlers: UnifiedResizeHandlers;
  blockType: string;
  isActive: boolean;
  contentDimensions?: {
    contentWidth: number;
    contentHeight: number;
    isObserving: boolean;
  };
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
  onHandleHover?: (handle: ResizeHandle | null) => void;
}

/**
 * Enhanced resize handles that integrate with UnifiedResizeController
 * Replaces the embedded ResizeHandles in UnifiedBlockWrapper
 */
export const UnifiedResizeHandles = memo<UnifiedResizeHandlesProps>(({
  width,
  height,
  resizeHandlers,
  blockType,
  isActive,
  contentDimensions,
  minDimensions = { width: 100, height: 60 },
  maxDimensions = { width: 1200, height: 800 },
  onHandleHover,
}) => {
  // Set up global mouse event handling
  const { createHandleMouseDown } = useResizeHandleEvents(resizeHandlers);

  // Check constraint states for visual feedback
  const isAtMinWidth = width <= minDimensions.width;
  const isAtMaxWidth = width >= maxDimensions.width;
  const isAtMinHeight = height <= minDimensions.height;
  const isAtMaxHeight = height >= maxDimensions.height;
  
  // Content constraint checking with improved buffer logic
  const contentWidthBuffer = 16; // Reduced from 40px - was too restrictive
  const contentHeightBuffer = 12; // Reduced from 20px - was too restrictive
  
  const isAtContentMinWidth = contentDimensions?.isObserving && 
    width <= (contentDimensions.contentWidth + contentWidthBuffer);
  const isAtContentMinHeight = contentDimensions?.isObserving && 
    height <= (contentDimensions.contentHeight + contentHeightBuffer);

  // Handle-specific constraint checking (replaces flawed global isContentConstrained)
  const getHandleConstraintState = useCallback((handle: ResizeHandle) => {
    const affectsWidth = handle.includes('w') || handle.includes('e');
    const affectsHeight = handle.includes('n') || handle.includes('s');
    
    // Check width constraints for width-affecting handles
    if (affectsWidth && (isAtMinWidth || isAtMaxWidth || isAtContentMinWidth)) {
      if (isAtContentMinWidth) return { isConstrained: true, reason: 'content-width' };
      if (isAtMinWidth) return { isConstrained: true, reason: 'min-width' };
      if (isAtMaxWidth) return { isConstrained: true, reason: 'max-width' };
    }
    
    // Check height constraints for height-affecting handles
    if (affectsHeight && (isAtMinHeight || isAtMaxHeight || isAtContentMinHeight)) {
      if (isAtContentMinHeight) return { isConstrained: true, reason: 'content-height' };
      if (isAtMinHeight) return { isConstrained: true, reason: 'min-height' };
      if (isAtMaxHeight) return { isConstrained: true, reason: 'max-height' };
    }
    
    return { isConstrained: false, reason: null };
  }, [
    isAtMinWidth, isAtMaxWidth, isAtMinHeight, isAtMaxHeight,
    isAtContentMinWidth, isAtContentMinHeight
  ]);

  // Handle hover events
  const handleMouseEnter = useCallback((handle: ResizeHandle) => {
    onHandleHover?.(handle);
  }, [onHandleHover]);

  const handleMouseLeave = useCallback(() => {
    onHandleHover?.(null);
  }, [onHandleHover]);

  // Pre-computed base style object (static properties)
  const baseHandleStyle = useMemo(() => ({
    position: 'absolute' as const,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    zIndex: 30,
    transition: 'all 0.15s ease-out',
    willChange: 'transform, opacity, box-shadow',
  }), []);

  // Base dynamic styles - handle-specific colors applied in getHandleStyle
  const baseDynamicStyles = useMemo(() => ({
    opacity: resizeHandlers.isResizing ? 0.9 : 0.8,
    transform: resizeHandlers.isResizing ? 'scale(1.1)' : 'scale(1)',
  }), [resizeHandlers.isResizing]);

  // Get optimized handle styles based on handle-specific constraints
  const getHandleStyle = useCallback((handle: ResizeHandle) => {
    const constraintState = getHandleConstraintState(handle);
    
    // Determine colors based on constraint state and resize status
    let backgroundColor: string;
    let boxShadow: string;
    
    if (constraintState.isConstrained) {
      // Handle is constrained - use red
      backgroundColor = 'rgb(239, 68, 68)'; // Red for constrained handles
      boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2)';
    } else if (resizeHandlers.isResizing) {
      // Handle is active and not constrained - use green
      backgroundColor = 'rgb(16, 185, 129)'; // Green when resizing
      boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.2)';
    } else {
      // Handle is available - use blue
      backgroundColor = 'rgb(59, 130, 246)'; // Blue default
      boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }

    return {
      ...baseHandleStyle,
      ...baseDynamicStyles,
      backgroundColor,
      boxShadow,
    };
  }, [
    baseHandleStyle,
    baseDynamicStyles,
    getHandleConstraintState,
    resizeHandlers.isResizing
  ]);

  // Define all resize handles
  const resizeHandles: Array<{
    handle: ResizeHandle;
    title: string;
    position: string;
  }> = useMemo(() => [
    // Corner handles - provide diagonal resize with aspect ratio preservation
    { handle: 'nw' as ResizeHandle, title: 'Resize northwest', position: getResizeHandlePosition('nw') },
    { handle: 'ne' as ResizeHandle, title: 'Resize northeast', position: getResizeHandlePosition('ne') },
    { handle: 'sw' as ResizeHandle, title: 'Resize southwest', position: getResizeHandlePosition('sw') },
    { handle: 'se' as ResizeHandle, title: 'Resize southeast', position: getResizeHandlePosition('se') },
    
    // Edge handles - provide single-axis resize
    { handle: 'n' as ResizeHandle, title: 'Resize height from top', position: getResizeHandlePosition('n') },
    { handle: 's' as ResizeHandle, title: 'Resize height from bottom', position: getResizeHandlePosition('s') },
    { handle: 'w' as ResizeHandle, title: 'Resize width from left', position: getResizeHandlePosition('w') },
    { handle: 'e' as ResizeHandle, title: 'Resize width from right', position: getResizeHandlePosition('e') },
  ], []);

  // Only render if active
  if (!isActive) return null;

  return (
    <>
      {resizeHandles.map(({ handle, title, position }) => (
        <div
          key={handle}
          className={cn(
            'absolute rounded-full hover:scale-110 transition-transform',
            getResizeHandleCursor(handle),
            position
          )}
          style={getHandleStyle(handle)}
          onMouseDown={createHandleMouseDown(handle)}
          onMouseEnter={() => handleMouseEnter(handle)}
          onMouseLeave={handleMouseLeave}
          title={title}
          data-resize-handle={handle}
          data-testid={`resize-handle-${handle}`}
        />
      ))}

      {/* Performance monitoring overlay - development only */}
      {process.env.NODE_ENV === 'development' && resizeHandlers.isResizing && (
        <PerformanceMonitor resizeHandlers={resizeHandlers} />
      )}

      {/* Visual feedback during resize */}
      {resizeHandlers.isResizing && (
        <ResizeFeedbackOverlay
          width={width}
          height={height}
          isContentConstrained={isAtContentMinWidth || isAtContentMinHeight}
          contentDimensions={contentDimensions}
          minDimensions={minDimensions}
          maxDimensions={maxDimensions}
        />
      )}
    </>
  );
});

UnifiedResizeHandles.displayName = 'UnifiedResizeHandles';

/**
 * Performance monitoring component - development only
 */
const PerformanceMonitor = memo<{ resizeHandlers: UnifiedResizeHandlers }>(({ resizeHandlers }) => {
  const metrics = resizeHandlers.getPerformanceMetrics();
  
  if (!metrics) return null;

  const isDroppingFrames = metrics.averageFrameTime > 16.67;

  return (
    <div 
      className="absolute -top-12 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded z-50 font-mono"
      style={{ minWidth: '200px' }}
    >
      <div className={isDroppingFrames ? 'text-red-400' : 'text-green-400'}>
        FPS: {Math.round(1000 / Math.max(metrics.averageFrameTime, 1))}
      </div>
      <div>Frame: {metrics.averageFrameTime.toFixed(1)}ms</div>
      <div>Drops: {metrics.droppedFrames}</div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

/**
 * Visual feedback overlay during resize operations
 */
const ResizeFeedbackOverlay = memo<{
  width: number;
  height: number;
  isContentConstrained: boolean;
  contentDimensions?: { contentWidth: number; contentHeight: number; isObserving: boolean };
  minDimensions: { width: number; height: number };
  maxDimensions: { width: number; height: number };
}>(({ 
  width, 
  height, 
  isContentConstrained, 
  contentDimensions,
  minDimensions,
  maxDimensions 
}) => {
  return (
    <>
      {/* Border overlay showing current dimensions */}
      <div
        className="absolute inset-0 pointer-events-none z-25"
        style={{
          border: isContentConstrained 
            ? '2px dashed rgba(239, 68, 68, 0.8)' 
            : '2px dashed rgba(16, 185, 129, 0.8)',
          borderRadius: '4px',
        }}
      />

      {/* Dimension display */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
        <div 
          className={cn(
            'px-2 py-1 rounded text-xs font-mono text-white',
            isContentConstrained 
              ? 'bg-red-600' 
              : 'bg-green-600'
          )}
        >
          {Math.round(width)} × {Math.round(height)}px
          {isContentConstrained && contentDimensions?.isObserving && (
            <div className="text-xs opacity-80">
              Content: {Math.round(contentDimensions.contentWidth)} × {Math.round(contentDimensions.contentHeight)}px
            </div>
          )}
        </div>
      </div>

      {/* Constraint indicators */}
      {(width <= minDimensions.width || width >= maxDimensions.width) && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
            Width: {minDimensions.width} - {maxDimensions.width}px
          </div>
        </div>
      )}
      
      {(height <= minDimensions.height || height >= maxDimensions.height) && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-6 z-30">
          <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
            Height: {minDimensions.height} - {maxDimensions.height}px
          </div>
        </div>
      )}
    </>
  );
});

ResizeFeedbackOverlay.displayName = 'ResizeFeedbackOverlay';