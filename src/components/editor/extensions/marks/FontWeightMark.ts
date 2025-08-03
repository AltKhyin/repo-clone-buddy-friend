// ABOUTME: TipTap mark extension for font weight with enhanced weight handling and bold toggle

import { Mark, mergeAttributes } from '@tiptap/core';
import { FONT_WEIGHTS } from '../../shared/typography-system';

export interface FontWeightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontWeight: {
      /**
       * Set the font weight (numeric value)
       */
      setFontWeight: (fontWeight: number) => ReturnType;
      /**
       * Unset the font weight
       */
      unsetFontWeight: () => ReturnType;
      /**
       * Toggle bold (400 <-> 700)
       */
      toggleBold: () => ReturnType;
    };
  }
}

export const FontWeightMark = Mark.create<FontWeightOptions>({
  name: 'fontWeight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontWeight: {
        default: null,
        parseHTML: element => {
          const fontWeight = element.style.fontWeight;
          if (fontWeight) {
            // Handle both numeric (400, 700) and named (normal, bold) values
            if (fontWeight === 'normal') return 400;
            if (fontWeight === 'bold') return 700;
            const numericWeight = parseInt(fontWeight);
            return numericWeight && !isNaN(numericWeight) ? numericWeight : null;
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.fontWeight || typeof attributes.fontWeight !== 'number') {
            return {};
          }
          return {
            style: `font-weight: ${attributes.fontWeight}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-weight"]',
        getAttrs: element => {
          const fontWeight = (element as HTMLElement).style.fontWeight;
          if (fontWeight) {
            // Parse numeric and named font weights
            if (fontWeight === 'normal') return { fontWeight: 400 };
            if (fontWeight === 'bold') return { fontWeight: 700 };
            const numericWeight = parseInt(fontWeight);
            return numericWeight && !isNaN(numericWeight) ? { fontWeight: numericWeight } : false;
          }
          return false;
        },
      },
      // Also parse standard HTML bold tags
      {
        tag: 'strong',
        getAttrs: () => ({ fontWeight: 700 }),
      },
      {
        tag: 'b',
        getAttrs: () => ({ fontWeight: 700 }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontWeight:
        (fontWeight: number) =>
        ({ commands }) => {
          // Validate font weight against allowed values
          const validWeights = FONT_WEIGHTS.map(w => w.value);
          const numericWeight = parseInt(String(fontWeight));
          
          if (isNaN(numericWeight) || !validWeights.includes(numericWeight)) {
            console.warn(`Invalid font weight: ${fontWeight}. Valid weights: ${validWeights.join(', ')}`);
            return false;
          }

          return commands.setMark(this.name, { fontWeight: numericWeight });
        },
      unsetFontWeight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      toggleBold:
        () =>
        ({ commands, editor }) => {
          const currentWeight = editor.getAttributes(this.name).fontWeight;
          const isBold = currentWeight === 700;
          
          if (isBold) {
            return commands.unsetMark(this.name);
          } else {
            return commands.setMark(this.name, { fontWeight: 700 });
          }
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Standard bold toggle
      'Mod-b': () => this.editor.commands.toggleBold(),
      'Mod-B': () => this.editor.commands.toggleBold(),
    };
  },
});

export default FontWeightMark;