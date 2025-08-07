// ABOUTME: Tests for table migration from complex to basic format

import { describe, it, expect, vi } from 'vitest';
import {
  migrateComplexToBasic,
  migrateToBasicTable,
  needsMigration,
  getMigrationPreview
} from '../migration';
import { BasicTableData } from '../types';

// Mock data structures representing complex table formats
const mockLegacyTableData = {
  headers: ['Name', 'Age', 'City'],
  rows: [
    ['John Doe', '30', 'New York'],
    ['Jane Smith', '25', 'London'],
    ['Bob Johnson', '35', 'Paris']
  ],
  styling: {
    borderColor: '#000000',
    striped: true,
    fontSize: 14
  },
  settings: {
    sortable: true,
    resizable: false
  }
};

const mockComplexTableData = {
  headers: ['Product', 'Description'],
  rows: [
    [
      {
        content: '<p>Laptop</p>',
        styling: { fontWeight: 'bold' }
      },
      {
        content: '<p>High-performance <strong>gaming</strong> laptop with RGB lighting</p>',
        styling: { color: 'blue' }
      }
    ],
    [
      'Mouse', // Mix of rich and plain
      {
        content: '<p>Wireless gaming mouse</p>',
        styling: {}
      }
    ]
  ],
  isRichContent: true,
  styling: {
    borderStyle: 'solid',
    borderWidth: 2,
    backgroundColor: '#f0f0f0'
  },
  settings: {
    sortable: false,
    resizable: true,
    showHeaders: true
  },
  rowHeaders: ['Item 1', 'Item 2'],
  headerLayout: 'both'
};

const mockBasicTableData: BasicTableData = {
  headers: ['Column 1', 'Column 2'],
  rows: [
    ['Data 1', 'Data 2'],
    ['Data 3', 'Data 4']
  ],
  id: 'basic-table-1'
};

