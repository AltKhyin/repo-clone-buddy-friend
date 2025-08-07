// ABOUTME: Enhanced Tiptap editor hook with configurable field types for unified text editing standardization

import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef } from 'react';
import { debounce } from 'lodash-es';
import { BasicTableExtension, createEmptyTable } from '@/components/editor/extensions/BasicTable';
// REMOVED: PollExtension import - polls moved to community-only features

// Field type configurations for different text editing needs
export type TiptapFieldType = 'rich-text' | 'multi-line' | 'simple-text';

interface TiptapFieldConfig {
  /** Field type determining available features */
  fieldType?: TiptapFieldType;
  /** Whether to enable rich formatting (bold, italic, etc.) */
  enableFormatting?: boolean;
  /** Whether to enable lists and block elements */
  enableBlocks?: boolean;
  /** Whether to enable heading levels */
  enableHeadings?: boolean;
  /** Whether to show formatting on toolbar integration */
  showInToolbar?: boolean;
}

interface UseTiptapEditorProps {
  nodeId: string;
  initialContent: string;
  placeholder?: string;
  onUpdate: (nodeId: string, content: string) => void;
  editable?: boolean;
  /** Field configuration for different text editing types */
  fieldConfig?: TiptapFieldConfig;
  /** Custom debounce delay in milliseconds (default: 1000ms) */
  debounceMs?: number;
}

// Default field configurations for different types
const DEFAULT_FIELD_CONFIGS: Record<TiptapFieldType, TiptapFieldConfig> = {
  'rich-text': {
    fieldType: 'rich-text',
    enableFormatting: true,
    enableBlocks: true,
    enableHeadings: true,
    showInToolbar: true,
  },
  'multi-line': {
    fieldType: 'multi-line',
    enableFormatting: false,
    enableBlocks: false,
    enableHeadings: false,
    showInToolbar: false,
  },
  'simple-text': {
    fieldType: 'simple-text',
    enableFormatting: false,
    enableBlocks: false,
    enableHeadings: false,
    showInToolbar: false,
  },
};

