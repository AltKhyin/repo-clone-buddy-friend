// ABOUTME: Selection coordination hook that provides unified event handling for Rich Block components

import { useCallback, useEffect, useRef } from 'react';
import {
  useEditorActions,
  useSelectionState,
  useIsBlockActive,
  useContentSelection,
} from '@/store/editorStore';
import { ContentSelectionType } from '@/types/editor';

/**
 * Configuration for selection coordination behavior
 */
export interface SelectionCoordinationConfig {
  blockId: string;
  componentType: 'table' | 'poll' | 'text' | 'generic';
  enableContentSelection?: boolean;
  preventBubbling?: boolean;
  autoActivateOnMount?: boolean;
}

/**
 * Event delegation types for hierarchical handling
 */
export type SelectionEventType =
  | 'block-activate'
  | 'content-select'
  | 'content-edit'
  | 'selection-clear';

/**
 * Unified selection coordination hook for Rich Block components.
 *
 * This hook provides:
 * - Hierarchical event delegation (block -> content -> UI)
 * - Automatic conflict resolution between TipTap and component events
 * - Prevention of multiple simultaneous selections
 * - Clear coordination between block activation and content editing
 *
 * Usage:
 * ```typescript
 * const {
 *   isActive,
 *   hasContentSelection,
 *   handleBlockClick,
 *   handleContentClick
 * } = useSelectionCoordination({
 *   blockId: 'block-123',
 *   componentType: 'table',
 *   enableContentSelection: true
 * });
 * ```
 */
