// ABOUTME: Color picker dropdown for text highlights with theme-aware tokens and custom color option

import React from 'react';
import { Highlighter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedColorPicker } from './UnifiedColorPicker';
import { useColorTokens } from '../../hooks/useColorTokens';
import type { ColorToken } from './types/color-types';

// Theme-aware highlight color tokens that adapt to the current theme
const HIGHLIGHT_TOKENS: ColorToken[] = [
  {
    id: 'accent',
    name: 'Accent',
    value: 'hsl(var(--accent))',
    category: 'primary',
    description: 'Primary accent highlight that adapts to theme',
    preview: '#d97706',
  },
  {
    id: 'success-muted',
    name: 'Success',
    value: 'hsl(var(--success-muted))',
    category: 'semantic',
    description: 'Success highlight for positive emphasis',
    preview: '#dcfce7',
  },
  {
    id: 'error-muted',
    name: 'Warning',
    value: 'hsl(var(--error-muted))',
    category: 'semantic',
    description: 'Warning highlight for important information',
    preview: '#fecaca',
  },
  {
    id: 'muted',
    name: 'Neutral',
    value: 'hsl(var(--muted))',
    category: 'neutral',
    description: 'Neutral highlight for subtle emphasis',
    preview: '#f3f4f6',
  },
  {
    id: 'secondary',
    name: 'Secondary',
    value: 'hsl(var(--secondary))',
    category: 'neutral',
    description: 'Secondary background for subtle highlighting',
    preview: '#f1f5f9',
  },
];

export interface HighlightColorPickerProps {
  /** Current selected color */
  value?: string;
  /** Callback when color is selected */
  onColorSelect: (color: string) => void;
  /** Callback when highlight is removed */
  onRemoveHighlight: () => void;
  /** Whether highlighting is currently active */
  isActive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show as icon button or full button */
  variant?: 'icon' | 'button';
  /** Button size */
  size?: 'sm' | 'default';
}

export const HighlightColorPicker: React.FC<HighlightColorPickerProps> = ({
  value,
  onColorSelect,
  onRemoveHighlight,
  isActive = false,
  className,
  variant = 'icon',
  size = 'sm',
}) => {
  // Get theme-aware default for highlights
  const defaultHighlight = 'hsl(var(--accent))';
  const currentValue = value || defaultHighlight;

  // Handle color selection with theme token integration
  const handleColorSelect = React.useCallback((color: string) => {
    onColorSelect(color || defaultHighlight);
  }, [onColorSelect, defaultHighlight]);

  // Handle clear functionality
  const handleColorClear = React.useCallback(() => {
    if (onRemoveHighlight) {
      onRemoveHighlight();
    } else {
      onColorSelect('');
    }
  }, [onRemoveHighlight, onColorSelect]);

  return (
    <div className="relative">
      <UnifiedColorPicker
        value={currentValue}
        onColorSelect={handleColorSelect}
        onColorClear={handleColorClear}
        mode="both"
        variant={variant}
        size={size}
        label="Highlight Colors"
        allowClear={true}
        customTokens={HIGHLIGHT_TOKENS}
        placeholder="#ffeb3b"
        className={className}
      />
      
      {/* Custom highlight indicator overlay for icon variant */}
      {variant === 'icon' && isActive && (
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 rounded pointer-events-none"
          style={{ backgroundColor: currentValue }}
        />
      )}
    </div>
  );
};

export default HighlightColorPicker;