// ABOUTME: Architectural redesign of WYSIWYG resize system with position feedback loop prevention

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { BlockPosition } from '@/types/editor';
import { debounce } from 'lodash-es';

// Canvas configuration
const CANVAS_CONFIG = {
  width: 800,
  minZoom: 0.5,
  maxZoom: 2.0,
  snapTolerance: 10,
  gridColumns: 12,
  minWidth: 50,
  minHeight: 30,
};

// Resize handle types
type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

// Resize state interface
interface ResizeState {
  isActive: boolean;
  handle: ResizeHandle | null;
  startMousePosition: { x: number; y: number };
  startBlockPosition: BlockPosition; // CRITICAL: Use start position, not current
  startBlockSize: { width: number; height: number };
}

// Constraint application order
enum ConstraintOrder {
  SIZE_MINIMUMS = 1,
  POSITION_BOUNDS = 2,
  CANVAS_BOUNDS = 3,
  GRID_SNAPPING = 4,
}

// Resize calculation result
interface ResizeCalculation {
  position: BlockPosition;
  constraintsApplied: ConstraintOrder[];
  snapApplied: boolean;
}

/**
 * Core resize calculation engine with proper constraint ordering
 */
class ResizeCalculator {
  private config = CANVAS_CONFIG;

  calculateResize(
    resizeState: ResizeState,
    currentMousePosition: { x: number; y: number },
    zoom: number
  ): ResizeCalculation {
    const { handle, startMousePosition, startBlockPosition, startBlockSize } = resizeState;

    // Calculate scaled mouse delta
    const deltaX = (currentMousePosition.x - startMousePosition.x) / zoom;
    const deltaY = (currentMousePosition.y - startMousePosition.y) / zoom;

    // Calculate raw new dimensions and position
    const rawCalculation = this.calculateRawResize(
      handle!,
      startBlockPosition,
      startBlockSize,
      deltaX,
      deltaY
    );

    // Apply constraints in strict order
    const constraintsApplied: ConstraintOrder[] = [];
    let result = rawCalculation;

    // 1. SIZE_MINIMUMS - Enforce minimum dimensions first
    result = this.applySizeConstraints(result, constraintsApplied);

    // 2. POSITION_BOUNDS - Ensure position is within canvas
    result = this.applyPositionConstraints(result, constraintsApplied);

    // 3. CANVAS_BOUNDS - Ensure block doesn't exceed canvas
    result = this.applyCanvasConstraints(result, constraintsApplied);

    // 4. GRID_SNAPPING - Apply snapping last to avoid conflicts
    const snapResult = this.applyGridSnapping(result);

    return {
      position: snapResult.position,
      constraintsApplied,
      snapApplied: snapResult.snapApplied,
    };
  }

  private calculateRawResize(
    handle: ResizeHandle,
    startPosition: BlockPosition,
    startSize: { width: number; height: number },
    deltaX: number,
    deltaY: number
  ): BlockPosition {
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    let newX = startPosition.x;
    let newY = startPosition.y;

    // Calculate new dimensions based on handle type
    switch (handle) {
      case 'se': // Southeast (bottom-right)
        newWidth = startSize.width + deltaX;
        newHeight = startSize.height + deltaY;
        break;
      case 'sw': // Southwest (bottom-left)
        newWidth = startSize.width - deltaX;
        newHeight = startSize.height + deltaY;
        newX = startPosition.x + deltaX;
        break;
      case 'ne': // Northeast (top-right)
        newWidth = startSize.width + deltaX;
        newHeight = startSize.height - deltaY;
        newY = startPosition.y + deltaY;
        break;
      case 'nw': // Northwest (top-left)
        newWidth = startSize.width - deltaX;
        newHeight = startSize.height - deltaY;
        newX = startPosition.x + deltaX;
        newY = startPosition.y + deltaY;
        break;
      case 'n': // North (top)
        newHeight = startSize.height - deltaY;
        newY = startPosition.y + deltaY;
        break;
      case 's': // South (bottom)
        newHeight = startSize.height + deltaY;
        break;
      case 'e': // East (right)
        newWidth = startSize.width + deltaX;
        break;
      case 'w': // West (left)
        newWidth = startSize.width - deltaX;
        newX = startPosition.x + deltaX;
        break;
    }

    return {
      id: startPosition.id,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      zIndex: startPosition.zIndex,
    };
  }

