// ABOUTME: TipTap mark extension for text transform (uppercase, lowercase, capitalize) with validation

import { Mark, mergeAttributes } from '@tiptap/core';
import { TEXT_TRANSFORMS } from '../../shared/typography-system';

export interface TextTransformOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textTransform: {
      /**
       * Set the text transform (uppercase, lowercase, capitalize, none)
       */
      setTextTransform: (transform: string) => ReturnType;
      /**
       * Unset the text transform
       */
      unsetTextTransform: () => ReturnType;
      /**
       * Toggle uppercase transform
       */
      toggleUppercase: () => ReturnType;
      /**
       * Toggle capitalize transform
       */
      toggleCapitalize: () => ReturnType;
    };
  }
}

export const TextTransformMark = Mark.create<TextTransformOptions>({
  name: 'textTransform',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      textTransform: {
        default: null,
        parseHTML: element => {
          const textTransform = element.style.textTransform;
          return textTransform && textTransform !== 'none' ? textTransform : null;
        },
        renderHTML: attributes => {
          if (!attributes.textTransform || attributes.textTransform === 'none') {
            return {};
          }
          return {
            style: `text-transform: ${attributes.textTransform}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="text-transform"]',
        getAttrs: element => {
          const textTransform = (element as HTMLElement).style.textTransform;
          return textTransform && textTransform !== 'none' ? { textTransform } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextTransform:
        (transform: string) =>
        ({ commands }) => {
          // Validate transform against allowed values
          const validTransforms = TEXT_TRANSFORMS.map(t => t.value);
          const trimmedTransform = transform.trim().toLowerCase();
          
          if (!validTransforms.includes(trimmedTransform)) {
            console.warn(`Invalid text transform: ${transform}. Valid transforms: ${validTransforms.join(', ')}`);
            return false;
          }

          // If setting to 'none', just unset the mark
          if (trimmedTransform === 'none') {
            return commands.unsetMark(this.name);
          }

          return commands.setMark(this.name, { textTransform: trimmedTransform });
        },
      unsetTextTransform:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      toggleUppercase:
        () =>
        ({ commands, editor }) => {
          const currentTransform = editor.getAttributes(this.name).textTransform;
          const isUppercase = currentTransform === 'uppercase';
          
          if (isUppercase) {
            return commands.unsetMark(this.name);
          } else {
            return commands.setMark(this.name, { textTransform: 'uppercase' });
          }
        },
      toggleCapitalize:
        () =>
        ({ commands, editor }) => {
          const currentTransform = editor.getAttributes(this.name).textTransform;
          const isCapitalize = currentTransform === 'capitalize';
          
          if (isCapitalize) {
            return commands.unsetMark(this.name);
          } else {
            return commands.setMark(this.name, { textTransform: 'capitalize' });
          }
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Optional shortcuts for common transforms
      'Mod-Shift-u': () => this.editor.commands.toggleUppercase(),
      'Mod-Shift-c': () => this.editor.commands.toggleCapitalize(),
    };
  },
});

export default TextTransformMark;