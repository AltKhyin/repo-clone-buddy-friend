// ABOUTME: Reusable color control component with theme-aware tokens, transparency support, and accessibility features

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { useColorTokens } from '../../../../hooks/useColorTokens';
import type { ColorToken } from '@/components/editor/shared/types/color-types';

interface ColorControlProps {
  label: string;
  value?: string;
  onChange: (color: string | undefined) => void;
  allowTransparent?: boolean;
  allowCustom?: boolean;
  compact?: boolean;
  className?: string;
  /** Use case specific tokens (e.g., 'text', 'background', 'highlight') */
  useCase?: 'text' | 'background' | 'highlight';
}

// Color format conversion utilities
const parseColor = (colorValue: string): { baseColor: string; alpha: number } => {
  if (!colorValue || colorValue === 'transparent') {
    return { baseColor: '#ffffff', alpha: 0 };
  }
  
  // Handle rgba format
  const rgbaMatch = colorValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9]*\.?[0-9]+))?\)/);
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    const alpha = a ? parseFloat(a) : 1;
    return { 
      baseColor: `rgb(${r}, ${g}, ${b})`, 
      alpha: Math.round(alpha * 100)
    };
  }
  
  // Handle hsla format
  const hslaMatch = colorValue.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([0-9]*\.?[0-9]+))?\)/);
  if (hslaMatch) {
    const [, h, s, l, a] = hslaMatch;
    const alpha = a ? parseFloat(a) : 1;
    return { 
      baseColor: `hsl(${h}, ${s}%, ${l}%)`, 
      alpha: Math.round(alpha * 100)
    };
  }
  
  // Handle hex and other formats - assume fully opaque
  return { baseColor: colorValue, alpha: 100 };
};

const convertToAlphaFormat = (baseColor: string, alphaPercent: number): string => {
  if (alphaPercent === 0) {
    return 'transparent';
  }
  
  const alpha = alphaPercent / 100;
  
  // Convert hex to rgba
  const hexMatch = baseColor.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const [, r, g, b] = hexMatch;
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
  }
  
  // Convert rgb to rgba
  const rgbMatch = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Convert hsl to hsla
  const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
  }
  
  // Handle theme tokens and other formats - wrap in rgba
  if (baseColor.includes('var(--') || baseColor.startsWith('hsl(var(')) {
    if (alpha === 1) {
      return baseColor; // Keep original format if fully opaque
    }
    // For theme tokens with transparency, we need a different approach
    // Use CSS color-mix when available, or fallback to opacity
    return baseColor; // Keep original and handle transparency via CSS opacity if needed
  }
  
  // Fallback - assume it's a valid CSS color
  return alpha === 1 ? baseColor : `color-mix(in srgb, ${baseColor} ${alphaPercent}%, transparent)`;
};

// OPTIMIZATION: Memoized theme-aware presets that replace hardcoded colors
const INSPECTOR_COLOR_TOKENS: ColorToken[] = [
  // Primary theme colors
  {
    id: 'foreground',
    name: 'Text',
    value: 'hsl(var(--foreground))',
    category: 'primary',
    description: 'Primary text color',
    preview: '#1a1a1a',
  },
  {
    id: 'primary',
    name: 'Primary',
    value: 'hsl(var(--primary))',
    category: 'primary',
    description: 'Primary brand color',
    preview: '#1a1a1a',
  },
  {
    id: 'accent',
    name: 'Accent',
    value: 'hsl(var(--accent))',
    category: 'primary',
    description: 'Accent color for highlights',
    preview: '#d97706',
  },
  
  // Semantic colors
  {
    id: 'success',
    name: 'Success',
    value: 'hsl(var(--success))',
    category: 'semantic',
    description: 'Success color',
    preview: '#22c55e',
  },
  {
    id: 'destructive',
    name: 'Error',
    value: 'hsl(var(--destructive))',
    category: 'semantic',
    description: 'Error color',
    preview: '#ef4444',
  },
  
  // Neutral colors
  {
    id: 'muted',
    name: 'Muted',
    value: 'hsl(var(--muted))',
    category: 'neutral',
    description: 'Muted background',
    preview: '#f3f4f6',
  },
  {
    id: 'muted-foreground',
    name: 'Muted Text',
    value: 'hsl(var(--muted-foreground))',
    category: 'neutral',
    description: 'Muted text color',
    preview: '#9ca3af',
  },
  {
    id: 'border',
    name: 'Border',
    value: 'hsl(var(--border))',
    category: 'neutral',
    description: 'Border color',
    preview: '#e5e7eb',
  },
];

// OPTIMIZATION: Memoized ColorControl component for better performance
const ColorControlComponent = React.memo(function ColorControl({
  label,
  value,
  onChange,
  allowTransparent = false,
  allowCustom = true,
  compact = false,
  className,
  useCase,
}: ColorControlProps) {
  const { getTokensForUseCase } = useColorTokens();

  // Get appropriate tokens based on use case or use inspector defaults
  const availableTokens = useCase ? getTokensForUseCase(useCase) : INSPECTOR_COLOR_TOKENS;

  // Handle color selection
  const handleColorSelect = React.useCallback((color: string) => {
    onChange(color || undefined);
  }, [onChange]);

  // Handle color clear
  const handleColorClear = React.useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  // Parse current color and alpha
  const { baseColor, alpha } = React.useMemo(() => parseColor(value), [value]);
  
  // Handle base color selection
  const handleBaseColorSelect = React.useCallback((color: string) => {
    const newColor = convertToAlphaFormat(color, alpha);
    onChange(newColor || undefined);
  }, [alpha, onChange]);
  
  // Handle transparency change
  const handleTransparencyChange = React.useCallback((newAlpha: number[]) => {
    const alphaValue = newAlpha[0];
    const newColor = convertToAlphaFormat(baseColor, alphaValue);
    onChange(newColor === 'transparent' ? undefined : newColor);
  }, [baseColor, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          {label}
        </Label>

        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleColorClear}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            title="Clear color"
            aria-label="Clear color selection"
          >
            <X size={12} />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Unified color picker for base color */}
        <UnifiedColorPicker
          value={baseColor && baseColor !== '#ffffff' ? baseColor : undefined}
          onColorSelect={handleBaseColorSelect}
          onColorClear={handleColorClear}
          mode={allowCustom ? 'both' : 'tokens'}
          variant="input"
          size={compact ? 'sm' : 'default'}
          label={`Choose ${label.toLowerCase()}`}
          allowClear={true}
          customTokens={availableTokens}
          placeholder="#000000"
          className="w-full"
        />
        
        {/* Transparency slider */}
        {allowTransparent && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={cn('text-xs text-muted-foreground')}>
                Transparency
              </Label>
              <span className={cn('text-xs text-muted-foreground')}>
                {alpha}%
              </span>
            </div>
            <Slider
              value={[alpha]}
              onValueChange={handleTransparencyChange}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// OPTIMIZATION: Export the memoized component
export { ColorControlComponent as ColorControl };
