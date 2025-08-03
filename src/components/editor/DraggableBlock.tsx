// ABOUTME: Enhanced DraggableBlock with unified resize system (legacy compatibility layer)

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { NodeObject, BlockPosition } from '@/types/editor';
// Legacy resize system only for non-unified blocks
import { useResizeSystem, ResizeHandle, getResizeHandleClasses } from './ResizeSystem';

// Unified Rich Block node import
import { RichBlockNode } from './Nodes/RichBlockNode';

interface DraggableBlockProps {
  node: NodeObject;
  position: BlockPosition;
  isSelected: boolean;
  zoom: number;
  onPositionChange: (position: Partial<BlockPosition>) => void;
  onSelect: () => void;
}

/**
 * Enhanced DraggableBlock with unified resize system (legacy compatibility layer)
 */
export const DraggableBlock: React.FC<DraggableBlockProps> = ({
  node,
  position,
  isSelected,
  zoom,
  onPositionChange,
  onSelect,
}) => {
  // For richBlock, return UnifiedBlockWrapper directly to avoid dual resize systems
  if (node.type === 'richBlock') {
    return (
      <RichBlockNode
        id={node.id}
        data={node.data}
        selected={isSelected}
        width={position.width}
        height={position.height}
        x={position.x}
        y={position.y}
        onSelect={onSelect}
        onMove={onPositionChange}
        onResize={onPositionChange}
      />
    );
  }

  // Legacy block handling below (non-richBlock types only)
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const operationLockRef = useRef(false);

  // Initialize legacy resize system only for non-richBlock types
  const { isResizing, resizeHandle, startResize, updateResize, endResize } = useResizeSystem(
    position,
    zoom,
    onPositionChange
  );

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || isResizing || operationLockRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      onSelect();
      setIsDragging(true);
      operationLockRef.current = true;

      const rect = blockRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      setTimeout(() => {
        operationLockRef.current = false;
      }, 0);
    },
    [onSelect, isResizing]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (operationLockRef.current) return;

      if (isDragging) {
        const canvas = document.querySelector('.wysiwyg-canvas') as HTMLElement;
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
        const newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;

        // Apply constraints
        const constrainedX = Math.max(0, Math.min(800 - position.width, newX));
        const constrainedY = Math.max(0, newY);

        onPositionChange({
          x: constrainedX,
          y: constrainedY,
        });
      } else if (isResizing) {
        updateResize({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, isResizing, dragOffset, zoom, position.width, onPositionChange, updateResize]
  );

  const handleMouseUp = useCallback(() => {
    if (operationLockRef.current) return;

    setIsDragging(false);
    endResize();
  }, [endResize]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (handle: ResizeHandle, mousePosition: { x: number; y: number }) => {
      if (isDragging || operationLockRef.current) return;

      onSelect();
      startResize(handle, mousePosition);
    },
    [isDragging, onSelect, startResize]
  );

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Render legacy block content (richBlock handled at component start)
  const renderBlockContent = () => {
    return (
      <div className="p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded">
        <p className="text-muted-foreground text-center">{node.type} block</p>
      </div>
    );
  };

  // Status message
  const getStatusMessage = () => {
    if (isResizing) {
      return `Resizing ${resizeHandle}...`;
    }
    if (isDragging) {
      return 'Dragging...';
    }
    return 'Selected - drag to move';
  };

  // Legacy blocks use the original DraggableBlock container
  return (
    <div
      ref={blockRef}
      data-testid={`draggable-block-${node.id}`}
      className={`absolute transition-all ${
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary z-10'
          : 'hover:bg-accent/50 border-border'
      } ${isDragging || isResizing ? 'opacity-75 z-20' : ''} ${
        isResizing ? 'cursor-grabbing' : isDragging ? 'cursor-grabbing' : 'cursor-move'
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
      {/* Status indicator */}
      {isSelected && (
        <div className="absolute -top-8 left-0 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
          {getStatusMessage()}
        </div>
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <ResizeHandle
            handle="nw"
            position="corner"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('nw')}
            title="Resize northwest"
          />
          <ResizeHandle
            handle="ne"
            position="corner"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('ne')}
            title="Resize northeast"
          />
          <ResizeHandle
            handle="sw"
            position="corner"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('sw')}
            title="Resize southwest"
          />
          <ResizeHandle
            handle="se"
            position="corner"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('se')}
            title="Resize southeast"
          />

          {/* Edge handles */}
          <ResizeHandle
            handle="n"
            position="edge"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('n')}
            title="Resize north"
          />
          <ResizeHandle
            handle="s"
            position="edge"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('s')}
            title="Resize south"
          />
          <ResizeHandle
            handle="w"
            position="edge"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('w')}
            title="Resize west"
          />
          <ResizeHandle
            handle="e"
            position="edge"
            onResizeStart={handleResizeStart}
            className={getResizeHandleClasses('e')}
            title="Resize east"
          />
        </>
      )}

      {/* Block content */}
      <div className="w-full h-full overflow-hidden border rounded-lg bg-background">
        {renderBlockContent()}
      </div>
    </div>
  );
};