  private applySizeConstraints(
    position: BlockPosition,
    constraintsApplied: ConstraintOrder[]
  ): BlockPosition {
    const adjustedWidth = Math.max(this.config.minWidth, position.width);
    const adjustedHeight = Math.max(this.config.minHeight, position.height);

    // Adjust position if size was constrained
    let adjustedX = position.x;
    let adjustedY = position.y;

    // If width was constrained, adjust X position accordingly
    if (adjustedWidth !== position.width) {
      const widthDiff = adjustedWidth - position.width;
      // For handles that affect left edge, adjust X position
      if (position.x !== position.x) {
        // This will be set by handle logic
        adjustedX = position.x - widthDiff;
      }
    }

    // If height was constrained, adjust Y position accordingly
    if (adjustedHeight !== position.height) {
      const heightDiff = adjustedHeight - position.height;
      // For handles that affect top edge, adjust Y position
      if (position.y !== position.y) {
        // This will be set by handle logic
        adjustedY = position.y - heightDiff;
      }
    }

    if (adjustedWidth !== position.width || adjustedHeight !== position.height) {
      constraintsApplied.push(ConstraintOrder.SIZE_MINIMUMS);
    }

    return {
      ...position,
      x: adjustedX,
      y: adjustedY,
      width: adjustedWidth,
      height: adjustedHeight,
    };
  }

  private applyPositionConstraints(
    position: BlockPosition,
    constraintsApplied: ConstraintOrder[]
  ): BlockPosition {
    const adjustedX = Math.max(0, position.x);
    const adjustedY = Math.max(0, position.y);

    if (adjustedX !== position.x || adjustedY !== position.y) {
      constraintsApplied.push(ConstraintOrder.POSITION_BOUNDS);
    }

    return {
      ...position,
      x: adjustedX,
      y: adjustedY,
    };
  }

  private applyCanvasConstraints(
    position: BlockPosition,
    constraintsApplied: ConstraintOrder[]
  ): BlockPosition {
    const maxX = this.config.width - position.width;
    const adjustedX = Math.min(position.x, maxX);

    // Adjust width if position constraint would make it exceed canvas
    let adjustedWidth = position.width;
    if (adjustedX + adjustedWidth > this.config.width) {
      adjustedWidth = this.config.width - adjustedX;
    }

    if (adjustedX !== position.x || adjustedWidth !== position.width) {
      constraintsApplied.push(ConstraintOrder.CANVAS_BOUNDS);
    }

    return {
      ...position,
      x: adjustedX,
      width: adjustedWidth,
    };
  }

  private applyGridSnapping(position: BlockPosition): {
    position: BlockPosition;
    snapApplied: boolean;
  } {
    const columnWidth = this.config.width / this.config.gridColumns;
    const snapX = Math.round(position.x / columnWidth) * columnWidth;
    const snapWidth = Math.round(position.width / columnWidth) * columnWidth;
    const snapY = Math.round(position.y / 20) * 20;
    const snapHeight = Math.round(position.height / 20) * 20;

    // Only snap if within tolerance
    const shouldSnapX = Math.abs(position.x - snapX) <= this.config.snapTolerance;
    const shouldSnapWidth = Math.abs(position.width - snapWidth) <= this.config.snapTolerance;
    const shouldSnapY = Math.abs(position.y - snapY) <= this.config.snapTolerance;
    const shouldSnapHeight = Math.abs(position.height - snapHeight) <= this.config.snapTolerance;

    const snapApplied = shouldSnapX || shouldSnapWidth || shouldSnapY || shouldSnapHeight;

    return {
      position: {
        ...position,
        x: shouldSnapX ? snapX : position.x,
        y: shouldSnapY ? snapY : position.y,
        width: shouldSnapWidth ? snapWidth : position.width,
        height: shouldSnapHeight ? snapHeight : position.height,
      },
      snapApplied,
    };
  }
}

