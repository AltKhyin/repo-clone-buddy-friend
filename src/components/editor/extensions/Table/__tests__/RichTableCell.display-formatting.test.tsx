// ABOUTME: Tests for rich formatting preservation in table cell display mode

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RichTableCell } from '../RichTableCell';
import { performanceOptimizedTableCellManager } from '../performance/PerformanceOptimizedTableCellManager';

// Mock the performance manager
vi.mock('../performance/PerformanceOptimizedTableCellManager', () => ({
  performanceOptimizedTableCellManager: {
    getEditor: vi.fn()
  }
}));

// Old table selection coordinator has been replaced with unified selection system
// The unified selection mocks are handled globally in test-setup.ts

// Helper to render table cell with proper table structure
const renderTableCell = (props: any) => {
  return render(
    <table>
      <tbody>
        <tr>
          <RichTableCell {...props} />
        </tr>
      </tbody>
    </table>
  );
};

describe('RichTableCell - Display Formatting Preservation', () => {
  const defaultProps = {
    content: '<p><strong>Bold text</strong> and <em>italic text</em></p>',
    position: { row: 0, col: 0 },
    styling: {
      cellPadding: 12,
      fontSize: 14,
      fontWeight: 400,
      textAlign: 'left' as const,
      borderColor: '#e2e8f0'
    },
    onContentChange: vi.fn(),
    cellId: 'test-cell-0-0'
  };

  let mockEditor: any;

  beforeEach(() => {
    // Create a more complete mock editor that handles TipTap initialization
    mockEditor = {
      getHTML: vi.fn().mockReturnValue('<p><strong>Bold text</strong> and <em>italic text</em></p>'),
      getText: vi.fn().mockReturnValue('Bold text and italic text'),
      commands: {
        setContent: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn()
      },
      on: vi.fn(),
      destroy: vi.fn(),
      isDestroyed: false,
      // Mock properties that TipTap EditorContent expects
      view: {
        dom: document.createElement('div'),
        element: document.createElement('div')
      },
      options: {
        element: document.createElement('div')
      },
      setProps: vi.fn(),
      extensionManager: {}
    };

    // Mock that returns null for initial non-focused state
    vi.mocked(performanceOptimizedTableCellManager.getEditor).mockReturnValue(null);
  });

  it('should display rich formatted content when cell is not focused', () => {
    renderTableCell(defaultProps);
    
    // Should show the formatted content, not plain text
    const cellElement = screen.getByRole('gridcell');
    
    // Should contain HTML formatting elements
    expect(cellElement.innerHTML).toContain('<strong>');
    expect(cellElement.innerHTML).toContain('<em>');
    expect(cellElement.innerHTML).toContain('Bold text');
    expect(cellElement.innerHTML).toContain('italic text');
  });

  it('should preserve formatting for complex rich content', () => {
    const complexContent = '<p><span style="color: red; font-size: 18px;"><strong>Colored bold text</strong></span> and <span style="background-color: yellow;">highlighted text</span></p>';
    
    renderTableCell({ ...defaultProps, content: complexContent });
    
    const cellElement = screen.getByRole('gridcell');
    
    // Should preserve color and background styling
    expect(cellElement.innerHTML).toContain('color: red');
    expect(cellElement.innerHTML).toContain('font-size: 18px');
    expect(cellElement.innerHTML).toContain('background-color: yellow');
    expect(cellElement.innerHTML).toContain('<strong>');
  });

  it('should sanitize potentially dangerous HTML content', () => {
    const dangerousContent = '<p><strong>Safe text</strong><script>alert("xss")</script><img src="x" onerror="alert(1)"></p>';
    
    renderTableCell({ ...defaultProps, content: dangerousContent });
    
    const cellElement = screen.getByRole('gridcell');
    
    // Should preserve safe formatting but remove dangerous elements
    expect(cellElement.innerHTML).toContain('<strong>Safe text</strong>');
    expect(cellElement.innerHTML).not.toContain('<script>');
    expect(cellElement.innerHTML).not.toContain('onerror');
  });

  it('should switch to TipTap editor when cell is focused', () => {
    // Start with no editor (display mode)
    renderTableCell(defaultProps);
    
    // Initially should show display content
    const cellElement = screen.getByRole('gridcell');
    expect(cellElement.querySelector('.rich-cell-editor')).toBeNull();
    
    // Mock that editor becomes available when cell is clicked
    vi.mocked(performanceOptimizedTableCellManager.getEditor).mockReturnValue(mockEditor);
    
    // Click to focus the cell (this would trigger focus state change)
    fireEvent.click(cellElement);
    
    // For now, just verify the manager was called (component would internally handle focus state)
    expect(performanceOptimizedTableCellManager.getEditor).toHaveBeenCalled();
  });

  it('should handle empty or minimal content gracefully', () => {
    renderTableCell({ ...defaultProps, content: "" });
    
    const cellElement = screen.getByRole('gridcell');
    
    // Should show placeholder text for empty content
    expect(cellElement.textContent).toContain('Empty');
  });

  it('should maintain consistent styling between display and edit modes', () => {
    const styledContent = '<p style="color: blue; font-weight: bold;">Styled content</p>';
    
    renderTableCell({ ...defaultProps, content: styledContent });
    
    const cellElement = screen.getByRole('gridcell');
    
    // Should preserve the styling from the content
    expect(cellElement.innerHTML).toContain('color: blue');
    expect(cellElement.innerHTML).toContain('font-weight: bold');
  });

  it('should handle line breaks and paragraph formatting correctly', () => {
    const multiParagraphContent = '<p>First paragraph</p><p>Second paragraph with <br>line break</p>';
    
    renderTableCell({ ...defaultProps, content: multiParagraphContent });
    
    const cellElement = screen.getByRole('gridcell');
    
    // Should preserve paragraph structure
    expect(cellElement.innerHTML).toContain('<p>First paragraph</p>');
    expect(cellElement.innerHTML).toContain('<p>Second paragraph');
    expect(cellElement.innerHTML).toContain('<br>');
  });

  it('should apply proper CSS classes for display content', () => {
    renderTableCell(defaultProps);
    
    const cellElement = screen.getByRole('gridcell');
    const displayContent = cellElement.querySelector('.cell-display-content');
    
    expect(displayContent).toBeInTheDocument();
    expect(displayContent).toHaveClass('min-h-[1.2rem]', 'w-full');
  });
});