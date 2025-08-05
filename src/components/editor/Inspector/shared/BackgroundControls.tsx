// ABOUTME: Unified background controls with color selection, transparency, and image support

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Image, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/theme/CustomThemeProvider';
import { UnifiedColorPicker } from '../../shared/UnifiedColorPicker';
import { useColorTokens } from '@/hooks/useColorTokens';

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
}

// Theme-aware background color tokens
const BACKGROUND_COLOR_TOKENS = [
  {
    id: 'background',
    name: 'Background',
    value: 'hsl(var(--background))',
    category: 'neutral' as const,
    description: 'Primary background color',
  },
  {
    id: 'muted',
    name: 'Muted',
    value: 'hsl(var(--muted))',
    category: 'neutral' as const,
    description: 'Muted background for subtle elements',
  },
  {
    id: 'card',
    name: 'Card',
    value: 'hsl(var(--card))',
    category: 'neutral' as const,
    description: 'Card background color',
  },
  {
    id: 'accent',
    name: 'Accent',
    value: 'hsl(var(--accent))',
    category: 'primary' as const,
    description: 'Accent background for highlights',
  },
  {
    id: 'success-muted',
    name: 'Success',
    value: 'hsl(var(--success-muted))',
    category: 'semantic' as const,
    description: 'Success background color',
  },
  {
    id: 'error-muted',
    name: 'Warning',
    value: 'hsl(var(--error-muted))',
    category: 'semantic' as const,
    description: 'Warning background color',
  },
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
}: BackgroundControlsProps) {
  const { theme } = useTheme();
  const { getTokensForUseCase } = useColorTokens();
  const backgroundColor = data[colorKey] || defaultColor;
  const backgroundImage = data[imageKey] || '';

  // Get background-appropriate color tokens
  const backgroundTokens = getTokensForUseCase('background');

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

        {/* Unified Color Picker */}
        <UnifiedColorPicker
          value={backgroundColor !== 'transparent' ? backgroundColor : undefined}
          onColorSelect={handleColorChange}
          onColorClear={handleColorClear}
          mode="both"
          variant="input"
          size={compact ? 'sm' : 'default'}
          label="Background Color"
          allowClear={true}
          customTokens={BACKGROUND_COLOR_TOKENS}
          placeholder="transparent"
          className="w-full"
        />
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

    </div>
  );
}
