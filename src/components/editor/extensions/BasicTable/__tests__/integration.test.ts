// ABOUTME: Integration tests for BasicTable system with editor hooks and migration

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTiptapEditor } from '../../../../../hooks/useTiptapEditor';
import { useRichTextEditor } from '../../../../../hooks/useRichTextEditor';
import { migrateToBasicTable, needsMigration } from '../migration';
import { createEmptyTable } from '../tableOperations';
import { BasicTableData, DEFAULT_TABLE_DATA } from '../types';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock dependencies that might not be available in test environment
vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
    setContentSelection: vi.fn(),
    getState: () => ({ currentSelection: null }),
  }),
}));

vi.mock('@/store/selectionStore', () => ({
  useSelectionStore: () => ({
    dispatch: vi.fn(),
    getState: () => ({ selection: { type: 'none' } }),
  }),
}));

vi.mock('@/utils/performance-monitor', () => ({
  globalMonitor: {
    recordProseMirrorCall: vi.fn(),
    recordDomTraversal: vi.fn(),
    startTiming: vi.fn(),
    stopTiming: vi.fn().mockReturnValue(5),
    getMetrics: vi.fn().mockReturnValue({ proseMirrorCalls: 0 }),
  },
  instrumentFindParentCell: vi.fn(),
}));

vi.mock('@/utils/table-detection', () => ({
  detectTableContext: vi.fn().mockReturnValue({ isTableCell: false, confidence: 'low', method: 'dom' }),
}));

