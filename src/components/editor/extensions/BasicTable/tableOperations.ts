// ABOUTME: Simple table operations using array manipulation - replacing complex table commands

import { BasicTableData, TableAction, CellPosition, TableOperationResult, TableValidationResult } from './types';

/**
 * Validate table data structure
 */
export const validateTableData = (data: BasicTableData): TableValidationResult => {
  if (!data.headers || !Array.isArray(data.headers)) {
    return { isValid: false, error: 'Headers must be an array' };
  }
  
  if (!data.rows || !Array.isArray(data.rows)) {
    return { isValid: false, error: 'Rows must be an array' };
  }
  
  if (data.headers.length === 0) {
    return { isValid: false, error: 'Table must have at least one column' };
  }
  
  // Check that all rows have the same number of columns as headers
  const headerCount = data.headers.length;
  for (let i = 0; i < data.rows.length; i++) {
    if (!Array.isArray(data.rows[i]) || data.rows[i].length !== headerCount) {
      return { isValid: false, error: `Row ${i} has incorrect number of columns` };
    }
  }
  
  return { isValid: true };
};

/**
 * Insert row above the specified position
 */
export const insertRowAbove = (data: BasicTableData, rowIndex: number): TableOperationResult => {
  const validation = validateTableData(data);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  const newRow = new Array(data.headers.length).fill('');
  const newData: BasicTableData = {
    ...data,
    rows: [
      ...data.rows.slice(0, rowIndex),
      newRow,
      ...data.rows.slice(rowIndex)
    ]
  };
  
  return { success: true, data: newData };
};

/**
 * Insert row below the specified position
 */
export const insertRowBelow = (data: BasicTableData, rowIndex: number): TableOperationResult => {
  const validation = validateTableData(data);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  const newRow = new Array(data.headers.length).fill('');
  const insertIndex = rowIndex + 1;
  
  const newData: BasicTableData = {
    ...data,
    rows: [
      ...data.rows.slice(0, insertIndex),
      newRow,
      ...data.rows.slice(insertIndex)
    ]
  };
  
  return { success: true, data: newData };
};

/**
 * Delete row at the specified position
 */
export const deleteRow = (data: BasicTableData, rowIndex: number): TableOperationResult => {
  const validation = validateTableData(data);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  if (data.rows.length <= 1) {
    return { success: false, error: 'Cannot delete the last row' };
  }
  
  if (rowIndex < 0 || rowIndex >= data.rows.length) {
    return { success: false, error: 'Invalid row index' };
  }
  
  const newData: BasicTableData = {
    ...data,
    rows: data.rows.filter((_, index) => index !== rowIndex)
  };
  
  return { success: true, data: newData };
};

/**
 * Insert column before the specified position
 */
export const insertColumnBefore = (data: BasicTableData, colIndex: number): TableOperationResult => {
  const validation = validateTableData(data);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  const newData: BasicTableData = {
    ...data,
    headers: [
      ...data.headers.slice(0, colIndex),
      `Column ${colIndex + 1}`,
      ...data.headers.slice(colIndex)
    ],
    rows: data.rows.map(row => [
      ...row.slice(0, colIndex),
      '',
      ...row.slice(colIndex)
    ]),
    columnAlignments: [
      ...(data.columnAlignments?.slice(0, colIndex) || []),
      'left',
      ...(data.columnAlignments?.slice(colIndex) || [])
    ],
    // Preserve typography settings
    fontFamily: data.fontFamily,
    fontSize: data.fontSize
  };
  
  return { success: true, data: newData };
};

/**
 * Insert column after the specified position
 */
export const insertColumnAfter = (data: BasicTableData, colIndex: number): TableOperationResult => {
  const validation = validateTableData(data);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  const insertIndex = colIndex + 1;
  
  const newData: BasicTableData = {
    ...data,
    headers: [
      ...data.headers.slice(0, insertIndex),
      `Column ${insertIndex + 1}`,
      ...data.headers.slice(insertIndex)
    ],
    rows: data.rows.map(row => [
      ...row.slice(0, insertIndex),
      '',
      ...row.slice(insertIndex)
    ]),
    columnAlignments: [
      ...(data.columnAlignments?.slice(0, insertIndex) || []),
      'left',
      ...(data.columnAlignments?.slice(insertIndex) || [])
    ],
    // Preserve typography settings
    fontFamily: data.fontFamily,
    fontSize: data.fontSize
  };
  
  return { success: true, data: newData };
};

