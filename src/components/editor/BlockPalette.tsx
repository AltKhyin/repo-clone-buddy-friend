// ABOUTME: Block palette component displaying draggable content blocks organized by category

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  Type, 
  Heading1, 
  Image, 
  Table, 
  BarChart, 
  MessageSquare, 
  Lightbulb, 
  Quote, 
  Video, 
  Minus,
  FileText
} from 'lucide-react';
import { BlockType } from '@/types/editor';

const blockTypes: BlockType[] = [
  // Content Blocks
  {
    id: 'textBlock',
    label: 'Text Block',
    icon: Type,
    category: 'content',
    description: 'Rich text content with formatting'
  },
  {
    id: 'headingBlock',
    label: 'Heading',
    icon: Heading1,
    category: 'content',
    description: 'Structured headings (H1-H4)'
  },
  {
    id: 'quoteBlock',
    label: 'Quote',
    icon: Quote,
    category: 'content',
    description: 'Highlighted quotes and citations'
  },
  
  // Media Blocks
  {
    id: 'imageBlock',
    label: 'Image',
    icon: Image,
    category: 'media',
    description: 'Images with captions and styling'
  },
  {
    id: 'videoEmbedBlock',
    label: 'Video',
    icon: Video,
    category: 'media',
    description: 'YouTube/Vimeo video embeds'
  },
  
  // Data Blocks
  {
    id: 'tableBlock',
    label: 'Table',
    icon: Table,
    category: 'data',
    description: 'Data tables with sorting'
  },
  
  // Interactive Blocks
  {
    id: 'pollBlock',
    label: 'Poll',
    icon: MessageSquare,
    category: 'interactive',
    description: 'Interactive voting polls'
  },
  
  // EVIDENS Blocks
  {
    id: 'keyTakeawayBlock',
    label: 'Key Takeaway',
    icon: Lightbulb,
    category: 'evidens',
    description: 'Highlighted key messages'
  },
  {
    id: 'referenceBlock',
    label: 'Reference',
    icon: FileText,
    category: 'evidens',
    description: 'Academic citations'
  },
  
  // Visual Blocks
  {
    id: 'separatorBlock',
    label: 'Separator',
    icon: Minus,
    category: 'visual',
    description: 'Section dividers'
  }
];

const categoryLabels = {
  content: 'Content',
  media: 'Media',
  data: 'Data',
  interactive: 'Interactive',
  evidens: 'EVIDENS',
  visual: 'Visual'
};

const DraggableBlock = React.memo(function DraggableBlock({ block }: { block: BlockType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: {
      type: 'block',
      blockType: block.id
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const IconComponent = block.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 border rounded-lg bg-background cursor-grab hover:bg-accent hover:border-accent-foreground/20 
        transition-colors group
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center space-x-2 mb-1">
        <IconComponent size={16} className="text-muted-foreground group-hover:text-foreground" />
        <span className="text-sm font-medium">{block.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{block.description}</p>
    </div>
  );
});

export const BlockPalette = React.memo(function BlockPalette() {
  // Group blocks by category
  const blocksByCategory = blockTypes.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, BlockType[]>);

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Block Palette</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag blocks to the canvas
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(blocksByCategory).map(([category, blocks]) => (
          <div key={category}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
            <div className="space-y-2">
              {blocks.map((block) => (
                <DraggableBlock key={block.id} block={block} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});