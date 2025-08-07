// ABOUTME: Type definitions for the unified color system supporting theme tokens and custom colors

/**
 * Enhanced color token categories for comprehensive organization
 */
export type ColorTokenCategory = 'text' | 'background' | 'accent' | 'semantic' | 'neutral' | 'editor';

/**
 * Enhanced color token with comprehensive metadata and theme integration
 */
export interface ColorToken {
  /** Unique identifier for the token */
  id: string;
  /** Human-readable name for the token */
  name: string;
  /** CSS custom property reference (e.g., 'hsl(var(--foreground))') */
  value: string;
  /** Category for UI organization */
  category: ColorTokenCategory;
  /** Descriptive text for accessibility and tooltips */
  description: string;
  /** Exact CSS variable name (e.g., '--foreground') */
  cssVariable: string;
  /** Optional preview hex value for static contexts */
  preview?: string;
  /** Use cases and contexts where this token is appropriate */
  useCase?: string[];
  /** Accessibility notes and contrast information */
  accessibilityNotes?: string;
}

/**
 * Color value that can be either a theme token or custom color
 */
export type ColorValue = string; // CSS value (token reference or hex/rgb/hsl)

/**
 * Color selection mode for the unified picker
 */
export type ColorSelectionMode = 'tokens' | 'custom' | 'both';

/**
 * Props for the unified color picker component
 */
export interface UnifiedColorPickerProps {
  /** Current selected color value */
  value?: ColorValue;
  /** Callback when color is selected */
  onColorSelect: (color: ColorValue) => void;
  /** Callback when color is cleared/reset */
  onColorClear?: () => void;
  /** Which color selection modes to enable */
  mode?: ColorSelectionMode;
  /** Additional CSS classes */
  className?: string;
  /** Display variant */
  variant?: 'icon' | 'button' | 'input';
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Label for accessibility */
  label?: string;
  /** Show clear/reset option */
  allowClear?: boolean;
  /** Custom color tokens to show instead of defaults */
  customTokens?: ColorToken[];
  /** Placeholder text for custom color input */
  placeholder?: string;
  /** Custom z-index for popover content - useful for complex stacking contexts */
  zIndex?: number;
}

/**
 * Color picker context for managing token resolution
 */
export interface ColorPickerContext {
  /** Available color tokens */
  tokens: ColorToken[];
  /** Resolve token value to actual color */
  resolveToken: (tokenId: string) => string;
  /** Check if value is a theme token */
  isToken: (value: string) => boolean;
  /** Get token info by value */
  getTokenInfo: (value: string) => ColorToken | null;
}

/**
 * Color validation result
 */
export interface ColorValidationResult {
  /** Whether the color is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Suggested correction if applicable */
  suggestion?: string;
  /** Detected color format */
  format?: 'hex' | 'rgb' | 'hsl' | 'token' | 'named';
}