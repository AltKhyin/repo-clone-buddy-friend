// ABOUTME: Unified selection state machine for managing all selection types in EVIDENS editor

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  UnifiedSelectionState,
  SelectionAction,
  TypographyProperties,
  AppliedMarks,
  EMPTY_SELECTION_STATE,
  DEFAULT_SELECTION_CONFIG,
  SelectionConfig,
  isTextSelection,
  isTableCellSelection,
  isContentSelection,
  hasTypographyCapability,
} from '@/types/selection';
import { createTypographyCommands } from '@/components/editor/shared/typography-commands';

/**
 * Selection store state interface
 */
interface SelectionStore {
  /** Current unified selection state */
  selection: UnifiedSelectionState;
  
  /** Configuration for selection behavior */
  config: SelectionConfig;
  
  /** Actions */
  dispatch: (action: SelectionAction) => void;
  setConfig: (config: Partial<SelectionConfig>) => void;
  applyTypography: (properties: TypographyProperties) => boolean;
  preserveDuringOperation: <T>(operation: () => T) => T;
  canApplyProperty: (property: keyof TypographyProperties) => boolean;
  
  /** Getters */
  getSelectionType: () => UnifiedSelectionState['type'];
  hasSelection: () => boolean;
  canApplyTypography: () => boolean;
  getAppliedMarks: () => AppliedMarks;
  
  /** Internal methods */
  _clearDelayed: () => void;
  _clearImmediate: () => void;
  _extractAppliedMarks: (state: UnifiedSelectionState) => AppliedMarks;
  _logDebug: (message: string, data?: any) => void;
}

/**
 * Extract applied typography marks from current selection
 * SIMPLIFIED: Unified content selection handling
 */
const extractAppliedMarks = (state: UnifiedSelectionState): AppliedMarks => {
  // NEW: Unified content selection handling
  if (isContentSelection(state) && state.contentSelection?.editor) {
    const editor = state.contentSelection.editor;
    try {
      return {
        fontFamily: editor.getAttributes('fontFamily')?.fontFamily,
        fontSize: editor.getAttributes('fontSize')?.fontSize,
        fontWeight: editor.getAttributes('fontWeight')?.fontWeight || (editor.isActive('bold') ? 700 : 400),
        fontStyle: editor.isActive('italic') ? 'italic' : 'normal',
        textColor: editor.getAttributes('textColor')?.color,
        backgroundColor: editor.getAttributes('highlight')?.color || editor.getAttributes('backgroundColor')?.backgroundColor,
        textAlign: editor.getAttributes('textAlign')?.textAlign,
        textTransform: editor.getAttributes('textTransform')?.textTransform,
        letterSpacing: editor.getAttributes('letterSpacing')?.letterSpacing,
        textDecoration: editor.getAttributes('textDecoration')?.textDecoration,
        lineHeight: editor.getAttributes('lineHeight')?.lineHeight,
      };
    } catch (error) {
      console.warn('[SelectionStore] Failed to extract marks from content selection:', error);
      return {};
    }
  }
  
  // BACKWARD COMPATIBILITY: Legacy text selection handling
  if (isTextSelection(state) && state.textSelection?.editor) {
    const editor = state.textSelection.editor;
    try {
      return {
        fontFamily: editor.getAttributes('fontFamily')?.fontFamily,
        fontSize: editor.getAttributes('fontSize')?.fontSize,
        fontWeight: editor.getAttributes('fontWeight')?.fontWeight || (editor.isActive('bold') ? 700 : 400),
        fontStyle: editor.isActive('italic') ? 'italic' : 'normal',
        textColor: editor.getAttributes('textColor')?.color,
        backgroundColor: editor.getAttributes('highlight')?.color || editor.getAttributes('backgroundColor')?.backgroundColor,
        textAlign: editor.getAttributes('textAlign')?.textAlign,
        textTransform: editor.getAttributes('textTransform')?.textTransform,
        letterSpacing: editor.getAttributes('letterSpacing')?.letterSpacing,
        textDecoration: editor.getAttributes('textDecoration')?.textDecoration,
        lineHeight: editor.getAttributes('lineHeight')?.lineHeight,
      };
    } catch (error) {
      console.warn('[SelectionStore] Failed to extract marks from text editor:', error);
      return {};
    }
  }
  
  
  // BACKWARD COMPATIBILITY: Legacy table cell selection handling
  if (isTableCellSelection(state) && state.cellSelection?.editor) {
    const editor = state.cellSelection.editor;
    try {
      return {
        fontFamily: editor.getAttributes('fontFamily')?.fontFamily,
        fontSize: editor.getAttributes('fontSize')?.fontSize,
        fontWeight: editor.getAttributes('fontWeight')?.fontWeight || (editor.isActive('bold') ? 700 : 400),
        fontStyle: editor.isActive('italic') ? 'italic' : 'normal',
        textColor: editor.getAttributes('textColor')?.color,
        backgroundColor: editor.getAttributes('highlight')?.color || editor.getAttributes('backgroundColor')?.backgroundColor,
        textAlign: editor.getAttributes('textAlign')?.textAlign,
        textTransform: editor.getAttributes('textTransform')?.textTransform,
        letterSpacing: editor.getAttributes('letterSpacing')?.letterSpacing,
        textDecoration: editor.getAttributes('textDecoration')?.textDecoration,
        lineHeight: editor.getAttributes('lineHeight')?.lineHeight,
      };
    } catch (error) {
      console.warn('[SelectionStore] Failed to extract marks from table cell editor:', error);
      return {};
    }
  }
  
  return {};
};

