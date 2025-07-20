// ABOUTME: Text selection detection hook for unified typography editing across all block types

import { useEffect, useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';

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
   * Extract typography properties from selected text element
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

    const selectionInfo: TextSelectionInfo = {
      blockId,
      selectedText,
      textElement,
      range: range.cloneRange(),
      hasSelection: true,
    };

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
  }, [findBlockId, setTextSelection]);

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
   * Enhanced version that handles range-based styling and persistence
   */
  const applyTypographyToSelection = useCallback(
    (properties: Partial<Record<string, any>>) => {
      const currentSelection = lastSelectionRef.current;
      if (
        !currentSelection?.hasSelection ||
        !currentSelection.range ||
        !currentSelection.textElement
      ) {
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
            setTextSelection({
              blockId: currentSelection.blockId,
              selectedText: '',
              textElement: currentSelection.textElement,
              range: newRange,
              hasSelection: false,
            });

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
        console.error('Failed to apply typography properties:', error);
        return false;
      }
    },
    [setTextSelection]
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
