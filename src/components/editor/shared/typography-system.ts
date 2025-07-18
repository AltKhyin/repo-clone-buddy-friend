// ABOUTME: Centralized typography system for editor components - eliminates duplication across UnifiedToolbar and TypographyControls

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Underline,
  Strikethrough,
} from 'lucide-react';

// Typography interfaces for type safety
export interface FontFamily {
  value: string;
  label: string;
}

export interface FontWeight {
  value: number;
  label: string;
}

export interface TextDecoration {
  value: string;
  label: string;
  icon: any;
}

export interface TextTransform {
  value: string;
  label: string;
}

export interface AlignmentOption {
  value: string;
  icon: any;
  label: string;
}

export interface TypographyData {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  textAlign?: string;
  color?: string;
  textDecoration?: string;
  textTransform?: string;
  letterSpacing?: number;
}

// Centralized typography constants
export const FONT_FAMILIES: FontFamily[] = [
  { value: 'inherit', label: 'Inherit' },
  { value: 'var(--font-sans)', label: 'Inter (App Sans)' },
  { value: 'var(--font-serif)', label: 'Source Serif 4 (App Serif)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Source Serif 4', label: 'Source Serif 4' },
  { value: 'system-ui', label: 'System UI' },
  { value: '-apple-system', label: 'Apple System' },
  { value: 'BlinkMacSystemFont', label: 'Blink Mac System' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times' },
  { value: 'Courier New', label: 'Courier' },
  { value: 'monospace', label: 'Monospace' },
];

export const FONT_WEIGHTS: FontWeight[] = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
];

export const TEXT_DECORATIONS: TextDecoration[] = [
  { value: 'none', label: 'None', icon: Type },
  { value: 'underline', label: 'Underline', icon: Underline },
  { value: 'line-through', label: 'Strikethrough', icon: Strikethrough },
];

export const TEXT_TRANSFORMS: TextTransform[] = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

export const ALIGNMENT_OPTIONS: AlignmentOption[] = [
  { value: 'left', icon: AlignLeft, label: 'Left' },
  { value: 'center', icon: AlignCenter, label: 'Center' },
  { value: 'right', icon: AlignRight, label: 'Right' },
  { value: 'justify', icon: AlignJustify, label: 'Justify' },
];

// Typography defaults and validation
export const TYPOGRAPHY_DEFAULTS: Required<TypographyData> = {
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.4,
  textAlign: 'left',
  color: '#000000',
  textDecoration: 'none',
  textTransform: 'none',
  letterSpacing: 0,
};

// Typography validation constraints
export const TYPOGRAPHY_CONSTRAINTS = {
  fontSize: { min: 8, max: 128, step: 1 },
  fontWeight: { min: 100, max: 900, step: 100 },
  lineHeight: { min: 0.5, max: 3, step: 0.1 },
  letterSpacing: { min: -2, max: 4, step: 0.1 },
} as const;

