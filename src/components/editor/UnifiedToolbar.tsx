// ABOUTME: Unified toolbar containing ALL editor functionality in organized categories to replace fragmented interfaces

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorStore } from '@/store/editorStore';
import { useTheme } from '@/components/providers/CustomThemeProvider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
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
  HelpCircle,
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
} from 'lucide-react';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { ThemeSelector } from '@/components/header/ThemeSelector';
import { useTextSelection } from '@/hooks/useTextSelection';
import { PLACEHOLDER_IMAGES, PLACEHOLDER_DIMENSIONS } from './shared/mediaConstants';
import { HighlightColorPicker } from './shared/HighlightColorPicker';
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  TEXT_TRANSFORMS,
  TEXT_DECORATIONS,
} from './shared/typography-system';
import { createTypographyCommands } from './shared/typography-commands';
import { useTableSelectionCoordination } from './extensions/Table/selection/useTableSelectionCoordination';
import { tableSelectionCoordinator } from './extensions/Table/selection/TableSelectionCoordinator';
// Removed distracting visual selection feedback - keeping it simple like Google Docs

// F1.1: Extract applied marks from table cell editor
const getTableCellAppliedMarks = (editor: any) => {
  try {
    if (!editor || !editor.getAttributes) {
      return {};
    }

    // Extract typography marks from the table cell editor
    return {
      fontFamily: editor.getAttributes('fontFamily')?.fontFamily || 'inherit',
      fontSize: editor.getAttributes('fontSize')?.fontSize || 16,
      fontWeight: editor.getAttributes('fontWeight')?.fontWeight || 400,
      fontStyle: editor.isActive('italic') ? 'italic' : 'normal',
      textColor: editor.getAttributes('textColor')?.color || '#000000',
      backgroundColor: editor.getAttributes('highlight')?.color || editor.getAttributes('backgroundColor')?.backgroundColor || '',
      textAlign: editor.getAttributes('textAlign')?.textAlign || 'left',
      textTransform: editor.getAttributes('textTransform')?.textTransform || 'none',
      letterSpacing: editor.getAttributes('letterSpacing')?.letterSpacing || 'normal',
      textDecoration: editor.getAttributes('textDecoration')?.textDecoration || 'none',
      lineHeight: editor.getAttributes('lineHeight')?.lineHeight || 1.4,
    };
  } catch (error) {
    console.warn('Failed to extract table cell applied marks:', error);
    return {};
  }
};

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
    showSnapGuides,
    toggleSnapGuides,
    canvasZoom,
    updateCanvasZoom,
    getEditor,
  } = useEditorStore();

  // Enhanced Text Selection Hook with TipTap integration
  const { textSelection, applyTypographyToSelection, extractTextProperties } = useTextSelection();
  
  // Table Selection Coordination Hook
  const {
    hasTableCellSelection,
    focusedCell,
    selectionContext: tableSelectionContext,
    canApplyTypography: canApplyTableTypography,
    getActiveTypographyCommands: getTableTypographyCommands,
    applyTypographyToSelection: applyTableTypography,
  } = useTableSelectionCoordination();


  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Selection-based typography state
  const hasTextSelection = textSelection?.hasSelection ?? false;
  const isTipTapSelection = textSelection?.isTipTapSelection ?? false;
  const selectionEditor = textSelection?.editor;

  // F1.1: Enhanced applied marks extraction with table cell support
  const appliedMarks = useMemo(() => {
    // Priority 1: Table cell selection marks
    if (hasTableCellSelection && focusedCell?.editor) {
      return getTableCellAppliedMarks(focusedCell.editor);
    }
    
    // Priority 2: Regular text selection marks
    return textSelection?.appliedMarks ?? {};
  }, [hasTableCellSelection, focusedCell?.editor, textSelection?.appliedMarks]);

  // Typography commands instance for current selection
  const typographyCommands = useMemo(() => {
    return selectionEditor ? createTypographyCommands(selectionEditor) : null;
  }, [selectionEditor]);

  // Modern selection-based typography handles all content types
  // No need for block-level typography fallback

  // Simplified typography system priority - selection-based only
  // Priority 1: Table cell selection (highest priority)
  const useTableCellTypography = hasTableCellSelection && canApplyTableTypography();
  // Priority 2: Regular text selection (fallback)
  const useSelectionTypography = !useTableCellTypography && hasTextSelection && isTipTapSelection && typographyCommands;

  // Typography system active state
  const typographyActive = useTableCellTypography || useSelectionTypography;

  // 🎯 PHASE 2: Toolbar interaction preservation helpers
  const handleToolbarMouseDown = React.useCallback((e: React.MouseEvent) => {
    // Prevent table cell selection from being cleared during toolbar interactions
    if (hasTableCellSelection) {
      tableSelectionCoordinator.startToolbarInteraction();
      console.log('[UnifiedToolbar] Toolbar interaction started - preserving table cell selection');
    }
  }, [hasTableCellSelection]);

  const handleToolbarMouseUp = React.useCallback((e: React.MouseEvent) => {
    // End toolbar interaction after operation completes
    if (hasTableCellSelection) {
      tableSelectionCoordinator.endToolbarInteraction();
      console.log('[UnifiedToolbar] Toolbar interaction ended');
    }
  }, [hasTableCellSelection]);


  // Enhanced Typography Handlers with coordinated table cell support
  const handleSelectionTypography = React.useCallback(
    (properties: Record<string, any>) => {
      // Priority 1: Apply to table cell selection
      if (useTableCellTypography) {
        return applyTableTypography(properties);
      }
      
      // Priority 2: Apply to regular text selection
      if (typographyCommands) {
        const result = typographyCommands.applyProperties(properties);
        if (!result.success) {
          console.warn('Typography application failed:', result.errors);
        }
        return result.success;
      }
      
      return false;
    },
    [useTableCellTypography, applyTableTypography, typographyCommands]
  );

  const handleTextAlign = React.useCallback(
    (align: 'left' | 'center' | 'right' | 'justify') => {
      // Apply to selected text in TipTap editor
      if (useSelectionTypography) {
        // Note: TipTap text alignment is typically handled at the node level, not mark level
        // For now, we'll use the legacy approach for alignment but could be enhanced
        applyTypographyToSelection({ textAlign: align });
        return;
      }

      // Legacy block-level alignment removed in favor of selection-based typography
      console.warn('Text alignment requires text selection - please select text within a block');
    },
    [
      useSelectionTypography,
      applyTypographyToSelection,
    ]
  );

  const handleTextFormat = React.useCallback(
    (property: string, value: any) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ [property]: value });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn(`Text formatting requires text selection - please select text to apply ${property}`);
      return false;
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  // Enhanced Typography handlers with TipTap mark integration
  const handleFontFamily = React.useCallback(
    (fontFamily: string) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ fontFamily });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Font family requires text selection - please select text to apply font family');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleFontSize = React.useCallback(
    (fontSize: number) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ fontSize });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Font size requires text selection - please select text to apply font size');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleFontWeight = React.useCallback(
    (fontWeight: number) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ fontWeight });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Font weight requires text selection - please select text to apply font weight');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleTextColor = React.useCallback(
    (color: string) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ textColor: color });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Text color requires text selection - please select text to apply color');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleBackgroundColor = React.useCallback(
    (backgroundColor: string) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ backgroundColor });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Background color requires text selection - please select text to apply background color');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleHighlight = React.useCallback(
    () => {
      // Priority 1: Table cell selection highlighting
      if (useTableCellTypography) {
        const commands = getTableTypographyCommands();
        if (commands) {
          const result = commands.toggleHighlight();
          return result.success;
        }
      }

      // Priority 2: Use TipTap toggleHighlight command for selection-based highlighting
      if (useSelectionTypography && typographyCommands) {
        const result = typographyCommands.toggleHighlight();
        return result.success;
      }

      // Legacy block-level highlighting removed in favor of selection-based typography
      console.warn('Highlighting requires text selection - please select text to apply highlight');
      
      return false;
    },
    [
      useTableCellTypography,
      getTableTypographyCommands,
      useSelectionTypography,
      typographyCommands,
    ]
  );

  const handleItalic = React.useCallback(
    () => {
      // Priority 1: Table cell selection italic
      if (useTableCellTypography) {
        const commands = getTableTypographyCommands();
        if (commands && commands.editor) {
          return commands.editor.commands.toggleItalic();
        }
      }

      // Priority 2: Use TipTap toggleItalic command for selection-based formatting
      if (useSelectionTypography && typographyCommands && typographyCommands.editor) {
        return typographyCommands.editor.commands.toggleItalic();
      }

      console.warn('Italic requires text selection - please select text to apply italic formatting');
      return false;
    },
    [
      useTableCellTypography,
      getTableTypographyCommands,
      useSelectionTypography,
      typographyCommands,
    ]
  );

  const handleStrikethrough = React.useCallback(
    () => {
      // Priority 1: Table cell selection strikethrough
      if (useTableCellTypography) {
        const commands = getTableTypographyCommands();
        if (commands && commands.editor) {
          return commands.editor.commands.toggleStrike();
        }
      }

      // Priority 2: Use TipTap toggleStrike command for selection-based formatting
      if (useSelectionTypography && typographyCommands && typographyCommands.editor) {
        return typographyCommands.editor.commands.toggleStrike();
      }

      console.warn('Strikethrough requires text selection - please select text to apply strikethrough formatting');
      return false;
    },
    [
      useTableCellTypography,
      getTableTypographyCommands,
      useSelectionTypography,
      typographyCommands,
    ]
  );

  const handleUnderline = React.useCallback(
    () => {
      // Note: TipTap StarterKit doesn't include underline by default
      // We would need to add the Underline extension to support this
      console.warn('Underline mark not yet implemented - requires TipTap Underline extension');
      return false;
    },
    []
  );

  const handleTextTransform = React.useCallback(
    (textTransform: string) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ textTransform });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Text transform requires text selection - please select text to apply text transform');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleLetterSpacing = React.useCallback(
    (letterSpacing: string | number) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ letterSpacing });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Letter spacing requires text selection - please select text to apply letter spacing');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleTextDecoration = React.useCallback(
    (textDecoration: string) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        return handleSelectionTypography({ textDecoration });
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Text decoration requires text selection - please select text to apply text decoration');
    },
    [
      useSelectionTypography,
      handleSelectionTypography,
    ]
  );

  const handleLineHeight = React.useCallback(
    (lineHeight: number) => {
      // Apply to selected text using TipTap marks
      if (useSelectionTypography) {
        // Note: Line height is typically a node-level property in TipTap, not a mark
        // For now, we'll use the legacy approach but this could be enhanced with custom marks
        applyTypographyToSelection({ lineHeight: String(lineHeight) });
        return;
      }

      // Legacy block-level formatting removed in favor of selection-based typography
      console.warn('Line height requires text selection - please select text to apply line height');
    },
    [
      useSelectionTypography,
      applyTypographyToSelection,
    ]
  );


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

    // Import the helper function inline to avoid circular dependencies
    const createTableContent = () => {
      const rows = 3;
      const cols = 3;
      const withHeaderRow = true;

      // Generate default headers
      const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);

      // Generate empty rows
      const emptyRows = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

      // Generate unique table ID
      const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create TipTap JSON document with table node
      return {
        type: 'doc',
        content: [
          {
            type: 'customTable',
            attrs: {
              tableId,
              headers: withHeaderRow ? headers : [],
              rows: emptyRows,
              styling: {
                borderStyle: 'solid',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                backgroundColor: 'transparent',
                headerBackgroundColor: '#f8fafc',
                cellPadding: 12,
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 400,
                striped: false,
                compact: false,
              },
              settings: {
                sortable: false,
                resizable: true,
                showHeaders: withHeaderRow,
                minRows: 1,
                maxRows: 50,
              },
            },
          },
        ],
      };
    };

    const tiptapJSON = createTableContent();

    if (isRichBlockSelected) {
      // TODO: Insert table into existing Rich Block using TipTap commands
      // This requires access to the TipTap editor instance from the selected Rich Block
      // For now, we'll create a new block but this should be enhanced
      console.log('TODO: Insert table into existing Rich Block', selectedNodeId);
    }

    // Fallback: Create new Rich Block with table content
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
      className={cn('border-b bg-background flex items-center px-2 py-1 h-10', className)}
      role="toolbar"
      aria-label="Editor toolbar with formatting and content controls"
    >
      {/* Single Row: Ultra-Compact Layout (40px fixed height) */}
      <div
        className="flex items-center gap-2 flex-1 min-w-0"
        role="group"
        aria-label="Main toolbar actions"
      >

        {/* Format Controls - Ultra-Compact (Selection Typography-aware + Table Cell support) */}
        {(useSelectionTypography || useTableCellTypography) && (
          <div role="group" aria-label="Format controls" className="flex items-center gap-1">
            {/* Basic Text Formatting - Ultra-Compact Group */}
            <div
              className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5"
              role="group"
              aria-label="Text formatting buttons"
            >
              {(useSelectionTypography || useTableCellTypography) && (
                <Button
                  variant={
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.fontWeight === 700 ? 'default' : 'ghost')
                      : (selectedNode?.data?.fontWeight === 700 ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      // Use typography commands for selection-based formatting (including table cells)
                      const currentWeight = appliedMarks.fontWeight;
                      const isBold = currentWeight === 700;
                      handleFontWeight(isBold ? 400 : 700);
                    } else {
                      // Use legacy block-based formatting
                      handleTextFormat(
                        'fontWeight',
                        selectedNode?.data?.fontWeight === 700 ? 400 : 700
                      );
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Bold (Ctrl+B)"
                  aria-label={`Make text bold${
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.fontWeight === 700 ? ' (currently active)' : '')
                      : (selectedNode?.data?.fontWeight === 700 ? ' (currently active)' : '')
                  }`}
                  aria-pressed={
                    (useSelectionTypography || useTableCellTypography)
                      ? appliedMarks.fontWeight === 700
                      : selectedNode?.data?.fontWeight === 700
                  }
                  aria-keyshortcuts="Ctrl+B"
                >
                  <Bold size={10} />
                </Button>
              )}

              {/* Highlight Button - Works with selection-based typography and table cells */}
              {(useSelectionTypography || useTableCellTypography) && (
                <Button
                  variant={
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.backgroundColor ? 'default' : 'ghost')
                      : (selectedNode?.data?.backgroundColor ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      // Use typography commands for selection-based highlighting (including table cells)
                      handleHighlight();
                    } else {
                      // Use legacy block-based formatting
                      const currentBackground = selectedNode?.data?.backgroundColor;
                      const isHighlighted = Boolean(currentBackground);
                      handleBackgroundColor(isHighlighted ? '' : '#ffeb3b');
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Highlight text (Ctrl+Shift+H)"
                  aria-label={`Highlight text${
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.backgroundColor ? ' (currently active)' : '')
                      : (selectedNode?.data?.backgroundColor ? ' (currently active)' : '')
                  }`}
                  aria-pressed={
                    (useSelectionTypography || useTableCellTypography)
                      ? Boolean(appliedMarks.backgroundColor)
                      : Boolean(selectedNode?.data?.backgroundColor)
                  }
                  aria-keyshortcuts="Ctrl+Shift+H"
                >
                  <Highlighter size={10} />
                </Button>
              )}

              {/* Italic Button */}
              {(useSelectionTypography || useTableCellTypography || selectedNode) && (
                <Button
                  variant={
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.fontStyle === 'italic' ? 'default' : 'ghost')
                      : (selectedNode?.data?.fontStyle === 'italic' ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      handleItalic();
                    } else {
                      handleTextFormat('fontStyle', 
                        selectedNode?.data?.fontStyle === 'italic' ? 'normal' : 'italic'
                      );
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Italic (Ctrl+I)"
                  aria-label="Toggle italic formatting"
                  aria-pressed={
                    (useSelectionTypography || useTableCellTypography)
                      ? appliedMarks.fontStyle === 'italic'
                      : selectedNode?.data?.fontStyle === 'italic'
                  }
                  aria-keyshortcuts="Ctrl+I"
                >
                  <Italic size={10} />
                </Button>
              )}

              {/* Strikethrough Button */}
              {(useSelectionTypography || useTableCellTypography || selectedNode) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      handleStrikethrough();
                    } else {
                      console.warn('Strikethrough not supported for block-level formatting');
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Strikethrough (Ctrl+Shift+S)"
                  aria-label="Toggle strikethrough formatting"
                  aria-keyshortcuts="Ctrl+Shift+S"
                >
                  <Strikethrough size={10} />
                </Button>
              )}

              {/* Underline Button - Note: Requires TipTap Underline extension */}
              {(useSelectionTypography || useTableCellTypography || selectedNode) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      handleUnderline();
                    } else {
                      console.warn('Underline not supported for block-level formatting');
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0 opacity-50"
                  title="Underline (Not yet implemented)"
                  aria-label="Toggle underline formatting (not yet implemented)"
                >
                  <Underline size={10} />
                </Button>
              )}
            </div>

            {/* Text Alignment Controls */}
            {(useSelectionTypography || useTableCellTypography || selectedNode) && (
              <div role="group" aria-label="Text alignment" className="flex items-center gap-1 bg-muted/20 rounded-md p-1">
                {/* Align Left */}
                <Button
                  variant={
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.textAlign === 'left' || !appliedMarks.textAlign ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'left' || !selectedNode?.data?.textAlign ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      handleTextAlign('left');
                    } else {
                      handleTextFormat('textAlign', 'left');
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Align Left (Ctrl+Shift+L)"
                  aria-label="Align text to the left"
                  aria-pressed={
                    (useSelectionTypography || useTableCellTypography)
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
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.textAlign === 'center' ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'center' ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      handleTextAlign('center');
                    } else {
                      handleTextFormat('textAlign', 'center');
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Center Align (Ctrl+Shift+E)"
                  aria-label="Center align text"
                  aria-pressed={
                    (useSelectionTypography || useTableCellTypography)
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
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.textAlign === 'right' ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'right' ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      handleTextAlign('right');
                    } else {
                      handleTextFormat('textAlign', 'right');
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Align Right (Ctrl+Shift+R)"
                  aria-label="Align text to the right"
                  aria-pressed={
                    (useSelectionTypography || useTableCellTypography)
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
                    (useSelectionTypography || useTableCellTypography)
                      ? (appliedMarks.textAlign === 'justify' ? 'default' : 'ghost')
                      : (selectedNode?.data?.textAlign === 'justify' ? 'default' : 'ghost')
                  }
                  size="sm"
                  onMouseDown={handleToolbarMouseDown}
                  onMouseUp={handleToolbarMouseUp}
                  onClick={() => {
                    if (useSelectionTypography || useTableCellTypography) {
                      handleTextAlign('justify');
                    } else {
                      handleTextFormat('textAlign', 'justify');
                    }
                  }}
                  disabled={!(useSelectionTypography || useTableCellTypography) && !selectedNode}
                  className="h-6 w-6 p-0"
                  title="Justify (Ctrl+Shift+J)"
                  aria-label="Justify text alignment"
                  aria-pressed={
                    (useSelectionTypography || useTableCellTypography)
                      ? appliedMarks.textAlign === 'justify'
                      : selectedNode?.data?.textAlign === 'justify'
                  }
                  aria-keyshortcuts="Ctrl+Shift+J"
                >
                  <AlignJustify size={10} />
                </Button>
              </div>
            )}

            {/* Enhanced Typography Controls - Selection aware (includes table cells) */}
            {(useSelectionTypography || useTableCellTypography) && (
              <div role="group" aria-label="Typography controls" className="flex items-center gap-1">
                {/* Row 1: Font Family, Size, Weight */}
                <div className="flex items-center gap-1 bg-muted/20 rounded-md p-1">
                    {(useSelectionTypography || useTableCellTypography) && (
                    <Select
                      value={appliedMarks.fontFamily || 'inherit'}
                      onValueChange={handleFontFamily}
                    >
                      <SelectTrigger 
                        className="w-32 h-6 text-xs border-0 bg-transparent"
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
                  )}
                  
                  {(useSelectionTypography || useTableCellTypography) && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={appliedMarks.fontSize || 16}
                        onChange={e => handleFontSize(parseInt(e.target.value) || 16)}
                        onMouseDown={handleToolbarMouseDown}
                        onMouseUp={handleToolbarMouseUp}
                        className="w-12 h-6 text-xs border-0 bg-transparent text-center"
                        min={8}
                        max={128}
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  )}
                  
                  {(useSelectionTypography || useTableCellTypography) && (
                    <Select
                      value={(appliedMarks.fontWeight || 400).toString()}
                      onValueChange={value => handleFontWeight(parseInt(value))}
                    >
                      <SelectTrigger className="w-20 h-6 text-xs border-0 bg-transparent">
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
                  )}
                  
                  {(useSelectionTypography || useTableCellTypography) && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={appliedMarks.lineHeight || 1.4}
                        onChange={e => handleLineHeight(parseFloat(e.target.value) || 1.4)}
                        className="w-12 h-6 text-xs border-0 bg-transparent text-center"
                        min={0.5}
                        max={3}
                        step={0.1}
                        title="Line height"
                      />
                      <span className="text-xs text-muted-foreground">lh</span>
                    </div>
                  )}
                  </div>

                {/* Row 2: Text Color and Background Color Controls */}
                <div className="flex items-center gap-1 bg-muted/20 rounded-md p-1">
                  {(useSelectionTypography || useTableCellTypography) && (
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-muted-foreground">Color:</label>
                      <Input
                        type="color"
                        value={appliedMarks.textColor || '#000000'}
                        onChange={e => handleTextColor(e.target.value)}
                        onMouseDown={handleToolbarMouseDown}
                        onMouseUp={handleToolbarMouseUp}
                        className="w-8 h-6 border-0 bg-transparent cursor-pointer"
                        title="Text color"
                        aria-label="Choose text color"
                      />
                    </div>
                  )}
                  
                  {(useSelectionTypography || useTableCellTypography) && (
                    <HighlightColorPicker
                      value={appliedMarks.backgroundColor}
                      onColorSelect={handleBackgroundColor}
                      onRemoveHighlight={() => handleBackgroundColor('')}
                      isActive={Boolean(appliedMarks.backgroundColor)}
                      variant="icon"
                      size="sm"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        <Separator orientation="vertical" className="h-4" />

        {/* Content Insertion - Common Tools */}
        <div role="group" aria-label="Content insertion tools" className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5">
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

        <Separator orientation="vertical" className="h-4" />

        {/* View Options - Ultra-Compact */}
        <div role="group" aria-label="View options" className="flex items-center gap-1">
          {/* Viewport Preview - Ultra-Compact Group */}
          <div className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-6 px-1.5 border-none"
              title="Mobile preview"
            >
              <Smartphone size={10} />
              <span className="hidden xl:inline text-xs">Mobile</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1 h-6 px-1.5 border-none"
              title="Desktop preview (current)"
            >
              <Monitor size={10} />
              <span className="hidden xl:inline text-xs">Desktop</span>
            </Button>
          </div>

          {/* View Aids - Ultra-Compact */}
          <Button
            variant={showSnapGuides ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleSnapGuides}
            className="h-6 w-6 p-0"
            title={showSnapGuides ? 'Hide snap guides' : 'Show snap guides'}
          >
            <Ruler size={10} />
          </Button>

          <ThemeSelector />
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Canvas Zoom Controls - Ultra-Compact */}
        <div role="group" aria-label="Canvas zoom controls" className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5">
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


        {/* Help and Shortcuts - Ultra-Compact */}
        <div role="group" aria-label="Help and shortcuts" className="flex items-center gap-1">
          <KeyboardShortcutsPanel />

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 h-6 px-1.5"
            title="Help and documentation"
          >
            <HelpCircle size={10} />
            <span className="hidden xl:inline text-xs">Help</span>
          </Button>
        </div>

        {/* Block Actions - Inline when selected */}
        {selectedNode && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label="Selected block controls"
            >
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0.5 h-6 flex items-center"
                role="status"
                aria-live="polite"
                aria-label={`Currently selected: ${selectedNode.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`}
              >
                {selectedNode.type
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())}
              </Badge>

              {/* Block Actions - Ultra-Compact */}
              <div
                className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5"
                role="group"
                aria-label="Block actions"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDuplicateBlock}
                  className="h-6 w-6 p-0 border-none"
                  title="Duplicate block (Ctrl+D)"
                  aria-label={`Duplicate ${selectedNode.type.replace(/([A-Z])/g, ' $1').toLowerCase()} block`}
                  aria-keyshortcuts="Ctrl+D"
                >
                  <Copy size={10} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteBlock}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive border-none"
                  title="Delete block (Delete/Backspace)"
                  aria-label={`Delete ${selectedNode.type.replace(/([A-Z])/g, ' $1').toLowerCase()} block`}
                  aria-keyshortcuts="Delete Backspace"
                >
                  <Trash2 size={10} />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* No Selection Message - Compact */}
        {!selectedNode && (
          <span className="text-xs text-muted-foreground ml-auto">
            Select a block to format, or add blocks from sidebar
          </span>
        )}
      </div>
    </div>
  );
});
