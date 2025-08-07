// ABOUTME: Migration utilities to convert complex tables to simple BasicTable format

import { BasicTableData } from './types';
import { createEmptyTable } from './tableOperations';

/**
 * Complex table data structure (from legacy TableExtension)
 */
interface ComplexTableData {
  headers: string[];
  rows: (string | RichCellData)[][];
  rowHeaders?: string[];
  headerLayout?: string;
  styling?: any;
  settings?: any;
  isRichContent?: boolean;
}

/**
 * Legacy table data structure (simple strings)
 */
interface LegacyTableData {
  headers: string[];
  rows: string[][];
  styling?: any;
  settings?: any;
}

/**
 * Rich cell data from complex table system
 */
interface RichCellData {
  content: string; // HTML content
  styling?: Record<string, any>;
}

/**
 * Migration result with conversion details
 */
interface MigrationResult {
  success: boolean;
  data?: BasicTableData;
  warnings: string[];
  originalComplexity: number;
  newComplexity: number;
}

/**
 * Check if cell data is rich content format
 */
function isRichCellData(cell: string | RichCellData): cell is RichCellData {
  return typeof cell === 'object' && cell !== null && 'content' in cell;
}

/**
 * Extract plain text from HTML content
 */
function extractPlainText(htmlContent: string): string {
  if (!htmlContent) return '';
  
  // Add space before block elements to preserve word boundaries
  let processed = htmlContent
    .replace(/<\/(div|p|br|h[1-6]|li|td|th)>/gi, ' </$1>') // Add space before closing block tags
    .replace(/<(div|p|br|h[1-6]|li|td|th)[^>]*>/gi, ' <$1>') // Add space before opening block tags
    .replace(/<br[^>]*>/gi, ' ') // Convert br tags to spaces
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Decode ampersands
    .replace(/&lt;/g, '<') // Decode less-than
    .replace(/&gt;/g, '>') // Decode greater-than
    .replace(/&quot;/g, '"') // Decode quotes
    .replace(/&#39;/g, "'") // Decode apostrophes
    .replace(/\s+/g, ' ') // Normalize all whitespace to single spaces
    .trim();
    
  return processed;
}

/**
 * Convert rich cell to plain text
 */
function convertCellToPlainText(cell: string | RichCellData): string {
  if (isRichCellData(cell)) {
    return extractPlainText(cell.content);
  }
  return cell || '';
}

/**
 * Calculate complexity score for migration tracking
 */
function calculateComplexity(data: ComplexTableData | LegacyTableData): number {
  let complexity = 0;
  
  // Base complexity from data structure
  complexity += (data.headers?.length || 0) * (data.rows?.length || 0);
  
  // Add complexity for rich features
  if ('isRichContent' in data && data.isRichContent) {
    complexity += 50; // Rich content adds significant complexity
  }
  
  if ('styling' in data && data.styling && Object.keys(data.styling).length > 0) {
    complexity += Object.keys(data.styling).length * 2;
  }
  
  if ('settings' in data && data.settings && Object.keys(data.settings).length > 0) {
    complexity += Object.keys(data.settings).length;
  }
  
  // Count rich cells
  if ('rows' in data && data.rows) {
    data.rows.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(cell => {
          if (isRichCellData(cell)) {
            complexity += 5; // Each rich cell adds complexity
          }
        });
      }
    });
  }
  
  return complexity;
}

/**
 * Type guard to check if data is legacy format
 */
