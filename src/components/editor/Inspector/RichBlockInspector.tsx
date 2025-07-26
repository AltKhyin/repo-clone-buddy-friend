// ABOUTME: Content-aware inspector panel for RichBlock with dynamic controls based on TipTap selection

import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditorStore } from '@/store/editorStore';
import { RichBlockData } from '@/types/editor';
import { InspectorSection } from './shared/InspectorSection';
import { ColorControl } from './shared/ColorControl';
import { SpacingControls } from './shared/SpacingControls';
import { BorderControls } from './shared/BorderControls';
import { useRichTextEditor } from '@/hooks/useRichTextEditor';
import {
  Edit3,
  Palette,
  Move,
  Square,
  Table,
  BarChart3,
  Plus,
  Minus,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

interface RichBlockInspectorProps {
  nodeId: string;
}

// Content-aware selection detection
interface TipTapSelection {
  type: 'text' | 'table' | 'poll' | 'image' | 'video' | 'none';
  data?: any;
}

export const RichBlockInspector: React.FC<RichBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore();
  const [currentSelection, setCurrentSelection] = useState<TipTapSelection>({ type: 'none' });

  const node = nodes.find(n => n.id === nodeId);
  const data = node?.type === 'richBlock' ? (node.data as RichBlockData) : null;

  // Initialize TipTap editor instance to monitor selection (always call hook)
  const editorInstance = useRichTextEditor({
    nodeId,
    initialContent: data?.content.htmlContent || '<p>Start typing...</p>',
    placeholder: 'Start typing...',
    onUpdate: (nodeId, content) => {
      if (data) {
        updateNode(nodeId, {
          data: { ...data, content: { ...data.content, htmlContent: content } },
        });
      }
    },
    editable: true,
  });

  // Monitor TipTap editor selection changes (moved before early return)
  useEffect(() => {
    if (!editorInstance.editor) return;

    const updateSelection = () => {
      const { selection } = editorInstance.editor.state;
      const { $from } = selection;

      // Check what type of content is selected
      if (editorInstance.isActive.table) {
        setCurrentSelection({ type: 'table', data: {} });
      } else if (editorInstance.isActive.poll) {
        setCurrentSelection({ type: 'poll', data: {} });
      } else if (selection.empty) {
        setCurrentSelection({ type: 'none' });
      } else {
        setCurrentSelection({ type: 'text' });
      }
    };

    // Listen for selection updates
    editorInstance.editor.on('selectionUpdate', updateSelection);
    editorInstance.editor.on('update', updateSelection);

    // Initial selection check
    updateSelection();

    return () => {
      editorInstance.editor.off('selectionUpdate', updateSelection);
      editorInstance.editor.off('update', updateSelection);
    };
  }, [editorInstance.editor, editorInstance.isActive]);

  // Early return after hooks are called
  if (!node || node.type !== 'richBlock' || !data) return null;

  const updateNodeData = (updates: Partial<RichBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Render content-aware controls based on TipTap selection
  const renderContentAwareControls = () => {
    switch (currentSelection.type) {
      case 'table':
        return (
          <InspectorSection title="Table Controls" icon={Table} compact={false}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editorInstance.editor?.commands.addRowBefore()}
                  className="flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add Row Above
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editorInstance.editor?.commands.addRowAfter()}
                  className="flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add Row Below
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editorInstance.editor?.commands.addColumnBefore()}
                  className="flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add Col Left
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editorInstance.editor?.commands.addColumnAfter()}
                  className="flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add Col Right
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => editorInstance.editor?.commands.deleteRow()}
                  className="flex items-center gap-1"
                >
                  <Minus size={12} />
                  Delete Row
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => editorInstance.editor?.commands.deleteColumn()}
                  className="flex items-center gap-1"
                >
                  <Minus size={12} />
                  Delete Col
                </Button>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    editorInstance.editor?.commands.setCellAttribute('textAlign', 'left')
                  }
                  className="flex items-center gap-1"
                >
                  <AlignLeft size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    editorInstance.editor?.commands.setCellAttribute('textAlign', 'center')
                  }
                  className="flex items-center gap-1"
                >
                  <AlignCenter size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    editorInstance.editor?.commands.setCellAttribute('textAlign', 'right')
                  }
                  className="flex items-center gap-1"
                >
                  <AlignRight size={12} />
                </Button>
              </div>
            </div>
          </InspectorSection>
        );

      case 'poll':
        return (
          <InspectorSection title="Poll Controls" icon={BarChart3} compact={false}>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Question</Label>
                <Input
                  placeholder="Enter poll question..."
                  className="mt-1"
                  // Note: In a full implementation, this would connect to poll data
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Plus size={12} />
                  Add Option
                </Button>
                <Button size="sm" variant="destructive" className="flex items-center gap-1">
                  <Minus size={12} />
                  Remove Option
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allowMultiple" className="rounded" />
                <Label htmlFor="allowMultiple" className="text-sm">
                  Allow multiple votes
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="showResults" className="rounded" defaultChecked />
                <Label htmlFor="showResults" className="text-sm">
                  Show results
                </Label>
              </div>
            </div>
          </InspectorSection>
        );

      case 'text':
        return (
          <InspectorSection title="Text Selection" icon={Edit3} compact={false}>
            <div className="text-sm text-muted-foreground">
              Text formatting controls are available in the toolbar above.
            </div>
          </InspectorSection>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground text-center py-4">
            Select content within the editor to see specific controls
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Edit3 size={16} className="text-primary" />
        <h3 className="font-medium">Rich Block</h3>
        {currentSelection.type !== 'none' && (
          <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
            {currentSelection.type} selected
          </span>
        )}
      </div>

      <Separator />

      {/* Content-Aware Controls */}
      <div className="space-y-4">
        {renderContentAwareControls()}

        <Separator />

        {/* Always-Available Block-Level Controls */}
        <InspectorSection title="Block Styling" icon={Palette} compact={false}>
          <div className="space-y-3">
            <ColorControl
              label="Background Color"
              value={data.backgroundColor}
              onChange={backgroundColor => updateNodeData({ backgroundColor })}
              allowTransparent
              compact={false}
            />

            <ColorControl
              label="Border Color"
              value={data.borderColor}
              onChange={borderColor => updateNodeData({ borderColor })}
              compact={false}
            />
          </div>
        </InspectorSection>

        {/* Spacing Section */}
        <InspectorSection title="Spacing & Layout" icon={Move} compact={false}>
          <SpacingControls
            data={data}
            onChange={updateNodeData}
            fields={[
              {
                key: 'paddingX',
                label: 'Horizontal Padding',
                min: 0,
                max: 80,
                step: 2,
                unit: 'px',
                category: 'padding',
              },
              {
                key: 'paddingY',
                label: 'Vertical Padding',
                min: 0,
                max: 80,
                step: 2,
                unit: 'px',
                category: 'padding',
              },
            ]}
            compact={false}
            enablePresets={true}
            enableBorders={false}
            showDetailedControls={false}
          />
        </InspectorSection>

        {/* Border Section */}
        <InspectorSection title="Border & Corners" icon={Square} compact={false}>
          <BorderControls
            data={data}
            onChange={updateNodeData}
            enableToggle={true}
            enableStyle={false}
            enableRadius={true}
            compact={false}
            widthKey="borderWidth"
            colorKey="borderColor"
            radiusKey="borderRadius"
            defaultWidth={1}
            defaultColor="#e5e7eb"
            defaultRadius={8}
            maxWidth={8}
            maxRadius={32}
          />
        </InspectorSection>
      </div>
    </div>
  );
};
