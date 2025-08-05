// ABOUTME: TipTap mark extension for background color (text highlighting) with theme-aware defaults and validation

import { Mark, mergeAttributes } from '@tiptap/core';
import { isThemeToken, validateColorValue } from '@/utils/color-tokens';

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
          const backgroundColor = (element as HTMLElement).style.backgroundColor || 'hsl(var(--accent))'; // Theme-aware default
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
          // Enhanced color validation with theme token support
          if (!color || typeof color !== 'string') {
            console.warn(`Invalid background color: ${color}`);
            return false;
          }

          // Trim and validate color format (including theme tokens)
          const trimmedColor = color.trim();
          const isValidColor = isThemeToken(trimmedColor) || validateColorValue(trimmedColor);
          
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
            // Theme-aware default highlight
            return commands.setMark(this.name, { backgroundColor: 'hsl(var(--accent))' });
          }
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Common highlight shortcut
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
      // Theme-aware highlight colors
      // 'Mod-Shift-a': () => this.editor.commands.setBackgroundColor('hsl(var(--accent))'), // Accent
      // 'Mod-Shift-s': () => this.editor.commands.setBackgroundColor('hsl(var(--success-muted))'), // Success
      // 'Mod-Shift-e': () => this.editor.commands.setBackgroundColor('hsl(var(--error-muted))'), // Error
    };
  },
});

export default BackgroundColorMark;