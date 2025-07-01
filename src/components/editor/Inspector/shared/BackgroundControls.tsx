// ABOUTME: Unified background controls with color selection, transparency, and image support

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Image, RotateCcw } from 'lucide-react';

interface BackgroundControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  enableImage?: boolean;
  compact?: boolean;
  className?: string;
  // Control individual background properties
  colorKey?: string;
  imageKey?: string;
  // Default values
  defaultColor?: string;
  // Predefined color options
  colorPresets?: string[];
}

const DEFAULT_COLOR_PRESETS = [
  'transparent',
  '#ffffff',
  '#f8f9fa',
  '#e9ecef',
  '#dee2e6',
  '#ced4da',
  '#adb5bd',
  '#6c757d',
  '#495057',
  '#343a40',
  '#212529',
  '#000000',
  '#e3f2fd',
  '#bbdefb',
  '#90caf9',
  '#64b5f6',
  '#42a5f5',
  '#2196f3',
  '#1e88e5',
  '#1976d2',
  '#f3e5f5',
  '#e1bee7',
  '#ce93d8',
  '#ba68c8',
  '#ab47bc',
  '#9c27b0',
  '#8e24aa',
  '#7b1fa2',
  '#e8f5e8',
  '#c8e6c8',
  '#a5d6a5',
  '#81c784',
  '#66bb6a',
  '#4caf50',
  '#43a047',
  '#388e3c',
  '#fff3e0',
  '#ffe0b2',
  '#ffcc80',
  '#ffb74d',
  '#ffa726',
  '#ff9800',
  '#fb8c00',
  '#f57c00',
  '#ffebee',
  '#ffcdd2',
  '#ef9a9a',
  '#e57373',
  '#ef5350',
  '#f44336',
  '#e53935',
  '#d32f2f',
];

export function BackgroundControls({
  data,
  onChange,
  enableImage = false,
  compact = false,
  className,
  colorKey = 'backgroundColor',
  imageKey = 'backgroundImage',
  defaultColor = 'transparent',
  colorPresets = DEFAULT_COLOR_PRESETS,
}: BackgroundControlsProps) {
  const backgroundColor = data[colorKey] || defaultColor;
  const backgroundImage = data[imageKey] || '';

  const handleColorChange = (color: string) => {
    onChange({ [colorKey]: color });
  };

  const handleImageChange = (image: string) => {
    onChange({ [imageKey]: image });
  };

  const handleColorClear = () => {
    onChange({ [colorKey]: 'transparent' });
  };

  const handleImageClear = () => {
    onChange({ [imageKey]: '' });
  };

  const handleResetAll = () => {
    onChange({
      [colorKey]: 'transparent',
      ...(enableImage && { [imageKey]: '' }),
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Background Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={compact ? 12 : 14} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
              Background Color
            </Label>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetAll}
            className={cn(
              'text-xs text-muted-foreground hover:text-foreground',
              compact ? 'h-6 px-2' : 'h-7 px-3'
            )}
          >
            <RotateCcw size={compact ? 10 : 12} className="mr-1" />
            Reset
          </Button>
        </div>

        {/* Color Input */}
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
            onChange={e => handleColorChange(e.target.value)}
            className={cn('p-1 border rounded cursor-pointer', compact ? 'w-8 h-6' : 'w-12 h-8')}
          />
          <Input
            type="text"
            value={backgroundColor}
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

        {/* Color Presets */}
        <div className="grid grid-cols-8 gap-1">
          {colorPresets.slice(0, compact ? 16 : 24).map((color, index) => (
            <button
              key={index}
              onClick={() => handleColorChange(color)}
              className={cn(
                'border border-gray-200 rounded cursor-pointer hover:scale-110 transition-transform',
                compact ? 'w-6 h-6' : 'w-8 h-8',
                backgroundColor === color && 'ring-2 ring-blue-500 ring-offset-1'
              )}
              style={{
                backgroundColor: color === 'transparent' ? '#ffffff' : color,
                backgroundImage:
                  color === 'transparent'
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                    : undefined,
                backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
                backgroundPosition:
                  color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
              }}
              title={color}
              aria-label={`Set background color to ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Background Image */}
      {enableImage && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Image size={compact ? 12 : 14} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
              Background Image URL
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="url"
              value={backgroundImage}
              onChange={e => handleImageChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={cn('flex-1', compact ? 'h-6 text-xs' : 'h-8 text-sm')}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleImageClear}
              disabled={!backgroundImage}
              className={cn('text-xs', compact ? 'h-6 px-2' : 'h-8 px-3')}
            >
              Clear
            </Button>
          </div>

          {backgroundImage && (
            <div className="text-xs text-muted-foreground">
              Note: Background image will overlay the background color
            </div>
          )}
        </div>
      )}

      {/* Background Preview */}
      {!compact && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Background Preview
          </Label>
          <div
            className="border border-gray-200 rounded flex items-center justify-center min-h-[60px] relative overflow-hidden"
            style={{
              backgroundColor: backgroundColor,
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium shadow-sm">
              {backgroundColor === 'transparent' ? 'Transparent' : backgroundColor}
              {backgroundImage && ' + Image'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
