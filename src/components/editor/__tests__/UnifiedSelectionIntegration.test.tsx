// ABOUTME: Integration tests for unified selection system with TipTap editor

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionCoordination } from '@/hooks/useSelectionCoordination';
import { ContentSelectionType } from '@/types/editor';

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Simple test component that uses selection coordination
const TestSelectionComponent = ({
  blockId,
  componentType,
}: {
  blockId: string;
  componentType: string;
}) => {
  const {
    isActive,
    handleBlockActivation,
    handleContentSelection,
    handleTableCellClick,
    handlePollQuestionClick,
    isTableCellSelected,
    isPollQuestionSelected,
  } = useSelectionCoordination({
    blockId,
    componentType: componentType as any,
    enableContentSelection: true,
  });

  return (
    <div data-testid="selection-component">
      <div
        data-testid="block-trigger"
        onClick={() => handleBlockActivation()}
        className={isActive ? 'active' : 'inactive'}
      >
        Block {blockId} - {isActive ? 'Active' : 'Inactive'}
      </div>

      {componentType === 'table' && (
        <div
          data-testid="table-cell"
          onClick={() => handleTableCellClick('table-1', { row: 0, col: 0 }, false)}
          className={
            isTableCellSelected('table-1', { row: 0, col: 0 }) ? 'cell-active' : 'cell-inactive'
          }
        >
          Table Cell
        </div>
      )}

      {componentType === 'poll' && (
        <div
          data-testid="poll-question"
          onClick={() => handlePollQuestionClick('poll-1', false)}
          className={isPollQuestionSelected('poll-1') ? 'question-active' : 'question-inactive'}
        >
          Poll Question
        </div>
      )}

      <button
        data-testid="content-selector"
        onClick={() =>
          handleContentSelection(ContentSelectionType.TEXT, {
            textSelection: {
              blockId,
              selectedText: 'test text',
              textElement: document.createElement('div'),
              range: null,
              hasSelection: true,
            },
          })
        }
      >
        Select Content
      </button>
    </div>
  );
};

describe('🔥 Unified Selection Integration', () => {
  const mockEditorStore = {
    selectionState: {
      activeBlockId: null,
      contentSelection: null,
      hasBlockSelection: false,
      hasContentSelection: false,
      preventMultiSelection: true,
    },
    activateBlock: vi.fn(),
    clearAllSelection: vi.fn(),
    setContentSelection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as any).mockReturnValue(mockEditorStore);
  });

  describe('🎯 Block Selection Coordination', () => {
    it('should activate block selection when triggered', async () => {
      render(<TestSelectionComponent blockId="test-block-1" componentType="text" />);

      const blockTrigger = screen.getByTestId('block-trigger');

      // Initially inactive
      expect(blockTrigger).toHaveClass('inactive');

      // Mock store to return active state
      mockEditorStore.selectionState.activeBlockId = 'test-block-1';
      mockEditorStore.selectionState.hasBlockSelection = true;

      // Re-render with updated state
      render(<TestSelectionComponent blockId="test-block-1" componentType="text" />);

      const activeTrigger = screen.getByTestId('block-trigger');
      expect(activeTrigger).toHaveClass('active');
    });

    it('should prevent multiple simultaneous selections', async () => {
      render(<TestSelectionComponent blockId="test-block-1" componentType="text" />);

      const blockTrigger = screen.getByTestId('block-trigger');
      fireEvent.click(blockTrigger);

      // Should call activateBlock
      expect(mockEditorStore.activateBlock).toHaveBeenCalledWith('test-block-1');
    });
  });

  describe('📊 Table Selection Integration', () => {
    it('should handle table cell selection correctly', async () => {
      render(<TestSelectionComponent blockId="table-block-1" componentType="table" />);

      const tableCell = screen.getByTestId('table-cell');
      fireEvent.click(tableCell);

      // Should set content selection for table cell
      expect(mockEditorStore.setContentSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ContentSelectionType.TABLE_CELL,
          cellSelection: expect.objectContaining({
            tableId: 'table-1',
            cell: { row: 0, col: 0 },
          }),
        })
      );
    });

    it('should show table cell as selected when coordinated', async () => {
      // Mock table cell as selected
      mockEditorStore.selectionState.contentSelection = {
        type: ContentSelectionType.TABLE_CELL,
        cellSelection: {
          tableId: 'table-1',
          cell: { row: 0, col: 0 },
          isEditing: false,
        },
      };
      mockEditorStore.selectionState.hasContentSelection = true;

      render(<TestSelectionComponent blockId="table-block-1" componentType="table" />);

      const tableCell = screen.getByTestId('table-cell');
      expect(tableCell).toHaveClass('cell-active');
    });
  });

  describe('📋 Poll Selection Integration', () => {
    it('should handle poll question selection correctly', async () => {
      render(<TestSelectionComponent blockId="poll-block-1" componentType="poll" />);

      const pollQuestion = screen.getByTestId('poll-question');
      fireEvent.click(pollQuestion);

      // Should set content selection for poll question
      expect(mockEditorStore.setContentSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ContentSelectionType.POLL_QUESTION,
          pollSelection: expect.objectContaining({
            pollId: 'poll-1',
            isEditing: false,
          }),
        })
      );
    });
  });

  describe('✨ Content Selection Coordination', () => {
    it('should handle text content selection', async () => {
      render(<TestSelectionComponent blockId="test-block-1" componentType="text" />);

      const contentSelector = screen.getByTestId('content-selector');
      fireEvent.click(contentSelector);

      // Should set text content selection
      expect(mockEditorStore.setContentSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ContentSelectionType.TEXT,
          textSelection: expect.objectContaining({
            blockId: 'test-block-1',
            selectedText: 'test text',
            hasSelection: true,
          }),
        })
      );
    });

    it('should clear existing selection when setting new content selection', async () => {
      // Mock existing content selection
      mockEditorStore.selectionState.hasContentSelection = true;
      mockEditorStore.selectionState.activeBlockId = 'other-block';

      render(<TestSelectionComponent blockId="test-block-1" componentType="text" />);

      const blockTrigger = screen.getByTestId('block-trigger');
      fireEvent.click(blockTrigger);

      // Should clear existing selection when activating different block
      expect(mockEditorStore.clearAllSelection).toHaveBeenCalled();
    });
  });

  describe('🔀 Selection State Transitions', () => {
    it('should properly transition between selection types', async () => {
      render(<TestSelectionComponent blockId="test-block-1" componentType="text" />);

      // Start with block selection
      const blockTrigger = screen.getByTestId('block-trigger');
      fireEvent.click(blockTrigger);
      expect(mockEditorStore.activateBlock).toHaveBeenCalledWith('test-block-1');

      // Then add content selection
      const contentSelector = screen.getByTestId('content-selector');
      fireEvent.click(contentSelector);
      expect(mockEditorStore.setContentSelection).toHaveBeenCalled();
    });

    it('should maintain state consistency during rapid interactions', async () => {
      render(<TestSelectionComponent blockId="test-block-1" componentType="text" />);

      const blockTrigger = screen.getByTestId('block-trigger');
      const contentSelector = screen.getByTestId('content-selector');

      // Rapid clicks should not cause issues
      fireEvent.click(blockTrigger);
      fireEvent.click(contentSelector);
      fireEvent.click(blockTrigger);

      // Should handle rapid interactions gracefully
      expect(mockEditorStore.activateBlock).toHaveBeenCalledTimes(2);
      expect(mockEditorStore.setContentSelection).toHaveBeenCalledTimes(1);
    });
  });
});
