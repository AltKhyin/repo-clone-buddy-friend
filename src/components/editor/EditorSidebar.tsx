// ABOUTME: Unified left sidebar with tabs for BlockPalette and Properties to eliminate layout displacement

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDraggable } from '@dnd-kit/core';
import {
  Blocks,
  Settings2,
  Palette,
  Move,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
  Image,
  Table,
  BarChart,
  MessageSquare,
  Lightbulb,
  Quote,
  Video,
  Minus,
  FileText,
} from 'lucide-react';
import { BlockType } from '@/types/editor';
import { BackgroundControls } from './Inspector/shared/BackgroundControls';
import { SpacingControls } from './Inspector/shared/SpacingControls';
import { BorderControls } from './Inspector/shared/BorderControls';
import { TextBlockInspector } from './Inspector/TextBlockInspector';
import { TableBlockInspector } from './Inspector/TableBlockInspector';
import { QuoteBlockInspector } from './Inspector/QuoteBlockInspector';
import { VideoEmbedBlockInspector } from './Inspector/VideoEmbedBlockInspector';
import { SeparatorBlockInspector } from './Inspector/SeparatorBlockInspector';
import { ImageBlockInspector } from './Inspector/ImageBlockInspector';
import { PollBlockInspector } from './Inspector/PollBlockInspector';
import { KeyTakeawayBlockInspector } from './Inspector/KeyTakeawayBlockInspector';
import { ReferenceBlockInspector } from './Inspector/ReferenceBlockInspector';

// Tab value constants for type safety and consistency
const TAB_VALUES = {
  BLOCKS: 'blocks',
  PROPERTIES: 'properties',
} as const;

type TabValue = (typeof TAB_VALUES)[keyof typeof TAB_VALUES];

// Block types data (copied from BlockPalette to avoid circular dependency)
const blockTypes: BlockType[] = [
  // Content Blocks
  {
    id: 'textBlock',
    label: 'Text & Headings',
    icon: Type,
    category: 'content',
    description: 'Rich text content with formatting and heading levels (H1-H4)',
  },
  {
    id: 'quoteBlock',
    label: 'Quote',
    icon: Quote,
    category: 'content',
    description: 'Highlighted quotes and citations',
  },

  // Media Blocks
  {
    id: 'imageBlock',
    label: 'Image',
    icon: Image,
    category: 'media',
    description: 'Images with captions and styling',
  },
  {
    id: 'videoEmbedBlock',
    label: 'Video',
    icon: Video,
    category: 'media',
    description: 'YouTube and Vimeo embeds',
  },

  // Data Blocks
  {
    id: 'tableBlock',
    label: 'Table',
    icon: Table,
    category: 'data',
    description: 'Data tables with sorting',
  },
  {
    id: 'pollBlock',
    label: 'Poll',
    icon: BarChart,
    category: 'interactive',
    description: 'Interactive polls and surveys',
  },

  // EVIDENS Blocks
  {
    id: 'keyTakeawayBlock',
    label: 'Key Takeaway',
    icon: Lightbulb,
    category: 'evidens',
    description: 'Important insights and highlights',
  },
  {
    id: 'referenceBlock',
    label: 'Reference',
    icon: FileText,
    category: 'evidens',
    description: 'Academic citations and references',
  },

  // Visual Blocks
  {
    id: 'separatorBlock',
    label: 'Separator',
    icon: Minus,
    category: 'visual',
    description: 'Section dividers',
  },
];

