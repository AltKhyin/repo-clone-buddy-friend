// ABOUTME: Unified toolbar containing ALL editor functionality in organized categories to replace fragmented interfaces

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorStore } from '@/store/editorStore';
import { useTheme } from '@/components/providers/CustomThemeProvider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  isBlockTypographySupported,
  getBlockTypographyProperties,
  getBlockTypographyContext,
  hasBlockCaptionSupport,
  hasBlockCellSupport,
  hasBlockMultipleTextElements,
  validateBlockTypographyProperties,
  mergeBlockTypographyProperties,
} from '@/utils/blockTypographyUtils';
import {
  Bold,
  Italic,
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
  BarChart3,
  Plus,
} from 'lucide-react';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { ThemeSelector } from '@/components/header/ThemeSelector';
import { TypographyDropdown } from './TypographyDropdown';
import { useTextSelection } from '@/hooks/useTextSelection';

interface UnifiedToolbarProps {
  className?: string;
}

export const UnifiedToolbar = React.memo(function UnifiedToolbar({
  className,
}: UnifiedToolbarProps) {
  const { reviewId } = useParams<{ reviewId: string }>();
  const {
    selectedNodeId,
    textSelection,
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
  } = useEditorStore();

  // Text Selection Hook for unified typography editing
  const { applyTypographyToSelection, extractTextProperties } = useTextSelection();

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Block Typography Context - memoized to prevent dependency changes
  const blockTypographySupported = selectedNode
    ? isBlockTypographySupported(selectedNode.type)
    : false;
  const blockTypographyProperties = useMemo(
    () => (selectedNode ? getBlockTypographyProperties(selectedNode.type) : []),
    [selectedNode]
  );
  const blockTypographyContext = selectedNode ? getBlockTypographyContext(selectedNode.type) : null;

  // Block Special Features
  const hasCaption = selectedNode ? hasBlockCaptionSupport(selectedNode.type) : false;
  const hasCells = selectedNode ? hasBlockCellSupport(selectedNode.type) : false;
  const hasMultipleTextElements = selectedNode
    ? hasBlockMultipleTextElements(selectedNode.type)
    : false;

  // Format Operations Handlers - Enhanced for text selection
  const handleTextAlign = React.useCallback(
    (align: 'left' | 'center' | 'right' | 'justify') => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ textAlign: align });
        return;
      }

      // Priority 2: Fall back to block-level alignment
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('textAlign')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, textAlign: align },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleTextFormat = React.useCallback(
    (property: string, value: any) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ [property]: value });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        // Validate the property is supported by the current block type
        if (blockTypographyProperties.includes(property as any)) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, [property]: value },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  // Typography handlers with text selection support
  const handleTextDecoration = React.useCallback(
    (textDecoration: string) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ textDecoration });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('textDecoration')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, textDecoration },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleFontFamily = React.useCallback(
    (fontFamily: string) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ fontFamily });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('fontFamily')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, fontFamily },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleFontSize = React.useCallback(
    (fontSize: number) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ fontSize: `${fontSize}px` });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('fontSize')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, fontSize },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleFontWeight = React.useCallback(
    (fontWeight: number) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ fontWeight: String(fontWeight) });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('fontWeight')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, fontWeight },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleLineHeight = React.useCallback(
    (lineHeight: number) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ lineHeight: String(lineHeight) });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('lineHeight')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, lineHeight },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleTextTransform = React.useCallback(
    (textTransform: string) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ textTransform });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('textTransform')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, textTransform },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleTextColor = React.useCallback(
    (color: string) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ color });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('color')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, color },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
    ]
  );

  const handleLetterSpacing = React.useCallback(
    (letterSpacing: number) => {
      // Priority 1: Apply to selected text if available
      if (textSelection?.hasSelection) {
        applyTypographyToSelection({ letterSpacing: `${letterSpacing}px` });
        return;
      }

      // Priority 2: Fall back to block-level formatting
      if (selectedNodeId && selectedNode && blockTypographySupported) {
        if (blockTypographyProperties.includes('letterSpacing')) {
          updateNode(selectedNodeId, {
            data: { ...selectedNode.data, letterSpacing },
          });
        }
      }
    },
    [
      textSelection,
      applyTypographyToSelection,
      selectedNodeId,
      selectedNode,
      updateNode,
      blockTypographySupported,
      blockTypographyProperties,
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

  const handleInsertPoll = React.useCallback(() => {
    const { addNode, selectedNodeId, nodes } = useEditorStore.getState();

    // Smart content insertion: Insert into existing Rich Block if selected, otherwise create new block
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const isRichBlockSelected = selectedNode?.type === 'richBlock';

    // Import the helper function inline to avoid circular dependencies
    const createPollContent = () => {
      const question = 'What is your opinion?';
      const pollOptions = ['Option 1', 'Option 2'];
      const allowMultiple = false;
      const showResults = true;

      // Generate unique poll ID
      const pollId = `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create option objects with IDs
      const formattedOptions = pollOptions.map((text, index) => ({
        id: `option-${index + 1}-${Date.now()}`,
        text,
        votes: 0,
      }));

      const now = new Date().toISOString();

      // Create TipTap JSON document with poll node
      return {
        type: 'doc',
        content: [
          {
            type: 'customPoll',
            attrs: {
              pollId,
              question,
              options: formattedOptions,
              settings: {
                allowMultiple,
                showResults,
                allowAnonymous: true,
                requireLogin: false,
              },
              metadata: {
                totalVotes: 0,
                uniqueVoters: 0,
                createdAt: now,
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
              userVotes: [],
            },
          },
        ],
      };
    };

    const tiptapJSON = createPollContent();

    if (isRichBlockSelected) {
      // TODO: Insert poll into existing Rich Block using TipTap commands
      // This requires access to the TipTap editor instance from the selected Rich Block
      // For now, we'll create a new block but this should be enhanced
      console.log('TODO: Insert poll into existing Rich Block', selectedNodeId);
    }

    // Fallback: Create new Rich Block with poll content
    addNode({
      type: 'richBlock',
      data: {
        content: {
          tiptapJSON,
          htmlContent:
            '<div data-type="customPoll" data-question="What do you think?" data-options="[&quot;Option 1&quot;, &quot;Option 2&quot;, &quot;Option 3&quot;]" data-allow-multiple="false"></div>',
        },
      },
    });
  }, []);

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
        {/* Format Controls - Ultra-Compact (Typography-aware) */}
        {blockTypographySupported && (
          <div role="group" aria-label="Format controls" className="flex items-center gap-1">
            {/* Basic Text Formatting - Ultra-Compact Group */}
            <div
              className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5"
              role="group"
              aria-label="Text formatting buttons"
            >
              {blockTypographyProperties.includes('fontWeight') && (
                <Button
                  variant={selectedNode?.data?.fontWeight === 700 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() =>
                    handleTextFormat(
                      'fontWeight',
                      selectedNode?.data?.fontWeight === 700 ? 400 : 700
                    )
                  }
                  disabled={!selectedNode}
                  className="h-6 w-6 p-0"
                  title="Bold (Ctrl+B)"
                  aria-label={`Make text bold${selectedNode?.data?.fontWeight === 700 ? ' (currently active)' : ''}`}
                  aria-pressed={selectedNode?.data?.fontWeight === 700}
                  aria-keyshortcuts="Ctrl+B"
                >
                  <Bold size={10} />
                </Button>
              )}

              {blockTypographyProperties.includes('fontStyle') && (
                <Button
                  variant={selectedNode?.data?.fontStyle === 'italic' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() =>
                    handleTextFormat(
                      'fontStyle',
                      selectedNode?.data?.fontStyle === 'italic' ? 'normal' : 'italic'
                    )
                  }
                  disabled={!selectedNode}
                  className="h-6 w-6 p-0"
                  title="Italic (Ctrl+I)"
                >
                  <Italic size={10} />
                </Button>
              )}

              {blockTypographyProperties.includes('textDecoration') && (
                <>
                  <Button
                    variant={
                      selectedNode?.data?.textDecoration === 'underline' ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      handleTextDecoration(
                        selectedNode?.data?.textDecoration === 'underline' ? 'none' : 'underline'
                      )
                    }
                    disabled={!selectedNode}
                    className="h-6 w-6 p-0"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline size={10} />
                  </Button>

                  <Button
                    variant={
                      selectedNode?.data?.textDecoration === 'line-through' ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() =>
                      handleTextDecoration(
                        selectedNode?.data?.textDecoration === 'line-through'
                          ? 'none'
                          : 'line-through'
                      )
                    }
                    disabled={!selectedNode}
                    className="h-6 w-6 p-0"
                    title="Strikethrough"
                  >
                    <Strikethrough size={10} />
                  </Button>
                </>
              )}
            </div>

            {/* Text Alignment - Ultra-Compact Group */}
            {blockTypographyProperties.includes('textAlign') && (
              <div
                className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5"
                role="group"
                aria-label="Text alignment buttons"
              >
                <Button
                  variant={selectedNode?.data?.textAlign === 'left' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTextAlign('left')}
                  disabled={!selectedNode}
                  className="h-6 w-6 p-0"
                  title="Align left (Ctrl+Shift+L)"
                  aria-label={`Align text left${selectedNode?.data?.textAlign === 'left' ? ' (currently active)' : ''}`}
                  aria-pressed={selectedNode?.data?.textAlign === 'left'}
                  aria-keyshortcuts="Ctrl+Shift+L"
                >
                  <AlignLeft size={10} />
                </Button>

                <Button
                  variant={selectedNode?.data?.textAlign === 'center' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTextAlign('center')}
                  disabled={!selectedNode}
                  className="h-6 w-6 p-0"
                  title="Align center (Ctrl+Shift+E)"
                >
                  <AlignCenter size={10} />
                </Button>

                <Button
                  variant={selectedNode?.data?.textAlign === 'right' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTextAlign('right')}
                  disabled={!selectedNode}
                  className="h-6 w-6 p-0"
                  title="Align right (Ctrl+Shift+R)"
                >
                  <AlignRight size={10} />
                </Button>

                <Button
                  variant={selectedNode?.data?.textAlign === 'justify' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTextAlign('justify')}
                  disabled={!selectedNode}
                  className="h-6 w-6 p-0"
                  title="Justify"
                >
                  <AlignJustify size={10} />
                </Button>
              </div>
            )}

            {/* Typography Dropdown - Context-aware controls */}
            {blockTypographyProperties.length > 0 && (
              <TypographyDropdown
                selectedNode={selectedNode}
                onFontFamily={handleFontFamily}
                onFontSize={handleFontSize}
                onFontWeight={handleFontWeight}
                onLineHeight={handleLineHeight}
                onTextTransform={handleTextTransform}
                onTextColor={handleTextColor}
                onTextDecoration={handleTextDecoration}
                onLetterSpacing={handleLetterSpacing}
                disabled={!selectedNode}
                // Pass block context to dropdown for enhanced filtering
                blockType={selectedNode?.type}
                availableProperties={blockTypographyProperties}
              />
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
              onClick={handleInsertPoll}
              className="h-6 w-6 p-0"
              title="Add poll (Ctrl+Shift+P)"
              aria-label="Add poll"
            >
              <BarChart3 size={10} />
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

        <Separator orientation="vertical" className="h-4" />

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
