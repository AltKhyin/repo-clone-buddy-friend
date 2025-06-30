// ABOUTME: Advanced theme system types and schemas for comprehensive visual customization

import { z } from 'zod';

// Color System Schema
export const ColorSchema = z.object({
  50: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  100: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  200: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  300: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  400: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  500: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  600: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  700: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  800: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  900: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  950: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
});

export type ColorPalette = z.infer<typeof ColorSchema>;

// Typography System Schema
export const TypographyScaleSchema = z.object({
  xs: z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
  sm: z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
  base: z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
  lg: z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
  xl: z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
  '2xl': z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
  '3xl': z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
  '4xl': z.object({
    fontSize: z.string(),
    lineHeight: z.string(),
    fontWeight: z.number().min(100).max(900),
  }),
});

export type TypographyScale = z.infer<typeof TypographyScaleSchema>;

// Font Family Schema
export const FontFamilySchema = z.object({
  primary: z.object({
    name: z.string(),
    fallback: z.array(z.string()),
    weights: z.array(z.number().min(100).max(900)),
    googleFont: z.boolean().optional(),
    url: z.string().url().optional(),
  }),
  secondary: z.object({
    name: z.string(),
    fallback: z.array(z.string()),
    weights: z.array(z.number().min(100).max(900)),
    googleFont: z.boolean().optional(),
    url: z.string().url().optional(),
  }),
  monospace: z.object({
    name: z.string(),
    fallback: z.array(z.string()),
    weights: z.array(z.number().min(100).max(900)),
    googleFont: z.boolean().optional(),
    url: z.string().url().optional(),
  }),
});

export type FontFamily = z.infer<typeof FontFamilySchema>;

// Spacing System Schema
export const SpacingSystemSchema = z.object({
  xs: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  '3xl': z.string(),
  '4xl': z.string(),
});

export type SpacingSystem = z.infer<typeof SpacingSystemSchema>;

// Shadow System Schema
export const ShadowSystemSchema = z.object({
  sm: z.string(),
  base: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  inner: z.string(),
});

export type ShadowSystem = z.infer<typeof ShadowSystemSchema>;

// Border Radius System Schema
export const BorderRadiusSystemSchema = z.object({
  none: z.string(),
  sm: z.string(),
  base: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  '3xl': z.string(),
  full: z.string(),
});

export type BorderRadiusSystem = z.infer<typeof BorderRadiusSystemSchema>;

// Complete Theme Schema
export const CustomThemeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Theme name is required'),
  description: z.string().optional(),
  category: z.enum(['academic', 'corporate', 'creative', 'minimal', 'custom']),

  // Color System
  colors: z.object({
    primary: ColorSchema,
    secondary: ColorSchema,
    accent: ColorSchema,
    neutral: ColorSchema,
    success: ColorSchema,
    warning: ColorSchema,
    error: ColorSchema,
    info: ColorSchema,
  }),

  // Typography System
  typography: z.object({
    fontFamilies: FontFamilySchema,
    scales: z.object({
      heading: TypographyScaleSchema,
      body: TypographyScaleSchema,
      caption: TypographyScaleSchema,
    }),
  }),

  // Layout System
  layout: z.object({
    spacing: SpacingSystemSchema,
    shadows: ShadowSystemSchema,
    borderRadius: BorderRadiusSystemSchema,
    maxWidth: z.object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
      xl: z.string(),
      '2xl': z.string(),
      '3xl': z.string(),
      '4xl': z.string(),
      '5xl': z.string(),
      '6xl': z.string(),
      '7xl': z.string(),
      full: z.string(),
    }),
  }),

  // Theme Metadata
  metadata: z.object({
    version: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().default(false),
    isDefault: z.boolean().default(false),
  }),

  // Block-specific Customizations
  blockStyles: z.object({
    textBlock: z.object({
      defaultFontFamily: z.enum(['primary', 'secondary', 'monospace']),
      defaultSize: z.string(),
      lineHeight: z.number().min(1).max(3),
      letterSpacing: z.string().optional(),
    }),
    headingBlock: z.object({
      defaultFontFamily: z.enum(['primary', 'secondary', 'monospace']),
      fontWeight: z.number().min(100).max(900),
      marginBottom: z.string(),
      color: z.string().optional(),
    }),
    keyTakeawayBlock: z.object({
      borderWidth: z.string(),
      borderStyle: z.enum(['solid', 'dashed', 'dotted']),
      padding: z.string(),
      borderRadius: z.string(),
      iconSize: z.number().min(12).max(32),
    }),
    separatorBlock: z.object({
      defaultThickness: z.number().min(1).max(8),
      defaultStyle: z.enum(['solid', 'dashed', 'dotted']),
      margin: z.string(),
      opacity: z.number().min(0.1).max(1),
    }),
    referenceBlock: z.object({
      fontSize: z.string(),
      fontStyle: z.enum(['normal', 'italic']),
      borderLeft: z.boolean(),
      backgroundColor: z.string().optional(),
      padding: z.string(),
    }),
  }),
});

export type CustomTheme = z.infer<typeof CustomThemeSchema>;

// Theme Application Mode
export type ThemeApplicationMode = 'global' | 'document' | 'selection';

// Theme Export Format
export const ThemeExportSchema = z.object({
  format: z.enum(['json', 'css', 'tailwind']),
  theme: CustomThemeSchema,
  settings: z.object({
    includeMetadata: z.boolean().default(true),
    includeBlockStyles: z.boolean().default(true),
    cssPrefix: z.string().optional(),
    generateUtilities: z.boolean().default(false),
  }),
});

export type ThemeExport = z.infer<typeof ThemeExportSchema>;

// Theme Import Schema
export const ThemeImportSchema = z.object({
  source: z.enum(['file', 'url', 'preset']),
  data: z.union([CustomThemeSchema, z.string()]),
  options: z.object({
    overwriteExisting: z.boolean().default(false),
    validateColors: z.boolean().default(true),
    generateMissingShades: z.boolean().default(true),
  }),
});

export type ThemeImport = z.infer<typeof ThemeImportSchema>;

// Predefined Theme Categories
export const THEME_CATEGORIES = {
  academic: {
    name: 'Academic',
    description: 'Professional themes for research papers and academic content',
    icon: 'GraduationCap',
  },
  corporate: {
    name: 'Corporate',
    description: 'Business-focused themes for professional documents',
    icon: 'Building2',
  },
  creative: {
    name: 'Creative',
    description: 'Vibrant themes for artistic and creative content',
    icon: 'Palette',
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean, simple themes focusing on content',
    icon: 'Minus',
  },
  custom: {
    name: 'Custom',
    description: 'User-created themes',
    icon: 'Settings',
  },
} as const;

// Theme Validation Errors
export type ThemeValidationError = {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
};

// Theme Analytics
export type ThemeUsageAnalytics = {
  themeId: string;
  usageCount: number;
  lastUsed: string;
  popularBlocks: string[];
  averageRating?: number;
  userFeedback?: string[];
};
