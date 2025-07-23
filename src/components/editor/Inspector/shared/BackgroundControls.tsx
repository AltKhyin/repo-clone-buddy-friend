// ABOUTME: Unified background controls with color selection, transparency, and image support

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Image, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/theme/CustomThemeProvider';

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

// Utility to resolve CSS custom properties to actual color values
const resolveCSSVariable = (variableName: string): string => {
  if (typeof window === 'undefined') return '#ffffff';
  
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
    
    if (!value) return '#ffffff';
    
    // If it's already a valid color, return it
    if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
      return value;
    }
    
    // If it's HSL values without hsl(), wrap them
    if (/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(value)) {
      return `hsl(${value})`;
    }
    
    return '#ffffff';
  } catch {
    return '#ffffff';
  }
};

// Convert HSL color to hex for color picker compatibility
const convertToHex = (color: string): string => {
  if (color.startsWith('#')) return color;
  if (color === 'transparent') return '#ffffff';
  
  // Handle hsl(var(--variable)) pattern
  if (color.includes('var(')) {
    const varMatch = color.match(/var\((--[^)]+)\)/);
    if (varMatch) {
      const resolvedColor = resolveCSSVariable(varMatch[1]);
      return convertToHex(resolvedColor);
    }
  }
  
  // Handle HSL values
  if (color.startsWith('hsl')) {
    try {
      // Create a temporary element to get computed color
      const tempDiv = document.createElement('div');
      tempDiv.style.color = color;
      document.body.appendChild(tempDiv);
      const computedColor = getComputedStyle(tempDiv).color;
      document.body.removeChild(tempDiv);
      
      // Convert RGB to hex
      const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    } catch {
      // Fallback
    }
  }
  
  return '#ffffff';
};

// Theme-aware color options with resolved values
const getThemeColors = (theme: 'light' | 'dark' | 'black') => {
  // Define actual theme color values based on theme
  const themeColorMaps = {
    light: {
      primary: '#1976d2',
      surface: '#f8f9fa',
      accent: '#e3f2fd',
      muted: '#f8f9fa',
      border: '#e5e7eb',
      card: '#ffffff',
    },
    dark: {
      primary: '#64b5f6',
      surface: '#1e1e1e',
      accent: '#424242',
      muted: '#2a2a2a',
      border: '#404040',
      card: '#1a1a1a',
    },
    black: {
      primary: '#90caf9',
      surface: '#000000',
      accent: '#1a1a1a',
      muted: '#0a0a0a',
      border: '#333333',
      card: '#000000',
    },
  };
  
  const colorMap = themeColorMaps[theme];
  
  return [
    {
      name: 'Primary',
      value: colorMap.primary,
      description: 'Theme primary color',
    },
    {
      name: 'Surface',
      value: colorMap.surface,
      description: 'Theme surface color',
    },
    {
      name: 'Accent',
      value: colorMap.accent,
      description: 'Theme accent color',
    },
    {
      name: 'Muted',
      value: colorMap.muted,
      description: 'Theme muted color',
    },
    {
      name: 'Border',
      value: colorMap.border,
      description: 'Theme border color',
    },
    {
      name: 'Card',
      value: colorMap.card,
      description: 'Theme card background',
    },
  ];
};

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
  const { theme } = useTheme();
  const backgroundColor = data[colorKey] || defaultColor;
  const backgroundImage = data[imageKey] || '';

  // Get theme-aware colors for current theme
  const themeColors = getThemeColors(theme);

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
            value={convertToHex(backgroundColor)}
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

        {/* Theme Colors Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={compact ? 10 : 12} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
              Theme Colors
            </Label>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {themeColors.map((themeColor, index) => (
              <button
                key={index}
                onClick={() => handleColorChange(themeColor.value)}
                className={cn(
                  'border border-gray-200 rounded cursor-pointer hover:scale-110 transition-transform relative group',
                  compact ? 'w-6 h-6' : 'w-8 h-8',
                  backgroundColor === themeColor.value && 'ring-2 ring-blue-500 ring-offset-1'
                )}
                style={{
                  backgroundColor: themeColor.value,
                }}
                title={`${themeColor.name} - ${themeColor.description}`}
                aria-label={`Set background to ${themeColor.name}`}
              >
                {/* Theme icon overlay for better identification */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles size={compact ? 8 : 10} className="text-white drop-shadow-sm" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Color Presets */}
        <div className="space-y-2">
          <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
            Standard Colors
          </Label>
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
