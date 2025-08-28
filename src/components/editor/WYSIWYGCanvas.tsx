// ABOUTME: WYSIWYG constrained 2D canvas with direct pixel positioning for review editing

import React, { useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditorStore, useEditorActions, useCanvasState } from '@/store/editorStore';
import { DraggableBlock } from './DraggableBlock';
import { useEditorTheme } from '../../hooks/useEditorTheme';
import { BlockPosition } from '@/types/editor';
import { PositionDataValidator } from '@/utils/positionDataValidator';

// Canvas configuration constants - Dual viewport support
const CANVAS_CONFIG = {
  desktop: {
    width: 800, // Fixed width matching final output
    gridColumns: 12, // 12-column grid for snapping
    minHeight: 400, // Reduced minimum for content-adaptive sizing (was 600)
  },
  mobile: {
    width: 375, // Mobile viewport width (iPhone standard)
    gridColumns: 1, // Single column for mobile
    minHeight: 300, // 🎯 MOBILE HEIGHT FIX: Reduced from 500px to match ReadOnlyCanvas
  },
  minZoom: 0.5, // 50% zoom for overview
  maxZoom: 2.0, // 200% zoom for precision
  defaultZoom: 1.0, // 100% actual size
  snapTolerance: 10, // 10px snap tolerance
};

