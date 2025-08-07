// ABOUTME: Unified selection system types for managing all selection states across EVIDENS editor

import type { Editor } from '@tiptap/react';

/**
 * Position reference for table cells
 */
export interface CellPosition {
  row: number;
  col: number;
}

/**
 * Text selection information for TipTap editors
 */
export interface TextSelectionInfo {
  /** Selected text content */
  selectedText: string;
  /** DOM element containing the selection */
  textElement: HTMLElement | null;
  /** Selection range for precise manipulation */
  range: Range | null;
  /** TipTap editor instance */
  editor: Editor | null;
}

/**
 * Table selection information
 */
export interface TableSelectionInfo {
  /** Table identifier */
  tableId: string;
  /** Whether entire table is selected (vs individual cells) */
  isTableLevelSelection: boolean;
}

/**
 * Table cell selection information
 */
export interface CellSelectionInfo {
  /** Table identifier */
  tableId: string;
  /** Cell position within table */
  position: CellPosition;
  /** Whether this is a header cell */
  isHeader: boolean;
  /** TipTap editor instance for the cell */
  editor: Editor | null;
  /** DOM element for the cell */
  element: HTMLElement | null;
  /** Unique cell identifier */
  cellId: string;
}

/**
 * Multi-cell selection range for table editing
 * 🎯 M3.1.1: Extended support for table multi-cell selections
 */
export interface MultiCellSelectionInfo {
  /** Table identifier */
  tableId: string;
  /** Start position of selection range */
  startPosition: CellPosition;
  /** End position of selection range */
  endPosition: CellPosition;
  /** List of selected cell IDs for batch operations */
  selectedCellIds: string[];
  /** Map of cell editors for each selected cell */
  cellEditors: Map<string, Editor>;
  /** Whether selection includes header cells */
  includesHeaders: boolean;
}

/**
 * Unified content selection information (text or table cell)
 * Merges TextSelectionInfo and CellSelectionInfo for simplified architecture
 */
export interface ContentSelectionInfo {
  /** Block identifier containing the content */
  blockId: string;
  /** Content type - determines which properties are valid */
  contentType: 'text' | 'table-cell';
  /** TipTap editor instance */
  editor: Editor | null;
  
  /** Text-specific selection data (when contentType === 'text') */
  textData?: {
    /** Selected text content */
    selectedText: string;
    /** DOM element containing the selection */
    textElement: HTMLElement | null;
    /** Selection range for precise manipulation */
    range: Range | null;
  };
  
  /** Table cell-specific selection data (when contentType === 'table-cell') */
  cellData?: {
    /** Table identifier */
    tableId: string;
    /** Cell position within table */
    position: CellPosition;
    /** Whether this is a header cell */
    isHeader: boolean;
    /** DOM element for the cell */
    element: HTMLElement | null;
    /** Unique cell identifier */
    cellId: string;
  };
}

/**
 * Typography properties that can be applied to selections
 */
export interface TypographyProperties {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string | number;
  textDecoration?: string;
  lineHeight?: number;
}

/**
 * Applied typography marks extracted from current selection
 */
export interface AppliedMarks {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string | number;
  textDecoration?: string;
  lineHeight?: number;
}

/**
 * Unified selection state representing all possible selection types
 * SIMPLIFIED: Reduced from 5 types to 4 for better maintainability
 * 🎯 M3.1.1: Added multi-cell selection support for table editing
 * BACKWARD COMPATIBILITY: Temporarily includes deprecated types for migration
 */
export interface UnifiedSelectionState {
  /** Current selection type - simplified architecture with backward compatibility */
  type: 'none' | 'block' | 'content' | 'text' | 'table-cell' | 'multi-cell';
  
  /** Block selection (when entire block is selected) */
  blockSelection?: {
    blockId: string;
  };
  
  /** Content selection (text or table cell) - unified approach */
  contentSelection?: ContentSelectionInfo;
  
  /** Table-level selection (kept separate as it's different from content) */
  tableSelection?: TableSelectionInfo;
  
  /** Multi-cell selection for table batch operations - 🎯 M3.1.1 */
  multiCellSelection?: MultiCellSelectionInfo;
  
  /** Whether typography can be applied to current selection */
  canApplyTypography: boolean;
  
  /** Current typography marks applied to selection */
  appliedMarks: AppliedMarks;
  
  /** Whether selection should be preserved during toolbar interactions */
  preserveDuringToolbarInteraction: boolean;
  
  /** Timestamp of last selection change (for debugging) */
  lastUpdated: number;
  
  // BACKWARD COMPATIBILITY: Deprecated properties for gradual migration
  /** @deprecated Use contentSelection instead */
  textSelection?: TextSelectionInfo;
  /** @deprecated Use contentSelection instead */
  cellSelection?: CellSelectionInfo;
}

/**
 * Actions that can be dispatched to change selection state
 * SIMPLIFIED: Unified content selection actions
 * 🎯 M3.1.1: Added multi-cell selection actions for table editing
 */