describe('Table Migration', () => {
  describe('migrateComplexToBasic', () => {
    it('should migrate legacy table data successfully', () => {
      const result = migrateComplexToBasic(mockLegacyTableData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.data!.rows).toEqual([
        ['John Doe', '30', 'New York'],
        ['Jane Smith', '25', 'London'],
        ['Bob Johnson', '35', 'Paris']
      ]);
      expect(result.data!.id).toBeDefined();
    });

    it('should migrate complex rich content table', () => {
      const result = migrateComplexToBasic(mockComplexTableData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.headers).toEqual(['Product', 'Description']);
      
      // Check that rich content is converted to plain text
      expect(result.data!.rows[0][0]).toBe('Laptop');
      expect(result.data!.rows[0][1]).toBe('High-performance gaming laptop with RGB lighting');
      expect(result.data!.rows[1][0]).toBe('Mouse');
      expect(result.data!.rows[1][1]).toBe('Wireless gaming mouse');
    });

    it('should report warnings for lost features', () => {
      const result = migrateComplexToBasic(mockComplexTableData);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('styling'))).toBe(true);
      expect(result.warnings.some(w => w.includes('settings'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Row headers'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Rich content'))).toBe(true);
    });

    it('should calculate complexity reduction', () => {
      const result = migrateComplexToBasic(mockComplexTableData);

      expect(result.originalComplexity).toBeGreaterThan(result.newComplexity);
      expect(result.originalComplexity).toBeGreaterThan(0);
      expect(result.newComplexity).toBe(4); // 2 headers × 2 rows
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = {
        headers: 'not-an-array',
        rows: null
      };

      const result = migrateComplexToBasic(malformedData);

      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should normalize row lengths to match headers', () => {
      const mismatchedData = {
        headers: ['Col1', 'Col2', 'Col3'],
        rows: [
          ['A', 'B'], // Missing column
          ['D', 'E', 'F', 'G'], // Extra columns
          ['H', 'I', 'J'] // Correct length
        ]
      };

      const result = migrateComplexToBasic(mismatchedData);

      expect(result.success).toBe(true);
      expect(result.data!.rows[0]).toEqual(['A', 'B', '']); // Padded
      expect(result.data!.rows[1]).toEqual(['D', 'E', 'F']); // Truncated
      expect(result.data!.rows[2]).toEqual(['H', 'I', 'J']); // Unchanged
      expect(result.warnings.some(w => w.includes('column count mismatch'))).toBe(true);
    });

    it('should handle empty data by creating default table', () => {
      const emptyData = {
        headers: [],
        rows: []
      };

      const result = migrateComplexToBasic(emptyData);

      expect(result.success).toBe(true);
      expect(result.data!.headers).toEqual(['Column 1', 'Column 2']);
      expect(result.data!.rows).toHaveLength(2);
      expect(result.warnings.some(w => w.includes('Creating default table'))).toBe(true);
    });

    it('should extract plain text from HTML content correctly', () => {
      const htmlData = {
        headers: ['HTML Header'],
        rows: [[{
          content: '<p>Hello <strong>World</strong></p><br/><em>With formatting</em>',
          styling: {}
        }]],
        isRichContent: true
      };

      const result = migrateComplexToBasic(htmlData);

      expect(result.success).toBe(true);
      expect(result.data!.rows[0][0]).toBe('Hello World With formatting');
    });
  });

  describe('migrateToBasicTable', () => {
    it('should return BasicTable data unchanged', () => {
      const result = migrateToBasicTable(mockBasicTableData);

      expect(result).toEqual(mockBasicTableData);
    });

    it('should migrate complex data and return BasicTable', () => {
      const result = migrateToBasicTable(mockComplexTableData);

      expect(result.headers).toEqual(['Product', 'Description']);
      expect(result.rows[0][0]).toBe('Laptop');
      expect(result.id).toBeDefined();
    });

    it('should handle null/undefined data', () => {
      const result1 = migrateToBasicTable(null);
      const result2 = migrateToBasicTable(undefined);

      expect(result1.headers).toEqual(['Column 1', 'Column 2']);
      expect(result1.rows).toHaveLength(2);
      expect(result2.headers).toEqual(['Column 1', 'Column 2']);
      expect(result2.rows).toHaveLength(2);
    });

    it('should log migration results', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      migrateToBasicTable(mockComplexTableData);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('needsMigration', () => {
    it('should detect complex table data that needs migration', () => {
      expect(needsMigration(mockComplexTableData)).toBe(true);
      expect(needsMigration(mockLegacyTableData)).toBe(true);
    });

    it('should not flag BasicTable data for migration', () => {
      expect(needsMigration(mockBasicTableData)).toBe(false);
    });

    it('should detect rich content cells', () => {
      const dataWithRichCells = {
        headers: ['Col'],
        rows: [[{
          content: '<p>Rich</p>',
          styling: {}
        }]]
      };

      expect(needsMigration(dataWithRichCells)).toBe(true);
    });

    it('should handle null/undefined data', () => {
      expect(needsMigration(null)).toBe(false);
      expect(needsMigration(undefined)).toBe(false);
    });
  });

  describe('getMigrationPreview', () => {
    it('should provide preview for complex data migration', () => {
      const preview = getMigrationPreview(mockComplexTableData);

      expect(preview.needsMigration).toBe(true);
      expect(preview.featuresLost.length).toBeGreaterThan(0);
      expect(preview.complexity.before).toBeGreaterThan(preview.complexity.after);
      expect(preview.complexity.reduction).toMatch(/\d+%/);
    });

    it('should indicate no migration needed for basic data', () => {
      const preview = getMigrationPreview(mockBasicTableData);

      expect(preview.needsMigration).toBe(false);
      expect(preview.featuresLost).toHaveLength(0);
      expect(preview.complexity.reduction).toBe('0%');
    });

    it('should provide detailed feature loss information', () => {
      const preview = getMigrationPreview(mockComplexTableData);

      expect(preview.featuresLost.some(f => f.includes('styling'))).toBe(true);
      expect(preview.featuresLost.some(f => f.includes('settings'))).toBe(true);
      expect(preview.featuresLost.some(f => f.includes('Row headers'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed string and object headers', () => {
      const mixedData = {
        headers: [
          'Plain Header',
          { content: '<p>Rich Header</p>', styling: {} }
        ],
        rows: [['A', 'B']]
      };

      const result = migrateComplexToBasic(mixedData);

      expect(result.success).toBe(true);
      expect(result.data!.headers).toEqual(['Plain Header', 'Rich Header']);
    });

    it('should handle non-array row data', () => {
      const badRowData = {
        headers: ['Col1'],
        rows: [
          ['Valid row'],
          'Invalid row', // Not an array
          ['Another valid row']
        ]
      };

      const result = migrateComplexToBasic(badRowData);

      expect(result.success).toBe(true);
      expect(result.data!.rows).toHaveLength(3);
      expect(result.data!.rows[1]).toEqual([]); // Bad row converted to empty array
      expect(result.warnings.some(w => w.includes('Row 1 is not an array'))).toBe(true);
    });

    it('should handle special HTML entities', () => {
      const entityData = {
        headers: ['HTML Entities'],
        rows: [[{
          content: '<p>&quot;Hello&quot; &amp; &lt;Goodbye&gt; &nbsp; &#39;World&#39;</p>',
          styling: {}
        }]],
        isRichContent: true
      };

      const result = migrateComplexToBasic(entityData);

      expect(result.success).toBe(true);
      expect(result.data!.rows[0][0]).toBe('"Hello" & <Goodbye> \'World\'');
    });

    it('should handle circular references in data', () => {
      // Create data with circular reference (which doesn't break migration)
      const circularData: any = { headers: ['Test'], rows: [['Data']] };
      circularData.circular = circularData; // Create circular reference
      
      const result = migrateToBasicTable(circularData);
      
      // Migration should succeed despite circular reference since it doesn't affect table structure
      expect(result.headers).toEqual(['Test']);
      expect(result.rows).toEqual([['Data']]);
      expect(result.id).toBeDefined();
    });
  });
});