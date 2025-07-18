// ABOUTME: WYSIWYG constrained 2D canvas with direct pixel positioning for review editing

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { debounce } from 'lodash-es';
import { useEditorStore } from '@/store/editorStore';
import { NodeObject } from '@/types/editor';
import { TextBlockNode } from './Nodes/TextBlockNode';
import { ImageBlockNode } from './Nodes/ImageBlockNode';
import { VideoEmbedBlockNode } from './Nodes/VideoEmbedBlockNode';
import { TableBlockNode } from './Nodes/TableBlockNode';
import { PollBlockNode } from './Nodes/PollBlockNode';
import { ReferenceBlockNode } from './Nodes/ReferenceBlockNode';
import { KeyTakeawayBlockNode } from './Nodes/KeyTakeawayBlockNode';
import { SeparatorBlockNode } from './Nodes/SeparatorBlockNode';
import { QuoteBlockNode } from './Nodes/QuoteBlockNode';
import { useEditorTheme } from '@/hooks/useEditorTheme';

// Canvas configuration constants
const CANVAS_CONFIG = {
  width: 800, // Fixed width matching final output
  gridColumns: 12, // 12-column grid for snapping
  minZoom: 0.5, // 50% zoom for overview
  maxZoom: 2.0, // 200% zoom for precision
  defaultZoom: 1.0, // 100% actual size
  snapTolerance: 10, // 10px snap tolerance
  minHeight: 600, // Minimum canvas height
};

// Position interface for direct pixel positioning
export interface BlockPosition {
  id: string;
  x: number; // Direct pixel X coordinate (0-800)
  y: number; // Direct pixel Y coordinate
  width: number; // Block width in pixels
  height: number; // Block height in pixels
  zIndex?: number; // Stacking order for overlapping blocks
}

// Grid snapping utility
const snapToGrid = (
  x: number,
  y: number,
  tolerance: number = CANVAS_CONFIG.snapTolerance
): { x: number; y: number } => {
  const columnWidth = CANVAS_CONFIG.width / CANVAS_CONFIG.gridColumns;
  const snapX = Math.round(x / columnWidth) * columnWidth;
  const snapY = Math.round(y / 20) * 20; // 20px vertical grid

  // Only snap if within tolerance
  const shouldSnapX = Math.abs(x - snapX) <= tolerance;
  const shouldSnapY = Math.abs(y - snapY) <= tolerance;

  return {
    x: shouldSnapX ? snapX : x,
    y: shouldSnapY ? snapY : y,
  };
};

// Find available position for new blocks to avoid overlaps
const findAvailablePosition = (existingPositions: BlockPosition[]): BlockPosition => {
  const defaultWidth = CANVAS_CONFIG.width / 2; // Half canvas width
  const defaultHeight = 120;
  let y = 50; // Start 50px from top

  // Find first available Y position
  while (true) {
    const hasOverlap = existingPositions.some(
      pos =>
        y < pos.y + pos.height &&
        y + defaultHeight > pos.y &&
        50 < pos.x + pos.width &&
        50 + defaultWidth > pos.x
    );

    if (!hasOverlap) break;
    y += defaultHeight + 20; // Move down with spacing
  }

  return {
    id: '', // Will be set by caller
    x: 50,
    y,
    width: defaultWidth,
    height: defaultHeight,
  };
};

// Individual draggable block component
interface DraggableBlockProps {
  node: NodeObject;
  position: BlockPosition;
  isSelected: boolean;
  zoom: number;
  onPositionChange: (position: Partial<BlockPosition>) => void;
  onSelect: () => void;
}

