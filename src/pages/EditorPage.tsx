// ABOUTME: Main Visual Composition Engine editor page with React Flow 2D canvas and three-panel workspace

import React from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { ReactFlowProvider } from '@xyflow/react';
import { useEditorStore } from '@/store/editorStore';
import { BlockPalette } from '@/components/editor/BlockPalette';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { TopToolbar } from '@/components/editor/TopToolbar';
import { InlineCustomizationToolbar } from '@/components/editor/InlineCustomizationToolbar';
import { InspectorPanel } from '@/components/editor/Inspector/InspectorPanel';
import { PersistenceIndicator } from '@/components/editor/PersistenceIndicator';
import { BackupRecoveryDialog } from '@/components/editor/BackupRecoveryDialog';
import { KeyboardShortcutsPanel } from '@/components/editor/KeyboardShortcutsPanel';
import { useEnhancedPersistence } from '@/hooks/useEnhancedPersistence';
import { useCrashRecovery } from '@/hooks/useCrashRecovery';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
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
    isInspectorVisible,
    setPersistenceCallbacks,
    handleFullscreenChange,
    nodes,
    layouts,
    exportToJSON,
    loadFromJSON
  } = useEditorStore();

  // Set up persistence hooks
  const saveMutation = useEditorSaveMutation();
  const { data: loadedData } = useEditorLoadQuery(reviewId);

  // Enhanced persistence system
  const currentContent = React.useMemo(() => {
    if (!nodes.length && !Object.keys(layouts.desktop.items).length) return null;
    return exportToJSON();
  }, [nodes, layouts, exportToJSON]);

  const { state: persistenceState, actions: persistenceActions } = useEnhancedPersistence(
    reviewId,
    currentContent,
    isDirty
  );

  // Crash recovery system
  const { state: recoveryState, actions: recoveryActions } = useCrashRecovery(reviewId);
  const [showRecoveryDialog, setShowRecoveryDialog] = React.useState(false);

  // Initialize keyboard shortcuts
  const { showShortcutsPanel, setShowShortcutsPanel } = useKeyboardShortcuts();

  // Configure persistence callbacks once when component mounts or reviewId changes
  React.useEffect(() => {
    setPersistenceCallbacks({
      save: async (reviewId: string, content: any) => {
        return saveMutation.mutateAsync({ reviewId, structuredContent: content });
      },
      load: async (reviewId: string) => {
        // Return the current loaded data from the query
        return loadedData;
      }
    });
  }, [reviewId]); // Only depend on reviewId to avoid infinite loops

  React.useEffect(() => {
    if (reviewId) {
      loadFromDatabase(reviewId);
    }
  }, [reviewId, loadFromDatabase]);

  // Set up fullscreen event listeners
  React.useEffect(() => {
    const handleFullscreenChangeEvent = () => {
      handleFullscreenChange();
    };

    // Add event listeners for all browsers
    document.addEventListener('fullscreenchange', handleFullscreenChangeEvent);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChangeEvent);
    document.addEventListener('mozfullscreenchange', handleFullscreenChangeEvent);
    document.addEventListener('MSFullscreenChange', handleFullscreenChangeEvent);

    return () => {
      // Clean up event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChangeEvent);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChangeEvent);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChangeEvent);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChangeEvent);
    };
  }, [handleFullscreenChange]);

  // Show recovery dialog when backup is detected
  React.useEffect(() => {
    if (recoveryState.hasBackup && !showRecoveryDialog) {
      setShowRecoveryDialog(true);
    }
  }, [recoveryState.hasBackup, showRecoveryDialog]);

  // Handle backup recovery
  const handleRecovery = (recoveredContent: any) => {
    try {
      loadFromJSON(recoveredContent);
      console.log('Successfully restored from backup');
    } catch (error) {
      console.error('Failed to load recovered content:', error);
    }
  };

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
      <div className={`flex flex-col bg-background ${isFullscreen ? 'h-screen w-screen fixed inset-0 z-50' : 'h-screen'}`}>
        {/* Editor Header - Hide in fullscreen mode */}
        {!isFullscreen && (
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
              {/* Enhanced Persistence Indicator */}
              <PersistenceIndicator 
                state={persistenceState}
                actions={persistenceActions}
              />
              
              <Button size="sm" variant="outline">
                Export
              </Button>
            </div>
          </div>
        )}

        {/* Top Toolbar */}
        <TopToolbar />

        {/* Three-Panel Workspace (Palette + Canvas + Inspector) */}
        <div className="flex-1 flex overflow-hidden">
          <BlockPalette />
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <EditorCanvas />
            </ReactFlowProvider>
          </div>
          {isInspectorVisible && <InspectorPanel />}
        </div>

        {/* Inline Customization Toolbar */}
        <InlineCustomizationToolbar />

        {/* Backup Recovery Dialog */}
        <BackupRecoveryDialog
          open={showRecoveryDialog}
          onOpenChange={setShowRecoveryDialog}
          state={recoveryState}
          actions={recoveryActions}
          onRecover={handleRecovery}
          reviewId={reviewId || ''}
        />

        {/* Keyboard Shortcuts Help Panel */}
        <KeyboardShortcutsPanel
          open={showShortcutsPanel}
          onOpenChange={setShowShortcutsPanel}
        />
      </div>
    </DndContext>
  );
}