/**
 * Selection state reducer
 */
const selectionReducer = (
  state: UnifiedSelectionState,
  action: SelectionAction,
  config: SelectionConfig
): UnifiedSelectionState => {
  const timestamp = Date.now();
  
  switch (action.type) {
    case 'SELECT_BLOCK': {
      const newState: UnifiedSelectionState = {
        type: 'block',
        blockSelection: {
          blockId: action.blockId,
        },
        canApplyTypography: false, // Block-level selections can't apply text marks
        appliedMarks: {},
        preserveDuringToolbarInteraction: false, // DEPRECATED: Kept for backward compatibility
        lastUpdated: timestamp,
      };
      
      return {
        ...newState,
        appliedMarks: extractAppliedMarks(newState),
      };
    }
    
    case 'SELECT_CONTENT': {
      const newState: UnifiedSelectionState = {
        type: 'content',
        contentSelection: action.selection,
        canApplyTypography: !!action.selection.editor,
        appliedMarks: {},
        preserveDuringToolbarInteraction: false, // DEPRECATED: Kept for backward compatibility
        lastUpdated: timestamp,
      };
      
      return {
        ...newState,
        appliedMarks: extractAppliedMarks(newState),
      };
    }
    
    // BACKWARD COMPATIBILITY: Legacy SELECT_TEXT action
    case 'SELECT_TEXT': {
      const newState: UnifiedSelectionState = {
        type: 'text',
        textSelection: action.selection,
        canApplyTypography: !!action.selection.editor,
        appliedMarks: {},
        preserveDuringToolbarInteraction: false, // DEPRECATED: Kept for backward compatibility
        lastUpdated: timestamp,
      };
      
      return {
        ...newState,
        appliedMarks: extractAppliedMarks(newState),
      };
    }
    
    case 'SELECT_TABLE': {
      const newState: UnifiedSelectionState = {
        type: 'table',
        tableSelection: {
          tableId: action.tableId,
          isTableLevelSelection: action.isTableLevel ?? true,
        },
        canApplyTypography: false, // Table-level selections can't apply text marks
        appliedMarks: {},
        preserveDuringToolbarInteraction: false, // DEPRECATED: Kept for backward compatibility
        lastUpdated: timestamp,
      };
      
      return {
        ...newState,
        appliedMarks: extractAppliedMarks(newState),
      };
    }
    
    

    // BACKWARD COMPATIBILITY: Legacy SELECT_TABLE_CELL action
    case 'SELECT_TABLE_CELL': {
      const newState: UnifiedSelectionState = {
        type: 'table-cell',
        cellSelection: action.cell,
        canApplyTypography: !!action.cell.editor,
        appliedMarks: {},
        preserveDuringToolbarInteraction: false, // DEPRECATED: Kept for backward compatibility
        lastUpdated: timestamp,
      };
      
      return {
        ...newState,
        appliedMarks: extractAppliedMarks(newState),
      };
    }
    
    case 'CLEAR_SELECTION':
      return {
        ...EMPTY_SELECTION_STATE,
        lastUpdated: timestamp,
      };
    
    // REMOVED: Toolbar interaction cases - simplifying architecture
    // START_TOOLBAR_INTERACTION and END_TOOLBAR_INTERACTION no longer needed
    
    case 'UPDATE_APPLIED_MARKS':
      return {
        ...state,
        appliedMarks: {
          ...state.appliedMarks,
          ...action.marks,
        },
        lastUpdated: timestamp,
      };
    
    default:
      return state;
  }
};

