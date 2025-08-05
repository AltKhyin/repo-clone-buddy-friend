// ABOUTME: Comprehensive color token system with enhanced categorization and metadata for theme-aware color management

import type { ColorToken, ColorTokenCategory } from '@/components/editor/shared/types/color-types';

/**
 * Text color tokens for all text-related elements
 */
const TEXT_TOKENS: ColorToken[] = [
  {
    id: 'foreground',
    name: 'Primary Text',
    value: 'hsl(var(--foreground))',
    category: 'text',
    description: 'Primary text color that adapts to the current theme',
    cssVariable: '--foreground',
    preview: '#1a1a1a',
    useCase: ['body text', 'headings', 'primary content'],
    accessibilityNotes: 'Maintains WCAG AA contrast ratio across all themes',
  },
  {
    id: 'text-secondary',
    name: 'Secondary Text',
    value: 'hsl(var(--text-secondary))',
    category: 'text',
    description: 'Secondary text color for less prominent content',
    cssVariable: '--text-secondary',
    preview: '#6b7280',
    useCase: ['captions', 'labels', 'metadata'],
    accessibilityNotes: 'WCAG AA compliant for secondary information',
  },
  {
    id: 'text-tertiary',
    name: 'Tertiary Text',
    value: 'hsl(var(--text-tertiary))',
    category: 'text',
    description: 'Tertiary text color for subtle content',
    cssVariable: '--text-tertiary',
    preview: '#9ca3af',
    useCase: ['placeholders', 'disabled text', 'subtle annotations'],
    accessibilityNotes: 'Use carefully - ensure sufficient contrast for important content',
  },
  {
    id: 'muted-foreground',
    name: 'Muted Text',
    value: 'hsl(var(--muted-foreground))',
    category: 'text',
    description: 'Muted text color for less important information',
    cssVariable: '--muted-foreground',
    preview: '#9ca3af',
    useCase: ['form labels', 'help text', 'inactive states'],
    accessibilityNotes: 'Meets WCAG AA for informational text',
  },
];

/**
 * Background color tokens for surfaces and containers
 */
const BACKGROUND_TOKENS: ColorToken[] = [
  {
    id: 'background',
    name: 'Primary Background',
    value: 'hsl(var(--background))',
    category: 'background',
    description: 'Primary background color that adapts to the current theme',
    cssVariable: '--background',
    preview: '#ffffff',
    useCase: ['page background', 'main container', 'card surfaces'],
    accessibilityNotes: 'High contrast foundation for all content',
  },
  {
    id: 'surface',
    name: 'Surface',
    value: 'hsl(var(--surface))',
    category: 'background',
    description: 'Surface background for elevated elements',
    cssVariable: '--surface',
    preview: '#f8f9fa',
    useCase: ['cards', 'modals', 'editor blocks'],
    accessibilityNotes: 'Subtle elevation while maintaining readability',
  },
  {
    id: 'surface-muted',
    name: 'Muted Surface',
    value: 'hsl(var(--surface-muted))',
    category: 'background',
    description: 'Subtle surface background for secondary elements',
    cssVariable: '--surface-muted',
    preview: '#f1f3f4',
    useCase: ['inactive elements', 'subtle backgrounds', 'placeholders'],
    accessibilityNotes: 'Subtle contrast for secondary surfaces',
  },
  {
    id: 'muted',
    name: 'Muted Background',
    value: 'hsl(var(--muted))',
    category: 'background',
    description: 'Muted background color for subtle elements',
    cssVariable: '--muted',
    preview: '#f3f4f6',
    useCase: ['form backgrounds', 'inactive states', 'subtle highlights'],
    accessibilityNotes: 'Low contrast for subtle visual separation',
  },
];

/**
 * Semantic color tokens for contextual meaning
 */
