// ABOUTME: TipTap mark extension for background color (text highlighting) with validation

import { Mark, mergeAttributes } from '@tiptap/core';

export interface BackgroundColorOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    backgroundColor: {
      /**
       * Set the background color for text highlighting
       */
      setBackgroundColor: (color: string) => ReturnType;
      /**
       * Unset the background color
       */
      unsetBackgroundColor: () => ReturnType;
      /**
       * Toggle yellow highlight (common use case)
       */
      toggleHighlight: () => ReturnType;
    };
  }
}

export const BackgroundColorMark = Mark.create<BackgroundColorOptions>({
  name: 'backgroundColor',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: null,
        parseHTML: element => {
          const backgroundColor = element.style.backgroundColor;
          return backgroundColor || null;
        },
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="background-color"]',
        getAttrs: element => {
          const backgroundColor = (element as HTMLElement).style.backgroundColor;
          return backgroundColor ? { backgroundColor } : false;
        },
      },
      // Parse standard HTML highlight elements
      {
        tag: 'mark',
        getAttrs: element => {
          const backgroundColor = (element as HTMLElement).style.backgroundColor || '#ffeb3b'; // Default yellow
          return { backgroundColor };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setBackgroundColor:
        (color: string) =>
        ({ commands }) => {
          // Basic color validation
          if (!color || typeof color !== 'string') {
            console.warn(`Invalid background color: ${color}`);
            return false;
          }

          // Trim and validate color format
          const trimmedColor = color.trim();
          const isValidColor = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|\w+)/.test(trimmedColor);
          
          if (!isValidColor) {
            console.warn(`Invalid background color format: ${trimmedColor}`);
            return false;
          }

          return commands.setMark(this.name, { backgroundColor: trimmedColor });
        },
      unsetBackgroundColor:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      toggleHighlight:
        () =>
        ({ commands, editor }) => {
          const currentBackground = editor.getAttributes(this.name).backgroundColor;
          const isHighlighted = Boolean(currentBackground);
          
          if (isHighlighted) {
            return commands.unsetMark(this.name);
          } else {
            // Default yellow highlight
            return commands.setMark(this.name, { backgroundColor: '#ffeb3b' });
          }
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Common highlight shortcut
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
      // Optional: Different highlight colors
      // 'Mod-Shift-y': () => this.editor.commands.setBackgroundColor('#ffeb3b'), // Yellow
      // 'Mod-Shift-p': () => this.editor.commands.setBackgroundColor('#e1bee7'), // Purple
      // 'Mod-Shift-g': () => this.editor.commands.setBackgroundColor('#c8e6c9'), // Green
    };
  },
});

export default BackgroundColorMark;