// ABOUTME: Properties inspector panel for editing selected block attributes and styling

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Trash2, Copy, Eye, EyeOff, Monitor, Smartphone, Sun, Moon, Grid, Ruler, Minus } from 'lucide-react';
import { SafeSwitch } from './SafeSwitch';
import { TextBlockInspector } from './Inspector/TextBlockInspector';
import { HeadingBlockInspector } from './Inspector/HeadingBlockInspector';
import { ImageBlockInspector } from './Inspector/ImageBlockInspector';
import { VideoEmbedBlockInspector } from './Inspector/VideoEmbedBlockInspector';
import { TableBlockInspector } from './Inspector/TableBlockInspector';

export function InspectorPanel() {
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

  const renderNodeEditor = () => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case 'textBlock':
        return <TextBlockInspector nodeId={selectedNode.id} />;
      
      case 'headingBlock':
        return <HeadingBlockInspector nodeId={selectedNode.id} />;
      
      case 'imageBlock':
        return <ImageBlockInspector nodeId={selectedNode.id} />;
      
      case 'videoEmbedBlock':
        return <VideoEmbedBlockInspector nodeId={selectedNode.id} />;
      
      case 'tableBlock':
        return <TableBlockInspector nodeId={selectedNode.id} />;

      case 'keyTakeawayBlock':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="takeaway-content">Message</Label>
              <Textarea
                id="takeaway-content"
                value={selectedNode.data.content}
                onChange={(e) => handleUpdateNode({
                  data: { ...selectedNode.data, content: e.target.value }
                })}
                placeholder="Key takeaway message..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="takeaway-theme">Theme</Label>
              <Select 
                value={selectedNode.data.theme}
                onValueChange={(value) => handleUpdateNode({
                  data: { ...selectedNode.data, theme: value }
                })}
              >
                <SelectTrigger id="takeaway-theme">
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
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Editor for {selectedNode.type} coming soon
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Inspector</h2>
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              size="sm"
              variant={currentViewport === 'desktop' ? 'default' : 'ghost'}
              onClick={() => switchViewport('desktop')}
              className="text-xs px-2 h-6 rounded-md transition-all"
              title="Switch to desktop layout (12 columns)"
            >
              <Monitor size={12} className="mr-1" />
              Desktop
            </Button>
            <Button
              size="sm"
              variant={currentViewport === 'mobile' ? 'default' : 'ghost'}
              onClick={() => switchViewport('mobile')}
              className="text-xs px-2 h-6 rounded-md transition-all"
              title="Switch to mobile layout (4 columns)"
            >
              <Smartphone size={12} className="mr-1" />
              Mobile
            </Button>
          </div>
        </div>
        
        {/* Viewport info */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          Current: {currentViewport === 'desktop' ? '12' : '4'} column grid • 
          Layouts auto-convert when switching
        </div>
        
        <Separator className="my-3" />
        
        {/* Canvas Controls */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Canvas</h3>
          
          {/* Fullscreen Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="fullscreen-toggle" className="text-sm">Fullscreen</Label>
            <div className="flex items-center space-x-2">
              <SafeSwitch
                id="fullscreen-toggle"
                checked={isFullscreen}
                onCheckedChange={toggleFullscreen}
              />
              <Monitor size={14} className={isFullscreen ? 'text-foreground' : 'text-muted-foreground'} />
            </div>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="canvas-theme" className="text-sm">Theme</Label>
            <Button
              id="canvas-theme"
              size="sm"
              variant="outline"
              onClick={() => setCanvasTheme(canvasTheme === 'light' ? 'dark' : 'light')}
              className="h-7 px-2"
            >
              {canvasTheme === 'light' ? (
                <>
                  <Sun size={14} className="mr-1" />
                  Light
                </>
              ) : (
                <>
                  <Moon size={14} className="mr-1" />
                  Dark
                </>
              )}
            </Button>
          </div>
          
          {/* Grid Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="grid-toggle" className="text-sm">Show Grid</Label>
            <div className="flex items-center space-x-2">
              <SafeSwitch
                id="grid-toggle"
                checked={showGrid}
                onCheckedChange={toggleGrid}
              />
              <Grid size={14} className={showGrid ? 'text-foreground' : 'text-muted-foreground'} />
            </div>
          </div>
          
          {/* Rulers Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="rulers-toggle" className="text-sm">Show Rulers</Label>
            <div className="flex items-center space-x-2">
              <SafeSwitch
                id="rulers-toggle"
                checked={showRulers}
                onCheckedChange={toggleRulers}
              />
              <Ruler size={14} className={showRulers ? 'text-foreground' : 'text-muted-foreground'} />
            </div>
          </div>
          
          {/* Guidelines Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="guidelines-toggle" className="text-sm">Show Guidelines</Label>
            <div className="flex items-center space-x-2">
              <SafeSwitch
                id="guidelines-toggle"
                checked={showGuidelines}
                onCheckedChange={toggleGuidelines}
              />
              <Minus size={14} className={showGuidelines ? 'text-foreground' : 'text-muted-foreground'} />
            </div>
          </div>
          
          
          {/* Clear Guidelines Button */}
          {showGuidelines && guidelines && (guidelines.horizontal.length > 0 || guidelines.vertical.length > 0) && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearGuidelines}
              className="w-full justify-center text-xs h-7"
            >
              Clear All Guidelines ({guidelines.horizontal.length + guidelines.vertical.length})
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <div className="p-4 space-y-6">
            {/* Block Info */}
            <div>
              <h3 className="font-medium text-sm mb-2">
                {selectedNode.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-xs text-muted-foreground">
                ID: {selectedNode.id.slice(0, 8)}...
              </p>
            </div>

            <Separator />

            {/* Block Actions */}
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDuplicateNode}
                className="w-full justify-start"
              >
                <Copy size={16} className="mr-2" />
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteNode}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>

            <Separator />

            {/* Block Properties */}
            <div>
              <h4 className="font-medium text-sm mb-4">Properties</h4>
              {renderNodeEditor()}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <div className="py-8">
              <Eye size={32} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-sm mb-2">No Selection</h3>
              <p className="text-xs text-muted-foreground">
                Select a block to edit its properties
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}