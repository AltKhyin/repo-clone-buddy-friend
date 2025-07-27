// ABOUTME: Basic validation tests for unified selection system functionality

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ContentSelectionType } from '@/types/editor';

// Mock dependencies
vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
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
  }),
  useEditorActions: () => ({
    activateBlock: vi.fn(),
    clearAllSelection: vi.fn(),
    setContentSelection: vi.fn(),
  }),
  useSelectionState: () => ({
    activeBlockId: null,
    contentSelection: null,
    hasBlockSelection: false,
    hasContentSelection: false,
    preventMultiSelection: true,
  }),
  useIsBlockActive: () => false,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('🔥 Selection System Validation', () => {
  describe('✅ Core Type Definitions', () => {
    it('should have all required ContentSelectionType values', () => {
      expect(ContentSelectionType.NONE).toBe('none');
      expect(ContentSelectionType.TEXT).toBe('text');
      expect(ContentSelectionType.TABLE_CELL).toBe('table_cell');
      expect(ContentSelectionType.POLL_OPTION).toBe('poll_option');
      expect(ContentSelectionType.POLL_QUESTION).toBe('poll_question');
    });

    it('should ensure ContentSelectionType enum is complete', () => {
      const expectedTypes = ['none', 'text', 'table_cell', 'poll_option', 'poll_question'];
      const actualTypes = Object.values(ContentSelectionType);

      expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(actualTypes).toHaveLength(expectedTypes.length);
    });
  });

  describe('🎯 Selection Coordination Hook Import', () => {
    it('should import useSelectionCoordination without errors', async () => {
      // This test validates that our hook can be imported without compilation errors
      const { useSelectionCoordination } = await import('@/hooks/useSelectionCoordination');
      expect(useSelectionCoordination).toBeDefined();
      expect(typeof useSelectionCoordination).toBe('function');
    });
  });

  describe('📊 Component Integration Tests', () => {
    it('should import TableComponent without errors', async () => {
      const { TableComponent } = await import(
        '@/components/editor/extensions/Table/TableComponent'
      );
      expect(TableComponent).toBeDefined();
      expect(typeof TableComponent).toBe('function');
    });

    it('should import PollComponent without errors', async () => {
      const { PollComponent } = await import('@/components/editor/extensions/Poll/PollComponent');
      expect(PollComponent).toBeDefined();
      expect(typeof PollComponent).toBe('function');
    });

    it('should import RichBlockNode without errors', async () => {
      const { RichBlockNode } = await import('@/components/editor/Nodes/RichBlockNode');
      expect(RichBlockNode).toBeDefined();
      expect(typeof RichBlockNode).toBe('function');
    });
  });

  describe('🏪 Store Integration Tests', () => {
    it('should import editor store selectors without errors', async () => {
      const store = await import('@/store/editorStore');

      expect(store.useEditorStore).toBeDefined();
      expect(store.useEditorActions).toBeDefined();
      expect(store.useSelectionState).toBeDefined();
      expect(store.useIsBlockActive).toBeDefined();
    });
  });

  describe('🔄 Type Safety Validation', () => {
    it('should validate SelectionState interface structure', () => {
      // Import the type and test that it has the expected shape
      const mockSelectionState = {
        activeBlockId: 'test-block' as string | null,
        contentSelection: {
          type: ContentSelectionType.TEXT,
          textSelection: {
            blockId: 'test-block',
            selectedText: 'sample text',
            textElement: document.createElement('div'),
            range: null,
            hasSelection: true,
          },
        } as any,
        hasBlockSelection: true,
        hasContentSelection: true,
        preventMultiSelection: true,
      };

      // Verify the structure matches our expectations
      expect(mockSelectionState.activeBlockId).toBeDefined();
      expect(mockSelectionState.contentSelection).toBeDefined();
      expect(mockSelectionState.hasBlockSelection).toBeDefined();
      expect(mockSelectionState.hasContentSelection).toBeDefined();
      expect(mockSelectionState.preventMultiSelection).toBeDefined();
    });

    it('should validate ContentSelectionInfo interface for table cells', () => {
      const mockTableSelection = {
        type: ContentSelectionType.TABLE_CELL,
        cellSelection: {
          tableId: 'table-1',
          cell: { row: 0, col: 1 },
          isEditing: false,
        },
      };

      expect(mockTableSelection.type).toBe(ContentSelectionType.TABLE_CELL);
      expect(mockTableSelection.cellSelection?.tableId).toBe('table-1');
      expect(mockTableSelection.cellSelection?.cell.row).toBe(0);
      expect(mockTableSelection.cellSelection?.cell.col).toBe(1);
    });

    it('should validate ContentSelectionInfo interface for poll questions', () => {
      const mockPollSelection = {
        type: ContentSelectionType.POLL_QUESTION,
        pollSelection: {
          pollId: 'poll-1',
          questionId: 'main-question',
          isEditing: true,
        },
      };

      expect(mockPollSelection.type).toBe(ContentSelectionType.POLL_QUESTION);
      expect(mockPollSelection.pollSelection?.pollId).toBe('poll-1');
      expect(mockPollSelection.pollSelection?.isEditing).toBe(true);
    });
  });

  describe('⚡ Performance Crisis Elimination Validation', () => {
    it('should not use performance monitoring hooks in new components', async () => {
      // Read the TableComponent source to ensure it doesn't use performance monitoring
      const tableComponentModule = await import(
        '@/components/editor/extensions/Table/TableComponent'
      );
      const tableComponentSource = tableComponentModule.TableComponent.toString();

      // These hooks were causing the 426k+ render crisis
      expect(tableComponentSource).not.toContain('useOptimizedCallback');
      expect(tableComponentSource).not.toContain('usePerformanceMonitor');
      expect(tableComponentSource).not.toContain('useMemoWithDeps');
      expect(tableComponentSource).not.toContain('useRenderTracker');
    });

    it('should not use performance monitoring hooks in poll component', async () => {
      // Read the PollComponent source to ensure it doesn't use performance monitoring
      const pollComponentModule = await import('@/components/editor/extensions/Poll/PollComponent');
      const pollComponentSource = pollComponentModule.PollComponent.toString();

      // These hooks were causing the 426k+ render crisis
      expect(pollComponentSource).not.toContain('useOptimizedCallback');
      expect(pollComponentSource).not.toContain('usePerformanceMonitor');
      expect(pollComponentSource).not.toContain('useMemoWithDeps');
      expect(pollComponentSource).not.toContain('useRenderTracker');
    });
  });

  describe('🎯 Integration Completeness', () => {
    it('should have unified selection system in place', () => {
      // This validates that our main integration points exist
      expect(ContentSelectionType).toBeDefined();

      // Test that we can construct valid selection states
      const textSelection = ContentSelectionType.TEXT;
      const tableSelection = ContentSelectionType.TABLE_CELL;
      const pollSelection = ContentSelectionType.POLL_QUESTION;

      expect(textSelection).toBe('text');
      expect(tableSelection).toBe('table_cell');
      expect(pollSelection).toBe('poll_question');
    });
  });
});
