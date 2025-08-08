// ABOUTME: Unified toolbar containing ALL editor functionality in organized categories to replace fragmented interfaces

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorStore, useCanvasState, useCanvasActions } from '@/store/editorStore';
import { useTheme } from '@/components/providers/CustomThemeProvider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AccessibleNumberInput } from './shared/AccessibleNumberInput';
// Legacy block typography support removed - now using selection-based typography for all content
import {
  Bold,
  Italic,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Monitor,
  Smartphone,
  Trash2,
  Copy,
  Ruler,
  Underline,
  Strikethrough,
  ZoomIn,
  ZoomOut,
  Table,
  Plus,
  Image,
  Video,
  Undo,
  Redo,
  List,
  ListOrdered,
  Quote,
  Link,
} from 'lucide-react';
import { ThemeSelector } from '@/components/header/ThemeSelector';
import { useUnifiedSelection, useToolbarInteraction } from '../../hooks/useUnifiedSelection';
import { PLACEHOLDER_IMAGES, PLACEHOLDER_DIMENSIONS } from './shared/mediaConstants';
import { HighlightColorPicker } from './shared/HighlightColorPicker';
import { UnifiedColorPicker } from './shared/UnifiedColorPicker';
import { HeadingSelector } from './shared/HeadingSelector';
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  TEXT_TRANSFORMS,
  TEXT_DECORATIONS,
} from './shared/typography-system';
import { createTypographyCommands } from './shared/typography-commands';
// Removed distracting visual selection feedback - keeping it simple like Google Docs


interface UnifiedToolbarProps {
  className?: string;
}

