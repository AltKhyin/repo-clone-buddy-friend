// ABOUTME: V3 positioning wrapper component that applies pixel-perfect positioning to blocks with mobile scaling support

import React from 'react';
import { NodeObject, BlockPosition } from '@/types/editor';
import { useIsMobile } from '@/hooks/use-mobile';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import HeadingBlock from './blocks/HeadingBlock';

interface PositionedBlockRendererProps {
  node: NodeObject;
  position: BlockPosition;
  canvasWidth: number;
  mobileCanvasWidth?: number;
  isReadOnly?: boolean;
  isMobilePosition?: boolean; // Indicates if position is already mobile-specific
}

const PositionedBlockRenderer: React.FC<PositionedBlockRendererProps> = ({
  node,
  position,
  canvasWidth,
  mobileCanvasWidth = 375,
  isReadOnly = true,
  isMobilePosition = false,
}) => {
  const isMobile = useIsMobile();

  // Calculate scaling factor for mobile only if positions are not already mobile-specific
  const scaleFactor = (isMobile && !isMobilePosition) ? mobileCanvasWidth / canvasWidth : 1;
  
  // Apply scaling to position and dimensions only when needed
  const scaledPosition = {
    x: position.x * scaleFactor,
    y: position.y * scaleFactor,
    width: position.width * scaleFactor,
    height: position.height * scaleFactor,
  };

  // Render the appropriate block component based on node type
  const renderBlockContent = React.useMemo(() => {
    switch (node.type) {
      case 'textBlock':
      case 'text':
      case 'paragraph':
      case 'p':
        return <TextBlock data={node.data} />;

      case 'richBlock':
        // Rich blocks contain TipTap JSON content - render the HTML representation
        return (
          <div 
            className="rich-block-content"
            dangerouslySetInnerHTML={{ 
              __html: node.data?.content?.htmlContent || '<p>Empty content</p>' 
            }}
          />
        );

      case 'imageBlock':
      case 'image':
      case 'img':
        return <ImageBlock data={node.data} />;

      case 'headingBlock':
      case 'heading':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        // Convert heading type to level for HeadingBlock
        const headingLevel = node.type === 'heading' 
          ? node.data.level 
          : parseInt(node.type.replace('h', '')) || 1;
        return <HeadingBlock data={{ ...node.data, level: headingLevel }} />;

      case 'quoteBlock':
        return (
          <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r">
            <div 
              className="quote-content"
              dangerouslySetInnerHTML={{ 
                __html: node.data?.htmlContent || node.data?.content || ''
              }}
            />
            {node.data?.htmlCitation && (
              <cite className="text-sm text-muted-foreground mt-2 block">
                <div dangerouslySetInnerHTML={{ __html: node.data.htmlCitation }} />
              </cite>
            )}
          </blockquote>
        );

      case 'keyTakeawayBlock':
        return (
          <div className="key-takeaway bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
              <span className="font-semibold text-primary">Key Takeaway</span>
            </div>
            <div 
              className="takeaway-content"
              dangerouslySetInnerHTML={{ 
                __html: node.data?.htmlContent || node.data?.content || ''
              }}
            />
          </div>
        );

      case 'referenceBlock':
        return (
          <div className="reference-block bg-muted/30 border border-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted-foreground rounded"></div>
              <span className="font-semibold text-muted-foreground">Reference</span>
            </div>
            <div 
              className="reference-content"
              dangerouslySetInnerHTML={{ 
                __html: node.data?.htmlContent || node.data?.content || ''
              }}
            />
          </div>
        );

      case 'videoEmbedBlock':
        return (
          <div className="video-embed">
            {node.data?.url && (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Video: {node.data.platform}</span>
                {/* Note: Full video embedding would require iframe implementation */}
              </div>
            )}
          </div>
        );

      case 'separatorBlock':
        return (
          <hr 
            className={`
              border-t-${node.data?.thickness || 1} 
              ${node.data?.style === 'dashed' ? 'border-dashed' : 
                node.data?.style === 'dotted' ? 'border-dotted' : 'border-solid'}
              ${node.data?.width === 'half' ? 'w-1/2' : 
                node.data?.width === 'quarter' ? 'w-1/4' : 'w-full'}
              mx-auto
            `}
            style={{ 
              borderColor: node.data?.color || 'currentColor',
              backgroundColor: node.data?.backgroundColor || 'transparent'
            }}
          />
        );

      default:
        console.warn(`Unknown block type: ${node.type}`);
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
  }, [node.type, node.data]);

  // Apply custom styling if present in node data
  const customStyles = React.useMemo(() => {
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

    // Apply enhanced padding system
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

  return (
    <div
      className="absolute block-positioned"
      style={{
        left: `${scaledPosition.x}px`,
        top: `${scaledPosition.y}px`,
        width: `${scaledPosition.width}px`,
        minHeight: `${scaledPosition.height}px`,
        zIndex: position.zIndex || 1,
        ...customStyles,
      }}
      data-testid={node.id}
      data-block-id={node.id}
      data-block-type={node.type}
      data-read-only={isReadOnly}
    >
      {renderBlockContent}
    </div>
  );
};

export default PositionedBlockRenderer;