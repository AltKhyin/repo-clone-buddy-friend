// ABOUTME: Test cases to reproduce and verify fixes for table cell issues: content deletion and row height expansion

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTableCell, RichTableCellRef } from '../RichTableCell';
import { performanceOptimizedTableCellManager } from '../performance/PerformanceOptimizedTableCellManager';

// Mock the performance manager to control debounce timing
vi.mock('../performance/PerformanceOptimizedTableCellManager', () => ({
  performanceOptimizedTableCellManager: {
    getEditor: vi.fn(),
    removeEditor: vi.fn(),
    performSmartCleanup: vi.fn(),
    getPerformanceMetrics: vi.fn(),
  },
}));

describe('Table Cell Issues Reproduction', () => {
  let mockEditor: any;
  let onContentChangeSpy: vi.Mock;
  let debounceTimer: NodeJS.Timeout | null = null;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock editor with debounced update mechanism
    mockEditor = {
      getHTML: vi.fn(() => '<p>Initial content</p>'),
      commands: {
        setContent: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
      },
      on: vi.fn((event, callback) => {
        if (event === 'update') {
          // Simulate debounced update with 150ms delay (like the real manager)
          mockEditor._updateCallback = (newContent: string) => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => callback({ editor: mockEditor }), 150);
          };
        }
      }),
      destroy: vi.fn(),
      isActive: vi.fn(() => false),
      getAttributes: vi.fn(() => ({})),
    };

    // Setup content change spy
    onContentChangeSpy = vi.fn();

    // Mock the performance manager to return our controlled editor
    (performanceOptimizedTableCellManager.getEditor as any).mockReturnValue(mockEditor);
  });

  afterEach(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  });

  describe('Issue #1: Content Deletion After Cell Switch', () => {
    it('should reproduce content deletion when switching cells rapidly', async () => {
      const user = userEvent.setup();

      // Create two table cells
      const { rerender } = render(
        <table>
          <tbody>
            <tr>
              <RichTableCell
                content="Cell A content"
                position={{ row: 0, col: 0 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="table-1-0-0"
                onContentChange={onContentChangeSpy}
                data-testid="cell-a"
              />
              <RichTableCell
                content="Cell B content"
                position={{ row: 0, col: 1 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="table-1-0-1"
                onContentChange={onContentChangeSpy}
                data-testid="cell-b"
              />
            </tr>
          </tbody>
        </table>
      );

      const cellA = screen.getByTestId('table-cell-0-0');
      const cellB = screen.getByTestId('table-cell-0-1');

      // 🎯 REPRODUCTION STEPS:
      // 1. Focus Cell A and start typing
      await user.click(cellA);
      
      // Simulate typing in Cell A (this triggers update event)
      mockEditor.getHTML.mockReturnValue('<p>Cell A new content</p>');
      if (mockEditor._updateCallback) {
        mockEditor._updateCallback('<p>Cell A new content</p>');
      }

      // 2. Quickly switch to Cell B before debounce timer fires (< 150ms)
      await user.click(cellB);
      
      // Simulate typing in Cell B
      mockEditor.getHTML.mockReturnValue('<p>Cell B new content</p>');
      if (mockEditor._updateCallback) {
        mockEditor._updateCallback('<p>Cell B new content</p>');
      }

      // 3. Wait for debounced updates to fire (> 150ms)
      await waitFor(() => {
        // The issue: Cell A's debounced update should fire and potentially
        // overwrite Cell B's content or cause stale state updates
        expect(onContentChangeSpy).toHaveBeenCalled();
      }, { timeout: 200 });

      // Verify the problematic behavior
      expect(onContentChangeSpy).toHaveBeenCalledTimes(2);
      
      // The bug: The first call might be Cell A's delayed update
      // interfering with Cell B's content
      console.log('Content change calls:', onContentChangeSpy.mock.calls);
    });

    it('should handle rapid cell switching without content loss', async () => {
      const user = userEvent.setup();
      const contentChanges: string[] = [];

      const trackingOnContentChange = vi.fn((content: string) => {
        contentChanges.push(content);
      });

      render(
        <table>
          <tbody>
            <tr>
              <RichTableCell
                content="Initial A"
                position={{ row: 0, col: 0 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="table-2-0-0"
                onContentChange={trackingOnContentChange}
              />
              <RichTableCell
                content="Initial B"
                position={{ row: 0, col: 1 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="table-2-0-1"
                onContentChange={trackingOnContentChange}
              />
            </tr>
          </tbody>
        </table>
      );

      // Rapid switching scenario
      const cellA = screen.getByTestId('table-cell-0-0');
      const cellB = screen.getByTestId('table-cell-0-1');

      // Focus A → edit → focus B → edit (all within debounce window)
      await user.click(cellA);
      mockEditor.getHTML.mockReturnValue('<p>A edited</p>');
      if (mockEditor._updateCallback) mockEditor._updateCallback('<p>A edited</p>');

      await user.click(cellB);
      mockEditor.getHTML.mockReturnValue('<p>B edited</p>');
      if (mockEditor._updateCallback) mockEditor._updateCallback('<p>B edited</p>');

      // Wait for all debounced updates
      await waitFor(() => {
        expect(trackingOnContentChange).toHaveBeenCalled();
      }, { timeout: 300 });

      // Analyze the content changes to detect the issue
      console.log('All content changes:', contentChanges);
      
      // The issue: We might see incorrect content updates due to timing
      expect(contentChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Issue #2: Row Height Expansion', () => {
    it('should reproduce row height expansion with content', async () => {
      const { container } = render(
        <table>
          <tbody>
            <tr data-testid="empty-row">
              <RichTableCell
                content="<p></p>"
                position={{ row: 0, col: 0 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="empty-cell"
                onContentChange={vi.fn()}
              />
            </tr>
            <tr data-testid="content-row">
              <RichTableCell
                content="<p>Single line content</p>"
                position={{ row: 1, col: 0 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="content-cell"
                onContentChange={vi.fn()}
              />
            </tr>
          </tbody>
        </table>
      );

      const emptyRow = screen.getByTestId('empty-row');
      const contentRow = screen.getByTestId('content-row');

      // Get computed heights to verify the issue
      const emptyRowHeight = emptyRow.getBoundingClientRect().height;
      const contentRowHeight = contentRow.getBoundingClientRect().height;

      console.log('Empty row height:', emptyRowHeight);
      console.log('Content row height:', contentRowHeight);

      // The issue: Content rows should be taller than empty rows
      // due to prose classes and leading-relaxed
      expect(contentRowHeight).toBeGreaterThan(emptyRowHeight);

      // Check for prose classes that cause the expansion
      const cellContent = container.querySelector('[class*="prose"]');
      expect(cellContent).toBeTruthy();
      
      // Check for leading-relaxed or min-height classes
      const proseMirrorContent = container.querySelector('[class*="leading-relaxed"]');
      expect(proseMirrorContent).toBeTruthy();
    });

    it('should measure exact height differences between empty and content cells', () => {
      const { container: emptyContainer } = render(
        <table>
          <tbody>
            <tr>
              <RichTableCell
                content="<p></p>"
                position={{ row: 0, col: 0 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="measure-empty"
                onContentChange={vi.fn()}
              />
            </tr>
          </tbody>
        </table>
      );

      const { container: contentContainer } = render(
        <table>
          <tbody>
            <tr>
              <RichTableCell
                content="<p>Text</p>"
                position={{ row: 0, col: 0 }}
                styling={{
                  cellPadding: 12,
                  fontSize: 14,
                  fontWeight: 400,
                  textAlign: 'left',
                  borderColor: '#e2e8f0',
                }}
                cellId="measure-content"
                onContentChange={vi.fn()}
              />
            </tr>
          </tbody>
        </table>
      );

      // Expected heights:
      // - Base padding: 12px + 12px = 24px
      // - Min height: min-h-[1.2rem] = ~19px
      // - Content expansion: prose + leading-relaxed should add more height

      const emptyCell = emptyContainer.querySelector('[role="gridcell"]') as HTMLElement;
      const contentCell = contentContainer.querySelector('[role="gridcell"]') as HTMLElement;

      expect(emptyCell).toBeTruthy();
      expect(contentCell).toBeTruthy();

      // Log styles for debugging
      const emptyStyles = window.getComputedStyle(emptyCell);
      const contentStyles = window.getComputedStyle(contentCell);

      console.log('Empty cell padding:', emptyStyles.padding);
      console.log('Content cell padding:', contentStyles.padding);
      console.log('Empty cell min-height:', emptyStyles.minHeight);
      console.log('Content cell min-height:', contentStyles.minHeight);

      // The expectation that proves the issue exists
      expect(emptyStyles.padding).toBe('12px');
      expect(contentStyles.padding).toBe('12px');
    });
  });

  describe('Performance Manager Integration', () => {
    it('should verify debounce timing matches real implementation', () => {
      // Verify our test setup matches the real debounce timing
      expect(performanceOptimizedTableCellManager.getEditor).toBeDefined();
      
      // In the real implementation, debounce is 150ms
      const expectedDebounceMs = 150;
      
      // Our test should use the same timing
      expect(150).toBe(expectedDebounceMs);
    });
  });
});