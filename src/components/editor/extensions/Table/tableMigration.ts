// ABOUTME: Migration utilities for table data structure updates

import { TableData, HeaderLayout, LegacyTableData } from './TableExtension';

/**
 * Default values for new table fields
 */
const DEFAULT_TABLE_VALUES = {
  rowHeaders: [] as string[],
  headerLayout: 'column-only' as HeaderLayout,
  gridLineColor: '#e2e8f0',
  alternatingRowColor: '#f8fafc',
  enableAlternatingRows: false,
};

/**
 * Migrates legacy table data to the new table structure
 * Ensures backward compatibility with existing tables
 */
export function migrateTableData(data: any): TableData {
  // If data is already in the new format, return as-is
  if (data.headerLayout !== undefined && data.rowHeaders !== undefined) {
    return data as TableData;
  }

  // Migrate from legacy format
  const legacyData = data as Partial<LegacyTableData>;
  
  // Determine header layout based on legacy showHeaders setting
  let headerLayout: HeaderLayout = 'column-only';
  if (legacyData.settings?.showHeaders === false) {
    headerLayout = 'none';
  }

  // Migrate styling with new defaults
  const migratedStyling = {
    ...DEFAULT_TABLE_VALUES,
    ...legacyData.styling,
    // Map legacy striped to enableAlternatingRows
    enableAlternatingRows: legacyData.styling?.striped || false,
    // Set gridLineColor to borderColor if not specified
    gridLineColor: legacyData.styling?.gridLineColor || legacyData.styling?.borderColor || DEFAULT_TABLE_VALUES.gridLineColor,
  };

  const migratedData: TableData = {
    headers: legacyData.headers || [],
    rowHeaders: DEFAULT_TABLE_VALUES.rowHeaders,
    rows: legacyData.rows || [],
    isRichContent: data.isRichContent,
    headerLayout,
    styling: migratedStyling,
    settings: {
      ...legacyData.settings,
      showHeaders: legacyData.settings?.showHeaders ?? true, // Keep legacy field for compatibility
    } as TableData['settings'],
  };

  return migratedData;
}

/**
 * Ensures table data has all required fields with proper defaults
 * Used when rendering tables to handle any missing fields
 */
export function ensureTableDataIntegrity(data: Partial<TableData>): TableData {
  return {
    headers: data.headers || [],
    rowHeaders: data.rowHeaders || DEFAULT_TABLE_VALUES.rowHeaders,
    rows: data.rows || [],
    isRichContent: data.isRichContent,
    headerLayout: data.headerLayout || DEFAULT_TABLE_VALUES.headerLayout,
    styling: {
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: 'transparent',
      headerBackgroundColor: '#f8fafc',
      cellPadding: 12,
      textAlign: 'left',
      fontSize: 14,
      fontWeight: 400,
      striped: false,
      compact: false,
      ...DEFAULT_TABLE_VALUES,
      ...data.styling,
    },
    settings: {
      sortable: false,
      resizable: true,
      showHeaders: true,
      minRows: 1,
      maxRows: 50,
      ...data.settings,
    },
  };
}

/**
 * Generates row headers based on table dimensions
 * Used when switching to row header layouts
 */
export function generateRowHeaders(rowCount: number, prefix: string = 'Row'): string[] {
  return Array.from({ length: rowCount }, (_, i) => `${prefix} ${i + 1}`);
}

/**
 * Updates header layout and ensures appropriate headers exist
 */
export function updateHeaderLayout(
  tableData: TableData, 
  newLayout: HeaderLayout
): Partial<TableData> {
  const updates: Partial<TableData> = {
    headerLayout: newLayout,
  };

  // Generate row headers if switching to row-based layout and none exist
  if ((newLayout === 'row-only' || newLayout === 'both') && tableData.rowHeaders.length === 0) {
    updates.rowHeaders = generateRowHeaders(tableData.rows.length);
  }

  // Generate column headers if switching to column-based layout and none exist
  if ((newLayout === 'column-only' || newLayout === 'both') && tableData.headers.length === 0) {
    const colCount = tableData.rows[0]?.length || 3;
    updates.headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
  }

  return updates;
}