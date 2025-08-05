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

/**
 * Rich content cell data
 */
export interface RichCellData {
  /** Rich HTML content for the cell */
  content: string;
  /** Cell-specific styling overrides (optional) */
  styling?: {
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: number;
    fontWeight?: number;
  };
}

/**
 * Header layout options for table display
 */
export type HeaderLayout = 'column-only' | 'row-only' | 'both' | 'none';

/**
 * Table data structure supporting both legacy string cells and rich content cells
 */
export interface TableData {
  /** Table column headers (plain text for backward compatibility) */
  headers: string[];
  /** Table row headers (plain text) */
  rowHeaders: string[];
  /** Table rows - can contain either strings (legacy) or rich content objects */
  rows: (string | RichCellData)[][];
  /** Whether this table uses rich content cells */
  isRichContent?: boolean;
  /** Header layout configuration */
  headerLayout: HeaderLayout;
  /** Table-wide styling configuration */
  styling: {
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted';
    borderWidth: number;
    borderColor: string;
    gridLineColor: string;
    backgroundColor: string;
    headerBackgroundColor: string;
    alternatingRowColor: string;
    enableAlternatingRows: boolean;
    cellPadding: number;
    textAlign: 'left' | 'center' | 'right';
    fontSize: number;
    fontWeight: number;
    striped: boolean; // Legacy - use enableAlternatingRows instead
    compact: boolean;
  };
  /** Table behavior settings */
  settings: {
    sortable: boolean;
    resizable: boolean;
    showHeaders: boolean; // Legacy - use headerLayout instead
    minRows: number;
    maxRows: number;
  };
}

/**
 * Legacy table data for backward compatibility
 */
export interface LegacyTableData {
  headers: string[];
  rows: string[][];
  styling: Omit<TableData['styling'], 'gridLineColor' | 'alternatingRowColor' | 'enableAlternatingRows'>;
  settings: TableData['settings'];
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
      rowHeaders: {
        default: [],
        parseHTML: element => {
          const data = element.getAttribute('data-table');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.rowHeaders || [];
            } catch {
              return [];
            }
          }
          return [];
        },
        renderHTML: () => null,
      },
      headerLayout: {
        default: 'column-only',
        parseHTML: element => {
          const data = element.getAttribute('data-table');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.headerLayout || 'column-only';
            } catch {
              return 'column-only';
            }
          }
          return 'column-only';
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
          gridLineColor: '#e2e8f0',
          backgroundColor: 'transparent',
          headerBackgroundColor: '#f8fafc',
          alternatingRowColor: '#f8fafc',
          enableAlternatingRows: false,
          cellPadding: 12,
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 400,
          striped: false, // Legacy
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
      rowHeaders: node.attrs.rowHeaders || [],
      rows: node.attrs.rows || [],
      headerLayout: node.attrs.headerLayout || 'column-only',
      styling: node.attrs.styling || {},
      settings: node.attrs.settings || {},
    };

    // Build table children array without conditional spreads
    const tableChildren: any[] = [];
    const showColumnHeaders = tableData.headerLayout === 'column-only' || tableData.headerLayout === 'both';
    const showRowHeaders = tableData.headerLayout === 'row-only' || tableData.headerLayout === 'both';

    // Add thead if column headers should be shown
    if (showColumnHeaders && tableData.headers.length > 0) {
      const headerCells = [...tableData.headers];
      
      // Add empty cell for row header column if both headers are shown
      if (showRowHeaders) {
        headerCells.unshift('');
      }
      
      tableChildren.push([
        'thead',
        {},
        [
          'tr',
          {},
          ...headerCells.map(header => [
            'th',
            {
              style: `padding: ${tableData.styling.cellPadding || 12}px; border: 1px solid ${tableData.styling.gridLineColor || tableData.styling.borderColor || '#e2e8f0'}; background-color: ${tableData.styling.headerBackgroundColor || '#f8fafc'}; text-align: ${tableData.styling.textAlign || 'left'};`,
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
      ...tableData.rows.map((row, rowIndex) => {
        const isAlternatingRow = tableData.styling.enableAlternatingRows && rowIndex % 2 === 1;
        const rowBackgroundColor = isAlternatingRow ? tableData.styling.alternatingRowColor : tableData.styling.backgroundColor;
        
        const rowCells = [...row];
        
        // Add row header if row headers should be shown
        if (showRowHeaders) {
          const rowHeaderContent = tableData.rowHeaders[rowIndex] || `Row ${rowIndex + 1}`;
          rowCells.unshift(rowHeaderContent);
        }
        
        return [
          'tr',
          {},
          ...rowCells.map((cell, cellIndex) => {
            const isRowHeader = showRowHeaders && cellIndex === 0;
            
            // Handle both string cells (legacy) and RichCellData objects
            const cellContent = typeof cell === 'string' ? cell : (cell as RichCellData).content || '';
            const cellStyling = typeof cell === 'object' && cell !== null ? (cell as RichCellData).styling : undefined;
            
            // Determine cell background color
            let cellBackgroundColor = cellStyling?.backgroundColor || rowBackgroundColor || 'transparent';
            if (isRowHeader) {
              cellBackgroundColor = tableData.styling.headerBackgroundColor;
            }
            
            // Merge table-level styling with cell-specific styling
            const cellStyles = [
              `padding: ${tableData.styling.cellPadding || 12}px`,
              `border: 1px solid ${tableData.styling.gridLineColor || tableData.styling.borderColor || '#e2e8f0'}`,
              `background-color: ${cellBackgroundColor}`,
              `text-align: ${cellStyling?.textAlign || tableData.styling.textAlign || 'left'}`,
              cellStyling?.fontSize ? `font-size: ${cellStyling.fontSize}px` : `font-size: ${tableData.styling.fontSize || 14}px`,
              cellStyling?.fontWeight ? `font-weight: ${cellStyling.fontWeight}` : `font-weight: ${tableData.styling.fontWeight || 400}`,
            ].filter(Boolean).join('; ');

            return [
              isRowHeader ? 'th' : 'td',
              {
                style: cellStyles,
              },
              cellContent,
            ];
          }),
        ];
      }),
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
          style: `border-collapse: collapse; width: 100%; border: ${tableData.styling.borderWidth || 1}px ${tableData.styling.borderStyle || 'solid'} ${tableData.styling.gridLineColor || tableData.styling.borderColor || '#e2e8f0'}; background-color: ${tableData.styling.backgroundColor || 'transparent'};`,
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
              rowHeaders: [], // Initially empty
              headerLayout: withHeaderRow ? 'column-only' : 'none',
              rows: emptyRows,
              styling: {
                borderStyle: 'solid',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                gridLineColor: '#e2e8f0',
                backgroundColor: 'transparent',
                headerBackgroundColor: '#f8fafc',
                alternatingRowColor: '#f8fafc',
                enableAlternatingRows: false,
                cellPadding: 12,
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 400,
                striped: false, // Legacy
                compact: false,
              },
              settings: {
                sortable: false,
                resizable: true,
                showHeaders: withHeaderRow, // Legacy
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
