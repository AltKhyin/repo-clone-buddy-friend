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

interface BorderControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  enableToggle?: boolean;
  enableStyle?: boolean;
  enableRadius?: boolean;
  compact?: boolean;
  className?: string;
  // Control individual border properties
  widthKey?: string;
  colorKey?: string;
  radiusKey?: string;
  styleKey?: string;
  // Default values
  defaultWidth?: number;
  defaultColor?: string;
  defaultRadius?: number;
  defaultStyle?: string;
  // Constraints
  maxWidth?: number;
  maxRadius?: number;
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
  enableRadius = true,
  compact = false,
  className,
  widthKey = 'borderWidth',
  colorKey = 'borderColor',
  radiusKey = 'borderRadius',
  styleKey = 'borderStyle',
  defaultWidth = 1,
  defaultColor = '#e5e7eb',
  defaultRadius = 0,
  defaultStyle = 'solid',
  maxWidth = 8,
  maxRadius = 32,
}: BorderControlsProps) {
  const borderWidth = data[widthKey] || 0;
  const borderColor = data[colorKey] || defaultColor;
  const borderRadius = data[radiusKey] || defaultRadius;
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

  const handleRadiusChange = (radius: number) => {
    onChange({ [radiusKey]: radius });
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={compact ? 12 : 14} className="text-muted-foreground" />
                <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
                  Border Color
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={borderColor === 'transparent' ? '#e5e7eb' : borderColor}
                onChange={e => handleColorChange(e.target.value)}
                className={cn(
                  'p-1 border rounded cursor-pointer',
                  compact ? 'w-8 h-6' : 'w-12 h-8'
                )}
              />
              <Input
                type="text"
                value={borderColor}
                onChange={e => handleColorChange(e.target.value)}
                placeholder="transparent"
                className={cn('flex-1 font-mono', compact ? 'h-6 text-xs' : 'h-8 text-sm')}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleColorClear}
                className={cn('text-xs', compact ? 'h-6 px-2' : 'h-8 px-3')}
              >
                Clear
              </Button>
            </div>
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

          {/* Border Radius */}
          {enableRadius && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
                  Corner Radius
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={borderRadius}
                    onChange={e => handleRadiusChange(Number(e.target.value))}
                    min={0}
                    max={maxRadius}
                    className={cn(
                      'w-16 text-right font-mono',
                      compact ? 'h-6 text-xs' : 'h-8 text-sm'
                    )}
                  />
                  <span className="text-xs text-muted-foreground w-6">px</span>
                </div>
              </div>

              {/* Radius Slider */}
              <div className="px-2">
                <Slider
                  value={[borderRadius]}
                  onValueChange={([value]) => handleRadiusChange(value)}
                  min={0}
                  max={maxRadius}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Quick radius buttons */}
              <div className="flex gap-1">
                {[0, 4, 8, 12, 16, 24]
                  .filter(val => val <= maxRadius)
                  .map(radius => (
                    <Button
                      key={radius}
                      variant={borderRadius === radius ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRadiusChange(radius)}
                      className={cn('flex-1 text-xs', compact ? 'h-6 px-1' : 'h-7 px-2')}
                    >
                      {radius}px
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Border Preview */}
      {!compact && (hasBorder || !enableToggle) && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Border Preview
          </Label>
          <div
            className="bg-background flex items-center justify-center min-h-[60px]"
            style={{
              borderWidth: `${borderWidth}px`,
              borderColor: borderColor,
              borderStyle: borderStyle,
              borderRadius: `${borderRadius}px`,
            }}
          >
            <div className="text-xs text-muted-foreground font-medium">
              {borderWidth}px {borderStyle} border
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
