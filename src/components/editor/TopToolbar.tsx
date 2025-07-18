// ABOUTME: Multi-row top toolbar for editor controls and block inspector properties with flexible wrapping layout

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Trash2,
  Copy,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  Grid,
  Ruler,
  Minus,
  Maximize,
  MinusSquare,
  Palette,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { SafeSwitch } from './SafeSwitch';
import { TextBlockInspector } from './Inspector/TextBlockInspector';
import { HeadingBlockInspector } from './Inspector/HeadingBlockInspector';
import { HistoryIndicator } from './HistoryIndicator';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { ModalPreview } from './ModalPreview';
import { ThemeManager } from './theme/ThemeManager';
import { ensureMasterDerivedLayouts, shouldRegenerateMobile as shouldRegenerateMobileUtil } from '@/store/layoutUtils';

export const TopToolbar = React.memo(function TopToolbar() {
  const {
    selectedNodeId,
    nodes,
    updateNode,
    deleteNode,
    duplicateNode,
    selectNode,
    currentViewport,
    switchViewport,
    generateMobileFromDesktop,
    shouldRegenerateMobile,
    resetMobileLayout,
    layouts,
    canvasTheme,
    setCanvasTheme,
    showGrid,
    toggleGrid,
    showRulers,
    toggleRulers,
    showGuidelines,
    toggleGuidelines,
    toggleFullscreen,
    isFullscreen,
    guidelines,
    clearGuidelines,
  } = useEditorStore();

  // Get layout status information
  const masterDerivedLayouts = React.useMemo(() => {
    return ensureMasterDerivedLayouts(layouts);
  }, [layouts]);

  const mobileNeedsRegeneration = React.useMemo(() => {
    return shouldRegenerateMobileUtil(masterDerivedLayouts);
  }, [masterDerivedLayouts]);

  const mobileStatus = React.useMemo(() => {
    const mobile = masterDerivedLayouts.mobile;
    if (!mobile.isGenerated) {
      return 'not-generated';
    } else if (!mobile.hasCustomizations && mobileNeedsRegeneration) {
      return 'outdated';
    } else if (mobile.hasCustomizations) {
      return 'customized';
    } else {
      return 'generated';
    }
  }, [masterDerivedLayouts.mobile, mobileNeedsRegeneration]);

  // Simple viewport switching without conversion
  const handleViewportSwitch = React.useCallback((targetViewport: string) => {
    if (currentViewport === targetViewport) return;
    switchViewport(targetViewport as any);
  }, [currentViewport, switchViewport]);

  // Handle mobile regeneration
  const handleRegenerateMobile = React.useCallback(() => {
    generateMobileFromDesktop();
  }, [generateMobileFromDesktop]);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  const handleUpdateNode = React.useCallback(
    (updates: any) => {
      if (selectedNodeId) {
        updateNode(selectedNodeId, updates);
      }
    },
    [selectedNodeId, updateNode]
  );

  const handleDeleteNode = React.useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      selectNode(null);
    }
  }, [selectedNodeId, deleteNode, selectNode]);

  const handleDuplicateNode = React.useCallback(() => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  }, [selectedNodeId, duplicateNode]);

  const renderCompactNodeEditor = () => {
    if (!selectedNode) return null;

    // Render simplified, horizontal layout versions of inspectors for the toolbar
    switch (selectedNode.type) {
      case 'textBlock':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Style:</Label>
              <TextBlockInspector nodeId={selectedNode.id} compact />
            </div>
          </div>
        );

      case 'headingBlock':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Level:</Label>
              <HeadingBlockInspector nodeId={selectedNode.id} compact />
            </div>
          </div>
        );

      case 'imageBlock':
        return (
          <div className="flex items-center gap-4">
            <Input
              value={selectedNode.data.url || ''}
              onChange={e =>
                handleUpdateNode({
                  data: { ...selectedNode.data, url: e.target.value },
                })
              }
              placeholder="Image URL..."
              className="w-48 h-8"
            />
            <Input
              value={selectedNode.data.alt || ''}
              onChange={e =>
                handleUpdateNode({
                  data: { ...selectedNode.data, alt: e.target.value },
                })
              }
              placeholder="Alt text..."
              className="w-32 h-8"
            />
          </div>
        );

      case 'videoEmbedBlock':
        return (
          <div className="flex items-center gap-4">
            <Input
              value={selectedNode.data.url || ''}
              onChange={e =>
                handleUpdateNode({
                  data: { ...selectedNode.data, url: e.target.value },
                })
              }
              placeholder="Video URL..."
              className="w-48 h-8"
            />
          </div>
        );

      case 'tableBlock':
        return (
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => {
                // Add row logic - simplified for toolbar
                const newRows = [...(selectedNode.data.rows || []), ['New Cell']];
                handleUpdateNode({
                  data: { ...selectedNode.data, rows: newRows },
                });
              }}
            >
              Add Row
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => {
                // Add column logic - simplified for toolbar
                const headers = [...(selectedNode.data.headers || []), 'New Header'];
                const rows = (selectedNode.data.rows || []).map((row: any[]) => [
                  ...row,
                  'New Cell',
                ]);
                handleUpdateNode({
                  data: { ...selectedNode.data, headers, rows },
                });
              }}
            >
              Add Column
            </Button>
          </div>
        );

      case 'pollBlock':
        return (
          <div className="flex items-center gap-4">
            <Input
              value={selectedNode.data.question || ''}
              onChange={e =>
                handleUpdateNode({
                  data: { ...selectedNode.data, question: e.target.value },
                })
              }
              placeholder="Poll question..."
              className="w-48 h-8"
            />
            <span className="text-xs text-muted-foreground">
              {selectedNode.data.options?.length || 0} options
            </span>
          </div>
        );

      case 'referenceBlock':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Authors:</Label>
              <Input
                value={selectedNode.data.authors || ''}
                onChange={e =>
                  handleUpdateNode({
                    data: { ...selectedNode.data, authors: e.target.value },
                  })
                }
                placeholder="Author, A. A..."
                className="w-40 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Year:</Label>
              <Input
                type="number"
                value={selectedNode.data.year || ''}
                onChange={e =>
                  handleUpdateNode({
                    data: { ...selectedNode.data, year: parseInt(e.target.value) || 0 },
                  })
                }
                placeholder="2024"
                className="w-20 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Title:</Label>
              <Input
                value={selectedNode.data.title || ''}
                onChange={e =>
                  handleUpdateNode({
                    data: { ...selectedNode.data, title: e.target.value },
                  })
                }
                placeholder="Article title..."
                className="w-48 h-8"
              />
            </div>
          </div>
        );

      case 'keyTakeawayBlock':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Message:</Label>
              <Input
                value={selectedNode.data.content}
                onChange={e =>
                  handleUpdateNode({
                    data: { ...selectedNode.data, content: e.target.value },
                  })
                }
                placeholder="Key takeaway..."
                className="w-48 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Theme:</Label>
              <Select
                value={selectedNode.data.theme}
                onValueChange={value =>
                  handleUpdateNode({
                    data: { ...selectedNode.data, theme: value },
                  })
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'separatorBlock':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Style:</Label>
              <Select
                value={selectedNode.data.style}
                onValueChange={value =>
                  handleUpdateNode({
                    data: { ...selectedNode.data, style: value },
                  })
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Width:</Label>
              <Select
                value={selectedNode.data.width}
                onValueChange={value =>
                  handleUpdateNode({
                    data: { ...selectedNode.data, width: value },
                  })
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarter">25%</SelectItem>
                  <SelectItem value="half">50%</SelectItem>
                  <SelectItem value="full">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Thickness:</Label>
              <span className="text-xs text-muted-foreground">
                {selectedNode.data.thickness || 1}px
              </span>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selectedNode.type} selected</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-12 border-b bg-background flex flex-col px-4 py-2 gap-2">
      {/* Row 1: Viewport and Canvas Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Master/Derived Layout Viewport Controls */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">View:</Label>
          
          {/* Mobile Layout Status Indicator */}
          {currentViewport === 'mobile' && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              mobileStatus === 'not-generated' ? 'bg-yellow-100 text-yellow-800' :
              mobileStatus === 'outdated' ? 'bg-orange-100 text-orange-800' :
              mobileStatus === 'customized' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {mobileStatus === 'not-generated' && (
                <>
                  <Zap size={10} />
                  <span>Will auto-generate</span>
                </>
              )}
              {mobileStatus === 'outdated' && (
                <>
                  <Zap size={10} />
                  <span>Desktop changed</span>
                </>
              )}
              {mobileStatus === 'customized' && (
                <>
                  <CheckCircle size={10} />
                  <span>Customized</span>
                </>
              )}
              {mobileStatus === 'generated' && (
                <>
                  <CheckCircle size={10} />
                  <span>Generated</span>
                </>
              )}
            </div>
          )}

          {/* Mobile Regeneration Button */}
          {currentViewport === 'mobile' && (mobileStatus === 'outdated' || mobileStatus === 'customized') && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerateMobile}
              className="h-6 px-2 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
              title="Regenerate mobile layout from current desktop"
            >
              <Zap size={10} className="mr-1" />
              Update
            </Button>
          )}
          
          <div className="flex bg-muted rounded-md p-1">
            <Button
              size="sm"
              variant={currentViewport === 'desktop' ? 'default' : 'ghost'}
              onClick={() => handleViewportSwitch('desktop')}
              className="text-xs px-2 h-6 rounded-sm"
              title="Desktop layout (master) - never auto-overwritten"
            >
              <Monitor size={12} className="mr-1" />
              Desktop
              {currentViewport === 'desktop' && (
                <span className="ml-1 text-xs text-blue-600 font-medium">M</span>
              )}
            </Button>
            <Button
              size="sm"
              variant={currentViewport === 'mobile' ? 'default' : 'ghost'}
              onClick={() => handleViewportSwitch('mobile')}
              className="text-xs px-2 h-6 rounded-sm"
              title="Mobile layout (derived) - generated from desktop"
            >
              <Smartphone size={12} className="mr-1" />
              Mobile
              {currentViewport === 'mobile' && (
                <span className="ml-1 text-xs text-green-600 font-medium">D</span>
              )}
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* History Controls */}
        <HistoryIndicator compact={true} />

        <Separator orientation="vertical" className="h-6" />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutsPanel />

        <Separator orientation="vertical" className="h-6" />

        {/* Preview */}
        <ModalPreview />

        <Separator orientation="vertical" className="h-6" />

        {/* Canvas Controls */}
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Canvas:</Label>

          {/* Theme Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCanvasTheme(canvasTheme === 'light' ? 'dark' : 'light')}
            className="h-7 px-2"
            title="Toggle canvas theme"
          >
            {canvasTheme === 'light' ? (
              <Sun size={12} className="mr-1" />
            ) : (
              <Moon size={12} className="mr-1" />
            )}
            {canvasTheme === 'light' ? 'Light' : 'Dark'}
          </Button>

          {/* Advanced Theme Manager */}
          <ThemeManager>
            <Button size="sm" variant="outline" className="h-7 px-2" title="Manage themes">
              <Palette size={12} className="mr-1" />
              Themes
            </Button>
          </ThemeManager>

          {/* Fullscreen Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await toggleFullscreen();
              } catch (error) {
                console.error('Fullscreen toggle failed:', error);
              }
            }}
            className="h-7 px-2"
            title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen mode'}
          >
            {isFullscreen ? (
              <MinusSquare size={12} className="mr-1" />
            ) : (
              <Maximize size={12} className="mr-1" />
            )}
            {isFullscreen ? 'Exit' : 'Full'}
          </Button>

          {/* View Options Button Group - Fixed: Replaced DropdownMenu to eliminate infinite loop */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <Button
              size="sm"
              variant={showGrid ? 'default' : 'ghost'}
              onClick={toggleGrid}
              className="h-6 px-2 text-xs"
              title={showGrid ? 'Hide Grid' : 'Show Grid'}
            >
              <Grid size={12} />
            </Button>
            <Button
              size="sm"
              variant={showRulers ? 'default' : 'ghost'}
              onClick={toggleRulers}
              className="h-6 px-2 text-xs"
              title={showRulers ? 'Hide Rulers' : 'Show Rulers'}
            >
              <Ruler size={12} />
            </Button>
            <Button
              size="sm"
              variant={showGuidelines ? 'default' : 'ghost'}
              onClick={toggleGuidelines}
              className="h-6 px-2 text-xs"
              title={showGuidelines ? 'Hide Guidelines' : 'Show Guidelines'}
            >
              <Minus size={12} />
            </Button>
            {showGuidelines &&
              guidelines &&
              (guidelines.horizontal.length > 0 || guidelines.vertical.length > 0) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearGuidelines}
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  title={`Clear ${guidelines.horizontal.length + guidelines.vertical.length} guidelines`}
                >
                  <Trash2 size={12} />
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Row 2: Block Controls and Properties (only when block selected) */}
      {selectedNode && (
        <div className="flex items-center gap-4 flex-wrap min-h-8">
          {/* Block Type and Actions */}
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground">
              {selectedNode.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              :
            </Label>

            {/* Block Actions */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDuplicateNode}
              className="h-7 px-2"
              title="Duplicate block"
            >
              <Copy size={12} />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteNode}
              className="h-7 px-2 text-destructive hover:text-destructive"
              title="Delete block"
            >
              <Trash2 size={12} />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Block Properties - can wrap to additional rows if needed */}
          <div className="flex-1 flex items-center gap-4 min-w-0 flex-wrap">
            {renderCompactNodeEditor()}
          </div>
        </div>
      )}

      {/* Row 3: No selection message (only when no block selected) */}
      {!selectedNode && (
        <div className="flex items-center justify-center min-h-8">
          <span className="text-xs text-muted-foreground">
            Select a block to edit its properties
          </span>
        </div>
      )}
    </div>
  );
});
