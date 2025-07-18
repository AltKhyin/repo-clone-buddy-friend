// ABOUTME: Updated WYSIWYG Canvas with architectural resize system integration

import React, { useCallback, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditorStore } from '@/store/editorStore';
import { BlockPosition } from '@/types/editor';
import { DraggableBlock } from './DraggableBlock';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';

// Canvas configuration constants
const CANVAS_CONFIG = {
  width: 800,
  gridColumns: 12,
  minZoom: 0.5,
  maxZoom: 2.0,
  defaultZoom: 1.0,
  snapTolerance: 10,
  minHeight: 600,
};

/**
 * Enhanced WYSIWYG Canvas with architectural resize system
 */
export function WYSIWYGCanvas() {
  const {
    nodes: editorNodes,
    positions: storePositions,
    selectedNodeId,
    canvasZoom,
    selectNode,
    updateNodePosition,
    initializeNodePosition,
    updateCanvasZoom,
  } = useEditorStore();

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

  // Handle block position updates with enhanced validation
  const handlePositionChange = useCallback(
    (nodeId: string, positionUpdate: Partial<BlockPosition>) => {
      // Validate position update
      const currentPosition = storePositions[nodeId];
      if (!currentPosition) return;

      const newPosition = { ...currentPosition, ...positionUpdate };

      // Additional validation
      if (newPosition.x < 0 || newPosition.y < 0) return;
      if (newPosition.width < 50 || newPosition.height < 30) return;
      if (newPosition.x + newPosition.width > CANVAS_CONFIG.width) return;

      updateNodePosition(nodeId, positionUpdate);
    },
    [storePositions, updateNodePosition]
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

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    updateCanvasZoom(Math.min(CANVAS_CONFIG.maxZoom, canvasZoom + 0.1));
  }, [canvasZoom, updateCanvasZoom]);

  const handleZoomOut = useCallback(() => {
    updateCanvasZoom(Math.max(CANVAS_CONFIG.minZoom, canvasZoom - 0.1));
  }, [canvasZoom, updateCanvasZoom]);

  const handleActualSize = useCallback(() => {
    updateCanvasZoom(CANVAS_CONFIG.defaultZoom);
  }, [updateCanvasZoom]);

  return (
    <div className="flex-1 relative bg-gray-50 overflow-auto">
      {/* Canvas controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-sm">
          <div className="text-xs font-medium text-foreground">
            Zoom: {Math.round(canvasZoom * 100)}%
          </div>
        </div>

        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-sm flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={canvasZoom <= CANVAS_CONFIG.minZoom}
            className="rounded-r-none"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleActualSize}
            className="rounded-none text-xs px-2"
            title="Actual Size (100%)"
          >
            100%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={canvasZoom >= CANVAS_CONFIG.maxZoom}
            className="rounded-l-none"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas container with zoom */}
      <div
        className="flex justify-center pt-16 pb-8"
        style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'top center' }}
      >
        <div
          ref={setNodeRef}
          className={`wysiwyg-canvas relative bg-white border-2 rounded-lg shadow-lg ${
            isOver ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          style={{
            width: CANVAS_CONFIG.width,
            height: canvasHeight,
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
                  #e5e7eb ${CANVAS_CONFIG.width / CANVAS_CONFIG.gridColumns}px
                ),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 19px,
                  #e5e7eb 20px
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

          {/* Render blocks with enhanced resize system */}
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
                <h3 className="text-lg font-medium mb-2 text-gray-600">
                  Start Creating Your Review
                </h3>
                <p className="text-sm text-gray-500">Drag blocks from the palette to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
