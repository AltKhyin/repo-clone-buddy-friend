// ABOUTME: Tests for table operations - simple array manipulation functions

import { describe, it, expect } from 'vitest';
import {
  insertRowAbove,
  insertRowBelow,
  deleteRow,
  insertColumnBefore,
  insertColumnAfter,
  deleteColumn,
  executeTableOperation,
  validateTableData,
  createEmptyTable
} from '../tableOperations';
import { BasicTableData, DEFAULT_TABLE_DATA } from '../types';

describe('Table Operations', () => {
  const sampleData: BasicTableData = {
    headers: ['Col A', 'Col B', 'Col C'],
    rows: [
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3']
    ]
  };

  describe('Data Validation', () => {
    it('validates correct table data', () => {
      const result = validateTableData(sampleData);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects data with invalid headers', () => {
      const invalidData = { ...sampleData, headers: null as any };
      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Headers must be an array');
    });

    it('rejects data with invalid rows', () => {
      const invalidData = { ...sampleData, rows: null as any };
      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Rows must be an array');
    });

    it('rejects data with no columns', () => {
      const invalidData = { ...sampleData, headers: [] };
      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least one column');
    });

    it('rejects data with mismatched column counts', () => {
      const invalidData = {
        ...sampleData,
        rows: [
          ['A1', 'B1'], // Missing column
          ['A2', 'B2', 'C2']
        ]
      };
      const result = validateTableData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('incorrect number of columns');
    });
  });

  describe('Row Operations', () => {
    describe('insertRowAbove', () => {
      it('inserts row above specified position', () => {
        const result = insertRowAbove(sampleData, 1);
        
        expect(result.success).toBe(true);
        expect(result.data?.rows).toHaveLength(4);
        expect(result.data?.rows[1]).toEqual(['', '', '']); // New empty row
        expect(result.data?.rows[2]).toEqual(['A2', 'B2', 'C2']); // Original row shifted down
      });

      it('inserts row at beginning when index is 0', () => {
        const result = insertRowAbove(sampleData, 0);
        
        expect(result.success).toBe(true);
        expect(result.data?.rows[0]).toEqual(['', '', '']);
        expect(result.data?.rows[1]).toEqual(['A1', 'B1', 'C1']);
      });

      it('handles invalid data', () => {
        const invalidData = { headers: [], rows: [] };
        const result = insertRowAbove(invalidData, 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('insertRowBelow', () => {
      it('inserts row below specified position', () => {
        const result = insertRowBelow(sampleData, 1);
        
        expect(result.success).toBe(true);
        expect(result.data?.rows).toHaveLength(4);
        expect(result.data?.rows[2]).toEqual(['', '', '']); // New empty row
        expect(result.data?.rows[1]).toEqual(['A2', 'B2', 'C2']); // Original row unchanged
      });

      it('appends row at end', () => {
        const result = insertRowBelow(sampleData, 2);
        
        expect(result.success).toBe(true);
        expect(result.data?.rows).toHaveLength(4);
        expect(result.data?.rows[3]).toEqual(['', '', '']); // New row at end
      });
    });

    describe('deleteRow', () => {
      it('deletes specified row', () => {
        const result = deleteRow(sampleData, 1);
        
        expect(result.success).toBe(true);
        expect(result.data?.rows).toHaveLength(2);
        expect(result.data?.rows[0]).toEqual(['A1', 'B1', 'C1']);
        expect(result.data?.rows[1]).toEqual(['A3', 'B3', 'C3']); // Row 2 becomes row 1
      });

      it('prevents deletion of last row', () => {
        const singleRowData = {
          headers: ['Col A'],
          rows: [['A1']]
        };
        const result = deleteRow(singleRowData, 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot delete the last row');
      });

      it('handles invalid row index', () => {
        const result = deleteRow(sampleData, 10);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid row index');
      });
    });
  });

  describe('Column Operations', () => {
    describe('insertColumnBefore', () => {
      it('inserts column before specified position', () => {
        const result = insertColumnBefore(sampleData, 1);
        
        expect(result.success).toBe(true);
        expect(result.data?.headers).toHaveLength(4);
        expect(result.data?.headers[1]).toBe('Column 2'); // New column
        expect(result.data?.headers[2]).toBe('Col B'); // Original column shifted
        
        // Check all rows have new column
        result.data?.rows.forEach(row => {
          expect(row).toHaveLength(4);
          expect(row[1]).toBe(''); // New empty column
        });
      });

      it('inserts column at beginning', () => {
        const result = insertColumnBefore(sampleData, 0);
        
        expect(result.success).toBe(true);
        expect(result.data?.headers[0]).toBe('Column 1');
        expect(result.data?.headers[1]).toBe('Col A');
      });
    });

    describe('insertColumnAfter', () => {
      it('inserts column after specified position', () => {
        const result = insertColumnAfter(sampleData, 1);
        
        expect(result.success).toBe(true);
        expect(result.data?.headers).toHaveLength(4);
        expect(result.data?.headers[1]).toBe('Col B'); // Original column unchanged
        expect(result.data?.headers[2]).toBe('Column 3'); // New column
      });

      it('appends column at end', () => {
        const result = insertColumnAfter(sampleData, 2);
        
        expect(result.success).toBe(true);
        expect(result.data?.headers).toHaveLength(4);
        expect(result.data?.headers[3]).toBe('Column 4'); // New column at end
      });
    });

    describe('deleteColumn', () => {
      it('deletes specified column', () => {
        const result = deleteColumn(sampleData, 1);
        
        expect(result.success).toBe(true);
        expect(result.data?.headers).toHaveLength(2);
        expect(result.data?.headers).toEqual(['Col A', 'Col C']);
        
        // Check all rows have column removed
        result.data?.rows.forEach((row, i) => {
          expect(row).toHaveLength(2);
          expect(row).toEqual([`A${i + 1}`, `C${i + 1}`]);
        });
      });

      it('prevents deletion of last column', () => {
        const singleColumnData = {
          headers: ['Col A'],
          rows: [['A1'], ['A2']]
        };
        const result = deleteColumn(singleColumnData, 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot delete the last column');
      });

      it('handles invalid column index', () => {
        const result = deleteColumn(sampleData, 10);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid column index');
      });
    });
  });

  describe('Operation Execution', () => {
    it('executes row operations correctly', () => {
      const position = { row: 1, col: 0 };
      
      const result = executeTableOperation(sampleData, 'insertRowAbove', position);
      expect(result.success).toBe(true);
      expect(result.data?.rows).toHaveLength(4);
    });

    it('executes column operations correctly', () => {
      const position = { row: 0, col: 1 };
      
      const result = executeTableOperation(sampleData, 'insertColumnBefore', position);
      expect(result.success).toBe(true);
      expect(result.data?.headers).toHaveLength(4);
    });

    it('handles alignment operations', () => {
      const position = { row: 0, col: 1 };
      
      const result = executeTableOperation(sampleData, 'alignCenter', position);
      expect(result.success).toBe(true);
      // Alignment doesn't change data, just returns success
    });

    it('handles delete table operation', () => {
      const position = { row: 0, col: 0 };
      
      const result = executeTableOperation(sampleData, 'deleteTable', position);
      expect(result.success).toBe(true);
      // Delete table is handled by editor, not operation
    });

    it('rejects invalid operations', () => {
      const position = { row: 0, col: 0 };
      
      const result = executeTableOperation(sampleData, 'invalidAction' as any, position);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('prevents header row deletion', () => {
      const position = { row: -1, col: 0 }; // Header row
      
      const result = executeTableOperation(sampleData, 'deleteRow', position);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot delete header row');
    });
  });

  describe('Table Creation', () => {
    it('creates empty table with default dimensions', () => {
      const result = createEmptyTable();
      
      expect(result.headers).toEqual(['Column 1', 'Column 2']);
      expect(result.rows).toEqual([['', ''], ['', '']]);
      expect(result.id).toBeDefined();
    });

    it('creates empty table with custom dimensions', () => {
      const result = createEmptyTable(3, 4);
      
      expect(result.headers).toHaveLength(4);
      expect(result.rows).toHaveLength(3);
      result.rows.forEach(row => {
        expect(row).toHaveLength(4);
        expect(row.every(cell => cell === '')).toBe(true);
      });
    });

    it('generates unique IDs', () => {
      const table1 = createEmptyTable();
      const table2 = createEmptyTable();
      
      expect(table1.id).not.toBe(table2.id);
    });
  });
});