// ABOUTME: Inspector panel for TextBlock with comprehensive customization controls

import React from 'react';
import { Input } from '@/components/ui/input';
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
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, Type } from 'lucide-react';
import {
  SpacingControls,
  BorderControls,
  BackgroundControls,
  TypographyControls,
} from './shared/UnifiedControls';

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

  // Compact mode for toolbar
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Font Size */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={data.fontSize || 16}
            onChange={e => updateNodeData({ fontSize: parseInt(e.target.value) || 16 })}
            className="w-16 h-7 text-xs"
            min={12}
            max={72}
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>

        {/* Text Alignment */}
        <div className="flex gap-1">
          {[
            { value: 'left', icon: AlignLeft },
            { value: 'center', icon: AlignCenter },
            { value: 'right', icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={data.textAlign === value ? 'default' : 'outline'}
              onClick={() => updateNodeData({ textAlign: value as any })}
              className="h-7 w-7 p-0"
            >
              <Icon size={12} />
            </Button>
          ))}
        </div>

        {/* Font Family */}
        <Select
          value={data.fontFamily || 'inherit'}
          onValueChange={value => updateNodeData({ fontFamily: value })}
        >
          <SelectTrigger className="w-24 h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">Default</SelectItem>
            <SelectItem value="serif">Serif</SelectItem>
            <SelectItem value="sans-serif">Sans</SelectItem>
            <SelectItem value="monospace">Mono</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Type size={16} />
        <h3 className="font-medium">Text Block</h3>
      </div>

      <Separator />

      {/* Typography Controls */}
      <TypographyControls
        data={data}
        onChange={updateNodeData}
        showFontFamily={true}
        showFontSize={true}
        showFontWeight={true}
        showLineHeight={true}
        showAlignment={true}
        showColor={true}
        compact={true}
      />

      <Separator />

      {/* Background Controls */}
      <BackgroundControls
        data={data}
        onChange={updateNodeData}
        enableImage={false}
        compact={true}
      />

      <Separator />

      {/* Spacing Controls */}
      <SpacingControls
        data={data}
        onChange={updateNodeData}
        compact={true}
        enableMargins={true}
        enableBorders={false}
        enablePresets={true}
      />

      <Separator />

      {/* Border Controls */}
      <BorderControls
        data={data}
        onChange={updateNodeData}
        enableToggle={true}
        enableStyle={false}
        enableRadius={true}
        compact={true}
      />
    </div>
  );
};