const SEMANTIC_TOKENS: ColorToken[] = [
  {
    id: 'success',
    name: 'Success',
    value: 'hsl(var(--success))',
    category: 'semantic',
    description: 'Success and positive feedback color',
    cssVariable: '--success',
    preview: '#22c55e',
    useCase: ['success messages', 'positive actions', 'upvotes'],
    accessibilityNotes: 'WCAG AA compliant green for positive feedback',
  },
  {
    id: 'destructive',
    name: 'Error',
    value: 'hsl(var(--destructive))',
    category: 'semantic',
    description: 'Error and destructive action color',
    cssVariable: '--destructive',
    preview: '#ef4444',
    useCase: ['error messages', 'delete actions', 'warnings'],
    accessibilityNotes: 'High contrast red for critical actions',
  },
  {
    id: 'success-muted',
    name: 'Success Highlight',
    value: 'hsl(var(--success-muted))',
    category: 'semantic',
    description: 'Subtle success background for highlighting',
    cssVariable: '--success-muted',
    preview: '#dcfce7',
    useCase: ['success notification backgrounds', 'positive highlights'],
    accessibilityNotes: 'Subtle green background maintaining text readability',
  },
  {
    id: 'success-muted-hover',
    name: 'Success Highlight Hover',
    value: 'hsl(var(--success-muted-hover))',
    category: 'semantic',
    description: 'Hover state for success highlight backgrounds',
    cssVariable: '--success-muted-hover',
    preview: '#bbf7d0',
    useCase: ['success button hover states', 'positive interaction feedback'],
    accessibilityNotes: 'Enhanced contrast for interactive success elements',
  },
  {
    id: 'primary',
    name: 'Primary',
    value: 'hsl(var(--primary))',
    category: 'semantic',
    description: 'Primary brand and action color',
    cssVariable: '--primary',
    preview: '#3b82f6',
    useCase: ['primary buttons', 'links', 'brand elements'],
    accessibilityNotes: 'Brand color meeting WCAG AA contrast requirements',
  },
  {
    id: 'primary-foreground',
    name: 'Primary Text',
    value: 'hsl(var(--primary-foreground))',
    category: 'semantic',
    description: 'Text color for primary colored backgrounds',
    cssVariable: '--primary-foreground',
    preview: '#ffffff',
    useCase: ['text on primary buttons', 'primary element text'],
    accessibilityNotes: 'High contrast text for primary backgrounds',
  },
];

/**
 * Neutral color tokens for borders, dividers and subtle elements
 */
const NEUTRAL_TOKENS: ColorToken[] = [
  {
    id: 'border',
    name: 'Border',
    value: 'hsl(var(--border))',
    category: 'neutral',
    description: 'Default border color that adapts to theme',
    cssVariable: '--border',
    preview: '#e5e7eb',
    useCase: ['component borders', 'dividers', 'outlines'],
    accessibilityNotes: 'Subtle contrast for visual separation',
  },
  {
    id: 'block-border-default',
    name: 'Block Border',
    value: 'hsl(var(--block-border-default))',
    category: 'neutral',
    description: 'Default border for editor blocks and components',
    cssVariable: '--block-border-default',
    preview: '#e2e8f0',
    useCase: ['editor blocks', 'content containers', 'input fields'],
    accessibilityNotes: 'Subtle border for content organization',
  },
  {
    id: 'block-border-active',
    name: 'Active Block Border',
    value: 'hsl(var(--block-border-active))',
    category: 'neutral',
    description: 'Active/focused state border for blocks',
    cssVariable: '--block-border-active',
    preview: '#3b82f6',
    useCase: ['focused editor blocks', 'active selection', 'hover states'],
    accessibilityNotes: 'High contrast for active states and focus indicators',
  },
  {
    id: 'separator-line',
    name: 'Separator',
    value: 'hsl(var(--separator-line))',
    category: 'neutral',
    description: 'Line separator for content divisions',
    cssVariable: '--separator-line',
    preview: '#e5e7eb',
    useCase: ['horizontal rules', 'content dividers', 'section breaks'],
    accessibilityNotes: 'Subtle visual separation while maintaining flow',
  },
];

/**
 * Accent color tokens for highlights and special styling
 */
