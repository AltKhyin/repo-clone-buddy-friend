// ABOUTME: Google Docs-style horizontal top toolbar for editor controls and block inspector properties

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { SafeSwitch } from './SafeSwitch';
import { TextBlockInspector } from './Inspector/TextBlockInspector';
import { HeadingBlockInspector } from './Inspector/HeadingBlockInspector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopToolbar() {
  const { 
    selectedNodeId, 
    nodes, 
    updateNode, 
    deleteNode, 
    duplicateNode,
    selectNode,
    currentViewport,
    switchViewport,
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
    clearGuidelines
  } = useEditorStore();

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  const handleUpdateNode = (updates: any) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, updates);
    }
  };

  const handleDeleteNode = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
      selectNode(null);
    }
  };

  const handleDuplicateNode = () => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  };

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
              onChange={(e) => handleUpdateNode({
                data: { ...selectedNode.data, url: e.target.value }
              })}
              placeholder="Image URL..."
              className="w-48 h-8"
            />
            <Input
              value={selectedNode.data.alt || ''}
              onChange={(e) => handleUpdateNode({
                data: { ...selectedNode.data, alt: e.target.value }
              })}
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
              onChange={(e) => handleUpdateNode({
                data: { ...selectedNode.data, url: e.target.value }
              })}
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
                  data: { ...selectedNode.data, rows: newRows }
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
                const rows = (selectedNode.data.rows || []).map((row: any[]) => [...row, 'New Cell']);
                handleUpdateNode({
                  data: { ...selectedNode.data, headers, rows }
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
              onChange={(e) => handleUpdateNode({
                data: { ...selectedNode.data, question: e.target.value }
              })}
              placeholder="Poll question..."
              className="w-48 h-8"
            />
            <span className="text-xs text-muted-foreground">
              {selectedNode.data.options?.length || 0} options
            </span>
          </div>
        );

      case 'keyTakeawayBlock':
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Message:</Label>
              <Input
                value={selectedNode.data.content}
                onChange={(e) => handleUpdateNode({
                  data: { ...selectedNode.data, content: e.target.value }
                })}
                placeholder="Key takeaway..."
                className="w-48 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Theme:</Label>
              <Select 
                value={selectedNode.data.theme}
                onValueChange={(value) => handleUpdateNode({
                  data: { ...selectedNode.data, theme: value }
                })}
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

      default:
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedNode.type} selected
            </span>
          </div>
        );
    }
  };

  return (
    <div className="h-12 border-b bg-background flex items-center px-4 gap-4 overflow-x-auto">
      {/* Viewport Controls */}
      <div className="flex items-center gap-2 border-r pr-4">
        <Label className="text-xs text-muted-foreground">View:</Label>
        <div className="flex bg-muted rounded-md p-1">
          <Button
            size="sm"
            variant={currentViewport === 'desktop' ? 'default' : 'ghost'}
            onClick={() => switchViewport('desktop')}
            className="text-xs px-2 h-6 rounded-sm"
            title="Desktop layout (12 columns)"
          >
            <Monitor size={12} className="mr-1" />
            Desktop
          </Button>
          <Button
            size="sm"
            variant={currentViewport === 'mobile' ? 'default' : 'ghost'}
            onClick={() => switchViewport('mobile')}
            className="text-xs px-2 h-6 rounded-sm"
            title="Mobile layout (4 columns)"
          >
            <Smartphone size={12} className="mr-1" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Canvas Controls */}
      <div className="flex items-center gap-3 border-r pr-4">
        <Label className="text-xs text-muted-foreground">Canvas:</Label>
        
        {/* Theme Toggle */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCanvasTheme(canvasTheme === 'light' ? 'dark' : 'light')}
          className="h-7 px-2"
          title="Toggle theme"
        >
          {canvasTheme === 'light' ? (
            <Sun size={12} className="mr-1" />
          ) : (
            <Moon size={12} className="mr-1" />
          )}
          {canvasTheme === 'light' ? 'Light' : 'Dark'}
        </Button>

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
          title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen mode"}
        >
          {isFullscreen ? (
            <MinusSquare size={12} className="mr-1" />
          ) : (
            <Maximize size={12} className="mr-1" />
          )}
          {isFullscreen ? 'Exit' : 'Full'}
        </Button>

        {/* View Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 px-2">
              <Eye size={12} className="mr-1" />
              View
              <ChevronDown size={12} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem 
              onClick={toggleGrid}
              className="flex items-center gap-2"
            >
              <Grid size={14} />
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={toggleRulers}
              className="flex items-center gap-2"
            >
              <Ruler size={14} />
              {showRulers ? 'Hide Rulers' : 'Show Rulers'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={toggleGuidelines}
              className="flex items-center gap-2"
            >
              <Minus size={14} />
              {showGuidelines ? 'Hide Guidelines' : 'Show Guidelines'}
            </DropdownMenuItem>
            {showGuidelines && guidelines && (guidelines.horizontal.length > 0 || guidelines.vertical.length > 0) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={clearGuidelines}
                  className="text-destructive"
                >
                  Clear Guidelines ({guidelines.horizontal.length + guidelines.vertical.length})
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Block Controls */}
      {selectedNode ? (
        <>
          <div className="flex items-center gap-3 border-r pr-4">
            <Label className="text-xs text-muted-foreground">
              {selectedNode.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
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

          {/* Block Properties */}
          <div className="flex-1 flex items-center gap-4 min-w-0">
            {renderCompactNodeEditor()}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            Select a block to edit its properties
          </span>
        </div>
      )}
    </div>
  );
}