function isLegacyTableData(data: any): data is LegacyTableData {
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
 * Type guard to check if data is complex format  
 */
function isComplexTableData(data: any): data is ComplexTableData {
  return (
    data &&
    Array.isArray(data.headers) &&
    Array.isArray(data.rows) &&
    (data.isRichContent || data.styling || data.settings || data.rowHeaders)
  );
}

/**
 * Migrate complex table data to BasicTable format
 */
export function migrateComplexToBasic(data: any): MigrationResult {
  const warnings: string[] = [];
  const originalComplexity = calculateComplexity(data);
  
  try {
    // Validate input data
    if (!data) {
      return {
        success: false,
        warnings: ['Input data is null or undefined'],
        originalComplexity: 0,
        newComplexity: 0
      };
    }

    if (!Array.isArray(data.headers) || !Array.isArray(data.rows)) {
      return {
        success: false,
        warnings: ['Invalid table structure: headers and rows must be arrays'],
        originalComplexity: originalComplexity,
        newComplexity: 0
      };
    }

    // Extract basic table structure
    const basicHeaders: string[] = data.headers.map((header: any) => {
      if (typeof header === 'string') {
        return header;
      } else if (isRichCellData(header)) {
        warnings.push('Header rich content converted to plain text');
        return extractPlainText(header.content);
      } else {
        warnings.push('Invalid header format converted to string');
        return String(header);
      }
    });

    const basicRows: string[][] = data.rows.map((row: any, rowIndex: number) => {
      if (!Array.isArray(row)) {
        warnings.push(`Row ${rowIndex} is not an array, skipping`);
        return [];
      }

      return row.map((cell: any, cellIndex: number) => {
        const plainText = convertCellToPlainText(cell);
        
        // Track rich content loss
        if (isRichCellData(cell) && cell.content !== plainText) {
          warnings.push(`Rich content in cell [${rowIndex}][${cellIndex}] converted to plain text`);
        }
        
        return plainText;
      });
    });

    // Validate converted data structure
    if (basicHeaders.length === 0 || basicRows.length === 0) {
      warnings.push('Creating default table structure - original data was empty');
      const defaultTable = createEmptyTable(2, 2);
      return {
        success: true,
        data: defaultTable,
        warnings,
        originalComplexity,
        newComplexity: 8 // 2x2 table
      };
    }

    // Ensure all rows have the same number of columns as headers
    const normalizedRows = basicRows.map((row, rowIndex) => {
      // Skip normalization for empty rows from invalid data
      if (row.length === 0) {
        return row;
      }
      
      if (row.length !== basicHeaders.length) {
        warnings.push(`Row ${rowIndex} column count mismatch, normalizing`);
        
        // Pad or truncate row to match header count
        const normalizedRow = [...row];
        while (normalizedRow.length < basicHeaders.length) {
          normalizedRow.push('');
        }
        return normalizedRow.slice(0, basicHeaders.length);
      }
      return row;
    });

    const basicTableData: BasicTableData = {
      headers: basicHeaders,
      rows: normalizedRows,
      id: `migrated-table-${Date.now()}`
    };

    const newComplexity = basicHeaders.length * normalizedRows.length;

    // Add warnings about lost features
    if (isComplexTableData(data)) {
      if (data.styling && Object.keys(data.styling).length > 0) {
        warnings.push('Table styling configuration removed (not supported in BasicTable)');
      }
      
      if (data.settings && Object.keys(data.settings).length > 0) {
        warnings.push('Table settings (sortable, resizable, etc.) removed (not supported in BasicTable)');
      }
      
      if (data.rowHeaders && data.rowHeaders.length > 0) {
        warnings.push('Row headers removed (not supported in BasicTable)');
      }
      
      if (data.headerLayout && data.headerLayout !== 'column-only') {
        warnings.push('Complex header layout simplified to column-only');
      }
    }

    return {
      success: true,
      data: basicTableData,
      warnings,
      originalComplexity,
      newComplexity
    };

  } catch (error) {
    console.error('[Migration] Error migrating complex table:', error);
    
    return {
      success: false,
      warnings: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      originalComplexity,
      newComplexity: 0
    };
  }
}

/**
 * Migrate any table format to BasicTable
 * Handles both legacy and complex formats
 */
export function migrateToBasicTable(data: any): BasicTableData {
  try {
    if (!data) {
      console.warn('[Migration] No data provided, creating empty table');
      return createEmptyTable();
    }

    // If already BasicTable format, return as-is (but ensure ID is present)
    if (data.headers && data.rows && !data.isRichContent && !data.styling && !data.settings) {
      return {
        ...data,
        id: data.id || `basic-table-${Date.now()}`
      } as BasicTableData;
    }

    const result = migrateComplexToBasic(data);
    
    if (!result.success || !result.data) {
      console.error('[Migration] Migration failed:', result.warnings);
      return createEmptyTable();
    }

    // Log migration results
    if (result.warnings.length > 0) {
      console.info('[Migration] Table migrated with warnings:', {
        warnings: result.warnings,
        complexityReduction: Math.round((1 - result.newComplexity / result.originalComplexity) * 100) + '%',
        originalComplexity: result.originalComplexity,
        newComplexity: result.newComplexity
      });
    } else {
      console.info('[Migration] Table migrated successfully:', {
        complexityReduction: Math.round((1 - result.newComplexity / result.originalComplexity) * 100) + '%',
        headers: result.data.headers.length,
        rows: result.data.rows.length
      });
    }

    return result.data;
  } catch (error) {
    console.error('[Migration] Unexpected error during migration:', error);
    return createEmptyTable();
  }
}

/**
 * Check if table data needs migration
 */
export function needsMigration(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  return Boolean(
    data.isRichContent || 
    data.styling || 
    data.settings || 
    data.rowHeaders ||
    (data.rows && Array.isArray(data.rows) && data.rows.some((row: any) => 
      Array.isArray(row) && row.some((cell: any) => isRichCellData(cell))
    ))
  );
}

/**
 * Get migration preview (dry run)
 */
export function getMigrationPreview(data: any): {
  needsMigration: boolean;
  featuresLost: string[];
  complexity: { before: number; after: number; reduction: string };
} {
  if (!needsMigration(data)) {
    return {
      needsMigration: false,
      featuresLost: [],
      complexity: { before: 0, after: 0, reduction: '0%' }
    };
  }

  const result = migrateComplexToBasic(data);
  
  return {
    needsMigration: true,
    featuresLost: result.warnings,
    complexity: {
      before: result.originalComplexity,
      after: result.newComplexity,
      reduction: Math.round((1 - result.newComplexity / result.originalComplexity) * 100) + '%'
    }
  };
}