export const useSelectionCoordination = (config: SelectionCoordinationConfig) => {
  const { blockId, componentType, enableContentSelection = true, preventBubbling = true } = config;

  // Store actions and state
  const { activateBlock, clearAllSelection, setContentSelection } = useEditorActions();
  const selectionState = useSelectionState();
  const isActive = useIsBlockActive(blockId);
  const contentSelection = useContentSelection();

  // Ref to track if we're currently handling an event to prevent loops
  const handlingEventRef = useRef(false);

  // Check if this block has content selection
  const hasContentSelection = contentSelection?.blockId === blockId;
  const activeContentType = contentSelection?.type || ContentSelectionType.NONE;

  /**
   * Handle block-level activation
   * This should be called when clicking on the block container or any non-interactive area
   */
  const handleBlockActivation = useCallback(
    (e?: React.MouseEvent) => {
      if (handlingEventRef.current) return;

      try {
        handlingEventRef.current = true;

        // Prevent event from bubbling if configured
        if (preventBubbling && e) {
          e.stopPropagation();
        }

        // Clear any existing content selection if switching blocks
        if (selectionState.activeBlockId !== blockId && selectionState.hasContentSelection) {
          clearAllSelection();
        }

        // Activate this block
        activateBlock(blockId);
      } finally {
        handlingEventRef.current = false;
      }
    },
    [
      blockId,
      preventBubbling,
      selectionState.activeBlockId,
      selectionState.hasContentSelection,
      activateBlock,
      clearAllSelection,
    ]
  );

  /**
   * Handle content-level selection (table cells, poll options, etc.)
   * This should be called when clicking on interactive content within the block
   */
  const handleContentSelection = useCallback(
    (
      contentType: ContentSelectionType,
      contentData: any,
      options: { isEditing?: boolean; preventActivation?: boolean } = {}
    ) => {
      if (handlingEventRef.current) return;
      if (!enableContentSelection) return;

      try {
        handlingEventRef.current = true;

        const { isEditing = false, preventActivation = false } = options;

        // Ensure block is activated first (unless prevented)
        if (!preventActivation && !isActive) {
          activateBlock(blockId);
        }

        // Set content selection based on type
        const contentSelectionInfo = {
          type: contentType,
          blockId,
          data: contentData,
        };

        setContentSelection(contentSelectionInfo);
      } finally {
        handlingEventRef.current = false;
      }
    },
    [blockId, enableContentSelection, isActive, activateBlock, setContentSelection]
  );

  /**
   * Handle clearing selection for this block
   */
  const handleSelectionClear = useCallback(
    (options: { clearBlock?: boolean } = {}) => {
      if (handlingEventRef.current) return;

      try {
        handlingEventRef.current = true;

        const { clearBlock = false } = options;

        if (clearBlock) {
          clearAllSelection();
        } else if (hasContentSelection) {
          // Clear only content selection, keep block active
          setContentSelection(null);
        }
      } finally {
        handlingEventRef.current = false;
      }
    },
    [hasContentSelection, clearAllSelection, setContentSelection]
  );

  /**
   * Handle clicks outside this component (global click handler)
   */
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (handlingEventRef.current) return;

      const target = e.target as HTMLElement;
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);

      // If click is outside this block, clear its selection
      if (blockElement && !blockElement.contains(target)) {
        if (isActive && !selectionState.preventMultiSelection) {
          handleSelectionClear({ clearBlock: true });
        }
      }
    },
    [blockId, isActive, selectionState.preventMultiSelection, handleSelectionClear]
  );

  /**
   * Specific handlers for different content types
   */
  const handleTableCellClick = useCallback(
    (tableId: string, cellPosition: { row: number; col: number }, isEditing = false) => {
      handleContentSelection(
        ContentSelectionType.TABLE_CELL,
        {
          tableCell: {
            tableId,
            cellPosition,
            isEditing,
            editValue: '',
          },
        },
        { isEditing }
      );
    },
    [handleContentSelection]
  );

  const handlePollOptionClick = useCallback(
    (pollId: string, optionId: string, isEditing = false) => {
      handleContentSelection(
        ContentSelectionType.POLL_OPTION,
        {
          pollOption: {
            pollId,
            optionId,
            isEditing,
            editValue: '',
          },
        },
        { isEditing }
      );
    },
    [handleContentSelection]
  );

  const handlePollQuestionClick = useCallback(
    (pollId: string, isEditing = false) => {
      handleContentSelection(
        ContentSelectionType.POLL_QUESTION,
        {
          pollQuestion: {
            pollId,
            isEditing,
            editValue: '',
          },
        },
        { isEditing }
      );
    },
    [handleContentSelection]
  );

  // Setup global click listener for outside clicks
  useEffect(() => {
    if (isActive) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [isActive, handleOutsideClick]);

  // Auto-activate on mount if configured
  useEffect(() => {
    if (config.autoActivateOnMount && !isActive) {
      handleBlockActivation();
    }
  }, [config.autoActivateOnMount, isActive, handleBlockActivation]);

  return {
    // State
    isActive,
    hasContentSelection,
    activeContentType,
    selectionState,

    // Block-level handlers
    handleBlockActivation,
    handleSelectionClear,

    // Content-level handlers
    handleContentSelection,
    handleTableCellClick,
    handlePollOptionClick,
    handlePollQuestionClick,

    // Convenience methods
    activateThisBlock: () => handleBlockActivation(),
    clearThisSelection: () => handleSelectionClear({ clearBlock: false }),
    clearAllSelectionForBlock: () => handleSelectionClear({ clearBlock: true }),

    // State queries
    isTableCellSelected: (tableId: string, cellPosition: { row: number; col: number }) => {
      const cell = contentSelection?.data?.tableCell;
      return (
        cell?.tableId === tableId &&
        cell?.cellPosition.row === cellPosition.row &&
        cell?.cellPosition.col === cellPosition.col
      );
    },

    isPollOptionSelected: (pollId: string, optionId: string) => {
      const option = contentSelection?.data?.pollOption;
      return option?.pollId === pollId && option?.optionId === optionId;
    },

    isPollQuestionSelected: (pollId: string) => {
      const question = contentSelection?.data?.pollQuestion;
      return question?.pollId === pollId;
    },
  };
};

/**
 * Simplified hook for basic block activation without content selection
 */
export const useSimpleBlockActivation = (blockId: string) => {
  return useSelectionCoordination({
    blockId,
    componentType: 'generic',
    enableContentSelection: false,
  });
};
