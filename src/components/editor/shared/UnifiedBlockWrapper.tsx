// ABOUTME: Unified block wrapper component that eliminates container/content disconnect for precise resize operations

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { ContentBoundaryProps } from '@/types/editor';
import { useEditorStore, useActiveBlockId, useEditorActions } from '@/store/editorStore';
import { useSelectionCoordination } from '@/hooks/useSelectionCoordination';
import { cn } from '@/lib/utils';
import { useContentMeasurement, calculateStyledMinDimensions } from '@/hooks/useContentMeasurement';
import { GripVertical } from 'lucide-react';

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
    minDimensions = { width: 50, height: 30 },
    maxDimensions = { width: 1200, height: 800 },
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { updateNodePosition } = useEditorStore();
    const activeBlockId = useActiveBlockId();
    const { setActiveBlock } = useEditorActions();

    // Unified selection coordination system
    const { isActive, handleBlockActivation } = useSelectionCoordination({
      blockId: id,
      componentType: 'generic',
      enableContentSelection: false, // Block wrapper doesn't handle content selection
      preventBubbling: true,
    });

    // Content measurement for content-aware resize constraints
    const {
      elementRef: measurementRef,
      dimensions: contentDimensions,
      getMinimumDimensions,
    } = useContentMeasurement({
      debounceMs: 16, // 60fps updates for smooth resizing
      includePadding: false, // We'll calculate padding separately
      includeBorders: false, // We'll calculate borders separately
    });

    // Advanced visual feedback state
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string>('');

    // Drag system state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
    const [hoverHandle, setHoverHandle] = useState<string>('');
    const [showSnapLines, setShowSnapLines] = useState(false);

    // Calculate exact content boundaries
    const getContentBoundaries = useCallback(() => {
      const element = contentRef.current;
      if (!element) return null;

      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        x: rect.left,
        y: rect.top,
        element,
      };
    }, []);

    // Calculate content-aware minimum dimensions
    const contentAwareMinDimensions = useMemo(() => {
      // Extract styling properties from contentStyles
      const paddingX = contentStyles.paddingLeft || contentStyles.paddingRight || 0;
      const paddingY = contentStyles.paddingTop || contentStyles.paddingBottom || 0;
      const borderWidth = contentStyles.borderWidth || 0;

      // Convert string values to numbers
      const numPaddingX = typeof paddingX === 'string' ? parseFloat(paddingX) || 0 : paddingX;
      const numPaddingY = typeof paddingY === 'string' ? parseFloat(paddingY) || 0 : paddingY;
      const numBorderWidth =
        typeof borderWidth === 'string' ? parseFloat(borderWidth) || 0 : borderWidth;

      // Calculate minimum dimensions based on content + styling
      const styledMinDimensions = calculateStyledMinDimensions(contentDimensions, {
        paddingX: numPaddingX,
        paddingY: numPaddingY,
        borderWidth: numBorderWidth,
      });

      // Combine with explicit minDimensions (use the larger value)
      return {
        width: Math.max(minDimensions.width, styledMinDimensions.width),
        height: Math.max(minDimensions.height, styledMinDimensions.height),
      };
    }, [contentDimensions, contentStyles, minDimensions]);

    // Check if we're at content-aware minimum constraints (after contentAwareMinDimensions is calculated)
    const isAtContentMinimum =
      width <= contentAwareMinDimensions.width || height <= contentAwareMinDimensions.height;
    const showContentWarning = contentDimensions.isObserving && isAtContentMinimum;

    // Handle resize operations that directly affect content
    const handleContentResize = useCallback(
      (update: { width: number; height: number; x?: number; y?: number }) => {
        const { width: newWidth, height: newHeight, x: newX, y: newY } = update;

        // Enforce content-aware minimum and maximum dimensions
        const constrainedWidth = Math.max(
          contentAwareMinDimensions.width,
          Math.min(maxDimensions.width, newWidth)
        );
        const constrainedHeight = Math.max(
          contentAwareMinDimensions.height,
          Math.min(maxDimensions.height, newHeight)
        );

        // Prepare position update object
        const positionUpdate: any = {
          width: constrainedWidth,
          height: constrainedHeight,
        };

        // Include position changes if provided
        if (newX !== undefined) positionUpdate.x = newX;
        if (newY !== undefined) positionUpdate.y = newY;

        // Update block position in store
        updateNodePosition(id, positionUpdate);

        // Notify parent component
        onResize?.({ width: constrainedWidth, height: constrainedHeight });
      },
      [id, contentAwareMinDimensions, maxDimensions, updateNodePosition, onResize]
    );

    // Handle movement operations
    const handleContentMove = useCallback(
      (newPosition: { x: number; y: number }) => {
        updateNodePosition(id, {
          x: newPosition.x,
          y: newPosition.y,
        });

        onMove?.(newPosition);
      },
      [id, updateNodePosition, onMove]
    );

    // Visual feedback callbacks for resize handles
    const handleResizeStart = useCallback((direction: string) => {
      setIsResizing(true);
      setResizeDirection(direction);
      setShowSnapLines(true);
    }, []);

    const handleResizeEnd = useCallback(() => {
      setIsResizing(false);
      setResizeDirection('');
      setShowSnapLines(false);
    }, []);

    const handleHandleHover = useCallback((direction: string) => {
      setHoverHandle(direction);
    }, []);

    const handleHandleLeave = useCallback(() => {
      setHoverHandle('');
    }, []);

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

    // Enhanced block activation with coordination
    const handleBlockClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.button !== 0 || isResizing) return; // Only left click, don't interfere with resize

        // Use coordinated activation system
        handleBlockActivation(e);

        // Also call legacy onSelect for backward compatibility
        if (onSelect) {
          onSelect();
        }

        // Don't preventDefault - let TipTap and content editing work naturally
      },
      [handleBlockActivation, onSelect, isResizing]
    );

    // Drag movement handler
    const handleDragMove = useCallback(
      (moveEvent: MouseEvent) => {
        if (!isDragging || isResizing) return;

        const deltaX = moveEvent.clientX - dragStart.mouseX;
        const deltaY = moveEvent.clientY - dragStart.mouseY;

        const newX = dragStart.x + deltaX;
        const newY = dragStart.y + deltaY;

        // Apply canvas boundary constraints
        const constrainedX = Math.max(0, Math.min(800 - width, newX));
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
        // Enhanced visual feedback
        transition: isResizing || isDragging ? 'none' : 'all 0.15s ease-out',
        transform: isResizing || isDragging ? 'scale(1.001)' : 'scale(1)', // Subtle scale during interaction
        zIndex: isResizing || isDragging ? 1000 : isActive ? 100 : 1,
        cursor: isDragging ? 'grabbing' : isResizing ? 'default' : 'grab',
        // Development feedback (can be removed in production)
        ...(process.env.NODE_ENV === 'development' &&
          isActive && {
            outline: isResizing
              ? '2px dashed rgba(16, 185, 129, 0.6)'
              : '1px dashed rgba(59, 130, 246, 0.3)',
            outlineOffset: '-1px',
          }),
      }),
      [x, y, width, height, selected, isResizing, isActive, isDragging]
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
        // Ensure content doesn't overflow container
        overflow: 'hidden',
      }),
      [contentStyles]
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
      >
        {/* Content Area - fills container exactly */}
        <div
          ref={node => {
            // Sync both refs
            contentRef.current = node;
            measurementRef.current = node;
          }}
          className="unified-content-area"
          style={unifiedContentStyles}
          data-content-boundary="true"
        >
          {children}
        </div>

        {/* Resize Handles - only visible when active and enabled */}
        {isActive && showResizeHandles && (
          <ResizeHandles
            width={width}
            height={height}
            x={x}
            y={y}
            onResize={handleContentResize}
            minDimensions={contentAwareMinDimensions}
            maxDimensions={maxDimensions}
            blockType={blockType}
            onResizeStart={handleResizeStart}
            onResizeEnd={handleResizeEnd}
            onHandleHover={handleHandleHover}
            onHandleLeave={handleHandleLeave}
            contentDimensions={contentDimensions}
          />
        )}

        {/* Drag Handle - positioned in top-right corner */}
        {isActive && (
          <div
            className="absolute -top-6 -right-6 w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded cursor-move hover:bg-primary/80 transition-colors z-30"
            onMouseDown={handleDragStart}
            title="Drag to move block"
          >
            <GripVertical size={12} />
          </div>
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
                ? `Resizing ${resizeDirection}`
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

        {/* Snap lines and alignment guides */}
        {showSnapLines && isResizing && (
          <SnapLinesOverlay x={x} y={y} width={width} height={height} direction={resizeDirection} />
        )}

        {/* Dimension guides during resize */}
        {isResizing && (
          <DimensionGuides
            width={width}
            height={height}
            direction={resizeDirection}
            minDimensions={contentAwareMinDimensions}
            maxDimensions={maxDimensions}
            contentDimensions={contentDimensions}
            isContentConstrained={showContentWarning}
          />
        )}
      </div>
    );
  }
);

