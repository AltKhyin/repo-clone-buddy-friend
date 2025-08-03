// ABOUTME: TipTap mark extension for font size with validation and constraints (8px-128px)

import { Mark, mergeAttributes } from '@tiptap/core';
import { TYPOGRAPHY_CONSTRAINTS } from '../../shared/typography-system';

export interface FontSizeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size (in pixels)
       */
      setFontSize: (fontSize: number) => ReturnType;
      /**
       * Unset the font size
       */
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSizeMark = Mark.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => {
          const fontSize = element.style.fontSize;
          if (fontSize) {
            // Extract numeric value from CSS (handles px, em, rem, etc.)
            const numericValue = parseFloat(fontSize);
            return numericValue && !isNaN(numericValue) ? numericValue : null;
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.fontSize || typeof attributes.fontSize !== 'number') {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}px`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
        getAttrs: element => {
          const fontSize = (element as HTMLElement).style.fontSize;
          if (fontSize) {
            const numericValue = parseFloat(fontSize);
            return numericValue && !isNaN(numericValue) ? { fontSize: numericValue } : false;
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: number) =>
        ({ commands }) => {
          // Validate and constrain font size
          const numericSize = parseInt(String(fontSize));
          if (isNaN(numericSize)) {
            console.warn(`Invalid font size: ${fontSize}`);
            return false;
          }

          const constrainedSize = Math.max(
            TYPOGRAPHY_CONSTRAINTS.fontSize.min,
            Math.min(TYPOGRAPHY_CONSTRAINTS.fontSize.max, numericSize)
          );

          if (constrainedSize !== numericSize) {
            console.info(`Font size constrained from ${numericSize}px to ${constrainedSize}px`);
          }

          return commands.setMark(this.name, { fontSize: constrainedSize });
        },
      unsetFontSize:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Common font size shortcuts
      'Mod-Shift-Period': () => {
        // Increase font size
        const currentSize = this.editor.getAttributes(this.name).fontSize || 16;
        const newSize = Math.min(TYPOGRAPHY_CONSTRAINTS.fontSize.max, currentSize + 2);
        return this.editor.commands.setFontSize(newSize);
      },
      'Mod-Shift-Comma': () => {
        // Decrease font size
        const currentSize = this.editor.getAttributes(this.name).fontSize || 16;
        const newSize = Math.max(TYPOGRAPHY_CONSTRAINTS.fontSize.min, currentSize - 2);
        return this.editor.commands.setFontSize(newSize);
      },
    };
  },
});

export default FontSizeMark;