/**
 * Apply typography to current selection
 */
const applyTypographyToSelection = (
  state: UnifiedSelectionState, 
  properties: TypographyProperties,
  debugLog: (msg: string, data?: any) => void
): boolean => {
  if (!hasTypographyCapability(state)) {
    debugLog('[SelectionStore] Typography cannot be applied - no valid selection with editor');
    return false;
  }
  
  try {
    if (isTextSelection(state) && state.textSelection?.editor) {
      const commands = createTypographyCommands(state.textSelection.editor);
      const result = commands.applyProperties(properties);
      debugLog('[SelectionStore] Applied typography to text selection', { properties, success: result.success });
      return result.success;
    }
    
    if (isTableCellSelection(state) && state.cellSelection?.editor) {
      // M4: Enhanced table cell typography with session coordination
      const commands = createTypographyCommands(state.cellSelection.editor);
      
      try {
        // Apply typography to the editor
        const result = commands.applyProperties(properties);
        
        if (result.success) {
          // Typography applied successfully to table cell
          const formattedContent = state.cellSelection.editor.getHTML();
          debugLog('[SelectionStore] ✅ Typography applied to table cell', { 
            properties,
            contentLength: formattedContent.length
          });
          return { success: true, properties };
        }
        
        debugLog('[SelectionStore] Applied typography to table cell selection', { 
          properties, 
          success: result.success
        });
        
        return result.success;
      } catch (error) {
        debugLog('[SelectionStore] Table cell typography application failed', { error: error.message, properties });
        return false;
      }
    }
  } catch (error) {
    debugLog('[SelectionStore] Typography application failed', { error: error.message, properties });
    return false;
  }
  
  return false;
};

/**
 * Create unified selection store
 */
