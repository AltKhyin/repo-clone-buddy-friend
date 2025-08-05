// ABOUTME: Reusable color control component with theme-aware tokens, transparency support, and accessibility features

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { useColorTokens } from '@/hooks/useColorTokens';
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

  // Handle transparency selection
  const handleTransparentSelect = React.useCallback(() => {
    onChange('transparent');
  }, [onChange]);

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

      <div className="space-y-2">
        {/* Transparency option */}
        {allowTransparent && (
          <Button
            variant={value === 'transparent' ? 'default' : 'outline'}
            size="sm"
            onClick={handleTransparentSelect}
            className="w-full justify-start"
          >
            <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded mr-2" />
            Transparent
          </Button>
        )}

        {/* Unified color picker */}
        <UnifiedColorPicker
          value={value && value !== 'transparent' ? value : undefined}
          onColorSelect={handleColorSelect}
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
      </div>
    </div>
  );
});

// OPTIMIZATION: Export the memoized component
export { ColorControlComponent as ColorControl };
