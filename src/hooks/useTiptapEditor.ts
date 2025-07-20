// ABOUTME: Custom hook for managing independent Tiptap editor instances for editor blocks

import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef } from 'react';
import { debounce } from 'lodash-es';

interface UseTiptapEditorProps {
  nodeId: string;
  initialContent: string;
  placeholder?: string;
  onUpdate: (nodeId: string, content: string) => void;
  editable?: boolean;
}

export const useTiptapEditor = ({
  nodeId,
  initialContent,
  placeholder = 'Type something...',
  onUpdate,
  editable = true,
}: UseTiptapEditorProps) => {
  // Create debounced update function to prevent excessive store updates
  const debouncedUpdate = useRef(
    debounce((nodeId: string, content: string) => {
      onUpdate(nodeId, content);
    }, 1000)
  ).current;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features that we'll handle separately
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedUpdate(nodeId, html);
    },
    // Important: Each editor instance needs to be independent
    immediatelyRender: false,
    // Enhanced editor props for better text selection
    editorProps: {
      // Enable standard text selection behaviors
      handleDoubleClick: () => {
        // Return false to let browser handle double-click word selection
        return false;
      },
      handleTripleClick: () => {
        // Return false to let browser handle triple-click line/paragraph selection
        return false;
      },
      // Improve general click handling
      handleClick: (view, pos, event) => {
        // Let default Tiptap handling proceed
        return false;
      },
      // Ensure proper text selection styling
      attributes: {
        style:
          'width: 100%; height: 100%; min-height: 100%; cursor: text; user-select: text; -webkit-user-select: text;',
      },
    },
  });

  // Force content update when initialContent changes (for external updates)
  const updateContent = useCallback(
    (newContent: string) => {
      if (editor && editor.getHTML() !== newContent) {
        editor.commands.setContent(newContent, false);
      }
    },
    [editor]
  );

  // Utility functions for text formatting
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const toggleCode = useCallback(() => {
    editor?.chain().focus().toggleCode().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const setHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  const setParagraph = useCallback(() => {
    editor?.chain().focus().setParagraph().run();
  }, [editor]);

  // Focus the editor
  const focusEditor = useCallback(() => {
    editor?.chain().focus().run();
  }, [editor]);

  // Check if editor has focus
  const isFocused = editor?.isFocused ?? false;

  return {
    editor,
    updateContent,
    focusEditor,
    isFocused,
    // Formatting commands
    toggleBold,
    toggleItalic,
    toggleStrike,
    toggleCode,
    toggleBulletList,
    toggleOrderedList,
    toggleBlockquote,
    setHeading,
    setParagraph,
    // State checks
    isActive: {
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      strike: editor?.isActive('strike') ?? false,
      code: editor?.isActive('code') ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
      blockquote: editor?.isActive('blockquote') ?? false,
      heading: (level: number) => editor?.isActive('heading', { level }) ?? false,
    },
  };
};

export type TiptapEditorInstance = ReturnType<typeof useTiptapEditor>;