UnifiedBlockWrapper.displayName = 'UnifiedBlockWrapper';

/**
 * Content-aware resize handles that attach directly to content boundaries
 */
interface ResizeHandlesProps {
  width: number;
  height: number;
  x: number;
  y: number;
  onResize: (update: { width: number; height: number; x?: number; y?: number }) => void;
  minDimensions: { width: number; height: number };
  maxDimensions: { width: number; height: number };
  blockType: string;
  onResizeStart: (direction: string) => void;
  onResizeEnd: () => void;
  onHandleHover: (direction: string) => void;
  onHandleLeave: () => void;
  contentDimensions: { contentWidth: number; contentHeight: number; isObserving: boolean };
}

const ResizeHandles = React.memo<ResizeHandlesProps>(
  ({
    width,
    height,
    x,
    y,
    onResize,
    minDimensions,
    maxDimensions,
    blockType,
    onResizeStart,
    onResizeEnd,
    onHandleHover,
    onHandleLeave,
    contentDimensions,
  }) => {
    const [isResizing, setIsResizing] = React.useState(false);
    const [resizeDirection, setResizeDirection] = React.useState<string>('');
    const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
    const [startDimensions, setStartDimensions] = React.useState({ width: 0, height: 0 });

    const handleResizeStart = useCallback(
      (e: React.MouseEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        setResizeDirection(direction);

        // Notify parent component about resize start
        onResizeStart(direction);

        // Capture start values at the moment of mouse down
        const initialPos = { x: e.clientX, y: e.clientY };
        const initialDimensions = { width, height };
        const initialPosition = { x, y }; // Capture initial position to prevent feedback loop

        setStartPos(initialPos);
        setStartDimensions(initialDimensions);

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - initialPos.x;
          const deltaY = moveEvent.clientY - initialPos.y;

          let newWidth = initialDimensions.width;
          let newHeight = initialDimensions.height;
          let newX = initialPosition.x; // Use initial position to prevent feedback loop
          let newY = initialPosition.y;

          // Boundary-based resize calculations
          if (direction.includes('right')) {
            // Right handle: move right boundary, keep left boundary fixed
            newWidth = Math.max(minDimensions.width, initialDimensions.width + deltaX);
          }
          if (direction.includes('left')) {
            // Left handle: move left boundary, keep right boundary fixed
            const rightBoundary = initialPosition.x + initialDimensions.width;
            newWidth = Math.max(minDimensions.width, initialDimensions.width - deltaX);
            newX = rightBoundary - newWidth;
          }
          if (direction.includes('bottom')) {
            // Bottom handle: move bottom boundary, keep top boundary fixed
            newHeight = Math.max(minDimensions.height, initialDimensions.height + deltaY);
          }
          if (direction.includes('top')) {
            // Top handle: move top boundary, keep bottom boundary fixed
            const bottomBoundary = initialPosition.y + initialDimensions.height;
            newHeight = Math.max(minDimensions.height, initialDimensions.height - deltaY);
            newY = bottomBoundary - newHeight;
          }

          // Maintain aspect ratio for corner handles
          if (direction.includes('corner')) {
            const aspectRatio = initialDimensions.width / initialDimensions.height;
            if (direction.includes('right') || direction.includes('left')) {
              const oldHeight = newHeight;
              newHeight = newWidth / aspectRatio;
              // Adjust position if top edge is involved
              if (direction.includes('top')) {
                newY = newY + (oldHeight - newHeight);
              }
            } else {
              const oldWidth = newWidth;
              newWidth = newHeight * aspectRatio;
              // Adjust position if left edge is involved
              if (direction.includes('left')) {
                newX = newX + (oldWidth - newWidth);
              }
            }
          }

          // Apply dimension constraints
          newWidth = Math.max(minDimensions.width, Math.min(maxDimensions.width, newWidth));
          newHeight = Math.max(minDimensions.height, Math.min(maxDimensions.height, newHeight));

          // Apply position constraints (keep within canvas bounds)
          newX = Math.max(0, Math.min(800 - newWidth, newX));
          newY = Math.max(0, newY);

          // Call onResize with both position and dimension updates
          onResize({
            width: newWidth,
            height: newHeight,
            x: newX !== initialPosition.x ? newX : undefined,
            y: newY !== initialPosition.y ? newY : undefined,
          });
        };

        const handleMouseUp = () => {
          setIsResizing(false);
          setResizeDirection('');

          // Notify parent component about resize end
          onResizeEnd();

          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      },
      [width, height, minDimensions, maxDimensions, onResize]
    );

    // Check if we're at content-aware minimum constraints (for this specific resize handles)
    const isAtContentMinimumHandle = width <= minDimensions.width || height <= minDimensions.height;
    const showContentWarningHandle = contentDimensions.isObserving && isAtContentMinimumHandle;

    // Enhanced visual feedback for resize handles
    const getHandleStyle = (direction: string) => ({
      position: 'absolute' as const,
      backgroundColor:
        showContentWarningHandle && isResizing && resizeDirection === direction
          ? 'rgb(239, 68, 68)' // Red when at content minimum
          : isResizing && resizeDirection === direction
            ? 'rgb(16, 185, 129)'
            : 'rgb(59, 130, 246)',
      border: '2px solid white',
      borderRadius: '50%',
      width: '12px',
      height: '12px',
      zIndex: 30,
      cursor: 'pointer',
      transition: 'all 0.15s ease-out',
      opacity: isResizing ? (resizeDirection === direction ? 1 : 0.3) : 0.9,
      transform: isResizing && resizeDirection === direction ? 'scale(1.2)' : 'scale(1)',
      boxShadow:
        showContentWarningHandle && isResizing && resizeDirection === direction
          ? '0 0 0 4px rgba(239, 68, 68, 0.2)' // Red glow for content warning
          : isResizing && resizeDirection === direction
            ? '0 0 0 4px rgba(16, 185, 129, 0.2)'
            : '0 2px 4px rgba(0, 0, 0, 0.1)',
      // Add content-aware visual feedback
      filter:
        showContentWarningHandle && isResizing && resizeDirection === direction
          ? 'brightness(1.1) saturate(1.2)'
          : isResizing && resizeDirection === direction
            ? 'brightness(1.1)'
            : 'brightness(1)',
    });

    return (
      <>
        {/* Corner handles - provide diagonal resize */}
        <div
          style={{
            ...getHandleStyle('corner-top-left'),
            top: '-6px',
            left: '-6px',
            cursor: 'nw-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'corner-top-left')}
          onMouseEnter={() => onHandleHover('corner-top-left')}
          onMouseLeave={() => onHandleLeave()}
          title="Resize northwest (maintains aspect ratio)"
        />
        <div
          style={{
            ...getHandleStyle('corner-top-right'),
            top: '-6px',
            right: '-6px',
            cursor: 'ne-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'corner-top-right')}
          title="Resize northeast (maintains aspect ratio)"
        />
        <div
          style={{
            ...getHandleStyle('corner-bottom-left'),
            bottom: '-6px',
            left: '-6px',
            cursor: 'sw-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'corner-bottom-left')}
          title="Resize southwest (maintains aspect ratio)"
        />
        <div
          style={{
            ...getHandleStyle('corner-bottom-right'),
            bottom: '-6px',
            right: '-6px',
            cursor: 'se-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'corner-bottom-right')}
          onMouseEnter={() => onHandleHover('corner-bottom-right')}
          onMouseLeave={() => onHandleLeave()}
          title="Resize southeast (maintains aspect ratio)"
        />

        {/* Edge handles - provide single-axis resize */}
        <div
          style={{
            ...getHandleStyle('top'),
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'n-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'top')}
          title="Resize height from top"
        />
        <div
          style={{
            ...getHandleStyle('bottom'),
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 's-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'bottom')}
          title="Resize height from bottom"
        />
        <div
          style={{
            ...getHandleStyle('left'),
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'w-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'left')}
          title="Resize width from left"
        />
        <div
          style={{
            ...getHandleStyle('right'),
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'e-resize',
          }}
          onMouseDown={e => handleResizeStart(e, 'right')}
          title="Resize width from right"
        />

        {/* Content boundary overlay for development feedback */}
        {process.env.NODE_ENV === 'development' && isResizing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '2px dashed rgba(16, 185, 129, 0.8)',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
        )}
      </>
    );
  }
);

ResizeHandles.displayName = 'ResizeHandles';

/**
 * Snap lines overlay that shows alignment guides during resize
 */
interface SnapLinesOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: string;
}

const SnapLinesOverlay = React.memo<SnapLinesOverlayProps>(({ x, y, width, height, direction }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Vertical center line */}
      {direction.includes('left') ||
        (direction.includes('right') && (
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
        ))}

      {/* Horizontal center line */}
      {direction.includes('top') ||
        (direction.includes('bottom') && (
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
        ))}
    </div>
  );
});

SnapLinesOverlay.displayName = 'SnapLinesOverlay';

/**
 * Dimension guides that show current size and constraints during resize
 */
interface DimensionGuidesProps {
  width: number;
  height: number;
  direction: string;
  minDimensions: { width: number; height: number };
  maxDimensions: { width: number; height: number };
  contentDimensions: { contentWidth: number; contentHeight: number; isObserving: boolean };
  isContentConstrained: boolean;
}

const DimensionGuides = React.memo<DimensionGuidesProps>(
  ({
    width,
    height,
    direction,
    minDimensions,
    maxDimensions,
    contentDimensions,
    isContentConstrained,
  }) => {
    const isWidthConstrained = width <= minDimensions.width || width >= maxDimensions.width;
    const isHeightConstrained = height <= minDimensions.height || height >= maxDimensions.height;

    return (
      <>
        {/* Width guide */}
        {(direction.includes('left') || direction.includes('right')) && (
          <div
            className="absolute top-1/2 left-0 right-0 flex items-center justify-center pointer-events-none z-30"
            style={{ transform: 'translateY(-50%)' }}
          >
            <div
              className={cn(
                'px-2 py-1 rounded text-xs font-mono',
                isContentConstrained
                  ? 'bg-red-600 text-white'
                  : isWidthConstrained
                    ? 'bg-orange-600 text-white'
                    : 'bg-blue-600 text-white'
              )}
            >
              W: {Math.round(width)}px
              {isContentConstrained && contentDimensions.isObserving && (
                <span className="ml-1 text-xs">
                  (content: {Math.round(contentDimensions.contentWidth)}px)
                </span>
              )}
              {isWidthConstrained && !isContentConstrained && (
                <span className="ml-1">
                  ({minDimensions.width}-{maxDimensions.width})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Height guide */}
        {(direction.includes('top') || direction.includes('bottom')) && (
          <div
            className="absolute top-0 bottom-0 left-1/2 flex items-center justify-center pointer-events-none z-30"
            style={{ transform: 'translateX(-50%)', writingMode: 'vertical-rl' }}
          >
            <div
              className={cn(
                'px-2 py-1 rounded text-xs font-mono',
                isContentConstrained
                  ? 'bg-red-600 text-white'
                  : isHeightConstrained
                    ? 'bg-orange-600 text-white'
                    : 'bg-blue-600 text-white'
              )}
              style={{ writingMode: 'horizontal-tb' }}
            >
              H: {Math.round(height)}px
              {isContentConstrained && contentDimensions.isObserving && (
                <span className="ml-1 text-xs">
                  (content: {Math.round(contentDimensions.contentHeight)}px)
                </span>
              )}
              {isHeightConstrained && !isContentConstrained && (
                <span className="ml-1">
                  ({minDimensions.height}-{maxDimensions.height})
                </span>
              )}
            </div>
          </div>
        )}
      </>
    );
  }
);

DimensionGuides.displayName = 'DimensionGuides';
