// ABOUTME: Inspector panel for HeadingBlock with heading-specific customization controls

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useEditorStore } from '@/store/editorStore';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import {
  SpacingControls,
  BorderControls,
  BackgroundControls,
  TypographyControls,
} from './shared/UnifiedControls';

interface HeadingBlockInspectorProps {
  nodeId: string;
  compact?: boolean;
}

export const HeadingBlockInspector: React.FC<HeadingBlockInspectorProps> = ({
  nodeId,
  compact = false,
}) => {
  const { nodes, updateNode } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'headingBlock') return null;

  const data = node.data;

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  const headingLevels = [
    { value: 1, icon: Heading1, label: 'H1' },
    { value: 2, icon: Heading2, label: 'H2' },
    { value: 3, icon: Heading3, label: 'H3' },
    { value: 4, icon: Heading4, label: 'H4' },
  ];

  // Compact mode for toolbar
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Heading Level */}
        <div className="flex gap-1">
          {headingLevels.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              size="sm"
              variant={data.level === value ? 'default' : 'outline'}
              onClick={() => updateNodeData({ level: value })}
              className="h-7 w-8 p-0 text-xs"
              title={label}
            >
              {label}
            </Button>
          ))}
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heading1 size={16} />
        <h3 className="font-medium">Heading Block</h3>
      </div>

      <Separator />

      {/* Heading Level Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Heading Level</h4>
        <div className="flex gap-1">
          {headingLevels.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              size="sm"
              variant={data.level === value ? 'default' : 'outline'}
              onClick={() => updateNodeData({ level: value as 1 | 2 | 3 | 4 })}
              className="h-10 px-3 flex flex-col items-center gap-1"
            >
              <Icon size={14} />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Typography Controls */}
      <TypographyControls
        data={data}
        onChange={updateNodeData}
        showFontFamily={true}
        showFontSize={false}
        showFontWeight={true}
        showLineHeight={false}
        showAlignment={true}
        showColor={true}
        showDecorations={true}
        showTransform={true}
        showLetterSpacing={true}
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
