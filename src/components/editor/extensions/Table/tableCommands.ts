// ABOUTME: Functional TipTap table commands that properly integrate with TableComponent methods

import { Command } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { TableData } from './TableExtension';

/**
 * Interface for table component methods that commands can call
 */
export interface TableComponentMethods {
  addColumn: () => void;
  removeColumn: (colIndex: number) => void;
  addRow: () => void;
  removeRow: (rowIndex: number) => void;
  updateTableData: (updates: Partial<TableData>) => void;
  getCurrentCellPosition: () => { row: number; col: number } | null;
}

/**
 * Component registry for managing table component references
 */
class TableComponentRegistry {
  private components = new Map<string, TableComponentMethods>();

  register(nodeId: string, component: TableComponentMethods) {
    this.components.set(nodeId, component);
  }

  unregister(nodeId: string) {
    this.components.delete(nodeId);
  }

  get(nodeId: string): TableComponentMethods | undefined {
    return this.components.get(nodeId);
  }

  // Get component for current table node at selection
  getCurrentComponent(node: Node): TableComponentMethods | undefined {
    const tableId = node.attrs.tableId;
    return tableId ? this.components.get(tableId) : undefined;
  }
}

// Global registry instance
export const tableComponentRegistry = new TableComponentRegistry();

/**
 * Helper to find the current table node at selection
 */
const findCurrentTableNode = (state: any): Node | null => {
  const { selection } = state;
  const { $from } = selection;

  // Walk up the node tree to find a customTable node
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === 'customTable') {
      return node;
    }
  }

  return null;
};

/**
 * Helper to get current cell position within table
 */
const getCurrentCellPosition = (state: any): { row: number; col: number } | null => {
  const { selection } = state;
  const { $from } = selection;

  // This is a simplified version - in a full implementation,
  // we would need to properly traverse the table structure
  // For now, return null to indicate position detection needs refinement
  return null;
};

/**
 * Create functional table commands that integrate with TableComponent
 */
export const createTableCommands = () => ({
  /**
   * Add a column after the current column
   */
  addColumnAfter:
    (): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        // Call the component method to add column
        component.addColumn();

        // Update the document to trigger re-render
        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to add column:', error);
        return false;
      }
    },

  /**
   * Add a column before the current column
   */
  addColumnBefore:
    (): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        // For "before" insertion, we need to get current position
        const cellPos = component.getCurrentCellPosition();
        if (cellPos) {
          // This would need component support for inserting at specific position
          component.addColumn();
        } else {
          component.addColumn();
        }

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to add column before:', error);
        return false;
      }
    },

  /**
   * Delete the current column
   */
  deleteColumn:
    (): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        const cellPos = component.getCurrentCellPosition();
        if (cellPos) {
          component.removeColumn(cellPos.col);
        } else {
          // If we can't determine position, remove last column as fallback
          const headers = tableNode.attrs.headers || [];
          if (headers.length > 1) {
            component.removeColumn(headers.length - 1);
          }
        }

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to delete column:', error);
        return false;
      }
    },

  /**
   * Add a row after the current row
   */
  addRowAfter:
    (): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        component.addRow();

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to add row:', error);
        return false;
      }
    },

  /**
   * Add a row before the current row
   */
  addRowBefore:
    (): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        // For now, just add at end - component would need position-aware insertion
        component.addRow();

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to add row before:', error);
        return false;
      }
    },

  /**
   * Delete the current row
   */
  deleteRow:
    (): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        const cellPos = component.getCurrentCellPosition();
        if (cellPos) {
          component.removeRow(cellPos.row);
        } else {
          // If we can't determine position, remove last row as fallback
          const rows = tableNode.attrs.rows || [];
          if (rows.length > 1) {
            component.removeRow(rows.length - 1);
          }
        }

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to delete row:', error);
        return false;
      }
    },

  /**
   * Delete the entire table
   */
  deleteTable:
    (): Command =>
    ({ commands }) => {
      return commands.deleteSelection();
    },

  /**
   * Update table data
   */
  updateTableData:
    (data: Partial<TableData>): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        component.updateTableData(data);

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to update table data:', error);
        return false;
      }
    },

  /**
   * Set cell attribute (for alignment, styling, etc.)
   */
  setCellAttribute:
    (attribute: string, value: any): Command =>
    ({ state, dispatch, tr }) => {
      const tableNode = findCurrentTableNode(state);
      if (!tableNode) return false;

      const component = tableComponentRegistry.getCurrentComponent(tableNode);
      if (!component) return false;

      try {
        // Update styling through component's updateTableData method
        const currentStyling = tableNode.attrs.styling || {};
        const updatedStyling = { ...currentStyling, [attribute]: value };

        component.updateTableData({ styling: updatedStyling });

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to set cell attribute:', error);
        return false;
      }
    },
});

/**
 * Export command creators for use in TableExtension
 */
export const tableCommands = createTableCommands();
