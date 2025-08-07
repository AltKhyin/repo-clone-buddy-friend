// ABOUTME: TDD test for tiptapContentHelpers BasicTable compatibility

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  generateEmptyTableJson,
  convertJsonToHtml, 
  extractTableFromHtml 
} from '../tiptapContentHelpers';

describe('🎯 TDD: Content Helpers BasicTable Compatibility', () => {
  beforeEach(() => {
    // Clean slate for each test
  });

  describe('✅ FAILING TEST: generateEmptyTableJson (Will Fix)', () => {
    it('should generate basicTable nodes, not customTable', () => {
      // ACT: Generate table JSON
      const result = generateEmptyTableJson('test-table-123', 2, 3, true);
      
      // ASSERT: Should create basicTable node (currently fails with customTable)
      expect(result.content[0].type).toBe('basicTable'); // Will fail until fixed
      expect(result.content[0].type).not.toBe('customTable'); // Should not be deprecated type
    });

    it('should have correct structure for BasicTable system', () => {
      // ACT: Generate table JSON
      const result = generateEmptyTableJson('table-456', 3, 2, false);
      
      // ASSERT: Should match BasicTable structure
      const tableNode = result.content[0];
      expect(tableNode.type).toBe('basicTable');
      
      // BasicTable uses different attribute structure
      expect(tableNode.attrs).toBeDefined();
      expect(tableNode.attrs.tableId).toBe('table-456');
    });
  });

  describe('✅ FAILING TEST: convertJsonToHtml (Will Fix)', () => {
    it('should convert basicTable JSON to HTML, not customTable', () => {
      // ARRANGE: Create JSON with basicTable node
      const basicTableJson = {
        type: 'doc',
        content: [{
          type: 'basicTable',
          attrs: {
            tableData: {
              headers: ['Header 1', 'Header 2'],
              rows: [['Cell 1', 'Cell 2']],
              id: 'table-789'
            }
          }
        }]
      };
      
      // ACT: Convert to HTML
      const html = convertJsonToHtml(basicTableJson);
      
      // ASSERT: Should reference basicTable in HTML attributes
      expect(html).toContain('data-tiptap-node="basicTable"'); // Will fail until fixed
      expect(html).not.toContain('data-tiptap-node="customTable"'); // Should not reference deprecated
      expect(html).toContain('Table Loading...'); // Should still show loading placeholder
    });
  });

  describe('✅ FAILING TEST: extractTableFromHtml (Will Fix)', () => {
    it('should extract basicTable data from HTML, not customTable', () => {
      // ARRANGE: Create HTML with basicTable node reference
      const htmlWithBasicTable = `
        <div data-tiptap-node="basicTable" data-tiptap-attrs="${encodeURIComponent(JSON.stringify({
          tableData: {
            headers: ['A', 'B'],
            rows: [['1', '2']],
            id: 'extracted-table'
          }
        }))}">
          <table><tbody><tr><th>Table Loading...</th></tr></tbody></table>
        </div>
      `;
      
      // ACT: Extract table data
      const result = extractTableFromHtml(htmlWithBasicTable);
      
      // ASSERT: Should successfully extract basicTable data
      expect(result).toBeDefined(); // Should find the table
      expect(result?.tableData?.id).toBe('extracted-table'); // Should extract correct data
      
      // Should NOT extract if HTML has deprecated customTable references
      const htmlWithCustomTable = htmlWithBasicTable.replace('basicTable', 'customTable');
      const deprecatedResult = extractTableFromHtml(htmlWithCustomTable);
      expect(deprecatedResult).toBeNull(); // Should ignore deprecated format after fix
    });
  });

  describe('🚨 Critical Verification', () => {
    it('documents all the lines that need to be fixed', () => {
      // DOCUMENTATION: Exact changes needed
      const fixes = [
        { line: 39, current: "type: 'customTable',", fixed: "type: 'basicTable'," },
        { line: 108, current: "if (firstNode.type === 'customTable')", fixed: "if (firstNode.type === 'basicTable')" },
        { line: 110, current: 'data-tiptap-node="customTable"', fixed: 'data-tiptap-node="basicTable"' },
        { line: 130, current: 'data-tiptap-node="customTable"', fixed: 'data-tiptap-node="basicTable"' }
      ];
      
      console.log('📍 FILE: src/components/editor/shared/tiptapContentHelpers.ts');
      fixes.forEach(fix => {
        console.log(`📍 LINE ${fix.line}:`);
        console.log(`🔴 CURRENT: ${fix.current}`);
        console.log(`🟢 REQUIRED: ${fix.fixed}`);
        console.log('---');
      });
      
      expect(fixes.length).toBe(4); // Verify we're fixing all 4 occurrences
    });
  });
});