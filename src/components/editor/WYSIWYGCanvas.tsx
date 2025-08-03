// ABOUTME: WYSIWYG constrained 2D canvas with direct pixel positioning for review editing

import React, { useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditorStore, useEditorActions } from '@/store/editorStore';
import { DraggableBlock } from './DraggableBlock';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { BlockPosition } from '@/types/editor';

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
  } = useEditorStore();

  // Use unified selection system instead of legacy selectNode
  const { clearAllSelection, activateBlock } = useEditorActions();

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

  // Initialize positions for new nodes with content-aware sizing
  React.useEffect(() => {
    editorNodes.forEach(node => {
      if (!storePositions[node.id]) {
        initializeNodePosition(node.id, node.type);
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
