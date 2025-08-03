// ABOUTME: TipTap mark extension for font family selection with comprehensive font validation

import { Mark, mergeAttributes } from '@tiptap/core';
import { FONT_FAMILIES } from '../../shared/typography-system';

export interface FontFamilyOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      /**
       * Set the font family
       */
      setFontFamily: (fontFamily: string) => ReturnType;
      /**
       * Unset the font family
       */
      unsetFontFamily: () => ReturnType;
    };
  }
}

export const FontFamilyMark = Mark.create<FontFamilyOptions>({
  name: 'fontFamily',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: element => {
          const fontFamily = element.style.fontFamily;
          return fontFamily || null;
        },
        renderHTML: attributes => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            style: `font-family: ${attributes.fontFamily}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-family"]',
        getAttrs: element => {
          const fontFamily = (element as HTMLElement).style.fontFamily;
          return fontFamily ? { fontFamily } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        ({ commands }) => {
          // Validate font family against allowed list
          const isValidFont = FONT_FAMILIES.some(font => font.value === fontFamily);
          if (!isValidFont && fontFamily !== 'inherit') {
            console.warn(`Invalid font family: ${fontFamily}`);
            return false;
          }

          return commands.setMark(this.name, { fontFamily });
        },
      unsetFontFamily:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Optional: Add keyboard shortcuts for common fonts
      // 'Mod-Shift-f': () => this.editor.commands.setFontFamily('Arial'),
    };
  },
});

export default FontFamilyMark;