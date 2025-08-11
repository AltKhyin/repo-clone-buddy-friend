// ABOUTME: V3 Native WYSIWYG Renderer for pixel-perfect display of editor-created content with mobile scaling

import React from 'react';
import { StructuredContentV3, BlockPositions } from '@/types/editor';
import { useIsMobile } from '@/hooks/use-mobile';
import PositionedBlockRenderer from './PositionedBlockRenderer';

interface WYSIWYGRendererProps {
  content: StructuredContentV3;
  isReadOnly?: boolean;
  className?: string;
}

const WYSIWYGRenderer: React.FC<WYSIWYGRendererProps> = ({
  content,
  isReadOnly = true,
  className = '',
}) => {
  const isMobile = useIsMobile();

  console.log('WYSIWYGRenderer rendering:', {
    version: content.version,
    nodeCount: content.nodes?.length || 0,
    hasPositions: !!content.positions,
    hasMobilePositions: !!content.mobilePositions,
    canvasWidth: content.canvas?.canvasWidth,
    canvasHeight: content.canvas?.canvasHeight,
    isMobile,
  });

  // Validate content structure
  if (!content || content.version !== '3.0.0') {
    console.error('WYSIWYGRenderer: Invalid or unsupported content version:', content?.version);
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
    console.warn('WYSIWYGRenderer: No content nodes found');
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

  // Get appropriate positions for current viewport
  const positions: BlockPositions = isMobile 
    ? (content.mobilePositions || content.positions)
    : content.positions;
  
  // Track if we're using mobile-specific positions
  const usingMobilePositions = isMobile && !!content.mobilePositions;

  if (!positions || Object.keys(positions).length === 0) {
    console.warn('WYSIWYGRenderer: No position data found, falling back to vertical layout');
    
    // Fallback to vertical layout when no positions are available
    return (
      <article className={`prose prose-neutral dark:prose-invert max-w-none space-y-8 ${className}`}>
        {content.nodes.map((node, index) => (
          <section key={node.id} className="content-block">
            <PositionedBlockRenderer
              node={node}
              position={{
                id: node.id,
                x: 0,
                y: index * 200, // Simple vertical stacking
                width: 600,
                height: 200,
              }}
              canvasWidth={content.canvas?.canvasWidth || 800}
              isReadOnly={isReadOnly}
              isMobilePosition={false}
            />
          </section>
        ))}
      </article>
    );
  }

  // Canvas configuration
  const canvasConfig = {
    width: content.canvas?.canvasWidth || 800,
    height: content.canvas?.canvasHeight || 600,
    mobileWidth: 375, // Standard mobile viewport width
  };

  // Calculate mobile scaling
  const scaleFactor = isMobile ? canvasConfig.mobileWidth / canvasConfig.width : 1;
  const scaledCanvasHeight = canvasConfig.height * scaleFactor;

  // Filter nodes that have position data
  const positionedNodes = content.nodes.filter(node => positions[node.id]);
  const unpositionedNodes = content.nodes.filter(node => !positions[node.id]);

  if (unpositionedNodes.length > 0) {
    console.warn('WYSIWYGRenderer: Some nodes have no position data:', 
      unpositionedNodes.map(n => ({ id: n.id, type: n.type }))
    );
  }

  return (
    <div className={`wysiwyg-renderer ${className}`}>
      {/* Main positioned canvas */}
      <div
        className="relative bg-background overflow-hidden"
        style={{
          width: isMobile ? '100%' : `${canvasConfig.width}px`,
          minHeight: `${scaledCanvasHeight}px`,
          maxWidth: '100%',
        }}
        data-testid="canvas-type"
        data-canvas-type="wysiwyg"
        data-viewport={isMobile ? 'mobile' : 'desktop'}
        data-scale-factor={scaleFactor}
      >
        {/* Render positioned blocks */}
        {positionedNodes.map((node) => {
          const position = positions[node.id];
          if (!position) {
            console.error(`No position data for node ${node.id}`);
            return null;
          }

          return (
            <PositionedBlockRenderer
              key={node.id}
              node={node}
              position={position}
              canvasWidth={canvasConfig.width}
              mobileCanvasWidth={canvasConfig.mobileWidth}
              isReadOnly={isReadOnly}
              isMobilePosition={usingMobilePositions}
            />
          );
        })}

        {/* Canvas grid overlay for development */}
        {process.env.NODE_ENV === 'development' && !isReadOnly && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: `${20 * scaleFactor}px ${20 * scaleFactor}px`,
            }}
          />
        )}
      </div>

      {/* Fallback section for unpositioned nodes */}
      {unpositionedNodes.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="text-center py-4 border-t border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">
              Additional content (no position data)
            </p>
          </div>
          {unpositionedNodes.map((node, index) => (
            <div key={node.id} className="content-block-fallback">
              <PositionedBlockRenderer
                node={node}
                position={{
                  id: node.id,
                  x: 0,
                  y: 0,
                  width: isMobile ? canvasConfig.mobileWidth : canvasConfig.width,
                  height: 200,
                }}
                canvasWidth={canvasConfig.width}
                mobileCanvasWidth={canvasConfig.mobileWidth}
                isReadOnly={isReadOnly}
                isMobilePosition={false}
              />
            </div>
          ))}
        </div>
      )}

      {/* Debug information for development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-muted/30 rounded-lg">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Debug Info (Development Only)
          </summary>
          <div className="mt-2 space-y-2 text-xs text-muted-foreground">
            <div>Version: {content.version}</div>
            <div>Viewport: {isMobile ? 'Mobile' : 'Desktop'}</div>
            <div>Scale Factor: {scaleFactor.toFixed(2)}</div>
            <div>Canvas: {canvasConfig.width}x{canvasConfig.height}px</div>
            <div>Total Nodes: {content.nodes.length}</div>
            <div>Positioned Nodes: {positionedNodes.length}</div>
            <div>Unpositioned Nodes: {unpositionedNodes.length}</div>
            <div>Position Keys: {Object.keys(positions).length}</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default WYSIWYGRenderer;