function DraggableBlock({
  node,
  position,
  isSelected,
  zoom,
  onPositionChange,
  onSelect,
}: DraggableBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<
    'se' | 'sw' | 'ne' | 'nw' | 'n' | 's' | 'e' | 'w' | null
  >(null);
  const [resizeStartPosition, setResizeStartPosition] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [resizeStartMouse, setResizeStartMouse] = useState({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);

  // PERFORMANCE IMPROVEMENT: Operation locking to prevent concurrent operations
  const operationLockRef = useRef(false);

  // PERFORMANCE IMPROVEMENT: Debounced position updates (16ms = 60fps)
  // CRITICAL FIX: Remove operation lock check from debounced function
  const debouncedPositionUpdate = useCallback(
    debounce((update: Partial<BlockPosition>) => {
      onPositionChange(update);
    }, 16),
    [onPositionChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || isResizing) return; // Only left click, prevent concurrent ops

      e.preventDefault();
      e.stopPropagation();

      operationLockRef.current = true;
      onSelect();
      setIsDragging(true);

      const rect = blockRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [onSelect]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const canvas = document.querySelector('.wysiwyg-canvas') as HTMLElement;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
      const newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;

      // Apply constraints
      const constrainedX = Math.max(0, Math.min(CANVAS_CONFIG.width - position.width, newX));
      const constrainedY = Math.max(0, newY);

      // Apply grid snapping
      const snapped = snapToGrid(constrainedX, constrainedY);

      debouncedPositionUpdate({
        x: snapped.x,
        y: snapped.y,
      });
    },
    [isDragging, dragOffset, zoom, position.width, debouncedPositionUpdate]
  );

  const handleMouseUp = useCallback(() => {
    operationLockRef.current = false; // RELEASE OPERATION LOCK
    setIsDragging(false);
    setIsResizing(false);
    setResizeType(null);
  }, []);

  // SAFETY MECHANISM: Auto-release lock after timeout
  React.useEffect(() => {
    if (operationLockRef.current) {
      const timeout = setTimeout(() => {
        operationLockRef.current = false;
      }, 5000); // 5 second safety timeout

      return () => clearTimeout(timeout);
    }
  }, [isDragging, isResizing]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, type: 'se' | 'sw' | 'ne' | 'nw' | 'n' | 's' | 'e' | 'w') => {
      if (operationLockRef.current || isDragging) return; // PREVENT CONCURRENT OPERATIONS

      e.preventDefault();
      e.stopPropagation();

      operationLockRef.current = true;
      onSelect();
      setIsResizing(true);
      setResizeType(type);
      // CRITICAL FIX: Capture block position AND mouse position at start
      setResizeStartPosition({ x: position.x, y: position.y });
      setResizeStartSize({ width: position.width, height: position.height });
      setResizeStartMouse({ x: e.clientX, y: e.clientY });
    },
    [onSelect, position.x, position.y, position.width, position.height, isDragging]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeType) return;

      const deltaX = e.clientX - resizeStartMouse.x;
      const deltaY = e.clientY - resizeStartMouse.y;

      // Apply zoom scaling
      const scaledDeltaX = deltaX / zoom;
      const scaledDeltaY = deltaY / zoom;

      // Calculate new dimensions and position based on resize type
      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;
      let newX = resizeStartPosition.x;
      let newY = resizeStartPosition.y;

      // Minimum size constraints
      const minWidth = 50;
      const minHeight = 30;

      switch (resizeType) {
        case 'se': // Southeast (bottom-right)
          newWidth = Math.max(minWidth, resizeStartSize.width + scaledDeltaX);
          newHeight = Math.max(minHeight, resizeStartSize.height + scaledDeltaY);
          break;
        case 'sw': // Southwest (bottom-left)
          newWidth = Math.max(minWidth, resizeStartSize.width - scaledDeltaX);
          newHeight = Math.max(minHeight, resizeStartSize.height + scaledDeltaY);
          newX = resizeStartPosition.x + (resizeStartSize.width - newWidth);
          break;
        case 'ne': // Northeast (top-right)
          newWidth = Math.max(minWidth, resizeStartSize.width + scaledDeltaX);
          newHeight = Math.max(minHeight, resizeStartSize.height - scaledDeltaY);
          newY = resizeStartPosition.y + (resizeStartSize.height - newHeight);
          break;
        case 'nw': // Northwest (top-left)
          newWidth = Math.max(minWidth, resizeStartSize.width - scaledDeltaX);
          newHeight = Math.max(minHeight, resizeStartSize.height - scaledDeltaY);
          newX = resizeStartPosition.x + (resizeStartSize.width - newWidth);
          newY = resizeStartPosition.y + (resizeStartSize.height - newHeight);
          break;
        case 'n': // North (top)
          newHeight = Math.max(minHeight, resizeStartSize.height - scaledDeltaY);
          newY = resizeStartPosition.y + (resizeStartSize.height - newHeight);
          break;
        case 's': // South (bottom)
          newHeight = Math.max(minHeight, resizeStartSize.height + scaledDeltaY);
          break;
        case 'e': // East (right)
          newWidth = Math.max(minWidth, resizeStartSize.width + scaledDeltaX);
          break;
        case 'w': // West (left)
          newWidth = Math.max(minWidth, resizeStartSize.width - scaledDeltaX);
          newX = resizeStartPosition.x + (resizeStartSize.width - newWidth);
          break;
      }

      // Apply canvas constraints
      const maxWidth = CANVAS_CONFIG.width - newX;
      newWidth = Math.min(newWidth, maxWidth);

      // Apply position constraints
      newX = Math.max(0, Math.min(CANVAS_CONFIG.width - newWidth, newX));
      newY = Math.max(0, newY);

      // Apply grid snapping for size (optional)
      const columnWidth = CANVAS_CONFIG.width / CANVAS_CONFIG.gridColumns;
      const snappedWidth = Math.round(newWidth / columnWidth) * columnWidth;
      const snappedHeight = Math.round(newHeight / 20) * 20;

      // Only snap if close to grid
      const shouldSnapWidth = Math.abs(newWidth - snappedWidth) <= CANVAS_CONFIG.snapTolerance;
      const shouldSnapHeight = Math.abs(newHeight - snappedHeight) <= CANVAS_CONFIG.snapTolerance;

      debouncedPositionUpdate({
        x: newX,
        y: newY,
        width: shouldSnapWidth ? snappedWidth : newWidth,
        height: shouldSnapHeight ? snappedHeight : newHeight,
      });
    },
    [
      isResizing,
      resizeType,
      resizeStartPosition,
      resizeStartSize,
      resizeStartMouse,
      zoom,
      debouncedPositionUpdate,
    ]
  );

  // Add global mouse event listeners when dragging or resizing
  React.useEffect(() => {
    if (isDragging || isResizing) {
      const mouseMoveHandler = isDragging ? handleMouseMove : handleResizeMove;
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleResizeMove, handleMouseUp]);

  // PERFORMANCE IMPROVEMENT: Cleanup debounced function on unmount
  React.useEffect(() => {
    return () => {
      debouncedPositionUpdate.cancel();
    };
  }, [debouncedPositionUpdate]);

  // Render the appropriate block component
  const renderBlockContent = () => {
    const commonProps = {
      id: node.id,
      data: node.data,
      selected: isSelected,
    };

    switch (node.type) {
      case 'textBlock':
        return <TextBlockNode {...commonProps} />;
      case 'imageBlock':
        return <ImageBlockNode {...commonProps} />;
      case 'videoEmbedBlock':
        return <VideoEmbedBlockNode {...commonProps} />;
      case 'tableBlock':
        return <TableBlockNode {...commonProps} />;
      case 'pollBlock':
        return <PollBlockNode {...commonProps} />;
      case 'referenceBlock':
        return <ReferenceBlockNode {...commonProps} />;
      case 'keyTakeawayBlock':
        return <KeyTakeawayBlockNode {...commonProps} />;
      case 'separatorBlock':
        return <SeparatorBlockNode {...commonProps} />;
      case 'quoteBlock':
        return <QuoteBlockNode {...commonProps} />;
      default:
        return (
          <div className="p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded">
            <p className="text-muted-foreground text-center">{node.type} block</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={blockRef}
      className={`absolute transition-all ${
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary z-10'
          : 'hover:bg-accent/50 border-border'
      } ${isDragging || isResizing ? 'opacity-75 z-20' : ''} ${
        isResizing ? 'cursor-grabbing' : 'cursor-move'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        zIndex: position.zIndex || (isSelected ? 10 : 1),
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Status indicator when selected */}
      {isSelected && (
        <div className="absolute -top-8 left-0 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
          {isResizing ? 'Resizing...' : 'Drag to move'}
        </div>
      )}

      {/* Resize handles when selected */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-primary border-2 border-background rounded-full cursor-nw-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 'nw')}
            title="Resize northwest"
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary border-2 border-background rounded-full cursor-ne-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 'ne')}
            title="Resize northeast"
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border-2 border-background rounded-full cursor-sw-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 'sw')}
            title="Resize southwest"
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border-2 border-background rounded-full cursor-se-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 'se')}
            title="Resize southeast"
          />

          {/* Edge handles */}
          <div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-primary border-2 border-background rounded-full cursor-n-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 'n')}
            title="Resize north"
          />
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-primary border-2 border-background rounded-full cursor-s-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 's')}
            title="Resize south"
          />
          <div
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-2 bg-primary border-2 border-background rounded-full cursor-w-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 'w')}
            title="Resize west"
          />
          <div
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-2 bg-primary border-2 border-background rounded-full cursor-e-resize hover:bg-primary/80 transition-colors"
            onMouseDown={e => handleResizeStart(e, 'e')}
            title="Resize east"
          />
        </>
      )}

      {/* Block content */}
      <div className="w-full h-full border rounded-lg bg-background">{renderBlockContent()}</div>
    </div>
  );
}

// Main WYSIWYG Canvas component
export function WYSIWYGCanvas() {
  const {
    nodes: editorNodes,
    positions: storePositions,
    selectedNodeId,
    canvasZoom,
    selectNode,
    addNode,
    updateNodePosition,
    initializeNodePosition,
    updateCanvasZoom,
  } = useEditorStore();

  const { colors } = useEditorTheme();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Set up drop zone for new blocks from palette
  const { isOver, setNodeRef } = useDroppable({
    id: 'wysiwyg-canvas',
  });

  // Calculate canvas height based on content
  const canvasHeight = useMemo(() => {
    const maxY = Math.max(
      CANVAS_CONFIG.minHeight,
      ...Object.values(storePositions).map(pos => pos.y + pos.height + 50)
    );
    return maxY;
  }, [storePositions]);

  // Initialize positions for new nodes
  React.useEffect(() => {
    editorNodes.forEach(node => {
      if (!storePositions[node.id]) {
        initializeNodePosition(node.id);
      }
    });
  }, [editorNodes, storePositions, initializeNodePosition]);

  // Handle block position updates
  const handlePositionChange = useCallback(
    (nodeId: string, positionUpdate: Partial<BlockPosition>) => {
      updateNodePosition(nodeId, positionUpdate);
    },
    [updateNodePosition]
  );

  // Handle canvas click (deselect blocks)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        selectNode(null);
      }
    },
    [selectNode]
  );

  return (
    <div className="flex-1 relative bg-gray-50 overflow-auto min-h-0">
      {/* Canvas container with zoom */}
      <div
        className="flex justify-center pt-8 pb-8 px-8"
        style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'top center' }}
      >
        <div
          ref={setNodeRef}
          className={`wysiwyg-canvas relative border-2 rounded-lg shadow-lg ${
            isOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          style={{
            width: CANVAS_CONFIG.width,
            height: canvasHeight,
            backgroundColor: colors.canvas || 'hsl(var(--background))',
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid overlay for alignment */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent ${CANVAS_CONFIG.width / CANVAS_CONFIG.gridColumns - 1}px,
                  ${colors.grid || 'hsl(var(--border))'} ${CANVAS_CONFIG.width / CANVAS_CONFIG.gridColumns}px
                ),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 19px,
                  ${colors.grid || 'hsl(var(--border))'} 20px
                )
              `,
            }}
          />

          {/* Drop zone overlay */}
          {isOver && (
            <div className="absolute inset-4 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
              <p className="text-primary font-medium">Drop block here</p>
            </div>
          )}

          {/* Render blocks */}
          {editorNodes.map(node => {
            const position = storePositions[node.id];
            if (!position) return null;

            return (
              <DraggableBlock
                key={node.id}
                node={node}
                position={position}
                isSelected={selectedNodeId === node.id}
                zoom={canvasZoom}
                onPositionChange={update => handlePositionChange(node.id, update)}
                onSelect={() => selectNode(node.id)}
              />
            );
          })}

          {/* Empty state */}
          {editorNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2 text-muted-foreground">
                  Start Creating Your Review
                </h3>
                <p className="text-sm text-muted-foreground/80">
                  Drag blocks from the palette to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