const ACCENT_TOKENS: ColorToken[] = [
  {
    id: 'accent',
    name: 'Accent',
    value: 'hsl(var(--accent))',
    category: 'accent',
    description: 'Accent color for highlights and emphasis',
    cssVariable: '--accent',
    preview: '#f1f5f9',
    useCase: ['highlights', 'hover states', 'subtle emphasis'],
    accessibilityNotes: 'Subtle accent maintaining readability',
  },
  {
    id: 'accent-foreground',
    name: 'Accent Text',
    value: 'hsl(var(--accent-foreground))',
    category: 'accent',
    description: 'Text color for accent backgrounds',
    cssVariable: '--accent-foreground',
    preview: '#0f172a',
    useCase: ['text on accent backgrounds', 'accent element text'],
    accessibilityNotes: 'High contrast text for accent backgrounds',
  },
  {
    id: 'quote-accent',
    name: 'Quote Accent',
    value: 'hsl(var(--quote-accent))',
    category: 'accent',
    description: 'Accent color for quote blocks and citations',
    cssVariable: '--quote-accent',
    preview: '#d97706',
    useCase: ['quote borders', 'citation highlights', 'quote emphasis'],
    accessibilityNotes: 'Warm orange for quote attribution and emphasis',
  },
  {
    id: 'table-header-background',
    name: 'Table Header',
    value: 'hsl(var(--table-header-background))',
    category: 'accent',
    description: 'Background color for table headers',
    cssVariable: '--table-header-background',
    preview: '#f8fafc',
    useCase: ['table headers', 'data grid headers', 'column titles'],
    accessibilityNotes: 'Subtle background for data organization',
  },
];

/**
 * Editor-specific color tokens for specialized editor components
 */
const EDITOR_TOKENS: ColorToken[] = [
  {
    id: 'editor-canvas-background',
    name: 'Editor Canvas',
    value: 'hsl(var(--editor-canvas-background))',
    category: 'editor',
    description: 'Background color for the editor canvas area',
    cssVariable: '--editor-canvas-background',
    preview: '#ffffff',
    useCase: ['editor canvas', 'writing area', 'content workspace'],
    accessibilityNotes: 'Clean background optimized for content creation',
  },
  {
    id: 'quote-background',
    name: 'Quote Background',
    value: 'hsl(var(--quote-background))',
    category: 'editor',
    description: 'Background color for quote blocks',
    cssVariable: '--quote-background',
    preview: '#fef7ed',
    useCase: ['quote blocks', 'cited content', 'highlighted quotes'],
    accessibilityNotes: 'Warm background for quote content readability',
  },
  {
    id: 'quote-text',
    name: 'Quote Text',
    value: 'hsl(var(--quote-text))',
    category: 'editor',
    description: 'Text color for quote content',
    cssVariable: '--quote-text',
    preview: '#1f2937',
    useCase: ['quote text', 'cited content text'],
    accessibilityNotes: 'High contrast for quote readability',
  },
  {
    id: 'quote-citation',
    name: 'Quote Citation',
    value: 'hsl(var(--quote-citation))',
    category: 'editor',
    description: 'Text color for quote citations and attribution',
    cssVariable: '--quote-citation',
    preview: '#6b7280',
    useCase: ['citation text', 'quote attribution', 'source references'],
    accessibilityNotes: 'Readable secondary text for citations',
  },
  {
    id: 'poll-option-background',
    name: 'Poll Option Background',
    value: 'hsl(var(--poll-option-background))',
    category: 'editor',
    description: 'Background for poll option items',
    cssVariable: '--poll-option-background',
    preview: '#f9fafb',
    useCase: ['poll options', 'selectable items', 'choice buttons'],
    accessibilityNotes: 'Subtle background for interactive poll elements',
  },
  {
    id: 'poll-result-bar',
    name: 'Poll Result Bar',
    value: 'hsl(var(--poll-result-bar))',
    category: 'editor',
    description: 'Color for poll result progress bars',
    cssVariable: '--poll-result-bar',
    preview: '#e5e7eb',
    useCase: ['poll result visualization', 'progress indicators'],
    accessibilityNotes: 'Clear visual representation of poll data',
  },
  {
    id: 'poll-result-bar-selected',
    name: 'Poll Result Bar Selected',
    value: 'hsl(var(--poll-result-bar-selected))',
    category: 'editor',
    description: 'Color for selected poll result bars',
    cssVariable: '--poll-result-bar-selected',
    preview: '#3b82f6',
    useCase: ['selected poll results', 'user choice highlight'],
    accessibilityNotes: 'High contrast for user selection indication',
  },
];

/**
 * All available color tokens organized by category
 */
export const COLOR_TOKEN_CATEGORIES = {
  text: TEXT_TOKENS,
  background: BACKGROUND_TOKENS,
  semantic: SEMANTIC_TOKENS,
  neutral: NEUTRAL_TOKENS,
  accent: ACCENT_TOKENS,
  editor: EDITOR_TOKENS,
} as const;