export const useSelectionStore = create<SelectionStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    selection: EMPTY_SELECTION_STATE,
    config: DEFAULT_SELECTION_CONFIG,
    
    // Actions
    dispatch: (action: SelectionAction) => {
      const { selection, config } = get();
      
      // ✅ FIX: Removed timeout cancellation logic - no longer needed
      // Previous auto-clear timeout mechanism has been eliminated
      
      // Apply state reduction
      const newSelection = selectionReducer(selection, action, config);
      
      // Debug logging
      if (config.debugMode) {
        console.log('[SelectionStore] State transition:', {
          action,
          from: selection.type,
          to: newSelection.type,
          canApplyTypography: newSelection.canApplyTypography,
        });
      }
      
      set({ selection: newSelection });
      
      // ✅ FIX: Removed auto-clear timeout for always-visible toolbar architecture
      // Text selections now persist until explicit user action (focus change, new selection)
      // This eliminates the confusing "typography controls get muted after 2 seconds" behavior
      console.log(`[SelectionStore] ✨ SELECTION PERSISTED`, {
        selectionType: newSelection.type,
        actionType: action.type,
        canApplyTypography: newSelection.canApplyTypography,
        note: 'No auto-clear timeout - selection persists until explicit user action'
      });
    },
    
    setConfig: (configUpdate: Partial<SelectionConfig>) => {
      set(state => ({
        config: {
          ...state.config,
          ...configUpdate,
        },
      }));
    },
    
    applyTypography: (properties: TypographyProperties): boolean => {
      const { selection, _logDebug } = get();
      const success = applyTypographyToSelection(selection, properties, _logDebug);
      
      if (success) {
        // Update applied marks to reflect the changes
        get().dispatch({
          type: 'UPDATE_APPLIED_MARKS',
          marks: properties,
        });
      }
      
      return success;
    },
    
    preserveDuringOperation: <T>(operation: () => T): T => {
      // SIMPLIFIED: Just execute operation without complex toolbar coordination
      // Always-visible toolbar doesn't need selection preservation
      return operation();
    },
    
    canApplyProperty: (property: keyof TypographyProperties): boolean => {
      const { selection } = get();
      
      // All typography properties can be applied if we have typography capability
      if (hasTypographyCapability(selection)) {
        return true;
      }
      
      // Block-level properties might be applicable to block selections
      if (selection.type === 'block') {
        const blockLevelProperties: (keyof TypographyProperties)[] = [
          'textAlign', 'lineHeight', 'letterSpacing'
        ];
        return blockLevelProperties.includes(property);
      }
      
      return false;
    },
    
    // Getters
    getSelectionType: () => get().selection.type,
    hasSelection: () => get().selection.type !== 'none',
    canApplyTypography: () => hasTypographyCapability(get().selection),
    getAppliedMarks: () => get().selection.appliedMarks,
    
    // Internal methods - SIMPLIFIED
    
    _clearImmediate: () => {
      const currentState = get().selection;
      console.log(`[SelectionStore] 🔄 IMMEDIATE CLEAR DISPATCHED`, {
        currentSelectionType: currentState.type,
        canApplyTypography: currentState.canApplyTypography,
        timestamp: new Date().toISOString()
      });
      get().dispatch({ type: 'CLEAR_SELECTION' });
    },
    
    _extractAppliedMarks: extractAppliedMarks,
    
    _logDebug: (message: string, data?: any) => {
      const { config } = get();
      if (config.debugMode) {
        console.log(`[SelectionStore] ${message}`, data);
      }
    },
  }))
);

/**
 * Selectors for specific selection types
 */
export const useCurrentSelection = () => useSelectionStore(state => state.selection);
export const useSelectionType = () => useSelectionStore(state => state.selection.type);
export const useCanApplyTypography = () => useSelectionStore(state => hasTypographyCapability(state.selection));
export const useAppliedMarks = () => useSelectionStore(state => state.selection.appliedMarks);
export const useHasSelection = () => useSelectionStore(state => state.selection.type !== 'none');

/**
 * Selection type-specific selectors
 */
export const useBlockSelection = () => useSelectionStore(state => 
  state.selection.type === 'block' ? state.selection.blockSelection : null
);

export const useTextSelection = () => useSelectionStore(state => 
  state.selection.type === 'text' ? state.selection.textSelection : null
);

export const useTableSelection = () => useSelectionStore(state => 
  state.selection.type === 'table' ? state.selection.tableSelection : null
);

export const useTableCellSelection = () => useSelectionStore(state => 
  state.selection.type === 'table-cell' ? state.selection.cellSelection : null
);

/**
 * Action dispatchers
 */
export const useSelectionActions = () => useSelectionStore(state => ({
  dispatch: state.dispatch,
  applyTypography: state.applyTypography,
  preserveDuringOperation: state.preserveDuringOperation,
  canApplyProperty: state.canApplyProperty,
  setConfig: state.setConfig,
}));