// ABOUTME: Main Visual Composition Engine editor page with React Flow 2D canvas and three-panel workspace

import React from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { ReactFlowProvider } from '@xyflow/react';
import { useEditorStore } from '@/store/editorStore';
import { BlockPalette } from '@/components/editor/BlockPalette';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { InspectorPanel } from '@/components/editor/InspectorPanel';
import { Button } from '@/components/ui/button';
import { getDefaultDataForBlockType } from '@/types/editor';
import { useEditorSaveMutation, useEditorLoadQuery } from '../../packages/hooks/useEditorPersistence';

export default function EditorPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const { 
    loadFromDatabase, 
    saveToDatabase, 
    addNode, 
    isSaving, 
    isDirty,
    lastSaved,
    isFullscreen,
    setPersistenceCallbacks
  } = useEditorStore();

  // Set up persistence hooks
  const saveMutation = useEditorSaveMutation();
  const { data: loadedData } = useEditorLoadQuery(reviewId);

  // Configure persistence callbacks
  React.useEffect(() => {
    setPersistenceCallbacks({
      save: async (reviewId, content) => {
        return saveMutation.mutateAsync({ reviewId, structuredContent: content });
      },
      load: async (reviewId) => {
        // Return the loaded data from the query
        return loadedData;
      }
    });
  }, [setPersistenceCallbacks, saveMutation, loadedData]);

  React.useEffect(() => {
    if (reviewId) {
      loadFromDatabase(reviewId);
    }
  }, [reviewId, loadFromDatabase]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    
    if (over && over.id === 'editor-canvas') {
      const dragData = active.data.current;
      
      if (dragData?.type === 'block') {
        const blockType = dragData.blockType;
        
        // Calculate drop position - use delta to determine where the block should be placed
        // Default positioning with offset based on existing blocks to avoid overlap
        const currentBlockCount = useEditorStore.getState().nodes.length;
        const defaultX = 100 + (currentBlockCount * 50); // Offset each new block
        const defaultY = 100 + (currentBlockCount * 80);
        
        // Create the node first
        const newNode = {
          type: blockType,
          data: getDefaultDataForBlockType(blockType)
        };
        
        addNode(newNode);
        
        // The positioning will be handled by the React Flow canvas automatically
        // through the layout system we implemented
      }
    }
  };

  const handleSave = async () => {
    try {
      await saveToDatabase();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-background">
        {/* Editor Header */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">Visual Composition Engine</h1>
            <span className="text-sm text-muted-foreground">
              Review ID: {reviewId}
            </span>
            {isDirty && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-muted-foreground">
              Last saved: {formatLastSaved(lastSaved)}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="outline">
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Three-Panel Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {!isFullscreen && <BlockPalette />}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <EditorCanvas />
            </ReactFlowProvider>
          </div>
          {!isFullscreen && <InspectorPanel />}
        </div>
      </div>
    </DndContext>
  );
}