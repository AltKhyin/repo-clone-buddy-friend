// ABOUTME: Enhanced text selection hook with TipTap mark detection and selection-aware formatting

import { useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import type { Editor } from '@tiptap/react';
import { tableComponentRegistry } from '@/components/editor/extensions/Table/tableCommands';
import { tableSelectionCoordinator } from '@/components/editor/extensions/Table/selection/TableSelectionCoordinator';

export interface TextSelectionInfo {
  /** ID of the block containing the selected text */
  blockId: string | null;
  /** The selected text content */
  selectedText: string;
  /** DOM element containing the selected text */
  textElement: HTMLElement | null;
  /** Selection range for precise text manipulation */
  range: Range | null;
  /** Whether text is currently selected */
  hasSelection: boolean;
  /** TipTap editor instance if selection is within a TipTap editor */
  editor?: Editor | null;
  /** Whether this selection is within a TipTap editor */
  isTipTapSelection: boolean;
  /** Whether this selection is within a table cell */
  isTableCellSelection: boolean;
  /** Table cell information if selection is within a table cell */
  tableCellInfo?: {
    tableId: string;
    cellPosition: { row: number; col: number };
    cellEditor: Editor | null;
    isHeader: boolean;
  };
  /** Current typography marks applied to the selection */
  appliedMarks: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textColor?: string;
    backgroundColor?: string;
    textTransform?: string;
    letterSpacing?: string;
  };
}

/**
 * Hook for detecting and managing text selection across all block types
 * Provides foundation for unified typography editing through top toolbar
 */
