// ABOUTME: Simple type definitions for BasicTable system following Reddit's minimal approach

/**
 * Simple table data structure - 90% simpler than complex TableData
 * Now supports basic HTML formatting (bold, italic, underline) and alignment
 */
export interface BasicTableData {
  /** Column headers supporting basic HTML formatting (bold, italic, etc.) */
  headers: string[];
  /** Table rows supporting basic HTML formatting (bold, italic, etc.) */
  rows: string[][];
  /** Optional table identifier for editor operations */
  id?: string;
  /** Column alignment settings - left (default), center, or right */
  columnAlignments?: ('left' | 'center' | 'right')[];
}

/**
 * Basic table extension options
 */
export interface BasicTableOptions {
  HTMLAttributes: Record<string, any>;
}

/**
 * Table context menu actions matching Reddit's functionality
 */
export type TableAction = 
  | 'insertRowAbove' 
  | 'insertRowBelow'
  | 'insertColumnBefore'
  | 'insertColumnAfter'
  | 'deleteRow'
  | 'deleteColumn'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'deleteTable';

/**
 * Context menu item definition
 */
export interface TableMenuItem {
  action?: TableAction;
  label?: string;
  icon?: React.ReactNode;
  type?: 'separator';
  danger?: boolean;
}

/**
 * Selected cell position for context menu operations
 */
export interface CellPosition {
  row: number; // -1 for header row
  col: number;
}

/**
 * Context menu props
 */
export interface TableContextMenuProps {
  position: { x: number; y: number };
  selectedCell: CellPosition;
  tableData: BasicTableData;
  tableElement?: HTMLTableElement; // Add table reference for better positioning
  onAction: (action: TableAction, position: CellPosition) => void;
  onClose: () => void;
}

/**
 * Default table data for new tables
 */
export const DEFAULT_TABLE_DATA: BasicTableData = {
  headers: ['Column 1', 'Column 2'],
  rows: [
    ['', ''],
    ['', '']
  ]
};

/**
 * Validation result for table operations
 */
export interface TableValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Table operation result
 */
export interface TableOperationResult {
  success: boolean;
  data?: BasicTableData;
  error?: string;
}