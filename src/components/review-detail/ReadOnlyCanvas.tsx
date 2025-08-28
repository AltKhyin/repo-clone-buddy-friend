// ABOUTME: Read-only canvas that mirrors WYSIWYGCanvas for perfect visual parity in review display - unified rendering architecture

import React, { useMemo } from 'react';
import { StructuredContentV3 } from '@/types/editor';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReadOnlyBlock } from './ReadOnlyBlock';
import { PositionDataValidator } from '@/utils/positionDataValidator';

// Canvas configuration - identical to WYSIWYGCanvas for perfect parity
const CANVAS_CONFIG = {
  desktop: {
    width: 800, // Fixed width matching editor output
    gridColumns: 12, // 12-column grid for snapping
    minHeight: 400, // Reduced minimum for content-adaptive sizing (was 600)
  },
  mobile: {
    width: 375, // Mobile viewport width (iPhone standard) - used for scaling calculations
    gridColumns: 1, // Single column for mobile
    minHeight: 300, // 🎯 MOBILE HEIGHT FIX: Reduced from 500px to eliminate excessive empty space
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
    
  // 🎯 MOBILE SCALING FIX: Logical canvas width (375px) vs visual screen width
  const logicalCanvasWidth = currentCanvasConfig.width; // Always 375px for mobile logic
  const actualScreenWidth = isMobile 
    ? (typeof window !== 'undefined' ? window.innerWidth : 375)
    : currentCanvasConfig.width;
    
  // 🎯 VISUAL SCALING: Scale up 375px canvas to fill mobile screen width
  const visualScaleFactor = isMobile 
    ? actualScreenWidth / logicalCanvasWidth 
    : 1;
    
  // 🎯 POSITIONING: Always use 1:1 scale for position calculations (maintains editor parity)
  const positioningScaleFactor = 1;

  // Track if we're using mobile-specific positions
  const usingMobilePositions = isMobile && !!content.mobilePositions;

  // 🎯 CANVAS HEIGHT FIX: Simple approach - find lowest content bottom + margin  
  const canvasHeight = useMemo(() => {
    // Only remove phantom positions (nodes that don't exist), keep all valid positions regardless of Y coordinate
    const validator = new PositionDataValidator();
    const phantomIds = validator.detectPhantomPositions(currentPositions, content.nodes);
    
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
  }, [currentPositions, currentCanvasConfig.minHeight, content.nodes]);

  // 🎯 READONLY CANVAS HEIGHT DEBUG: Show phantom removal effect
  React.useEffect(() => {
    const validator = new PositionDataValidator();
    const phantomIds = validator.detectPhantomPositions(currentPositions, content.nodes);
    
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

    console.log('[ReadOnlyCanvas] 🎯 READONLY HEIGHT DEBUG (PHANTOM REMOVAL ONLY):', {
      viewport: isMobile ? 'mobile' : 'desktop',
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
  }, [currentPositions, currentCanvasConfig, canvasHeight, isMobile, content.nodes]);

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

  // 🎯 ENHANCED MOBILE CANVAS HEIGHT DEBUG: Deep analysis of height calculation
  const positionsArray = Object.values(currentPositions);
  const contentBottomEdge = positionsArray.length > 0 
    ? Math.max(...positionsArray.map(pos => pos.y + pos.height))
    : 0;
  const BOTTOM_MARGIN = 60;
  const calculatedContentHeight = positionsArray.length > 0 
    ? contentBottomEdge + BOTTOM_MARGIN 
    : 0;
  
  console.log('[ReadOnlyCanvas] 🔍 ENHANCED MOBILE HEIGHT DEBUG:', {
    // Basic info
    isMobile,
    viewport: isMobile ? 'mobile' : 'desktop',
    usingMobilePositions,
    
    // Canvas configuration
    canvasConfig: {
      desktopMinHeight: CANVAS_CONFIG.desktop.minHeight,
      mobileMinHeight: CANVAS_CONFIG.mobile.minHeight,
      currentMinHeight: currentCanvasConfig.minHeight,
      minHeightReduced: isMobile ? 'REDUCED from 500px to 300px' : 'unchanged at 400px',
    },
    
    // Position data analysis
    positionData: {
      totalNodes: content.nodes.length,
      positionedNodes: positionedNodes.length,
      currentPositionsCount: Object.keys(currentPositions).length,
      hasDesktopPositions: content.positions ? Object.keys(content.positions).length : 0,
      hasMobilePositions: content.mobilePositions ? Object.keys(content.mobilePositions).length : 0,
      positionsUsed: isMobile && content.mobilePositions ? 'mobile' : 'desktop',
    },
    
    // Height calculation breakdown
    heightCalculation: {
      positionsArrayLength: positionsArray.length,
      contentBottomEdge,
      bottomMargin: BOTTOM_MARGIN,
      calculatedContentHeight,
      minHeightConstraint: currentCanvasConfig.minHeight,
      finalCalculatedHeight: canvasHeight,
      excessHeight: canvasHeight > calculatedContentHeight ? canvasHeight - calculatedContentHeight : 0,
      isMinHeightActive: canvasHeight === currentCanvasConfig.minHeight,
      heightSource: canvasHeight === currentCanvasConfig.minHeight ? 'MIN_HEIGHT' : 'CONTENT_BASED',
    },
    
    // Position samples for debugging
    positionSamples: positionsArray.length > 0 ? positionsArray.slice(0, 3).map(pos => ({
      id: pos.id,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      bottomEdge: pos.y + pos.height,
    })) : [],
    
    // Desktop vs mobile comparison
    comparisonData: isMobile ? {
      mobilePositionsCount: content.mobilePositions ? Object.keys(content.mobilePositions).length : 0,
      desktopPositionsCount: content.positions ? Object.keys(content.positions).length : 0,
      fallbackToDesktop: !content.mobilePositions,
      mobileConfigWidth: CANVAS_CONFIG.mobile.width,
      desktopConfigWidth: CANVAS_CONFIG.desktop.width,
    } : null,
  });

  // 🎯 CRITICAL HEIGHT COMPARISON: What if we used desktop vs mobile positions?
  if (isMobile && content.positions && content.mobilePositions) {
    const desktopPositions = Object.values(content.positions);
    const mobilePositions = Object.values(content.mobilePositions);
    
    const desktopBottomEdge = desktopPositions.length > 0 
      ? Math.max(...desktopPositions.map(pos => pos.y + pos.height))
      : 0;
    const mobileBottomEdge = mobilePositions.length > 0 
      ? Math.max(...mobilePositions.map(pos => pos.y + pos.height))
      : 0;

    const desktopHeightIfUsed = Math.max(CANVAS_CONFIG.mobile.minHeight, desktopBottomEdge + 60);
    const mobileHeightIfUsed = Math.max(CANVAS_CONFIG.mobile.minHeight, mobileBottomEdge + 60);

    console.log('[ReadOnlyCanvas] ⚖️ CRITICAL POSITION DATA COMPARISON:', {
      scenario: 'Mobile viewport with both position datasets available',
      currentlyUsing: 'mobile positions',
      
      desktopPositions: {
        count: desktopPositions.length,
        bottomEdge: desktopBottomEdge,
        calculatedHeight: desktopHeightIfUsed,
        samplePositions: desktopPositions.slice(0, 2).map(pos => ({
          id: pos.id, y: pos.y, height: pos.height, bottomEdge: pos.y + pos.height
        })),
      },
      
      mobilePositions: {
        count: mobilePositions.length,
        bottomEdge: mobileBottomEdge,
        calculatedHeight: mobileHeightIfUsed,
        samplePositions: mobilePositions.slice(0, 2).map(pos => ({
          id: pos.id, y: pos.y, height: pos.height, bottomEdge: pos.y + pos.height
        })),
      },
      
      heightDifference: Math.abs(desktopHeightIfUsed - mobileHeightIfUsed),
      potentialIssue: desktopHeightIfUsed > mobileHeightIfUsed + 100 ? 
        'DESKTOP POSITIONS WOULD CREATE EXCESSIVE HEIGHT' : 
        mobileHeightIfUsed > desktopHeightIfUsed + 100 ?
        'MOBILE POSITIONS ARE CREATING EXCESSIVE HEIGHT' :
        'HEIGHT DIFFERENCE IS REASONABLE',
        
      recommendation: desktopHeightIfUsed > mobileHeightIfUsed + 100 ?
        'Mobile positions are correct, but something else is wrong' :
        mobileHeightIfUsed > desktopHeightIfUsed + 100 ?
        'Mobile position data might have incorrect Y/height values' :
        'Position data looks reasonable, check minHeight constraint'
    });
  }

  return (
    <div className={`readonly-canvas-container readonly-content ${className}`}>
      {/* Canvas container - NO zoom functionality for read-only mode */}
      <div className={isMobile ? "w-full flex justify-center px-0" : "flex justify-center"}>
        <div
          className="readonly-canvas relative"
          style={{
            width: logicalCanvasWidth, // Always use logical 375px for canvas size
            height: canvasHeight,
            backgroundColor: 'hsl(var(--background))',
            // 🎯 MOBILE SCALING: Scale up canvas visually to fill screen width
            transform: isMobile ? `scale(${visualScaleFactor})` : 'none',
            transformOrigin: 'top center', // Scale from top center
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
                scaleFactor={positioningScaleFactor}
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