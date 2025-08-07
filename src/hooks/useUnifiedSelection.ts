// ABOUTME: Unified selection hook providing single API for all selection operations in EVIDENS editor

import { useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  useSelectionStore,
  useCurrentSelection,
  useSelectionActions,
  useCanApplyTypography,
  useAppliedMarks,
  useHasSelection,
} from '@/store/selectionStore';
import {
  UnifiedSelectionState,
  TypographyProperties,
  TextSelectionInfo,
  CellSelectionInfo,
  MultiCellSelectionInfo, // 🎯 M3.1.1: Multi-cell selection support
  CellPosition,
  SelectionEventHandlers,
} from '@/types/selection';

/**
 * Unified selection API interface
 */
export interface UnifiedSelectionAPI {
  // Current state
  currentSelection: UnifiedSelectionState;
  hasSelection: boolean;
  canApplyTypography: boolean;
  appliedMarks: Record<string, any>;
  
  // Selection actions
  selectBlock: (blockId: string) => void;
  selectText: (blockId: string, selection: TextSelectionInfo) => void;
  selectTable: (tableId: string, isTableLevel?: boolean) => void;
  selectTableCell: (tableId: string, cell: CellSelectionInfo) => void;
  // 🎯 M3.1.1: Multi-cell selection actions
  selectMultipleCells: (selection: MultiCellSelectionInfo) => void;
  extendMultiCellSelection: (cellId: string, cellEditor: Editor, position: CellPosition) => void;
  clearSelection: () => void;
  
  // Typography actions
  applyTypography: (properties: TypographyProperties) => boolean;
  canApplyProperty: (property: keyof TypographyProperties) => boolean;
  
  // Toolbar interaction preservation - SIMPLIFIED for always-visible toolbar
  preserveDuringToolbarInteraction: <T>(operation: () => T) => T;
  
  // Convenience methods
  isBlockSelected: (blockId: string) => boolean;
  isTableCellSelected: (tableId: string, position: CellPosition) => boolean;
  // 🎯 M3.1.1: Multi-cell selection convenience methods
  isMultiCellSelectionActive: () => boolean;
  getMultiCellSelection: () => MultiCellSelectionInfo | null;
  isCellInMultiSelection: (cellId: string) => boolean;
  getSelectedBlockId: () => string | null;
  getSelectedTableCell: () => { tableId: string; position: CellPosition } | null;
  
  // Configuration
  enableDebugMode: () => void;
  disableDebugMode: () => void;
}

/**
 * Main hook for unified selection management
 */
