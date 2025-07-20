// ABOUTME: Inspector panel for SeparatorBlock with comprehensive styling controls and live preview

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { SeparatorBlockData } from '@/types/editor';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Palette, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SliderControl, ColorControl } from './shared/UnifiedControls';
import { SpacingControls } from '@/components/editor/Inspector/shared/SpacingControls';

interface SeparatorBlockInspectorProps {
  nodeId: string;
}

// Style options with visual previews
const STYLE_OPTIONS = [
  {
    value: 'solid',
    label: 'Solid',
    description: 'Continuous straight line',
    preview: 'border-solid border-t-2',
  },
  {
    value: 'dashed',
    label: 'Dashed',
    description: 'Evenly spaced dashes',
    preview: 'border-dashed border-t-2',
  },
  {
    value: 'dotted',
    label: 'Dotted',
    description: 'Small dots',
    preview: 'border-dotted border-t-2',
  },
] as const;

// Width options with descriptions
const WIDTH_OPTIONS = [
  {
    value: 'quarter',
    label: 'Quarter (25%)',
    description: 'Narrow separator, centered',
    preview: 'w-1/4',
  },
  {
    value: 'half',
    label: 'Half (50%)',
    description: 'Medium separator, centered',
    preview: 'w-1/2',
  },
  {
    value: 'full',
    label: 'Full (100%)',
    description: 'Full width separator',
    preview: 'w-full',
  },
] as const;

// Predefined colors for separators
const COLOR_PRESETS = [
  { label: 'Light Gray', value: '#d1d5db', preview: 'bg-gray-300' },
  { label: 'Medium Gray', value: '#6b7280', preview: 'bg-gray-500' },
  { label: 'Dark Gray', value: '#374151', preview: 'bg-gray-700' },
  { label: 'Blue', value: '#3b82f6', preview: 'bg-blue-500' },
  { label: 'Green', value: '#10b981', preview: 'bg-emerald-500' },
  { label: 'Yellow', value: '#f59e0b', preview: 'bg-amber-500' },
  { label: 'Red', value: '#ef4444', preview: 'bg-red-500' },
  { label: 'Purple', value: '#8b5cf6', preview: 'bg-violet-500' },
] as const;

export function SeparatorBlockInspector({ nodeId }: SeparatorBlockInspectorProps) {
  const { nodes, updateNode, canvasTheme } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'separatorBlock') return null;

  const data = node.data as SeparatorBlockData;

  const updateData = (updates: Partial<SeparatorBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    updateData({
      style: 'solid',
      thickness: 1,
      width: 'full',
      color: undefined,
    });
  };

  // Current color with fallback
  const currentColor = data.color || (canvasTheme === 'dark' ? '#374151' : '#d1d5db');

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Separator Styling</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.style} • {data.width} • {data.thickness}px
            </Badge>
            <Button size="sm" variant="outline" onClick={handleResetDefaults} className="h-7 px-2">
              <RotateCcw size={12} />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of your section separator
        </p>
      </div>

      <Separator />

      {/* Style Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Line Style</h4>

        <div className="grid grid-cols-1 gap-2">
          {STYLE_OPTIONS.map(style => (
            <button
              key={style.value}
              onClick={() => updateData({ style: style.value })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                'hover:bg-accent/50',
                data.style === style.value ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{style.label}</div>
                <div className="text-xs text-muted-foreground">{style.description}</div>
              </div>
              <div className="w-16 h-8 flex items-center justify-center">
                <div
                  className={cn('w-12 h-0', style.preview)}
                  style={{ borderColor: currentColor }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Width Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Separator Width</h4>

        <div className="grid grid-cols-1 gap-2">
          {WIDTH_OPTIONS.map(width => (
            <button
              key={width.value}
              onClick={() => updateData({ width: width.value })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                'hover:bg-accent/50',
                data.width === width.value ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{width.label}</div>
                <div className="text-xs text-muted-foreground">{width.description}</div>
              </div>
              <div className="w-16 h-8 flex items-center justify-center">
                <div
                  className={cn('h-0 border-t-2', width.preview)}
                  style={{ borderColor: currentColor }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Thickness Control */}
      <div className="space-y-4">
        <SliderControl
          label="Line Thickness"
          value={data.thickness || 1}
          onChange={value => updateData({ thickness: value })}
          min={1}
          max={10}
          step={1}
          unit="px"
          icon={Minus}
          description="Adjust the visual weight of the separator line"
          quickValues={[1, 2, 3, 5, 8, 10]}
        />

        {/* Thickness Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">Thickness Preview:</div>
          <div className="flex items-center justify-center">
            <div
              className="w-20 border-t"
              style={{
                borderTopWidth: `${data.thickness || 1}px`,
                borderTopColor: currentColor,
                borderTopStyle: data.style,
              }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Color Control */}
      <ColorControl
        label="Line Color"
        value={data.color}
        onChange={color => updateData({ color })}
        presets={COLOR_PRESETS.map(preset => ({
          name: preset.label,
          value: preset.value,
          category: 'separator',
        }))}
        allowTransparent={false}
        allowCustom={true}
        compact={false}
      />

      <Separator />

      {/* Container Spacing Controls */}
      <SpacingControls
        data={data}
        onChange={updateData}
        compact={true}
        enableBorders={true}
        enablePresets={true}
      />

      <Separator />

      {/* Live Preview */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Live Preview</h4>

        <div className="space-y-3">
          {/* Small Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-3 text-center">
              Preview of your separator:
            </div>
            <div className="flex items-center justify-center py-2">
              <div
                className={cn(
                  'border-t',
                  data.width === 'quarter' && 'w-1/4',
                  data.width === 'half' && 'w-1/2',
                  data.width === 'full' && 'w-full'
                )}
                style={{
                  borderTopWidth: `${data.thickness || 1}px`,
                  borderTopColor: currentColor,
                  borderTopStyle: data.style,
                }}
              />
            </div>
          </div>

          {/* Context Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-3 text-center">In context:</div>
            <div className="space-y-3">
              <div className="text-sm">Content above separator</div>
              <div className="flex items-center justify-center py-2">
                <div
                  className={cn(
                    'border-t',
                    data.width === 'quarter' && 'w-1/4',
                    data.width === 'half' && 'w-1/2',
                    data.width === 'full' && 'w-full'
                  )}
                  style={{
                    borderTopWidth: `${data.thickness || 1}px`,
                    borderTopColor: currentColor,
                    borderTopStyle: data.style,
                  }}
                />
              </div>
              <div className="text-sm">Content below separator</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
