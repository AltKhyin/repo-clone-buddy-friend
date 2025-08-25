// ABOUTME: Unified block wrapper component with integrated simple resize system

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { ContentBoundaryProps } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionCoordination } from '../../../hooks/useSelectionCoordination';
import { cn } from '@/lib/utils';
import { Move } from 'lucide-react';
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
    showDragHandle = false,
    readOnly = false, // 🎯 NEW: Read-only mode support
    // Constraint-related props removed - complete resize freedom
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { updateNodePosition } = useEditorStore();

    // 🎯 CONDITIONAL SELECTION SYSTEM: Only enable selection in interactive mode
    const { isActive, hasContentSelection, handleBlockActivation } = useSelectionCoordination({
      blockId: id,
      componentType: 'generic',
      enableContentSelection: false, // Block wrapper doesn't handle content selection
      preventBubbling: true,
      // 🎯 READ-ONLY: Disable selection in read-only mode
      enabled: !readOnly,
    });

    // 🎯 CONDITIONAL RESIZE SYSTEM: Only enable resize in interactive mode
    const resizeHandlers = useSimpleResize({
      nodeId: id,
      onUpdate: readOnly ? () => {} : (position) => {
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
      // 🎯 READ-ONLY: Disable resize completely
      disabled: readOnly,
    });

    // 🎯 CONDITIONAL INTERACTION STATE: Only enable in interactive mode
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
    const [hoverHandle, setHoverHandle] = useState<ResizeHandle | null>(null);
    
    // 🎯 CONDITIONAL HOVER STATE: Block hover detection only in interactive mode
    const [isBlockHovered, setIsBlockHovered] = useState(false);

    // 🎯 FIX: Visual feedback callbacks for simple resize system
    const handleHandleHover = useCallback((handle: ResizeHandle | null) => {
      setHoverHandle(handle);
    }, []);

    // Get current resize state from simple resize system
    const isResizing = resizeHandlers.isResizing;

    // 🎯 DRAG-HANDLE-ONLY: Dedicated drag handler - only triggered from drag handle
    const handleDragStart = useCallback(
      (e: React.MouseEvent) => {
        if (e.button !== 0 || isResizing) return; // Only left click, don't interfere with resize

        // Ensure block is selected before dragging
        if (onSelect) {
          onSelect();
        }

        // 🎯 SIMPLIFIED DRAG START: Initialize drag operation with position only
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

    // 🎯 RESIZE-ONLY: Keep resize handle detection for proper event handling
    const isResizeHandleClick = useCallback((e: React.MouseEvent): boolean => {
      const target = e.target as HTMLElement;
      return target.closest('[data-resize-handle]') !== null;
    }, []);

    // 🎯 REMOVED: Border hover detection eliminated - hover state managed by onMouseEnter/onMouseLeave
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      // Only handle resize-related mouse movement if needed by SimpleResizeHandles
      // Block hover state is now managed by onMouseEnter/onMouseLeave events
      return;
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsBlockHovered(false);
    }, []);

    // 🎯 HOVER STATE: Block hover detection for structure visibility
    const handleMouseEnter = useCallback(() => {
      setIsBlockHovered(true);
    }, []);

    // 🎯 DRAG-HANDLE-ONLY: Block activation only - no border drag initiation
    const handleBlockClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.button !== 0 || isResizing) return; // Only left click, don't interfere with resize

        // Check if click is on resize handle - give priority to resize
        if (isResizeHandleClick(e)) {
          return;
        }

        // Only block activation - drag is now handle-only
        handleBlockActivation(e);

        // Also call legacy onSelect for backward compatibility
        if (onSelect) {
          onSelect();
        }
      },
      [handleBlockActivation, onSelect, isResizing, isResizeHandleClick]
    );

    // 🎯 SIMPLIFIED DRAG MOVEMENT: Direct position updates only - no animations or calculations
    const handleDragMove = useCallback(
      (moveEvent: MouseEvent) => {
        if (!isDragging || isResizing) return;

        const deltaX = moveEvent.clientX - dragStart.mouseX;
        const deltaY = moveEvent.clientY - dragStart.mouseY;

        const newX = dragStart.x + deltaX;
        const newY = dragStart.y + deltaY;

        // Apply basic boundary constraints - no DOM queries
        const constrainedX = Math.max(0, newX);
        const constrainedY = Math.max(0, newY);

        // Direct position updates only
        if (onMove) {
          onMove({ x: constrainedX, y: constrainedY });
        }

        updateNodePosition(id, { x: constrainedX, y: constrainedY });
      },
      [isDragging, isResizing, dragStart, onMove, updateNodePosition, id]
    );

    // 🎯 SIMPLIFIED DRAG END: Clean drag state reset only
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

    // 🎯 REMOVED: Complex gesture detection system eliminated for performance

    // 🎯 CONDITIONAL CONTAINER STYLES: Different behavior for read-only vs interactive
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
        display: 'flex',
        flexDirection: 'column',
        // 🎯 READ-ONLY: No transitions in read-only mode
        transition: readOnly ? 'none' : 'none',
        // 🎯 CONDITIONAL Z-INDEX: Static z-index for read-only, dynamic for interactive
        zIndex: readOnly 
          ? 1 // Static z-index for read-only
          : (isResizing || isDragging ? 1000 : isActive ? 100 : isBlockHovered ? 50 : 1),
        // 🎯 CONDITIONAL CURSOR: Default cursor for read-only, interactive cursors for editor
        cursor: readOnly 
          ? 'default' 
          : (isDragging ? 'grabbing' : 'default'),
        // 🎯 CONDITIONAL VISUAL FEEDBACK: No drag feedback in read-only mode
        opacity: readOnly ? 1 : (isDragging ? 0.8 : 1),
        transform: readOnly ? 'none' : (isDragging ? 'scale(1.02)' : 'none'),
      }),
      [x, y, width, height, isResizing, isActive, isDragging, isBlockHovered, readOnly]
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
        // Auto-height visual feedback removed - now handled by green resize handles
        // Allow dropdown menus to overflow for rich blocks (tables), hide for others
        overflow: blockType === 'richBlock' ? 'visible' : 'hidden',
      }),
      [contentStyles, blockType]
    );

    // 🎯 ENHANCED SELECTION: Selection ring with hover state for structure visibility
    const selectionClasses = useMemo(() => {
      if (selected) {
        return 'ring-2 ring-primary ring-offset-1'; // Full opacity when selected
      }
      
      if (isBlockHovered && !isDragging && !isResizing) {
        return 'ring-2 ring-primary ring-offset-1 opacity-50'; // 50% opacity on hover
      }
      
      return ''; // No ring when not selected or hovered
    }, [selected, isBlockHovered, isDragging, isResizing]);

    return (
      <div
        className={cn('unified-block-wrapper', selectionClasses, `block-type-${blockType}`, readOnly && 'readonly-block-wrapper')}
        style={containerStyles}
        data-block-id={id}
        data-block-type={blockType}
        data-read-only={readOnly}
        data-testid={`unified-block-${id}`}
        // 🎯 CONDITIONAL EVENT HANDLERS: Only enable in interactive mode
        onClick={readOnly ? undefined : handleBlockClick}
        onMouseMove={readOnly ? undefined : handleMouseMove}
        onMouseEnter={readOnly ? undefined : handleMouseEnter}
        onMouseLeave={readOnly ? undefined : handleMouseLeave}
      >
        {/* Content Area - fills container exactly */}
        <div
          ref={contentRef}
          className="unified-content-area"
          style={unifiedContentStyles}
          data-content-boundary="true"
        >
          {/* 🎯 MEDIA CONSTRAINT ENHANCEMENT: Add rich block content container for media containment */}
          {blockType === 'richBlock' ? (
            <div 
              className="rich-block-content-container"
              style={{
                width: '100%',
                height: '100%',
                // 🎯 MEDIA CONSTRAINT SYSTEM: Pass available content width to child media elements (excluding padding)
                '--block-max-width': `${width}px`, // This will be overridden by rich blocks with proper padding calculation
                '--block-content-width': `${width}px`,
                // CSS containment to prevent media overflow
                contain: 'layout style',
              } as React.CSSProperties}
            >
              {children}
            </div>
          ) : (
            children
          )}
        </div>

        {/* 🎯 CONDITIONAL RESIZE HANDLES: Only show in interactive mode */}
        {!readOnly && showResizeHandles && (selected || (isBlockHovered && !isDragging && !isResizing && !hasContentSelection)) && (
          <SimpleResizeHandles
            width={width}
            height={height}
            x={x}
            y={y}
            resizeHandlers={resizeHandlers}
            isActive={isActive}
            onHandleHover={handleHandleHover}
            // 🎯 HOVER OPACITY: 70% opacity when only hovering, 100% when selected
            opacity={selected ? 1.0 : 0.7}
          />
        )}


        {/* 🎯 CONDITIONAL DRAG HANDLE: Only show in interactive mode */}
        {!readOnly && showDragHandle && (isActive || (isBlockHovered && !isDragging && !isResizing && !hasContentSelection)) && (
          <div 
            className={cn(
              "absolute top-2 right-2 w-8 h-8 rounded-md cursor-grab z-30 flex items-center justify-center",
              "bg-primary/10 border border-primary/20 shadow-sm transition-all duration-200",
              // 🎯 HOVER OPACITY: Different opacity levels for selected vs hovered
              isActive ? "opacity-100" : "opacity-70",
              "hover:opacity-100 hover:scale-105 hover:bg-primary/20",
              "active:scale-95 active:bg-primary/30",
              isDragging && "bg-primary/30 scale-95"
            )}
            onMouseDown={handleDragStart}
            title="Drag to move block"
          >
            <Move className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors duration-200" />
          </div>
        )}

        {/* 🎯 CONDITIONAL SELECTION INDICATOR: Only show in interactive mode */}
        {!readOnly && isActive && (
          <div className="absolute -top-7 left-0 flex gap-2 text-xs z-20">
            <div
              className={cn(
                'px-3 py-1.5 rounded-md shadow-sm font-medium border border-white/20 backdrop-blur-sm',
                isResizing
                  ? 'bg-green-600/90 text-white shadow-green-500/25'
                  : isDragging
                    ? 'bg-blue-600/90 text-white shadow-blue-500/25'
                    : 'bg-primary/90 text-primary-foreground shadow-primary/25'
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
                'px-3 py-1.5 rounded-md shadow-sm font-mono text-xs border border-white/20 backdrop-blur-sm',
                isResizing 
                  ? 'bg-green-700/90 text-white shadow-green-500/25' 
                  : 'bg-slate-800/90 text-white shadow-slate-800/25'
              )}
            >
              {Math.round(width)} × {Math.round(height)}px
            </div>
            {hoverHandle && !isResizing && (
              <div className="px-3 py-1.5 rounded-md shadow-sm font-medium text-xs border border-white/20 backdrop-blur-sm bg-blue-600/90 text-white shadow-blue-500/25">
                {hoverHandle} handle
              </div>
            )}
          </div>
        )}

        {/* Snap lines overlay - only show during resize */}
        {isResizing && (
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