// Main WYSIWYG Canvas component
export function WYSIWYGCanvas() {
  const {
    nodes: editorNodes,
    positions: storePositions,
    selectedNodeId,
    canvasZoom,
    addNode,
    updateNodePosition,
    initializeNodePosition,
    updateCanvasZoom,
    currentViewport,
    mobilePositions,
  } = useEditorStore();

  // Use unified selection system instead of legacy selectNode
  const { clearAllSelection, activateBlock, updateCurrentViewportPosition } = useEditorActions();

  const { colors } = useEditorTheme();
  const { canvasBackgroundColor, showGrid } = useCanvasState();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Select appropriate positions and config based on current viewport
  const currentCanvasConfig = CANVAS_CONFIG[currentViewport];
  const currentPositions = currentViewport === 'mobile' ? mobilePositions : storePositions;

  // Set up drop zone for new blocks from palette
  const { isOver, setNodeRef } = useDroppable({
    id: 'wysiwyg-canvas',
  });

  // Calculate canvas height - Simple approach: find lowest content bottom + margin
  const canvasHeight = useMemo(() => {
    // Only remove phantom positions (nodes that don't exist), keep all valid positions regardless of Y coordinate
    const validator = new PositionDataValidator();
    const phantomIds = validator.detectPhantomPositions(currentPositions, editorNodes);
    
    // Remove only phantom positions, keep everything else
    const validPositions = Object.fromEntries(
      Object.entries(currentPositions).filter(([id]) => !phantomIds.includes(id))
    );
    
    const positionsArray = Object.values(validPositions);
    
    if (positionsArray.length === 0) {
      return currentCanvasConfig.minHeight;
    }
    
    // Simple: find the block with the lowest bottom edge and add margin
    const lowestBottomEdge = Math.max(...positionsArray.map(pos => pos.y + pos.height));
    const BOTTOM_MARGIN = 60;
    
    return Math.max(
      currentCanvasConfig.minHeight,
      lowestBottomEdge + BOTTOM_MARGIN
    );
  }, [currentPositions, currentCanvasConfig, editorNodes]);

  // 🎯 WYSIWYG CANVAS HEIGHT DEBUG: Show phantom removal effect
  React.useEffect(() => {
    const validator = new PositionDataValidator();
    const phantomIds = validator.detectPhantomPositions(currentPositions, editorNodes);
    
    const originalArray = Object.values(currentPositions);
    const validPositions = Object.fromEntries(
      Object.entries(currentPositions).filter(([id]) => !phantomIds.includes(id))
    );
    const validArray = Object.values(validPositions);
    
    const originalBottomEdge = originalArray.length > 0 
      ? Math.max(...originalArray.map(pos => pos.y + pos.height))
      : 0;
    const validBottomEdge = validArray.length > 0 
      ? Math.max(...validArray.map(pos => pos.y + pos.height))
      : 0;

    console.log('[WYSIWYGCanvas] 🎯 EDITOR HEIGHT DEBUG (PHANTOM REMOVAL ONLY):', {
      viewport: currentViewport,
      phantomRemoval: {
        originalPositionsCount: originalArray.length,
        validPositionsCount: validArray.length,
        phantomsRemoved: phantomIds.length,
        phantomIds: phantomIds,
        originalBottomEdge,
        validBottomEdge,
        heightReduction: originalBottomEdge - validBottomEdge,
      },
      heightCalculation: {
        finalCalculatedHeight: canvasHeight,
        heightSource: canvasHeight === currentCanvasConfig.minHeight ? 'MIN_HEIGHT' : 'CONTENT_BASED',
        lowestContentBottom: validBottomEdge,
        margin: 60,
      }
    });
  }, [currentPositions, currentCanvasConfig, canvasHeight, currentViewport, editorNodes]);

  // Initialize positions for new nodes with content-aware sizing
  React.useEffect(() => {
    editorNodes.forEach(node => {
      if (!storePositions[node.id]) {
        initializeNodePosition(node.id, node.type);
      }
    });
  }, [editorNodes, storePositions, initializeNodePosition]);

  // Handle block position updates - viewport aware
  const handlePositionChange = useCallback(
    (nodeId: string, positionUpdate: Partial<BlockPosition>) => {
      updateCurrentViewportPosition(nodeId, positionUpdate);
    },
    [updateCurrentViewportPosition]
  );

  // Helper to detect if interaction is with toolbar/UI elements that should preserve table selection
  const isInteractionOutsideCanvas = useCallback((e: React.MouseEvent): boolean => {
    // Check if the original event target is a toolbar element
    const target = e.nativeEvent.target as HTMLElement;
    
    // Preserve selection for toolbar and UI interactions
    const preserveSelectionSelectors = [
      '[data-toolbar]',           // Typography toolbar
      '[data-inspector]',         // Inspector panel
      '[data-menu]',             // Dropdown menus
      '[role="menuitem"]',       // Menu items
      '[role="button"]',         // Buttons
      '.toolbar',                // CSS class based selectors
      '.inspector',
      '.dropdown',
      '.popover',
      '[data-radix-collection-item]', // Radix UI components
    ];
    
    // Check if target or any parent matches preservation selectors
    for (const selector of preserveSelectionSelectors) {
      if (target.closest(selector)) {
        return true;
      }
    }
    
    // Check if target is outside the canvas entirely
    const canvasElement = canvasRef.current;
    if (canvasElement && !canvasElement.contains(target)) {
      return true;
    }
    
    return false;
  }, []);

  // Handle canvas click (deselect blocks) - using unified selection system with table cell selection persistence
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only clear selection if clicking directly on the canvas background
      if (e.target === e.currentTarget) {
        // INTELLIGENT SELECTION PERSISTENCE: Check if we should preserve table cell selection
        const shouldPreserveTableSelection = isInteractionOutsideCanvas(e);
        
        if (!shouldPreserveTableSelection) {
          clearAllSelection();
        }
      }
    },
    [clearAllSelection, isInteractionOutsideCanvas]
  );

  return (
    <div className="flex-1 relative bg-gray-50 min-h-0">
      {/* Canvas container with zoom - CONTENT-ADAPTIVE SYSTEM */}
      <div
        className="flex justify-center"
        style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'top center' }}
      >
        <div
          ref={setNodeRef}
          className={`wysiwyg-canvas relative border-2 rounded-lg shadow-lg ${
            isOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          style={{
            width: currentCanvasConfig.width,
            height: canvasHeight,
            backgroundColor: canvasBackgroundColor || 'hsl(var(--background))',
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid overlay for alignment */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent ${currentCanvasConfig.width / currentCanvasConfig.gridColumns - 1}px,
                    ${colors.grid || 'hsl(var(--border))'} ${currentCanvasConfig.width / currentCanvasConfig.gridColumns}px
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
          )}

          {/* Drop zone overlay */}
          {isOver && (
            <div className="absolute inset-4 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
              <p className="text-primary font-medium">Drop block here</p>
            </div>
          )}

          {/* Render blocks */}
          {editorNodes.map(node => {
            const position = currentPositions[node.id];
            if (!position) return null;

            return (
              <DraggableBlock
                key={node.id}
                node={node}
                position={position}
                isSelected={selectedNodeId === node.id}
                zoom={canvasZoom}
                onPositionChange={update => handlePositionChange(node.id, update)}
                onSelect={() => activateBlock(node.id)}
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
