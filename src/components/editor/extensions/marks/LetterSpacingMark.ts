// ABOUTME: TipTap mark extension for letter spacing with validation and constraints

import { Mark, mergeAttributes } from '@tiptap/core';

export interface LetterSpacingOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    letterSpacing: {
      /**
       * Set the letter spacing (in pixels or em)
       */
      setLetterSpacing: (spacing: string | number) => ReturnType;
      /**
       * Unset the letter spacing
       */
      unsetLetterSpacing: () => ReturnType;
      /**
       * Increase letter spacing
       */
      increaseLetterSpacing: () => ReturnType;
      /**
       * Decrease letter spacing
       */
      decreaseLetterSpacing: () => ReturnType;
    };
  }
}

export const LetterSpacingMark = Mark.create<LetterSpacingOptions>({
  name: 'letterSpacing',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      letterSpacing: {
        default: null,
        parseHTML: element => {
          const letterSpacing = element.style.letterSpacing;
          return letterSpacing && letterSpacing !== 'normal' ? letterSpacing : null;
        },
        renderHTML: attributes => {
          if (!attributes.letterSpacing) {
            return {};
          }
          return {
            style: `letter-spacing: ${attributes.letterSpacing}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="letter-spacing"]',
        getAttrs: element => {
          const letterSpacing = (element as HTMLElement).style.letterSpacing;
          return letterSpacing && letterSpacing !== 'normal' ? { letterSpacing } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setLetterSpacing:
        (spacing: string | number) =>
        ({ commands }) => {
          // Handle different input formats
          let spacingValue: string;
          
          if (typeof spacing === 'number') {
            // Constrain numeric values (-5px to 20px)
            const constrainedSpacing = Math.max(-5, Math.min(20, spacing));
            spacingValue = `${constrainedSpacing}px`;
          } else if (typeof spacing === 'string') {
            const trimmedSpacing = spacing.trim();
            
            // Validate string format (should be number with unit or 'normal')
            const isValidSpacing = /^(-?\d*\.?\d+)(px|em|rem|%)?$|^normal$/.test(trimmedSpacing);
            
            if (!isValidSpacing) {
              console.warn(`Invalid letter spacing: ${spacing}`);
              return false;
            }
            
            if (trimmedSpacing === 'normal') {
              return commands.unsetMark(this.name);
            }
            
            spacingValue = trimmedSpacing;
          } else {
            console.warn(`Invalid letter spacing type: ${typeof spacing}`);
            return false;
          }

          return commands.setMark(this.name, { letterSpacing: spacingValue });
        },
      unsetLetterSpacing:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      increaseLetterSpacing:
        () =>
        ({ commands, editor }) => {
          const currentSpacing = editor.getAttributes(this.name).letterSpacing;
          let currentValue = 0;
          
          if (currentSpacing) {
            // Parse current value (assumes px units)
            const numericValue = parseFloat(currentSpacing);
            currentValue = isNaN(numericValue) ? 0 : numericValue;
          }
          
          const newValue = Math.min(20, currentValue + 0.5); // Increase by 0.5px, max 20px
          return commands.setMark(this.name, { letterSpacing: `${newValue}px` });
        },
      decreaseLetterSpacing:
        () =>
        ({ commands, editor }) => {
          const currentSpacing = editor.getAttributes(this.name).letterSpacing;
          let currentValue = 0;
          
          if (currentSpacing) {
            // Parse current value (assumes px units)
            const numericValue = parseFloat(currentSpacing);
            currentValue = isNaN(numericValue) ? 0 : numericValue;
          }
          
          const newValue = Math.max(-5, currentValue - 0.5); // Decrease by 0.5px, min -5px
          
          if (newValue === 0) {
            return commands.unsetMark(this.name); // Remove mark for default spacing
          }
          
          return commands.setMark(this.name, { letterSpacing: `${newValue}px` });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Optional shortcuts for letter spacing adjustment
      'Mod-Shift-Equal': () => this.editor.commands.increaseLetterSpacing(), // Cmd+Shift+= (plus)
      'Mod-Shift-Minus': () => this.editor.commands.decreaseLetterSpacing(),  // Cmd+Shift+-
    };
  },
});

export default LetterSpacingMark;