/**
 * Delete column at the specified position
 */
export const deleteColumn = (data: BasicTableData, colIndex: number): TableOperationResult => {
  const validation = validateTableData(data);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  if (data.headers.length <= 1) {
    return { success: false, error: 'Cannot delete the last column' };
  }
  
  if (colIndex < 0 || colIndex >= data.headers.length) {
    return { success: false, error: 'Invalid column index' };
  }
  
  const newData: BasicTableData = {
    ...data,
    headers: data.headers.filter((_, index) => index !== colIndex),
    rows: data.rows.map(row => row.filter((_, index) => index !== colIndex)),
    columnAlignments: data.columnAlignments?.filter((_, index) => index !== colIndex) || [],
    // Preserve typography settings
    fontFamily: data.fontFamily,
    fontSize: data.fontSize
  };
  
  return { success: true, data: newData };
};

/**
 * Set alignment for a specific column
 */
export const setColumnAlignment = (
  data: BasicTableData,
  colIndex: number,
  alignment: 'left' | 'center' | 'right'
): TableOperationResult => {
  if (colIndex < 0 || colIndex >= data.headers.length) {
    return { success: false, error: 'Invalid column index' };
  }

  const newData = { ...data };
  
  // Initialize columnAlignments if it doesn't exist
  if (!newData.columnAlignments) {
    newData.columnAlignments = new Array(data.headers.length).fill('left');
  }

  // Update the alignment for the specified column
  newData.columnAlignments[colIndex] = alignment;

  return { success: true, data: newData };
};

/**
 * Set font family for entire table
 */
export const setTableFontFamily = (
  data: BasicTableData,
  fontFamily: string | undefined
): TableOperationResult => {
  const newData = { ...data, fontFamily };
  return { success: true, data: newData };
};

/**
 * Set font size for entire table
 */
export const setTableFontSize = (
  data: BasicTableData,
  fontSize: string | undefined
): TableOperationResult => {
  const newData = { ...data, fontSize };
  return { success: true, data: newData };
};

/**
 * Apply text alignment to a column (CSS-based)
 * Note: This is handled via CSS classes rather than data modification
 */
export const applyColumnAlignment = (alignment: 'left' | 'center' | 'right'): string => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center', 
    right: 'text-right'
  };
  
  return alignmentClasses[alignment];
};

/**
 * Execute table operation based on action type
 */
export const executeTableOperation = (
  data: BasicTableData, 
  action: TableAction, 
  position: CellPosition
): TableOperationResult => {
  const { row, col } = position;
  
  switch (action) {
    case 'insertRowAbove':
      return insertRowAbove(data, Math.max(0, row));
      
    case 'insertRowBelow':
      return insertRowBelow(data, row >= 0 ? row : 0);
      
    case 'deleteRow':
      if (row < 0) return { success: false, error: 'Cannot delete header row' };
      return deleteRow(data, row);
      
    case 'insertColumnBefore':
      return insertColumnBefore(data, col);
      
    case 'insertColumnAfter':
      return insertColumnAfter(data, col);
      
    case 'deleteColumn':
      return deleteColumn(data, col);
      
    case 'alignLeft':
    case 'alignCenter':
    case 'alignRight':
      return setColumnAlignment(data, col, action.replace('align', '').toLowerCase() as 'left' | 'center' | 'right');
      
    case 'setFontFamily':
      return setTableFontFamily(data, position.value);
      
    case 'setFontSize':
      return setTableFontSize(data, position.value);
      
    case 'deleteTable':
      // Table deletion is handled by the editor, not here
      return { success: true, data };
      
    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
};

/**
 * Create empty table with specified dimensions
 */
export const createEmptyTable = (rows: number = 2, cols: number = 2): BasicTableData => {
  const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
  const tableRows = Array.from({ length: rows }, () => Array(cols).fill(''));
  const columnAlignments = Array.from({ length: cols }, () => 'left' as const);
  
  return {
    headers,
    rows: tableRows,
    columnAlignments,
    fontFamily: undefined, // Use theme default
    fontSize: undefined,   // Use theme default
    id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
};