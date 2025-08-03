// ABOUTME: Simple resize integration hook without constraints or performance systems

import { useCallback, useRef, useEffect, useState } from 'react';
import { SimpleResizeController, ResizeHandle, MousePosition } from './SimpleResizeController';
import { controllerRegistry } from './ControllerRegistry';

export interface UseSimpleResizeOptions {
  nodeId: string;
  onUpdate: (position: { x?: number; y?: number; width?: number; height?: number }) => void;
}

export interface SimpleResizeHandlers {
  startResize: (handle: ResizeHandle, mousePosition: MousePosition, currentDimensions: any) => boolean;
  updateResize: (mousePosition: MousePosition) => void;
  endResize: () => void;
  isResizing: boolean;
}

/**
 * Simple resize integration hook
 * - No constraints or content-aware minimums
 * - No performance monitoring or metrics
 * - Direct state updates without debouncing
 * - Compatible with existing component interface
 */
export function useSimpleResize(options: UseSimpleResizeOptions): SimpleResizeHandlers {
  const { nodeId, onUpdate } = options;
  const controllerRef = useRef<SimpleResizeController | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Stable update callback that doesn't change between renders
  const stableOnUpdate = useCallback((controllerNodeId: string, position: any) => {
    onUpdate(position);
  }, [onUpdate]);

  // Get controller from registry (persistent across re-renders)
  useEffect(() => {
    controllerRef.current = controllerRegistry.getController(nodeId, stableOnUpdate);

    return () => {
      controllerRegistry.deactivateController(nodeId);
    };
  }, [nodeId, stableOnUpdate]);

  /**
   * Start resize operation - simple and direct
   */
  const startResize = useCallback((handle: ResizeHandle, mousePosition: MousePosition, currentDimensions: any) => {
    // Get fresh controller reference from registry if needed
    if (!controllerRef.current) {
      controllerRef.current = controllerRegistry.getController(nodeId, stableOnUpdate);
    }
    
    const success = controllerRef.current.startResize(handle, mousePosition, currentDimensions);
    
    if (success) {
      setIsResizing(true);
    }
    return success;
  }, [nodeId, isResizing, stableOnUpdate]);

  /**
   * Update resize operation - direct updates without performance optimization
   */
  const updateResize = useCallback((mousePosition: MousePosition) => {
    // Ensure we have a controller reference from registry
    if (!controllerRef.current) {
      controllerRef.current = controllerRegistry.getController(nodeId, stableOnUpdate);
    }
    
    controllerRef.current.updateResize(mousePosition);
  }, [nodeId, stableOnUpdate]);

  /**
   * End resize operation
   */
  const endResize = useCallback(() => {
    // Ensure we have a controller reference from registry
    if (!controllerRef.current) {
      controllerRef.current = controllerRegistry.getController(nodeId, stableOnUpdate);
    }
    
    controllerRef.current.endResize();
    setIsResizing(false);
  }, [nodeId, stableOnUpdate]);

  return {
    startResize,
    updateResize,
    endResize,
    isResizing,
  };
}