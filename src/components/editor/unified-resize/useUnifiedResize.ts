// ABOUTME: Integration hook that connects UnifiedResizeController to existing components

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { BlockPosition } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { UnifiedResizeController, ResizeHandle, MousePosition, ContentAwareMinimums } from './UnifiedResizeController';

export interface UseUnifiedResizeOptions {
  nodeId: string;
  currentPosition: BlockPosition;
  contentAwareMinimums?: ContentAwareMinimums;
  maxDimensions?: { width: number; height: number };
  zoom?: number;
  onResize?: (update: { width: number; height: number }) => void;
  onMove?: (update: { x: number; y: number }) => void;
}

export interface UnifiedResizeHandlers {
  // Core resize operations
  startResize: (handle: ResizeHandle, mousePosition: MousePosition) => boolean;
  updateResize: (mousePosition: MousePosition) => void;
  endResize: () => void;
  
  // Inspector integration
  adjustHeightToContent: () => number;
  setDimensions: (width: number, height: number) => void;
  
  // State
  isResizing: boolean;
  
  // Performance monitoring
  getPerformanceMetrics: () => any;
  enableHighPerformanceMode: () => void;
}

/**
 * Unified resize integration hook
 * Replaces both useResizeSystem and embedded ResizeHandles logic
 */
export function useUnifiedResize(options: UseUnifiedResizeOptions): UnifiedResizeHandlers {
  const {
    nodeId,
    currentPosition,
    contentAwareMinimums,
    maxDimensions,
    zoom = 1,
    onResize,
    onMove,
  } = options;

  const { updateNodePosition } = useEditorStore();
  const controllerRef = useRef<UnifiedResizeController | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Create controller instance
  const controller = useMemo(() => {
    const handleUpdate = (updatedNodeId: string, position: Partial<BlockPosition>) => {
      // Update store immediately for responsive feedback
      updateNodePosition(updatedNodeId, position);
      
      // Notify parent components of specific changes
      if (position.width !== undefined || position.height !== undefined) {
        onResize?.({
          width: position.width ?? currentPosition.width,
          height: position.height ?? currentPosition.height,
        });
      }
      
      if (position.x !== undefined || position.y !== undefined) {
        onMove?.({
          x: position.x ?? currentPosition.x,
          y: position.y ?? currentPosition.y,
        });
      }
    };

    const newController = new UnifiedResizeController(nodeId, currentPosition, {
      contentAwareMinimums,
      maxDimensions,
      zoom,
      onUpdate: handleUpdate,
    });

    controllerRef.current = newController;
    return newController;
  }, [nodeId, updateNodePosition, onResize, onMove]); // Include callback dependencies

  // Update controller when position changes
  useEffect(() => {
    if (controller) {
      // Update internal position tracking without triggering updates
      controller.updatePosition(currentPosition);
    }
  }, [controller, currentPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, []);

  // Core resize handlers
  const startResize = useCallback((handle: ResizeHandle, mousePosition: MousePosition): boolean => {
    if (!controller) return false;
    
    const success = controller.startResize(handle, mousePosition);
    if (success) {
      setIsResizing(true);
    }
    return success;
  }, [controller]);

  const updateResize = useCallback((mousePosition: MousePosition) => {
    if (!controller || !isResizing) return;
    controller.updateResize(mousePosition);
  }, [controller, isResizing]);

  const endResize = useCallback(() => {
    if (!controller) return;
    controller.endResize();
    setIsResizing(false);
  }, [controller]);

  // Inspector integration handlers
  const adjustHeightToContent = useCallback((): number => {
    if (!controller) return currentPosition.height;
    return controller.adjustHeightToContent();
  }, [controller, currentPosition.height]);

  const setDimensions = useCallback((width: number, height: number) => {
    if (!controller) return;
    controller.setDimensions(width, height);
  }, [controller]);

  // Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    if (!controller) return null;
    return controller.getResizeMetrics();
  }, [controller]);

  const enableHighPerformanceMode = useCallback(() => {
    if (!controller) return;
    controller.enableHighPerformanceMode();
  }, [controller]);

  return {
    startResize,
    updateResize,
    endResize,
    adjustHeightToContent,
    setDimensions,
    isResizing,
    getPerformanceMetrics,
    enableHighPerformanceMode,
  };
}

/**
 * Mouse event handlers for resize handles
 * Integrates with global mouse tracking for smooth operations
 */
export function useResizeHandleEvents(resizeHandlers: UnifiedResizeHandlers) {
  // Global mouse event handlers for smooth resize operations
  useEffect(() => {
    if (!resizeHandlers.isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      resizeHandlers.updateResize({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      resizeHandlers.endResize();
    };

    // Attach to document for global tracking
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeHandlers.isResizing, resizeHandlers.updateResize, resizeHandlers.endResize]);

  // Create handle-specific mouse down handler
  const createHandleMouseDown = useCallback(
    (handle: ResizeHandle) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const success = resizeHandlers.startResize(handle, { x: e.clientX, y: e.clientY });
      
      if (success) {
        // Enable high performance mode for continuous operations
        resizeHandlers.enableHighPerformanceMode();
      }
    },
    [resizeHandlers.startResize, resizeHandlers.enableHighPerformanceMode]
  );

  return {
    createHandleMouseDown,
  };
}

/**
 * Helper function to get resize handle cursor classes
 */
export function getResizeHandleCursor(handle: ResizeHandle): string {
  const cursorMap = {
    nw: 'cursor-nw-resize',
    n: 'cursor-n-resize', 
    ne: 'cursor-ne-resize',
    w: 'cursor-w-resize',
    e: 'cursor-e-resize',
    sw: 'cursor-sw-resize',
    s: 'cursor-s-resize',
    se: 'cursor-se-resize',
  };
  
  return cursorMap[handle];
}

/**
 * Helper function to get resize handle position classes
 */
export function getResizeHandlePosition(handle: ResizeHandle): string {
  const positionMap = {
    nw: '-top-1 -left-1',
    n: '-top-1 left-1/2 transform -translate-x-1/2',
    ne: '-top-1 -right-1', 
    w: '-left-1 top-1/2 transform -translate-y-1/2',
    e: '-right-1 top-1/2 transform -translate-y-1/2',
    sw: '-bottom-1 -left-1',
    s: '-bottom-1 left-1/2 transform -translate-x-1/2',
    se: '-bottom-1 -right-1',
  };
  
  return positionMap[handle];
}