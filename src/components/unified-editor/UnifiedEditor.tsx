// ABOUTME: Main unified editor component orchestrating canvas, blocks, and toolbar for the EVIDENS rich content editor

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useUnifiedEditorStore, useEditorActions } from '@/store/unifiedEditorStore';
import { EditorCanvas } from './EditorCanvas';
import type { JSONContent } from '@tiptap/react';
import type { RichContentBlock } from '@/types/unified-editor';

interface UnifiedEditorProps {
  // Content Management
  initialContent?: RichContentBlock[];
  onContentChange?: (blocks: RichContentBlock[]) => void;
  onSave?: (blocks: RichContentBlock[]) => Promise<void>;

  // Editor Configuration
  readOnly?: boolean;
  className?: string;

  // Event Handlers
  onBlockCreate?: (blockId: string) => void;
  onBlockDelete?: (blockId: string) => void;
  onBlockSelect?: (blockIds: string[]) => void;

  // UI Configuration
  showToolbar?: boolean;
  showMinimap?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  initialContent = [],
  onContentChange,
  onSave,
  readOnly = false,
  className,
  onBlockCreate,
  onBlockDelete,
  onBlockSelect,
  showToolbar = true,
  showMinimap = false,
  autoSave = true,
  autoSaveInterval = 5000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout>();

