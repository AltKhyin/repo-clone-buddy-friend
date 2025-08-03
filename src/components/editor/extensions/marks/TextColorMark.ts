// ABOUTME: TipTap mark extension for text color with validation and color reset functionality

import { Mark, mergeAttributes } from '@tiptap/core';

export interface TextColorOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textColor: {
      /**
       * Set the text color (hex, rgb, rgba, named color)
       */
      setTextColor: (color: string) => ReturnType;
      /**
       * Unset the text color
       */
      unsetTextColor: () => ReturnType;
    };
  }
}

export const TextColorMark = Mark.create<TextColorOptions>({
  name: 'textColor',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => {
          const color = element.style.color;
          return color || null;
        },
        renderHTML: attributes => {
          if (!attributes.color) {
            return {};
          }
          return {
            style: `color: ${attributes.color}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="color"]',
        getAttrs: element => {
          const color = (element as HTMLElement).style.color;
          return color ? { color } : false;
        },
      },
      // Also parse standard HTML color elements
      {
        tag: 'font[color]',
        getAttrs: element => {
          const color = (element as HTMLElement).getAttribute('color');
          return color ? { color } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextColor:
        (color: string) =>
        ({ commands }) => {
          // Basic color validation
          if (!color || typeof color !== 'string') {
            console.warn(`Invalid color: ${color}`);
            return false;
          }

          // Trim and validate color format
          const trimmedColor = color.trim();
          const isValidColor = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|\w+)/.test(trimmedColor);
          
          if (!isValidColor) {
            console.warn(`Invalid color format: ${trimmedColor}`);
            return false;
          }

          return commands.setMark(this.name, { color: trimmedColor });
        },
      unsetTextColor:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Optional: Add keyboard shortcuts for common colors
      // 'Mod-Shift-r': () => this.editor.commands.setTextColor('#ef4444'), // Red
      // 'Mod-Shift-g': () => this.editor.commands.setTextColor('#22c55e'), // Green
      // 'Mod-Shift-b': () => this.editor.commands.setTextColor('#3b82f6'), // Blue
    };
  },
});

export default TextColorMark;