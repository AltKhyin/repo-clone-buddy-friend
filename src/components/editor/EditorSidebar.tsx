// ABOUTME: Simplified left sidebar showing Rich Block properties directly (no tabs needed since only one block type exists)

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Settings2, Edit3, ChevronDown, Trash2 } from 'lucide-react';
import { RichBlockInspector } from './Inspector/RichBlockInspector';
import { getPresetsBy, recordPresetUsage, removeBlockPreset, type BlockPreset } from '@/types/editor';

interface EditorSidebarProps {
  className?: string;
}

export const EditorSidebar = React.memo(function EditorSidebar({
  className,
}: EditorSidebarProps) {
  const { selectedNodeId, nodes, addNode } = useEditorStore();
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  
  // State for saved presets
  const [savedPresets, setSavedPresets] = useState<BlockPreset[]>([]);

  // Load saved presets on mount
  useEffect(() => {
    const loadPresets = () => {
      const presets = getPresetsBy('recent');
      setSavedPresets(presets);
    };
    
    loadPresets();
    
    // Listen for localStorage changes to refresh presets
    const handleStorageChange = () => {
      loadPresets();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Add preset block handler
  const handleAddPresetBlock = React.useCallback((preset: BlockPreset) => {
    recordPresetUsage(preset.metadata.id);
    addNode({
      type: 'richBlock',
      x: 120,
      y: 120,
      width: 600,
      height: 200,
      data: preset.blockData,
    });
  }, [addNode]);

  // Delete preset handler
  const handleDeletePreset = React.useCallback((presetId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent dropdown item click
    removeBlockPreset(presetId);
    // Refresh presets list
    const updatedPresets = getPresetsBy('recent');
    setSavedPresets(updatedPresets);
  }, []);

  return (
    <div
      className={cn('bg-muted/30 flex flex-col h-full editor-sidebar', className)}
      data-inspector="true"
    >
      {/* Header with Add Rich Block buttons */}
      <div className="border-b px-4 py-3 space-y-2">
        <Button
          onClick={handleAddRichBlock}
          className="w-full flex items-center gap-2 text-sm"
          variant="outline"
        >
          <Plus size={16} />
          Add Rich Block
        </Button>
        
        {/* Add Custom Rich Block dropdown */}
        {savedPresets.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full flex items-center gap-2 text-sm"
                variant="outline"
              >
                <Edit3 size={16} />
                Add Custom Rich Block
                <ChevronDown size={14} className="ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {savedPresets.map((preset) => (
                <DropdownMenuItem
                  key={preset.metadata.id}
                  onClick={() => handleAddPresetBlock(preset)}
                  className="flex items-center gap-2 group"
                >
                  <Edit3 size={14} />
                  <span className="truncate flex-1">{preset.metadata.name}</span>
                  <div className="flex items-center gap-1">
                    {preset.metadata.useCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {preset.metadata.useCount}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeletePreset(preset.metadata.id, e)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      title={`Delete "${preset.metadata.name}"`}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            disabled
            className="w-full flex items-center gap-2 text-sm"
            variant="outline"
          >
            <Edit3 size={16} />
            Add Custom Rich Block
            <span className="text-xs text-muted-foreground ml-auto">(No saved blocks)</span>
          </Button>
        )}
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