export const useTiptapEditor = ({
  nodeId,
  initialContent,
  placeholder = 'Type something...',
  onUpdate,
  editable = true,
  fieldConfig,
  debounceMs = 1000,
}: UseTiptapEditorProps) => {
  // Determine field configuration with defaults
  const resolvedConfig = fieldConfig?.fieldType
    ? { ...DEFAULT_FIELD_CONFIGS[fieldConfig.fieldType], ...fieldConfig }
    : { ...DEFAULT_FIELD_CONFIGS['rich-text'], ...fieldConfig };

  // Create debounced update function with configurable delay
  const debouncedUpdate = useCallback(
    debounce((nodeId: string, content: string) => {
      onUpdate(nodeId, content);
    }, debounceMs),
    [onUpdate, debounceMs]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Conditionally enable/disable features based on field type
        heading: resolvedConfig.enableHeadings
          ? {
              levels: [1, 2, 3, 4, 5, 6],
            }
          : false,
        bold: resolvedConfig.enableFormatting,
        italic: resolvedConfig.enableFormatting,
        strike: resolvedConfig.enableFormatting,
        code: resolvedConfig.enableFormatting,
        bulletList: resolvedConfig.enableBlocks
          ? {
              keepMarks: true,
              keepAttributes: false,
            }
          : false,
        orderedList: resolvedConfig.enableBlocks
          ? {
              keepMarks: true,
              keepAttributes: false,
            }
          : false,
        blockquote: resolvedConfig.enableBlocks,
        codeBlock: resolvedConfig.enableBlocks,
        horizontalRule: resolvedConfig.enableBlocks,
        // Always enable basic text features
        paragraph: true,
        text: true,
        hardBreak: true,
        // Enhanced line break handling
        gapcursor: true,
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
      // Simple Table extension - Reddit-style basic tables
      BasicTableExtension.configure({
        HTMLAttributes: {
          class: 'basic-table-extension',
        },
      }),
      // REMOVED: PollExtension configuration - polls moved to community-only features
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedUpdate(nodeId, html);
    },
    // Important: Each editor instance needs to be independent
    immediatelyRender: false,
    // Enhanced editor props for better text selection and line breaks
    editorProps: {
      // Enhanced Shift+Enter handling for all field types
      handleKeyDown: (view, event) => {
        // Handle Shift+Enter for line breaks in all field types
        if (event.key === 'Enter' && event.shiftKey) {
          // Insert a hard break instead of paragraph
          const { state, dispatch } = view;
          const hardBreak = state.schema.nodes.hardBreak;
          if (hardBreak) {
            dispatch(state.tr.replaceSelectionWith(hardBreak.create()));
            return true;
          }
        }
        // For simple-text fields, prevent Enter from creating paragraphs
        if (
          resolvedConfig.fieldType === 'simple-text' &&
          event.key === 'Enter' &&
          !event.shiftKey
        ) {
          return true; // Block paragraph creation
        }
        return false; // Let Tiptap handle other keys
      },
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
      // ANTI-FLICKER: Remove height dependencies to prevent circular calculations
      attributes: {
        style: 'width: 100%; cursor: text; user-select: text; -webkit-user-select: text;',
      },
    },
  });

  // ANTI-FLICKER: Prevent content updates that can cause height oscillation
  const updateContent = useCallback(
    (newContent: string) => {
      // Only update if editor exists, content is different, and editor is not focused
      if (editor && editor.getHTML() !== newContent && !editor.isFocused) {
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

  // Basic Table extension commands  
  const insertTable = useCallback(
    (rows: number = 2, cols: number = 2) => {
      if (!editor) return;
      
      const tableData = createEmptyTable(rows, cols);
      editor.chain().focus().insertBasicTable(tableData).run();
    },
    [editor]
  );

  // REMOVED: insertPoll function - polls moved to community-only features

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
    // Field configuration info
    fieldConfig: resolvedConfig,
    // Formatting commands (conditionally available)
    toggleBold: resolvedConfig.enableFormatting ? toggleBold : undefined,
    toggleItalic: resolvedConfig.enableFormatting ? toggleItalic : undefined,
    toggleStrike: resolvedConfig.enableFormatting ? toggleStrike : undefined,
    toggleCode: resolvedConfig.enableFormatting ? toggleCode : undefined,
    toggleBulletList: resolvedConfig.enableBlocks ? toggleBulletList : undefined,
    toggleOrderedList: resolvedConfig.enableBlocks ? toggleOrderedList : undefined,
    toggleBlockquote: resolvedConfig.enableBlocks ? toggleBlockquote : undefined,
    setHeading: resolvedConfig.enableHeadings ? setHeading : undefined,
    setParagraph,
    // Rich Block extension commands (always available)
    insertTable,
    // REMOVED: insertPoll - polls moved to community-only features
    // State checks (only for enabled features)
    isActive: {
      bold: resolvedConfig.enableFormatting ? (editor?.isActive('bold') ?? false) : false,
      italic: resolvedConfig.enableFormatting ? (editor?.isActive('italic') ?? false) : false,
      strike: resolvedConfig.enableFormatting ? (editor?.isActive('strike') ?? false) : false,
      code: resolvedConfig.enableFormatting ? (editor?.isActive('code') ?? false) : false,
      bulletList: resolvedConfig.enableBlocks ? (editor?.isActive('bulletList') ?? false) : false,
      orderedList: resolvedConfig.enableBlocks ? (editor?.isActive('orderedList') ?? false) : false,
      blockquote: resolvedConfig.enableBlocks ? (editor?.isActive('blockquote') ?? false) : false,
      heading: resolvedConfig.enableHeadings
        ? (level: number) => editor?.isActive('heading', { level }) ?? false
        : () => false,
      // Basic Table extension states (always available)
      table: editor?.isActive('basicTable') ?? false,
      // REMOVED: poll state - polls moved to community-only features
    },
  };
};

export type TiptapEditorInstance = ReturnType<typeof useTiptapEditor>;
