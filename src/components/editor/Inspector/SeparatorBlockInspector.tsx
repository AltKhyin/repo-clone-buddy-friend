// ABOUTME: Inspector panel for SeparatorBlock with comprehensive styling controls and live preview

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { SeparatorBlockData } from '@/types/editor';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Palette, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeparatorBlockInspectorProps {
  nodeId: string;
}

// Style options with visual previews
const STYLE_OPTIONS = [
  { 
    value: 'solid', 
    label: 'Solid', 
    description: 'Continuous straight line',
    preview: 'border-solid border-t-2'
  },
  { 
    value: 'dashed', 
    label: 'Dashed', 
    description: 'Evenly spaced dashes',
    preview: 'border-dashed border-t-2'
  },
  { 
    value: 'dotted', 
    label: 'Dotted', 
    description: 'Small dots',
    preview: 'border-dotted border-t-2'
  },
] as const;

// Width options with descriptions
const WIDTH_OPTIONS = [
  { 
    value: 'quarter', 
    label: 'Quarter (25%)', 
    description: 'Narrow separator, centered',
    preview: 'w-1/4'
  },
  { 
    value: 'half', 
    label: 'Half (50%)', 
    description: 'Medium separator, centered',
    preview: 'w-1/2'
  },
  { 
    value: 'full', 
    label: 'Full (100%)', 
    description: 'Full width separator',
    preview: 'w-full'
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
  const [customColor, setCustomColor] = React.useState('');
  
  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'separatorBlock') return null;
  
  const data = node.data as SeparatorBlockData;
  
  const updateData = (updates: Partial<SeparatorBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates }
    });
  };
  
  // Reset to defaults
  const handleResetDefaults = () => {
    updateData({
      style: 'solid',
      thickness: 1,
      width: 'full',
      color: undefined
    });
    setCustomColor('');
  };
  
  // Apply custom color
  const handleCustomColorApply = () => {
    if (customColor) {
      updateData({ color: customColor });
    }
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
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetDefaults}
              className="h-7 px-2"
            >
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
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.value}
              onClick={() => updateData({ style: style.value })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                'hover:bg-accent/50',
                data.style === style.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
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
          {WIDTH_OPTIONS.map((width) => (
            <button
              key={width.value}
              onClick={() => updateData({ width: width.value })}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                'hover:bg-accent/50',
                data.width === width.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
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
        <h4 className="font-medium text-sm">Line Thickness</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="thickness">Thickness</Label>
            <Badge variant="outline" className="text-xs">
              {data.thickness || 1}px
            </Badge>
          </div>
          
          <Slider
            id="thickness"
            min={1}
            max={10}
            step={1}
            value={[data.thickness || 1]}
            onValueChange={(value) => updateData({ thickness: value[0] })}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1px (Thin)</span>
            <span>10px (Thick)</span>
          </div>
          
          {/* Thickness Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">Thickness Preview:</div>
            <div className="flex items-center justify-center">
              <div 
                className="w-20 border-t"
                style={{ 
                  borderTopWidth: `${data.thickness || 1}px`,
                  borderTopColor: currentColor,
                  borderTopStyle: data.style 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Color Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Line Color</h4>
        
        {/* Color Presets */}
        <div className="space-y-2">
          <Label>Quick Colors</Label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateData({ color: color.value })}
                className={cn(
                  'p-2 rounded border text-center transition-all text-xs',
                  'hover:bg-accent/50',
                  data.color === color.value 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border'
                )}
                title={color.label}
              >
                <div className={cn('w-full h-4 rounded', color.preview)} />
                <div className="mt-1 truncate">{color.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Color */}
        <div className="space-y-2">
          <Label htmlFor="customColor">Custom Color</Label>
          <div className="flex gap-2">
            <Input
              id="customColor"
              type="color"
              value={customColor || currentColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-20 h-10 p-1 border-2"
            />
            <Input
              value={customColor || data.color || ''}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#d1d5db"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCustomColorApply}
              disabled={!customColor}
              className="px-3"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

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
                  borderTopStyle: data.style 
                }}
              />
            </div>
          </div>
          
          {/* Context Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-3 text-center">
              In context:
            </div>
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
                    borderTopStyle: data.style 
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