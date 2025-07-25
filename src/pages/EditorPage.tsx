// ABOUTME: Main Visual Composition Engine editor page with WYSIWYG constrained 2D canvas and three-panel workspace

import React from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { useEditorStore } from '@/store/editorStore';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { WYSIWYGCanvas } from '@/components/editor/WYSIWYGCanvas';
import { UnifiedToolbar } from '@/components/editor/UnifiedToolbar';
import { PersistenceIndicator } from '@/components/editor/PersistenceIndicator';
import { HistoryIndicator } from '@/components/editor/HistoryIndicator';
import { BackupRecoveryDialog } from '@/components/editor/BackupRecoveryDialog';
import { useEnhancedPersistence } from '@/hooks/useEnhancedPersistence';
import { useCrashRecovery } from '@/hooks/useCrashRecovery';
import { Button } from '@/components/ui/button';
import { getDefaultDataForBlockType } from '@/types/editor';
import { ArrowLeft } from 'lucide-react';
import {
  useEditorSaveMutation,
  useEditorLoadQuery,
} from '../../packages/hooks/useEditorPersistence';
import { supabase } from '@/integrations/supabase/client';
import { validateStructuredContent } from '@/types/editor';
import { Link } from 'react-router-dom';
import {
  EditorPageErrorBoundary,
  BlockPaletteErrorBoundary,
  EditorCanvasErrorBoundary,
} from '@/components/editor/error-boundaries';

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
    setPersistenceCallbacks,
    nodes,
    positions,
    exportToJSON,
    loadFromJSON,
  } = useEditorStore();

  // Set up persistence hooks
  const queryClient = useQueryClient();
  const saveMutation = useEditorSaveMutation();
  const { data: loadedData } = useEditorLoadQuery(reviewId);

  // Enhanced persistence system
  const currentContent = React.useMemo(() => {
    if (!nodes.length) return null;

    // Check if there are any positioned nodes
    try {
      const hasPositionedNodes = Object.keys(positions).length > 0;
      if (!hasPositionedNodes) return null;

      return exportToJSON();
    } catch (error) {
      console.error('[EditorPage] Error checking positions:', error);
      return null;
    }
  }, [nodes, positions, exportToJSON]);

  const { state: persistenceState, actions: persistenceActions } = useEnhancedPersistence(
    reviewId,
    currentContent,
    isDirty
  );

  // Crash recovery system
  const { state: recoveryState, actions: recoveryActions } = useCrashRecovery(reviewId);
  const [showRecoveryDialog, setShowRecoveryDialog] = React.useState(false);

  // Configure DndKit sensors for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    })
  );

  // Configure persistence callbacks with stable references to prevent infinite loops
  const saveCallback = React.useCallback(
    async (reviewId: string, content: any) => {
      return saveMutation.mutateAsync({ reviewId, structuredContent: content });
    },
    [saveMutation.mutateAsync]
  );

  const loadCallback = React.useCallback(async (reviewId: string) => {
    // Directly query the database instead of relying on stale cached data
    // This ensures we always get fresh data and avoid race conditions

    if (!reviewId) {
      return null;
    }

    // Convert reviewId to number at database boundary
    const numericReviewId = parseInt(reviewId, 10);
    if (isNaN(numericReviewId)) {
      console.error('[EditorPage] Invalid reviewId:', reviewId);
      throw new Error(`Invalid reviewId: ${reviewId}`);
    }

    try {
      const { data, error } = await supabase
        .from('review_editor_content')
        .select('*')
        .eq('review_id', numericReviewId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No editor content exists yet - this is fine for new reviews
          return null;
        }
        console.error('[EditorPage] Database error loading content:', error);
        throw new Error(`Failed to load editor content: ${error.message}`);
      }

      // Validate the loaded content
      if (data?.structured_content) {
        try {
          const validatedContent = validateStructuredContent(data.structured_content);

          return {
            ...data,
            structured_content: validatedContent,
          };
        } catch (validationError) {
          console.error('[EditorPage] Content validation failed:', validationError);
          throw new Error(`Invalid editor content format: ${validationError}`);
        }
      }

      return null;
    } catch (error) {
      console.error('[EditorPage] Failed to load from database:', error);
      throw error;
    }
  }, []);

  const persistenceCallbacks = React.useMemo(
    () => ({
      save: saveCallback,
      load: loadCallback,
    }),
    [saveCallback, loadCallback]
  );

  // Set persistence callbacks first, then load data to avoid race conditions
  React.useEffect(() => {
    setPersistenceCallbacks(persistenceCallbacks);
  }, [setPersistenceCallbacks, persistenceCallbacks]);

  // Load data from database - ensure callbacks are set before loading
  React.useEffect(() => {
    if (reviewId && persistenceCallbacks.load) {
      loadFromDatabase(reviewId).catch(error => {
        console.error('[EditorPage] Failed to load review data:', error);
      });
    }
  }, [reviewId, persistenceCallbacks.load, loadFromDatabase]);

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
    } catch (error) {
      console.error('Failed to load recovered content:', error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'wysiwyg-canvas') {
      const dragData = active.data.current;

      if (dragData?.type === 'block') {
        const blockType = dragData.blockType;

        // Create the node - positioning will be handled automatically by the store
        const newNode = {
          type: blockType,
          data: getDefaultDataForBlockType(blockType),
        };

        addNode(newNode);
        console.log('✅ Block added successfully:', blockType);
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
    <EditorPageErrorBoundary>
      {/* Global CSS for editor fullscreen */}
      <style>{`
        .editor-fullscreen {
          overflow: hidden !important;
        }
        .editor-fullscreen .fixed {
          display: none !important;
        }
      `}</style>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div
          className={`flex flex-col bg-background overflow-hidden ${isFullscreen ? 'h-screen w-screen fixed inset-0 z-50' : 'h-screen'}`}
        >
          {/* Editor Header - Hide in fullscreen mode */}
          {!isFullscreen && (
            <div className="h-14 border-b flex items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                {/* Back to Management Navigation */}
                <Link to={`/admin/review/${reviewId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Management
                  </Button>
                </Link>
                <div className="h-4 w-px bg-gray-300" />
                <h1 className="text-lg font-semibold">Content Editor</h1>
                <span className="text-sm text-muted-foreground">Review ID: {reviewId}</span>
                {isDirty && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Unsaved changes
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Enhanced Persistence Indicator with Save functionality */}
                <PersistenceIndicator state={persistenceState} actions={persistenceActions} />

                {/* File Operations - Consolidated from UnifiedToolbar */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      try {
                        const data = exportToJSON();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `review-${reviewId}-content.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Export failed:', error);
                      }
                    }}
                    className="flex items-center gap-2"
                    title="Export as JSON"
                  >
                    Export
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (reviewId) {
                        window.open(`/reviews/${reviewId}`, '_blank');
                      }
                    }}
                    disabled={!reviewId}
                    className="flex items-center gap-2"
                    title="View live preview"
                  >
                    View Live
                  </Button>
                </div>

                {/* History Indicator - Add to header for centralized controls */}
                <HistoryIndicator compact={true} />
              </div>
            </div>
          )}

          {/* Unified Toolbar - All editing functionality consolidated */}
          <div className="flex-shrink-0 sticky top-0 z-50">
            <UnifiedToolbar />
          </div>

          {/* Two-Panel Workspace (Sidebar + Canvas) - Canvas scrolls independently */}
          <div className="flex-1 flex overflow-hidden">
            <div className="w-64 overflow-y-auto border-r">
              <BlockPaletteErrorBoundary>
                <EditorSidebar />
              </BlockPaletteErrorBoundary>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EditorCanvasErrorBoundary>
                <WYSIWYGCanvas />
              </EditorCanvasErrorBoundary>
            </div>
          </div>

          {/* Backup Recovery Dialog */}
          <BackupRecoveryDialog
            open={showRecoveryDialog}
            onOpenChange={setShowRecoveryDialog}
            state={recoveryState}
            actions={recoveryActions}
            onRecover={handleRecovery}
            reviewId={reviewId || ''}
          />
        </div>
      </DndContext>
    </EditorPageErrorBoundary>
  );
}
