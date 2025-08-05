// ABOUTME: TipTap mark extension for text color with theme-aware defaults and validation

import { Mark, mergeAttributes } from '@tiptap/core';
import { isThemeToken, validateColorValue } from '@/utils/color-tokens';

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
        default: 'hsl(var(--foreground))', // Theme-aware default text color
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
          // Enhanced color validation with theme token support
          if (!color || typeof color !== 'string') {
            console.warn(`Invalid color: ${color}`);
            return false;
          }

          // Trim and validate color format (including theme tokens)
          const trimmedColor = color.trim();
          const isValidColor = isThemeToken(trimmedColor) || validateColorValue(trimmedColor);
          
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
      // Theme-aware keyboard shortcuts for common text colors
      // 'Mod-Shift-d': () => this.editor.commands.setTextColor('hsl(var(--foreground))'), // Default text
      // 'Mod-Shift-p': () => this.editor.commands.setTextColor('hsl(var(--primary))'), // Primary
      // 'Mod-Shift-e': () => this.editor.commands.setTextColor('hsl(var(--destructive))'), // Error
    };
  },
});

export default TextColorMark;