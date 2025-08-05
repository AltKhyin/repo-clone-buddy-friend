// ABOUTME: Enhanced TipTap editor hook for Rich Block with Reddit-like features and advanced formatting

import { useEditor, Editor } from '@tiptap/react';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { findParentNode } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Mention from '@tiptap/extension-mention';
import Underline from '@tiptap/extension-underline';
import { useCallback, useRef, useState, useEffect } from 'react';
import { debounce } from 'lodash-es';
import { useEditorStore } from '@/store/editorStore';
import { ContentSelectionType } from '@/types/editor';
import { useSelectionStore } from '@/store/selectionStore';
import { isTextSelection } from '@/types/selection';
// INSTRUMENTATION: Performance monitoring for table detection optimization
import { globalMonitor, instrumentFindParentCell } from '@/utils/performance-monitor';
// UNIFIED ARCHITECTURE: DOM-first table detection
import { detectTableContext } from '@/utils/table-detection';
import { InlineImage } from '@/components/editor/extensions/InlineImage';
import { VideoEmbed, VideoUtils } from '@/components/editor/extensions/VideoEmbed';
import { TableExtension } from '@/components/editor/extensions/Table';
import { useMediaDropHandler } from './useMediaDropHandler';
// Typography marks for selection-based formatting
import { FontFamilyMark } from '@/components/editor/extensions/marks/FontFamilyMark';
import { FontSizeMark } from '@/components/editor/extensions/marks/FontSizeMark';
import { FontWeightMark } from '@/components/editor/extensions/marks/FontWeightMark';
import { TextColorMark } from '@/components/editor/extensions/marks/TextColorMark';
import { BackgroundColorMark } from '@/components/editor/extensions/marks/BackgroundColorMark';
import { TextTransformMark } from '@/components/editor/extensions/marks/TextTransformMark';
import { LetterSpacingMark } from '@/components/editor/extensions/marks/LetterSpacingMark';
import { TextAlignNode } from '@/components/editor/extensions/nodes/TextAlignNode';

// 🎯 TABLE CELL SELECTION PERSISTENCE FIX
// Helper functions for click context detection to solve table cell selection loss issue
// Problem: Table cell selections were being cleared on ANY click outside the cell (including toolbar)
// Solution: Intelligent click detection to distinguish between toolbar clicks and content clicks
const isToolbarElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  // Check for toolbar-related classes and data attributes
  const toolbarSelectors = [
    '.unified-toolbar',
    '.toolbar-button',
    '.dropdown-trigger',
    '.typography-controls',
    '[data-toolbar]',
    '[role="toolbar"]',
    'button',
    '[data-radix-popper-content-wrapper]', // Radix popover/dropdown content
    '[data-radix-dropdown-content]',
    '[role="menu"]',
    '[role="menuitem"]',
    '.lucide', // Icon elements
  ];
  
  // Check element and its ancestors for toolbar indicators
  let currentElement: HTMLElement | null = element;
  while (currentElement && currentElement !== document.body) {
    // Check if element matches any toolbar selector
    for (const selector of toolbarSelectors) {
      if (currentElement.matches?.(selector)) {
        return true;
      }
    }
    
    // Check for toolbar-related class names
    const className = currentElement.className;
    if (typeof className === 'string' && (
      className.includes('toolbar') ||
      className.includes('dropdown') ||
      className.includes('popover') ||
      className.includes('menu') ||
      className.includes('button')
    )) {
      return true;
    }
    
    currentElement = currentElement.parentElement;
  }
  
  return false;
};

const isEditorContent = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  // Check if element is within editor content
  const editorSelectors = [
    '.tiptap',
    '.ProseMirror',
    '.rich-block-content',
    '.editor-content',
    '[contenteditable="true"]',
  ];
  
  let currentElement: HTMLElement | null = element;
  while (currentElement && currentElement !== document.body) {
    for (const selector of editorSelectors) {
      if (currentElement.matches?.(selector)) {
        return true;
      }
    }
    currentElement = currentElement.parentElement;
  }
  
  return false;
};