/**
 * Enhanced resize system hook with proper state management
 */
export function useResizeSystem(
  blockPosition: BlockPosition,
  zoom: number,
  onPositionChange: (position: Partial<BlockPosition>) => void
) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isActive: false,
    handle: null,
    startMousePosition: { x: 0, y: 0 },
    startBlockPosition: blockPosition,
    startBlockSize: { width: 0, height: 0 },
  });

  const calculatorRef = useRef(new ResizeCalculator());
  const operationLockRef = useRef(false);

  // Debounced position update to prevent race conditions
  const debouncedUpdatePosition = useCallback(
    debounce((position: Partial<BlockPosition>) => {
      if (!operationLockRef.current) {
        onPositionChange(position);
      }
    }, 16), // 60fps
    [onPositionChange]
  );

  const startResize = useCallback(
    (handle: ResizeHandle, mousePosition: { x: number; y: number }) => {
      if (operationLockRef.current) return;

      operationLockRef.current = true;

      setResizeState({
        isActive: true,
        handle,
        startMousePosition: mousePosition,
        startBlockPosition: { ...blockPosition }, // CRITICAL: Snapshot start position
        startBlockSize: {
          width: blockPosition.width,
          height: blockPosition.height,
        },
      });

      // Release lock after state update
      setTimeout(() => {
        operationLockRef.current = false;
      }, 0);
    },
    [blockPosition]
  );

  const updateResize = useCallback(
    (mousePosition: { x: number; y: number }) => {
      if (!resizeState.isActive || operationLockRef.current) return;

      const calculation = calculatorRef.current.calculateResize(resizeState, mousePosition, zoom);

      debouncedUpdatePosition(calculation.position);
    },
    [resizeState, zoom, debouncedUpdatePosition]
  );

  const endResize = useCallback(() => {
    if (operationLockRef.current) return;

    setResizeState({
      isActive: false,
      handle: null,
      startMousePosition: { x: 0, y: 0 },
      startBlockPosition: blockPosition,
      startBlockSize: { width: 0, height: 0 },
    });

    // Cancel any pending debounced updates
    debouncedUpdatePosition.cancel();
  }, [blockPosition, debouncedUpdatePosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedUpdatePosition.cancel();
    };
  }, [debouncedUpdatePosition]);

  return {
    isResizing: resizeState.isActive,
    resizeHandle: resizeState.handle,
    startResize,
    updateResize,
    endResize,
  };
}

/**
 * Resize handle component with proper event handling
 */
interface ResizeHandleProps {
  handle: ResizeHandle;
  position: 'corner' | 'edge';
  onResizeStart: (handle: ResizeHandle, mousePosition: { x: number; y: number }) => void;
  className?: string;
  title?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  handle,
  position,
  onResizeStart,
  className = '',
  title,
}) => {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      onResizeStart(handle, { x: e.clientX, y: e.clientY });
    },
    [handle, onResizeStart]
  );

  const cursorClass = `cursor-${handle}-resize`;
  const sizeClass = position === 'corner' ? 'w-3 h-3' : 'w-2 h-3';

  return (
    <div
      className={`absolute bg-primary border-2 border-background rounded-full hover:bg-primary/80 transition-colors ${cursorClass} ${sizeClass} ${className}`}
      onMouseDown={handleMouseDown}
      title={title}
    />
  );
};

/**
 * Position classes for resize handles
 */
export const getResizeHandleClasses = (handle: ResizeHandle): string => {
  const positions = {
    nw: '-top-1 -left-1',
    n: '-top-1 left-1/2 transform -translate-x-1/2',
    ne: '-top-1 -right-1',
    w: '-left-1 top-1/2 transform -translate-y-1/2',
    e: '-right-1 top-1/2 transform -translate-y-1/2',
    sw: '-bottom-1 -left-1',
    s: '-bottom-1 left-1/2 transform -translate-x-1/2',
    se: '-bottom-1 -right-1',
  };

  return positions[handle];
};
