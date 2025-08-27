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
    id: 'text-primary',
    name: 'Text Primary',
    value: 'hsl(var(--text-primary))',
    category: 'text',
    description: 'Primary text color for main content',
    cssVariable: '--text-primary',
    preview: '#1a1a1a',
    useCase: ['primary text', 'main content', 'titles'],
    accessibilityNotes: 'High contrast primary text',
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
  {
    id: 'further-muted-text',
    name: 'Further Muted Text',
    value: 'hsl(var(--further-muted-text))',
    category: 'text',
    description: 'Even more muted text for very subtle content',
    cssVariable: '--further-muted-text',
    preview: '#a5a5a5',
    useCase: ['very subtle text', 'disabled content', 'placeholders'],
    accessibilityNotes: 'Use sparingly - minimal contrast for subtle annotations',
  },
  {
    id: 'reddit-text-primary',
    name: 'Reddit Primary Text',
    value: 'hsl(var(--reddit-text-primary))',
    category: 'text',
    description: 'Reddit-style primary text color',
    cssVariable: '--reddit-text-primary',
    preview: '#1a1a1a',
    useCase: ['reddit components', 'feed items', 'primary content'],
    accessibilityNotes: 'Reddit-optimized text contrast',
  },
  {
    id: 'reddit-text-secondary',
    name: 'Reddit Secondary Text',
    value: 'hsl(var(--reddit-text-secondary))',
    category: 'text',
    description: 'Reddit-style secondary text color',
    cssVariable: '--reddit-text-secondary',
    preview: '#6b7280',
    useCase: ['reddit metadata', 'post info', 'secondary content'],
    accessibilityNotes: 'Reddit-optimized secondary text',
  },
  {
    id: 'reddit-text-meta',
    name: 'Reddit Meta Text',
    value: 'hsl(var(--reddit-text-meta))',
    category: 'text',
    description: 'Reddit-style meta text for timestamps and info',
    cssVariable: '--reddit-text-meta',
    preview: '#8a8a8a',
    useCase: ['timestamps', 'author info', 'post metrics'],
    accessibilityNotes: 'Reddit-optimized meta information text',
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
    id: 'surface-hover',
    name: 'Surface Hover',
    value: 'hsl(var(--surface-hover))',
    category: 'background',
    description: 'Hover state background for interactive surfaces',
    cssVariable: '--surface-hover',
    preview: '#e8eaed',
    useCase: ['hover states', 'interactive backgrounds', 'button hovers'],
    accessibilityNotes: 'Subtle hover feedback for interactions',
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
  {
    id: 'reddit-sidebar-background',
    name: 'Reddit Sidebar',
    value: 'hsl(var(--reddit-sidebar-background))',
    category: 'background',
    description: 'Reddit-style sidebar background color',
    cssVariable: '--reddit-sidebar-background',
    preview: '#f5f5f0',
    useCase: ['sidebar', 'navigation panels', 'secondary containers'],
    accessibilityNotes: 'Reddit-optimized sidebar contrast',
  },
  {
    id: 'reddit-background-main',
    name: 'Reddit Main Background',
    value: 'hsl(var(--reddit-background-main))',
    category: 'background',
    description: 'Reddit-style main content background',
    cssVariable: '--reddit-background-main',
    preview: '#fafaf8',
    useCase: ['main content area', 'feed background', 'primary surfaces'],
    accessibilityNotes: 'Reddit-optimized main content background',
  },
  {
    id: 'reddit-hover-background',
    name: 'Reddit Hover Background',
    value: 'hsl(var(--reddit-hover-background))',
    category: 'background',
    description: 'Reddit-style hover background color',
    cssVariable: '--reddit-hover-background',
    preview: '#e8eaed',
    useCase: ['post hover', 'item hover', 'interactive hover states'],
    accessibilityNotes: 'Reddit-optimized hover feedback',
  },
  {
    id: 'action-hover',
    name: 'Action Hover',
    value: 'hsl(var(--action-hover))',
    category: 'background',
    description: 'Background for action button hover states',
    cssVariable: '--action-hover',
    preview: '#e8eaed',
    useCase: ['action buttons', 'toolbar hovers', 'control hovers'],
    accessibilityNotes: 'Clear hover feedback for interactive elements',
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
    id: 'success-foreground',
    name: 'Success Text',
    value: 'hsl(var(--success-foreground))',
    category: 'semantic',
    description: 'Text color for success backgrounds',
    cssVariable: '--success-foreground',
    preview: '#ffffff',
    useCase: ['success button text', 'success message text'],
    accessibilityNotes: 'High contrast text for success backgrounds',
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
    id: 'destructive',
    name: 'Destructive',
    value: 'hsl(var(--destructive))',
    category: 'semantic',
    description: 'Destructive action color',
    cssVariable: '--destructive',
    preview: '#ef4444',
    useCase: ['delete actions', 'destructive buttons', 'critical actions'],
    accessibilityNotes: 'High contrast red for critical actions',
  },
  {
    id: 'destructive-foreground',
    name: 'Destructive Text',
    value: 'hsl(var(--destructive-foreground))',
    category: 'semantic',
    description: 'Text color for destructive backgrounds',
    cssVariable: '--destructive-foreground',
    preview: '#ffffff',
    useCase: ['destructive button text', 'critical action text'],
    accessibilityNotes: 'High contrast text for destructive backgrounds',
  },
  {
    id: 'error',
    name: 'Error',
    value: 'hsl(var(--error))',
    category: 'semantic',
    description: 'Error and validation color',
    cssVariable: '--error',
    preview: '#ef4444',
    useCase: ['error messages', 'validation errors', 'downvotes'],
    accessibilityNotes: 'High contrast red for error feedback',
  },
  {
    id: 'error-foreground',
    name: 'Error Text',
    value: 'hsl(var(--error-foreground))',
    category: 'semantic',
    description: 'Text color for error backgrounds',
    cssVariable: '--error-foreground',
    preview: '#ffffff',
    useCase: ['error message text', 'error button text'],
    accessibilityNotes: 'High contrast text for error backgrounds',
  },
  {
    id: 'error-muted',
    name: 'Error Highlight',
    value: 'hsl(var(--error-muted))',
    category: 'semantic',
    description: 'Subtle error background for highlighting',
    cssVariable: '--error-muted',
    preview: '#fecaca',
    useCase: ['error notification backgrounds', 'validation highlights'],
    accessibilityNotes: 'Subtle red background maintaining text readability',
  },
  {
    id: 'error-muted-hover',
    name: 'Error Highlight Hover',
    value: 'hsl(var(--error-muted-hover))',
    category: 'semantic',
    description: 'Hover state for error highlight backgrounds',
    cssVariable: '--error-muted-hover',
    preview: '#f87171',
    useCase: ['error button hover states', 'negative interaction feedback'],
    accessibilityNotes: 'Enhanced contrast for interactive error elements',
  },
  {
    id: 'warning',
    name: 'Warning',
    value: 'hsl(var(--warning))',
    category: 'semantic',
    description: 'Warning and caution color',
    cssVariable: '--warning',
    preview: '#f59e0b',
    useCase: ['warning messages', 'caution states', 'important notices'],
    accessibilityNotes: 'High contrast orange for warning feedback',
  },
  {
    id: 'warning-foreground',
    name: 'Warning Text',
    value: 'hsl(var(--warning-foreground))',
    category: 'semantic',
    description: 'Text color for warning backgrounds',
    cssVariable: '--warning-foreground',
    preview: '#ffffff',
    useCase: ['warning button text', 'warning message text'],
    accessibilityNotes: 'High contrast text for warning backgrounds',
  },
  {
    id: 'warning-muted',
    name: 'Warning Highlight',
    value: 'hsl(var(--warning-muted))',
    category: 'semantic',
    description: 'Subtle warning background for highlighting',
    cssVariable: '--warning-muted',
    preview: '#fef3c7',
    useCase: ['warning notification backgrounds', 'caution highlights'],
    accessibilityNotes: 'Subtle orange background maintaining text readability',
  },
  {
    id: 'warning-muted-hover',
    name: 'Warning Highlight Hover',
    value: 'hsl(var(--warning-muted-hover))',
    category: 'semantic',
    description: 'Hover state for warning highlight backgrounds',
    cssVariable: '--warning-muted-hover',
    preview: '#fcd34d',
    useCase: ['warning button hover states', 'caution interaction feedback'],
    accessibilityNotes: 'Enhanced contrast for interactive warning elements',
  },
  {
    id: 'danger',
    name: 'Danger',
    value: 'hsl(var(--danger))',
    category: 'semantic',
    description: 'Danger and critical action color',
    cssVariable: '--danger',
    preview: '#dc2626',
    useCase: ['critical warnings', 'danger states', 'irreversible actions'],
    accessibilityNotes: 'High contrast red for critical danger feedback',
  },
  {
    id: 'danger-foreground',
    name: 'Danger Text',
    value: 'hsl(var(--danger-foreground))',
    category: 'semantic',
    description: 'Text color for danger backgrounds',
    cssVariable: '--danger-foreground',
    preview: '#ffffff',
    useCase: ['danger button text', 'critical action text'],
    accessibilityNotes: 'High contrast text for danger backgrounds',
  },
  {
    id: 'danger-muted',
    name: 'Danger Highlight',
    value: 'hsl(var(--danger-muted))',
    category: 'semantic',
    description: 'Subtle danger background for highlighting',
    cssVariable: '--danger-muted',
    preview: '#fecaca',
    useCase: ['danger notification backgrounds', 'critical highlights'],
    accessibilityNotes: 'Subtle red background maintaining text readability',
  },
  {
    id: 'danger-muted-hover',
    name: 'Danger Highlight Hover',
    value: 'hsl(var(--danger-muted-hover))',
    category: 'semantic',
    description: 'Hover state for danger highlight backgrounds',
    cssVariable: '--danger-muted-hover',
    preview: '#f87171',
    useCase: ['danger button hover states', 'critical interaction feedback'],
    accessibilityNotes: 'Enhanced contrast for interactive danger elements',
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
    id: 'border-hover',
    name: 'Border Hover',
    value: 'hsl(var(--border-hover))',
    category: 'neutral',
    description: 'Border color for hover states',
    cssVariable: '--border-hover',
    preview: '#d1d5db',
    useCase: ['hover borders', 'interactive outlines', 'focus states'],
    accessibilityNotes: 'Enhanced border visibility on interaction',
  },
  {
    id: 'border-strong',
    name: 'Strong Border',
    value: 'hsl(var(--border-strong))',
    category: 'neutral',
    description: 'Strong border for emphasis and separation',
    cssVariable: '--border-strong',
    preview: '#9ca3af',
    useCase: ['emphasized borders', 'section separators', 'strong dividers'],
    accessibilityNotes: 'Higher contrast for important visual separation',
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
    id: 'block-border-focus',
    name: 'Block Border Focus',
    value: 'hsl(var(--block-border-focus))',
    category: 'neutral',
    description: 'Focus state border for editor blocks',
    cssVariable: '--block-border-focus',
    preview: '#3b82f6',
    useCase: ['focused blocks', 'active editor elements', 'selection borders'],
    accessibilityNotes: 'High contrast focus indication for accessibility',
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
  {
    id: 'separator-default',
    name: 'Default Separator',
    value: 'hsl(var(--separator-default))',
    category: 'neutral',
    description: 'Default separator color for general use',
    cssVariable: '--separator-default',
    preview: '#6b7280',
    useCase: ['general separators', 'divider lines', 'content breaks'],
    accessibilityNotes: 'Balanced contrast for content organization',
  },
  {
    id: 'separator-subtle',
    name: 'Subtle Separator',
    value: 'hsl(var(--separator-subtle))',
    category: 'neutral',
    description: 'Subtle separator for minimal visual division',
    cssVariable: '--separator-subtle',
    preview: '#e5e7eb',
    useCase: ['light dividers', 'subtle breaks', 'minimal separation'],
    accessibilityNotes: 'Very subtle visual separation',
  },
  {
    id: 'separator-emphasis',
    name: 'Emphasis Separator',
    value: 'hsl(var(--separator-emphasis))',
    category: 'neutral',
    description: 'Emphasized separator for strong visual division',
    cssVariable: '--separator-emphasis',
    preview: '#374151',
    useCase: ['strong dividers', 'section breaks', 'emphasized separation'],
    accessibilityNotes: 'High contrast for clear content division',
  },
  {
    id: 'reddit-divider',
    name: 'Reddit Divider',
    value: 'hsl(var(--reddit-divider))',
    category: 'neutral',
    description: 'Reddit-style divider for feed separation',
    cssVariable: '--reddit-divider',
    preview: '#e5e7eb',
    useCase: ['reddit feed', 'post separators', 'content dividers'],
    accessibilityNotes: 'Reddit-optimized content separation',
  },
  {
    id: 'comment-thread',
    name: 'Comment Thread',
    value: 'hsl(var(--comment-thread))',
    category: 'neutral',
    description: 'Thread lines for comment hierarchies',
    cssVariable: '--comment-thread',
    preview: '#d1d5db',
    useCase: ['comment threads', 'hierarchy lines', 'discussion organization'],
    accessibilityNotes: 'Clear visual hierarchy for threaded discussions',
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
    id: 'muted-accent',
    name: 'Muted Accent',
    value: 'hsl(var(--muted-accent))',
    category: 'accent',
    description: 'Even more muted accent for subtle highlights',
    cssVariable: '--muted-accent',
    preview: '#d9d9d9',
    useCase: ['very subtle highlights', 'minimal emphasis', 'background accents'],
    accessibilityNotes: 'Very subtle accent for minimal visual emphasis',
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
  {
    id: 'table-border',
    name: 'Table Border',
    value: 'hsl(var(--table-border))',
    category: 'accent',
    description: 'Border color for table elements',
    cssVariable: '--table-border',
    preview: '#e5e7eb',
    useCase: ['table borders', 'cell borders', 'table structure'],
    accessibilityNotes: 'Clear table structure definition',
  },
  {
    id: 'table-cell-background',
    name: 'Table Cell Background',
    value: 'hsl(var(--table-cell-background))',
    category: 'accent',
    description: 'Background color for table cells',
    cssVariable: '--table-cell-background',
    preview: '#ffffff',
    useCase: ['table cells', 'data display', 'cell content'],
    accessibilityNotes: 'Clear background for table data readability',
  },
  {
    id: 'table-cell-text',
    name: 'Table Cell Text',
    value: 'hsl(var(--table-cell-text))',
    category: 'accent',
    description: 'Text color for table cells',
    cssVariable: '--table-cell-text',
    preview: '#1f2937',
    useCase: ['table data', 'cell text', 'table content'],
    accessibilityNotes: 'High contrast text for table data',
  },
  {
    id: 'table-row-alternate',
    name: 'Table Row Alternate',
    value: 'hsl(var(--table-row-alternate))',
    category: 'accent',
    description: 'Alternate row background for tables',
    cssVariable: '--table-row-alternate',
    preview: '#f9fafb',
    useCase: ['alternating table rows', 'zebra striping', 'row differentiation'],
    accessibilityNotes: 'Subtle row differentiation for better readability',
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
    id: 'editor-canvas-rulers',
    name: 'Editor Rulers',
    value: 'hsl(var(--editor-canvas-rulers))',
    category: 'editor',
    description: 'Color for editor ruler lines and guides',
    cssVariable: '--editor-canvas-rulers',
    preview: '#e5e7eb',
    useCase: ['ruler lines', 'grid guides', 'layout helpers'],
    accessibilityNotes: 'Subtle guides for content layout',
  },
  {
    id: 'editor-canvas-text',
    name: 'Editor Canvas Text',
    value: 'hsl(var(--editor-canvas-text))',
    category: 'editor',
    description: 'Text color for editor ruler and guide labels',
    cssVariable: '--editor-canvas-text',
    preview: '#6b7280',
    useCase: ['ruler text', 'guide labels', 'editor annotations'],
    accessibilityNotes: 'Readable text for editor interface elements',
  },
  {
    id: 'editor-canvas-guidelines',
    name: 'Editor Guidelines',
    value: 'hsl(var(--editor-canvas-guidelines))',
    category: 'editor',
    description: 'Color for editor guidelines and alignment aids',
    cssVariable: '--editor-canvas-guidelines',
    preview: '#3b82f6',
    useCase: ['alignment guides', 'snap guidelines', 'layout aids'],
    accessibilityNotes: 'Clear visual guides for content alignment',
  },
  {
    id: 'editor-canvas-fill',
    name: 'Editor Canvas Fill',
    value: 'hsl(var(--editor-canvas-fill))',
    category: 'editor',
    description: 'Fill color for editor canvas areas',
    cssVariable: '--editor-canvas-fill',
    preview: '#1f2937',
    useCase: ['canvas fills', 'selection areas', 'active regions'],
    accessibilityNotes: 'Clear visual indication of active canvas areas',
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
    id: 'quote-border',
    name: 'Quote Border',
    value: 'hsl(var(--quote-border))',
    category: 'editor',
    description: 'Border color for quote blocks',
    cssVariable: '--quote-border',
    preview: '#d97706',
    useCase: ['quote left border', 'quote decoration', 'citation marking'],
    accessibilityNotes: 'Warm accent border for quote identification',
  },
  {
    id: 'quote-citation-text',
    name: 'Quote Citation Text',
    value: 'hsl(var(--quote-citation-text))',
    category: 'editor',
    description: 'Specific text color for quote citations',
    cssVariable: '--quote-citation-text',
    preview: '#6b7280',
    useCase: ['citation attribution', 'source text', 'quote references'],
    accessibilityNotes: 'Clear citation text for source attribution',
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
  {
    id: 'block-background-hover',
    name: 'Block Hover Background',
    value: 'hsl(var(--block-background-hover))',
    category: 'editor',
    description: 'Hover background for editor blocks',
    cssVariable: '--block-background-hover',
    preview: '#f3f4f6',
    useCase: ['block hover states', 'editor interactions', 'block highlighting'],
    accessibilityNotes: 'Subtle hover feedback for editor blocks',
  },
  {
    id: 'inspector-background',
    name: 'Inspector Background',
    value: 'hsl(var(--inspector-background))',
    category: 'editor',
    description: 'Background for inspector panels',
    cssVariable: '--inspector-background',
    preview: '#ffffff',
    useCase: ['inspector panels', 'property panels', 'settings panels'],
    accessibilityNotes: 'Clean background for inspector interface',
  },
  {
    id: 'inspector-border',
    name: 'Inspector Border',
    value: 'hsl(var(--inspector-border))',
    category: 'editor',
    description: 'Border color for inspector elements',
    cssVariable: '--inspector-border',
    preview: '#e5e7eb',
    useCase: ['inspector borders', 'panel borders', 'section dividers'],
    accessibilityNotes: 'Clear visual separation in inspector panels',
  },
  {
    id: 'inspector-text',
    name: 'Inspector Text',
    value: 'hsl(var(--inspector-text))',
    category: 'editor',
    description: 'Text color for inspector panels',
    cssVariable: '--inspector-text',
    preview: '#1f2937',
    useCase: ['inspector labels', 'property names', 'panel text'],
    accessibilityNotes: 'High contrast text for inspector interface',
  },
  {
    id: 'inspector-text-secondary',
    name: 'Inspector Secondary Text',
    value: 'hsl(var(--inspector-text-secondary))',
    category: 'editor',
    description: 'Secondary text for inspector panels',
    cssVariable: '--inspector-text-secondary',
    preview: '#6b7280',
    useCase: ['inspector descriptions', 'help text', 'secondary labels'],
    accessibilityNotes: 'Readable secondary text for inspector details',
  },
  {
    id: 'inspector-control-background',
    name: 'Inspector Control Background',
    value: 'hsl(var(--inspector-control-background))',
    category: 'editor',
    description: 'Background for inspector controls',
    cssVariable: '--inspector-control-background',
    preview: '#f9fafb',
    useCase: ['inspector inputs', 'control backgrounds', 'form elements'],
    accessibilityNotes: 'Subtle background for inspector controls',
  },
  {
    id: 'inspector-control-border',
    name: 'Inspector Control Border',
    value: 'hsl(var(--inspector-control-border))',
    category: 'editor',
    description: 'Border for inspector controls',
    cssVariable: '--inspector-control-border',
    preview: '#e5e7eb',
    useCase: ['control borders', 'input borders', 'form borders'],
    accessibilityNotes: 'Clear control boundaries in inspector',
  },
  {
    id: 'inspector-control-focus',
    name: 'Inspector Control Focus',
    value: 'hsl(var(--inspector-control-focus))',
    category: 'editor',
    description: 'Focus state for inspector controls',
    cssVariable: '--inspector-control-focus',
    preview: '#3b82f6',
    useCase: ['focus states', 'active controls', 'selected elements'],
    accessibilityNotes: 'Clear focus indication for inspector controls',
  },
];

/**
 * Takeaway and special UI component tokens
 */
const TAKEAWAY_TOKENS: ColorToken[] = [
  {
    id: 'takeaway-info-background',
    name: 'Info Takeaway Background',
    value: 'hsl(var(--takeaway-info-background))',
    category: 'takeaway',
    description: 'Background for info takeaway blocks',
    cssVariable: '--takeaway-info-background',
    preview: '#e0f2fe',
    useCase: ['info blocks', 'information highlights', 'informational content'],
    accessibilityNotes: 'Light blue background for informational takeaways',
  },
  {
    id: 'takeaway-info-border',
    name: 'Info Takeaway Border',
    value: 'hsl(var(--takeaway-info-border))',
    category: 'takeaway',
    description: 'Border for info takeaway blocks',
    cssVariable: '--takeaway-info-border',
    preview: '#0ea5e9',
    useCase: ['info borders', 'informational accents', 'takeaway markers'],
    accessibilityNotes: 'Blue border for info takeaway identification',
  },
  {
    id: 'takeaway-info-text',
    name: 'Info Takeaway Text',
    value: 'hsl(var(--takeaway-info-text))',
    category: 'takeaway',
    description: 'Text color for info takeaway blocks',
    cssVariable: '--takeaway-info-text',
    preview: '#0c4a6e',
    useCase: ['info text', 'informational content', 'takeaway text'],
    accessibilityNotes: 'Dark blue text for info takeaway readability',
  },
  {
    id: 'takeaway-success-background',
    name: 'Success Takeaway Background',
    value: 'hsl(var(--takeaway-success-background))',
    category: 'takeaway',
    description: 'Background for success takeaway blocks',
    cssVariable: '--takeaway-success-background',
    preview: '#dcfce7',
    useCase: ['success blocks', 'positive highlights', 'achievement content'],
    accessibilityNotes: 'Light green background for success takeaways',
  },
  {
    id: 'takeaway-success-border',
    name: 'Success Takeaway Border',
    value: 'hsl(var(--takeaway-success-border))',
    category: 'takeaway',
    description: 'Border for success takeaway blocks',
    cssVariable: '--takeaway-success-border',
    preview: '#16a34a',
    useCase: ['success borders', 'positive accents', 'achievement markers'],
    accessibilityNotes: 'Green border for success takeaway identification',
  },
  {
    id: 'takeaway-success-text',
    name: 'Success Takeaway Text',
    value: 'hsl(var(--takeaway-success-text))',
    category: 'takeaway',
    description: 'Text color for success takeaway blocks',
    cssVariable: '--takeaway-success-text',
    preview: '#14532d',
    useCase: ['success text', 'positive content', 'achievement text'],
    accessibilityNotes: 'Dark green text for success takeaway readability',
  },
  {
    id: 'takeaway-warning-background',
    name: 'Warning Takeaway Background',
    value: 'hsl(var(--takeaway-warning-background))',
    category: 'takeaway',
    description: 'Background for warning takeaway blocks',
    cssVariable: '--takeaway-warning-background',
    preview: '#fef3c7',
    useCase: ['warning blocks', 'caution highlights', 'important notices'],
    accessibilityNotes: 'Light yellow background for warning takeaways',
  },
  {
    id: 'takeaway-warning-border',
    name: 'Warning Takeaway Border',
    value: 'hsl(var(--takeaway-warning-border))',
    category: 'takeaway',
    description: 'Border for warning takeaway blocks',
    cssVariable: '--takeaway-warning-border',
    preview: '#f59e0b',
    useCase: ['warning borders', 'caution accents', 'important markers'],
    accessibilityNotes: 'Orange border for warning takeaway identification',
  },
  {
    id: 'takeaway-warning-text',
    name: 'Warning Takeaway Text',
    value: 'hsl(var(--takeaway-warning-text))',
    category: 'takeaway',
    description: 'Text color for warning takeaway blocks',
    cssVariable: '--takeaway-warning-text',
    preview: '#92400e',
    useCase: ['warning text', 'caution content', 'important text'],
    accessibilityNotes: 'Dark orange text for warning takeaway readability',
  },
  {
    id: 'takeaway-error-background',
    name: 'Error Takeaway Background',
    value: 'hsl(var(--takeaway-error-background))',
    category: 'takeaway',
    description: 'Background for error takeaway blocks',
    cssVariable: '--takeaway-error-background',
    preview: '#fecaca',
    useCase: ['error blocks', 'critical highlights', 'danger content'],
    accessibilityNotes: 'Light red background for error takeaways',
  },
  {
    id: 'takeaway-error-border',
    name: 'Error Takeaway Border',
    value: 'hsl(var(--takeaway-error-border))',
    category: 'takeaway',
    description: 'Border for error takeaway blocks',
    cssVariable: '--takeaway-error-border',
    preview: '#dc2626',
    useCase: ['error borders', 'critical accents', 'danger markers'],
    accessibilityNotes: 'Red border for error takeaway identification',
  },
  {
    id: 'takeaway-error-text',
    name: 'Error Takeaway Text',
    value: 'hsl(var(--takeaway-error-text))',
    category: 'takeaway',
    description: 'Text color for error takeaway blocks',
    cssVariable: '--takeaway-error-text',
    preview: '#7f1d1d',
    useCase: ['error text', 'critical content', 'danger text'],
    accessibilityNotes: 'Dark red text for error takeaway readability',
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
  takeaway: TAKEAWAY_TOKENS,
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
  ...TAKEAWAY_TOKENS,
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