const shouldClearTableCellSelection = (targetElement: HTMLElement | null): boolean => {
  // Don't clear table cell selection if:
  // 1. Click is on toolbar/UI elements
  // 2. Click is outside editor content entirely
  // 3. targetElement is null (safety)
  
  if (!targetElement) {
    return false; // Conservative approach - don't clear on null target
  }
  
  if (isToolbarElement(targetElement)) {
    return false; // Preserve selection when clicking toolbar
  }
  
  if (!isEditorContent(targetElement)) {
    return false; // Preserve selection when clicking outside editor
  }
  
  // Only clear when clicking on actual editor content that should take precedence
  return true;
};

// Helper functions for table selection detection
const findParentTable = (state: any, pos: number) => {
  // INSTRUMENTATION: Track ProseMirror table detection calls
  globalMonitor.recordProseMirrorCall('findParentTable', { pos, docSize: state?.doc?.content?.size });
  
  // Enhanced state validation to match findParentCell pattern
  if (!state || !state.doc || typeof pos !== 'number' || pos < 0) {
    return null;
  }
  
  try {
    // Ensure position is within document bounds
    if (pos > state.doc.content.size) {
      return null;
    }
    
    const resolved = state.doc.resolve(pos);
    
    // ENHANCED: Apply same corruption protection as findParentCell
    if (!resolved) {
      return null;
    }
    
    // ENHANCED: Check for depth corruption specifically
    if (typeof resolved.depth === 'undefined' || resolved.depth === null) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('findParentTable: resolved.depth is undefined/null - state corruption detected');
      }
      return null;
    }
    
    if (resolved.depth < 0) {
      return null;
    }
    
    // ENHANCED: Additional safety check before calling findParentNode
    if (!resolved.parent || typeof resolved.pos !== 'number') {
      return null;
    }
    
    return findParentNode(node => node.type.name === 'customTable')(resolved);
  } catch (error) {
    // Only log in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.warn('findParentTable error:', error);
    }
    return null;
  }
};

const findParentCell = (state: any, pos: number) => {
  // INSTRUMENTATION: Track ProseMirror cell detection calls (the main performance problem)
  globalMonitor.recordProseMirrorCall('findParentCell', { pos, docSize: state?.doc?.content?.size });
  
  // ENHANCED: Comprehensive state validation to prevent corruption errors 
  if (!state || !state.doc || typeof pos !== 'number' || pos < 0) {
    return null;
  }
  
  // ENHANCED: Early validation of document integrity
  if (!state.doc.resolve || typeof state.doc.resolve !== 'function') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('findParentCell: doc.resolve is not available - ProseMirror state corrupted');
    }
    return null;
  }
  
  try {
    // ENHANCED: Position bounds checking with safer comparison
    if (pos >= state.doc.content.size || pos < 0) {
      return null;
    }
    
    const resolved = state.doc.resolve(pos);
    
    // ENHANCED: Multiple validation layers for resolved position
    if (!resolved) {
      return null;
    }
    
    // ENHANCED: Specific check for depth corruption (the main issue from logs)
    if (typeof resolved.depth === 'undefined' || resolved.depth === null) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('findParentCell: ProseMirror resolved.depth is undefined/null - state corruption detected', {
          pos,
          resolvedProps: Object.keys(resolved || {}),
          docSize: state.doc?.content?.size,
          stateIntegrity: {
            hasSelection: !!state.selection,
            docContentSize: state.doc?.content?.size,
          }
        });
      }
      return null;
    }
    
    if (resolved.depth < 0) {
      return null;
    }
    
    // ENHANCED: Additional validation of resolved object integrity before using findParentNode
    if (!resolved.parent || typeof resolved.pos !== 'number') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('findParentCell: Resolved object missing required properties', {
          hasParent: !!resolved.parent,
          posType: typeof resolved.pos,
          resolvedProps: Object.keys(resolved || {}),
        });
      }
      return null;
    }
    
    // ENHANCED: Validate that we have access to findParentNode function
    if (typeof findParentNode !== 'function') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('findParentCell: findParentNode function not available');
      }
      return null;
    }
    
    // ENHANCED: Additional safety check right before calling findParentNode
    // to catch any last-moment corruption
    if (typeof resolved.depth === 'undefined' || resolved.depth === null) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('findParentCell: depth became undefined just before findParentNode call');
      }
      return null;
    }
    
    return findParentNode(node => node.type.name === 'tableCell')(resolved);
  } catch (error) {
    // ENHANCED: Comprehensive error logging for debugging state corruption
    if (process.env.NODE_ENV === 'development') {
      console.warn('findParentCell error:', {
        error: error instanceof Error ? error.message : String(error),
        pos,
        docSize: state.doc?.content?.size,
        hasDoc: !!state.doc,
        hasState: !!state,
        hasResolve: typeof state.doc?.resolve === 'function',
        stateIntegrity: {
          hasSelection: !!state.selection,
          selectionType: state.selection?.constructor?.name,
          docContentSize: state.doc?.content?.size,
          docType: state.doc?.constructor?.name
        },
        errorStack: error instanceof Error ? error.stack : undefined
      });
    }
    return null;
  }
};

