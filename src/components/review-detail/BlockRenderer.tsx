
// ABOUTME: Enhanced controller component that selects the correct block component based on node type with improved performance and accessibility per Blueprint 05.

import React from 'react';
import TextBlock from './blocks/TextBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ImageBlock from './blocks/ImageBlock';

interface LayoutObject {
  id: string;
  gridColumn?: string;
  gridRow?: string;
  gridArea?: string;
}

interface NodeObject {
  id: string;
  type: string;
  data: any;
}

interface BlockRendererProps {
  node: NodeObject;
  layout: LayoutObject | null;
  isVerticalFlow?: boolean;
  index?: number;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  node, 
  layout, 
  isVerticalFlow = false,
  index = 0 
}) => {
  console.log('BlockRenderer:', { 
    nodeType: node.type, 
    nodeId: node.id, 
    hasLayout: !!layout,
    isVerticalFlow,
    index 
  });

  // Performance optimization: Memoize block component selection
  const renderBlockContent = React.useMemo(() => {
    switch (node.type) {
      case 'heading':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return <HeadingBlock data={node.data} />;
      
      case 'text':
      case 'paragraph':
      case 'p':
        return <TextBlock data={node.data} />;
      
      case 'image':
      case 'img':
        return <ImageBlock data={node.data} />;
      
      default:
        console.warn(`Unknown block type: ${node.type}`);
        return (
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted-foreground/40 rounded"></div>
              <p className="text-sm font-medium text-muted-foreground">
                Tipo de bloco não suportado
              </p>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                {node.type}
              </code>
            </p>
            {process.env.NODE_ENV === 'development' && node.data && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Ver dados (dev)
                </summary>
                <pre className="mt-1 text-xs text-muted-foreground overflow-auto max-h-32 bg-muted/50 p-2 rounded">
                  {JSON.stringify(node.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        );
    }
  }, [node.type, node.data]);

  // Enhanced wrapper with accessibility improvements per [Blueprint 05]
  const wrapperProps = {
    'data-block-type': node.type,
    'data-block-id': node.id,
    'data-block-index': index,
    className: `block-wrapper ${isVerticalFlow ? 'vertical-flow' : 'grid-flow'}`,
    ...(isVerticalFlow && {
      'aria-label': `Content block ${index + 1}: ${node.type}`
    })
  };

  return (
    <div {...wrapperProps}>
      {renderBlockContent}
    </div>
  );
};

export default BlockRenderer;
