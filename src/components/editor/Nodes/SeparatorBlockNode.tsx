// ABOUTME: EVIDENS specialized separator block with advanced styling options and responsive design

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { SeparatorBlockData } from '@/types/editor';
import { cn } from '@/lib/utils';
import { UnifiedNodeResizer } from '../components/UnifiedNodeResizer';

interface SeparatorBlockNodeProps {
  id: string;
  data: SeparatorBlockData;
  selected?: boolean;
}

// Width configuration mapping
const WIDTH_CONFIGS = {
  full: 'w-full',
  half: 'w-1/2 mx-auto',
  quarter: 'w-1/4 mx-auto',
} as const;

// Style configuration mapping  
const STYLE_CONFIGS = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
} as const;

export function SeparatorBlockNode({ id, data, selected }: SeparatorBlockNodeProps) {
  const { updateNode, canvasTheme } = useEditorStore();
  
  const handleClick = () => {
    const editorStore = useEditorStore.getState();
    editorStore.selectNode(id);
  };
  
  // Generate dynamic border thickness class
  const thicknessClass = `border-t-${data.thickness || 1}`;
  
  // Color handling with theme fallback
  const borderColor = data.color || (canvasTheme === 'dark' ? '#374151' : '#d1d5db');
  
  return (
    <>
      <UnifiedNodeResizer
        isVisible={selected || false}
        nodeType="separatorBlock"
        customConstraints={{
          minHeight: 40,
          maxHeight: 100,
          minWidth: 100,
          maxWidth: 800
        }}
      />
      
      <div
        data-node-id={id}
        onClick={handleClick}
        className={cn(
          'relative cursor-pointer transition-all duration-200 py-4 px-2',
          'min-h-[40px] flex items-center justify-center',
          // Selection state
          selected && 'ring-2 ring-primary ring-offset-2 rounded-lg',
          // Hover state
          'hover:bg-accent/10 rounded-lg'
        )}
      >
        {/* Separator Line */}
        <div 
          className={cn(
            'border-t transition-all duration-200',
            WIDTH_CONFIGS[data.width],
            STYLE_CONFIGS[data.style],
            thicknessClass
          )}
          style={{
            borderTopColor: borderColor,
            borderTopWidth: `${data.thickness || 1}px`
          }}
        />
        
        {/* Style Indicators (visible on selection/hover) */}
        {selected && (
          <>
            {/* Selection Indicator */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10 whitespace-nowrap">
              Separator ({data.style}, {data.width}, {data.thickness}px)
            </div>
            
            {/* Style Preview Box */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 shadow-md z-10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Style:</span>
                  <span className="font-medium capitalize">{data.style}</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1">
                  <span>Width:</span>
                  <span className="font-medium capitalize">{data.width}</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1">
                  <span>Thickness:</span>
                  <span className="font-medium">{data.thickness}px</span>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Hover State Indicator */}
        {!selected && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border">
              Click to edit separator
            </div>
          </div>
        )}
      </div>
    </>
  );
}