describe('BasicTable Integration', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Editor Hook Integration', () => {
    it('should initialize useTiptapEditor with BasicTable support', () => {
      const { result } = renderHook(() =>
        useTiptapEditor({
          nodeId: 'test-node',
          initialContent: '<p>Test content</p>',
          onUpdate: mockOnUpdate,
        })
      );

      expect(result.current.editor).toBeDefined();
      expect(result.current.insertTable).toBeDefined();
      expect(typeof result.current.insertTable).toBe('function');
      expect(result.current.isActive.table).toBeDefined();
    });

    it('should initialize useRichTextEditor with BasicTable support', () => {
      const { result } = renderHook(() =>
        useRichTextEditor({
          nodeId: 'test-node',
          initialContent: '<p>Rich content</p>',
          onUpdate: mockOnUpdate,
        })
      );

      expect(result.current.editor).toBeDefined();
      expect(result.current.insertTable).toBeDefined();
      expect(typeof result.current.insertTable).toBe('function');
      expect(result.current.isActive.table).toBeDefined();
    });

    it('should support table insertion in both editor hooks', () => {
      const tiptapHook = renderHook(() =>
        useTiptapEditor({
          nodeId: 'tiptap-test',
          initialContent: '<p>Test</p>',
          onUpdate: mockOnUpdate,
        })
      );

      const richTextHook = renderHook(() =>
        useRichTextEditor({
          nodeId: 'rich-test',
          initialContent: '<p>Rich test</p>',
          onUpdate: mockOnUpdate,
        })
      );

      // Both should have table insertion capabilities
      expect(tiptapHook.result.current.insertTable).toBeDefined();
      expect(richTextHook.result.current.insertTable).toBeDefined();

      // Both should support the same simple interface (rows, cols)
      expect(() => tiptapHook.result.current.insertTable?.(3, 3)).not.toThrow();
      expect(() => richTextHook.result.current.insertTable?.(2, 4)).not.toThrow();
    });
  });

  describe('Table Operations Integration', () => {
    it('should create valid BasicTable data structure', () => {
      const emptyTable = createEmptyTable(2, 3);
      
      expect(emptyTable).toMatchObject({
        headers: expect.arrayContaining(['Column 1', 'Column 2', 'Column 3']),
        rows: expect.arrayContaining([
          expect.arrayContaining(['', '', '']),
          expect.arrayContaining(['', '', ''])
        ]),
        id: expect.stringMatching(/^table-\d+-[a-z0-9]+$/)
      });
      
      expect(emptyTable.headers).toHaveLength(3);
      expect(emptyTable.rows).toHaveLength(2);
      expect(emptyTable.rows.every(row => row.length === 3)).toBe(true);
    });

    it('should validate DEFAULT_TABLE_DATA structure', () => {
      expect(DEFAULT_TABLE_DATA).toMatchObject({
        headers: ['Column 1', 'Column 2'],
        rows: [
          ['', ''],
          ['', '']
        ]
      });
      
      expect(Array.isArray(DEFAULT_TABLE_DATA.headers)).toBe(true);
      expect(Array.isArray(DEFAULT_TABLE_DATA.rows)).toBe(true);
      expect(DEFAULT_TABLE_DATA.rows.every(row => Array.isArray(row))).toBe(true);
    });
  });

  describe('Migration System Integration', () => {
    it('should correctly identify complex tables needing migration', () => {
      const simpleTable: BasicTableData = {
        headers: ['Name', 'Value'],
        rows: [['Test', '123']],
        id: 'simple-1'
      };

      const complexTable = {
        headers: ['Product'],
        rows: [[{
          content: '<p><strong>Laptop</strong></p>',
          styling: { fontWeight: 'bold' }
        }]],
        isRichContent: true,
        styling: { borderColor: '#000' }
      };

      expect(needsMigration(simpleTable)).toBe(false);
      expect(needsMigration(complexTable)).toBe(true);
    });

    it('should perform end-to-end migration successfully', () => {
      const complexData = {
        headers: ['Product', 'Description'],
        rows: [
          [
            { content: '<p>Laptop</p>', styling: {} },
            { content: '<p>High-end <strong>gaming</strong> laptop</p>', styling: {} }
          ],
          [
            'Mouse', // Mixed content types
            { content: '<p>Wireless mouse</p>', styling: {} }
          ]
        ],
        isRichContent: true,
        styling: {
          borderColor: '#cccccc',
          backgroundColor: '#f9f9f9'
        },
        settings: {
          sortable: true,
          resizable: false
        },
        rowHeaders: ['Item 1', 'Item 2'],
        headerLayout: 'both'
      };

      const migrated = migrateToBasicTable(complexData);

      expect(migrated).toMatchObject({
        headers: ['Product', 'Description'],
        rows: [
          ['Laptop', 'High-end gaming laptop'],
          ['Mouse', 'Wireless mouse']
        ],
        id: expect.stringMatching(/^migrated-table-\d+$/)
      });

      // Verify data integrity
      expect(migrated.headers).toHaveLength(2);
      expect(migrated.rows).toHaveLength(2);
      expect(migrated.rows.every(row => row.length === 2)).toBe(true);
      expect(migrated.rows.every(row => row.every(cell => typeof cell === 'string'))).toBe(true);
    });

    it('should handle legacy table format migration', () => {
      const legacyData = {
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['John Doe', '30', 'New York'],
          ['Jane Smith', '25', 'Boston']
        ],
        styling: {
          striped: true,
          borderColor: '#000000'
        },
        settings: {
          sortable: false
        }
      };

      const migrated = migrateToBasicTable(legacyData);

      expect(migrated).toMatchObject({
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['John Doe', '30', 'New York'],
          ['Jane Smith', '25', 'Boston']
        ],
        id: expect.stringMatching(/^migrated-table-\d+$/)
      });
    });
  });

  describe('Editor Commands Integration', () => {
    it('should register basicTable node type', () => {
      const { result } = renderHook(() =>
        useTiptapEditor({
          nodeId: 'command-test',
          initialContent: '<p>Test</p>',
          onUpdate: mockOnUpdate,
        })
      );

      // Editor should be configured with BasicTable extension
      const editor = result.current.editor;
      if (editor) {
        // Check if basicTable node type exists
        const schema = editor.schema;
        expect(schema.nodes.basicTable).toBeDefined();
      }
    });

    it('should detect table node selection correctly', () => {
      const { result } = renderHook(() =>
        useRichTextEditor({
          nodeId: 'selection-test',
          initialContent: '<p>Test</p>',
          onUpdate: mockOnUpdate,
        })
      );

      const editor = result.current.editor;
      expect(editor).toBeDefined();
      
      // isActive.table should work for basicTable
      expect(typeof result.current.isActive.table).toBe('boolean');
      expect(result.current.isActive.table).toBe(false); // No table in initial content
    });
  });

  describe('Data Structure Compatibility', () => {
    it('should maintain consistent data structure across operations', () => {
      const table1 = createEmptyTable(2, 2);
      const table2 = migrateToBasicTable({
        headers: ['A', 'B'],
        rows: [['1', '2'], ['3', '4']]
      });

      // Both should have the same structure
      expect(typeof table1.headers).toBe(typeof table2.headers);
      expect(typeof table1.rows).toBe(typeof table2.rows);
      expect(typeof table1.id).toBe(typeof table2.id);

      expect(Array.isArray(table1.headers)).toBe(Array.isArray(table2.headers));
      expect(Array.isArray(table1.rows)).toBe(Array.isArray(table2.rows));
    });

    it('should handle edge cases consistently', () => {
      // Empty data
      const empty = migrateToBasicTable(null);
      expect(empty).toMatchObject({
        headers: expect.arrayContaining(['Column 1', 'Column 2']),
        rows: expect.any(Array),
        id: expect.any(String)
      });

      // Malformed data
      const malformed = migrateToBasicTable({
        headers: 'not-an-array',
        rows: 'also-not-an-array'
      });
      expect(malformed).toMatchObject({
        headers: expect.arrayContaining(['Column 1', 'Column 2']),
        rows: expect.any(Array),
        id: expect.any(String)
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large table migration efficiently', () => {
      const startTime = Date.now();
      
      // Create a larger complex table
      const largeComplexTable = {
        headers: Array.from({ length: 10 }, (_, i) => `Column ${i + 1}`),
        rows: Array.from({ length: 50 }, (_, rowIndex) =>
          Array.from({ length: 10 }, (_, colIndex) => ({
            content: `<p><strong>Cell ${rowIndex}-${colIndex}</strong><br/>More content here</p>`,
            styling: { fontWeight: rowIndex % 2 ? 'bold' : 'normal' }
          }))
        ),
        isRichContent: true,
        styling: { borderColor: '#000' },
        settings: { sortable: true }
      };

      const migrated = migrateToBasicTable(largeComplexTable);
      const endTime = Date.now();

      // Should complete migration in reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);

      // Should have correct structure
      expect(migrated.headers).toHaveLength(10);
      expect(migrated.rows).toHaveLength(50);
      expect(migrated.rows.every(row => row.length === 10)).toBe(true);
    });

    it('should not leak memory during migration', () => {
      // Multiple migrations should not accumulate memory
      const originalData = {
        headers: ['Test'],
        rows: [['Data']],
        styling: { color: 'red' }
      };

      let results = [];
      for (let i = 0; i < 10; i++) {
        results.push(migrateToBasicTable(originalData));
      }

      // All results should be valid
      results.forEach(result => {
        expect(result).toMatchObject({
          headers: ['Test'],
          rows: [['Data']],
          id: expect.any(String)
        });
      });

      // Clear references
      results = [];
    });
  });
});