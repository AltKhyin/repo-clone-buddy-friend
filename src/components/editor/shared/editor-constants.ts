// ABOUTME: Centralized design system constants for editor components - colors, spacing, sizing, and UI tokens

import React from 'react';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Square,
  Type,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export interface ColorPreset {
  name: string;
  value: string;
  category?: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
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

export const COLOR_CATEGORIES = {
  grays: COLOR_PRESETS.filter(preset => preset.category === 'grays'),
  primary: COLOR_PRESETS.filter(preset => preset.category === 'primary'),
  secondary: COLOR_PRESETS.filter(preset => preset.category === 'secondary'),
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export interface SpacingField {
  key: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  category?: 'padding' | 'border' | 'other';
}

export const PADDING_FIELDS: SpacingField[] = [
  {
    key: 'paddingX',
    label: 'Horizontal Padding',
    icon: ArrowLeftRight,
    min: 0,
    max: 80,
    step: 2,
    unit: 'px',
    category: 'padding',
  },
  {
    key: 'paddingY',
    label: 'Vertical Padding',
    icon: ArrowUpDown,
    min: 0,
    max: 80,
    step: 2,
    unit: 'px',
    category: 'padding',
  },
];

export const BORDER_FIELDS: SpacingField[] = [
  {
    key: 'borderRadius',
    label: 'Corner Radius',
    icon: Square,
    min: 0,
    max: 32,
    step: 1,
    unit: 'px',
    category: 'border',
  },
  {
    key: 'borderWidth',
    label: 'Border Width',
    icon: Square,
    min: 0,
    max: 8,
    step: 1,
    unit: 'px',
    category: 'border',
  },
];

export const DEFAULT_SPACING_FIELDS: SpacingField[] = [...PADDING_FIELDS, ...BORDER_FIELDS];

export const SPACING_PRESETS = [
  { name: 'None', values: { paddingX: 0, paddingY: 0 } },
  { name: 'Tight', values: { paddingX: 8, paddingY: 6 } },
  { name: 'Normal', values: { paddingX: 16, paddingY: 12 } },
  { name: 'Loose', values: { paddingX: 24, paddingY: 18 } },
  { name: 'Extra Loose', values: { paddingX: 32, paddingY: 24 } },
];

// ============================================================================
// VIEWPORT & LAYOUT SYSTEM
// ============================================================================

export interface ViewportOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  width?: number;
  breakpoint?: string;
}

export const VIEWPORT_OPTIONS: ViewportOption[] = [
  {
    value: 'mobile',
    label: 'Mobile',
    icon: Smartphone,
    width: 375,
    breakpoint: 'sm',
  },
  {
    value: 'tablet',
    label: 'Tablet',
    icon: Tablet,
    width: 768,
    breakpoint: 'md',
  },
  {
    value: 'desktop',
    label: 'Desktop',
    icon: Monitor,
    width: 1024,
    breakpoint: 'lg',
  },
];

// Canvas sizing and layout constants
export const CANVAS_CONSTRAINTS = {
  minWidth: 320,
  maxWidth: 1440,
  minHeight: 400,
  defaultWidth: 1024,
  defaultHeight: 768,
  snapIncrement: 8,
  gridSize: 16,
} as const;

// Block sizing constraints
export const BLOCK_CONSTRAINTS = {
  minWidth: 50,
  maxWidth: 1200,
  minHeight: 20,
  maxHeight: 800,
  defaultWidth: 300,
  defaultHeight: 100,
} as const;

// ============================================================================
// UI COMPONENT SIZING
// ============================================================================

export const COMPONENT_SIZES = {
  toolbar: {
    height: 56,
    padding: 16,
    gap: 24,
  },
  inspector: {
    width: 320,
    padding: 16,
    headerHeight: 56,
  },
  palette: {
    width: 240,
    padding: 12,
    itemHeight: 48,
  },
  canvas: {
    padding: 32,
    minWidth: 400,
    backgroundColor: '#f8fafc',
  },
} as const;

// Icon sizes for different UI contexts
export const ICON_SIZES = {
  toolbar: 16,
  inspector: 14,
  palette: 20,
  button: 16,
  compact: 12,
} as const;

// ============================================================================
// BLOCK TYPE DEFINITIONS
// ============================================================================

export interface BlockTypeDefinition {
  type: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: 'content' | 'media' | 'layout' | 'interactive';
  defaultWidth: number;
  defaultHeight: number;
  resizable: boolean;
  hasInspector: boolean;
}

export const BLOCK_TYPES: Record<string, BlockTypeDefinition> = {
  textBlock: {
    type: 'textBlock',
    name: 'Text Block',
    icon: Type,
    category: 'content',
    defaultWidth: 300,
    defaultHeight: 80,
    resizable: true,
    hasInspector: true,
  },
  // Add more block types as needed
} as const;

// ============================================================================
// ANIMATION & TRANSITION CONSTANTS
// ============================================================================

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// EDITOR STATES & MODES
// ============================================================================

export const EDITOR_MODES = {
  edit: 'edit',
  preview: 'preview',
  fullscreen: 'fullscreen',
} as const;

export const EDITOR_THEMES = {
  light: 'light',
  dark: 'dark',
  auto: 'auto',
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  save: 'Ctrl+S',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
  duplicate: 'Ctrl+D',
  delete: 'Delete',
  selectAll: 'Ctrl+A',
  preview: 'Ctrl+P',
  fullscreen: 'F11',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const editorUtils = {
  /**
   * Get color preset by value
   */
  getColorPresetByValue(value: string): ColorPreset | undefined {
    return COLOR_PRESETS.find(preset => preset.value === value);
  },

  /**
   * Get viewport option by value
   */
  getViewportOptionByValue(value: string): ViewportOption | undefined {
    return VIEWPORT_OPTIONS.find(option => option.value === value);
  },

  /**
   * Get block type definition by type
   */
  getBlockTypeDefinition(type: string): BlockTypeDefinition | undefined {
    return BLOCK_TYPES[type];
  },

  /**
   * Generate spacing styles from data
   */
  generateSpacingStyles(spacing: Record<string, number>): Record<string, string> {
    return Object.entries(spacing).reduce(
      (styles, [key, value]) => {
        if (typeof value === 'number') {
          styles[key] = `${value}px`;
        }
        return styles;
      },
      {} as Record<string, string>
    );
  },

  /**
   * Validate spacing value against field constraints
   */
  validateSpacingValue(value: number, field: SpacingField): number {
    return Math.max(field.min || 0, Math.min(field.max || 100, value));
  },

  /**
   * Check if a color is a valid hex color
   */
  isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  /**
   * Convert CSS units to pixels (basic implementation)
   */
  toPx(value: string | number): number {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    if (value.includes('rem')) return num * 16; // Assume 16px base
    if (value.includes('em')) return num * 16; // Simplified
    return num; // Assume px
  },

  /**
   * Get responsive class names based on viewport
   */
  getResponsiveClasses(viewport: string): string {
    const viewportOption = this.getViewportOptionByValue(viewport);
    if (!viewportOption?.breakpoint) return '';

    return `${viewportOption.breakpoint}:block hidden`;
  },
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isValidSpacingField = (field: any): field is SpacingField => {
  return (
    typeof field === 'object' &&
    field !== null &&
    typeof field.key === 'string' &&
    typeof field.label === 'string'
  );
};

export const isValidColorPreset = (preset: any): preset is ColorPreset => {
  return (
    typeof preset === 'object' &&
    preset !== null &&
    typeof preset.name === 'string' &&
    typeof preset.value === 'string' &&
    editorUtils.isValidHexColor(preset.value)
  );
};

export const isValidViewportOption = (option: any): option is ViewportOption => {
  return (
    typeof option === 'object' &&
    option !== null &&
    typeof option.value === 'string' &&
    typeof option.label === 'string'
  );
};

// ============================================================================
// EXPORTS FOR BACKWARDS COMPATIBILITY
// ============================================================================

// Re-export color presets with legacy name for components that use them
export { COLOR_PRESETS as DEFAULT_PRESETS };

// Re-export spacing utilities with legacy names
export const generateSpacingStyles = editorUtils.generateSpacingStyles;
export const validateSpacingValue = editorUtils.validateSpacingValue;
