// ABOUTME: Unified toolbar containing ALL editor functionality in organized categories to replace fragmented interfaces

import React from 'react';
import { useParams } from 'react-router-dom';
import { useEditorStore } from '@/store/editorStore';
import { useTheme } from '@/components/providers/CustomThemeProvider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { ThemeSelector } from '@/components/header/ThemeSelector';
import { TypographyDropdown } from './TypographyDropdown';

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
  } = useEditorStore();

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Format Operations Handlers
  const handleTextAlign = React.useCallback(
    (align: 'left' | 'center' | 'right') => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, textAlign: align },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleTextFormat = React.useCallback(
    (property: string, value: any) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, [property]: value },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  // Text decoration handler (kept for inline formatting buttons)
  const handleTextDecoration = React.useCallback(
    (textDecoration: string) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, textDecoration },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  // Typography handlers for dropdown
  const handleFontFamily = React.useCallback(
    (fontFamily: string) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, fontFamily },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleFontSize = React.useCallback(
    (fontSize: number) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, fontSize },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleFontWeight = React.useCallback(
    (fontWeight: number) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, fontWeight },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleLineHeight = React.useCallback(
    (lineHeight: number) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, lineHeight },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleTextTransform = React.useCallback(
    (textTransform: string) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, textTransform },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleTextColor = React.useCallback(
    (color: string) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, color },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

  const handleLetterSpacing = React.useCallback(
    (letterSpacing: number) => {
      if (selectedNodeId && selectedNode) {
        updateNode(selectedNodeId, {
          data: { ...selectedNode.data, letterSpacing },
        });
      }
    },
    [selectedNodeId, selectedNode, updateNode]
  );

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
  }, [canvasZoom, updateCanvasZoom]);

  const handleZoomOut = React.useCallback(() => {
    updateCanvasZoom(Math.max(CANVAS_CONFIG.minZoom, canvasZoom - 0.1));
  }, [canvasZoom, updateCanvasZoom]);

  const handleActualSize = React.useCallback(() => {
    updateCanvasZoom(CANVAS_CONFIG.defaultZoom);
  }, [updateCanvasZoom]);

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
        {/* Format Controls - Ultra-Compact */}
        <div role="group" aria-label="Format controls" className="flex items-center gap-1">
          {/* Basic Text Formatting - Ultra-Compact Group */}
          <div
            className="flex items-center gap-0.5 bg-muted/30 rounded p-0.5"
            role="group"
            aria-label="Text formatting buttons"
          >
            <Button
              variant={selectedNode?.data?.fontWeight === 700 ? 'default' : 'ghost'}
              size="sm"
              onClick={() =>
                handleTextFormat('fontWeight', selectedNode?.data?.fontWeight === 700 ? 400 : 700)
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

            <Button
              variant={selectedNode?.data?.textDecoration === 'underline' ? 'default' : 'ghost'}
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
              variant={selectedNode?.data?.textDecoration === 'line-through' ? 'default' : 'ghost'}
              size="sm"
              onClick={() =>
                handleTextDecoration(
                  selectedNode?.data?.textDecoration === 'line-through' ? 'none' : 'line-through'
                )
              }
              disabled={!selectedNode}
              className="h-6 w-6 p-0"
              title="Strikethrough"
            >
              <Strikethrough size={10} />
            </Button>
          </div>

          {/* Text Alignment - Ultra-Compact Group */}
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

          {/* Typography Dropdown - Non-displacing controls */}
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
          />
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
