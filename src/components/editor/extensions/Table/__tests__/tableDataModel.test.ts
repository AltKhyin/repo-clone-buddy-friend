// ABOUTME: Tests for table data model extensions and migration utilities

import { describe, it, expect } from 'vitest';
import { TableData, HeaderLayout } from '../TableExtension';
import { 
  migrateTableData, 
  ensureTableDataIntegrity, 
  generateRowHeaders,
  updateHeaderLayout 
} from '../tableMigration';

describe('Table Data Model Extensions', () => {
  describe('TableData Interface', () => {
    it('should support all header layout options', () => {
      const layouts: HeaderLayout[] = ['column-only', 'row-only', 'both', 'none'];
      
      layouts.forEach(layout => {
        const tableData: TableData = {
          headers: ['Col 1', 'Col 2'],
          rowHeaders: ['Row 1', 'Row 2'],
          rows: [['A', 'B'], ['C', 'D']],
          headerLayout: layout,
          styling: {
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            gridLineColor: '#e2e8f0',
            backgroundColor: 'transparent',
            headerBackgroundColor: '#f8fafc',
            alternatingRowColor: '#f8fafc',
            enableAlternatingRows: false,
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
            showHeaders: true,
            minRows: 1,
            maxRows: 50,
          },
        };
        
        expect(tableData.headerLayout).toBe(layout);
      });
    });

    it('should support new styling options', () => {
      const tableData: TableData = {
        headers: [],
        rowHeaders: [],
        rows: [],
        headerLayout: 'column-only',
        styling: {
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#000',
          gridLineColor: '#333',
          backgroundColor: '#fff',
          headerBackgroundColor: '#f0f0f0',
          alternatingRowColor: '#f9f9f9',
          enableAlternatingRows: true,
          cellPadding: 12,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 400,
          striped: false,
          compact: false,
        },
        settings: {
          sortable: false,
          resizable: true,
          showHeaders: true,
          minRows: 1,
          maxRows: 50,
        },
      };

      expect(tableData.styling.gridLineColor).toBe('#333');
      expect(tableData.styling.alternatingRowColor).toBe('#f9f9f9');
      expect(tableData.styling.enableAlternatingRows).toBe(true);
    });
  });

  describe('Migration Utilities', () => {
    it('should migrate legacy table data to new format', () => {
      const legacyData = {
        headers: ['Col 1', 'Col 2'],
        rows: [['A', 'B'], ['C', 'D']],
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
          striped: true, // Legacy striped field
          compact: false,
        },
        settings: {
          sortable: false,
          resizable: true,
          showHeaders: true,
          minRows: 1,
          maxRows: 50,
        },
      };

      const migrated = migrateTableData(legacyData);

      expect(migrated.headerLayout).toBe('column-only');
      expect(migrated.rowHeaders).toEqual([]);
      expect(migrated.styling.gridLineColor).toBe('#e2e8f0');
      expect(migrated.styling.enableAlternatingRows).toBe(true); // Migrated from striped
      expect(migrated.styling.alternatingRowColor).toBe('#f8fafc');
    });

    it('should handle data already in new format', () => {
      const newData: TableData = {
        headers: ['Col 1'],
        rowHeaders: ['Row 1'],
        rows: [['A']],
        headerLayout: 'both',
        styling: {
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          gridLineColor: '#ccc',
          backgroundColor: 'transparent',
          headerBackgroundColor: '#f8fafc',
          alternatingRowColor: '#f0f0f0',
          enableAlternatingRows: true,
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
          showHeaders: true,
          minRows: 1,
          maxRows: 50,
        },
      };

      const result = migrateTableData(newData);
      expect(result).toEqual(newData);
    });

    it('should ensure table data integrity', () => {
      const partialData = {
        headers: ['Col 1'],
        rows: [['A']],
      };

      const complete = ensureTableDataIntegrity(partialData);

      expect(complete.rowHeaders).toEqual([]);
      expect(complete.headerLayout).toBe('column-only');
      expect(complete.styling.gridLineColor).toBe('#e2e8f0');
      expect(complete.styling.enableAlternatingRows).toBe(false);
    });

    it('should generate row headers', () => {
      const headers = generateRowHeaders(3);
      expect(headers).toEqual(['Row 1', 'Row 2', 'Row 3']);

      const customHeaders = generateRowHeaders(2, 'Item');
      expect(customHeaders).toEqual(['Item 1', 'Item 2']);
    });

    it('should update header layout correctly', () => {
      const tableData: TableData = {
        headers: ['Col 1'],
        rowHeaders: [],
        rows: [['A'], ['B']],
        headerLayout: 'column-only',
        styling: {
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          gridLineColor: '#e2e8f0',
          backgroundColor: 'transparent',
          headerBackgroundColor: '#f8fafc',
          alternatingRowColor: '#f8fafc',
          enableAlternatingRows: false,
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
          showHeaders: true,
          minRows: 1,
          maxRows: 50,
        },
      };

      const updates = updateHeaderLayout(tableData, 'both');
      
      expect(updates.headerLayout).toBe('both');
      expect(updates.rowHeaders).toEqual(['Row 1', 'Row 2']);
    });
  });
});