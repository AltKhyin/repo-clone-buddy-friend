// ABOUTME: Centralized color token configurations for UnifiedColorPicker to eliminate duplication across admin components

import type { ColorToken } from '@/components/editor/shared/types/color-types';

/**
 * Standard text color tokens for admin interfaces
 * Used in ContentType and Category management components
 */
export const TEXT_COLOR_TOKENS: ColorToken[] = [
  {
    id: 'foreground',
    name: 'Default Text',
    value: 'hsl(var(--foreground))',
    category: 'primary',
    description: 'Default text color'
  },
  {
    id: 'primary',
    name: 'Primary',
    value: 'hsl(var(--primary))',
    category: 'primary',
    description: 'Primary brand color'
  },
  {
    id: 'accent',
    name: 'Accent',
    value: 'hsl(var(--accent))',
    category: 'primary',
    description: 'Accent color'
  },
  {
    id: 'muted-foreground',
    name: 'Muted Text',
    value: 'hsl(var(--muted-foreground))',
    category: 'neutral',
    description: 'Muted text color'
  },
];

/**
 * Standard border color tokens for admin interfaces
 * Used in ContentType and Category management components
 */
export const BORDER_COLOR_TOKENS: ColorToken[] = [
  {
    id: 'border',
    name: 'Default Border',
    value: 'hsl(var(--border))',
    category: 'neutral',
    description: 'Default border color'
  },
  {
    id: 'accent',
    name: 'Accent',
    value: 'hsl(var(--accent))',
    category: 'primary',
    description: 'Accent border'
  },
  {
    id: 'muted-foreground',
    name: 'Muted',
    value: 'hsl(var(--muted-foreground))',
    category: 'neutral',
    description: 'Muted border'
  },
  {
    id: 'primary',
    name: 'Primary',
    value: 'hsl(var(--primary))',
    category: 'primary',
    description: 'Primary border'
  },
];

/**
 * Standard background color tokens for admin interfaces
 * Used in ContentType and Category management components
 */
export const BACKGROUND_COLOR_TOKENS: ColorToken[] = [
  {
    id: 'background',
    name: 'Default Background',
    value: 'hsl(var(--background))',
    category: 'neutral',
    description: 'Default background color'
  },
  {
    id: 'muted',
    name: 'Muted',
    value: 'hsl(var(--muted))',
    category: 'neutral',
    description: 'Muted background'
  },
  {
    id: 'card',
    name: 'Card',
    value: 'hsl(var(--card))',
    category: 'neutral',
    description: 'Card background'
  },
  {
    id: 'accent',
    name: 'Accent',
    value: 'hsl(var(--accent))',
    category: 'primary',
    description: 'Accent background'
  },
  {
    id: 'success-muted',
    name: 'Success',
    value: 'hsl(var(--success-muted))',
    category: 'semantic',
    description: 'Success background'
  },
  {
    id: 'error-muted',
    name: 'Warning',
    value: 'hsl(var(--error-muted))',
    category: 'semantic',
    description: 'Warning background'
  },
];

/**
 * Standard UnifiedColorPicker props to ensure consistency
 */
export const STANDARD_COLOR_PICKER_PROPS = {
  mode: 'both' as const,
  variant: 'input' as const,
  label: 'Color',
  allowClear: true,
  placeholder: '#000000',
  className: 'w-full',
} as const;