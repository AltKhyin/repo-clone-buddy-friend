// ABOUTME: TipTap extension for Reddit-style tables with simplified single-click editing using SimpleTableComponent

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SimpleTableComponent } from './SimpleTableComponent';
import { tableCommands } from './tableCommands';

export interface TableOptions {
  HTMLAttributes: Record<string, any>;
  resizable: boolean;
  handleWidth: number;
  cellMinWidth: number;
  View: any;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  styling: {
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted';
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
    headerBackgroundColor: string;
    cellPadding: number;
    textAlign: 'left' | 'center' | 'right';
    fontSize: number;
    fontWeight: number;
    striped: boolean;
    compact: boolean;
  };
  settings: {
    sortable: boolean;
    resizable: boolean;
    showHeaders: boolean;
    minRows: number;
    maxRows: number;
  };
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    table: {
      /**
       * Insert a table
       */
      insertTable: (options?: {
        rows?: number;
        cols?: number;
        withHeaderRow?: boolean;
        headers?: string[];
      }) => ReturnType;
      /**
       * Add a column after the current column
       */
      addColumnAfter: () => ReturnType;
      /**
       * Add a column before the current column
       */
      addColumnBefore: () => ReturnType;
      /**
       * Delete the current column
       */
      deleteColumn: () => ReturnType;
      /**
       * Add a row after the current row
       */
      addRowAfter: () => ReturnType;
      /**
       * Add a row before the current row
       */
      addRowBefore: () => ReturnType;
      /**
       * Delete the current row
       */
      deleteRow: () => ReturnType;
      /**
       * Delete the entire table
       */
      deleteTable: () => ReturnType;
      /**
       * Update table data
       */
      updateTableData: (data: Partial<TableData>) => ReturnType;
    };
  }
}

export const TableExtension = Node.create<TableOptions>({
  name: 'customTable',

  addOptions() {
    return {
      HTMLAttributes: {},
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 100,
      View: SimpleTableComponent,
    };
  },

  group: 'block',

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      headers: {
        default: [],
        parseHTML: element => {
          const data = element.getAttribute('data-table');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.headers || [];
            } catch {
              return [];
            }
          }
          return [];
        },
        renderHTML: () => null,
      },
      rows: {
        default: [],
        parseHTML: element => {
          const data = element.getAttribute('data-table');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.rows || [];
            } catch {
              return [];
            }
          }
          return [];
        },
        renderHTML: () => null,
      },
      styling: {
        default: {
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          backgroundColor: 'transparent',
          headerBackgroundColor: '#f8fafc',
          cellPadding: 12,
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 400,
          striped: false,
          compact: false,
        },
        parseHTML: element => {
          const data = element.getAttribute('data-table');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.styling || {};
            } catch {
              return {};
            }
          }
          return {};
        },
        renderHTML: () => null,
      },
      settings: {
        default: {
          sortable: false,
          resizable: true,
          showHeaders: true,
          minRows: 1,
          maxRows: 50,
        },
        parseHTML: element => {
          const data = element.getAttribute('data-table');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.settings || {};
            } catch {
              return {};
            }
          }
          return {};
        },
        renderHTML: () => null,
      },
      tableId: {
        default: null,
        parseHTML: element => element.getAttribute('data-table-id'),
        renderHTML: attributes => {
          if (!attributes.tableId) {
            return null;
          }
          return {
            'data-table-id': attributes.tableId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const tableData: TableData = {
      headers: node.attrs.headers || [],
      rows: node.attrs.rows || [],
      styling: node.attrs.styling || {},
      settings: node.attrs.settings || {},
    };

    // Build table children array without conditional spreads
    const tableChildren: any[] = [];

    // Add thead if headers should be shown
    if (tableData.settings.showHeaders && tableData.headers.length > 0) {
      tableChildren.push([
        'thead',
        {},
        [
          'tr',
          {},
          ...tableData.headers.map(header => [
            'th',
            {
              style: `padding: ${tableData.styling.cellPadding || 12}px; border: 1px solid ${tableData.styling.borderColor || '#e2e8f0'}; background-color: ${tableData.styling.headerBackgroundColor || '#f8fafc'}; text-align: ${tableData.styling.textAlign || 'left'};`,
            },
            header,
          ]),
        ],
      ]);
    }

    // Add tbody
    tableChildren.push([
      'tbody',
      {},
      ...tableData.rows.map(row => [
        'tr',
        {},
        ...row.map(cell => [
          'td',
          {
            style: `padding: ${tableData.styling.cellPadding || 12}px; border: 1px solid ${tableData.styling.borderColor || '#e2e8f0'}; text-align: ${tableData.styling.textAlign || 'left'};`,
          },
          cell,
        ]),
      ]),
    ]);

    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'custom-table',
          'data-table': JSON.stringify(tableData),
          'data-table-id': node.attrs.tableId,
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      // Fallback content for non-interactive contexts
      [
        'table',
        {
          style: `border-collapse: collapse; width: 100%; border: ${tableData.styling.borderWidth || 1}px ${tableData.styling.borderStyle || 'solid'} ${tableData.styling.borderColor || '#e2e8f0'};`,
        },
        ...tableChildren,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SimpleTableComponent);
  },

  addCommands() {
    return {
      insertTable:
        (options = {}) =>
        ({ commands }) => {
          const { rows = 3, cols = 3, withHeaderRow = true, headers = [] } = options;

          // Generate default headers if not provided
          const defaultHeaders =
            headers.length > 0
              ? headers.slice(0, cols)
              : Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);

          // Ensure headers array matches column count
          const finalHeaders = Array.from(
            { length: cols },
            (_, i) => defaultHeaders[i] || `Column ${i + 1}`
          );

          // Generate empty rows
          const emptyRows = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => '')
          );

          // Generate unique table ID
          const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          return commands.insertContent({
            type: this.name,
            attrs: {
              tableId,
              headers: withHeaderRow ? finalHeaders : [],
              rows: emptyRows,
              styling: {
                borderStyle: 'solid',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                backgroundColor: 'transparent',
                headerBackgroundColor: '#f8fafc',
                cellPadding: 12,
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 400,
                striped: false,
                compact: false,
              },
              settings: {
                sortable: false,
                resizable: true,
                showHeaders: withHeaderRow,
                minRows: 1,
                maxRows: 50,
              },
            },
          });
        },

      // Real functional commands that integrate with TableComponent
      addColumnAfter: tableCommands.addColumnAfter,
      addColumnBefore: tableCommands.addColumnBefore,
      deleteColumn: tableCommands.deleteColumn,
      addRowAfter: tableCommands.addRowAfter,
      addRowBefore: tableCommands.addRowBefore,
      deleteRow: tableCommands.deleteRow,
      deleteTable: tableCommands.deleteTable,
      updateTableData: tableCommands.updateTableData,
      setCellAttribute: tableCommands.setCellAttribute,
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.insertTable(),
      Tab: ({ editor }) => {
        // Handle tab navigation within table cells
        // Implementation would be handled by the TableComponent
        return false;
      },
      'Shift-Tab': ({ editor }) => {
        // Handle shift+tab navigation within table cells
        // Implementation would be handled by the TableComponent
        return false;
      },
    };
  },
});
