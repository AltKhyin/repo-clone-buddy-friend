// ABOUTME: Migration utilities for table data structure upgrades and backward compatibility

import { TableData, LegacyTableData, RichCellData } from './TableExtension';
import { 
  convertPlainTextToRichContent, 
  extractPlainTextFromRichContent,
  isValidRichContent,
  EMPTY_RICH_CELL_CONTENT 
} from './tableEditorConfig';

/**
 * Type guard to check if a cell is rich content
 */
export function isRichCellData(cell: string | RichCellData): cell is RichCellData {
  return typeof cell === 'object' && cell !== null && 'content' in cell;
}

/**
 * Type guard to check if table data is legacy format
 */
export function isLegacyTableData(data: any): data is LegacyTableData {
  return (
    data &&
    Array.isArray(data.headers) &&
    Array.isArray(data.rows) &&
    data.rows.every((row: any) => 
      Array.isArray(row) && 
      row.every((cell: any) => typeof cell === 'string')
    ) &&
    !data.isRichContent
  );
}

/**
 * Convert legacy table data to rich format
 */
export function migrateLegacyToRich(legacyData: LegacyTableData): TableData {
  const richRows: (string | RichCellData)[][] = legacyData.rows.map(row =>
    row.map(cell => ({
      content: cell ? convertPlainTextToRichContent(cell) : EMPTY_RICH_CELL_CONTENT,
      styling: {} // No cell-specific styling in legacy data
    } as RichCellData))
  );

  return {
    ...legacyData,
    rows: richRows,
    isRichContent: true,
  };
}

/**
 * Convert rich table data back to legacy format (for backward compatibility)
 */
export function convertRichToLegacy(richData: TableData): LegacyTableData {
  const legacyRows: string[][] = richData.rows.map(row =>
    row.map(cell => {
      if (isRichCellData(cell)) {
        return extractPlainTextFromRichContent(cell.content);
      }
      return typeof cell === 'string' ? cell : '';
    })
  );

  return {
    headers: richData.headers,
    rows: legacyRows,
    styling: richData.styling,
    settings: richData.settings,
  };
}

/**
 * Get cell content as string (handles both legacy and rich formats)
 */
export function getCellContentAsString(cell: string | RichCellData): string {
  if (isRichCellData(cell)) {
    return extractPlainTextFromRichContent(cell.content);
  }
  return cell || '';
}

/**
 * Get cell content as rich HTML (handles both legacy and rich formats)
 */
export function getCellContentAsRich(cell: string | RichCellData): string {
  if (isRichCellData(cell)) {
    return cell.content;
  }
  // Convert legacy string to rich content
  return cell ? convertPlainTextToRichContent(cell) : EMPTY_RICH_CELL_CONTENT;
}

/**
 * Create a rich cell data object from content
 */
export function createRichCellData(
  content: string, 
  styling?: RichCellData['styling']
): RichCellData {
  return {
    content: isValidRichContent(content) ? content : convertPlainTextToRichContent(content),
    styling: styling || {},
  };
}

/**
 * Update cell content while preserving existing styling
 */
export function updateCellContent(
  cell: string | RichCellData, 
  newContent: string
): RichCellData {
  const existingStyling = isRichCellData(cell) ? cell.styling : {};
  
  return {
    content: isValidRichContent(newContent) ? newContent : convertPlainTextToRichContent(newContent),
    styling: existingStyling,
  };
}

/**
 * Ensure table data is in rich format (migrate if necessary)
 */
export function ensureRichTableData(data: any): TableData {
  if (isLegacyTableData(data)) {
    console.info('Migrating legacy table data to rich format');
    return migrateLegacyToRich(data);
  }
  
  // Assume it's already rich format or compatible
  return {
    ...data,
    isRichContent: true,
  } as TableData;
}

/**
 * Create empty rich table data
 */
export function createEmptyRichTable(
  rows: number = 3, 
  cols: number = 3, 
  withHeaders: boolean = true
): TableData {
  const headers = withHeaders 
    ? Array.from({ length: cols }, (_, i) => `Column ${i + 1}`)
    : [];

  const richRows: RichCellData[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      content: EMPTY_RICH_CELL_CONTENT,
      styling: {},
    }))
  );

  return {
    headers,
    rows: richRows,
    isRichContent: true,
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
    },
    settings: {
      sortable: false,
      resizable: true,
      showHeaders: withHeaders,
      minRows: 1,
      maxRows: 50,
    },
  };
}

/**
 * Validate table data structure
 */
export function validateTableData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push('Table data is null or undefined');
    return { isValid: false, errors };
  }

  if (!Array.isArray(data.headers)) {
    errors.push('Headers must be an array');
  }

  if (!Array.isArray(data.rows)) {
    errors.push('Rows must be an array');
  } else {
    data.rows.forEach((row: any, rowIndex: number) => {
      if (!Array.isArray(row)) {
        errors.push(`Row ${rowIndex} must be an array`);
      } else {
        row.forEach((cell: any, cellIndex: number) => {
          if (typeof cell !== 'string' && !isRichCellData(cell)) {
            errors.push(`Cell at row ${rowIndex}, col ${cellIndex} must be string or RichCellData`);
          }
        });
      }
    });
  }

  if (!data.styling || typeof data.styling !== 'object') {
    errors.push('Styling configuration is required');
  }

  if (!data.settings || typeof data.settings !== 'object') {
    errors.push('Settings configuration is required');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitize table data to ensure it's safe for rendering
 */
export function sanitizeTableData(data: TableData): TableData {
  const validation = validateTableData(data);
  if (!validation.isValid) {
    console.warn('Table data validation failed:', validation.errors);
    // Return a safe default table
    return createEmptyRichTable();
  }

  // Ensure all cells are properly formatted
  const sanitizedRows = data.rows.map(row =>
    row.map(cell => {
      if (isRichCellData(cell)) {
        return {
          content: cell.content || EMPTY_RICH_CELL_CONTENT,
          styling: cell.styling || {},
        };
      }
      return cell || '';
    })
  );

  return {
    ...data,
    rows: sanitizedRows,
    isRichContent: true,
  };
}