export function useTextSelection() {
  const { setTextSelection, selectedNodeId } = useEditorStore();
  const lastSelectionRef = useRef<TextSelectionInfo | null>(null);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Find the block ID that contains the given element
   */
  const findBlockId = useCallback((element: HTMLElement): string | null => {
    let current: HTMLElement | null = element;

    while (current) {
      // Look for block container with data-block-id attribute
      if (current.hasAttribute('data-block-id')) {
        return current.getAttribute('data-block-id');
      }

      // Also check for block wrapper classes
      if (
        current.classList.contains('editor-block') ||
        current.classList.contains('block-content') ||
        current.closest('[data-block-id]')
      ) {
        const blockContainer = current.closest('[data-block-id]') as HTMLElement;
        return blockContainer?.getAttribute('data-block-id') || null;
      }

      current = current.parentElement;
    }

    return null;
  }, []);

  /**
   * Detect if the selection is within a table cell and get cell information
   */
  const detectTableCellSelection = useCallback((element: HTMLElement): { 
    isTableCell: boolean; 
    tableId?: string; 
    cellPosition?: { row: number; col: number };
    cellEditor?: Editor | null;
    isHeader?: boolean;
  } => {
    let current: HTMLElement | null = element;
    
    while (current) {
      // Check if this element is a table cell with our data attributes
      if (current.hasAttribute('data-testid') && current.getAttribute('data-testid')?.startsWith('table-cell-')) {
        const testId = current.getAttribute('data-testid');
        const match = testId?.match(/table-cell-(-?\d+)-(\d+)/);
        
        if (match) {
          const row = parseInt(match[1]);
          const col = parseInt(match[2]);
          const isHeader = row === -1; // -1 indicates header row
          
          // Find the table container to get the table ID
          let tableContainer = current;
          while (tableContainer && !tableContainer.hasAttribute('data-block-id')) {
            tableContainer = tableContainer.parentElement;
          }
          
          const tableId = tableContainer?.getAttribute('data-block-id');
          
          if (tableId) {
            // Get the table component from registry to access cell editor
            const tableComponent = tableComponentRegistry.get(tableId);
            const cellEditor = tableComponent?.getFocusedCellEditor?.() || null;
            
            return {
              isTableCell: true,
              tableId,
              cellPosition: { row, col },
              cellEditor,
              isHeader,
            };
          }
        }
      }
      
      // Also check if we're inside a RichTableCell component
      if (current.classList.contains('table-cell-container') || 
          current.classList.contains('rich-cell-editor') ||
          current.classList.contains('cell-display-content')) {
        
        // Look for parent table cell
        const cellElement = current.closest('[data-testid^="table-cell-"]') as HTMLElement;
        if (cellElement) {
          return detectTableCellSelection(cellElement);
        }
      }
      
      current = current.parentElement;
    }
    
    return { isTableCell: false };
  }, []);

  /**
   * Detect if the selection is within a TipTap editor and get the editor instance
   */
  const detectTipTapEditor = useCallback((element: HTMLElement, tableCellInfo?: { cellEditor: Editor | null }): { editor: Editor | null; isTipTap: boolean } => {
    // If we have table cell info with an editor, use that first
    if (tableCellInfo?.cellEditor) {
      return { editor: tableCellInfo.cellEditor, isTipTap: true };
    }
    
    // Look for TipTap editor instance in the DOM hierarchy
    let current: HTMLElement | null = element;
    
    while (current) {
      // Check if this element has a TipTap editor instance
      // TipTap editors typically have a data-editor attribute or specific class
      if (current.classList.contains('ProseMirror') || 
          current.querySelector('.ProseMirror') ||
          current.hasAttribute('data-prosemirror-view')) {
        
        // Try to get the editor instance from the editor store based on block ID
        const blockId = findBlockId(current);
        if (blockId) {
          const { getEditor } = useEditorStore.getState();
          const editor = getEditor?.(blockId);
          
          if (editor && editor.isFocused) {
            return { editor, isTipTap: true };
          }
        }
        
        // Fallback: check if we can find editor in global registry
        // This is a simplified approach - in practice, you might need more sophisticated detection
        return { editor: null, isTipTap: true };
      }
      
      current = current.parentElement;
    }
    
    return { editor: null, isTipTap: false };
  }, [findBlockId]);

  /**
   * Extract typography marks from TipTap editor
   */
  const extractTipTapMarks = useCallback((editor: Editor) => {
    if (!editor) return {};
    
    try {
      return {
        fontFamily: editor.getAttributes('fontFamily').fontFamily,
        fontSize: editor.getAttributes('fontSize').fontSize,
        fontWeight: editor.getAttributes('fontWeight').fontWeight,
        textColor: editor.getAttributes('textColor').color,
        backgroundColor: editor.getAttributes('backgroundColor').backgroundColor,
        textTransform: editor.getAttributes('textTransform').textTransform,
        letterSpacing: editor.getAttributes('letterSpacing').letterSpacing,
      };
    } catch (error) {
      console.warn('Failed to extract TipTap marks:', error);
      return {};
    }
  }, []);

  /**
   * Extract typography properties from selected text element (DOM-based fallback)
   */
  const extractTextProperties = useCallback((element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);

    return {
      fontFamily: computedStyle.fontFamily,
      fontSize: parseInt(computedStyle.fontSize) || 16,
      fontWeight: parseInt(computedStyle.fontWeight) || 400,
      fontStyle: computedStyle.fontStyle,
      color: computedStyle.color,
      textAlign: computedStyle.textAlign as 'left' | 'center' | 'right' | 'justify',
      textDecoration: computedStyle.textDecoration,
      textTransform: computedStyle.textTransform,
      lineHeight: computedStyle.lineHeight,
      letterSpacing: computedStyle.letterSpacing,
    };
  }, []);

  /**
   * Handle text selection change events
   */
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      // Don't immediately clear selection - add delay to allow inspector interactions
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }

      clearTimeoutRef.current = setTimeout(() => {
        const emptySelection: TextSelectionInfo = {
          blockId: null,
          selectedText: '',
          textElement: null,
          range: null,
          hasSelection: false,
          editor: null,
          isTipTapSelection: false,
          isTableCellSelection: false,
          appliedMarks: {},
        };

        if (lastSelectionRef.current?.hasSelection) {
          setTextSelection(emptySelection);
          lastSelectionRef.current = emptySelection;
        }
        clearTimeoutRef.current = null;
      }, 300); // 300ms delay allows for inspector interactions
      return;
    }

    // If we have a selection, cancel any pending clear
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    // Only process if there's actual text selected
    if (!selectedText) {
      return;
    }

    // Get the container element of the selection
    const commonAncestor = range.commonAncestorContainer;
    const textElement =
      commonAncestor.nodeType === Node.TEXT_NODE
        ? (commonAncestor.parentElement as HTMLElement)
        : (commonAncestor as HTMLElement);

    if (!textElement) {
      return;
    }

    // Find which block contains this text
    const blockId = findBlockId(textElement);

    // Only process selections within editor blocks
    if (!blockId) {
      return;
    }

    // Detect table cell selection first
    const tableCellInfo = detectTableCellSelection(textElement);
    
    // Detect TipTap editor and extract marks (prioritize table cell editor)
    const { editor, isTipTap } = detectTipTapEditor(textElement, tableCellInfo.isTableCell ? { cellEditor: tableCellInfo.cellEditor || null } : undefined);
    const appliedMarks = isTipTap && editor ? extractTipTapMarks(editor) : {};

    const selectionInfo: TextSelectionInfo = {
      blockId,
      selectedText,
      textElement,
      range: range.cloneRange(),
      hasSelection: true,
      editor,
      isTipTapSelection: isTipTap,
      isTableCellSelection: tableCellInfo.isTableCell,
      tableCellInfo: tableCellInfo.isTableCell ? {
        tableId: tableCellInfo.tableId!,
        cellPosition: tableCellInfo.cellPosition!,
        cellEditor: tableCellInfo.cellEditor || null,
        isHeader: tableCellInfo.isHeader || false,
      } : undefined,
      appliedMarks,
    };

    // ENHANCED: Coordinate with table selection system to prevent conflicts
    // Only clear table selections when transitioning FROM table cell TO normal text
    if (!tableCellInfo.isTableCell && 
        tableSelectionCoordinator.hasTableCellSelection() &&
        lastSelectionRef.current?.isTableCellSelection) {
      tableSelectionCoordinator.handleNonTableSelection();
      console.log('[useTextSelection] Transitioning from table to normal text - cleared table selection to enable text formatting');
    }

    // Only update if selection has meaningfully changed
    const hasChanged =
      !lastSelectionRef.current ||
      lastSelectionRef.current.blockId !== blockId ||
      lastSelectionRef.current.selectedText !== selectedText ||
      lastSelectionRef.current.textElement !== textElement;

    if (hasChanged) {
      setTextSelection(selectionInfo);
      lastSelectionRef.current = selectionInfo;
    }
  }, [findBlockId, setTextSelection, detectTipTapEditor, extractTipTapMarks]);

  /**
   * Clear text selection
   */
  const clearSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, []);

  /**
   * Apply typography properties to currently selected text
   * Enhanced version with TipTap mark integration and DOM fallback
   */
  const applyTypographyToSelection = useCallback(
    (properties: Partial<Record<string, any>>) => {
      const currentSelection = lastSelectionRef.current;
      if (!currentSelection?.hasSelection) {
        return false;
      }

      // TipTap editor path - use mark commands
      // Prioritize table cell editor for table cell selections
      const targetEditor = currentSelection.isTableCellSelection && currentSelection.tableCellInfo?.cellEditor 
        ? currentSelection.tableCellInfo.cellEditor 
        : currentSelection.editor;
        
      if (currentSelection.isTipTapSelection && targetEditor) {
        try {
          const editor = targetEditor;
          
          // Apply typography marks using TipTap commands
          Object.entries(properties).forEach(([property, value]) => {
            if (value === undefined || value === null || value === '') {
              // Unset mark for empty/null/undefined values
              switch (property) {
                case 'fontFamily':
                  editor.commands.unsetFontFamily();
                  break;
                case 'fontSize':
                  editor.commands.unsetFontSize();
                  break;
                case 'fontWeight':
                  editor.commands.unsetFontWeight();
                  break;
                case 'color':
                case 'textColor':
                  editor.commands.unsetTextColor();
                  break;
                case 'backgroundColor':
                  editor.commands.unsetBackgroundColor();
                  break;
                case 'textTransform':
                  editor.commands.unsetTextTransform();
                  break;
                case 'letterSpacing':
                  editor.commands.unsetLetterSpacing();
                  break;
              }
            } else {
              // Set mark with value
              switch (property) {
                case 'fontFamily':
                  editor.commands.setFontFamily(String(value));
                  break;
                case 'fontSize':
                  editor.commands.setFontSize(Number(value));
                  break;
                case 'fontWeight':
                  editor.commands.setFontWeight(Number(value));
                  break;
                case 'color':
                case 'textColor':
                  editor.commands.setTextColor(String(value));
                  break;
                case 'backgroundColor':
                  editor.commands.setBackgroundColor(String(value));
                  break;
                case 'textTransform':
                  editor.commands.setTextTransform(String(value));
                  break;
                case 'letterSpacing':
                  editor.commands.setLetterSpacing(value);
                  break;
              }
            }
          });

          // Update the applied marks in our selection state
          const updatedMarks = extractTipTapMarks(editor);
          const updatedSelection: TextSelectionInfo = {
            ...currentSelection,
            appliedMarks: updatedMarks,
            editor: targetEditor, // Update to reflect the actual editor used
          };
          
          setTextSelection(updatedSelection);
          lastSelectionRef.current = updatedSelection;

          return true;
        } catch (error) {
          console.error('Failed to apply TipTap typography marks:', error);
          return false;
        }
      }

      // DOM-based fallback for non-TipTap editors
      if (!currentSelection.range || !currentSelection.textElement) {
        return false;
      }

      try {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return false;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        // If no text is selected, apply to the entire element
        if (!selectedText.trim()) {
          Object.entries(properties).forEach(([property, value]) => {
            if (value !== undefined && value !== null) {
              const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
              currentSelection.textElement!.style.setProperty(cssProperty, String(value));
            }
          });
          return true;
        }

        // For text selections, wrap the selected content in a span with styles
        if (!range.collapsed && selectedText.trim()) {
          // Create a styled span element
          const span = document.createElement('span');

          // Apply typography properties to the span
          Object.entries(properties).forEach(([property, value]) => {
            if (value !== undefined && value !== null) {
              const cssProperty = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
              span.style.setProperty(cssProperty, String(value));
            }
          });

          // Extract and wrap the selected content
          try {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);

            // Clear the selection and place cursor after the styled text
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStartAfter(span);
            newRange.collapse(true);
            selection.addRange(newRange);

            // Update the text selection state
            const updatedSelection: TextSelectionInfo = {
              ...currentSelection,
              selectedText: '',
              range: newRange,
              hasSelection: false,
            };
            setTextSelection(updatedSelection);
            lastSelectionRef.current = updatedSelection;

            return true;
          } catch (rangeError) {
            console.warn('Range manipulation failed, falling back to element styling:', rangeError);

            // Fallback: apply styles to the entire text element
            Object.entries(properties).forEach(([property, value]) => {
              if (value !== undefined && value !== null) {
                const cssProperty = property.replace(
                  /[A-Z]/g,
                  letter => `-${letter.toLowerCase()}`
                );
                currentSelection.textElement!.style.setProperty(cssProperty, String(value));
              }
            });
            return true;
          }
        }

        return true;
      } catch (error) {
        console.error('Failed to apply typography properties (DOM fallback):', error);
        return false;
      }
    },
    [setTextSelection, extractTipTapMarks]
  );

  // Set up event listeners for text selection
  useEffect(() => {
    // Use capture phase to ensure we catch selections in all nested elements
    document.addEventListener('selectionchange', handleSelectionChange);

    // Also listen for mouse up to catch selection completion
    document.addEventListener('mouseup', handleSelectionChange);

    // Listen for keyboard events that might change selection
    document.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);

      // Clean up any pending clear timeout
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
    };
  }, [handleSelectionChange]);

  // Clean up selection when selected block changes
  useEffect(() => {
    if (lastSelectionRef.current && lastSelectionRef.current.blockId !== selectedNodeId) {
      clearSelection();
    }
  }, [selectedNodeId, clearSelection]);

  return {
    textSelection: lastSelectionRef.current,
    clearSelection,
    applyTypographyToSelection,
    extractTextProperties,
  };
}
