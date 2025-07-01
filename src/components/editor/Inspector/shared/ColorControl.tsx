// ABOUTME: Reusable color control component with presets, transparency support, and accessibility features

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Palette, Pipette } from 'lucide-react';

interface ColorPreset {
  name: string;
  value: string;
  category?: string;
}

interface ColorControlProps {
  label: string;
  value?: string;
  onChange: (color: string | undefined) => void;
  presets?: ColorPreset[];
  allowTransparent?: boolean;
  allowCustom?: boolean;
  compact?: boolean;
  className?: string;
}

// Default color presets organized by category
const DEFAULT_PRESETS: ColorPreset[] = [
  // Grays
  { name: 'Black', value: '#000000', category: 'grays' },
  { name: 'Dark Gray', value: '#374151', category: 'grays' },
  { name: 'Gray', value: '#6b7280', category: 'grays' },
  { name: 'Light Gray', value: '#d1d5db', category: 'grays' },
  { name: 'White', value: '#ffffff', category: 'grays' },

  // Primary Colors
  { name: 'Blue', value: '#3b82f6', category: 'primary' },
  { name: 'Indigo', value: '#6366f1', category: 'primary' },
  { name: 'Purple', value: '#8b5cf6', category: 'primary' },
  { name: 'Pink', value: '#ec4899', category: 'primary' },
  { name: 'Red', value: '#ef4444', category: 'primary' },

  // Secondary Colors
  { name: 'Orange', value: '#f97316', category: 'secondary' },
  { name: 'Yellow', value: '#eab308', category: 'secondary' },
  { name: 'Green', value: '#22c55e', category: 'secondary' },
  { name: 'Teal', value: '#14b8a6', category: 'secondary' },
  { name: 'Cyan', value: '#06b6d4', category: 'secondary' },
];

export function ColorControl({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  allowTransparent = false,
  allowCustom = true,
  compact = false,
  className,
}: ColorControlProps) {
  const [customColor, setCustomColor] = useState(
    value && value !== 'transparent' ? value : '#000000'
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handlePresetSelect = (presetValue: string) => {
    onChange(presetValue);
    setCustomColor(presetValue);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsPickerOpen(false);
  };

  const renderColorSwatch = (color: string, size: 'sm' | 'md' = 'md') => (
    <div
      className={cn(
        'rounded border-2 border-gray-200 shadow-sm',
        size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
      )}
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{label}</Label>

        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <X size={12} />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Current Color Display */}
        <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn('flex items-center gap-2 h-8', compact ? 'px-2' : 'px-3')}
            >
              {value ? (
                renderColorSwatch(value, 'sm')
              ) : (
                <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded" />
              )}
              <Palette size={12} />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              {/* Transparency Option */}
              {allowTransparent && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Transparency
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange('transparent')}
                    className="w-full justify-start"
                  >
                    <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded mr-2" />
                    Transparent
                  </Button>
                </div>
              )}

              {/* Color Presets by Category */}
              {['grays', 'primary', 'secondary'].map(category => {
                const categoryPresets = presets.filter(p => p.category === category);
                if (categoryPresets.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {category}
                    </Label>
                    <div className="grid grid-cols-5 gap-1">
                      {categoryPresets.map(preset => (
                        <Button
                          key={preset.value}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelect(preset.value)}
                          className={cn(
                            'h-8 w-8 p-0 border-2',
                            value === preset.value && 'ring-2 ring-primary ring-offset-1'
                          )}
                          title={preset.name}
                        >
                          {renderColorSwatch(preset.value, 'sm')}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Custom Color Input */}
              {allowCustom && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Custom Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor !== 'transparent' ? customColor : '#000000'}
                      onChange={e => handleCustomColorChange(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                    />
                    <Input
                      value={customColor}
                      onChange={e => handleCustomColorChange(e.target.value)}
                      placeholder="#000000"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Text Input */}
        {allowCustom && (
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value || undefined)}
            placeholder="Color value"
            className={cn('font-mono', compact ? 'h-8 text-xs' : 'h-8 text-sm')}
          />
        )}
      </div>
    </div>
  );
}
