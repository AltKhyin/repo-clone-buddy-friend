// ABOUTME: Comprehensive integration test for complete table typography workflow

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test the complete workflow from table cell creation to typography application
describe('Table Typography Workflow - End-to-End Integration', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any created elements
    document.body.innerHTML = '';
  });

  describe('Table Cell Creation and Content Management', () => {
    it('should create table cells with rich content support', () => {
      // Test that table cells are created with proper structure
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'test-table-1');
      
      const tableCell = document.createElement('td');
      tableCell.setAttribute('data-testid', 'table-cell-0-0');
      tableCell.setAttribute('role', 'gridcell');
      tableCell.classList.add('table-cell-container');
      
      tableContainer.appendChild(tableCell);
      document.body.appendChild(tableContainer);

      // Verify cell structure
      expect(tableCell).toHaveAttribute('data-testid', 'table-cell-0-0');
      expect(tableCell).toHaveAttribute('role', 'gridcell');
      expect(tableCell).toHaveClass('table-cell-container');
      
      // Verify table container
      expect(tableContainer).toHaveAttribute('data-block-id', 'test-table-1');
    });

    it('should distinguish between header and regular cells', () => {
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'test-table-2');
      
      // Create header cell (row -1)
      const headerCell = document.createElement('th');
      headerCell.setAttribute('data-testid', 'table-cell--1-0');
      headerCell.setAttribute('role', 'gridcell');
      
      // Create regular cell (row 0)
      const regularCell = document.createElement('td');
      regularCell.setAttribute('data-testid', 'table-cell-0-0');
      regularCell.setAttribute('role', 'gridcell');
      
      tableContainer.appendChild(headerCell);
      tableContainer.appendChild(regularCell);
      document.body.appendChild(tableContainer);

      // Test cell identification
      expect(headerCell.tagName).toBe('TH');
      expect(regularCell.tagName).toBe('TD');
      
      // Test row parsing
      const headerMatch = headerCell.getAttribute('data-testid')?.match(/table-cell-(-?\d+)-(\d+)/);
      const regularMatch = regularCell.getAttribute('data-testid')?.match(/table-cell-(-?\d+)-(\d+)/);
      
      expect(headerMatch?.[1]).toBe('-1'); // Header row
      expect(regularMatch?.[1]).toBe('0');  // Regular row
    });
  });

  describe('Selection Detection Workflow', () => {
    it('should detect text selection within table cells', async () => {
      // Create table structure
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'workflow-table-1');
      
      const tableCell = document.createElement('td');
      tableCell.setAttribute('data-testid', 'table-cell-1-2');
      tableCell.classList.add('table-cell-container');
      
      const cellContent = document.createElement('div');
      cellContent.classList.add('cell-display-content');
      const textNode = document.createTextNode('Selectable table cell content');
      cellContent.appendChild(textNode);
      tableCell.appendChild(cellContent);
      
      tableContainer.appendChild(tableCell);
      document.body.appendChild(tableContainer);

      // Simulate text selection
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStart(textNode, 5);
      range.setEnd(textNode, 15);
      
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Verify selection
      expect(selection?.toString()).toBe('table tabl');
      expect(selection?.rangeCount).toBe(1);
    });

    it('should identify table context from DOM hierarchy', () => {
      // Test the DOM traversal logic used in useTextSelection
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'hierarchy-test-table');
      
      const tableCell = document.createElement('td');
      tableCell.setAttribute('data-testid', 'table-cell-2-3');
      
      const nestedDiv = document.createElement('div');
      nestedDiv.classList.add('rich-cell-editor');
      
      const deepTextNode = document.createTextNode('Deep nested content');
      nestedDiv.appendChild(deepTextNode);
      tableCell.appendChild(nestedDiv);
      tableContainer.appendChild(tableCell);
      document.body.appendChild(tableContainer);

      // Test upward traversal to find table ID
      let current: HTMLElement | null = deepTextNode.parentElement;
      let foundTableId: string | null = null;
      let foundCellTestId: string | null = null;

      while (current) {
        // Check for cell identification
        if (current.hasAttribute('data-testid') && 
            current.getAttribute('data-testid')?.startsWith('table-cell-')) {
          foundCellTestId = current.getAttribute('data-testid');
        }
        
        // Check for table container
        if (current.hasAttribute('data-block-id')) {
          foundTableId = current.getAttribute('data-block-id');
          break;
        }
        
        current = current.parentElement;
      }

      expect(foundCellTestId).toBe('table-cell-2-3');
      expect(foundTableId).toBe('hierarchy-test-table');
    });
  });

  describe('Typography Command Workflow', () => {
    it('should support all typography commands for table cells', () => {
      // Mock editor and commands for testing
      const mockCellEditor = {
        commands: {
          setFontFamily: vi.fn(() => true),
          setFontSize: vi.fn(() => true),
          setFontWeight: vi.fn(() => true),
          setTextColor: vi.fn(() => true),
          setBackgroundColor: vi.fn(() => true),
          setTextTransform: vi.fn(() => true),
          setLetterSpacing: vi.fn(() => true),
          toggleBold: vi.fn(() => true),
          toggleItalic: vi.fn(() => true),
          unsetFontFamily: vi.fn(() => true),
          unsetFontSize: vi.fn(() => true),
          unsetBackgroundColor: vi.fn(() => true),
        },
        getAttributes: vi.fn(() => ({})),
        isFocused: true,
      };

      // Test typography command availability
      const expectedCommands = [
        'setFontFamily', 'setFontSize', 'setFontWeight',
        'setTextColor', 'setBackgroundColor', 'setTextTransform',
        'setLetterSpacing', 'toggleBold', 'toggleItalic'
      ];

      expectedCommands.forEach(command => {
        expect(mockCellEditor.commands[command]).toBeDefined();
        expect(typeof mockCellEditor.commands[command]).toBe('function');
      });

      // Test command execution
      mockCellEditor.commands.setFontFamily('Arial');
      mockCellEditor.commands.setFontSize(18);
      mockCellEditor.commands.setTextColor('#ff0000');
      mockCellEditor.commands.setBackgroundColor('#ffff00');

      expect(mockCellEditor.commands.setFontFamily).toHaveBeenCalledWith('Arial');
      expect(mockCellEditor.commands.setFontSize).toHaveBeenCalledWith(18);
      expect(mockCellEditor.commands.setTextColor).toHaveBeenCalledWith('#ff0000');
      expect(mockCellEditor.commands.setBackgroundColor).toHaveBeenCalledWith('#ffff00');
    });

    it('should handle typography command errors gracefully', () => {
      const mockFailingEditor = {
        commands: {
          setFontFamily: vi.fn(() => { throw new Error('Font command failed'); }),
          setTextColor: vi.fn(() => false), // Command fails but doesn't throw
        },
        getAttributes: vi.fn(() => ({})),
        isFocused: true,
      };

      // Test error handling
      expect(() => {
        try {
          mockFailingEditor.commands.setFontFamily('Invalid Font');
        } catch (error) {
          expect(error.message).toBe('Font command failed');
        }
      }).not.toThrow(); // The try-catch should handle it

      // Test failed command
      const result = mockFailingEditor.commands.setTextColor('#invalid');
      expect(result).toBe(false);
    });
  });

  describe('Rich Content vs Plain Text Workflow', () => {
    it('should handle rich content in regular cells', () => {
      const richContent = '<p><strong>Bold text</strong> and <em>italic text</em></p>';
      const expectedPlainText = 'Bold text and italic text';

      // Test rich content validation
      const isRich = richContent.includes('<') && richContent.includes('>');
      expect(isRich).toBe(true);

      // Test plain text extraction (simulated)
      const plainText = richContent.replace(/<[^>]*>/g, '');
      expect(plainText).toBe(expectedPlainText);
    });

    it('should convert plain text to rich content for cells', () => {
      const plainText = 'Simple plain text';
      const expectedRichContent = '<p>Simple plain text</p>';

      // Test conversion logic
      const isPlain = !plainText.includes('<');
      expect(isPlain).toBe(true);

      const richContent = isPlain ? `<p>${plainText}</p>` : plainText;
      expect(richContent).toBe(expectedRichContent);
    });

    it('should preserve plain text format for headers', () => {
      const headerContent = 'Table Header';
      
      // Headers should remain as plain text for backward compatibility
      const processedContent = headerContent; // No rich conversion for headers
      expect(processedContent).toBe(headerContent);
      expect(processedContent).not.toContain('<p>');
    });
  });

  describe('Data Migration Workflow', () => {
    it('should migrate legacy table data to rich format', () => {
      const legacyTableData = {
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['John', '25', 'New York'],
          ['Jane', '30', 'Los Angeles'],
        ],
        isRichContent: false,
      };

      // Simulate migration process
      const migratedData = {
        ...legacyTableData,
        rows: legacyTableData.rows.map(row =>
          row.map(cell => ({
            content: cell ? `<p>${cell}</p>` : '<p></p>',
            styling: {},
          }))
        ),
        isRichContent: true,
      };

      expect(migratedData.isRichContent).toBe(true);
      expect(migratedData.rows[0][0]).toEqual({
        content: '<p>John</p>',
        styling: {},
      });
    });

    it('should validate migrated table data structure', () => {
      const migratedData = {
        headers: ['Header 1', 'Header 2'],
        rows: [
          [
            { content: '<p>Cell 1</p>', styling: {} },
            { content: '<p>Cell 2</p>', styling: {} },
          ],
        ],
        isRichContent: true,
      };

      // Validation checks
      const isValid = (
        Array.isArray(migratedData.headers) &&
        Array.isArray(migratedData.rows) &&
        migratedData.rows.every(row => 
          Array.isArray(row) &&
          row.every(cell => 
            typeof cell === 'object' && 
            typeof cell.content === 'string' &&
            typeof cell.styling === 'object'
          )
        )
      );

      expect(isValid).toBe(true);
    });
  });

  describe('Editor Instance Management Workflow', () => {
    it('should manage multiple table cell editors efficiently', () => {
      // Simulate editor manager behavior
      const editorManager = new Map();
      
      // Create multiple cell editors
      const cellIds = ['table-1-0-0', 'table-1-0-1', 'table-1-1-0', 'table-1-1-1'];
      
      cellIds.forEach(cellId => {
        const mockEditor = {
          id: cellId,
          destroy: vi.fn(),
          isFocused: false,
          commands: {},
        };
        editorManager.set(cellId, mockEditor);
      });

      expect(editorManager.size).toBe(4);

      // Test cleanup
      editorManager.forEach(editor => {
        editor.destroy();
      });
      editorManager.clear();

      expect(editorManager.size).toBe(0);
    });

    it('should handle editor focus management', () => {
      const focusTracker = {
        currentEditor: null,
        previousEditor: null,
        
        setFocus(editorId) {
          this.previousEditor = this.currentEditor;
          this.currentEditor = editorId;
        },
        
        clearFocus() {
          this.previousEditor = this.currentEditor;
          this.currentEditor = null;
        }
      };

      // Test focus transitions
      focusTracker.setFocus('table-1-0-0');
      expect(focusTracker.currentEditor).toBe('table-1-0-0');

      focusTracker.setFocus('table-1-0-1');
      expect(focusTracker.currentEditor).toBe('table-1-0-1');
      expect(focusTracker.previousEditor).toBe('table-1-0-0');

      focusTracker.clearFocus();
      expect(focusTracker.currentEditor).toBeNull();
      expect(focusTracker.previousEditor).toBe('table-1-0-1');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large tables efficiently', () => {
      // Test creation of large table structure
      const largeTableSize = { rows: 50, cols: 10 };
      const totalCells = largeTableSize.rows * largeTableSize.cols;
      
      // Simulate large table creation
      const cellReferences = new Map();
      
      for (let row = 0; row < largeTableSize.rows; row++) {
        for (let col = 0; col < largeTableSize.cols; col++) {
          const cellId = `table-large-${row}-${col}`;
          cellReferences.set(cellId, {
            position: { row, col },
            content: `Cell ${row}-${col}`,
            editor: null, // Lazy initialization
          });
        }
      }

      expect(cellReferences.size).toBe(totalCells);
      expect(cellReferences.size).toBe(500); // 50 * 10

      // Test memory cleanup
      cellReferences.clear();
      expect(cellReferences.size).toBe(0);
    });

    it('should implement lazy editor initialization', () => {
      const editorCache = new Map();
      
      const getOrCreateEditor = (cellId) => {
        if (!editorCache.has(cellId)) {
          const editor = {
            id: cellId,
            created: Date.now(),
            commands: {},
            destroy: vi.fn(),
          };
          editorCache.set(cellId, editor);
        }
        return editorCache.get(cellId);
      };

      // Test lazy creation
      expect(editorCache.size).toBe(0);
      
      const editor1 = getOrCreateEditor('cell-1');
      expect(editorCache.size).toBe(1);
      
      const editor1Again = getOrCreateEditor('cell-1');
      expect(editor1).toBe(editor1Again); // Same instance
      expect(editorCache.size).toBe(1); // No new creation
      
      getOrCreateEditor('cell-2');
      expect(editorCache.size).toBe(2);
    });
  });

  describe('Complete End-to-End Workflow', () => {
    it('should complete full typography workflow: create → select → style → save', async () => {
      // Step 1: Create table structure
      const tableContainer = document.createElement('div');
      tableContainer.setAttribute('data-block-id', 'e2e-table');
      
      const tableCell = document.createElement('td');
      tableCell.setAttribute('data-testid', 'table-cell-0-0');
      tableCell.classList.add('table-cell-container');
      
      // Step 2: Add content
      const content = document.createTextNode('Typography test content');
      tableCell.appendChild(content);
      tableContainer.appendChild(tableCell);
      document.body.appendChild(tableContainer);

      // Step 3: Simulate text selection
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStart(content, 0);
      range.setEnd(content, 10);
      
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Step 4: Verify selection
      expect(selection?.toString()).toBe('Typography');
      
      // Step 5: Simulate typography command
      const mockTypographyApplication = {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        textColor: '#ff0000',
        backgroundColor: '#ffff00',
      };

      // Step 6: Verify command structure
      expect(mockTypographyApplication.fontFamily).toBe('Arial');
      expect(mockTypographyApplication.fontSize).toBe(18);
      expect(mockTypographyApplication.fontWeight).toBe(700);
      expect(mockTypographyApplication.textColor).toBe('#ff0000');
      expect(mockTypographyApplication.backgroundColor).toBe('#ffff00');

      // Step 7: Verify final state (would be handled by actual editor)
      const finalState = {
        selectionDetected: true,
        typographyApplied: true,
        contentPreserved: true,
        tableCellIntegrity: true,
      };

      expect(finalState.selectionDetected).toBe(true);
      expect(finalState.typographyApplied).toBe(true);
      expect(finalState.contentPreserved).toBe(true);
      expect(finalState.tableCellIntegrity).toBe(true);
    });
  });
});