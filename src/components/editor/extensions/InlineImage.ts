// ABOUTME: TipTap extension for inline image handling with drag & drop and paste support

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { InlineImageComponent } from './InlineImageComponent';

export interface InlineImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineImage: {
      /**
       * Add an inline image
       */
      setInlineImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        height?: number;
        placeholder?: boolean;
        objectFit?: string;
        size?: string;
      }) => ReturnType;
    };
  }
}

export const InlineImage = Node.create<InlineImageOptions>({
  name: 'inlineImage',

  addOptions() {
    return {
      inline: true,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      loading: {
        default: 'lazy',
      },
      caption: {
        default: null,
      },
      uploading: {
        default: false,
      },
      error: {
        default: null,
      },
      // Transform attributes for media controls
      objectFit: {
        default: 'contain',
        rendered: false, // Don't render to HTML, used for styling
      },
      size: {
        default: 'medium',
        rendered: false,
      },
      // Placeholder state
      placeholder: {
        default: false,
        parseHTML: element => element.getAttribute('data-placeholder') === 'true',
        renderHTML: attributes => ({ 'data-placeholder': attributes.placeholder.toString() }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `img[src]:not([src^="data:"]):not([src^="blob:"])`,
      },
      {
        tag: 'img[src^="data:"]',
        getAttrs: () => (this.options.allowBase64 ? {} : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineImageComponent);
  },

  addCommands() {
    return {
      setInlineImage:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [];
  },
});