  const blocks = useUnifiedEditorStore(state => state.blocks);
  const selection = useUnifiedEditorStore(state => state.selection);
  const actions = useEditorActions();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Initialize editor with initial content
    if (initialContent.length > 0 && blocks.length === 0) {
      // Clear existing blocks and load initial content
      // Note: This would typically be handled by a loadContent action
      console.log('Loading initial content:', initialContent.length, 'blocks');

      // For now, we'll create blocks based on initial content
      initialContent.forEach(block => {
        const blockId = actions.createBlock(block.position, block.content.tiptapJSON);
        // Update the created block with the full data
        actions.updateBlock(blockId, {
          dimensions: block.dimensions,
          styling: block.styling,
          metadata: block.metadata,
        });
      });
    }
  }, [initialContent, blocks.length, actions]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleBlockCreate = useCallback(
    (blockId: string) => {
      onBlockCreate?.(blockId);
    },
    [onBlockCreate]
  );

  const handleAutoSave = useCallback(async () => {
    if (onSave && blocks.length > 0) {
      try {
        await onSave(blocks);
        console.log('Auto-saved', blocks.length, 'blocks');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [onSave, blocks]);

  // ============================================================================
  // CONTENT CHANGE TRACKING
  // ============================================================================

  useEffect(() => {
    // Notify parent component of content changes
    onContentChange?.(blocks);

    // Setup auto-save
    if (autoSave && !readOnly) {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }

      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [blocks, autoSave, autoSaveInterval, readOnly, onContentChange, handleAutoSave]);

  // ============================================================================
  // SELECTION CHANGE TRACKING
  // ============================================================================

  useEffect(() => {
    // Notify parent component of selection changes
    const selectedIds = [...(selection.primary ? [selection.primary] : []), ...selection.secondary];
    onBlockSelect?.(selectedIds);
  }, [selection, onBlockSelect]);

  const handleManualSave = useCallback(async () => {
    if (onSave) {
      try {
        await onSave(blocks);
        // Show success feedback
        console.log('Manual save successful');
      } catch (error) {
        console.error('Manual save failed:', error);
        // Show error feedback
      }
    }
  }, [onSave, blocks]);

  // ============================================================================
  // KEYBOARD SHORTCUTS (GLOBAL)
  // ============================================================================

  const handleGlobalKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Global editor shortcuts

      // Save shortcut
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }

      // Undo/Redo (future implementation)
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        if (event.shiftKey) {
          // Redo
          console.log('Redo (not implemented yet)');
        } else {
          // Undo
          console.log('Undo (not implemented yet)');
        }
        event.preventDefault();
      }

      // Delete selected blocks
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedIds = [
          ...(selection.primary ? [selection.primary] : []),
          ...selection.secondary,
        ];

        if (selectedIds.length > 0) {
          // Only delete if no block is currently focused (editing)
          const focusedBlockId = useUnifiedEditorStore.getState().interaction.focusedBlockId;
          const isEditorFocused = document.activeElement?.classList.contains('ProseMirror');

          if (!focusedBlockId || !isEditorFocused) {
            event.preventDefault();
            selectedIds.forEach(blockId => {
              actions.deleteBlock(blockId);
              onBlockDelete?.(blockId);
            });
          }
        }
      }

      // Copy/Paste (future implementation)
      if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
        // Copy selected blocks
        console.log('Copy blocks (not implemented yet)');
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
        // Paste blocks
        console.log('Paste blocks (not implemented yet)');
      }
    },
    [selection, actions, onBlockDelete, handleManualSave]
  );

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      // Clear auto-save timer on unmount
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, []);

  // ============================================================================
  // COMPONENT METHODS (for external control)
  // ============================================================================

  const getEditorAPI = useCallback(() => {
    return {
      // Content operations
      getBlocks: () => blocks,
      createBlock: actions.createBlock,
      deleteBlock: actions.deleteBlock,
      updateBlock: actions.updateBlock,

      // Selection operations
      selectBlock: actions.selectBlock,
      clearSelection: actions.clearSelection,
      getSelection: () => selection,

      // Canvas operations
      setZoom: actions.setZoom,
      setViewport: actions.setViewport,
      toggleGrid: actions.toggleGrid,

      // Content operations
      save: handleManualSave,
      exportToJSON: () => blocks,
      importFromJSON: (data: RichContentBlock[]) => {
        // Clear existing content and load new data
        blocks.forEach(block => actions.deleteBlock(block.id));
        data.forEach(block => {
          const blockId = actions.createBlock(block.position, block.content.tiptapJSON);
          actions.updateBlock(blockId, {
            dimensions: block.dimensions,
            styling: block.styling,
            metadata: block.metadata,
          });
        });
      },
    };
  }, [blocks, actions, selection, handleManualSave]);

  // Expose API via ref if needed
  React.useImperativeHandle(React.createRef(), getEditorAPI, [getEditorAPI]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={containerRef}
      className={cn(
        'unified-editor',
        'relative',
        'w-full',
        'h-full',
        'bg-white',
        'overflow-hidden',
        'select-none',
        {
          'cursor-not-allowed': readOnly,
        },
        className
      )}
      onKeyDown={handleGlobalKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Unified Rich Content Editor"
    >
      {/* Main Editor Canvas */}
      <div className="editor-main flex-1 h-full">
        <EditorCanvas onBlockCreate={handleBlockCreate} readOnly={readOnly} className="h-full" />
      </div>

      {/* Floating Toolbar (Future Implementation) */}
      {showToolbar && !readOnly && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          {/* Contextual toolbar will be implemented in Phase 3 */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 text-sm text-gray-500">
            Contextual toolbar (coming soon)
          </div>
        </div>
      )}

      {/* Minimap (Future Implementation) */}
      {showMinimap && (
        <div className="absolute bottom-4 right-4 w-48 h-32 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
          <div className="p-2 text-xs text-gray-500">Minimap (coming soon)</div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-600 z-10 flex justify-between items-center">
        <div className="flex gap-4">
          <span>{blocks.length} blocks</span>
          {selection.primary || selection.secondary.length > 0 ? (
            <span>{(selection.primary ? 1 : 0) + selection.secondary.length} selected</span>
          ) : null}
        </div>

        <div className="flex gap-4">
          {autoSave && !readOnly && <span className="text-green-600">Auto-save enabled</span>}
          {readOnly && <span className="text-amber-600">Read-only mode</span>}
        </div>
      </div>

      {/* Loading Overlay (if needed) */}
      {/* This would be shown during save operations */}
    </div>
  );
};
