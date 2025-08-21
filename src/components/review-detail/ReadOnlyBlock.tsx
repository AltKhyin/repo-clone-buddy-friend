// ABOUTME: Read-only block component that mirrors DraggableBlock positioning but removes all interactions - unified rendering architecture

import React, { useMemo } from 'react';
import { NodeObject, BlockPosition } from '@/types/editor';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReadOnlyRichBlockNode } from './ReadOnlyRichBlockNode';

interface ReadOnlyBlockProps {
  node: NodeObject;
  position: BlockPosition;
  canvasWidth: number;
  mobileCanvasWidth?: number;
  isMobilePosition?: boolean; // Indicates if position is already mobile-specific
  scaleFactor?: number; // Scale factor for mobile canvas width adjustment
}

/**
 * Legacy ReadOnlyBlock component for non-richBlock types only
 * Mirrors LegacyDraggableBlock but removes all interactivity
 */
const LegacyReadOnlyBlock: React.FC<ReadOnlyBlockProps> = ({
  node,
  position,
  canvasWidth,
  mobileCanvasWidth = 375,
  isMobilePosition = false,
  scaleFactor: providedScaleFactor,
}) => {
  const isMobile = useIsMobile();

  // Use provided scale factor (for canvas width adjustment) or calculate based on mobile positioning
  // This is identical to DraggableBlock logic but without interaction handling
  const scaleFactor = providedScaleFactor || 
    ((isMobile && !isMobilePosition) ? mobileCanvasWidth / canvasWidth : 1);
  
  // Apply scaling to position and dimensions only when needed - identical to editor logic
  const scaledPosition = {
    x: position.x * scaleFactor,
    y: position.y * scaleFactor,
    width: position.width * scaleFactor,
    height: position.height * scaleFactor,
  };

  // Apply custom styling if present in node data - identical to editor logic
  const customStyles = useMemo(() => {
    const styles: React.CSSProperties = {};
    
    if (node.data?.backgroundColor) {
      styles.backgroundColor = node.data.backgroundColor;
    }
    
    if (node.data?.borderRadius) {
      styles.borderRadius = `${node.data.borderRadius}px`;
    }
    
    if (node.data?.borderWidth && node.data?.borderColor) {
      styles.border = `${node.data.borderWidth}px solid ${node.data.borderColor}`;
    }

    // Apply enhanced padding system - identical to editor
    if (node.data?.desktopPadding && !isMobile) {
      const padding = node.data.desktopPadding;
      styles.paddingTop = padding.top ? `${padding.top}px` : undefined;
      styles.paddingRight = padding.right ? `${padding.right}px` : undefined;
      styles.paddingBottom = padding.bottom ? `${padding.bottom}px` : undefined;
      styles.paddingLeft = padding.left ? `${padding.left}px` : undefined;
    } else if (node.data?.mobilePadding && isMobile) {
      const padding = node.data.mobilePadding;
      styles.paddingTop = padding.top ? `${padding.top}px` : undefined;
      styles.paddingRight = padding.right ? `${padding.right}px` : undefined;
      styles.paddingBottom = padding.bottom ? `${padding.bottom}px` : undefined;
      styles.paddingLeft = padding.left ? `${padding.left}px` : undefined;
    }

    return styles;
  }, [node.data, isMobile]);

  // Render legacy block content (richBlock handled at component start)
  // This is a simplified version without the placeholder styling from editor
  const renderBlockContent = () => {
    switch (node.type) {
      case 'textBlock':
      case 'text':
      case 'paragraph':
      case 'p':
        return (
          <div 
            className="text-block-content"
            dangerouslySetInnerHTML={{ 
              __html: node.data?.htmlContent || '<p>Empty text content</p>' 
            }}
          />
        );

      case 'headingBlock':
      case 'heading':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const headingLevel = node.type === 'heading' 
          ? node.data.level 
          : parseInt(node.type.replace('h', '')) || 1;
        const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
        
        return (
          <HeadingTag 
            className="heading-content"
            dangerouslySetInnerHTML={{ 
              __html: node.data?.htmlContent || `Heading ${headingLevel}` 
            }}
          />
        );

      case 'imageBlock':
      case 'image':
      case 'img':
        return (
          <div className="image-block-content">
            {node.data?.src ? (
              <img 
                src={node.data.src}
                alt={node.data?.alt || ''}
                className="w-full h-auto rounded-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No image source</span>
              </div>
            )}
            {node.data?.caption && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {node.data.caption}
              </p>
            )}
          </div>
        );

      case 'videoBlock':
      case 'video':
        return (
          <div className="video-block-content">
            {node.data?.src ? (
              <div 
                className="video-container relative w-full rounded-lg overflow-hidden bg-black"
                style={{ 
                  maxWidth: '100%',
                  aspectRatio: node.data?.aspectRatio || '16/9',
                  contain: 'layout size' // Prevent overflow
                }}
              >
                {node.data?.provider === 'youtube' || node.data?.provider === 'vimeo' ? (
                  // For embedded videos, show thumbnail with play button
                  <div className="relative w-full h-full">
                    {node.data?.thumbnail && (
                      <img 
                        src={node.data.thumbnail}
                        alt={node.data?.title || 'Video thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[20px] border-l-black border-y-[12px] border-y-transparent ml-1"></div>
                      </div>
                    </div>
                    {node.data?.provider && (
                      <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {node.data.provider.charAt(0).toUpperCase() + node.data.provider.slice(1)}
                      </div>
                    )}
                  </div>
                ) : (
                  // For direct video files
                  <video 
                    className="w-full h-full object-cover"
                    controls={false}
                    poster={node.data?.thumbnail}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  >
                    <source src={node.data.src} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No video source</span>
              </div>
            )}
            {node.data?.caption && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {node.data.caption}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted-foreground/40 rounded"></div>
              <p className="text-sm font-medium text-muted-foreground">
                Unsupported block type
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{node.type}</code>
            </p>
          </div>
        );
    }
  };

  // Legacy blocks use the read-only container (no interactions)
  return (
    <div
      data-testid={`readonly-block-${node.id}`}
      className="absolute readonly-block readonly-content"
      style={{
        left: scaledPosition.x,
        top: scaledPosition.y,
        width: scaledPosition.width,
        minHeight: scaledPosition.height,
        zIndex: position.zIndex || 1,
        ...customStyles,
      }}
      data-block-id={node.id}
      data-block-type={node.type}
      data-read-only="true"
    >
      {/* Block content */}
      <div className="w-full h-full overflow-hidden border rounded-lg bg-background">
        {renderBlockContent()}
      </div>
    </div>
  );
};

/**
 * ReadOnlyBlock with unified architecture (routing component)
 * Mirrors DraggableBlock routing logic exactly
 */
export const ReadOnlyBlock: React.FC<ReadOnlyBlockProps> = (props) => {
  // Route richBlock to ReadOnlyRichBlockNode system - identical to DraggableBlock
  if (props.node.type === 'richBlock') {
    return (
      <ReadOnlyRichBlockNode
        id={props.node.id}
        data={props.node.data}
        width={props.position.width}
        height={props.position.height}
        x={props.position.x}
        y={props.position.y}
        canvasWidth={props.canvasWidth}
        mobileCanvasWidth={props.mobileCanvasWidth}
        isMobilePosition={props.isMobilePosition}
        scaleFactor={props.scaleFactor}
      />
    );
  }

  // Route legacy blocks to legacy system - identical to DraggableBlock
  return <LegacyReadOnlyBlock {...props} />;
};