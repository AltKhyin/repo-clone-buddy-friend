// ABOUTME: TipTap node extension for text alignment targeting block-level elements for proper CSS text-align behavior

import { Node, mergeAttributes } from '@tiptap/core';

export interface TextAlignOptions {
  HTMLAttributes: Record<string, any>;
  alignments: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textAlign: {
      /**
       * Set text alignment for the current block element
       */
      setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => ReturnType;
      /**
       * Unset text alignment from the current block element
       */
      unsetTextAlign: () => ReturnType;
    };
  }
}

export const TextAlignNode = Node.create<TextAlignOptions>({
  name: 'textAlign',

  addOptions() {
    return {
      HTMLAttributes: {},
      alignments: ['left', 'center', 'right', 'justify'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: element => {
              const textAlign = element.style.textAlign;
              return textAlign || null;
            },
            renderHTML: attributes => {
              if (!attributes.textAlign) {
                return {};
              }
              return {
                style: `text-align: ${attributes.textAlign}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment: 'left' | 'center' | 'right' | 'justify') =>
        ({ commands, state, tr }) => {
          const validAlignments = ['left', 'center', 'right', 'justify'];
          
          if (!alignment || typeof alignment !== 'string') {
            console.warn(`Invalid text alignment: ${alignment}`);
            return false;
          }

          const trimmedAlignment = alignment.trim().toLowerCase();
          if (!validAlignments.includes(trimmedAlignment)) {
            console.warn(`Invalid text alignment: ${alignment}. Valid alignments: ${validAlignments.join(', ')}`);
            return false;
          }

          // Get the current selection
          const { from, to } = state.selection;
          
          // Apply text alignment to all block nodes in selection
          let updated = false;
          tr.doc.nodesBetween(from, to, (node, pos) => {
            // Only apply to block nodes that support text alignment
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              const attrs = { ...node.attrs, textAlign: trimmedAlignment };
              tr.setNodeMarkup(pos, undefined, attrs);
              updated = true;
            }
          });

          if (updated) {
            tr.setMeta('preventUpdate', false);
            return true;
          }

          return false;
        },

      unsetTextAlign:
        () =>
        ({ commands, state, tr }) => {
          // Get the current selection
          const { from, to } = state.selection;
          
          // Remove text alignment from all block nodes in selection
          let updated = false;
          tr.doc.nodesBetween(from, to, (node, pos) => {
            // Only apply to block nodes that have text alignment
            if ((node.type.name === 'paragraph' || node.type.name === 'heading') && node.attrs.textAlign) {
              const attrs = { ...node.attrs };
              delete attrs.textAlign;
              tr.setNodeMarkup(pos, undefined, attrs);
              updated = true;
            }
          });

          if (updated) {
            tr.setMeta('preventUpdate', false);
            return true;
          }

          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-l': () => this.editor.commands.setTextAlign('left'),
      'Mod-Shift-e': () => this.editor.commands.setTextAlign('center'),
      'Mod-Shift-r': () => this.editor.commands.setTextAlign('right'),
      'Mod-Shift-j': () => this.editor.commands.setTextAlign('justify'),
    };
  },
});

export default TextAlignNode;