export type SelectionAction =
  | { type: 'SELECT_BLOCK'; blockId: string }
  | { type: 'SELECT_CONTENT'; selection: ContentSelectionInfo }
  | { type: 'SELECT_TABLE'; tableId: string; isTableLevel?: boolean }
  | { type: 'SELECT_MULTI_CELLS'; selection: MultiCellSelectionInfo }
  | { type: 'EXTEND_MULTI_CELL_SELECTION'; cellId: string; cellEditor: Editor; position: CellPosition }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_APPLIED_MARKS'; marks: Partial<AppliedMarks> }
  // REMOVED: START_TOOLBAR_INTERACTION and END_TOOLBAR_INTERACTION no longer needed for always-visible toolbar
  // BACKWARD COMPATIBILITY: Deprecated actions for gradual migration
  | { type: 'SELECT_TEXT'; selection: TextSelectionInfo; blockId?: string }
  | { type: 'SELECT_TABLE_CELL'; cell: CellSelectionInfo; tableId?: string };

/**
 * Selection context for components that need to react to selection changes
 */
export interface SelectionContext {
  /** Current unified selection state */
  currentSelection: UnifiedSelectionState;
  
  /** Dispatch function for selection actions */
  dispatch: (action: SelectionAction) => void;
  
  /** Apply typography to current selection */
  applyTypography: (properties: TypographyProperties) => boolean;
  
  /** Preserve selection during an operation */
  preserveDuringOperation: <T>(operation: () => T) => T;
  
  /** Check if specific typography property can be applied */
  canApplyProperty: (property: keyof TypographyProperties) => boolean;
}

/**
 * Selection event handlers for components
 */
export interface SelectionEventHandlers {
  onBlockSelect?: (blockId: string) => void;
  onTextSelect?: (blockId: string, selection: TextSelectionInfo) => void;
  onTableSelect?: (tableId: string) => void;
  onTableCellSelect?: (tableId: string, cell: CellSelectionInfo) => void;
  onSelectionClear?: () => void;
}

/**
 * Configuration for selection behavior
 */
export interface SelectionConfig {
  /** Delay before clearing selections (ms) */
  clearDelay: number;
  /** Whether to preserve selections during toolbar interactions */
  preserveDuringToolbar: boolean;
  /** Debug logging enabled */
  debugMode: boolean;
}

/**
 * Default selection configuration
 */
export const DEFAULT_SELECTION_CONFIG: SelectionConfig = {
  clearDelay: 5000, // Increase from 300ms to 5 seconds for better UX
  preserveDuringToolbar: true,
  debugMode: true, // Enable debug mode to track selection changes
};

/**
 * Empty selection state
 */
export const EMPTY_SELECTION_STATE: UnifiedSelectionState = {
  type: 'none',
  canApplyTypography: false,
  appliedMarks: {},
  preserveDuringToolbarInteraction: false,
  lastUpdated: 0,
};

/**
 * Type guards for selection state
 * SIMPLIFIED: Unified content selection with backward compatibility
 */
export const isBlockSelection = (state: UnifiedSelectionState): state is UnifiedSelectionState & { blockSelection: NonNullable<UnifiedSelectionState['blockSelection']> } => {
  return state.type === 'block' && !!state.blockSelection;
};

export const isContentSelection = (state: UnifiedSelectionState): state is UnifiedSelectionState & { contentSelection: NonNullable<UnifiedSelectionState['contentSelection']> } => {
  return state.type === 'content' && !!state.contentSelection;
};

export const isTableSelection = (state: UnifiedSelectionState): state is UnifiedSelectionState & { tableSelection: NonNullable<UnifiedSelectionState['tableSelection']> } => {
  return state.type === 'table' && !!state.tableSelection;
};

/** 🎯 M3.1.1: Type guard for multi-cell selection */
export const isMultiCellSelection = (state: UnifiedSelectionState): state is UnifiedSelectionState & { multiCellSelection: NonNullable<UnifiedSelectionState['multiCellSelection']> } => {
  return state.type === 'multi-cell' && !!state.multiCellSelection;
};

// BACKWARD COMPATIBILITY: Deprecated type guards for gradual migration
/** @deprecated Use isContentSelection with contentType check instead */
export const isTextSelection = (state: UnifiedSelectionState): state is UnifiedSelectionState & { textSelection: NonNullable<UnifiedSelectionState['textSelection']> } => {
  // Support both new and old patterns
  return (state.type === 'content' && state.contentSelection?.contentType === 'text') ||
         (state.type === 'text' && !!state.textSelection);
};

/** @deprecated Use isContentSelection with contentType check instead */
export const isTableCellSelection = (state: UnifiedSelectionState): state is UnifiedSelectionState & { cellSelection: NonNullable<UnifiedSelectionState['cellSelection']> } => {
  // Support both new and old patterns
  return (state.type === 'content' && state.contentSelection?.contentType === 'table-cell') ||
         (state.type === 'table-cell' && !!state.cellSelection);
};

export const hasTypographyCapability = (state: UnifiedSelectionState): boolean => {
  return state.canApplyTypography && (
    isContentSelection(state) || 
    isMultiCellSelection(state) ||  // 🎯 M3.1.1: Multi-cell selections support typography
    // BACKWARD COMPATIBILITY: Support deprecated patterns
    isTextSelection(state) || 
    isTableCellSelection(state)
  );
};