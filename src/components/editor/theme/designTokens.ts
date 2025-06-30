// ABOUTME: Universal design tokens system for consistent theming across all block types

import { z } from 'zod';

// Color palette definitions
export const COLOR_PALETTE = {
  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Primary colors (blue)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Semantic colors
  semantic: {
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      900: '#7f1d1d',
    },
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    }
  }
} as const;

// Typography scale
export const TYPOGRAPHY_SCALE = {
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  }
} as const;

// Spacing scale
export const SPACING_SCALE = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// Border radius scale
export const RADIUS_SCALE = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

// Shadow scale
export const SHADOW_SCALE = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Animation tokens
export const ANIMATION_TOKENS = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  transition: {
    all: 'all 200ms ease-in-out',
    colors: 'color 200ms ease-in-out, background-color 200ms ease-in-out, border-color 200ms ease-in-out',
    transform: 'transform 200ms ease-in-out',
    opacity: 'opacity 200ms ease-in-out',
  }
} as const;

// Block-specific theme configurations
export const BLOCK_THEMES = {
  textBlock: {
    defaultFontSize: TYPOGRAPHY_SCALE.fontSize.base,
    defaultLineHeight: TYPOGRAPHY_SCALE.lineHeight.normal,
    defaultPadding: { x: SPACING_SCALE[4], y: SPACING_SCALE[3] },
    borderRadius: RADIUS_SCALE.md,
  },
  
  headingBlock: {
    fontSizes: {
      1: TYPOGRAPHY_SCALE.fontSize['4xl'],
      2: TYPOGRAPHY_SCALE.fontSize['3xl'],
      3: TYPOGRAPHY_SCALE.fontSize['2xl'],
      4: TYPOGRAPHY_SCALE.fontSize.xl,
    },
    defaultLineHeight: TYPOGRAPHY_SCALE.lineHeight.tight,
    defaultPadding: { x: SPACING_SCALE[3], y: SPACING_SCALE[2] },
    borderRadius: RADIUS_SCALE.md,
  },
  
  keyTakeawayBlock: {
    themes: {
      info: {
        background: COLOR_PALETTE.semantic.info[50],
        border: COLOR_PALETTE.semantic.info[500],
        text: COLOR_PALETTE.semantic.info[900],
      },
      success: {
        background: COLOR_PALETTE.semantic.success[50],
        border: COLOR_PALETTE.semantic.success[500],
        text: COLOR_PALETTE.semantic.success[900],
      },
      warning: {
        background: COLOR_PALETTE.semantic.warning[50],
        border: COLOR_PALETTE.semantic.warning[500],
        text: COLOR_PALETTE.semantic.warning[900],
      },
      error: {
        background: COLOR_PALETTE.semantic.error[50],
        border: COLOR_PALETTE.semantic.error[500],
        text: COLOR_PALETTE.semantic.error[900],
      },
    },
    defaultPadding: { x: SPACING_SCALE[4], y: SPACING_SCALE[3] },
    borderRadius: RADIUS_SCALE.lg,
  },
  
  referenceBlock: {
    defaultPadding: { x: SPACING_SCALE[4], y: SPACING_SCALE[3] },
    borderRadius: RADIUS_SCALE.md,
    borderWidth: '4px',
    borderColor: COLOR_PALETTE.neutral[400],
  },
  
  separatorBlock: {
    thickness: {
      min: 1,
      max: 10,
      default: 1,
    },
    colors: [
      COLOR_PALETTE.neutral[300],
      COLOR_PALETTE.neutral[400],
      COLOR_PALETTE.neutral[500],
      COLOR_PALETTE.primary[300],
      COLOR_PALETTE.primary[500],
    ]
  }
} as const;

// Theme schema for validation
export const ThemeSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string(),
    foreground: z.string(),
    muted: z.string(),
    mutedForeground: z.string(),
    border: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.record(z.string()),
    fontWeight: z.record(z.number()),
    lineHeight: z.record(z.number()),
  }),
  spacing: z.record(z.string()),
  borderRadius: z.record(z.string()),
});

export type Theme = z.infer<typeof ThemeSchema>;

// Utility functions for theme manipulation
export const themeUtils = {
  // Get color with opacity
  withOpacity: (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  // Get contrasting text color
  getContrastColor: (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128 ? COLOR_PALETTE.neutral[900] : COLOR_PALETTE.neutral[50];
  },
  
  // Generate theme from primary color
  generateTheme: (primaryColor: string): Partial<Theme> => ({
    colors: {
      primary: primaryColor,
      background: COLOR_PALETTE.neutral[50],
      foreground: COLOR_PALETTE.neutral[900],
      muted: COLOR_PALETTE.neutral[100],
      mutedForeground: COLOR_PALETTE.neutral[500],
      border: COLOR_PALETTE.neutral[200],
    }
  }),
  
  // Get block theme for specific block type
  getBlockTheme: (blockType: keyof typeof BLOCK_THEMES) => {
    return BLOCK_THEMES[blockType];
  },
  
  // Apply responsive scaling
  getResponsiveValue: (baseValue: string, viewport: 'mobile' | 'desktop') => {
    if (viewport === 'mobile') {
      // Scale down by 10% for mobile
      const numericValue = parseFloat(baseValue);
      if (!isNaN(numericValue)) {
        return `${numericValue * 0.9}${baseValue.replace(/[0-9.]/g, '')}`;
      }
    }
    return baseValue;
  }
};

// Preset themes
export const PRESET_THEMES = {
  default: {
    name: 'Default',
    colors: {
      primary: COLOR_PALETTE.primary[500],
      background: COLOR_PALETTE.neutral[50],
      foreground: COLOR_PALETTE.neutral[900],
      muted: COLOR_PALETTE.neutral[100],
      mutedForeground: COLOR_PALETTE.neutral[500],
      border: COLOR_PALETTE.neutral[200],
    }
  },
  
  minimal: {
    name: 'Minimal',
    colors: {
      primary: COLOR_PALETTE.neutral[900],
      background: '#ffffff',
      foreground: COLOR_PALETTE.neutral[900],
      muted: COLOR_PALETTE.neutral[50],
      mutedForeground: COLOR_PALETTE.neutral[600],
      border: COLOR_PALETTE.neutral[200],
    }
  },
  
  academic: {
    name: 'Academic',
    colors: {
      primary: '#1e40af',
      background: '#fafafa',
      foreground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      border: '#d1d5db',
    }
  }
} as const;