export const UnifiedToolbar = React.memo(function UnifiedToolbar({
  className,
}: UnifiedToolbarProps) {
  const { reviewId } = useParams<{ reviewId: string }>();
  const {
    selectedNodeId,
    nodes,
    updateNode,
    deleteNode,
    duplicateNode,
    selectNode,
    showGrid,
    toggleGrid,
    canvasZoom,
    updateCanvasZoom,
    getEditor,
  } = useEditorStore();

  // 🎯 UNIFIED SELECTION SYSTEM: Single source of truth for all selection types
  // SIMPLIFIED: BasicTable system with single-cell selection only
  const {
    currentSelection,
    hasSelection,
    canApplyTypography,
    appliedMarks,
    applyTypography,
  } = useUnifiedSelection();
  
  // 🎯 TOOLBAR INTERACTION: Preserve selections during toolbar operations - SIMPLIFIED
  const { preserveDuringOperation } = useToolbarInteraction();

  // 🎨 CANVAS STATE: Background color and actions
  const { canvasBackgroundColor } = useCanvasState();
  const { setCanvasBackgroundColor } = useCanvasActions();


  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // SIMPLIFIED: BasicTable selection state (single-cell only)
  const tableSelectionState = useMemo(() => ({
    // Only single-cell selection for BasicTable system
    isSingleCellActive: currentSelection.type === 'table-cell',
    hasTableSelection: currentSelection.type === 'table-cell',
    canApplyTableTypography: currentSelection.type === 'table-cell' && currentSelection.cellSelection?.editor,
  }), [currentSelection]);

  // BATCH 1: Enhanced typography state with BasicTable support
  const typographyActive = canApplyTypography || tableSelectionState.canApplyTableTypography;
  const currentSelectionType = currentSelection.type;


  // 🎯 TIPTAP EDITOR STATE: For Rich Block editing features
  const currentEditor = useMemo(() => {
    // Throttled debug logging to reduce spam
    const hasEditor = !!(
      (currentSelection.type === 'table-cell' && currentSelection.cellSelection?.editor) ||
      (currentSelection.type === 'content' && currentSelection.contentSelection?.editor) ||
      (selectedNodeId && getEditor(selectedNodeId))
    );
    
    // Only log editor resolution issues for critical operations (reduced noise)
    const shouldHaveEditor = currentSelection.type === 'content' || currentSelection.type === 'table-cell';
    if (!hasEditor && shouldHaveEditor) {
      // Only warn for critical editor resolution failures that affect table insertion
      console.warn('[UnifiedToolbar] Critical editor resolution issue:', {
        currentSelectionType: currentSelection.type,
        selectedNodeId,
        hasTableCellEditor: !!(currentSelection.type === 'table-cell' && currentSelection.cellSelection?.editor),
        hasContentEditor: !!(currentSelection.type === 'content' && currentSelection.contentSelection?.editor),
        hasSelectedNodeEditor: !!(selectedNodeId && getEditor(selectedNodeId)),
        note: 'Table insertion may fail - editor instance not available'
      });
    }
    
    // Priority 1: Table cell editor (CRITICAL FIX for table content loss)
    if (currentSelection.type === 'table-cell' && currentSelection.cellSelection?.editor) {
      return currentSelection.cellSelection.editor;
    }
    
    // Priority 2: Active content selection with editor
    if (currentSelection.type === 'content' && currentSelection.contentSelection?.editor) {
      return currentSelection.contentSelection.editor;
    }
    
    // Priority 3: Selected Rich Block editor
    if (selectedNodeId) {
      const editor = getEditor(selectedNodeId);
      return editor;
    }
    
    return null;
  }, [currentSelection, selectedNodeId, getEditor]);

  // 🎯 TIPTAP TOOLBAR STATE: For history and structure controls
  const tiptapState = useMemo(() => {
    if (!currentEditor) {
      return null;
    }
    
    // Defensive check for TipTap editor methods
    try {
      // Force a fresh state evaluation
      const editorState = currentEditor.state;
      const selection = editorState?.selection;
      
      const state = {
        canUndo: currentEditor.can?.().undo?.() || false,
        canRedo: currentEditor.can?.().redo?.() || false,
        isBold: currentEditor.isActive?.('bold') || false,
        isItalic: currentEditor.isActive?.('italic') || false,
        isUnderline: currentEditor.isActive?.('underline') || false,
        isStrike: currentEditor.isActive?.('strike') || false,
        isParagraph: currentEditor.isActive?.('paragraph') || false,
        isHeading: currentEditor.isActive?.('heading') || false,
        isHeading1: currentEditor.isActive?.('heading', { level: 1 }) || false,
        isHeading2: currentEditor.isActive?.('heading', { level: 2 }) || false,
        isHeading3: currentEditor.isActive?.('heading', { level: 3 }) || false,
        isHeading4: currentEditor.isActive?.('heading', { level: 4 }) || false,
        isHeading5: currentEditor.isActive?.('heading', { level: 5 }) || false,
        isHeading6: currentEditor.isActive?.('heading', { level: 6 }) || false,
        isQuote: currentEditor.isActive?.('blockquote') || false,
        isBulletList: currentEditor.isActive?.('bulletList') || false,
        isOrderedList: currentEditor.isActive?.('orderedList') || false,
        isLink: currentEditor.isActive?.('link') || false,
        hasSelection: selection ? !selection.empty : false,
      };
      
      // Debug logging for heading state detection
      console.log('[UnifiedToolbar] TipTap State - Heading Detection:', {
        editorExists: !!currentEditor,
        isActiveMethod: typeof currentEditor.isActive,
        selectionInfo: {
          hasSelection: !!selection,
          isEmpty: selection?.empty,
          from: selection?.from,
          to: selection?.to,
        },
        headingStates: {
          isHeading: state.isHeading,
          isHeading1: state.isHeading1,
          isHeading2: state.isHeading2,
          isHeading3: state.isHeading3,
          isHeading4: state.isHeading4,
          isHeading5: state.isHeading5,
          isHeading6: state.isHeading6,
          isParagraph: state.isParagraph,
        }
      });
      
      return state;
    } catch (error) {
      console.warn('[UnifiedToolbar] Error accessing TipTap editor state:', error);
      return {
        canUndo: false,
        canRedo: false,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrike: false,
        isParagraph: false,
        isHeading: false,
        isHeading1: false,
        isHeading2: false,
        isHeading3: false,
        isHeading4: false,
        isHeading5: false,
        isHeading6: false,
        isQuote: false,
        isBulletList: false,
        isOrderedList: false,
        isLink: false,
        hasSelection: false,
      };
    }
  }, [currentEditor, currentEditor?.state, currentEditor?.state?.selection]);

  // 🧠 SMART UX HELPERS: Enhanced user experience with better tooltips and visual feedback
  const getSmartTooltip = React.useCallback((
    action: string,
    shortcut: string,
    isDisabled: boolean,
    currentState?: boolean
  ) => {
    if (isDisabled) {
      if (!selectedNode) {
        return `Select a block to ${action.toLowerCase()}`;
      }
      if (!typographyActive && !currentEditor) {
        return `Select text or a Rich Block to ${action.toLowerCase()}`;
      }
      if (!typographyActive) {
        return `Select text to ${action.toLowerCase()}`;
      }
    }
    
    const stateIndicator = currentState ? ' (currently active)' : '';
    return `${action} (${shortcut})${stateIndicator}`;
  }, [selectedNode, typographyActive, currentEditor]);

  const getDisabledReason = React.useCallback(() => {
    if (!selectedNode) return 'no-selection';
    if (!typographyActive && !currentEditor) return 'no-typography-context';
    if (!typographyActive) return 'no-text-selection';
    if (!currentEditor) return 'no-editor';
    return null;
  }, [selectedNode, typographyActive, currentEditor]);

  const getSmartVariant = React.useCallback((
    isActive: boolean, 
    isDisabled: boolean,
    reason: string | null
  ) => {
    if (isActive) return 'default';
    if (isDisabled && reason === 'no-selection') return 'ghost';
    if (isDisabled) return 'secondary';
    return 'ghost';
  }, []);

  // 🎯 UNIFIED TOOLBAR INTERACTION: SIMPLIFIED for always-visible toolbar
  const handleToolbarMouseDown = React.useCallback((e: React.MouseEvent) => {
    // SIMPLIFIED: No complex interaction state needed for always-visible toolbar
    console.log('[UnifiedToolbar] Toolbar interaction - selection preserved automatically');
  }, []);

  const handleToolbarMouseUp = React.useCallback((e: React.MouseEvent) => {
    // SIMPLIFIED: No complex interaction state needed for always-visible toolbar
  }, []);


  // 🎯 UNIFIED TYPOGRAPHY HANDLER: Works with any selection type
  const handleTypography = React.useCallback(
    async (properties: Record<string, any>) => {
      if (!canApplyTypography) {
        console.log('[UnifiedToolbar] Typography cannot be applied - no valid selection with editor');
        return false;
      }
      
      // M4: Enhanced typography with state synchronization validation
      if (currentSelectionType === 'table-cell') {
        try {
          // Get current session state for validation
          // Apply typography directly (performance manager removed with legacy table system)
          const success = preserveDuringOperation(() => {
            return applyTypography(properties);
          });
          
          if (success) {
            // Typography applied successfully to table cell
            
            console.log('[UnifiedToolbar] Typography applied successfully:', properties);
          } else {
            console.warn('[UnifiedToolbar] Typography application failed:', properties);
          }
          
          return success;
          
        } catch (error) {
          console.error('[UnifiedToolbar] Typography application error:', error);
          return false;
        }
      } else if (tableSelectionState.isSingleCellActive) {
        // SIMPLIFIED: Single-cell typography application for BasicTable
        try {
          console.log(`[UnifiedToolbar] Applying typography to selected table cell:`, properties);
          
          const success = preserveDuringOperation(() => {
            return applyTypography(properties);
          });
          
          if (success) {
            console.log(`[UnifiedToolbar] ✅ Typography applied to table cell successfully:`, properties);
          } else {
            console.warn(`[UnifiedToolbar] ❌ Failed to apply typography to table cell:`, properties);
          }
          
          return success;
          
        } catch (error) {
          console.error('[UnifiedToolbar] Multi-cell typography application error:', error);
          return false;
        }
      } else {
        // Regular typography application for non-table selections
        return preserveDuringOperation(() => {
          const success = applyTypography(properties);
          if (success) {
            console.log('[UnifiedToolbar] Typography applied successfully:', properties);
          } else {
            console.warn('[UnifiedToolbar] Typography application failed:', properties);
          }
          return success;
        });
      }
    },
    [canApplyTypography, applyTypography, preserveDuringOperation, currentSelectionType, tableSelectionState]
  );

  // 🎯 SIMPLIFIED TYPOGRAPHY HANDLERS: All use unified system
  const handleTextAlign = React.useCallback(
    (align: 'left' | 'center' | 'right' | 'justify') => {
      return handleTypography({ textAlign: align });
    },
    [handleTypography]
  );

  const handleFontFamily = React.useCallback(
    (fontFamily: string) => {
      return handleTypography({ fontFamily });
    },
    [handleTypography]
  );

  const handleFontSize = React.useCallback(
    (fontSize: number) => {
      return handleTypography({ fontSize });
    },
    [handleTypography]
  );

  const handleFontWeight = React.useCallback(
    (fontWeight: number) => {
      return handleTypography({ fontWeight });
    },
    [handleTypography]
  );

  const handleTextColor = React.useCallback(
    (color: string) => {
      return handleTypography({ textColor: color });
    },
    [handleTypography]
  );

  const handleBackgroundColor = React.useCallback(
    (backgroundColor: string) => {
      return handleTypography({ backgroundColor });
    },
    [handleTypography]
  );

  const handleHighlight = React.useCallback(() => {
    // Toggle highlight by setting/clearing background color
    const isHighlighted = Boolean(appliedMarks.backgroundColor);
    return handleTypography({ backgroundColor: isHighlighted ? '' : 'hsl(var(--accent))' });
  }, [appliedMarks.backgroundColor, handleTypography]);

  const handleItalic = React.useCallback(() => {
    // Toggle italic by checking current state
    const isItalic = appliedMarks.fontStyle === 'italic';
    return handleTypography({ fontStyle: isItalic ? 'normal' : 'italic' });
  }, [appliedMarks.fontStyle, handleTypography]);

  const handleBold = React.useCallback(() => {
    // Toggle bold by checking current weight
    const isBold = appliedMarks.fontWeight === 700;
    return handleTypography({ fontWeight: isBold ? 400 : 700 });
  }, [appliedMarks.fontWeight, handleTypography]);

  const handleStrikethrough = React.useCallback(() => {
    // Note: Strikethrough implementation depends on TipTap extension
    console.warn('[UnifiedToolbar] Strikethrough requires TipTap extension implementation');
    return false;
  }, []);

  const handleUnderline = React.useCallback(() => {
    if (currentEditor?.chain) {
      currentEditor.chain().focus().toggleUnderline().run();
    }
  }, [currentEditor]);

  const handleTextTransform = React.useCallback(
    (textTransform: string) => {
      return handleTypography({ textTransform });
    },
    [handleTypography]
  );

  const handleLetterSpacing = React.useCallback(
    (letterSpacing: string | number) => {
      return handleTypography({ letterSpacing });
    },
    [handleTypography]
  );

  const handleTextDecoration = React.useCallback(
    (textDecoration: string) => {
      return handleTypography({ textDecoration });
    },
    [handleTypography]
  );

  const handleLineHeight = React.useCallback(
    (lineHeight: number) => {
      return handleTypography({ lineHeight });
    },
    [handleTypography]
  );

  // 🎯 TIPTAP COMMAND HANDLERS: Integrated TipTap functionality for Rich Block editing
  
  // History Controls (MISSING from original UnifiedToolbar)
  const handleUndo = React.useCallback(() => {
    if (currentEditor?.chain) {
      currentEditor.chain().focus().undo().run();
    }
  }, [currentEditor]);

  const handleRedo = React.useCallback(() => {
    if (currentEditor?.chain) {
      currentEditor.chain().focus().redo().run();
    }
  }, [currentEditor]);

  // Text Structure Controls  
  const handleHeading = React.useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      if (currentEditor?.chain) {
        currentEditor.chain().focus().toggleHeading({ level }).run();
      }
    },
    [currentEditor]
  );

  const handleParagraph = React.useCallback(() => {
    if (currentEditor?.chain) {
      currentEditor.chain().focus().setParagraph().run();
    }
  }, [currentEditor]);

  const handleQuote = React.useCallback(() => {
    if (currentEditor?.chain) {
      currentEditor.chain().focus().toggleBlockquote().run();
    }
  }, [currentEditor]);

  // List Controls (MISSING from original UnifiedToolbar)
  const handleBulletList = React.useCallback(() => {
    if (currentEditor?.chain) {
      currentEditor.chain().focus().toggleBulletList().run();
    }
  }, [currentEditor]);

  const handleOrderedList = React.useCallback(() => {
    if (currentEditor?.chain) {
      currentEditor.chain().focus().toggleOrderedList().run();
    }
  }, [currentEditor]);

  // Individual heading handlers removed - now using unified HeadingSelector

  // Heading Selector - Unified Heading Control
  const getCurrentHeadingLevel = React.useCallback((): 1 | 2 | 3 | 4 | 5 | 6 | null => {
    if (!tiptapState) {
      return null;
    }
    
    // Check each heading level in priority order
    if (tiptapState.isHeading1) return 1;
    if (tiptapState.isHeading2) return 2;
    if (tiptapState.isHeading3) return 3;
    if (tiptapState.isHeading4) return 4;
    if (tiptapState.isHeading5) return 5;
    if (tiptapState.isHeading6) return 6;
    
    return null; // Paragraph mode
  }, [tiptapState]);

  const handleHeadingLevelChange = React.useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6 | null) => {
      if (!currentEditor?.chain) return;
      
      if (level === null) {
        // Convert to paragraph
        currentEditor.chain().focus().setParagraph().run();
      } else {
        // Set specific heading level
        currentEditor.chain().focus().toggleHeading({ level }).run();
      }
    },
    [currentEditor]
  );

  // Link Controls (MISSING from original UnifiedToolbar)
  const handleToggleLink = React.useCallback(() => {
    if (!currentEditor?.chain) return;
    
    if (tiptapState?.isLink) {
      currentEditor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt('Enter URL');
      if (url) {
        currentEditor.chain().focus().setLink({ href: url }).run();
      }
    }
  }, [currentEditor, tiptapState?.isLink]);

  // Content Insertion Handlers
  const handleInsertRichBlock = React.useCallback(() => {
    const { addNode } = useEditorStore.getState();
    addNode({
      type: 'richBlock',
      data: {
        content: '<p>Start typing...</p>',
      },
    });
  }, []);

  const handleInsertTable = React.useCallback(() => {
    const { addNode, selectedNodeId, nodes } = useEditorStore.getState();

    // Smart content insertion: Insert into existing Rich Block if selected, otherwise create new block
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const isRichBlockSelected = selectedNode?.type === 'richBlock';
    
    // Check if we have a reliable editor instance for direct insertion
    const hasWorkingEditor = !!(currentEditor && currentEditor.chain && typeof currentEditor.chain === 'function');

    // Create BasicTable content using simplified Reddit-style structure
    const createTableContent = () => {
      const rows = 3;
      const cols = 3;

      // Generate default headers
      const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);

      // Generate empty rows
      const emptyRows = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

      // Generate unique table ID
      const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create TipTap JSON document with BasicTable node (Reddit-inspired simple structure)
      return {
        type: 'doc',
        content: [
          {
            type: 'basicTable',
            attrs: {
              tableData: {
                id: tableId,
                headers,
                rows: emptyRows
              }
            },
          },
        ],
      };
    };

    const tiptapJSON = createTableContent();

    // Try direct insertion into existing RichBlock if we have a working editor
    if (isRichBlockSelected && hasWorkingEditor) {
      const tableData = {
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [['', '', ''], ['', '', ''], ['', '', '']],
        id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      try {
        currentEditor.chain().focus().insertBasicTable(tableData).run();
        console.log('[UnifiedToolbar] BasicTable inserted successfully into existing RichBlock');
        return; // Early return - table inserted into existing Rich Block
      } catch (error) {
        console.warn('[UnifiedToolbar] BasicTable direct insertion failed, falling back to node creation:', error);
        // Continue to fallback method below
      }
    } else if (isRichBlockSelected && !hasWorkingEditor) {
      console.warn('[UnifiedToolbar] RichBlock selected but editor not available, creating new block');
    }

    // UNIFIED ARCHITECTURE: Always create richBlock with table content - ensures all blocks are resizable
    addNode({
      type: 'richBlock',
      data: {
        content: {
          tiptapJSON,
          htmlContent:
            '<table><tbody><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr></tbody></table>',
        },
      },
    });
    console.log('[UnifiedToolbar] New richBlock created with table content - fully resizable');
  }, []);

  // Media Insertion Handlers
  const handleInsertImage = React.useCallback(() => {
    const { addNode, selectedNodeId, nodes } = useEditorStore.getState();

    // Smart content insertion: Insert into existing Rich Block if selected, otherwise create new block
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const isRichBlockSelected = selectedNode?.type === 'richBlock';

    if (isRichBlockSelected && selectedNodeId) {
      // Get registered editor instance for direct insertion
      const editor = getEditor(selectedNodeId);

      if (editor && editor.commands) {
        // Insert image placeholder directly into existing Rich Block using TipTap commands
        editor.commands.setInlineImage({
          src: PLACEHOLDER_IMAGES.default,
          alt: 'Placeholder image',
          placeholder: true,
          objectFit: 'contain',
          size: 'medium',
          width: PLACEHOLDER_DIMENSIONS.image.width,
          height: PLACEHOLDER_DIMENSIONS.image.height,
        });
        return; // Successfully inserted into existing block
      }
    }

    // Fallback: Create new Rich Block with image content
    addNode({
      type: 'richBlock',
      data: {
        content: {
          tiptapJSON: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'inlineImage',
                    attrs: {
                      src: PLACEHOLDER_IMAGES.default,
                      alt: 'Placeholder image',
                      placeholder: true, // Key placeholder flag
                      objectFit: 'contain',
                      size: 'medium',
                      width: PLACEHOLDER_DIMENSIONS.image.width,
                      height: PLACEHOLDER_DIMENSIONS.image.height,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    });
  }, [getEditor]);

  const handleInsertVideo = React.useCallback(() => {
    const { addNode, selectedNodeId, nodes } = useEditorStore.getState();

    // Smart content insertion: Insert into existing Rich Block if selected, otherwise create new block
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const isRichBlockSelected = selectedNode?.type === 'richBlock';

    if (isRichBlockSelected && selectedNodeId) {
      // Get registered editor instance for direct insertion
      const editor = getEditor(selectedNodeId);

      if (editor && editor.commands) {
        // Insert video placeholder directly into existing Rich Block using TipTap commands
        editor.commands.setVideoEmbed({
          src: '', // Empty for placeholder
          placeholder: true,
          width: PLACEHOLDER_DIMENSIONS.video.width,
          height: PLACEHOLDER_DIMENSIONS.video.height,
          objectFit: 'contain',
          size: 'medium',
          provider: 'youtube', // Default provider
          allowFullscreen: true,
        });
        return; // Successfully inserted into existing block
      }
    }

    // Fallback: Create new Rich Block with video content
    addNode({
      type: 'richBlock',
      data: {
        content: {
          tiptapJSON: {
            type: 'doc',
            content: [
              {
                type: 'videoEmbed',
                attrs: {
                  src: '', // Empty for placeholder
                  placeholder: true, // Key placeholder flag
                  width: PLACEHOLDER_DIMENSIONS.video.width,
                  height: PLACEHOLDER_DIMENSIONS.video.height,
                  objectFit: 'contain',
                  size: 'medium',
                  provider: 'youtube', // Default provider
                  allowFullscreen: true,
                },
              },
            ],
          },
        },
      },
    });
  }, [getEditor]);

  // Block Actions Handlers
  const handleDeleteBlock = React.useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      selectNode(null);
    }
  }, [selectedNodeId, deleteNode, selectNode]);

  const handleDuplicateBlock = React.useCallback(() => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  }, [selectedNodeId, duplicateNode]);

  // Canvas Zoom Controls
  const CANVAS_CONFIG = {
    minZoom: 0.5,
    maxZoom: 2.0,
    defaultZoom: 1.0,
  };

  const handleZoomIn = React.useCallback(() => {
    updateCanvasZoom(Math.min(CANVAS_CONFIG.maxZoom, canvasZoom + 0.1));
  }, [canvasZoom, updateCanvasZoom, CANVAS_CONFIG.maxZoom]);

  const handleZoomOut = React.useCallback(() => {
    updateCanvasZoom(Math.max(CANVAS_CONFIG.minZoom, canvasZoom - 0.1));
  }, [canvasZoom, updateCanvasZoom, CANVAS_CONFIG.minZoom]);

  const handleActualSize = React.useCallback(() => {
    updateCanvasZoom(CANVAS_CONFIG.defaultZoom);
  }, [updateCanvasZoom, CANVAS_CONFIG.defaultZoom]);

  return (
    <div
      className={cn('border-b bg-background/95 backdrop-blur-sm h-20 sm:h-24 md:h-20 flex flex-col shadow-sm', className)}
      role="toolbar"
      aria-label="Editor toolbar with formatting and content controls"
    >
      {/* Row 1: Primary Actions (40px height) */}
      <div
        className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 px-1 sm:px-2 py-1 h-10 sm:h-12 md:h-10 overflow-x-auto scrollbar-hide"
        role="group"
        aria-label="Primary editing actions"
      >

        {/* TipTap Controls - History and Structure (ALWAYS VISIBLE) */}
        <div role="group" aria-label="TipTap editor controls" className="flex items-center gap-1">
          {/* History Controls */}
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/10">
            <Button
              variant={getSmartVariant(false, !currentEditor || !tiptapState?.canUndo, !currentEditor ? 'no-editor' : 'no-history')}
              size="sm"
              onClick={handleUndo}
              disabled={!currentEditor || !tiptapState?.canUndo}
              className={cn(
                "h-6 w-6 p-0 transition-all duration-200",
                !currentEditor && "opacity-60",
                !tiptapState?.canUndo && currentEditor && "opacity-75"
              )}
              title={!currentEditor ? "Select a Rich Block to undo" : 
                     !tiptapState?.canUndo ? "No actions to undo" : "Undo (Ctrl+Z)"}
              aria-label="Undo last action"
              aria-describedby={!currentEditor ? 'toolbar-help' : undefined}
            >
              <Undo size={10} />
            </Button>
            <Button
              variant={getSmartVariant(false, !currentEditor || !tiptapState?.canRedo, !currentEditor ? 'no-editor' : 'no-history')}
              size="sm"
              onClick={handleRedo}
              disabled={!currentEditor || !tiptapState?.canRedo}
              className={cn(
                "h-6 w-6 p-0 transition-all duration-200",
                !currentEditor && "opacity-60",
                !tiptapState?.canRedo && currentEditor && "opacity-75"
              )}
              title={!currentEditor ? "Select a Rich Block to redo" : 
                     !tiptapState?.canRedo ? "No actions to redo" : "Redo (Ctrl+Y)"}
              aria-label="Redo last action"
              aria-describedby={!currentEditor ? 'toolbar-help' : undefined}
            >
              <Redo size={10} />
            </Button>
          </div>

          {/* Lists and Structure */}
          <div className="flex items-center gap-0.5 bg-muted/30 rounded-md p-0.5 border border-border/10">
            <Button
              variant={tiptapState?.isBulletList ? 'default' : 'ghost'}
              size="sm"
              onClick={handleBulletList}
              disabled={!currentEditor}
              className="h-6 w-6 p-0"
              title={!currentEditor ? "Select a Rich Block to add lists" : "Bullet List"}
              aria-label="Toggle bullet list"
            >
              <List size={10} />
            </Button>
            <Button
              variant={tiptapState?.isOrderedList ? 'default' : 'ghost'}
              size="sm"
              onClick={handleOrderedList}
              disabled={!currentEditor}
              className="h-6 w-6 p-0"
              title={!currentEditor ? "Select a Rich Block to add lists" : "Numbered List"}
              aria-label="Toggle numbered list"
            >
              <ListOrdered size={10} />
            </Button>
            <Button
              variant={tiptapState?.isQuote ? 'default' : 'ghost'}
              size="sm"
              onClick={handleQuote}
              disabled={!currentEditor}
              className="h-6 w-6 p-0"
              title={!currentEditor ? "Select a Rich Block to add quotes" : "Quote Block"}
              aria-label="Toggle quote block"
            >
              <Quote size={10} />
            </Button>
            <Button
              variant={tiptapState?.isLink ? 'default' : 'ghost'}
              size="sm"
              onClick={handleToggleLink}
              disabled={!currentEditor || !tiptapState?.hasSelection}
              className="h-6 w-6 p-0"
              title={!currentEditor ? "Select text in a Rich Block to add links" : "Insert/Remove Link"}
              aria-label="Toggle link"
            >
              <Link size={10} />
            </Button>
          </div>

          {/* Heading Selector - Unified Dropdown Control */}
          <div className="flex items-center bg-muted/20 rounded-md p-0.5 border border-border/10">
            <HeadingSelector
              key={`heading-selector-${selectedNodeId}-${currentEditor ? 'active' : 'inactive'}`}
              currentLevel={getCurrentHeadingLevel()}
              onLevelChange={handleHeadingLevelChange}
              disabled={!currentEditor}
              compact={true}
              className="text-xs"
            />
          </div>
        </div>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        {/* Format Controls - Ultra-Compact (ALWAYS VISIBLE with smart disabled states) */}
        {/* MIGRATION: Converted from conditional rendering to always-visible */}
        <div role="group" aria-label="Format controls" className="flex items-center gap-1">
            {/* Basic Text Formatting - Ultra-Compact Group */}
            <div
              className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/10"
              role="group"
              aria-label="Text formatting buttons"
            >
              <Button
                variant={getSmartVariant(
                  typographyActive
                    ? appliedMarks.fontWeight === 700
                    : selectedNode?.data?.fontWeight === 700,
                  !typographyActive && !selectedNode,
                  getDisabledReason()
                )}
                size="sm"
                onMouseDown={handleToolbarMouseDown}
                onMouseUp={handleToolbarMouseUp}
                onClick={handleBold}
                disabled={!typographyActive && !selectedNode}
                className={cn(
                  "h-6 w-6 p-0 transition-all duration-200",
                  getDisabledReason() === 'no-selection' && "opacity-60",
                  getDisabledReason() === 'no-text-selection' && "opacity-75"
                )}
                title={getSmartTooltip(
                  'Bold',
                  'Ctrl+B',
                  !typographyActive && !selectedNode,
                  typographyActive ? appliedMarks.fontWeight === 700 : selectedNode?.data?.fontWeight === 700
                )}
                aria-label={tableSelectionState.isSingleCellActive
                  ? "Make selected cell bold"
                  : "Make text bold"}
                aria-pressed={
                  typographyActive
                    ? appliedMarks.fontWeight === 700
                    : selectedNode?.data?.fontWeight === 700
                }
                aria-keyshortcuts="Ctrl+B"
                aria-describedby={getDisabledReason() ? 'toolbar-help' : undefined}
              >
                <Bold size={10} />
              </Button>

              {/* Highlight Button - Enhanced UX with smart disabled states */}
              <Button
                variant={getSmartVariant(
                  typographyActive
                    ? Boolean(appliedMarks.backgroundColor)
                    : Boolean(selectedNode?.data?.backgroundColor),
                  !typographyActive && !selectedNode,
                  getDisabledReason()
                )}
                size="sm"
                onMouseDown={handleToolbarMouseDown}
                onMouseUp={handleToolbarMouseUp}
                onClick={handleHighlight}
                disabled={!typographyActive && !selectedNode}
                className={cn(
                  "h-6 w-6 p-0 transition-all duration-200",
                  getDisabledReason() === 'no-selection' && "opacity-60",
                  getDisabledReason() === 'no-text-selection' && "opacity-75"
                )}
                title={getSmartTooltip(
                  'Highlight',
                  'Ctrl+Shift+H',
                  !typographyActive && !selectedNode,
                  typographyActive ? Boolean(appliedMarks.backgroundColor) : Boolean(selectedNode?.data?.backgroundColor)
                )}
                aria-label="Highlight text"
                aria-pressed={
                  typographyActive
                    ? Boolean(appliedMarks.backgroundColor)
                    : Boolean(selectedNode?.data?.backgroundColor)
                }
                aria-keyshortcuts="Ctrl+Shift+H"
                aria-describedby={getDisabledReason() ? 'toolbar-help' : undefined}
              >
                <Highlighter size={10} />
              </Button>

              {/* Italic Button - Enhanced UX with smart disabled states */}
              <Button
                variant={getSmartVariant(
                  typographyActive
                    ? appliedMarks.fontStyle === 'italic'
                    : selectedNode?.data?.fontStyle === 'italic',
                  !typographyActive && !selectedNode,
                  getDisabledReason()
                )}
                size="sm"
                onMouseDown={handleToolbarMouseDown}
                onMouseUp={handleToolbarMouseUp}
                onClick={handleItalic}
                disabled={!typographyActive && !selectedNode}
                className={cn(
                  "h-6 w-6 p-0 transition-all duration-200",
                  getDisabledReason() === 'no-selection' && "opacity-60",
                  getDisabledReason() === 'no-text-selection' && "opacity-75"
                )}
                title={getSmartTooltip(
                  'Italic',
                  'Ctrl+I',
                  !typographyActive && !selectedNode,
                  typographyActive ? appliedMarks.fontStyle === 'italic' : selectedNode?.data?.fontStyle === 'italic'
                )}
                aria-label={tableSelectionState.isSingleCellActive
                  ? "Toggle italic for selected cell"
                  : "Toggle italic formatting"}
                aria-pressed={
                  typographyActive
                    ? appliedMarks.fontStyle === 'italic'
                    : selectedNode?.data?.fontStyle === 'italic'
                }
                aria-keyshortcuts="Ctrl+I"
                aria-describedby={getDisabledReason() ? 'toolbar-help' : undefined}
              >
                <Italic size={10} />
              </Button>

              {/* Strikethrough Button - Enhanced UX */}
              <Button
                variant={getSmartVariant(false, !typographyActive && !selectedNode, getDisabledReason())}
                size="sm"
                onClick={handleStrikethrough}
                disabled={!typographyActive && !selectedNode}
                className={cn(
                  "h-6 w-6 p-0 transition-all duration-200",
                  getDisabledReason() === 'no-selection' && "opacity-60",
                  getDisabledReason() === 'no-text-selection' && "opacity-75"
                )}
                title={getSmartTooltip('Strikethrough', 'Ctrl+Shift+S', !typographyActive && !selectedNode)}
                aria-label="Toggle strikethrough formatting"
                aria-keyshortcuts="Ctrl+Shift+S"
                aria-describedby={getDisabledReason() ? 'toolbar-help' : undefined}
              >
                <Strikethrough size={10} />
              </Button>

              {/* Underline Button - Enhanced UX */}
              <Button
                variant={getSmartVariant(
                  tiptapState?.isUnderline || false,
                  !currentEditor,
                  !currentEditor ? 'no-editor' : null
                )}
                size="sm"
                onMouseDown={handleToolbarMouseDown}
                onMouseUp={handleToolbarMouseUp}
                onClick={handleUnderline}
                disabled={!currentEditor}
                className={cn(
                  "h-6 w-6 p-0 transition-all duration-200",
                  !currentEditor && "opacity-60"
                )}
                title={!currentEditor ? "Select a Rich Block to underline text" : "Underline (Ctrl+U)"}
                aria-label="Toggle underline formatting"
                aria-pressed={tiptapState?.isUnderline || false}
                aria-keyshortcuts="Ctrl+U"
                aria-describedby={!currentEditor ? 'toolbar-help' : undefined}
              >
                <Underline size={10} />
              </Button>
            </div>

            {/* Text Alignment Controls */}
            <div role="group" aria-label="Text alignment" className="flex items-center gap-1 bg-muted/30 rounded-md p-1 border border-border/10">
                {/* Align Left */}
                <Button
                  variant={
                    typographyActive
                      ? (appliedMarks.textAlign === 'left' || !appliedMarks.textAlign ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'left' || !selectedNode?.data?.textAlign ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => handleTextAlign('left')}
                  disabled={!typographyActive && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Align Left (Ctrl+Shift+L)"
                  aria-label="Align text to the left"
                  aria-pressed={
                    typographyActive
                      ? (appliedMarks.textAlign === 'left' || !appliedMarks.textAlign)
                      : (selectedNode?.data?.textAlign === 'left' || !selectedNode?.data?.textAlign)
                  }
                  aria-keyshortcuts="Ctrl+Shift+L"
                >
                  <AlignLeft size={10} />
                </Button>

                {/* Align Center */}
                <Button
                  variant={
                    typographyActive
                      ? (appliedMarks.textAlign === 'center' ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'center' ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => handleTextAlign('center')}
                  disabled={!typographyActive && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Center Align (Ctrl+Shift+E)"
                  aria-label="Center align text"
                  aria-pressed={
                    typographyActive
                      ? appliedMarks.textAlign === 'center'
                      : selectedNode?.data?.textAlign === 'center'
                  }
                  aria-keyshortcuts="Ctrl+Shift+E"
                >
                  <AlignCenter size={10} />
                </Button>

                {/* Align Right */}
                <Button
                  variant={
                    typographyActive
                      ? (appliedMarks.textAlign === 'right' ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'right' ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => handleTextAlign('right')}
                  disabled={!typographyActive && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Align Right (Ctrl+Shift+R)"
                  aria-label="Align text to the right"
                  aria-pressed={
                    typographyActive
                      ? appliedMarks.textAlign === 'right'
                      : selectedNode?.data?.textAlign === 'right'
                  }
                  aria-keyshortcuts="Ctrl+Shift+R"
                >
                  <AlignRight size={10} />
                </Button>

                {/* Justify */}
                <Button
                  variant={
                    typographyActive
                      ? (appliedMarks.textAlign === 'justify' ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'justify' ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => handleTextAlign('justify')}
                  disabled={!typographyActive && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Justify (Ctrl+Shift+J)"
                  aria-label="Justify text alignment"
                  aria-pressed={
                    typographyActive
                      ? appliedMarks.textAlign === 'justify'
                      : selectedNode?.data?.textAlign === 'justify'
                  }
                  aria-keyshortcuts="Ctrl+Shift+J"
                >
                  <AlignJustify size={10} />
                </Button>
              </div>

            {/* Typography controls moved to Row 2 */}
          </div>
        {/* MIGRATION: Format Controls now always visible */}

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        {/* Content Insertion - Common Tools */}
        <div role="group" aria-label="Content insertion tools" className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsertRichBlock}
              className="h-6 w-6 p-0"
              title="Add text block (Ctrl+Shift+T)"
              aria-label="Add text block"
            >
              <Plus size={10} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsertTable}
              className="h-6 w-6 p-0"
              title="Add table (Ctrl+Shift+T)"
              aria-label="Add table"
            >
              <Table size={10} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsertImage}
              className="h-6 w-6 p-0"
              title="Add image"
              aria-label="Add image"
            >
              <Image size={10} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsertVideo}
              className="h-6 w-6 p-0"
              title="Add video"
              aria-label="Add video"
            >
              <Video size={10} />
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        {/* View Options - Ultra-Compact */}
        <div role="group" aria-label="View options" className="flex items-center gap-1">
          {/* Viewport Preview - Ultra-Compact Group */}
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/10">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-6 px-1.5 border-none"
              title="Mobile preview"
            >
              <Smartphone size={10} />
              <span className="hidden lg:inline text-xs">Mobile</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1 h-6 px-1.5 border-none"
              title="Desktop preview (current)"
            >
              <Monitor size={10} />
              <span className="hidden lg:inline text-xs">Desktop</span>
            </Button>
          </div>

          {/* View Aids - Ultra-Compact */}
          <Button
            variant={showGrid ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleGrid}
            className="h-6 w-6 p-0"
            title={showGrid ? 'Hide grid' : 'Show grid'}
          >
            <Ruler size={10} />
          </Button>

          {/* Canvas Background Color */}
          <UnifiedColorPicker
            value={canvasBackgroundColor}
            onColorSelect={setCanvasBackgroundColor}
            mode="both"
            variant="icon"
            size="sm"
            label="Canvas Background"
            allowClear={false}
            placeholder="hsl(var(--background))"
          />

          <ThemeSelector />
        </div>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        {/* Canvas zoom controls moved to Row 2 */}




        {/* Enhanced Status Message - Always visible with smart context */}
        <div className="flex items-center gap-2 ml-auto">
          
          {/* Visual Status Message */}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {selectedNode ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full opacity-60"></span>
                <span className="hidden sm:inline">Editing: {selectedNode.type.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                <span className="sm:hidden">Editing</span>
                {/* BATCH 1: Enhanced status display with table awareness */}
                {typographyActive && (
                  <span className="text-green-600 hidden md:inline">
                    • {tableSelectionState.isSingleCellActive
                        ? 'Table cell selected'
                        : 'Text selected'
                      }
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-400 rounded-full opacity-60"></span>
                <span className="hidden sm:inline">Select a block to format, or add blocks from sidebar</span>
                <span className="sm:hidden">No selection</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Row 2: Typography & Advanced Controls (40px height) */}
      <div
        className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 px-1 sm:px-2 py-1 h-10 sm:h-12 md:h-10 border-t border-muted/30 overflow-x-auto scrollbar-hide"
        role="group"
        aria-label="Typography and advanced controls"
      >

        {/* BATCH 1: Table Selection Status Indicator */}
        {tableSelectionState.hasTableSelection && (
          <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md px-2 py-1">
            <Table className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Table cell
            </span>
          </div>
        )}

        {/* Enhanced Typography Controls - Selection aware (includes table cells) */}
        <div role="group" aria-label="Typography controls" className="flex items-center gap-1">
          {/* Font Controls Group */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 border border-border/10">
            <Select
              value={appliedMarks.fontFamily || 'inherit'}
              onValueChange={handleFontFamily}
              disabled={!typographyActive && !selectedNode}
            >
              <SelectTrigger 
                className="w-24 sm:w-28 md:w-32 h-6 text-xs border-0 bg-transparent"
                onMouseDown={handleToolbarMouseDown}
                onMouseUp={handleToolbarMouseUp}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(font => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          
            <div className="flex items-center gap-1">
              <AccessibleNumberInput
                value={appliedMarks.fontSize || 16}
                onChange={handleFontSize}
                onMouseDown={handleToolbarMouseDown}
                onMouseUp={handleToolbarMouseUp}
                className="w-16 h-6"
                min={8}
                max={128}
                step={1}
                disabled={!typographyActive && !selectedNode}
                aria-label="Font size"
                title="Font size (8-128px)"
                suffix="px"
              />
            </div>
            
            <Select
              value={(appliedMarks.fontWeight || 400).toString()}
              onValueChange={value => handleFontWeight(parseInt(value))}
              disabled={!typographyActive && !selectedNode}
            >
              <SelectTrigger className="w-16 sm:w-18 md:w-20 h-6 text-xs border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map(weight => (
                  <SelectItem key={weight.value} value={weight.value.toString()}>
                    <span style={{ fontWeight: weight.value }} className="font-display">
                      {weight.label} ({weight.value})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1">
              <AccessibleNumberInput
                value={appliedMarks.lineHeight || 1.4}
                onChange={handleLineHeight}
                className="w-14 h-6"
                min={0.5}
                max={3.0}
                step={0.1}
                precision={1}
                disabled={!typographyActive && !selectedNode}
                aria-label="Line height"
                title="Line height (0.5-3.0)"
              />
            </div>
          </div>

          {/* Color Controls Group */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 border border-border/10">
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground hidden sm:inline">Text:</label>
              <UnifiedColorPicker
                value={appliedMarks.textColor || 'hsl(var(--foreground))'}
                onColorSelect={handleTextColor}
                mode="both"
                variant="icon"
                size="sm"
                label="Text Color"
                allowClear={true}
                customTokens={[
                  { id: 'foreground', name: 'Default', value: 'hsl(var(--foreground))', category: 'primary', description: 'Default text color' },
                  { id: 'text-secondary', name: 'Secondary', value: 'hsl(var(--text-secondary))', category: 'primary', description: 'Secondary text color' },
                  { id: 'primary', name: 'Primary', value: 'hsl(var(--primary))', category: 'primary', description: 'Primary brand color' },
                  { id: 'accent', name: 'Accent', value: 'hsl(var(--accent))', category: 'primary', description: 'Accent color' },
                  { id: 'destructive', name: 'Error', value: 'hsl(var(--destructive))', category: 'semantic', description: 'Error color' },
                  { id: 'success', name: 'Success', value: 'hsl(var(--success))', category: 'semantic', description: 'Success color' },
                ]}
                disabled={!typographyActive && !selectedNode}
              />
            </div>
            
            <div className="flex items-center gap-1">
              <label className="text-xs text-muted-foreground hidden sm:inline">Highlight:</label>
              <HighlightColorPicker
                value={appliedMarks.backgroundColor}
                onColorSelect={handleBackgroundColor}
                onRemoveHighlight={() => handleBackgroundColor('')}
                isActive={Boolean(appliedMarks.backgroundColor)}
                variant="icon"
                size="sm"
              />
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        {/* Canvas Zoom Controls */}
        <div role="group" aria-label="Canvas zoom controls" className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={canvasZoom <= CANVAS_CONFIG.minZoom}
              className="h-6 w-6 p-0"
              title="Zoom out (Ctrl+-)"
              aria-label="Zoom out"
            >
              <ZoomOut size={10} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleActualSize}
              className="h-6 px-2 text-xs"
              title="Reset to actual size (Ctrl+0)"
              aria-label="Reset zoom to 100%"
            >
              {Math.round(canvasZoom * 100)}%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={canvasZoom >= CANVAS_CONFIG.maxZoom}
              className="h-6 w-6 p-0"
              title="Zoom in (Ctrl++)"
              aria-label="Zoom in"
            >
              <ZoomIn size={10} />
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-4 hidden sm:block" />

        {/* Block Actions */}
        <div role="group" aria-label="Block actions" className="flex items-center gap-1">
          <div
            className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5"
            role="group"
            aria-label="Block modification actions"
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDuplicateBlock}
              disabled={!selectedNode}
              className="h-6 w-6 p-0 border-none"
              title={!selectedNode ? "Select a block to duplicate" : "Duplicate block (Ctrl+D)"}
              aria-label={selectedNode ? `Duplicate ${selectedNode.type.replace(/([A-Z])/g, ' $1').toLowerCase()} block` : "Duplicate selected block"}
              aria-keyshortcuts="Ctrl+D"
            >
              <Copy size={10} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteBlock}
              disabled={!selectedNode}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive border-none"
              title={!selectedNode ? "Select a block to delete" : "Delete block (Delete/Backspace)"}
              aria-label={selectedNode ? `Delete ${selectedNode.type.replace(/([A-Z])/g, ' $1').toLowerCase()} block` : "Delete selected block"}
              aria-keyshortcuts="Delete Backspace"
            >
              <Trash2 size={10} />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
});
