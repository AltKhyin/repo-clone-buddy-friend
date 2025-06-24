
// ABOUTME: Enhanced core rendering engine for structured content v2.0 with improved responsive layouts and performance optimization per Blueprint 05.

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import BlockRenderer from './BlockRenderer';

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

interface StructuredContentV2 {
  nodes: NodeObject[];
  layouts: {
    desktop: LayoutObject[];
    mobile: LayoutObject[];
  };
}

interface LayoutAwareRendererProps {
  content: StructuredContentV2;
}

const LayoutAwareRenderer: React.FC<LayoutAwareRendererProps> = ({ content }) => {
  const isMobile = useIsMobile();

  console.log('LayoutAwareRenderer:', { content, isMobile });

  if (!content || !content.nodes || !Array.isArray(content.nodes)) {
    console.warn('Invalid structured content:', content);
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl text-muted-foreground font-serif">?</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground font-serif">
            Conteúdo não disponível
          </h3>
          <p className="text-muted-foreground">
            Este review ainda não possui conteúdo estruturado ou o formato não é compatível.
          </p>
        </div>
      </div>
    );
  }

  // Select appropriate layout based on viewport - enhanced mobile detection per [D3.6]
  const selectedLayout = isMobile 
    ? content.layouts?.mobile || [] 
    : content.layouts?.desktop || [];

  console.log('Selected layout:', { isMobile, selectedLayout, nodeCount: content.nodes.length });

  // If no layout is defined, render nodes in optimized vertical order per [Blueprint 05]
  if (!selectedLayout || selectedLayout.length === 0) {
    console.log('No layout defined, using enhanced vertical rendering');
    return (
      <article className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        {content.nodes.map((node, index) => (
          <section key={node.id} className="content-block">
            <BlockRenderer 
              node={node} 
              layout={null}
              isVerticalFlow={true}
              index={index}
            />
          </section>
        ))}
      </article>
    );
  }

  // Enhanced grid-based rendering with responsive optimization per [D3.6]
  const gridConfig = {
    desktop: {
      columns: 'repeat(12, 1fr)',
      gap: '2rem',
      maxWidth: 'none'
    },
    mobile: {
      columns: '1fr',
      gap: '1.5rem',
      maxWidth: '100%'
    }
  };

  const currentConfig = isMobile ? gridConfig.mobile : gridConfig.desktop;

  return (
    <article 
      className="review-content-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: currentConfig.columns,
        gap: currentConfig.gap,
        maxWidth: currentConfig.maxWidth,
        gridAutoRows: 'minmax(auto, auto)'
      }}
    >
      {content.nodes.map((node, index) => {
        // Find corresponding layout object for this node
        const layoutObj = selectedLayout.find(layout => layout.id === node.id);
        
        return (
          <div
            key={node.id}
            className="content-block-wrapper"
            style={{
              gridColumn: layoutObj?.gridColumn || (isMobile ? '1' : 'auto'),
              gridRow: layoutObj?.gridRow || 'auto',
              gridArea: layoutObj?.gridArea || 'auto'
            }}
          >
            <BlockRenderer 
              node={node} 
              layout={layoutObj || null}
              isVerticalFlow={false}
              index={index}
            />
          </div>
        );
      })}
    </article>
  );
};

export default LayoutAwareRenderer;
