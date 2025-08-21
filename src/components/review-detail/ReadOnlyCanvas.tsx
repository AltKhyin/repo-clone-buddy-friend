// ABOUTME: Read-only canvas that mirrors WYSIWYGCanvas for perfect visual parity in review display - unified rendering architecture

import React, { useMemo } from 'react';
import { StructuredContentV3 } from '@/types/editor';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReadOnlyBlock } from './ReadOnlyBlock';

// Canvas configuration - identical to WYSIWYGCanvas for perfect parity
const CANVAS_CONFIG = {
  desktop: {
    width: 800, // Fixed width matching editor output
    gridColumns: 12, // 12-column grid for snapping
    minHeight: 600, // Minimum canvas height
  },
  mobile: {
    width: 375, // Mobile viewport width (iPhone standard) - used for scaling calculations
    gridColumns: 1, // Single column for mobile
    minHeight: 800, // Taller minimum for mobile scrolling
  }
};

interface ReadOnlyCanvasProps {
  content: StructuredContentV3;
  className?: string;
  showGrid?: boolean; // Optional grid overlay for visual debugging
}

export function ReadOnlyCanvas({ 
  content, 
  className = '', 
  showGrid = false 
}: ReadOnlyCanvasProps) {
  const isMobile = useIsMobile();
  
  // Select appropriate positions and config based on current viewport - with mobile scaling to screen width
  const currentCanvasConfig = CANVAS_CONFIG[isMobile ? 'mobile' : 'desktop'];
  const currentPositions = isMobile && content.mobilePositions 
    ? content.mobilePositions 
    : content.positions;
    
  // Calculate actual canvas width for mobile (full screen width)
  const actualCanvasWidth = isMobile 
    ? (typeof window !== 'undefined' ? window.innerWidth : 375)
    : currentCanvasConfig.width;
    
  // Calculate scale factor for mobile content positioning
  const canvasScaleFactor = isMobile 
    ? actualCanvasWidth / currentCanvasConfig.width 
    : 1;

  // Track if we're using mobile-specific positions
  const usingMobilePositions = isMobile && !!content.mobilePositions;

  // Calculate canvas height based on content and viewport - ZERO MARGIN SYSTEM (identical to editor)
  const canvasHeight = useMemo(() => {
    if (!currentPositions || Object.keys(currentPositions).length === 0) {
      return currentCanvasConfig.minHeight;
    }
    
    const maxY = Math.max(
      currentCanvasConfig.minHeight,
      // ZERO MARGIN: No bottom padding - blocks can reach canvas bottom edge
      ...Object.values(currentPositions).map(pos => pos.y + pos.height)
    );
    return maxY;
  }, [currentPositions, currentCanvasConfig.minHeight]);

  // Validate content structure
  if (!content || content.version !== '3.0.0') {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center">
            <span className="text-2xl text-destructive font-serif">!</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground font-serif">
            Unsupported Content Format
          </h3>
          <p className="text-muted-foreground">
            This content uses an unsupported format. Expected V3.0.0, received: {content?.version || 'unknown'}
          </p>
        </div>
      </div>
    );
  }

  if (!content.nodes || !Array.isArray(content.nodes) || content.nodes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl text-muted-foreground font-serif">∅</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground font-serif">
            No Content Available
          </h3>
          <p className="text-muted-foreground">
            This review doesn't have any content blocks yet.
          </p>
        </div>
      </div>
    );
  }

  // Filter nodes that have position data
  const positionedNodes = content.nodes.filter(node => currentPositions?.[node.id]);
  const unpositionedNodes = content.nodes.filter(node => !currentPositions?.[node.id]);

  return (
    <div className={`readonly-canvas-container ${className}`}>
      {/* Canvas container - NO zoom functionality for read-only mode */}
      <div className={isMobile ? "w-full flex justify-center px-0" : "flex justify-center"}>
        <div
          className="readonly-canvas relative"
          style={{
            width: actualCanvasWidth,
            height: canvasHeight,
            backgroundColor: 'hsl(var(--background))',
          }}
          data-testid="readonly-canvas"
          data-canvas-type="readonly"
          data-viewport={isMobile ? 'mobile' : 'desktop'}
        >
          {/* Optional grid overlay for visual debugging - identical to editor */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent ${currentCanvasConfig.width / currentCanvasConfig.gridColumns - 1}px,
                    hsl(var(--border)) ${currentCanvasConfig.width / currentCanvasConfig.gridColumns}px
                  ),
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 19px,
                    hsl(var(--border)) 20px
                  )
                `,
              }}
            />
          )}

          {/* Render blocks - identical positioning to editor */}
          {positionedNodes.map(node => {
            const position = currentPositions[node.id];
            if (!position) return null;

            return (
              <ReadOnlyBlock
                key={node.id}
                node={node}
                position={position}
                canvasWidth={currentCanvasConfig.width}
                mobileCanvasWidth={CANVAS_CONFIG.mobile.width}
                isMobilePosition={usingMobilePositions}
                scaleFactor={canvasScaleFactor}
              />
            );
          })}

          {/* Empty state - identical to editor */}
          {positionedNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2 text-muted-foreground">
                  No Content Available
                </h3>
                <p className="text-sm text-muted-foreground/80">
                  This review doesn't contain any positioned content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fallback section for unpositioned nodes - identical to WYSIWYGRenderer */}
      {unpositionedNodes.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="text-center py-4 border-t border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">
              Additional content (no position data)
            </p>
          </div>
          {unpositionedNodes.map((node, index) => (
            <div key={node.id} className="content-block-fallback">
              <ReadOnlyBlock
                node={node}
                position={{
                  id: node.id,
                  x: 0,
                  y: index * 200,
                  width: currentCanvasConfig.width,
                  height: 200,
                }}
                canvasWidth={currentCanvasConfig.width}
                isMobilePosition={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}