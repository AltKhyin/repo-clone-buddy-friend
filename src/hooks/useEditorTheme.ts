// ABOUTME: CSS-first editor theme hook using existing CSS custom properties

import { useEditorStore } from '@/store/editorStore';

/**
 * CSS-first editor theme hook
 * Returns CSS custom property references for semantic theming
 * Leverages existing CSS custom properties system in src/index.css
 */
export const useEditorTheme = () => {
  const { canvasTheme } = useEditorStore();

  const isDarkMode = canvasTheme === 'dark';

  // CSS custom property references (no computed colors)
  const colors = {
    // Canvas colors
    canvas: {
      background: 'hsl(var(--editor-canvas-background))',
      text: 'hsl(var(--foreground))',
      border: 'hsl(var(--block-border-default))',
    },

    // Block colors
    block: {
      background: 'hsl(var(--surface))',
      backgroundSecondary: 'hsl(var(--surface-muted))',
      text: 'hsl(var(--text-primary))',
      textSecondary: 'hsl(var(--text-secondary))',
      border: 'hsl(var(--block-border-default))',
      borderActive: 'hsl(var(--block-border-active))',
    },

    // Interactive colors
    interactive: {
      primary: 'hsl(var(--primary))',
      primaryHover: 'hsl(var(--primary))',
      success: 'hsl(var(--success))',
      warning: 'hsl(var(--destructive))',
      error: 'hsl(var(--destructive))',
      info: 'hsl(var(--primary))',
    },

    // Semantic colors for specific components
    semantic: {
      // Quote block
      quote: {
        background: 'hsl(var(--quote-background))',
        text: 'hsl(var(--quote-text))',
        citation: 'hsl(var(--quote-citation))',
        accent: 'hsl(var(--quote-accent))',
      },

      // Poll block
      poll: {
        background: 'hsl(var(--surface))',
        optionBackground: 'hsl(var(--poll-option-background))',
        resultBar: 'hsl(var(--poll-result-bar))',
        resultBarSelected: 'hsl(var(--poll-result-bar-selected))',
        text: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
      },

      // Key takeaway themes
      takeaway: {
        info: {
          background: 'hsl(var(--takeaway-info-background))',
          border: 'hsl(var(--takeaway-info-border))',
          text: 'hsl(var(--takeaway-info-text))',
        },
        success: {
          background: 'hsl(var(--takeaway-success-background))',
          border: 'hsl(var(--takeaway-success-border))',
          text: 'hsl(var(--takeaway-success-text))',
        },
        warning: {
          background: 'hsl(var(--takeaway-warning-background))',
          border: 'hsl(var(--takeaway-warning-border))',
          text: 'hsl(var(--takeaway-warning-text))',
        },
        error: {
          background: 'hsl(var(--takeaway-error-background))',
          border: 'hsl(var(--takeaway-error-border))',
          text: 'hsl(var(--takeaway-error-text))',
        },
      },

      // Separator
      separator: {
        border: 'hsl(var(--separator-line))',
        background: 'hsl(var(--background))',
      },

      // Table
      table: {
        border: 'hsl(var(--table-border))',
        headerBackground: 'hsl(var(--table-header-background))',
        headerText: 'hsl(var(--table-header-text))',
        cellBackground: 'hsl(var(--table-cell-background))',
        cellText: 'hsl(var(--table-cell-text))',
        rowAlternate: 'hsl(var(--table-row-alternate))',
      },
    },
  };

  // Helper function to get takeaway theme colors
  const getTakeawayColors = (theme: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    return colors.semantic.takeaway[theme];
  };

  // Helper function to get image placeholder colors
  const getImagePlaceholderColors = () => ({
    background: 'hsl(var(--surface-muted))',
    text: 'hsl(var(--text-secondary))',
    border: 'hsl(var(--border))',
  });

  return {
    theme: canvasTheme,
    isDarkMode,
    colors,
    getTakeawayColors,
    getImagePlaceholderColors,
  };
};
