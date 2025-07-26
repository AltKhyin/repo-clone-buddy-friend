// ABOUTME: Unified TipTap editor component with comprehensive extensions and safe-zone interaction

import React, { useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/CustomThemeProvider';
import { TableExtension } from '@/components/editor/extensions/Table';
import { PollExtension } from '@/components/editor/extensions/Poll';

interface UnifiedTipTapEditorProps {
  blockId: string;
  content: JSONContent;
  onContentChange: (content: JSONContent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export const UnifiedTipTapEditor: React.FC<UnifiedTipTapEditorProps> = ({
  blockId,
  content,
  onContentChange,
  onFocus,
  onBlur,
  placeholder = 'Start typing...',
  className,
  editable = true,
}) => {
  // Global theme integration
  const { theme: globalTheme } = useTheme();

  // ============================================================================
  // DEBOUNCED CONTENT UPDATE
  // ============================================================================

  const debouncedContentUpdate = useMemo(
    () =>
      debounce((newContent: JSONContent) => {
        onContentChange(newContent);
      }, 300),
    [onContentChange]
  );

  // ============================================================================
  // TIPTAP EDITOR CONFIGURATION
  // ============================================================================

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // Configure built-in extensions
          // Keep document node - it's required for TipTap schema
          paragraph: {
            HTMLAttributes: {
              class: 'editor-paragraph',
            },
          },
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
            HTMLAttributes: {
              class: 'editor-heading',
            },
          },
          blockquote: {
            HTMLAttributes: {
              class: 'editor-blockquote',
            },
          },
          codeBlock: {
            HTMLAttributes: {
              class: 'editor-code-block',
            },
          },
          bulletList: {
            HTMLAttributes: {
              class: 'editor-bullet-list',
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: 'editor-ordered-list',
            },
          },
          listItem: {
            HTMLAttributes: {
              class: 'editor-list-item',
            },
          },
          horizontalRule: {
            HTMLAttributes: {
              class: 'editor-horizontal-rule',
            },
          },
          // Text formatting
          bold: {
            HTMLAttributes: {
              class: 'editor-bold',
            },
          },
          italic: {
            HTMLAttributes: {
              class: 'editor-italic',
            },
          },
          strike: {
            HTMLAttributes: {
              class: 'editor-strike',
            },
          },
          code: {
            HTMLAttributes: {
              class: 'editor-inline-code',
            },
          },
        }),
        Placeholder.configure({
          placeholder: placeholder,
          showOnlyWhenEditable: true,
          showOnlyCurrent: false,
          includeChildren: true,
        }),
        // Rich Block extensions - always enabled
        TableExtension.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'table-extension',
          },
        }),
        PollExtension.configure({
          allowAnonymousVoting: true,
          enableVoteTracking: true,
          HTMLAttributes: {
            class: 'poll-extension',
          },
        }),
      ],
      content: content,
      editable: editable,
      autofocus: false, // We handle focus manually

      // Editor event handlers
      onUpdate: ({ editor, transaction }) => {
        // Debounced content update to store
        const newContent = editor.getJSON();
        debouncedContentUpdate(newContent);
      },

      onCreate: ({ editor }) => {
        // Editor initialized
        console.log('Editor created for block:', blockId);
      },

      onFocus: ({ editor, event }) => {
        onFocus?.();
      },

      onBlur: ({ editor, event }) => {
        onBlur?.();
      },

      onSelectionUpdate: ({ editor, transaction }) => {
        // Handle selection changes for contextual toolbar
        // This would update the store with current selection state
        const selection = editor.state.selection;
        // TODO: Update contextual toolbar features based on selection
      },

      // Editor options
      editorProps: {
        attributes: {
          class: cn(
            'editor-content',
            'prose',
            'prose-sm',
            'max-w-none',
            'focus:outline-none',
            'min-h-[40px]',
            'cursor-text',
            'transition-colors'
          ),
          'data-block-id': blockId,
          // Uses global CSS custom properties that automatically respond to theme changes
          style: `
          --tw-prose-body: hsl(var(--foreground));
          --tw-prose-headings: hsl(var(--foreground));
          --tw-prose-links: hsl(var(--primary));
          --tw-prose-bold: hsl(var(--foreground));
          --tw-prose-code: hsl(var(--muted-foreground));
          --tw-prose-pre-bg: hsl(var(--muted));
          --tw-prose-quotes: hsl(var(--muted-foreground));
          color: hsl(var(--foreground));
        `,
        },

        // Handle paste events
        handlePaste(view, event, slice) {
          // Custom paste handling if needed
          return false; // Let default paste handler work
        },

        // Handle drop events
        handleDrop(view, event, slice, moved) {
          // Custom drop handling if needed
          return false; // Let default drop handler work
        },

        // Handle key events
        handleKeyDown(view, event) {
          // Handle editor-specific shortcuts

          // Prevent certain keys from bubbling up to block container
          if (event.key === 'Delete' || event.key === 'Backspace') {
            // Only stop propagation if there's content to delete
            const { state } = view;
            const { selection } = state;

            if (!selection.empty || state.doc.textContent.length > 0) {
              event.stopPropagation();
            }
          }

          // Handle Tab key for indentation
          if (event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();

            if (event.shiftKey) {
              // Shift+Tab: Outdent
              return view.dispatch(
                view.state.tr.setSelection(view.state.selection).scrollIntoView()
              );
            } else {
              // Tab: Indent (insert 2 spaces for now)
              return view.dispatch(view.state.tr.insertText('  ').scrollIntoView());
            }
          }

          // Handle Enter key
          if (event.key === 'Enter') {
            // Let TipTap handle Enter normally
            return false;
          }

          // Handle Escape key
          if (event.key === 'Escape') {
            // Blur the editor and focus the block container
            view.dom.blur();
            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          return false;
        },
      },
    },
    [blockId, content, placeholder, editable, onFocus, onBlur, debouncedContentUpdate]
  );

  // ============================================================================
  // CONTENT SYNC
  // ============================================================================

  // Update editor content when prop changes (external updates)
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // ============================================================================
  // EDITOR COMMANDS (exposed via imperative handle if needed)
  // ============================================================================

  const getEditorCommands = useCallback(() => {
    if (!editor) return null;

    return {
      // Text formatting
      toggleBold: () => editor.chain().focus().toggleBold().run(),
      toggleItalic: () => editor.chain().focus().toggleItalic().run(),
      toggleStrike: () => editor.chain().focus().toggleStrike().run(),
      toggleCode: () => editor.chain().focus().toggleCode().run(),

      // Block formatting
      setParagraph: () => editor.chain().focus().setParagraph().run(),
      setHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) =>
        editor.chain().focus().toggleHeading({ level }).run(),
      setBlockquote: () => editor.chain().focus().toggleBlockquote().run(),
      setCodeBlock: () => editor.chain().focus().toggleCodeBlock().run(),

      // Lists
      toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
      toggleOrderedList: () => editor.chain().focus().toggleOrderedList().run(),

      // Other commands
      setHorizontalRule: () => editor.chain().focus().setHorizontalRule().run(),
      clearFormatting: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),

      // Rich Block extensions
      insertTable: (rows: number = 3, cols: number = 3, withHeaders: boolean = true) =>
        editor
          .chain()
          .focus()
          .insertTable({
            rows,
            cols,
            withHeaderRow: withHeaders,
          })
          .run(),
      insertPoll: (pollData?: any) => {
        const defaultPollData = {
          pollId: `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          question: pollData?.question || 'What is your opinion?',
          options: pollData?.options || [
            { id: `option-1-${Date.now()}`, text: 'Option 1', votes: 0 },
            { id: `option-2-${Date.now()}`, text: 'Option 2', votes: 0 },
          ],
          settings: {
            allowMultiple: pollData?.allowMultiple || false,
            showResults: pollData?.showResults !== false,
            allowAnonymous: pollData?.allowAnonymous !== false,
            requireLogin: pollData?.requireLogin || false,
          },
          metadata: {
            totalVotes: 0,
            uniqueVoters: 0,
            createdAt: new Date().toISOString(),
          },
          styling: {
            questionFontSize: 18,
            questionFontWeight: 600,
            optionFontSize: 16,
            optionPadding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            backgroundColor: 'transparent',
            selectedColor: '#3b82f6',
            resultBarColor: '#60a5fa',
            textAlign: 'left',
            compact: false,
          },
        };

        return editor.chain().focus().insertPoll(defaultPollData).run();
      },

      // Content manipulation
      insertContent: (content: string | JSONContent) =>
        editor.chain().focus().insertContent(content).run(),
      setContent: (content: JSONContent) => editor.commands.setContent(content),
      getContent: () => editor.getJSON(),
      getHTML: () => editor.getHTML(),

      // Selection
      selectAll: () => editor.commands.selectAll(),
      focus: () => editor.commands.focus(),
      blur: () => editor.commands.blur(),
    };
  }, [editor]);

  // Store commands in a ref so parent components can access them if needed
  React.useImperativeHandle(
    React.createRef(),
    () => ({
      getCommands: getEditorCommands,
      getEditor: () => editor,
    }),
    [getEditorCommands, editor]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!editor) {
    return (
      <div
        className={cn(
          'editor-loading',
          'flex items-center justify-center',
          'min-h-[40px]',
          'text-gray-400',
          className
        )}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div className={cn('unified-tiptap-editor', 'h-full', className)}>
      <EditorContent editor={editor} className="h-full" />

      {/* Character count and stats (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 right-0 text-xs text-gray-400 bg-gray-800 text-white px-1 rounded-tl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {editor.storage.characterCount?.characters() || 0} chars
        </div>
      )}
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
