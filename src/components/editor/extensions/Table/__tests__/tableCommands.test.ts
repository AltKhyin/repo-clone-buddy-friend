// ABOUTME: Tests for table command integration with TableComponent

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTableCommands,
  tableComponentRegistry,
  TableComponentMethods,
} from '../tableCommands';

describe('TableCommands Integration', () => {
  let mockComponent: TableComponentMethods;
  let commands: ReturnType<typeof createTableCommands>;

  beforeEach(() => {
    // Clear registry
    tableComponentRegistry['components'].clear();

    // Create mock component
    mockComponent = {
      addColumn: vi.fn(),
      removeColumn: vi.fn(),
      addRow: vi.fn(),
      removeRow: vi.fn(),
      updateTableData: vi.fn(),
      getCurrentCellPosition: vi.fn(() => ({ row: 0, col: 0 })),
    };

    // Register mock component
    tableComponentRegistry.register('test-table-1', mockComponent);

    // Create commands
    commands = createTableCommands();
  });

  describe('Component Registry', () => {
    it('should register and retrieve components correctly', () => {
      const retrievedComponent = tableComponentRegistry.get('test-table-1');
      expect(retrievedComponent).toBe(mockComponent);
    });

    it('should unregister components correctly', () => {
      tableComponentRegistry.unregister('test-table-1');
      const retrievedComponent = tableComponentRegistry.get('test-table-1');
      expect(retrievedComponent).toBeUndefined();
    });
  });

  describe('Command Integration', () => {
    const mockState = {
      selection: {
        $from: {
          depth: 1,
          node: (depth: number) => ({
            type: { name: 'customTable' },
            attrs: { tableId: 'test-table-1', headers: ['Col 1', 'Col 2'], rows: [['A', 'B']] },
          }),
        },
      },
    };

    const mockDispatch = vi.fn();
    const mockTr = { setMeta: vi.fn().mockReturnThis() };

    it('should call addColumn when addColumnAfter command is executed', () => {
      const result = commands.addColumnAfter()({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.addColumn).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(mockTr);
    });

    it('should call removeColumn when deleteColumn command is executed', () => {
      const result = commands.deleteColumn()({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.removeColumn).toHaveBeenCalledWith(0);
    });

    it('should call addRow when addRowAfter command is executed', () => {
      const result = commands.addRowAfter()({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.addRow).toHaveBeenCalled();
    });

    it('should return false when no table node is found', () => {
      const mockStateWithoutTable = {
        selection: {
          $from: {
            depth: 0,
            node: () => ({ type: { name: 'paragraph' } }),
          },
        },
      };

      const result = commands.addColumnAfter()({
        state: mockStateWithoutTable,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(false);
      expect(mockComponent.addColumn).not.toHaveBeenCalled();
    });

    it('should return false when component is not registered', () => {
      tableComponentRegistry.unregister('test-table-1');

      const result = commands.addColumnAfter()({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(false);
      expect(mockComponent.addColumn).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockComponent.addColumn = vi.fn(() => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = commands.addColumnAfter()({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add column:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('UpdateTableData Command', () => {
    const mockState = {
      selection: {
        $from: {
          depth: 1,
          node: (depth: number) => ({
            type: { name: 'customTable' },
            attrs: { tableId: 'test-table-1' },
          }),
        },
      },
    };

    it('should call updateTableData with provided data', () => {
      const testData = { headers: ['New Col 1', 'New Col 2'] };

      const result = commands.updateTableData(testData)({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(true);
      expect(mockComponent.updateTableData).toHaveBeenCalledWith(testData);
    });
  });

  describe('SetCellAttribute Command', () => {
    const mockState = {
      selection: {
        $from: {
          depth: 1,
          node: (depth: number) => ({
            type: { name: 'customTable' },
            attrs: {
              tableId: 'test-table-1',
              styling: { textAlign: 'left' },
            },
          }),
        },
      },
    };

    it('should update styling through updateTableData', () => {
      const result = commands.setCellAttribute(
        'textAlign',
        'center'
      )({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(true);
      expect(mockComponent.updateTableData).toHaveBeenCalledWith({
        styling: { textAlign: 'center' },
      });
    });
  });
});