export function useUnifiedSelection(eventHandlers?: SelectionEventHandlers): UnifiedSelectionAPI {
  const currentSelection = useCurrentSelection();
  const hasSelection = useHasSelection();
  const canApplyTypography = useCanApplyTypography();
  const appliedMarks = useAppliedMarks();
  const { dispatch, applyTypography, preserveDuringOperation, canApplyProperty, setConfig } = useSelectionActions();
  
  // Track previous selection for event handling
  const prevSelectionRef = useRef<UnifiedSelectionState>(currentSelection);
  
  // Event handler effects
  useEffect(() => {
    const prevSelection = prevSelectionRef.current;
    const currentType = currentSelection.type;
    const prevType = prevSelection.type;
    
    // Only fire events when selection actually changes
    if (currentType !== prevType || currentSelection.lastUpdated !== prevSelection.lastUpdated) {
      
      // Fire appropriate event handlers
      if (currentType === 'block' && currentSelection.blockSelection) {
        eventHandlers?.onBlockSelect?.(currentSelection.blockSelection.blockId);
      } else if (currentType === 'text' && currentSelection.textSelection) {
        // Find block ID from text selection
        const blockId = findBlockIdFromElement(currentSelection.textSelection.textElement);
        if (blockId) {
          eventHandlers?.onTextSelect?.(blockId, currentSelection.textSelection);
        }
      } else if (currentType === 'table' && currentSelection.tableSelection) {
        eventHandlers?.onTableSelect?.(currentSelection.tableSelection.tableId);
      } else if (currentType === 'table-cell' && currentSelection.cellSelection) {
        eventHandlers?.onTableCellSelect?.(currentSelection.cellSelection.tableId, currentSelection.cellSelection);
      } else if (currentType === 'none' && prevType !== 'none') {
        eventHandlers?.onSelectionClear?.();
      }
      
      prevSelectionRef.current = currentSelection;
    }
  }, [currentSelection, eventHandlers]);
  
  // Selection action implementations
  const selectBlock = useCallback((blockId: string) => {
    dispatch({ type: 'SELECT_BLOCK', blockId });
  }, [dispatch]);
  
  const selectText = useCallback((blockId: string, selection: TextSelectionInfo) => {
    dispatch({ type: 'SELECT_TEXT', blockId, selection });
  }, [dispatch]);
  
  const selectTable = useCallback((tableId: string, isTableLevel = true) => {
    dispatch({ type: 'SELECT_TABLE', tableId, isTableLevel });
  }, [dispatch]);
  
  const selectTableCell = useCallback((tableId: string, cell: CellSelectionInfo) => {
    dispatch({ type: 'SELECT_TABLE_CELL', tableId, cell });
  }, [dispatch]);
  
  // 🎯 M3.1.1: Multi-cell selection action implementations
  const selectMultipleCells = useCallback((selection: MultiCellSelectionInfo) => {
    dispatch({ type: 'SELECT_MULTI_CELLS', selection });
  }, [dispatch]);
  
  const extendMultiCellSelection = useCallback((cellId: string, cellEditor: Editor, position: CellPosition) => {
    dispatch({ type: 'EXTEND_MULTI_CELL_SELECTION', cellId, cellEditor, position });
  }, [dispatch]);
  
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);
  
  // SIMPLIFIED: Always-visible toolbar doesn't need complex interaction state
  // Toolbar interaction methods removed - selection preservation now handled at store level
  
  // Convenience methods
  const isBlockSelected = useCallback((blockId: string): boolean => {
    return currentSelection.type === 'block' && 
           currentSelection.blockSelection?.blockId === blockId;
  }, [currentSelection]);
  
  const isTableCellSelected = useCallback((tableId: string, position: CellPosition): boolean => {
    return currentSelection.type === 'table-cell' &&
           currentSelection.cellSelection?.tableId === tableId &&
           currentSelection.cellSelection?.position.row === position.row &&
           currentSelection.cellSelection?.position.col === position.col;
  }, [currentSelection]);
  
  const getSelectedBlockId = useCallback((): string | null => {
    return currentSelection.type === 'block' ? currentSelection.blockSelection?.blockId || null : null;
  }, [currentSelection]);
  
  const getSelectedTableCell = useCallback((): { tableId: string; position: CellPosition } | null => {
    if (currentSelection.type === 'table-cell' && currentSelection.cellSelection) {
      return {
        tableId: currentSelection.cellSelection.tableId,
        position: currentSelection.cellSelection.position,
      };
    }
    return null;
  }, [currentSelection]);
  
  // 🎯 M3.1.1: Multi-cell selection convenience method implementations
  const isMultiCellSelectionActive = useCallback((): boolean => {
    return currentSelection.type === 'multi-cell' && !!currentSelection.multiCellSelection;
  }, [currentSelection]);
  
  const getMultiCellSelection = useCallback((): MultiCellSelectionInfo | null => {
    return currentSelection.type === 'multi-cell' ? currentSelection.multiCellSelection || null : null;
  }, [currentSelection]);
  
  const isCellInMultiSelection = useCallback((cellId: string): boolean => {
    if (currentSelection.type === 'multi-cell' && currentSelection.multiCellSelection) {
      return currentSelection.multiCellSelection.selectedCellIds.includes(cellId);
    }
    return false;
  }, [currentSelection]);
  
  // Configuration methods
  const enableDebugMode = useCallback(() => {
    setConfig({ debugMode: true });
  }, [setConfig]);
  
  const disableDebugMode = useCallback(() => {
    setConfig({ debugMode: false });
  }, [setConfig]);
  
  return {
    // State
    currentSelection,
    hasSelection,
    canApplyTypography,
    appliedMarks,
    
    // Actions
    selectBlock,
    selectText,
    selectTable,
    selectTableCell,
    // 🎯 M3.1.1: Multi-cell selection actions
    selectMultipleCells,
    extendMultiCellSelection,
    clearSelection,
    
    // Typography
    applyTypography,
    canApplyProperty,
    
    // Toolbar interaction - SIMPLIFIED for always-visible toolbar
    preserveDuringToolbarInteraction: preserveDuringOperation,
    
    // Convenience
    isBlockSelected,
    isTableCellSelected,
    // 🎯 M3.1.1: Multi-cell selection convenience methods
    isMultiCellSelectionActive,
    getMultiCellSelection,
    isCellInMultiSelection,
    getSelectedBlockId,
    getSelectedTableCell,
    
    // Configuration
    enableDebugMode,
    disableDebugMode,
  };
}

