// ABOUTME: Unified block wrapper component with integrated simple resize system

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { ContentBoundaryProps } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionCoordination } from '@/hooks/useSelectionCoordination';
import { cn } from '@/lib/utils';
// Content measurement removed - no constraints needed
import { useSimpleResize, SimpleResizeHandles, ResizeHandle } from '@/components/editor/unified-resize';

/**
 * UnifiedBlockWrapper eliminates the disconnect between resize boundaries and actual content
 * by providing a zero-margin/padding container where resize handles directly correspond to content edges
 */
export const UnifiedBlockWrapper = React.memo<ContentBoundaryProps>(
  ({
    id,
    width,
    height,
    x,
    y,
    selected,
    blockType,
    children,
    contentStyles = {},
    onResize,
    onMove,
    onSelect,
    showResizeHandles = true,
    // Constraint-related props removed - complete resize freedom
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { updateNodePosition } = useEditorStore();

    // Unified selection coordination system
    const { isActive, handleBlockActivation } = useSelectionCoordination({
      blockId: id,
      componentType: 'generic',
      enableContentSelection: false, // Block wrapper doesn't handle content selection
      preventBubbling: true,
    });

    // Simple resize system integration - no constraints or limitations
    const resizeHandlers = useSimpleResize({
      nodeId: id,
      onUpdate: (position) => {
        // Update both resize and move callbacks for complete freedom
        if (position.width !== undefined || position.height !== undefined) {
          const resizeData = {
            width: position.width ?? width,
            height: position.height ?? height,
          };
          onResize?.(resizeData);
        }
        if (position.x !== undefined || position.y !== undefined) {
          const moveData = {
            x: position.x ?? x,
            y: position.y ?? y,
          };
          onMove?.(moveData);
        }
        
        // Update store directly for immediate feedback
        const storeUpdate = {
          x: position.x ?? x,
          y: position.y ?? y,
          width: position.width ?? width,
          height: position.height ?? height,
        };
        updateNodePosition(id, storeUpdate);
      },
    });

    // Visual feedback state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
    const [hoverHandle, setHoverHandle] = useState<ResizeHandle | null>(null);
    const [showSnapLines, setShowSnapLines] = useState(false);
    const [borderHover, setBorderHover] = useState(false);

    // Visual feedback callbacks for simple resize system
    const handleHandleHover = useCallback((handle: ResizeHandle | null) => {
      setHoverHandle(handle);
      setShowSnapLines(handle !== null);
    }, []);

    // Get current resize state from simple resize system
    const isResizing = resizeHandlers.isResizing;

    // Dedicated drag handler - only triggered from zone detection
    const handleDragStart = useCallback(
      (e: React.MouseEvent) => {
        if (e.button !== 0 || isResizing) return; // Only left click, don't interfere with resize

        // Ensure block is selected before dragging
        if (onSelect) {
          onSelect();
        }

        // Initialize drag operation
        setIsDragging(true);
        setDragStart({
          x: x,
          y: y,
          mouseX: e.clientX,
          mouseY: e.clientY,
        });

        // Event handling is already done by the calling handler
      },
      [onSelect, x, y, isResizing]
    );

    // Border drag detection - 8px threshold from edges
    const isBorderClick = useCallback((e: React.MouseEvent, element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const threshold = 8;

      // Check if click is within 8px of any border edge
      const nearLeft = x <= threshold;
      const nearRight = x >= rect.width - threshold;
      const nearTop = y <= threshold;
      const nearBottom = y >= rect.height - threshold;

      return nearLeft || nearRight || nearTop || nearBottom;
    }, []);

    // Check if click is on a resize handle to avoid conflicts
    const isResizeHandleClick = useCallback((e: React.MouseEvent): boolean => {
      const target = e.target as HTMLElement;
      return target.closest('[data-resize-handle]') !== null;
    }, []);

    // Border hover detection for visual feedback
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (isResizing || isDragging) return;

      const element = e.currentTarget as HTMLElement;
      const shouldHover = isBorderClick(e, element) && !isResizeHandleClick(e);
      setBorderHover(shouldHover);
    }, [isBorderClick, isResizeHandleClick, isResizing, isDragging]);

    const handleMouseLeave = useCallback(() => {
      setBorderHover(false);
    }, []);

    // Enhanced block activation with border drag detection
    const handleBlockClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.button !== 0 || isResizing) return; // Only left click, don't interfere with resize

        // Check if click is on resize handle - give priority to resize
        if (isResizeHandleClick(e)) {
          // Let resize handle take over
          return;
        }

        // Check if this is a border drag attempt
        const element = e.currentTarget as HTMLElement;
        if (isBorderClick(e, element)) {
          // Start border-based drag operation
          handleDragStart(e);
          return;
        }

        // Use coordinated activation system for regular clicks
        handleBlockActivation(e);

        // Also call legacy onSelect for backward compatibility
        if (onSelect) {
          onSelect();
        }

        // Don't preventDefault - let TipTap and content editing work naturally
      },
      [handleBlockActivation, onSelect, isResizing, isBorderClick, isResizeHandleClick, handleDragStart]
    );

    // Drag movement handler
    const handleDragMove = useCallback(
      (moveEvent: MouseEvent) => {
        if (!isDragging || isResizing) return;

        const deltaX = moveEvent.clientX - dragStart.mouseX;
        const deltaY = moveEvent.clientY - dragStart.mouseY;

        const newX = dragStart.x + deltaX;
        const newY = dragStart.y + deltaY;

        // Apply canvas boundary constraints - get dynamic canvas width
        const canvasElement = document.querySelector('.editor-canvas, .wysiwyg-canvas, [data-testid*="canvas"]') as HTMLElement;
        const canvasWidth = canvasElement ? canvasElement.offsetWidth : window.innerWidth - 300; // Fallback with sidebar space
        
        const constrainedX = Math.max(0, Math.min(canvasWidth - width, newX));
        const constrainedY = Math.max(0, newY);

        // Update position through onMove callback and store
        if (onMove) {
          onMove({ x: constrainedX, y: constrainedY });
        }

        // Also update directly in store for immediate feedback
        updateNodePosition(id, { x: constrainedX, y: constrainedY });
      },
      [isDragging, isResizing, dragStart, width, onMove, updateNodePosition, id]
    );

    // Drag end handler
    const handleDragEnd = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Global mouse event listeners for drag operations
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        return () => {
          document.removeEventListener('mousemove', handleDragMove);
          document.removeEventListener('mouseup', handleDragEnd);
        };
      }
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Unified container styles with enhanced visual feedback
    const containerStyles = useMemo(
      (): React.CSSProperties => ({
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        padding: 0,
        margin: 0,
        border: 'none',
        outline: 'none',
        boxSizing: 'border-box',
        // Ensure content fills container exactly
        display: 'flex',
        flexDirection: 'column',
        // Enhanced visual feedback - updated for border dragging
        transition: isResizing || isDragging ? 'none' : 'all 0.15s ease-out',
        transform: isResizing || isDragging ? 'scale(1.001)' : 'scale(1)', // Subtle scale during interaction
        zIndex: isResizing || isDragging ? 1000 : isActive ? 100 : 1,
        cursor: isDragging 
          ? 'grabbing' 
          : isResizing 
            ? 'default' 
            : borderHover 
              ? 'grab' 
              : 'default',
        // Border hover visual feedback
        ...(borderHover && isActive && {
          boxShadow: 'inset 0 0 0 2px rgba(59, 130, 246, 0.4)',
        }),
        // Development feedback (can be removed in production)
        ...(process.env.NODE_ENV === 'development' &&
          isActive && {
            outline: isResizing
              ? '2px dashed rgba(16, 185, 129, 0.6)'
              : borderHover
                ? '2px dashed rgba(59, 130, 246, 0.6)'
                : '1px dashed rgba(59, 130, 246, 0.3)',
            outlineOffset: '-1px',
          }),
      }),
      [x, y, width, height, isResizing, isActive, isDragging, borderHover]
    );

    // Content area styles (fills container exactly)
    const unifiedContentStyles = useMemo(
      (): React.CSSProperties => ({
        width: '100%',
        height: '100%',
        padding: 0,
        margin: 0,
        border: 'none',
        boxSizing: 'border-box',
        position: 'relative',
        // Apply custom content styles
        ...contentStyles,
        // Allow dropdown menus to overflow for rich blocks (tables), hide for others
        overflow: blockType === 'richBlock' ? 'visible' : 'hidden',
      }),
      [contentStyles, blockType]
    );

    // Selection classes for visual feedback
    const selectionClasses = selected ? 'ring-2 ring-primary ring-offset-0' : '';

    return (
      <div
        className={cn('unified-block-wrapper', selectionClasses, `block-type-${blockType}`)}
        style={containerStyles}
        data-block-id={id}
        data-block-type={blockType}
        data-testid={`unified-block-${id}`}
        onClick={handleBlockClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Content Area - fills container exactly */}
        <div
          ref={contentRef}
          className="unified-content-area"
          style={unifiedContentStyles}
          data-content-boundary="true"
        >
          {children}
        </div>

        {/* Simple Resize Handles - no constraints, complete freedom */}
        {showResizeHandles && (
          <SimpleResizeHandles
            width={width}
            height={height}
            x={x}
            y={y}
            resizeHandlers={resizeHandlers}
            isActive={isActive}
            onHandleHover={handleHandleHover}
          />
        )}


        {/* Enhanced Selection Indicator with real-time dimensions and status */}
        {isActive && (
          <div className="absolute -top-6 left-0 flex gap-2 text-xs z-20">
            <div
              className={cn(
                'px-2 py-1 rounded transition-colors',
                isResizing
                  ? 'bg-green-600 text-white'
                  : isDragging
                    ? 'bg-blue-600 text-white'
                    : 'bg-primary text-primary-foreground'
              )}
            >
              {isResizing
                ? 'Resizing...'
                : isDragging
                  ? 'Dragging...'
                  : `${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Selected`}
            </div>
            <div
              className={cn(
                'px-2 py-1 rounded transition-colors',
                isResizing ? 'bg-green-700 text-white font-mono' : 'bg-slate-700 text-white'
              )}
            >
              {Math.round(width)} × {Math.round(height)}px
            </div>
            {hoverHandle && !isResizing && (
              <div className="bg-blue-600 text-white px-2 py-1 rounded">{hoverHandle} handle</div>
            )}
          </div>
        )}

        {/* Snap lines and alignment guides - now handled by SimpleResizeHandles */}
        {showSnapLines && isResizing && (
          <SnapLinesOverlay x={x} y={y} width={width} height={height} />
        )}
      </div>
    );
  }
);

UnifiedBlockWrapper.displayName = 'UnifiedBlockWrapper';

// Old ResizeHandles component removed - now using SimpleResizeHandles

// Old ResizeHandles component removed - replaced with SimpleResizeHandles

/**
 * Simplified snap lines overlay - direction handling moved to SimpleResizeHandles
 */
interface SnapLinesOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SnapLinesOverlay = React.memo<SnapLinesOverlayProps>(({ x, y, width, height }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Vertical center line */}
      <div
        className="absolute bg-blue-400 opacity-60"
        style={{
          left: `${x + width / 2}px`,
          top: '0',
          width: '1px',
          height: '100vh',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Horizontal center line */}
      <div
        className="absolute bg-blue-400 opacity-60"
        style={{
          top: `${y + height / 2}px`,
          left: '0',
          height: '1px',
          width: '100vw',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
});

SnapLinesOverlay.displayName = 'SnapLinesOverlay';

// Old DimensionGuides component removed - functionality moved to SimpleResizeHandles
