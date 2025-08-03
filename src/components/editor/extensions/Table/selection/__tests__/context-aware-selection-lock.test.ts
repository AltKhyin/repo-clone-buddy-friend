// ABOUTME: Tests for context-aware table selection locking that prevents over-aggressive blocking of normal text selection

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the table component registry with correct interface
vi.mock('@/components/editor/extensions/Table/tableCommands', () => ({
  tableComponentRegistry: {
    register: vi.fn(),
    unregister: vi.fn(),
    get: vi.fn(() => null),
    getCurrentComponent: vi.fn(() => null),
  },
  tableCommands: {
    addColumnAfter: vi.fn(),
    addColumnBefore: vi.fn(),
    deleteColumn: vi.fn(),
    addRowAfter: vi.fn(),
    addRowBefore: vi.fn(),
    deleteRow: vi.fn(),
    deleteTable: vi.fn(),
    updateTableData: vi.fn(),
    setCellAttribute: vi.fn(),
  },
}));

import { TableSelectionCoordinator } from '../TableSelectionCoordinator';
import { tableComponentRegistry } from '@/components/editor/extensions/Table/tableCommands';

describe('TableSelectionCoordinator - Context-Aware Selection Lock', () => {
  let coordinator: TableSelectionCoordinator;
  
  beforeEach(() => {
    coordinator = new TableSelectionCoordinator();
    vi.clearAllMocks();
    
    // Mock table component registry to provide fake table components
    const mockTableComponent = {
      getFocusedCellEditor: vi.fn(() => null),
      findCellElement: vi.fn(() => null),
      addColumn: vi.fn(),
      removeColumn: vi.fn(),
      addRow: vi.fn(),
      removeRow: vi.fn(),
      updateTableData: vi.fn(),
      getCurrentCellPosition: vi.fn(() => ({ row: 0, col: 0 })),
      getFocusedCellTypographyCommands: vi.fn(() => null),
    };
    
    // Set up the mock registry to return our mock component for 'table-1'
    (tableComponentRegistry.get as any).mockImplementation((tableId: string) => {
      return tableId === 'table-1' ? mockTableComponent : undefined;
    });
    
    // Register mock table component using correct method (this is also mocked but we call it for completeness)
    tableComponentRegistry.register('table-1', mockTableComponent);
  });

  describe('🔴 RED: Intelligent Lock Management (Failing Tests)', () => {
    it('should only lock when table cell is actually active and selected', () => {
      // Current behavior: locks immediately when focusCell is called
      // Desired behavior: only lock when cell is actively being used
      
      // Step 1: Focus a cell (should not immediately lock)
      coordinator.focusCell('table-1', { row: 0, col: 0 }, null, false);
      
      // SHOULD NOT BE LOCKED YET - user hasn't interacted with the cell
      expect(coordinator.isSelectionLocked()).toBe(false);
      
      // Step 2: User starts typing or interacting with the cell (should lock)
      coordinator.activateCellInteraction('table-1', { row: 0, col: 0 });
      
      // NOW it should be locked because user is actively using the cell
      expect(coordinator.isSelectionLocked()).toBe(true);
    });

    it('should automatically unlock when transitioning to non-table content', () => {
      // Set up: Have an active table cell selection
      coordinator.focusCell('table-1', { row: 0, col: 0 }, null, false);
      coordinator.activateCellInteraction('table-1', { row: 0, col: 0 });
      expect(coordinator.isSelectionLocked()).toBe(true);
      
      // User clicks on normal text block outside table
      coordinator.handleNonTableSelection();
      
      // Should automatically unlock to allow normal text selection
      expect(coordinator.isSelectionLocked()).toBe(false);
      expect(coordinator.hasTableCellSelection()).toBe(false);
    });

    it('should distinguish between table toolbar interactions and text selection', () => {
      // Set up: Active table cell
      coordinator.focusCell('table-1', { row: 0, col: 0 }, null, false);
      coordinator.activateCellInteraction('table-1', { row: 0, col: 0 });
      expect(coordinator.isSelectionLocked()).toBe(true);
      
      // User interacts with table-specific toolbar (should remain locked)
      const shouldRemainLocked = coordinator.shouldPreserveSelectionForInteraction('table-toolbar');
      expect(shouldRemainLocked).toBe(true);
      expect(coordinator.isSelectionLocked()).toBe(true);
      
      // User interacts with general typography toolbar (should unlock for text formatting)
      const shouldUnlockForTypography = coordinator.shouldPreserveSelectionForInteraction('typography-toolbar');
      expect(shouldUnlockForTypography).toBe(false);
    });

    it('should handle rapid table-to-text-to-table transitions', () => {
      // This tests the coordination during rapid user interactions
      
      // Start with table selection
      coordinator.focusCell('table-1', { row: 0, col: 0 }, null, false);
      coordinator.activateCellInteraction('table-1', { row: 0, col: 0 });
      expect(coordinator.isSelectionLocked()).toBe(true);
      
      // Quick click on text (should unlock)
      coordinator.handleNonTableSelection();
      expect(coordinator.isSelectionLocked()).toBe(false);
      
      // Quick return to table (should lock again)
      coordinator.focusCell('table-1', { row: 1, col: 1 }, null, false);
      coordinator.activateCellInteraction('table-1', { row: 1, col: 1 });
      expect(coordinator.isSelectionLocked()).toBe(true);
      
      // The system should handle this smoothly without conflicts
      expect(coordinator.hasTableCellSelection()).toBe(true);
    });

    it('should provide lock status for external coordination', () => {
      // External systems (like global selection management) need to query lock status
      
      expect(coordinator.isSelectionLocked()).toBe(false);
      expect(coordinator.getLockReason()).toBe(null);
      
      coordinator.focusCell('table-1', { row: 0, col: 0 }, null, false);
      coordinator.activateCellInteraction('table-1', { row: 0, col: 0 });
      
      expect(coordinator.isSelectionLocked()).toBe(true);
      expect(coordinator.getLockReason()).toBe('table-cell-active');
      expect(coordinator.getActiveTableId()).toBe('table-1');
    });
  });

  describe('🟢 GREEN: Enhanced Behavior (Will Pass After Implementation)', () => {
    it('should work correctly with stable selection patterns', () => {
      // Normal table usage should work smoothly
      coordinator.focusCell('table-1', { row: 0, col: 0 }, null, false);
      expect(coordinator.hasTableCellSelection()).toBe(true);
      
      // Clear selection should work when not actively editing
      coordinator.clearSelection();
      expect(coordinator.hasTableCellSelection()).toBe(false);
      expect(coordinator.isSelectionLocked()).toBe(false);
    });

    it('should coordinate properly with text selection systems', () => {
      // This test will pass once we implement proper coordination
      
      // Start with no selections
      expect(coordinator.canAllowTextSelection()).toBe(true);
      
      // Focus table cell but don't activate
      coordinator.focusCell('table-1', { row: 0, col: 0 }, null, false);
      expect(coordinator.canAllowTextSelection()).toBe(true); // Should still allow text selection
      
      // Activate cell interaction
      coordinator.activateCellInteraction('table-1', { row: 0, col: 0 });
      expect(coordinator.canAllowTextSelection()).toBe(false); // Now block text selection
      
      // Deactivate
      coordinator.handleNonTableSelection();
      expect(coordinator.canAllowTextSelection()).toBe(true); // Allow text selection again
    });
  });
});

// Additional interface methods that need to be implemented
declare module '../TableSelectionCoordinator' {
  interface TableSelectionCoordinator {
    activateCellInteraction(tableId: string, position: { row: number; col: number }): void;
    handleNonTableSelection(): void;
    shouldPreserveSelectionForInteraction(interactionType: string): boolean;
    getLockReason(): string | null;
    getActiveTableId(): string | null;
    canAllowTextSelection(): boolean;
  }
}