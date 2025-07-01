// ABOUTME: Hook for managing drag-and-drop reordering of blocks with visual feedback and snap-to-grid functionality

import { useState, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { NodeObject, LayoutItem } from '@/types/editor';
import { ensureMasterDerivedLayouts, getLayoutForViewport } from '@/store/layoutUtils';

interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  draggedPosition: { x: number; y: number } | null;
  dropZonePosition: number | null; // Insert position in the logical sequence
  hoveredNodeId: string | null;
}

interface DropZone {
  id: string;
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'before' | 'after' | 'between';
}

export function useDragDropReordering() {
  const {
    nodes,
    layouts,
    currentViewport,
    updateLayout,
    selectNode,
    pushToHistory
  } = useEditorStore();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNodeId: null,
    draggedPosition: null,
    dropZonePosition: null,
    hoveredNodeId: null
  });

  // Get current layout items sorted by logical order (top to bottom, left to right)
  const sortedLayoutItems = useMemo(() => {
    try {
      const masterDerivedLayouts = ensureMasterDerivedLayouts(layouts);
      const currentLayout = getLayoutForViewport(masterDerivedLayouts, currentViewport);
      
      if (!currentLayout?.items) {
        return [];
      }
      
      return currentLayout.items.slice().sort((a, b) => {
        // Primary sort by Y position, secondary by X position
        if (Math.abs(a.y - b.y) < 50) { // Same row (within 50px tolerance)
          return a.x - b.x;
        }
        return a.y - b.y;
      });
    } catch (error) {
      console.error('[useDragDropReordering] Error accessing layout items:', error);
      return [];
    }
  }, [layouts, currentViewport]);

  // Calculate drop zones between blocks
  const dropZones = useMemo(() => {
    const zones: DropZone[] = [];
    const gridGap = 24; // Standard grid gap
    const dropZoneHeight = 40;

    // Add a drop zone before the first item
    if (sortedLayoutItems.length > 0) {
      const firstItem = sortedLayoutItems[0];
      zones.push({
        id: `before-${firstItem.nodeId}`,
        position: 0,
        x: firstItem.x,
        y: firstItem.y - dropZoneHeight - gridGap,
        width: firstItem.w * 100, // Approximate width
        height: dropZoneHeight,
        type: 'before'
      });
    }

    // Add drop zones between items
    for (let i = 0; i < sortedLayoutItems.length - 1; i++) {
      const currentItem = sortedLayoutItems[i];
      const nextItem = sortedLayoutItems[i + 1];
      
      zones.push({
        id: `between-${currentItem.nodeId}-${nextItem.nodeId}`,
        position: i + 1,
        x: Math.min(currentItem.x, nextItem.x),
        y: currentItem.y + (currentItem.h * 80) + gridGap, // Approximate height
        width: Math.max(currentItem.w, nextItem.w) * 100,
        height: dropZoneHeight,
        type: 'between'
      });
    }

    // Add a drop zone after the last item
    if (sortedLayoutItems.length > 0) {
      const lastItem = sortedLayoutItems[sortedLayoutItems.length - 1];
      zones.push({
        id: `after-${lastItem.nodeId}`,
        position: sortedLayoutItems.length,
        x: lastItem.x,
        y: lastItem.y + (lastItem.h * 80) + gridGap,
        width: lastItem.w * 100,
        height: dropZoneHeight,
        type: 'after'
      });
    }

    return zones;
  }, [sortedLayoutItems]);

  // Start drag operation
  const startDrag = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      draggedNodeId: nodeId,
      draggedPosition: position,
      dropZonePosition: null,
      hoveredNodeId: null
    });
    selectNode(nodeId);
  }, [selectNode]);

  // Update drag position
  const updateDrag = useCallback((position: { x: number; y: number }) => {
    setDragState(prev => ({
      ...prev,
      draggedPosition: position
    }));
  }, []);

  // Handle hover over drop zones
  const handleDropZoneHover = useCallback((zoneId: string | null, position: number | null) => {
    setDragState(prev => ({
      ...prev,
      dropZonePosition: position,
      hoveredNodeId: zoneId
    }));
  }, []);

  // Handle drop operation
  const handleDrop = useCallback((targetPosition?: number) => {
    if (!dragState.isDragging || !dragState.draggedNodeId) return;

    const finalPosition = targetPosition ?? dragState.dropZonePosition;
    
    if (finalPosition !== null) {
      // Save current state for undo
      pushToHistory();

      // Get the dragged node's current position in the sorted order
      const draggedNodeIndex = sortedLayoutItems.findIndex(
        item => item.nodeId === dragState.draggedNodeId
      );

      if (draggedNodeIndex === -1) return;

      // Calculate new layout order
      const newSortedItems = [...sortedLayoutItems];
      const [draggedItem] = newSortedItems.splice(draggedNodeIndex, 1);

      // Adjust target position if dragging downward
      let adjustedPosition = finalPosition;
      if (draggedNodeIndex < finalPosition) {
        adjustedPosition = finalPosition - 1;
      }

      // Insert at new position
      newSortedItems.splice(adjustedPosition, 0, draggedItem);

      // Recalculate Y positions for all items
      const gridGap = 24;
      let currentY = 100; // Starting Y position

      newSortedItems.forEach((item, index) => {
        const newLayoutItem: LayoutItem = {
          ...item,
          y: currentY
        };

        updateLayout(item.nodeId, newLayoutItem, currentViewport);
        
        // Increment Y for next item (approximate block height + gap)
        currentY += 120 + gridGap;
      });
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedNodeId: null,
      draggedPosition: null,
      dropZonePosition: null,
      hoveredNodeId: null
    });
  }, [
    dragState.isDragging,
    dragState.draggedNodeId,
    dragState.dropZonePosition,
    sortedLayoutItems,
    updateLayout,
    currentViewport,
    pushToHistory
  ]);

  // Cancel drag operation
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedNodeId: null,
      draggedPosition: null,
      dropZonePosition: null,
      hoveredNodeId: null
    });
  }, []);

  // Snap to grid functionality
  const snapToGrid = useCallback((position: { x: number; y: number }, gridSize: number = 24) => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }, []);

  // Get visual feedback for drag operation
  const getDragFeedback = useCallback(() => {
    if (!dragState.isDragging) return null;

    return {
      draggedNodeId: dragState.draggedNodeId,
      dropZonePosition: dragState.dropZonePosition,
      hoveredNodeId: dragState.hoveredNodeId,
      isDragging: true
    };
  }, [dragState]);

  // Keyboard-based reordering
  const moveBlockUp = useCallback((nodeId: string) => {
    const currentIndex = sortedLayoutItems.findIndex(item => item.nodeId === nodeId);
    if (currentIndex <= 0) return;

    pushToHistory();
    handleDrop(currentIndex - 1);
  }, [sortedLayoutItems, pushToHistory, handleDrop]);

  const moveBlockDown = useCallback((nodeId: string) => {
    const currentIndex = sortedLayoutItems.findIndex(item => item.nodeId === nodeId);
    if (currentIndex >= sortedLayoutItems.length - 1) return;

    pushToHistory();
    handleDrop(currentIndex + 2); // +2 because we remove the item first
  }, [sortedLayoutItems, pushToHistory, handleDrop]);

  return {
    // State
    dragState,
    dropZones,
    sortedLayoutItems,

    // Actions
    startDrag,
    updateDrag,
    handleDrop,
    cancelDrag,
    handleDropZoneHover,
    snapToGrid,
    moveBlockUp,
    moveBlockDown,

    // Utilities
    getDragFeedback,
    isDragging: dragState.isDragging,
    draggedNodeId: dragState.draggedNodeId
  };
}