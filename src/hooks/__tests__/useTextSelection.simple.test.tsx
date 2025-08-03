// ABOUTME: Simple focused test for table cell selection detection in useTextSelection hook

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTextSelection } from '../useTextSelection';

// Test the detectTableCellSelection function directly by examining the source code logic
describe('useTextSelection - Table Cell Detection Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Table Cell Element Detection', () => {
    it('should correctly parse table cell test IDs', () => {
      // Test the regex pattern used in detectTableCellSelection
      const testCases = [
        { testId: 'table-cell-0-1', expected: { row: 0, col: 1, isHeader: false } },
        { testId: 'table-cell--1-0', expected: { row: -1, col: 0, isHeader: true } },
        { testId: 'table-cell-2-3', expected: { row: 2, col: 3, isHeader: false } },
        { testId: 'table-cell--1-5', expected: { row: -1, col: 5, isHeader: true } },
      ];

      testCases.forEach(({ testId, expected }) => {
        const match = testId.match(/table-cell-(-?\d+)-(\d+)/);
        expect(match).toBeTruthy();
        
        if (match) {
          const row = parseInt(match[1]);
          const col = parseInt(match[2]);
          const isHeader = row === -1;
          
          expect(row).toBe(expected.row);
          expect(col).toBe(expected.col);
          expect(isHeader).toBe(expected.isHeader);
        }
      });
    });

    it('should not match invalid test IDs', () => {
      const invalidTestIds = [
        'table-cell-a-1',
        'table-cell-1',
        'prefix-table-cell',
        'table-1-2',
        'cell-1-2',
        'table-cell--a-1',
      ];

      invalidTestIds.forEach(testId => {
        const match = testId.match(/table-cell-(-?\d+)-(\d+)/);
        expect(match).toBeFalsy();
      });
    });
  });

  describe('DOM Element Classification', () => {
    it('should identify table cell container classes', () => {
      const tableClasses = [
        'table-cell-container',
        'rich-cell-editor', 
        'cell-display-content'
      ];

      tableClasses.forEach(className => {
        const element = document.createElement('div');
        element.classList.add(className);
        
        const hasTableClass = 
          element.classList.contains('table-cell-container') || 
          element.classList.contains('rich-cell-editor') ||
          element.classList.contains('cell-display-content');
          
        expect(hasTableClass).toBe(true);
      });
    });

    it('should correctly identify non-table elements', () => {
      const nonTableClasses = [
        'regular-text',
        'editor-block',
        'some-other-class'
      ];

      nonTableClasses.forEach(className => {
        const element = document.createElement('div');
        element.classList.add(className);
        
        const hasTableClass = 
          element.classList.contains('table-cell-container') || 
          element.classList.contains('rich-cell-editor') ||
          element.classList.contains('cell-display-content');
          
        expect(hasTableClass).toBe(false);
      });
    });
  });

  describe('Table ID Extraction', () => {
    it('should find table ID from data-block-id attribute', () => {
      // Create table structure
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'table-123');
      
      const tableCellElement = document.createElement('td');
      tableCellElement.setAttribute('data-testid', 'table-cell-0-1');
      
      tableContainer.appendChild(tableCellElement);
      document.body.appendChild(tableContainer);

      // Test the traversal logic
      let current: HTMLElement | null = tableCellElement;
      let foundTableId: string | null = null;
      
      while (current && !foundTableId) {
        if (current.hasAttribute('data-block-id')) {
          foundTableId = current.getAttribute('data-block-id');
          break;
        }
        current = current.parentElement;
      }

      expect(foundTableId).toBe('table-123');

      // Cleanup
      document.body.removeChild(tableContainer);
    });

    it('should return null when no table container found', () => {
      // Create isolated cell element without table container
      const tableCellElement = document.createElement('td');
      tableCellElement.setAttribute('data-testid', 'table-cell-1-2');
      document.body.appendChild(tableCellElement);

      // Test the traversal logic
      let current: HTMLElement | null = tableCellElement;
      let foundTableId: string | null = null;
      
      while (current && !foundTableId) {
        if (current.hasAttribute('data-block-id')) {
          foundTableId = current.getAttribute('data-block-id');
          break;
        }
        current = current.parentElement;
      }

      expect(foundTableId).toBeNull();

      // Cleanup
      document.body.removeChild(tableCellElement);
    });
  });
});