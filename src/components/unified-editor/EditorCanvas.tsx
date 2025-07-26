// ABOUTME: Canvas container for unified editor with viewport management, grid system, and block orchestration

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useUnifiedEditorStore,
  useEditorActions,
  useBlocks,
  useCanvasState,
} from '@/store/unifiedEditorStore';
import { useTheme } from '@/components/theme/CustomThemeProvider';
import { RichContentBlock } from './RichContentBlock';
import type { Point } from '@/types/unified-editor';

interface EditorCanvasProps {
  className?: string;
  onBlockCreate?: (blockId: string) => void;
  readOnly?: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  className,
  onBlockCreate,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);

  const blocks = useBlocks();
  const canvasState = useCanvasState();
  const actions = useEditorActions();
  const gridConfig = useUnifiedEditorStore(state => state.config.grid);

  // Global theme integration
  const { theme: globalTheme } = useTheme();

  // ============================================================================
  // CANVAS INTERACTION HANDLERS
  // ============================================================================

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      // Only handle clicks on the canvas itself (not on blocks)
      if (event.target === canvasRef.current || event.currentTarget === canvasRef.current) {
        // Clear selection if clicking on empty canvas
        if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
          actions.clearSelection();
        }

        // Create new block on double-click (if not read-only)
        if (event.detail === 2 && !readOnly) {
          const rect = canvasRef.current!.getBoundingClientRect();
          const position: Point = {
            x: (event.clientX - rect.left - canvasState.viewport.x) / canvasState.zoom,
            y: (event.clientY - rect.top - canvasState.viewport.y) / canvasState.zoom,
          };

          const blockId = actions.createBlock(position);
          onBlockCreate?.(blockId);

          // Focus the new block
          setTimeout(() => {
            actions.focusBlock(blockId);
          }, 100);
        }
      }
    },
    [actions, canvasState, readOnly, onBlockCreate]
  );

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent) => {
      // Start panning on middle mouse button or space+drag
      if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
        event.preventDefault();
        setIsPanning(true);
        setPanStart({
          x: event.clientX - canvasState.viewport.x,
          y: event.clientY - canvasState.viewport.y,
        });
      }
    },
    [canvasState.viewport]
  );

  const handleCanvasMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isPanning && panStart) {
        const newViewport: Point = {
          x: event.clientX - panStart.x,
          y: event.clientY - panStart.y,
        };
        actions.setViewport(newViewport);
      }
    },
    [isPanning, panStart, actions]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const calculateCenterPosition = useCallback((): Point => {
    if (!canvasRef.current) return { x: 200, y: 200 };

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (rect.width / 2 - canvasState.viewport.x) / canvasState.zoom - 200,
      y: (rect.height / 2 - canvasState.viewport.y) / canvasState.zoom - 100,
    };
  }, [canvasState]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Canvas-level keyboard shortcuts

      // Zoom controls
      if (event.metaKey || event.ctrlKey) {
        if (event.key === '=' || event.key === '+') {
          event.preventDefault();
          actions.setZoom(canvasState.zoom * 1.1);
        } else if (event.key === '-') {
          event.preventDefault();
          actions.setZoom(canvasState.zoom / 1.1);
        } else if (event.key === '0') {
          event.preventDefault();
          actions.setZoom(1);
          actions.setViewport({ x: 0, y: 0 });
        }
      }

      // Grid toggle
      if (event.key === 'g' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        actions.toggleGrid();
      }

      // Create new block
      if ((event.metaKey || event.ctrlKey) && event.key === 'n' && !readOnly) {
        event.preventDefault();
        const centerPosition = calculateCenterPosition();
        const blockId = actions.createBlock(centerPosition);
        onBlockCreate?.(blockId);
        actions.focusBlock(blockId);
      }

      // Select all blocks
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        // Select all blocks
        if (blocks.length > 0) {
          actions.selectBlock(blocks[0].id);
          for (let i = 1; i < blocks.length; i++) {
            actions.selectBlock(blocks[i].id, { multiSelect: true });
          }
        }
      }
    },
    [actions, canvasState, blocks, readOnly, onBlockCreate, calculateCenterPosition]
  );

  // ============================================================================
  // WHEEL/SCROLL HANDLING
  // ============================================================================

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        // Zoom with Ctrl/Cmd + scroll
        const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom * zoomDelta));
        actions.setZoom(newZoom);
      } else {
        // Pan with scroll
        const newViewport: Point = {
          x: canvasState.viewport.x - event.deltaX,
          y: canvasState.viewport.y - event.deltaY,
        };
        actions.setViewport(newViewport);
      }
    },
    [canvasState, actions]
  );

  // ============================================================================
  // GLOBAL EVENT LISTENERS
  // ============================================================================

  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isPanning, handleCanvasMouseMove, handleCanvasMouseUp]);

  // ============================================================================
  // GRID STYLES
  // ============================================================================

  const gridStyles: React.CSSProperties = React.useMemo(() => {
    if (!canvasState.gridEnabled || gridConfig.visualStyle === 'none') {
      return {};
    }

    const scaledSize = gridConfig.size * canvasState.zoom;
    const offsetX = canvasState.viewport.x % scaledSize;
    const offsetY = canvasState.viewport.y % scaledSize;

    // Use global CSS custom property for grid color
    const gridColor = 'hsl(var(--border))';

    if (gridConfig.visualStyle === 'dots') {
      return {
        backgroundImage: `radial-gradient(circle, ${gridColor} 1px, transparent 1px)`,
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        opacity: gridConfig.opacity,
      };
    } else if (gridConfig.visualStyle === 'lines') {
      return {
        backgroundImage: `
          linear-gradient(to right, ${gridColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
        `,
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        opacity: gridConfig.opacity,
      };
    }

    return {};
  }, [canvasState, gridConfig]);

  // ============================================================================
  // CANVAS TRANSFORM STYLES
  // ============================================================================

  const canvasTransformStyles: React.CSSProperties = {
    transform: `scale(${canvasState.zoom}) translate(${canvasState.viewport.x / canvasState.zoom}px, ${canvasState.viewport.y / canvasState.zoom}px)`,
    transformOrigin: '0 0',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={canvasRef}
      className={cn(
        'editor-canvas',
        'relative',
        'w-full',
        'h-full',
        'overflow-hidden',
        'transition-colors',
        'cursor-default',
        {
          'cursor-grab': isPanning,
          'cursor-grabbing': isPanning,
        },
        className
      )}
      style={{
        ...gridStyles,
        backgroundColor: 'hsl(var(--background))',
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      tabIndex={0}
      role="application"
      aria-label="Editor canvas"
    >
      {/* Canvas Content Container */}
      <div className="editor-canvas-content absolute inset-0" style={canvasTransformStyles}>
        {/* Render All Blocks */}
        {blocks.map(block => (
          <RichContentBlock key={block.id} block={block} isPreview={readOnly} />
        ))}

        {/* Canvas Origin Indicator (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <div className="absolute w-px h-4 bg-red-500 opacity-30" style={{ left: 0, top: -2 }} />
            <div className="absolute w-4 h-px bg-red-500 opacity-30" style={{ left: -2, top: 0 }} />
          </>
        )}
      </div>

      {/* Canvas Controls Overlay */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {/* Zoom Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 text-sm">
          <span className="text-gray-600">{Math.round(canvasState.zoom * 100)}%</span>
        </div>

        {/* Grid Toggle */}
        <button
          onClick={() => actions.toggleGrid()}
          className={cn(
            'bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 text-sm',
            'hover:bg-gray-50 transition-colors',
            {
              'bg-blue-50 border-blue-200 text-blue-700': canvasState.gridEnabled,
            }
          )}
          title="Toggle grid (G)"
        >
          Grid
        </button>
      </div>

      {/* Canvas Instructions (when empty) */}
      {blocks.length === 0 && !readOnly && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            <div className="text-lg font-medium mb-2">Start creating</div>
            <div className="text-sm">Double-click to create a new block</div>
            <div className="text-sm">
              Or press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+N</kbd>
            </div>
          </div>
        </div>
      )}

      {/* Block Count (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-2 py-1 rounded text-xs">
          {blocks.length} blocks
        </div>
      )}
    </div>
  );
};
