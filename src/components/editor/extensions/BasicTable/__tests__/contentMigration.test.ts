// ABOUTME: TDD tests for customTable to BasicTable content migration system

import { describe, it, expect } from 'vitest';
import {
  detectCustomTableNodes,
  migrateCustomTableToBasic,
  validateMigration,
  batchMigrateContent,
  type MigrationResult
} from '../contentMigration';

describe('🎯 TDD: Content Migration System', () => {
  describe('✅ Detection System', () => {
    it('should detect customTable nodes in content', () => {
      // ARRANGE: Content with deprecated customTable
      const contentWithCustomTable = {
        type: 'doc',
        content: [{
          type: 'customTable',
          attrs: {
            tableId: 'test-table',
            headers: ['Old Header 1', 'Old Header 2'],
            rows: [['Old Cell 1', 'Old Cell 2']]
          }
        }]
      };

      // ACT & ASSERT
      expect(detectCustomTableNodes(contentWithCustomTable)).toBe(true);
    });

    it('should NOT detect customTable in clean content', () => {
      // ARRANGE: Content with only basicTable
      const contentWithBasicTable = {
        type: 'doc',
        content: [{
          type: 'basicTable',
          attrs: {
            tableData: {
              headers: ['New Header 1', 'New Header 2'],
              rows: [['New Cell 1', 'New Cell 2']],
              id: 'new-table-123'
            }
          }
        }]
      };

      // ACT & ASSERT
      expect(detectCustomTableNodes(contentWithBasicTable)).toBe(false);
    });
  });

  describe('✅ Single Table Migration', () => {
    it('should migrate customTable to BasicTable format', () => {
      // ARRANGE: Complex customTable with rich content
      const customTableContent = {
        type: 'doc',
        content: [{
          type: 'customTable',
          attrs: {
            tableId: 'complex-table-456',
            headers: [
              { type: 'richText', content: [{ type: 'text', text: 'Complex Header 1' }] },
              'Simple Header 2'
            ],
            rows: [
              [
                { type: 'richText', content: [{ type: 'text', text: 'Complex Cell 1' }] },
                'Simple Cell 2'
              ]
            ]
          }
        }]
      };

      // ACT: Perform migration
      const result: MigrationResult = migrateCustomTableToBasic(customTableContent);

      // ASSERT: Migration success
      expect(result.success).toBe(true);
      expect(result.originalNodeCount).toBe(1);
      expect(result.migratedNodeCount).toBe(1);
      expect(result.complexityReduction).toBeGreaterThan(90); // ~95% complexity reduction

      // ASSERT: Correct BasicTable structure
      const migratedTable = result.migratedContent.content[0];
      expect(migratedTable.type).toBe('basicTable');
      expect(migratedTable.attrs.tableData.headers).toEqual(['Complex Header 1', 'Simple Header 2']);
      expect(migratedTable.attrs.tableData.rows[0]).toEqual(['Complex Cell 1', 'Simple Cell 2']);
      expect(migratedTable.attrs.tableData.id).toBe('complex-table-456');
    });

    it('should handle empty or malformed customTable nodes', () => {
      // ARRANGE: Malformed customTable
      const malformedContent = {
        type: 'doc',
        content: [{
          type: 'customTable',
          // Missing attrs - should handle gracefully
        }]
      };

      // ACT
      const result = migrateCustomTableToBasic(malformedContent);

      // ASSERT: Should report errors but not crash
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('missing attrs');
    });
  });

  describe('✅ Complex Migration Scenarios', () => {
    it('should migrate multiple customTable nodes in nested content', () => {
      // ARRANGE: Document with multiple tables
      const multiTableContent = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Introduction' }] },
          {
            type: 'customTable',
            attrs: {
              tableId: 'table-1',
              headers: ['Table 1 Header'],
              rows: [['Table 1 Data']]
            }
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Middle content' }] },
          {
            type: 'customTable',
            attrs: {
              tableId: 'table-2', 
              headers: ['Table 2 Header'],
              rows: [['Table 2 Data']]
            }
          }
        ]
      };

      // ACT
      const result = migrateCustomTableToBasic(multiTableContent);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.originalNodeCount).toBe(2);
      expect(result.migratedNodeCount).toBe(2);
      
      // Check both tables were migrated
      const tables = result.migratedContent.content.filter((node: any) => node.type === 'basicTable');
      expect(tables).toHaveLength(2);
      expect(tables[0].attrs.tableData.id).toBe('table-1');
      expect(tables[1].attrs.tableData.id).toBe('table-2');
    });

    it('should preserve non-table content during migration', () => {
      // ARRANGE: Mixed content
      const mixedContent = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Keep this paragraph' }] },
          {
            type: 'customTable',
            attrs: {
              tableId: 'migrate-me',
              headers: ['Header'],
              rows: [['Data']]
            }
          },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Keep this heading' }] }
        ]
      };

      // ACT
      const result = migrateCustomTableToBasic(mixedContent);

      // ASSERT
      expect(result.success).toBe(true);
      
      // Check non-table content preserved
      const finalContent = result.migratedContent.content;
      expect(finalContent[0].type).toBe('paragraph');
      expect(finalContent[1].type).toBe('basicTable');
      expect(finalContent[2].type).toBe('heading');
      
      // Verify text content preserved
      expect(finalContent[0].content[0].text).toBe('Keep this paragraph');
      expect(finalContent[2].content[0].text).toBe('Keep this heading');
    });
  });

  describe('✅ Migration Validation', () => {
    it('should validate successful migration', () => {
      // ARRANGE: Original and migrated content
      const original = {
        type: 'doc',
        content: [{
          type: 'customTable',
          attrs: { tableId: 'test', headers: ['H1'], rows: [['D1']] }
        }]
      };

      const migrated = {
        type: 'doc',
        content: [{
          type: 'basicTable',
          attrs: { tableData: { headers: ['H1'], rows: [['D1']], id: 'test' } }
        }]
      };

      // ACT
      const validation = validateMigration(original, migrated);

      // ASSERT
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.summary).toContain('✅ Migration successful');
    });

    it('should detect validation issues', () => {
      // ARRANGE: Original content with customTable still present after "migration"
      const original = {
        type: 'doc',
        content: [{ type: 'customTable', attrs: {} }]
      };

      const invalidMigration = {
        type: 'doc',
        content: [{ type: 'customTable', attrs: {} }] // Still has customTable!
      };

      // ACT
      const validation = validateMigration(original, invalidMigration);

      // ASSERT
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0]).toContain('customTable nodes still present');
      expect(validation.summary).toContain('❌');
    });
  });

  describe('✅ Batch Migration', () => {
    it('should process multiple content items efficiently', () => {
      // ARRANGE: Array of content items
      const contentBatch = [
        {
          type: 'doc',
          content: [{ type: 'customTable', attrs: { tableId: 'batch1', headers: [], rows: [] } }]
        },
        {
          type: 'doc', 
          content: [{ type: 'customTable', attrs: { tableId: 'batch2', headers: [], rows: [] } }]
        },
        {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No tables here' }] }]
        }
      ];

      // ACT
      const batchResult = batchMigrateContent(contentBatch);

      // ASSERT
      expect(batchResult.summary.totalProcessed).toBe(3);
      expect(batchResult.summary.totalMigrated).toBe(2); // 2 tables migrated
      expect(batchResult.summary.totalErrors).toBe(0);
      expect(batchResult.summary.averageComplexityReduction).toBeGreaterThan(60);
      
      // Check individual results
      expect(batchResult.results[0].migratedNodeCount).toBe(1);
      expect(batchResult.results[1].migratedNodeCount).toBe(1);
      expect(batchResult.results[2].migratedNodeCount).toBe(0); // No tables to migrate
    });
  });

  describe('🚨 Edge Cases & Error Handling', () => {
    it('should handle null/undefined content gracefully', () => {
      expect(detectCustomTableNodes(null)).toBe(false);
      expect(detectCustomTableNodes(undefined)).toBe(false);
      
      const result = migrateCustomTableToBasic(null);
      expect(result.success).toBe(true);
      expect(result.originalNodeCount).toBe(0);
    });

    it('should handle deeply nested table structures', () => {
      // ARRANGE: Deeply nested content
      const deepContent = {
        type: 'doc',
        content: [{
          type: 'section',
          content: [{
            type: 'div',
            content: [{
              type: 'customTable',
              attrs: { tableId: 'deep', headers: ['Deep'], rows: [['Nested']] }
            }]
          }]
        }]
      };

      // ACT
      const result = migrateCustomTableToBasic(deepContent);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.migratedNodeCount).toBe(1);
    });

    it('should report performance metrics', () => {
      const content = {
        type: 'doc',
        content: [{ type: 'customTable', attrs: { tableId: 'perf', headers: [], rows: [] } }]
      };

      const startTime = Date.now();
      const result = migrateCustomTableToBasic(content);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
});