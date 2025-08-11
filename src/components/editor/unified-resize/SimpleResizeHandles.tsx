// ABOUTME: Simple resize handles component without constraints or performance optimizations

import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ResizeHandle, MousePosition } from './SimpleResizeController';
import { SimpleResizeHandlers } from './useSimpleResize';

export interface SimpleResizeHandlesProps {
  width: number;
  height: number;
  x: number;
  y: number;
  resizeHandlers: SimpleResizeHandlers;
  isActive: boolean;
  onHandleHover?: (handle: ResizeHandle | null) => void;
  opacity?: number;
}

/**
 * Simple resize handles that provide complete resize freedom
 * - No size constraints or content-aware limitations
 * - No performance monitoring or optimization systems
 * - Direct mouse events without debouncing or batching
 * - Simple visual feedback without constraint states
 */
export const SimpleResizeHandles = memo<SimpleResizeHandlesProps>(({
  width,
  height,
  x,
  y,
  resizeHandlers,
  isActive,
  onHandleHover,
  opacity = 1.0,
}) => {
  // Handle positioning - simple absolute positioning
  const getHandlePosition = useCallback((handle: ResizeHandle): React.CSSProperties => {
    const offset = -6; // Center the 12px handle
    
    switch (handle) {
      case 'nw':
        return { top: offset, left: offset };
      case 'n':
        return { top: offset, left: '50%', transform: 'translateX(-50%)' };
      case 'ne':
        return { top: offset, right: offset };
      case 'w':
        return { top: '50%', left: offset, transform: 'translateY(-50%)' };
      case 'e':
        return { top: '50%', right: offset, transform: 'translateY(-50%)' };
      case 'sw':
        return { bottom: offset, left: offset };
      case 's':
        return { bottom: offset, left: '50%', transform: 'translateX(-50%)' };
      case 'se':
        return { bottom: offset, right: offset };
      default:
        return {};
    }
  }, []);

  // Handle cursor types
  const getHandleCursor = useCallback((handle: ResizeHandle): string => {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'cursor-nwse-resize';
      case 'ne':
      case 'sw':
        return 'cursor-nesw-resize';
      case 'n':
      case 's':
        return 'cursor-ns-resize';
      case 'w':
      case 'e':
        return 'cursor-ew-resize';
      default:
        return 'cursor-default';
    }
  }, []);

  // Simple mouse down handler - no constraint checking
  const createHandleMouseDown = useCallback((handle: ResizeHandle) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const mousePosition: MousePosition = {
        x: e.clientX,
        y: e.clientY,
      };

      const currentDimensions = {
        x: x, // Use real position from props
        y: y, // Use real position from props
        width,
        height,
      };

      // Start resize operation - simple and direct
      const success = resizeHandlers.startResize(handle, mousePosition, currentDimensions);
      
      if (!success) {
        return;
      }

      // Simple global mouse event handling
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newMousePosition: MousePosition = {
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        };
        resizeHandlers.updateResize(newMousePosition);
      };

      const handleMouseUp = () => {
        resizeHandlers.endResize();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      // Add global listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  }, [width, height, resizeHandlers, x, y]);

  // Handle hover events - simple state updates
  const handleMouseEnter = useCallback((handle: ResizeHandle) => {
    onHandleHover?.(handle);
  }, [onHandleHover]);

  const handleMouseLeave = useCallback(() => {
    onHandleHover?.(null);
  }, [onHandleHover]);

  // Handle styles
  const handleStyle = useMemo((): React.CSSProperties => ({
    position: 'absolute',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    backgroundColor: resizeHandlers.isResizing 
      ? 'hsl(var(--success))' // Success color when resizing
      : 'hsl(var(--primary))', // Primary color default
    boxShadow: resizeHandlers.isResizing
      ? '0 0 0 4px hsl(var(--success) / 0.2)'
      : '0 2px 4px hsl(var(--foreground) / 0.1)',
    zIndex: 30,
    transition: 'all 0.15s ease-out',
    opacity: 1, // Full opacity for better click detection
    transform: resizeHandlers.isResizing ? 'scale(1.1)' : 'scale(1)',
    pointerEvents: 'auto', // Ensure handles are clickable
  }), [resizeHandlers.isResizing]);

  // All resize handles - complete freedom in all directions
  const resizeHandles: Array<{
    handle: ResizeHandle;
    title: string;
  }> = useMemo(() => [
    { handle: 'nw', title: 'Resize northwest' },
    { handle: 'n', title: 'Resize height from top' },
    { handle: 'ne', title: 'Resize northeast' },
    { handle: 'w', title: 'Resize width from left' },
    { handle: 'e', title: 'Resize width from right' },
    { handle: 'sw', title: 'Resize southwest' },
    { handle: 's', title: 'Resize height from bottom' },
    { handle: 'se', title: 'Resize southeast' },
  ], []);

  // Only render if active
  if (!isActive) return null;

  return (
    <>
      {resizeHandles.map(({ handle, title }) => (
        <div
          key={handle}
          className={cn(
            'absolute rounded-full hover:scale-110 transition-transform',
            getHandleCursor(handle)
          )}
          style={{
            ...handleStyle,
            ...getHandlePosition(handle),
            opacity,
          }}
          onMouseDown={createHandleMouseDown(handle)}
          onMouseEnter={() => handleMouseEnter(handle)}
          onMouseLeave={handleMouseLeave}
          title={title}
          data-resize-handle={handle}
          data-testid={`simple-resize-handle-${handle}`}
        />
      ))}

      {/* Simple visual feedback during resize - no constraint warnings */}
      {resizeHandlers.isResizing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="px-2 py-1 rounded text-xs font-mono text-white bg-green-600">
            {Math.round(width)} × {Math.round(height)}px
          </div>
        </div>
      )}

      {/* Simple border overlay during resize */}
      {resizeHandlers.isResizing && (
        <div
          className="absolute inset-0 pointer-events-none z-25"
          style={{
            border: '2px dashed rgba(16, 185, 129, 0.8)',
            borderRadius: '4px',
          }}
        />
      )}
    </>
  );
});

SimpleResizeHandles.displayName = 'SimpleResizeHandles';