const categoryLabels = {
  content: 'Content',
  media: 'Media',
  data: 'Data',
  interactive: 'Interactive',
  evidens: 'EVIDENS',
  visual: 'Visual',
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

interface EditorSidebarProps {
  className?: string;
}

export function EditorSidebar({ className }: EditorSidebarProps) {
  const { selectedNodeId, nodes, updateNode } = useEditorStore();

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  /**
   * Tab state management with user override tracking
   * - activeTab: Currently selected tab ('blocks' | 'properties')
   * - userOverride: Prevents auto-switching when user manually selects a tab
   */
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_VALUES.BLOCKS);
  const [userOverride, setUserOverride] = useState(false);

  /**
   * Auto-switch to Properties tab when block is first selected
   * Only switches if:
   * - A block is selected
   * - Currently on Blocks tab
   * - User hasn't manually overridden tab selection
   */
  React.useEffect(() => {
    if (selectedNode && activeTab === TAB_VALUES.BLOCKS && !userOverride) {
      setActiveTab(TAB_VALUES.PROPERTIES);
    }
  }, [selectedNode, activeTab, userOverride]);

  /**
   * Reset user override when no block is selected
   * This allows auto-switching to resume for future block selections
   */
  React.useEffect(() => {
    if (!selectedNode) {
      setUserOverride(false);
    }
  }, [selectedNode]);

  /**
   * Handle manual tab changes from user clicks
   * Sets override flag to prevent auto-switching until block is deselected
   */
  const handleTabChange = React.useCallback((value: string) => {
    setActiveTab(value as TabValue);
    setUserOverride(true);
  }, []);

  // Handle property updates for non-textBlock nodes
  const handleBackgroundChange = React.useCallback(
    (updates: Record<string, any>) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, ...updates },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleSpacingChange = React.useCallback(
    (updates: Record<string, any>) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, ...updates },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  return (
    <div
      className={cn('bg-muted/30 flex flex-col h-full editor-sidebar', className)}
      data-inspector="true"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="border-b px-4 py-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={TAB_VALUES.BLOCKS} className="flex items-center gap-2 text-xs">
              <Blocks size={14} />
              Blocks
            </TabsTrigger>
            <TabsTrigger
              value={TAB_VALUES.PROPERTIES}
              className="flex items-center gap-2 text-xs"
              disabled={!selectedNode}
            >
              <Settings2 size={14} />
              Properties
              {selectedNode && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                  1
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {/* Blocks Tab - Embedded block palette content */}
          <TabsContent value={TAB_VALUES.BLOCKS} className="h-full m-0 p-0">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.entries(
                  blockTypes.reduce(
                    (acc, block) => {
                      if (!acc[block.category]) {
                        acc[block.category] = [];
                      }
                      acc[block.category].push(block);
                      return acc;
                    },
                    {} as Record<string, BlockType[]>
                  )
                ).map(([category, blocks]) => (
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
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value={TAB_VALUES.PROPERTIES} className="h-full m-0 p-0">
            <div className="h-full flex flex-col">
              {selectedNode ? (
                <>
                  {/* Properties Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {/* Block-Specific Inspectors */}
                    {selectedNode.type === 'textBlock' && (
                      <TextBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'tableBlock' && (
                      <TableBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'quoteBlock' && (
                      <QuoteBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'videoEmbedBlock' && (
                      <VideoEmbedBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'separatorBlock' && (
                      <SeparatorBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'imageBlock' && (
                      <ImageBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'pollBlock' && (
                      <PollBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'keyTakeawayBlock' && (
                      <KeyTakeawayBlockInspector nodeId={selectedNode.id} />
                    )}

                    {selectedNode.type === 'referenceBlock' && (
                      <ReferenceBlockInspector nodeId={selectedNode.id} />
                    )}

                    {/* Fallback for block types without dedicated inspectors */}
                    {![
                      'textBlock',
                      'tableBlock',
                      'quoteBlock',
                      'videoEmbedBlock',
                      'separatorBlock',
                      'imageBlock',
                      'pollBlock',
                      'keyTakeawayBlock',
                      'referenceBlock',
                    ].includes(selectedNode.type) && (
                      <div className="space-y-6">
                        {/* Colors Section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Palette size={14} className="text-muted-foreground" />
                            <Label className="text-sm font-medium">Colors & Background</Label>
                          </div>
                          <BackgroundControls
                            data={selectedNode.data}
                            onChange={handleBackgroundChange}
                            enableImage={true}
                            compact={true}
                            className="space-y-3"
                            colorKey="backgroundColor"
                            imageKey="backgroundImage"
                            defaultColor="transparent"
                          />
                        </div>

                        {/* Spacing Section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Move size={14} className="text-muted-foreground" />
                            <Label className="text-sm font-medium">Spacing & Layout</Label>
                          </div>
                          <SpacingControls
                            data={selectedNode.data}
                            onChange={handleSpacingChange}
                            compact={true}
                            className="space-y-3"
                            enablePresets={true}
                            enableBorders={false}
                            showDetailedControls={false}
                          />
                        </div>

                        {/* Block-Specific Settings Placeholder */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Settings2 size={14} className="text-muted-foreground" />
                            <Label className="text-sm font-medium">Block Settings</Label>
                          </div>

                          <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
                            <div className="text-center text-xs text-muted-foreground">
                              {selectedNode.type
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())}{' '}
                              inspector coming soon
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // No Selection State
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <Settings2 size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      No Block Selected
                    </h3>
                    <p className="text-xs text-muted-foreground/70">
                      Select a block on the canvas to edit its properties
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
