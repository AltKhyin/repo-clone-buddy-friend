// ABOUTME: Simple TipTap extension for basic tables following Reddit's approach

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BasicTableComponent } from './BasicTableComponent';
import { BasicTableOptions, BasicTableData, DEFAULT_TABLE_DATA } from './types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    basicTable: {
      /**
       * Insert a basic table with simple structure
       */
      insertBasicTable: (options?: Partial<BasicTableData>) => ReturnType;
    };
  }
}

/**
 * Basic Table Extension - Simple replacement for complex TableExtension
 * Features:
 * - Plain text only (no rich content)
 * - Simple array-based data structure
 * - Reddit-inspired HTML structure
 * - Essential operations only
 */
export const BasicTableExtension = Node.create<BasicTableOptions>({
  name: 'basicTable',
  
  group: 'block',
  
  // CRITICAL FIX: Remove atom: true to allow content editing within the table
  // atom: true would make this a leaf node, conflicting with contentEditable cells
  atom: false,
  
  // Add isolating to prevent unwanted interactions with surrounding content
  isolating: true,
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'basic-table'
      }
    };
  },

  addAttributes() {
    return {
      tableData: {
        default: DEFAULT_TABLE_DATA,
        parseHTML: element => {
          const dataAttr = element.getAttribute('data-table');
          if (dataAttr) {
            try {
              const parsed = JSON.parse(dataAttr);
              // Validate parsed data has required structure
              if (parsed.headers && Array.isArray(parsed.headers) && 
                  parsed.rows && Array.isArray(parsed.rows)) {
                return parsed;
              }
            } catch (error) {
              console.warn('[BasicTable] Failed to parse table data:', error);
            }
          }
          return DEFAULT_TABLE_DATA;
        },
        renderHTML: attributes => {
          return {
            'data-table': JSON.stringify(attributes.tableData),
            'data-type': 'basic-table'
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'table[data-type="basic-table"]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'basic-table',
        class: 'table-fixed border-collapse w-full bg-transparent'
      }),
      // No content slot (0) needed since we're using NodeView
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BasicTableComponent);
  },

  addCommands() {
    return {
      insertBasicTable: (options = {}) => ({ commands }) => {
        const tableData: BasicTableData = {
          headers: options.headers || DEFAULT_TABLE_DATA.headers,
          rows: options.rows || DEFAULT_TABLE_DATA.rows,
          id: options.id || `table-${Date.now()}`
        };

        return commands.insertContent({
          type: this.name,
          attrs: { tableData }
        });
      }
    };
  }
});

// Named export only - default handled in index.ts