// Utility functions for typography operations
export const typographyUtils = {
  /**
   * Validates and sanitizes typography data
   */
  validateTypographyData(data: Partial<TypographyData>): TypographyData {
    return {
      fontFamily: data.fontFamily || TYPOGRAPHY_DEFAULTS.fontFamily,
      fontSize: Math.max(
        TYPOGRAPHY_CONSTRAINTS.fontSize.min,
        Math.min(TYPOGRAPHY_CONSTRAINTS.fontSize.max, data.fontSize || TYPOGRAPHY_DEFAULTS.fontSize)
      ),
      fontWeight: Math.max(
        TYPOGRAPHY_CONSTRAINTS.fontWeight.min,
        Math.min(
          TYPOGRAPHY_CONSTRAINTS.fontWeight.max,
          data.fontWeight || TYPOGRAPHY_DEFAULTS.fontWeight
        )
      ),
      lineHeight: Math.max(
        TYPOGRAPHY_CONSTRAINTS.lineHeight.min,
        Math.min(
          TYPOGRAPHY_CONSTRAINTS.lineHeight.max,
          data.lineHeight || TYPOGRAPHY_DEFAULTS.lineHeight
        )
      ),
      textAlign: data.textAlign || TYPOGRAPHY_DEFAULTS.textAlign,
      color: data.color || TYPOGRAPHY_DEFAULTS.color,
      textDecoration: data.textDecoration || TYPOGRAPHY_DEFAULTS.textDecoration,
      textTransform: data.textTransform || TYPOGRAPHY_DEFAULTS.textTransform,
      letterSpacing: Math.max(
        TYPOGRAPHY_CONSTRAINTS.letterSpacing.min,
        Math.min(
          TYPOGRAPHY_CONSTRAINTS.letterSpacing.max,
          data.letterSpacing || TYPOGRAPHY_DEFAULTS.letterSpacing
        )
      ),
    };
  },

  /**
   * Gets font family object by value
   */
  getFontFamilyByValue(value: string): FontFamily | undefined {
    return FONT_FAMILIES.find(font => font.value === value);
  },

  /**
   * Gets font weight object by value
   */
  getFontWeightByValue(value: number): FontWeight | undefined {
    return FONT_WEIGHTS.find(weight => weight.value === value);
  },

  /**
   * Gets text decoration object by value
   */
  getTextDecorationByValue(value: string): TextDecoration | undefined {
    return TEXT_DECORATIONS.find(decoration => decoration.value === value);
  },

  /**
   * Gets text transform object by value
   */
  getTextTransformByValue(value: string): TextTransform | undefined {
    return TEXT_TRANSFORMS.find(transform => transform.value === value);
  },

  /**
   * Gets alignment option by value
   */
  getAlignmentOptionByValue(value: string): AlignmentOption | undefined {
    return ALIGNMENT_OPTIONS.find(option => option.value === value);
  },

  /**
   * Generates CSS style object from typography data
   */
  getTypographyStyles(data: Partial<TypographyData>): React.CSSProperties {
    const validated = this.validateTypographyData(data);

    return {
      fontFamily: validated.fontFamily,
      fontSize: `${validated.fontSize}px`,
      fontWeight: validated.fontWeight,
      lineHeight: validated.lineHeight,
      textAlign: validated.textAlign as any,
      color: validated.color,
      textDecoration: validated.textDecoration,
      textTransform: validated.textTransform as any,
      letterSpacing: `${validated.letterSpacing}px`,
    };
  },

  /**
   * Checks if typography data is valid
   */
  isValidTypographyData(data: any): data is TypographyData {
    if (typeof data !== 'object' || data === null) return false;

    const validFontFamilies = FONT_FAMILIES.map(f => f.value);
    const validFontWeights = FONT_WEIGHTS.map(w => w.value);
    const validTextDecorations = TEXT_DECORATIONS.map(d => d.value);
    const validTextTransforms = TEXT_TRANSFORMS.map(t => t.value);
    const validAlignments = ALIGNMENT_OPTIONS.map(a => a.value);

    return (
      (data.fontFamily === undefined || validFontFamilies.includes(data.fontFamily)) &&
      (data.fontSize === undefined ||
        (typeof data.fontSize === 'number' &&
          data.fontSize >= TYPOGRAPHY_CONSTRAINTS.fontSize.min &&
          data.fontSize <= TYPOGRAPHY_CONSTRAINTS.fontSize.max)) &&
      (data.fontWeight === undefined || validFontWeights.includes(data.fontWeight)) &&
      (data.lineHeight === undefined ||
        (typeof data.lineHeight === 'number' &&
          data.lineHeight >= TYPOGRAPHY_CONSTRAINTS.lineHeight.min &&
          data.lineHeight <= TYPOGRAPHY_CONSTRAINTS.lineHeight.max)) &&
      (data.textAlign === undefined || validAlignments.includes(data.textAlign)) &&
      (data.color === undefined || typeof data.color === 'string') &&
      (data.textDecoration === undefined || validTextDecorations.includes(data.textDecoration)) &&
      (data.textTransform === undefined || validTextTransforms.includes(data.textTransform)) &&
      (data.letterSpacing === undefined ||
        (typeof data.letterSpacing === 'number' &&
          data.letterSpacing >= TYPOGRAPHY_CONSTRAINTS.letterSpacing.min &&
          data.letterSpacing <= TYPOGRAPHY_CONSTRAINTS.letterSpacing.max))
    );
  },

  /**
   * Creates typography property keys object with custom key names
   */
  createPropertyKeys(
    overrides: Partial<{
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      textAlign: string;
      color: string;
      textDecoration: string;
      textTransform: string;
      letterSpacing: string;
    }> = {}
  ) {
    return {
      fontFamily: overrides.fontFamily || 'fontFamily',
      fontSize: overrides.fontSize || 'fontSize',
      fontWeight: overrides.fontWeight || 'fontWeight',
      lineHeight: overrides.lineHeight || 'lineHeight',
      textAlign: overrides.textAlign || 'textAlign',
      color: overrides.color || 'color',
      textDecoration: overrides.textDecoration || 'textDecoration',
      textTransform: overrides.textTransform || 'textTransform',
      letterSpacing: overrides.letterSpacing || 'letterSpacing',
    };
  },
};

// Quick access utilities for common typography operations
export const getTypographyValue = <T extends keyof TypographyData>(
  data: Partial<TypographyData>,
  key: T,
  fallback?: TypographyData[T]
): TypographyData[T] => {
  return data[key] ?? fallback ?? TYPOGRAPHY_DEFAULTS[key];
};

export const updateTypography = (
  currentData: Partial<TypographyData>,
  updates: Partial<TypographyData>
): TypographyData => {
  const merged = { ...currentData, ...updates };
  return typographyUtils.validateTypographyData(merged);
};

// Type guards for runtime type checking
export const isValidFontFamily = (value: any): value is string => {
  return typeof value === 'string' && FONT_FAMILIES.some(font => font.value === value);
};

export const isValidFontWeight = (value: any): value is number => {
  return typeof value === 'number' && FONT_WEIGHTS.some(weight => weight.value === value);
};

export const isValidTextAlign = (value: any): value is string => {
  return typeof value === 'string' && ALIGNMENT_OPTIONS.some(option => option.value === value);
};
