// ABOUTME: Simplified left sidebar showing Rich Block properties directly (no tabs needed since only one block type exists)

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Settings2, Edit3 } from 'lucide-react';
import { RichBlockInspector } from './Inspector/RichBlockInspector';

interface EditorSidebarProps {
  className?: string;
}

export const EditorSidebar = React.memo(function EditorSidebar({
  className,
}: EditorSidebarProps) {
  const { selectedNodeId, nodes, addNode } = useEditorStore();
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Add Rich Block handler - since there's only one block type, make it simple
  const handleAddRichBlock = React.useCallback(() => {
    addNode({
      type: 'richBlock',
      x: 100,
      y: 100,
      width: 600,
      height: 200,
      data: {
        content: { htmlContent: '<p>Start typing...</p>' },
        backgroundColor: 'transparent',
        paddingX: 16,
        paddingY: 16,
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      },
    });
  }, [addNode]);

  return (
    <div
      className={cn('bg-muted/30 flex flex-col h-full editor-sidebar', className)}
      data-inspector="true"
    >
      {/* Simplified header with Add Rich Block button */}
      <div className="border-b px-4 py-3">
        <Button
          onClick={handleAddRichBlock}
          className="w-full flex items-center gap-2 text-sm"
          variant="outline"
        >
          <Plus size={16} />
          Add Rich Block
        </Button>
      </div>

      {/* Always show properties directly - no tabs needed */}
      <div className="flex-1 overflow-hidden">
        {selectedNode ? (
          <div className="h-full flex flex-col">
            {/* Header for selected block */}
            <div className="px-4 py-3 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-primary" />
                <span className="text-sm font-medium">Rich Block Properties</span>
              </div>
            </div>
            
            {/* Properties Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <RichBlockInspector nodeId={selectedNode.id} />
            </div>
          </div>
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
    </div>
  );
});