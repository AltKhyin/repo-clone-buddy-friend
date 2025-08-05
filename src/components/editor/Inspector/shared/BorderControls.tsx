// ABOUTME: Unified border controls with enable toggle, width, color, and style options

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SafeSwitch } from '@/components/editor/SafeSwitch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Square, Palette, MoreHorizontal } from 'lucide-react';
import { UnifiedColorPicker } from '../../shared/UnifiedColorPicker';

interface BorderControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  enableToggle?: boolean;
  enableStyle?: boolean;
  compact?: boolean;
  className?: string;
  // Control individual border properties
  widthKey?: string;
  colorKey?: string;
  styleKey?: string;
  // Default values
  defaultWidth?: number;
  defaultColor?: string;
  defaultStyle?: string;
  // Constraints
  maxWidth?: number;
}

const BORDER_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
];

export function BorderControls({
  data,
  onChange,
  enableToggle = true,
  enableStyle = false,
  compact = false,
  className,
  widthKey = 'borderWidth',
  colorKey = 'borderColor',
  styleKey = 'borderStyle',
  defaultWidth = 1,
  defaultColor = 'hsl(var(--border))',
  defaultStyle = 'solid',
  maxWidth = 8,
}: BorderControlsProps) {
  const borderWidth = data[widthKey] || 0;
  const borderColor = data[colorKey] || defaultColor;
  const borderStyle = data[styleKey] || defaultStyle;
  const hasBorder = borderWidth > 0;

  const handleToggleBorder = (enabled: boolean) => {
    onChange({
      [widthKey]: enabled ? defaultWidth : 0,
      [colorKey]: enabled ? borderColor : defaultColor,
    });
  };

  const handleWidthChange = (width: number) => {
    onChange({ [widthKey]: width });
  };

  const handleColorChange = (color: string) => {
    onChange({ [colorKey]: color });
  };

  const handleStyleChange = (style: string) => {
    onChange({ [styleKey]: style });
  };

  const handleColorClear = () => {
    onChange({ [colorKey]: 'transparent' });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Border Toggle */}
      {enableToggle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Square size={compact ? 12 : 14} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
              Enable Border
            </Label>
          </div>
          <SafeSwitch
            checked={hasBorder}
            onCheckedChange={handleToggleBorder}
            aria-label="Enable border"
          />
        </div>
      )}

      {/* Border Controls - shown when border is enabled or toggle is disabled */}
      {(hasBorder || !enableToggle) && (
        <div className={cn('space-y-3', compact && 'space-y-2')}>
          {/* Border Width */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
                Border Width
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={borderWidth}
                  onChange={e => handleWidthChange(Number(e.target.value))}
                  min={0}
                  max={maxWidth}
                  className={cn(
                    'w-16 text-right font-mono',
                    compact ? 'h-6 text-xs' : 'h-8 text-sm'
                  )}
                />
                <span className="text-xs text-muted-foreground w-6">px</span>
              </div>
            </div>

            {/* Width Slider */}
            <div className="px-2">
              <Slider
                value={[borderWidth]}
                onValueChange={([value]) => handleWidthChange(value)}
                min={0}
                max={maxWidth}
                step={1}
                className="w-full"
              />
            </div>

            {/* Quick width buttons */}
            <div className="flex gap-1">
              {[0, 1, 2, 4, 6]
                .filter(val => val <= maxWidth)
                .map(width => (
                  <Button
                    key={width}
                    variant={borderWidth === width ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleWidthChange(width)}
                    className={cn('flex-1 text-xs', compact ? 'h-6 px-1' : 'h-7 px-2')}
                  >
                    {width}px
                  </Button>
                ))}
            </div>
          </div>

          {/* Border Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette size={compact ? 12 : 14} className="text-muted-foreground" />
              <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
                Border Color
              </Label>
            </div>

            <UnifiedColorPicker
              value={borderColor !== 'transparent' ? borderColor : undefined}
              onColorSelect={handleColorChange}
              onColorClear={handleColorClear}
              mode="both"
              variant="input"
              size={compact ? 'sm' : 'default'}
              label="Border Color"
              allowClear={true}
              customTokens={[
                {
                  id: 'border',
                  name: 'Default',
                  value: 'hsl(var(--border))',
                  category: 'neutral',
                  description: 'Default border color that adapts to theme',
                },
                {
                  id: 'muted-foreground',
                  name: 'Muted',
                  value: 'hsl(var(--muted-foreground))',
                  category: 'neutral',
                  description: 'Muted border color',
                },
                {
                  id: 'accent',
                  name: 'Accent',
                  value: 'hsl(var(--accent))',
                  category: 'primary',
                  description: 'Accent border for highlights',
                },
                {
                  id: 'destructive',
                  name: 'Error',
                  value: 'hsl(var(--destructive))',
                  category: 'semantic',
                  description: 'Error border color',
                },
                {
                  id: 'success',
                  name: 'Success',
                  value: 'hsl(var(--success))',
                  category: 'semantic',
                  description: 'Success border color',
                },
              ]}
              placeholder="transparent"
              className="w-full"
            />
          </div>

          {/* Border Style */}
          {enableStyle && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MoreHorizontal size={compact ? 12 : 14} className="text-muted-foreground" />
                <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
                  Border Style
                </Label>
              </div>

              <Select value={borderStyle} onValueChange={handleStyleChange}>
                <SelectTrigger className={cn(compact ? 'h-6 text-xs' : 'h-8 text-sm')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORDER_STYLES.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
