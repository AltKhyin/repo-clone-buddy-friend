// ABOUTME: Inspector panel for TextBlock with comprehensive customization controls

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEditorStore } from '@/store/editorStore';
import { Type, Hash } from 'lucide-react';
import { SpacingControls, BorderControls, BackgroundControls } from './shared/UnifiedControls';
import { CornerRadiusControls } from './shared/CornerRadiusControls';

interface TextBlockInspectorProps {
  nodeId: string;
  compact?: boolean;
}

export const TextBlockInspector: React.FC<TextBlockInspectorProps> = ({
  nodeId,
  compact = false,
}) => {
  const { nodes, updateNode } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'textBlock') return null;

  const data = node.data;

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Compact mode for toolbar - removed duplicate controls (now handled by UnifiedToolbar)
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Only keep heading level selector - unique to block properties */}
        <Select
          value={data.headingLevel ? data.headingLevel.toString() : 'text'}
          onValueChange={value =>
            updateNodeData({
              headingLevel: value === 'text' ? null : (parseInt(value) as 1 | 2 | 3 | 4),
            })
          }
        >
          <SelectTrigger className="w-20 h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="1">H1</SelectItem>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
            <SelectItem value="4">H4</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Heading Level Selector - unique to block properties */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Hash size={14} />
          <span className="text-sm font-medium">Block Type</span>
        </div>
        <Select
          value={data.headingLevel ? data.headingLevel.toString() : 'text'}
          onValueChange={value =>
            updateNodeData({
              headingLevel: value === 'text' ? null : (parseInt(value) as 1 | 2 | 3 | 4),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">
              <div className="flex items-center gap-2">
                <Type size={14} />
                <span>Normal Text</span>
              </div>
            </SelectItem>
            <SelectItem value="1">
              <div className="flex items-center gap-2">
                <Hash size={14} />
                <span style={{ fontSize: '18px', fontWeight: 700 }}>Heading 1</span>
              </div>
            </SelectItem>
            <SelectItem value="2">
              <div className="flex items-center gap-2">
                <Hash size={14} />
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Heading 2</span>
              </div>
            </SelectItem>
            <SelectItem value="3">
              <div className="flex items-center gap-2">
                <Hash size={14} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Heading 3</span>
              </div>
            </SelectItem>
            <SelectItem value="4">
              <div className="flex items-center gap-2">
                <Hash size={14} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Heading 4</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Background Controls - Text color now handled by UnifiedToolbar typography dropdown */}
      <BackgroundControls
        data={data}
        onChange={updateNodeData}
        enableImage={false}
        compact={true}
        colorKey="backgroundColor"
        defaultColor="transparent"
      />

      <Separator />

      {/* Spacing Controls */}
      <SpacingControls
        data={data}
        onChange={updateNodeData}
        compact={true}
        enableBorders={false}
        enablePresets={true}
        showDetailedControls={false}
      />

      <Separator />

      {/* Border Controls */}
      <BorderControls
        data={data}
        onChange={updateNodeData}
        enableToggle={true}
        enableStyle={false}
        compact={true}
      />

      <Separator />

      {/* Corner Radius Controls */}
      <CornerRadiusControls
        data={data}
        onChange={updateNodeData}
        radiusKey="borderRadius"
        defaultRadius={8}
        maxRadius={32}
        compact={true}
      />
    </div>
  );
};
