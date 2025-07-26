// ABOUTME: Unified rich content block with TipTap editor, drag/resize, and safe-zone interaction

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  useUnifiedEditorStore,
  useEditorActions,
  useIsBlockSelected,
} from '@/store/unifiedEditorStore';
import { useTheme } from '@/components/theme/CustomThemeProvider';
import { UnifiedTipTapEditor } from './UnifiedTipTapEditor';
import {
  InteractionZone,
  type RichContentBlock,
  type Point,
  type DragHandle,
} from '@/types/unified-editor';

interface RichContentBlockProps {
  block: RichContentBlock;
  isPreview?: boolean;
  className?: string;
}

export const RichContentBlock: React.FC<RichContentBlockProps> = ({
  block,
  isPreview = false,
  className,
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const actions = useEditorActions();
  const isSelected = useIsBlockSelected(block.id);
  const focusedBlockId = useUnifiedEditorStore(state => state.interaction.focusedBlockId);
  const isFocused = focusedBlockId === block.id;

  // Global theme integration
  const { theme: globalTheme } = useTheme();

  // ============================================================================
  // SAFE ZONE DETECTION
  // ============================================================================

  const classifyInteractionZone = useCallback((event: React.MouseEvent): InteractionZone => {
    if (!blockRef.current) return InteractionZone.OUTSIDE;

    const rect = blockRef.current.getBoundingClientRect();
    const { clientX, clientY } = event;
    const { RESIZE_CORNER_SIZE, HANDLE_WIDTH, SAFE_ZONE_PADDING } =
      useUnifiedEditorStore.getState().config.safeZone;

    // Check if click is outside block entirely
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return InteractionZone.OUTSIDE;
    }

    // Check resize corners first (highest priority)
    const cornerSize = RESIZE_CORNER_SIZE;
    const isTopLeft = clientX <= rect.left + cornerSize && clientY <= rect.top + cornerSize;
    const isTopRight = clientX >= rect.right - cornerSize && clientY <= rect.top + cornerSize;
    const isBottomLeft = clientX <= rect.left + cornerSize && clientY >= rect.bottom - cornerSize;
    const isBottomRight = clientX >= rect.right - cornerSize && clientY >= rect.bottom - cornerSize;

    if (isTopLeft || isTopRight || isBottomLeft || isBottomRight) {
      return InteractionZone.RESIZE_HANDLE;
    }

    // Check drag handles (border areas)
    const isInBorder =
      clientX <= rect.left + HANDLE_WIDTH ||
      clientX >= rect.right - HANDLE_WIDTH ||
      clientY <= rect.top + HANDLE_WIDTH ||
      clientY >= rect.bottom - HANDLE_WIDTH;

    if (isInBorder) {
      return InteractionZone.DRAG_HANDLE;
    }

    // Check if in editor content area (safe zone)
    const editorElement = blockRef.current.querySelector('.ProseMirror');
    if (editorElement) {
      const editorRect = editorElement.getBoundingClientRect();
      const safeZone = {
        left: editorRect.left + SAFE_ZONE_PADDING,
        right: editorRect.right - SAFE_ZONE_PADDING,
        top: editorRect.top + SAFE_ZONE_PADDING,
        bottom: editorRect.bottom - SAFE_ZONE_PADDING,
      };

      const isInSafeZone =
        clientX >= safeZone.left &&
        clientX <= safeZone.right &&
        clientY >= safeZone.top &&
        clientY <= safeZone.bottom;

      if (isInSafeZone) {
        return InteractionZone.SAFE_ZONE;
      }
    }

    // Default to selection area
    return InteractionZone.SELECTION_AREA;
  }, []);

  // ============================================================================
  // DRAG AND RESIZE HANDLERS
  // ============================================================================

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview) return;

      const zone = classifyInteractionZone(event);

      if (zone === InteractionZone.SAFE_ZONE) {
        // Let TipTap handle the event
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // Select the block
      const isMultiSelect = event.metaKey || event.ctrlKey;
      const isRangeSelect = event.shiftKey;
      actions.selectBlock(block.id, { multiSelect: isMultiSelect, rangeSelect: isRangeSelect });

      if (zone === InteractionZone.DRAG_HANDLE || zone === InteractionZone.SELECTION_AREA) {
        // Start dragging
        setIsDragging(true);
        setDragStart({
          x: event.clientX - block.position.x,
          y: event.clientY - block.position.y,
        });
      } else if (zone === InteractionZone.RESIZE_HANDLE) {
        // Start resizing
        setIsResizing(true);
        setDragStart({ x: event.clientX, y: event.clientY });
      }
    },
    [block.id, block.position, actions, classifyInteractionZone, isPreview]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragStart) return;

      if (isDragging) {
        const newX = event.clientX - dragStart.x;
        const newY = event.clientY - dragStart.y;

        actions.updateBlock(block.id, {
          position: { x: newX, y: newY },
        });
      } else if (isResizing) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;

        // Only allow downward/rightward resizing for now
        const newWidth = Math.max(200, block.dimensions.width + deltaX);
        const newHeight = Math.max(100, block.dimensions.height + deltaY);

        actions.updateBlock(block.id, {
          dimensions: { width: newWidth, height: newHeight },
        });

        setDragStart({ x: event.clientX, y: event.clientY });
      }
    },
    [isDragging, isResizing, dragStart, actions, block.id, block.dimensions]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
  }, []);

  // Add global mouse move/up listeners when dragging/resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // ============================================================================
  // CURSOR MANAGEMENT
  // ============================================================================

  const handleMouseMoveForCursor = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview || isDragging || isResizing) return;

      const zone = classifyInteractionZone(event);
      const element = blockRef.current;
      if (!element) return;

      // Update cursor based on interaction zone
      switch (zone) {
        case InteractionZone.SAFE_ZONE:
          element.style.cursor = 'text';
          break;
        case InteractionZone.DRAG_HANDLE:
        case InteractionZone.SELECTION_AREA:
          element.style.cursor = 'move';
          break;
        case InteractionZone.RESIZE_HANDLE:
          // Determine specific resize cursor based on position
          const rect = element.getBoundingClientRect();
          const { clientX, clientY } = event;
          const cornerSize = useUnifiedEditorStore.getState().config.safeZone.RESIZE_CORNER_SIZE;

          if (clientX <= rect.left + cornerSize && clientY <= rect.top + cornerSize) {
            element.style.cursor = 'nw-resize';
          } else if (clientX >= rect.right - cornerSize && clientY <= rect.top + cornerSize) {
            element.style.cursor = 'ne-resize';
          } else if (clientX <= rect.left + cornerSize && clientY >= rect.bottom - cornerSize) {
            element.style.cursor = 'sw-resize';
          } else if (clientX >= rect.right - cornerSize && clientY >= rect.bottom - cornerSize) {
            element.style.cursor = 'se-resize';
          }
          break;
        default:
          element.style.cursor = 'default';
      }
    },
    [classifyInteractionZone, isPreview, isDragging, isResizing]
  );

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isSelected) return;

      // Block-level shortcuts (when block is selected but editor not focused)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!isFocused) {
          // Only delete if editor is not focused
          event.preventDefault();
          actions.deleteBlock(block.id);
        }
      }

      if (event.key === 'Escape') {
        actions.clearSelection();
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
        event.preventDefault();
        actions.duplicateBlock(block.id);
      }
    },
    [isSelected, isFocused, actions, block.id]
  );

  // ============================================================================
  // DOUBLE CLICK HANDLER
  // ============================================================================

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isPreview) return;

      const zone = classifyInteractionZone(event);
      if (zone !== InteractionZone.SAFE_ZONE) {
        // Double-click outside safe zone focuses the editor
        actions.focusBlock(block.id);

        // Focus the TipTap editor
        const editorElement = blockRef.current?.querySelector('.ProseMirror') as HTMLElement;
        if (editorElement) {
          editorElement.focus();
        }
      }
    },
    [actions, block.id, classifyInteractionZone, isPreview]
  );

  // ============================================================================
  // COMPONENT STYLES WITH THEME INTEGRATION
  // ============================================================================

  const blockStyles: React.CSSProperties = {
    position: 'absolute',
    left: block.position.x,
    top: block.position.y,
    width: block.dimensions.width,
    minHeight: block.dimensions.height,
    // Use global CSS custom properties that automatically respond to theme changes
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))',
    borderWidth: block.styling.borderWidth,
    borderRadius: block.styling.borderRadius,
    borderStyle: 'solid',
    padding: `${block.styling.padding.y}px ${block.styling.padding.x}px`,
    opacity: block.styling.opacity,
    transition: isDragging || isResizing ? 'none' : 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: isDragging || isResizing ? 'transform' : 'auto',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={blockRef}
      className={cn(
        'rich-content-block',
        'group',
        'relative',
        'select-none',
        'outline-none',
        {
          'block-hover': isHovered,
          'block-selected': isSelected,
          'block-focused': isFocused,
          'block-dragging': isDragging,
          'block-resizing': isResizing,
          'block-preview': isPreview,
        },
        className
      )}
      style={blockStyles}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveForCursor}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-block-id={block.id}
      role="textbox"
      aria-label={`Rich content block ${block.id}`}
    >
      {/* Selection and Focus Indicators */}
      {isSelected && (
        <div className="absolute inset-0 border-2 rounded pointer-events-none -m-px border-primary" />
      )}

      {isFocused && (
        <div className="absolute inset-0 ring-2 ring-primary ring-opacity-50 rounded pointer-events-none -m-1" />
      )}

      {/* Drag/Resize Handles (visible on hover or selection) */}
      {(isHovered || isSelected) && !isPreview && (
        <>
          {/* Corner resize handles */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}

      {/* Editor Content */}
      <div className="relative h-full min-h-[60px]">
        <UnifiedTipTapEditor
          blockId={block.id}
          content={block.content.tiptapJSON}
          onContentChange={content => actions.updateContent(block.id, content)}
          onFocus={() => actions.focusBlock(block.id)}
          placeholder="Start typing..."
          className="h-full"
          editable={!isPreview}
        />
      </div>

      {/* Block Info (Debug - will be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 text-xs text-gray-400 bg-gray-800 text-white px-1 rounded-br opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {block.id.split('_').pop()}
        </div>
      )}
    </div>
  );
};
