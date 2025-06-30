// ABOUTME: Enhanced node wrapper with drag-and-drop reordering capabilities and visual feedback

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDragDropReordering } from '@/hooks/useDragDropReordering';
import { useEditorStore } from '@/store/editorStore';

interface DraggableNodeWrapperProps {
  nodeId: string;
  children: React.ReactNode;
  isSelected: boolean;
  className?: string;
}

export const DraggableNodeWrapper = React.memo(function DraggableNodeWrapper({
  nodeId,
  children,
  isSelected,
  className
}: DraggableNodeWrapperProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isDragHovered, setIsDragHovered] = useState(false);
  
  const {
    startDrag,
    updateDrag,
    handleDrop,
    cancelDrag,
    snapToGrid,
    moveBlockUp,
    moveBlockDown,
    isDragging,
    draggedNodeId
  } = useDragDropReordering();

  const { selectNode } = useEditorStore();

  const isBeingDragged = isDragging && draggedNodeId === nodeId;

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    if (!nodeRef.current) return;

    const rect = nodeRef.current.getBoundingClientRect();
    const startPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    startDrag(nodeId, startPosition);
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId);
    
    // Create a custom drag image
    const dragImage = nodeRef.current.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(3deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // Handle drag movement
  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore invalid drag events
    
    updateDrag({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    handleDrop();
  };

  // Handle click to select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(nodeId);
  };

  // Handle keyboard reordering
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSelected) return;

    if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault();
      moveBlockUp(nodeId);
    } else if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault();
      moveBlockDown(nodeId);
    }
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        'group relative transition-all duration-200',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isBeingDragged && 'opacity-50 scale-95',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Draggable block: ${nodeId}`}
    >
      {/* Drag handle */}
      {isSelected && (
        <div
          ref={dragHandleRef}
          className={cn(
            'absolute -left-12 top-1/2 -translate-y-1/2 z-10',
            'flex flex-col gap-1 opacity-0 group-hover:opacity-100',
            'transition-opacity duration-200'
          )}
        >
          {/* Drag grip */}
          <div
            draggable
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setIsDragHovered(true)}
            onMouseLeave={() => setIsDragHovered(false)}
            className={cn(
              'p-2 bg-background border rounded-lg cursor-grab active:cursor-grabbing',
              'hover:bg-accent transition-colors duration-200',
              'hover:scale-110 active:scale-95',
              isDragHovered && 'bg-accent border-primary'
            )}
            title="Drag to reorder"
          >
            <GripVertical size={16} className={cn(
              'text-muted-foreground',
              isDragHovered && 'text-primary'
            )} />
          </div>

          {/* Keyboard reorder buttons */}
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                moveBlockUp(nodeId);
              }}
              className="h-6 w-8 p-0"
              title="Move up (Alt + ↑)"
            >
              <MoveUp size={12} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                moveBlockDown(nodeId);
              }}
              className="h-6 w-8 p-0"
              title="Move down (Alt + ↓)"
            >
              <MoveDown size={12} />
            </Button>
          </div>
        </div>
      )}

      {/* Drop indicator when dragging over */}
      {isDragging && !isBeingDragged && (
        <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none" />
      )}

      {/* Content */}
      <div className={cn(
        'transition-all duration-200',
        isBeingDragged && 'pointer-events-none'
      )}>
        {children}
      </div>

      {/* Visual feedback for drag state */}
      {isBeingDragged && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
          Moving...
        </div>
      )}
    </div>
  );
});

// HOC to wrap any node component with drag-and-drop functionality
// eslint-disable-next-line react-refresh/only-export-components
export function withDragAndDrop<T extends { id: string; selected?: boolean }>(
  Component: React.ComponentType<T>
) {
  return React.memo(function DraggableComponent(props: T) {
    return (
      <DraggableNodeWrapper
        nodeId={props.id}
        isSelected={props.selected || false}
      >
        <Component {...props} />
      </DraggableNodeWrapper>
    );
  });
}