/**
 * Flattened array of all color tokens for iteration
 */
export const ALL_COLOR_TOKENS: ColorToken[] = [
  ...TEXT_TOKENS,
  ...BACKGROUND_TOKENS,
  ...SEMANTIC_TOKENS,
  ...NEUTRAL_TOKENS,
  ...ACCENT_TOKENS,
  ...EDITOR_TOKENS,
];

/**
 * Mapping from token IDs to token objects for quick lookup
 */
export const COLOR_TOKEN_MAP = new Map(
  ALL_COLOR_TOKENS.map(token => [token.id, token])
);

/**
 * Check if a color value is a theme token reference
 */
export function isThemeToken(value: string): boolean {
  return value.startsWith('hsl(var(--') && value.endsWith('))');
}

/**
 * Extract token ID from a theme token value
 * @param value - Theme token value like 'hsl(var(--foreground))'
 * @returns Token ID or null if not a valid token
 */
export function extractTokenId(value: string): string | null {
  if (!isThemeToken(value)) return null;
  
  const match = value.match(/hsl\(var\(--([^)]+)\)\)/);
  return match ? match[1] : null;
}

/**
 * Get token information by value
 * Safely handles null returns from extractTokenId
 */
export function getTokenByValue(value: string): ColorToken | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  
  const tokenId = extractTokenId(value);
  if (!tokenId) {
    return null; // extractTokenId returned null
  }
  
  return COLOR_TOKEN_MAP.get(tokenId) || null;
}


/**
 * Validate color value format (hex, rgb, hsl, or theme token)
 */
export function validateColorValue(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Check if it's a theme token
  if (isThemeToken(value)) {
    const tokenId = extractTokenId(value);
    return tokenId ? COLOR_TOKEN_MAP.has(tokenId) : false;
  }
  
  // Check common color formats
  const colorFormats = [
    /^#[0-9A-Fa-f]{3,8}$/, // Hex
    /^rgb\(/, // RGB
    /^rgba\(/, // RGBA
    /^hsl\(/, // HSL
    /^hsla\(/, // HSLA
    /^(red|blue|green|yellow|purple|orange|pink|black|white|gray|grey)$/i, // Named colors
  ];
  
  return colorFormats.some(regex => regex.test(value.trim()));
}

/**
 * Centralized validation for color values or theme tokens
 * Combines validateColorValue and isThemeToken checks to eliminate duplication
 */
export function validateColorOrToken(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return validateColorValue(value) || isThemeToken(value);
}

/**
 * Safely get a required color token, throwing an error if not found
 */
function getRequiredToken(id: string): ColorToken {
  const token = COLOR_TOKEN_MAP.get(id);
  if (!token) {
    throw new Error(`Required color token not found: ${id}`);
  }
  return token;
}

/**
 * Safely initialize default color sets with error handling
 */
function initializeDefaultColorSets() {
  try {
    return {
      text: [
        getRequiredToken('foreground'),
        getRequiredToken('text-secondary'),
        getRequiredToken('text-tertiary'),
        getRequiredToken('muted-foreground'),
      ],
      background: [
        getRequiredToken('background'),
        getRequiredToken('surface'),
        getRequiredToken('surface-muted'),
        getRequiredToken('muted'),
      ],
      semantic: [
        getRequiredToken('primary'),
        getRequiredToken('success'),
        getRequiredToken('destructive'),
        getRequiredToken('success-muted'),
      ],
      accent: [
        getRequiredToken('accent'),
        getRequiredToken('quote-accent'),
        getRequiredToken('table-header-background'),
      ],
      neutral: [
        getRequiredToken('border'),
        getRequiredToken('block-border-default'),
        getRequiredToken('separator-line'),
      ],
    } as const;
  } catch (error) {
    console.error('Failed to initialize default color sets:', error);
    // Fallback to empty arrays to prevent complete system failure
    return {
      text: [],
      background: [],
      semantic: [],
      accent: [],
      neutral: [],
    } as const;
  }
}

/**
 * Get default color tokens for common use cases
 */
export const DEFAULT_COLOR_SETS = initializeDefaultColorSets();