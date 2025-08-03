// ABOUTME: React hook for integrating table selection coordination with component state

import { useEffect, useCallback, useRef, useState } from 'react';
import { Editor } from '@tiptap/core';
import { 
  tableSelectionCoordinator, 
  TableSelectionState, 
  TableSelectionEvents 
} from './TableSelectionCoordinator';
import { useEditorStore } from '@/store/editorStore';
import { createTypographyCommands } from '../../../shared/typography-commands';

/**
 * Hook for integrating table selection coordination with React components
 */
export function useTableSelectionCoordination() {
  const [selectionState, setSelectionState] = useState<TableSelectionState>(
    tableSelectionCoordinator.getSelectionState()
  );
  const { setTextSelection } = useEditorStore();
  const eventListenersRef = useRef<Array<() => void>>([]);


  /**
   * Register table for selection coordination
   */
  const registerTable = useCallback((
    tableId: string, 
    component: {
      addColumn: () => void;
      removeColumn: (colIndex: number) => void;
      addRow: () => void;
      removeRow: (rowIndex: number) => void;
      updateTableData: (updates: any) => void;
      getCurrentCellPosition: () => { row: number; col: number } | null;
      getFocusedCellEditor: () => Editor | null;
      getFocusedCellTypographyCommands: () => ReturnType<typeof createTypographyCommands> | null;
    }
  ) => {
    // This would typically be handled by the table component itself
    // We provide this for manual registration if needed
    console.log('Table registered for selection coordination:', tableId);
  }, []);

  /**
   * Handle cell focus
   */
  const handleCellFocus = useCallback((
    tableId: string,
    position: { row: number; col: number },
    editor?: Editor | null,
    options: {
      scrollIntoView?: boolean;
      selectContent?: boolean;
      clearPreviousSelection?: boolean;
    } = {}
  ): boolean => {
    return tableSelectionCoordinator.focusCell(tableId, position, options);
  }, []);

  /**
   * Handle cell blur
   */
  const handleCellBlur = useCallback(() => {
    tableSelectionCoordinator.blurCell();
  }, []);

  /**
   * Handle cell navigation
   */
  const handleCellNavigation = useCallback((
    direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'enter'
  ): boolean => {
    return tableSelectionCoordinator.navigateCell(direction);
  }, []);

  /**
   * Select multiple cells
   */
  const selectCellRange = useCallback((
    tableId: string,
    startPos: { row: number; col: number },
    endPos: { row: number; col: number }
  ): boolean => {
    return tableSelectionCoordinator.selectCellRange(tableId, startPos, endPos);
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    tableSelectionCoordinator.clearSelection();
  }, []);

  /**
   * Apply typography to selected cells
   */
  const applyTypographyToSelection = useCallback((
    properties: Record<string, any>
  ): boolean => {
    return tableSelectionCoordinator.applyTypographyToSelection(properties);
  }, []);

  /**
   * Check if we can apply typography to current selection
   */
  const canApplyTypography = useCallback((): boolean => {
    return selectionState.selectionContext.canApplyTypography;
  }, [selectionState.selectionContext.canApplyTypography]);

  /**
   * Get active typography commands for current selection
   */
  const getActiveTypographyCommands = useCallback((): ReturnType<typeof createTypographyCommands> | null => {
    return selectionState.selectionContext.activeTypographyCommands;
  }, [selectionState.selectionContext.activeTypographyCommands]);

  /**
   * Integration with global text selection for toolbar coordination
   */
  const syncWithGlobalTextSelection = useCallback(() => {
    if (selectionState.hasTableCellSelection && selectionState.focusedCell) {
      // Convert table cell selection to global text selection format
      const textSelectionInfo = {
        blockId: selectionState.activeTable?.tableId || null,
        selectedText: '', // We don't track selected text within cells here
        textElement: selectionState.focusedCell.element,
        range: null,
        hasSelection: true,
        editor: selectionState.focusedCell.editor,
        isTipTapSelection: Boolean(selectionState.focusedCell.editor),
        isTableCellSelection: true,
        tableCellInfo: {
          tableId: selectionState.activeTable?.tableId || '',
          cellPosition: selectionState.focusedCell.position,
          cellEditor: selectionState.focusedCell.editor,
          isHeader: selectionState.focusedCell.isHeader,
        },
        appliedMarks: selectionState.focusedCell.editor 
          ? extractMarksFromEditor(selectionState.focusedCell.editor)
          : {},
      };

      setTextSelection(textSelectionInfo);
    } else {
      // Clear global text selection when no table cell is selected
      setTextSelection({
        blockId: null,
        selectedText: '',
        textElement: null,
        range: null,
        hasSelection: false,
        editor: null,
        isTipTapSelection: false,
        isTableCellSelection: false,
        appliedMarks: {},
      });
    }
  }, [selectionState, setTextSelection]);

  /**
   * Extract typography marks from editor
   */
  const extractMarksFromEditor = useCallback((editor: Editor) => {
    try {
      return {
        fontFamily: editor.getAttributes('fontFamily').fontFamily,
        fontSize: editor.getAttributes('fontSize').fontSize,
        fontWeight: editor.getAttributes('fontWeight').fontWeight,
        textColor: editor.getAttributes('textColor').color,
        backgroundColor: editor.getAttributes('backgroundColor').backgroundColor,
        textTransform: editor.getAttributes('textTransform').textTransform,
        letterSpacing: editor.getAttributes('letterSpacing').letterSpacing,
      };
    } catch (error) {
      return {};
    }
  }, []);

  /**
   * Handle keyboard shortcuts for table navigation
   */
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent): boolean => {
    if (!selectionState.hasTableCellSelection) {
      return false;
    }

    // Enhanced keyboard shortcuts for table coordination
    switch (true) {
      case event.key === 'ArrowUp' && event.ctrlKey:
        event.preventDefault();
        return handleCellNavigation('up');
      
      case event.key === 'ArrowDown' && event.ctrlKey:
        event.preventDefault();
        return handleCellNavigation('down');
      
      case event.key === 'ArrowLeft' && event.ctrlKey:
        event.preventDefault();
        return handleCellNavigation('left');
      
      case event.key === 'ArrowRight' && event.ctrlKey:
        event.preventDefault();
        return handleCellNavigation('right');
      
      case event.key === 'Tab':
        event.preventDefault();
        return handleCellNavigation('tab');
      
      case event.key === 'Enter' && event.ctrlKey:
        event.preventDefault();
        return handleCellNavigation('enter');
      
      case event.key === 'Escape':
        event.preventDefault();
        clearSelection();
        return true;

      // Typography shortcuts when cell is selected
      case event.key === 'b' && event.ctrlKey:
        if (canApplyTypography()) {
          event.preventDefault();
          const commands = getActiveTypographyCommands();
          if (commands) {
            commands.toggleBold();
            return true;
          }
        }
        break;

      case event.key === 'i' && event.ctrlKey:
        if (canApplyTypography()) {
          event.preventDefault();
          const commands = getActiveTypographyCommands();
          if (commands) {
            commands.toggleItalic();
            return true;
          }
        }
        break;

      case event.key === 'h' && event.ctrlKey && event.shiftKey:
        if (canApplyTypography()) {
          event.preventDefault();
          const commands = getActiveTypographyCommands();
          if (commands) {
            commands.toggleHighlight();
            return true;
          }
        }
        break;
    }

    return false;
  }, [
    selectionState.hasTableCellSelection,
    handleCellNavigation,
    clearSelection,
    canApplyTypography,
    getActiveTypographyCommands
  ]);

  // Set up event listeners
  useEffect(() => {
    const cleanup: Array<() => void> = [];

    // Listen for selection state changes
    const handleSelectionChange: TableSelectionEvents['cellSelection'] = (state) => {
      setSelectionState(state);
    };

    const handleContextChange: TableSelectionEvents['contextChange'] = (context) => {
      setSelectionState(prev => ({
        ...prev,
        selectionContext: context,
      }));
    };

    tableSelectionCoordinator.on('cellSelection', handleSelectionChange);
    tableSelectionCoordinator.on('contextChange', handleContextChange);

    cleanup.push(() => {
      tableSelectionCoordinator.off('cellSelection', handleSelectionChange);
      tableSelectionCoordinator.off('contextChange', handleContextChange);
    });

    // Set up keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    cleanup.push(() => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    });

    eventListenersRef.current = cleanup;

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [handleKeyboardShortcuts]);

  // Sync with global text selection when state changes
  useEffect(() => {
    syncWithGlobalTextSelection();
  }, [syncWithGlobalTextSelection]);

  return {
    // State
    selectionState,
    hasTableCellSelection: selectionState.hasTableCellSelection,
    focusedCell: selectionState.focusedCell,
    selectedCells: selectionState.selectedCells,
    selectionContext: selectionState.selectionContext,

    // Actions
    registerTable,
    handleCellFocus,
    handleCellBlur,
    handleCellNavigation,
    selectCellRange,
    clearSelection,
    applyTypographyToSelection,

    // Utilities
    canApplyTypography,
    getActiveTypographyCommands,
    
    // Advanced features
    syncWithGlobalTextSelection,
  };
}