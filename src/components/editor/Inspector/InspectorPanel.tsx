// ABOUTME: Main inspector panel that displays context-aware controls for selected blocks

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { ContextAwareInspector } from './shared/ContextAwareInspector';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InspectorPanelProps {
  className?: string;
}

export const InspectorPanel = React.memo(function InspectorPanel({
  className,
}: InspectorPanelProps) {
  const { selectedNodeId, nodes, isInspectorVisible, toggleInspector } = useEditorStore();

  // Get selected node
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Don't render if inspector is hidden
  if (!isInspectorVisible) {
    return (
      <div className="fixed right-4 top-20 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleInspector}
          className="shadow-lg bg-background"
          title="Show Inspector"
        >
          <Eye size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className={`w-80 border-l bg-background flex flex-col ${className}`}>
      {/* Inspector Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          <h2 className="font-semibold">Inspector</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleInspector} title="Hide Inspector">
          <EyeOff size={16} />
        </Button>
      </div>

      {/* Inspector Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {selectedNode ? (
            <ContextAwareInspector nodeId={selectedNodeId!} compact={false} />
          ) : (
            <div className="text-center py-8">
              <Settings size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Block Selected</h3>
              <p className="text-sm text-muted-foreground">
                Select a block on the canvas to see its customization options.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Inspector Footer */}
      {selectedNode && (
        <>
          <Separator />
          <div className="p-4 border-t bg-muted/20">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium mb-1">Block Info</div>
              <div>Type: {selectedNode.type}</div>
              <div>ID: {selectedNode.id}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
