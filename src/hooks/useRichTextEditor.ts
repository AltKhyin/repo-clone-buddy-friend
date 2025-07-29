// ABOUTME: Enhanced TipTap editor hook for Rich Block with Reddit-like features and advanced formatting

import { useEditor, Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Mention from '@tiptap/extension-mention';
import { useCallback, useRef, useState, useEffect } from 'react';
import { debounce } from 'lodash-es';
import { useEditorStore } from '@/store/editorStore';
import { ContentSelectionType } from '@/types/editor';
import { InlineImage } from '@/components/editor/extensions/InlineImage';
import { VideoEmbed, VideoUtils } from '@/components/editor/extensions/VideoEmbed';
import { TableExtension } from '@/components/editor/extensions/Table';
import { useMediaDropHandler } from './useMediaDropHandler';

// Rich text editor configuration specifically for Rich Block
interface UseRichTextEditorProps {
  nodeId: string;
  initialContent: string | any; // Can be HTML string or TipTap JSON
  placeholder?: string;
  onUpdate: (nodeId: string, content: string) => void;
  editable?: boolean;
  debounceMs?: number;
}

// Suggestion configuration for mentions
const mentionSuggestion = {
  items: ({ query }: { query: string }) => {
    // Basic mention suggestions - can be extended with user data
    const suggestions = [
      { id: '1', label: 'Editor' },
      { id: '2', label: 'Admin' },
      { id: '3', label: 'Author' },
      { id: '4', label: 'Reviewer' },
    ];

    return suggestions
      .filter(item => item.label.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
  },
  render: () => {
    let component: any;

    return {
      onStart: (props: any) => {
        component = {
          ...props,
          element: document.createElement('div'),
        };
      },
      onUpdate: (props: any) => {
        component = { ...component, ...props };
      },
      onKeyDown: (props: any) => {
        if (props.event.key === 'Escape') {
          return true;
        }
        return false;
      },
      onExit: () => {
        // Cleanup if needed
      },
    };
  },
};

export const useRichTextEditor = ({
  nodeId,
  initialContent,
  placeholder = 'Start typing...',
  onUpdate,
  editable = true,
  debounceMs = 1000,
}: UseRichTextEditorProps) => {
  // Upload state for media handling
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean;
    progress: number;
    error: string | null;
  }>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  // Create debounced update function
  const debouncedUpdate = useRef(
    debounce((nodeId: string, content: string) => {
      onUpdate(nodeId, content);
    }, debounceMs)
  ).current;

  // Get editor store actions for selection management
  const { setContentSelection } = useEditorStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Core text features
        paragraph: true,
        text: true,
        hardBreak: true,
        gapcursor: true,

        // All formatting features always enabled
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },

        // Basic formatting (always enabled)
        bold: true,
        italic: true,
        strike: true,
        code: true,

        // List features (always enabled)
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        listItem: true,

        // Block features (always enabled)
        blockquote: true,
        codeBlock: true,
        horizontalRule: true,

        // History
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
      }),

      // Placeholder
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          return placeholder;
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),

      // Text highlighting (always enabled)
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800',
        },
      }),

      // Links (always enabled)
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        protocols: ['http', 'https', 'mailto'],
        autolink: true,
        linkOnPaste: true,
      }),

      // Task lists (always enabled)
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item flex items-start gap-2',
        },
      }),

      // Mentions for @user functionality (always enabled)
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm',
        },
        suggestion: mentionSuggestion,
      }),

      // Inline images (always enabled)
      InlineImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'inline-image rounded',
        },
      }),

      // Video embeds (always enabled)
      VideoEmbed.configure({
        inline: false,
        allowedProviders: ['youtube', 'vimeo', 'direct'],
        width: 560,
        height: 315,
        HTMLAttributes: {
          class: 'video-embed rounded-lg',
        },
      }),

      // Tables (always enabled)
      TableExtension.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table-extension',
        },
      }),
    ],

    content: initialContent, // Can be HTML string or TipTap JSON object
    editable,

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedUpdate(nodeId, html);
    },
    onSelectionUpdate: ({ editor }) => {
      // Handle media node selection for Inspector integration
      const { state } = editor;
      const { selection } = state;

      // Check if we have a node selection (clicking on media elements)
      if (selection instanceof NodeSelection) {
        const selectedNode = selection.node;
        const nodeType = selectedNode.type.name;

        // Handle inline image selection
        if (nodeType === 'inlineImage') {
          setContentSelection({
            type: ContentSelectionType.INLINE_IMAGE,
            blockId: nodeId,
            data: {
              mediaNode: {
                nodeType: 'inlineImage',
                position: selection.from,
                attrs: {
                  src: selectedNode.attrs.src,
                  alt: selectedNode.attrs.alt,
                  width: selectedNode.attrs.width,
                  height: selectedNode.attrs.height,
                  objectFit: selectedNode.attrs.objectFit || 'contain',
                  size: selectedNode.attrs.size || 'medium',
                  caption: selectedNode.attrs.caption,
                  loading: selectedNode.attrs.loading,
                  placeholder: selectedNode.attrs.placeholder, // CRITICAL: Include placeholder state
                  error: selectedNode.attrs.error,
                },
                // Provide direct update function
                updateAttributes: (attributes: Record<string, any>) => {
                  const transaction = state.tr.setNodeMarkup(selection.from, null, {
                    ...selectedNode.attrs,
                    ...attributes,
                  });
                  editor.view.dispatch(transaction);
                },
              },
            },
          });
          return;
        }

        // Handle video embed selection
        if (nodeType === 'videoEmbed') {
          setContentSelection({
            type: ContentSelectionType.VIDEO_EMBED,
            blockId: nodeId,
            data: {
              mediaNode: {
                nodeType: 'videoEmbed',
                position: selection.from,
                attrs: {
                  src: selectedNode.attrs.src,
                  width: selectedNode.attrs.width,
                  height: selectedNode.attrs.height,
                  objectFit: selectedNode.attrs.objectFit || 'contain',
                  size: selectedNode.attrs.size || 'medium',
                  provider: selectedNode.attrs.provider,
                  videoId: selectedNode.attrs.videoId,
                  thumbnail: selectedNode.attrs.thumbnail,
                  placeholder: selectedNode.attrs.placeholder, // CRITICAL: Include placeholder state
                  error: selectedNode.attrs.error,
                  allowFullscreen: selectedNode.attrs.allowFullscreen,
                },
                // Provide direct update function
                updateAttributes: (attributes: Record<string, any>) => {
                  const transaction = state.tr.setNodeMarkup(selection.from, null, {
                    ...selectedNode.attrs,
                    ...attributes,
                  });
                  editor.view.dispatch(transaction);
                },
              },
            },
          });
          return;
        }
      }

      // Clear media selection if not selecting a media node
      // Only clear if the current selection was a media type
      const currentSelection = useEditorStore.getState().selectionState.contentSelection;
      if (
        currentSelection &&
        (currentSelection.type === ContentSelectionType.INLINE_IMAGE ||
          currentSelection.type === ContentSelectionType.VIDEO_EMBED) &&
        currentSelection.blockId === nodeId
      ) {
        setContentSelection(null);
      }
    },

    // Enhanced editor props for Reddit-like experience
    editorProps: {
      // Enhanced keyboard shortcuts with markdown detection
      handleKeyDown: (view, event) => {
        const { state, dispatch } = view;

        // Shift+Enter for hard breaks
        if (event.key === 'Enter' && event.shiftKey) {
          const hardBreak = state.schema.nodes.hardBreak;
          if (hardBreak) {
            dispatch(state.tr.replaceSelectionWith(hardBreak.create()));
            return true;
          }
        }

        // Space key: Check for markdown shortcuts
        if (event.key === ' ') {
          const { selection } = state;
          const { $from } = selection;
          const textBefore = $from.parent.textBetween(
            Math.max(0, $from.parentOffset - 10),
            $from.parentOffset,
            null,
            ' '
          );

          // Heading shortcuts (always enabled)
          if (textBefore.endsWith('# ')) {
            dispatch(state.tr.delete($from.pos - 2, $from.pos));
            view.dispatch(
              view.state.tr.setBlockType($from.pos, $from.pos, state.schema.nodes.heading, {
                level: 1,
              })
            );
            return true;
          }
          if (textBefore.endsWith('## ')) {
            dispatch(state.tr.delete($from.pos - 3, $from.pos));
            view.dispatch(
              view.state.tr.setBlockType($from.pos, $from.pos, state.schema.nodes.heading, {
                level: 2,
              })
            );
            return true;
          }
          if (textBefore.endsWith('### ')) {
            dispatch(state.tr.delete($from.pos - 4, $from.pos));
            view.dispatch(
              view.state.tr.setBlockType($from.pos, $from.pos, state.schema.nodes.heading, {
                level: 3,
              })
            );
            return true;
          }

          // List shortcuts (always enabled)
          if (textBefore.endsWith('- ')) {
            dispatch(state.tr.delete($from.pos - 2, $from.pos));
            view.dispatch(view.state.tr.wrapIn(state.schema.nodes.bulletList));
            return true;
          }
          if (textBefore.match(/\d+\. $/)) {
            const match = textBefore.match(/(\d+)\. $/);
            if (match) {
              dispatch(state.tr.delete($from.pos - match[0].length, $from.pos));
              view.dispatch(view.state.tr.wrapIn(state.schema.nodes.orderedList));
              return true;
            }
          }
          // Task list shortcut
          if (textBefore.endsWith('- [ ] ')) {
            dispatch(state.tr.delete($from.pos - 6, $from.pos));
            view.dispatch(view.state.tr.wrapIn(state.schema.nodes.taskList));
            return true;
          }

          // Blockquote shortcut
          if (textBefore.endsWith('> ')) {
            dispatch(state.tr.delete($from.pos - 2, $from.pos));
            view.dispatch(view.state.tr.wrapIn(state.schema.nodes.blockquote));
            return true;
          }

          // Code block shortcut
          if (textBefore.endsWith('``` ')) {
            dispatch(state.tr.delete($from.pos - 4, $from.pos));
            view.dispatch(
              view.state.tr.setBlockType($from.pos, $from.pos, state.schema.nodes.codeBlock)
            );
            return true;
          }
        }

        // Ctrl/Cmd+Enter for finishing editing (can be used for save)
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          // Could trigger save or other actions
          return true;
        }

        // Escape to blur editor
        if (event.key === 'Escape') {
          view.dom.blur();
          return true;
        }

        return false;
      },

      // Handle paste for automatic link detection
      handlePaste: (view, event, slice) => {
        const text = event.clipboardData?.getData('text/plain');

        // Auto-link detection for URLs (always enabled)
        if (text) {
          const urlRegex = /^https?:\/\/[^\s]+$/;
          if (urlRegex.test(text.trim())) {
            const { state, dispatch } = view;
            const { from, to } = state.selection;

            const linkMark = state.schema.marks.link.create({ href: text.trim() });
            const transaction = state.tr
              .insertText(text.trim(), from, to)
              .addMark(from, from + text.trim().length, linkMark);

            dispatch(transaction);
            return true;
          }
        }

        return false;
      },

      // Enhanced styling for editor
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `
          min-height: 100px;
          padding: 12px;
          line-height: 1.6;
          color: inherit;
          font-family: inherit;
        `,
      },
    },

    // Don't render immediately to prevent SSR issues
    immediatelyRender: false,
  });

  // Media drop handler for drag & drop and paste functionality
  const mediaDropHandler = useMediaDropHandler({
    editor,
    onUploadStart: () => setUploadState(prev => ({ ...prev, isUploading: true, error: null })),
    onUploadProgress: progress => setUploadState(prev => ({ ...prev, progress })),
    onUploadComplete: url => setUploadState({ isUploading: false, progress: 100, error: null }),
    onUploadError: error => setUploadState({ isUploading: false, progress: 0, error }),
  });

  // Enhanced utility functions for Reddit-like features
  const insertMention = useCallback(
    (username: string) => {
      if (!editor) return;

      editor.chain().focus().insertContent(`@${username} `).run();
    },
    [editor]
  );

  const insertLink = useCallback(
    (url: string, text?: string) => {
      if (!editor) return;

      editor
        .chain()
        .focus()
        .setLink({ href: url })
        .insertContent(text || url)
        .run();
    },
    [editor]
  );

  const insertImage = useCallback(
    (src: string, alt?: string, caption?: string) => {
      if (!editor) return;

      editor.commands.setInlineImage({
        src,
        alt: alt || 'Image',
        caption,
      });
    },
    [editor]
  );

  const insertImageFromFile = useCallback(
    (file: File) => {
      if (!editor) return;

      mediaDropHandler.insertFile(file);
    },
    [editor, mediaDropHandler]
  );

  const insertVideo = useCallback(
    (url: string, title?: string) => {
      if (!editor) return;

      const videoData = VideoUtils.parseVideoUrl(url);
      if (videoData) {
        editor.commands.setVideoEmbed({
          ...videoData,
          title: title || videoData.title,
        });
      }
    },
    [editor]
  );

  const insertTable = useCallback(
    (rows: number = 3, cols: number = 3, withHeaders: boolean = true) => {
      if (!editor) return;

      editor.commands.insertTable({
        rows,
        cols,
        withHeaderRow: withHeaders,
      });
    },
    [editor]
  );

  // REMOVED: insertPoll function - polls moved to community-only features

  const toggleTaskList = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().toggleTaskList().run();
  }, [editor]);

  const insertCodeBlock = useCallback(
    (language?: string) => {
      if (!editor) return;

      editor.chain().focus().setCodeBlock({ language }).run();
    },
    [editor]
  );

  const toggleHighlight = useCallback(
    (color?: string) => {
      if (!editor) return;

      if (color) {
        editor.chain().focus().setHighlight({ color }).run();
      } else {
        editor.chain().focus().toggleHighlight().run();
      }
    },
    [editor]
  );

  // Reddit-style markdown shortcuts
  const insertMarkdownShortcut = useCallback(
    (type: 'bold' | 'italic' | 'code' | 'strikethrough') => {
      if (!editor) return;

      const shortcuts = {
        bold: () => editor.chain().focus().toggleBold().run(),
        italic: () => editor.chain().focus().toggleItalic().run(),
        code: () => editor.chain().focus().toggleCode().run(),
        strikethrough: () => editor.chain().focus().toggleStrike().run(),
      };

      shortcuts[type]();
    },
    [editor]
  );

  // Content analysis
  const getContentStats = useCallback(() => {
    if (!editor) return { characters: 0, words: 0, paragraphs: 0 };

    const text = editor.getText();
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const paragraphs =
      editor.getJSON().content?.filter(node => node.type === 'paragraph').length || 0;

    return { characters, words, paragraphs };
  }, [editor]);

  return {
    editor,

    // Status
    isFocused: editor?.isFocused ?? false,
    isEmpty: editor?.isEmpty ?? true,

    // Content utilities
    getContentStats,

    // Upload state
    uploadState,

    // Reddit-like features
    insertMention,
    insertLink,
    insertImage,
    insertImageFromFile,
    insertVideo,
    insertTable,
    // REMOVED: insertPoll - polls moved to community-only features
    toggleTaskList,
    insertCodeBlock,
    toggleHighlight,
    insertMarkdownShortcut,

    // Basic formatting
    toggleBold: () => editor?.chain().focus().toggleBold().run(),
    toggleItalic: () => editor?.chain().focus().toggleItalic().run(),
    toggleStrike: () => editor?.chain().focus().toggleStrike().run(),
    toggleCode: () => editor?.chain().focus().toggleCode().run(),

    // Block formatting (always enabled)
    toggleBulletList: () => editor?.chain().focus().toggleBulletList().run(),
    toggleOrderedList: () => editor?.chain().focus().toggleOrderedList().run(),
    toggleBlockquote: () => editor?.chain().focus().toggleBlockquote().run(),

    // Headings (always enabled)
    setHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    setParagraph: () => editor?.chain().focus().setParagraph().run(),

    // State checks
    isActive: {
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      strike: editor?.isActive('strike') ?? false,
      code: editor?.isActive('code') ?? false,
      highlight: editor?.isActive('highlight') ?? false,
      link: editor?.isActive('link') ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
      taskList: editor?.isActive('taskList') ?? false,
      blockquote: editor?.isActive('blockquote') ?? false,
      codeBlock: editor?.isActive('codeBlock') ?? false,
      heading: (level: number) => editor?.isActive('heading', { level }) ?? false,
      table: editor?.isActive('customTable') ?? false,
      // REMOVED: poll state - polls moved to community-only features
    },
  };
};

export type RichTextEditorInstance = ReturnType<typeof useRichTextEditor>;
