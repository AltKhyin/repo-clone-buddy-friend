// ABOUTME: Properties inspector panel for editing selected block attributes and styling

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Copy, Eye, EyeOff, Monitor, Smartphone } from 'lucide-react';

export function InspectorPanel() {
  const { 
    selectedNodeId, 
    nodes, 
    updateNode, 
    deleteNode, 
    duplicateNode,
    selectNode,
    currentViewport,
    switchViewport
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
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-content">Content</Label>
              <Textarea
                id="text-content"
                value={selectedNode.data.htmlContent.replace(/<[^>]*>/g, '')} // Strip HTML for editing
                onChange={(e) => handleUpdateNode({
                  data: { ...selectedNode.data, htmlContent: `<p>${e.target.value}</p>` }
                })}
                placeholder="Enter text content..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="text-size">Font Size</Label>
                <Input
                  id="text-size"
                  type="number"
                  value={selectedNode.data.fontSize || 16}
                  onChange={(e) => handleUpdateNode({
                    data: { ...selectedNode.data, fontSize: Number(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="text-align">Alignment</Label>
                <Select 
                  value={selectedNode.data.textAlign || 'left'}
                  onValueChange={(value) => handleUpdateNode({
                    data: { ...selectedNode.data, textAlign: value }
                  })}
                >
                  <SelectTrigger id="text-align">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'headingBlock':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="heading-content">Heading Text</Label>
              <Input
                id="heading-content"
                value={selectedNode.data.htmlContent}
                onChange={(e) => handleUpdateNode({
                  data: { ...selectedNode.data, htmlContent: e.target.value }
                })}
                placeholder="Enter heading..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heading-level">Level</Label>
                <Select 
                  value={selectedNode.data.level.toString()}
                  onValueChange={(value) => handleUpdateNode({
                    data: { ...selectedNode.data, level: Number(value) as 1 | 2 | 3 | 4 }
                  })}
                >
                  <SelectTrigger id="heading-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">H1</SelectItem>
                    <SelectItem value="2">H2</SelectItem>
                    <SelectItem value="3">H3</SelectItem>
                    <SelectItem value="4">H4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="heading-align">Alignment</Label>
                <Select 
                  value={selectedNode.data.alignment || 'left'}
                  onValueChange={(value) => handleUpdateNode({
                    data: { ...selectedNode.data, alignment: value }
                  })}
                >
                  <SelectTrigger id="heading-align">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'imageBlock':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-src">Image URL</Label>
              <Input
                id="image-src"
                value={selectedNode.data.src}
                onChange={(e) => handleUpdateNode({
                  data: { ...selectedNode.data, src: e.target.value }
                })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={selectedNode.data.alt}
                onChange={(e) => handleUpdateNode({
                  data: { ...selectedNode.data, alt: e.target.value }
                })}
                placeholder="Describe the image..."
              />
            </div>
            <div>
              <Label htmlFor="image-caption">Caption</Label>
              <Input
                id="image-caption"
                value={selectedNode.data.caption || ''}
                onChange={(e) => handleUpdateNode({
                  data: { ...selectedNode.data, caption: e.target.value }
                })}
                placeholder="Optional caption..."
              />
            </div>
          </div>
        );

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