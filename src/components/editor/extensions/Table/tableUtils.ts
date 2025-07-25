// ABOUTME: Utility functions for table data manipulation and validation

import { TableData } from './TableExtension';

/**
 * Generate a unique table ID
 */
export const generateTableId = (): string => {
  return `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create default table data
 */
export const createDefaultTableData = (
  rows: number = 3,
  cols: number = 3,
  withHeaders: boolean = true
): TableData => {
  const headers = withHeaders ? Array.from({ length: cols }, (_, i) => `Column ${i + 1}`) : [];

  const tableRows = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

  return {
    headers,
    rows: tableRows,
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
};

/**
 * Validate table data structure
 */
export const validateTableData = (data: any): data is TableData => {
  if (!data || typeof data !== 'object') return false;

  const { headers, rows, styling, settings } = data;

  // Validate headers
  if (!Array.isArray(headers)) return false;
  if (!headers.every(header => typeof header === 'string')) return false;

  // Validate rows
  if (!Array.isArray(rows)) return false;
  if (!rows.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'string'))) {
    return false;
  }

  // Check column consistency
  const expectedCols = headers.length;
  if (!rows.every(row => row.length === expectedCols)) return false;

  // Validate styling (optional)
  if (styling && typeof styling !== 'object') return false;

  // Validate settings (optional)
  if (settings && typeof settings !== 'object') return false;

  return true;
};

/**
 * Normalize table data to ensure consistency
 */
export const normalizeTableData = (data: Partial<TableData>): TableData => {
  const defaultData = createDefaultTableData();

  const headers = Array.isArray(data.headers) ? data.headers : defaultData.headers;
  const rows = Array.isArray(data.rows) ? data.rows : defaultData.rows;

  // Ensure all rows have the same number of columns as headers
  const normalizedRows = rows.map(row => {
    const normalizedRow = [...row];
    while (normalizedRow.length < headers.length) {
      normalizedRow.push('');
    }
    return normalizedRow.slice(0, headers.length);
  });

  return {
    headers,
    rows: normalizedRows,
    styling: {
      ...defaultData.styling,
      ...data.styling,
    },
    settings: {
      ...defaultData.settings,
      ...data.settings,
    },
  };
};

/**
 * Convert table data to CSV format
 */
export const tableToCSV = (data: TableData): string => {
  const rows: string[][] = [];

  // Add headers if enabled
  if (data.settings.showHeaders && data.headers.length > 0) {
    rows.push(data.headers);
  }

  // Add data rows
  rows.push(...data.rows);

  // Convert to CSV
  return rows
    .map(row =>
      row
        .map(cell => {
          // Escape cells containing commas, quotes, or newlines
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    )
    .join('\n');
};

/**
 * Parse CSV data into table format
 */
export const csvToTable = (csvData: string, hasHeaders: boolean = true): TableData => {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return createDefaultTableData();
  }

  const parsedRows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Cell separator
        row.push(currentCell);
        currentCell = '';
        i++;
      } else {
        // Regular character
        currentCell += char;
        i++;
      }
    }

    // Add the last cell
    row.push(currentCell);
    parsedRows.push(row);
  }

  // Determine column count
  const maxCols = Math.max(...parsedRows.map(row => row.length));

  // Normalize all rows to have the same number of columns
  const normalizedRows = parsedRows.map(row => {
    while (row.length < maxCols) {
      row.push('');
    }
    return row;
  });

  let headers: string[] = [];
  let dataRows: string[][] = normalizedRows;

  if (hasHeaders && normalizedRows.length > 0) {
    headers = normalizedRows[0];
    dataRows = normalizedRows.slice(1);
  } else {
    headers = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
  }

  return {
    headers,
    rows: dataRows,
    styling: createDefaultTableData().styling,
    settings: {
      ...createDefaultTableData().settings,
      showHeaders: hasHeaders,
    },
  };
};

/**
 * Sort table rows by a specific column
 */
export const sortTableByColumn = (
  data: TableData,
  columnIndex: number,
  direction: 'asc' | 'desc' = 'asc'
): TableData => {
  if (columnIndex < 0 || columnIndex >= data.headers.length) {
    return data;
  }

  const sortedRows = [...data.rows].sort((a, b) => {
    const aValue = a[columnIndex] || '';
    const bValue = b[columnIndex] || '';

    // Try to parse as numbers for numeric sorting
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // String sorting
    const comparison = aValue.localeCompare(bValue);
    return direction === 'asc' ? comparison : -comparison;
  });

  return {
    ...data,
    rows: sortedRows,
  };
};

/**
 * Filter table rows based on a search term
 */
export const filterTableRows = (
  data: TableData,
  searchTerm: string,
  searchColumns?: number[]
): TableData => {
  if (!searchTerm.trim()) {
    return data;
  }

  const columnsToSearch = searchColumns || data.headers.map((_, i) => i);
  const lowercaseSearch = searchTerm.toLowerCase();

  const filteredRows = data.rows.filter(row => {
    return columnsToSearch.some(colIndex => {
      const cellValue = row[colIndex] || '';
      return cellValue.toLowerCase().includes(lowercaseSearch);
    });
  });

  return {
    ...data,
    rows: filteredRows,
  };
};

/**
 * Resize table to specific dimensions
 */
export const resizeTable = (data: TableData, newRows: number, newCols: number): TableData => {
  // Adjust headers
  const adjustedHeaders = [...data.headers];
  while (adjustedHeaders.length < newCols) {
    adjustedHeaders.push(`Column ${adjustedHeaders.length + 1}`);
  }
  const finalHeaders = adjustedHeaders.slice(0, newCols);

  // Adjust rows
  const adjustedRows = [...data.rows];

  // Add rows if needed
  while (adjustedRows.length < newRows) {
    adjustedRows.push(Array(newCols).fill(''));
  }

  // Adjust columns in each row
  const finalRows = adjustedRows.slice(0, newRows).map(row => {
    const adjustedRow = [...row];
    while (adjustedRow.length < newCols) {
      adjustedRow.push('');
    }
    return adjustedRow.slice(0, newCols);
  });

  return {
    ...data,
    headers: finalHeaders,
    rows: finalRows,
  };
};

/**
 * Get table statistics
 */
export interface TableStats {
  totalCells: number;
  filledCells: number;
  emptyCells: number;
  fillPercentage: number;
  dimensions: {
    rows: number;
    columns: number;
  };
}

export const getTableStats = (data: TableData): TableStats => {
  const totalCells = data.rows.length * data.headers.length;
  const filledCells = data.rows.flat().filter(cell => cell.trim().length > 0).length;
  const emptyCells = totalCells - filledCells;
  const fillPercentage = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

  return {
    totalCells,
    filledCells,
    emptyCells,
    fillPercentage: Math.round(fillPercentage * 100) / 100,
    dimensions: {
      rows: data.rows.length,
      columns: data.headers.length,
    },
  };
};
