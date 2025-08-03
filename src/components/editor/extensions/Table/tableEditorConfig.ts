// ABOUTME: TipTap editor configuration for table cells with typography marks support

import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';

// Import our custom typography marks
import { FontFamilyMark } from '../marks/FontFamilyMark';
import { FontSizeMark } from '../marks/FontSizeMark';
import { FontWeightMark } from '../marks/FontWeightMark';
import { TextColorMark } from '../marks/TextColorMark';
import { BackgroundColorMark } from '../marks/BackgroundColorMark';
import { TextTransformMark } from '../marks/TextTransformMark';
import { LetterSpacingMark } from '../marks/LetterSpacingMark';

/**
 * Create a minimal TipTap editor configuration for table cells
 * This provides full typography support while keeping the editor lightweight
 */
export function createTableCellEditorConfig(content?: string): Editor {
  return new Editor({
    extensions: [
      // Core extensions for basic editing
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: 'table-cell-paragraph',
        },
      }),
      Text,
      
      // Basic formatting (inherited from main editor)
      Bold,
      Italic,
      
      // Typography marks for selection-based formatting
      FontFamilyMark,
      FontSizeMark,
      FontWeightMark,
      TextColorMark,
      BackgroundColorMark,
      TextTransformMark,
      LetterSpacingMark,
    ],
    content: content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'table-cell-editor prose prose-sm max-w-none focus:outline-none',
        'data-testid': 'table-cell-editor',
      },
      // Handle keyboard navigation
      handleKeyDown: (view, event) => {
        // Let parent handle Tab/Enter navigation
        if (event.key === 'Tab' || event.key === 'Enter') {
          return false; // Allow event to bubble up
        }
        return false;
      },
    },
    // Disable some features that aren't needed in table cells
    enableInputRules: false,
    enablePasteRules: false,
    // Enable content validation
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });
}

/**
 * Extract plain text from rich content for backward compatibility
 */
export function extractPlainTextFromRichContent(content: string): string {
  try {
    // Create a temporary editor to parse and extract text
    const tempEditor = createTableCellEditorConfig(content);
    const plainText = tempEditor.getText();
    tempEditor.destroy();
    return plainText || '';
  } catch (error) {
    console.warn('Failed to extract plain text from rich content:', error);
    // Fallback: strip HTML tags with a simple regex
    return content.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Convert plain text to rich content format
 */
export function convertPlainTextToRichContent(plainText: string): string {
  if (!plainText || plainText.trim() === '') {
    return '<p></p>';
  }
  
  // Escape HTML characters and wrap in paragraph
  const escapedText = plainText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    
  return `<p>${escapedText}</p>`;
}

/**
 * Validate rich content format
 */
export function isValidRichContent(content: string): boolean {
  try {
    // Create temporary editor to validate content
    const tempEditor = createTableCellEditorConfig(content);
    const isValid = tempEditor.isEmpty === false || content.includes('<p>');
    tempEditor.destroy();
    return isValid;
  } catch (error) {
    return false;
  }
}

/**
 * Default rich content for empty cells
 */
export const EMPTY_RICH_CELL_CONTENT = '<p></p>';

/**
 * Table cell editor configuration options
 */
export interface TableCellEditorOptions {
  /** Initial content for the cell */
  content?: string;
  /** Whether the cell is a header cell */
  isHeader?: boolean;
  /** Cell position for navigation */
  position?: {
    row: number;
    col: number;
  };
  /** Callback when content changes */
  onUpdate?: (content: string) => void;
  /** Callback when editor gains focus */
  onFocus?: () => void;
  /** Callback when editor loses focus */
  onBlur?: () => void;
  /** Callback for keyboard navigation */
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'enter' | 'tab') => void;
}

/**
 * Editor instance manager for table cells
 * Helps with memory management and performance optimization
 */
export class TableCellEditorManager {
  private editors = new Map<string, Editor>();
  private maxInstances = 20; // Prevent memory leaks with large tables

  /**
   * Get or create an editor instance for a cell
   */
  getEditor(cellId: string, options: TableCellEditorOptions): Editor {
    if (this.editors.has(cellId)) {
      const editor = this.editors.get(cellId)!;
      // Update content if provided
      if (options.content !== undefined) {
        editor.commands.setContent(options.content);
      }
      return editor;
    }

    // Clean up old instances if we're at the limit
    if (this.editors.size >= this.maxInstances) {
      this.cleanup();
    }

    // Create new editor instance
    const editor = createTableCellEditorConfig(options.content);
    
    // Set up event handlers
    if (options.onUpdate) {
      editor.on('update', ({ editor }) => {
        options.onUpdate!(editor.getHTML());
      });
    }

    if (options.onFocus) {
      editor.on('focus', options.onFocus);
    }

    if (options.onBlur) {
      editor.on('blur', options.onBlur);
    }

    this.editors.set(cellId, editor);
    return editor;
  }

  /**
   * Remove and destroy an editor instance
   */
  removeEditor(cellId: string): void {
    const editor = this.editors.get(cellId);
    if (editor) {
      editor.destroy();
      this.editors.delete(cellId);
    }
  }

  /**
   * Clean up least recently used editors
   */
  private cleanup(): void {
    // For now, just remove half of the editors
    // In a more sophisticated implementation, we could track usage
    const entries = Array.from(this.editors.entries());
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    
    toRemove.forEach(([cellId, editor]) => {
      editor.destroy();
      this.editors.delete(cellId);
    });
  }

  /**
   * Destroy all editor instances
   */
  destroy(): void {
    this.editors.forEach(editor => editor.destroy());
    this.editors.clear();
  }
}

// Global instance for table cell editor management
export const tableCellEditorManager = new TableCellEditorManager();