/**
 * Hook for components that only need to know about current selection state
 */
export function useSelectionState() {
  const currentSelection = useCurrentSelection();
  const hasSelection = useHasSelection();
  const canApplyTypography = useCanApplyTypography();
  const appliedMarks = useAppliedMarks();
  
  return {
    currentSelection,
    hasSelection,
    canApplyTypography,
    appliedMarks,
    selectionType: currentSelection.type,
  };
}

/**
 * Hook for components that only need typography capabilities
 */
export function useTypographyActions() {
  const { applyTypography, canApplyProperty } = useSelectionActions();
  const canApplyTypographyResult = useCanApplyTypography();
  const appliedMarks = useAppliedMarks();
  
  return {
    applyTypography,
    canApplyProperty,
    canApplyTypography: canApplyTypographyResult,
    appliedMarks,
  };
}

/**
 * Hook for toolbar components that need interaction preservation
 * SIMPLIFIED: Always-visible toolbar doesn't need complex interaction state
 */
export function useToolbarInteraction() {
  const { preserveDuringOperation } = useSelectionActions();
  
  // SIMPLIFIED: No start/end interaction needed for always-visible toolbar
  return {
    preserveDuringOperation,
  };
}

/**
 * Hook for table components to manage cell selections
 */
export function useTableCellSelection(tableId: string) {
  const { selectTableCell, clearSelection, isTableCellSelected } = useUnifiedSelection();
  const currentSelection = useCurrentSelection();
  
  const selectCell = useCallback((position: CellPosition, cell: Omit<CellSelectionInfo, 'tableId' | 'position'>) => {
    selectTableCell(tableId, {
      tableId,
      position,
      ...cell,
    });
  }, [tableId, selectTableCell]);
  
  const isCellSelected = useCallback((position: CellPosition) => {
    return isTableCellSelected(tableId, position);
  }, [tableId, isTableCellSelected]);
  
  const hasAnyCellSelected = currentSelection.type === 'table-cell' && 
                           currentSelection.cellSelection?.tableId === tableId;
  
  const getSelectedPosition = (): CellPosition | null => {
    if (hasAnyCellSelected && currentSelection.cellSelection) {
      return currentSelection.cellSelection.position;
    }
    return null;
  };
  
  return {
    selectCell,
    clearSelection,
    isCellSelected,
    hasAnyCellSelected,
    getSelectedPosition,
  };
}

/**
 * Utility function to find block ID from DOM element
 */
function findBlockIdFromElement(element: HTMLElement | null): string | null {
  if (!element) return null;
  
  let current: HTMLElement | null = element;
  
  while (current) {
    if (current.hasAttribute('data-block-id')) {
      return current.getAttribute('data-block-id');
    }
    
    if (current.classList.contains('editor-block') || current.classList.contains('block-content')) {
      const blockContainer = current.closest('[data-block-id]') as HTMLElement;
      return blockContainer?.getAttribute('data-block-id') || null;
    }
    
    current = current.parentElement;
  }
  
  return null;
}

/**
 * Default export for convenience
 */
export default useUnifiedSelection;