const getCellPosition = (state: any, pos: number) => {
  // INSTRUMENTATION: Track ProseMirror cell position calls
  globalMonitor.recordProseMirrorCall('getCellPosition', { pos, docSize: state?.doc?.content?.size });
  
  // Enhanced state validation to match findParentCell pattern
  if (!state || !state.doc || typeof pos !== 'number' || pos < 0) {
    return { row: 0, col: 0 };
  }
  
  try {
    // Ensure position is within document bounds
    if (pos > state.doc.content.size) {
      return { row: 0, col: 0 };
    }
    
    const resolved = state.doc.resolve(pos);
    
    // ENHANCED: Apply same corruption protection as findParentCell
    if (!resolved) {
      return { row: 0, col: 0 };
    }
    
    // ENHANCED: Check for depth corruption specifically  
    if (typeof resolved.depth === 'undefined' || resolved.depth === null) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('getCellPosition: resolved.depth is undefined/null - state corruption detected');
      }
      return { row: 0, col: 0 };
    }
    
    if (resolved.depth < 0) {
      return { row: 0, col: 0 };
    }
    
    const row = 0;
    const col = 0;
    
    // Walk up to find cell position - simplified implementation
    // In a full implementation, this would properly calculate row/col from the resolved position
    return { row, col };
  } catch (error) {
    // Only log in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.warn('getCellPosition error:', error);
    }
    return { row: 0, col: 0 };
  }
};

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
  
  // UNIFIED SELECTION SYSTEM: Get dispatch for text selection integration
  const { dispatch } = useSelectionStore();

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

      // Underline formatting (always enabled)
      Underline,

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

      // Typography marks for selection-based formatting (Google Docs-like)
      FontFamilyMark.configure({
        HTMLAttributes: {
          class: 'font-family-mark',
        },
      }),
      FontSizeMark.configure({
        HTMLAttributes: {
          class: 'font-size-mark',
        },
      }),
      FontWeightMark.configure({
        HTMLAttributes: {
          class: 'font-weight-mark',
        },
      }),
      TextColorMark.configure({
        HTMLAttributes: {
          class: 'text-color-mark',
        },
      }),
      BackgroundColorMark.configure({
        HTMLAttributes: {
          class: 'background-color-mark',
        },
      }),
      TextTransformMark.configure({
        HTMLAttributes: {
          class: 'text-transform-mark',
        },
      }),
      LetterSpacingMark.configure({
        HTMLAttributes: {
          class: 'letter-spacing-mark',
        },
      }),
      TextAlignNode.configure({
        HTMLAttributes: {
          class: 'text-align-node',
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
      // INSTRUMENTATION: Track selection update frequency (identifies over-calling problem)
      globalMonitor.startTiming();
      globalMonitor.recordDomTraversal('onSelectionUpdate-triggered');
      
      // ENHANCED: Handle media node and table cell selection with comprehensive state validation
      // CRITICAL: Prevent ProseMirror state corruption errors during concurrent operations
      if (!editor || editor.isDestroyed || !editor.state || !editor.state.doc || !editor.state.selection) {
        globalMonitor.stopTiming();
        return;
      }
      
      const { state } = editor;
      const { selection } = state;
      
      // ENHANCED: Comprehensive state integrity validation before proceeding
      if (!state.doc.resolve || typeof state.doc.resolve !== 'function') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('onSelectionUpdate: ProseMirror state corrupted - doc.resolve not available');
        }
        return;
      }
      
      // ENHANCED: Safer position extraction with validation
      if (!selection.$anchor || typeof selection.$anchor.pos !== 'number') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('onSelectionUpdate: selection.$anchor.pos is invalid');
        }
        return;
      }
      
      const pos = selection.$anchor.pos;
      
      // ENHANCED: Position bounds validation with safety margins
      if (pos < 0 || pos > state.doc.content.size) {
        return;
      }
      
      // ENHANCED: Add transaction safety check - avoid processing during state transitions
      if (editor.view && editor.view.state !== state) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('onSelectionUpdate: State mismatch detected - skipping to prevent corruption');
        }
        return;
      }

      // Check if we have a node selection (clicking on media elements)
      if (selection instanceof NodeSelection) {
        const selectedNode = selection.node;
        const nodeType = selectedNode.type.name;

        // Handle table cell node selection
        if (nodeType === 'tableCell') {
          const cellPos = selection.from;
          const tableNode = findParentTable(state, cellPos);
          
          if (tableNode) {
            setContentSelection({
              type: ContentSelectionType.TABLE_CELL,
              blockId: nodeId,
              data: {
                tableCell: {
                  tableId: tableNode.node.attrs.tableId,
                  cellPosition: getCellPosition(state, cellPos),
                  isEditing: true,
                  cellContent: selectedNode.textContent || '',
                },
              },
            });
            return; // Don't clear selection
          }
        }

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

      // ENHANCED: Handle text selections within table cells with state corruption protection
      if (selection instanceof TextSelection) {
        // ENHANCED: Validate selection.from position before calling findParentCell
        if (typeof selection.from !== 'number' || selection.from < 0 || selection.from > state.doc.content.size) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('onSelectionUpdate: Invalid selection.from position', {
              from: selection.from,
              docSize: state.doc.content.size
            });
          }
          return;
        }
        
        // 🎯 UNIFIED ARCHITECTURE: DOM-first table detection to eliminate unnecessary ProseMirror calls
        
        // STEP 1: Get DOM element at current selection
        const domSelection = window.getSelection();
        let targetElement: HTMLElement | null = null;
        
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const anchorNode = range.commonAncestorContainer;
          targetElement = anchorNode.nodeType === Node.TEXT_NODE 
            ? (anchorNode.parentElement as HTMLElement)
            : (anchorNode as HTMLElement);
        }
        
        // STEP 2: Use unified DOM-first detection BEFORE any ProseMirror calls
        const domDetectionResult = targetElement ? detectTableContext(targetElement) : null;
        
        // INSTRUMENTATION: Track the efficiency gain
        globalMonitor.recordProseMirrorCall('dom-first-detection', {
          isTableCell: domDetectionResult?.isTableCell || false,
          confidence: domDetectionResult?.confidence || 'unknown',
          method: domDetectionResult?.method || 'fallback',
          note: 'DOM-first detection eliminates ProseMirror calls for non-table elements'
        });
        
        // STEP 3: Only call ProseMirror functions if DOM detection indicates table cell
        let cellNode = null;
        
        if (domDetectionResult?.isTableCell) {
          // OPTIMIZATION: Only call ProseMirror for confirmed table cells
          globalMonitor.recordProseMirrorCall('findParentCell-optimized', { 
            from: selection.from, 
            selectionType: 'TextSelection',
            note: 'OPTIMIZED: Only called after DOM confirms table cell presence'
          });
          
          try {
            cellNode = findParentCell(state, selection.from);
            
            // INSTRUMENTATION: Log the optimized result
            globalMonitor.recordProseMirrorCall('findParentCell-optimized-result', {
              foundCell: !!cellNode,
              note: cellNode ? 'Confirmed table cell via optimized path' : 'DOM detection was wrong - rare case',
              efficiency: 'OPTIMIZED'
            });
            
          } catch (error) {
            // This should be caught by findParentCell itself, but add extra safety
            if (process.env.NODE_ENV === 'development') {
              console.warn('onSelectionUpdate: findParentCell failed with additional error', {
                error: error instanceof Error ? error.message : String(error),
                position: selection.from,
                docSize: state.doc.content.size
              });
            }
            return;
          }
        } else {
          // 🎯 OPTIMIZATION: DOM detection confirmed NOT a table cell - skip ALL ProseMirror table logic
          globalMonitor.recordProseMirrorCall('skip-prosemirror-optimization', {
            note: 'MAJOR OPTIMIZATION: Skipped findParentCell, findParentTable, getCellPosition calls',
            elementType: targetElement?.tagName.toLowerCase(),
            savings: 'Eliminated 3+ ProseMirror state accesses'
          });
          
          // 🎯 SMART SELECTION CLEARING: Only clear table cell selection for appropriate interactions
          const { currentSelection } = useEditorStore.getState();
          if (currentSelection?.type === ContentSelectionType.TABLE_CELL && currentSelection.blockId === nodeId) {
            // Use intelligent click detection to determine if we should clear the selection
            if (shouldClearTableCellSelection(targetElement)) {
              setContentSelection(null);
              globalMonitor.recordProseMirrorCall('table-cell-selection-cleared', {
                reason: 'Editor content interaction',
                elementType: targetElement?.tagName.toLowerCase(),
                note: 'Table cell selection cleared due to editor content click'
              });
            } else {
              globalMonitor.recordProseMirrorCall('table-cell-selection-preserved', {
                reason: 'Non-content interaction (toolbar/external)',
                elementType: targetElement?.tagName.toLowerCase(),
                isToolbar: isToolbarElement(targetElement),
                isEditorContent: isEditorContent(targetElement),
                note: 'Table cell selection preserved - click was on toolbar or outside editor'
              });
            }
          }
          
          // 🎯 UNIFIED SELECTION INTEGRATION: Route text selections to unified system
          // This replaces the early return that was blocking text selection integration
          const selectedText = state.doc.textBetween(selection.from, selection.to, ' ');
          
          if (selectedText && selectedText.trim().length > 0) {
            // Route text selection to unified selection system
            dispatch({
              type: 'SELECT_TEXT',
              selection: {
                blockId: nodeId,
                selectedText,
                editor,
                range: {
                  from: selection.from,
                  to: selection.to,
                },
                textElement: targetElement,
                hasSelection: true,
              },
            });
            
            globalMonitor.recordProseMirrorCall('text-selection-unified-integration', {
              selectedText: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
              textLength: selectedText.length,
              blockId: nodeId,
              note: 'Text selection successfully routed to unified selection system'
            });
          } else {
            // 🎯 CRITICAL FIX: Only clear selection if this block had an active text selection
            // Don't clear selections from other blocks or selection types
            const currentSelection = useSelectionStore.getState().selection;
            if (currentSelection.type === 'text' && 
                isTextSelection(currentSelection) && 
                currentSelection.textSelection?.blockId === nodeId) {
              dispatch({ type: 'CLEAR_SELECTION' });
              globalMonitor.recordProseMirrorCall('text-selection-cleared', {
                blockId: nodeId,
                note: 'Cleared text selection for this block only'
              });
            }
          }
          
          // Continue processing (no early return)
        }
        
        if (cellNode) {
          // Table cell text selection - preserve selection, don't clear
          const tableNode = findParentTable(state, selection.from);
          
          if (tableNode) {
            const cellPosition = getCellPosition(state, selection.from);
            
            setContentSelection({
              type: ContentSelectionType.TABLE_CELL,
              blockId: nodeId,
              data: {
                tableCell: {
                  tableId: tableNode.node.attrs.tableId,
                  cellPosition: cellPosition,
                  isEditing: true,
                  cellContent: cellNode.node.textContent || '',
                },
              },
            });
            
          } else {
          }
          return; // Don't clear table cell selections
        } else {
        }
      } else {
      }

      // Clear media selection only (preserve table selections)
      // Only clear if the current selection was a media type
      const currentSelection = useEditorStore.getState().selectionState.contentSelection;
      
      if (
        currentSelection &&
        (currentSelection.type === ContentSelectionType.INLINE_IMAGE ||
          currentSelection.type === ContentSelectionType.VIDEO_EMBED) &&
        currentSelection.blockId === nodeId
      ) {
        setContentSelection(null);
      } else if (currentSelection) {
      } else {
      }
      
      // INSTRUMENTATION: Complete timing measurement for this selection update
      const selectionUpdateTime = globalMonitor.stopTiming();
      
      // INSTRUMENTATION: Log performance metrics in development
      if (process.env.NODE_ENV === 'development' && selectionUpdateTime > 5) {
        console.log(`[PERF] onSelectionUpdate took ${selectionUpdateTime.toFixed(2)}ms`, {
          selectionType: selection.constructor.name,
          nodeId,
          proseMirrorCalls: globalMonitor.getMetrics().proseMirrorCalls
        });
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

    // Typography marks for selection-based formatting
    typography: {
      // Font family
      setFontFamily: (fontFamily: string) => editor?.commands.setFontFamily(fontFamily),
      unsetFontFamily: () => editor?.commands.unsetFontFamily(),
      
      // Font size
      setFontSize: (fontSize: number) => editor?.commands.setFontSize(fontSize),
      unsetFontSize: () => editor?.commands.unsetFontSize(),
      
      // Font weight
      setFontWeight: (fontWeight: number) => editor?.commands.setFontWeight(fontWeight),
      unsetFontWeight: () => editor?.commands.unsetFontWeight(),
      toggleFontBold: () => editor?.commands.toggleBold(), // Enhanced bold toggle
      
      // Text color
      setTextColor: (color: string) => editor?.commands.setTextColor(color),
      unsetTextColor: () => editor?.commands.unsetTextColor(),
      
      // Background color / highlighting
      setBackgroundColor: (color: string) => editor?.commands.setBackgroundColor(color),
      unsetBackgroundColor: () => editor?.commands.unsetBackgroundColor(),
      toggleHighlightColor: () => editor?.commands.toggleHighlight(), // Quick highlight toggle
      
      // Text transform
      setTextTransform: (transform: string) => editor?.commands.setTextTransform(transform),
      unsetTextTransform: () => editor?.commands.unsetTextTransform(),
      toggleUppercase: () => editor?.commands.toggleUppercase(),
      toggleCapitalize: () => editor?.commands.toggleCapitalize(),
      
      // Letter spacing
      setLetterSpacing: (spacing: string | number) => editor?.commands.setLetterSpacing(spacing),
      unsetLetterSpacing: () => editor?.commands.unsetLetterSpacing(),
      increaseLetterSpacing: () => editor?.commands.increaseLetterSpacing(),
      decreaseLetterSpacing: () => editor?.commands.decreaseLetterSpacing(),
      
      // Text alignment (node-based)
      setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => editor?.commands.setTextAlign(alignment),
      unsetTextAlign: () => editor?.commands.unsetTextAlign(),
    },

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
      
      // Typography marks state checks
      fontFamily: editor?.isActive('fontFamily') ?? false,
      fontSize: editor?.isActive('fontSize') ?? false,
      fontWeight: editor?.isActive('fontWeight') ?? false,
      textColor: editor?.isActive('textColor') ?? false,
      backgroundColor: editor?.isActive('backgroundColor') ?? false,
      textTransform: editor?.isActive('textTransform') ?? false,
      letterSpacing: editor?.isActive('letterSpacing') ?? false,
      textAlign: (() => {
        if (!editor) return false;
        // Check if current block has text alignment
        const { selection } = editor.state;
        const currentNode = selection.$anchor.parent;
        return Boolean(currentNode?.attrs?.textAlign);
      })(),
      
      // REMOVED: poll state - polls moved to community-only features
    },

    // Get current typography attributes for selection
    getTypographyAttributes: () => {
      if (!editor) return {};
      
      // Get text alignment from current block node
      const { selection } = editor.state;
      const currentNode = selection?.$anchor?.parent;
      const textAlign = currentNode?.attrs?.textAlign || null;
      
      return {
        fontFamily: editor.getAttributes('fontFamily').fontFamily,
        fontSize: editor.getAttributes('fontSize').fontSize,
        fontWeight: editor.getAttributes('fontWeight').fontWeight,
        textColor: editor.getAttributes('textColor').color,
        backgroundColor: editor.getAttributes('backgroundColor').backgroundColor,
        textTransform: editor.getAttributes('textTransform').textTransform,
        letterSpacing: editor.getAttributes('letterSpacing').letterSpacing,
        textAlign: textAlign,
      };
    },
  };
};

export type RichTextEditorInstance = ReturnType<typeof useRichTextEditor>;
