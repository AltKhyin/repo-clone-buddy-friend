// ABOUTME: Block palette component displaying draggable content blocks organized by category

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Edit3 } from 'lucide-react';
import { BlockType } from '@/types/editor';

const blockTypes: BlockType[] = [
  // Unified Content Block - The only block type needed
  {
    id: 'richBlock',
    label: 'Rich Block',
    icon: Edit3,
    category: 'content',
    description:
      'Unified block with rich text, images, tables, polls, quotes, references, and all content types',
  },
];

const categoryLabels = {
  content: 'Content',
};

const DraggableBlock = React.memo(function DraggableBlock({ block }: { block: BlockType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: {
      type: 'block',
      blockType: block.id,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

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
  const blocksByCategory = blockTypes.reduce(
    (acc, block) => {
      if (!acc[block.category]) {
        acc[block.category] = [];
      }
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<string, BlockType[]>
  );

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Block Palette</h2>
        <p className="text-xs text-muted-foreground mt-1">Drag blocks to the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(blocksByCategory).map(([category, blocks]) => (
          <div key={category}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
            <div className="space-y-2">
              {blocks.map(block => (
                <DraggableBlock key={block.id} block={block} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
