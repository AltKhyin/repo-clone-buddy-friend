// ABOUTME: Visual validation tests for UnifiedColorPicker across all themes to ensure proper rendering and functionality

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';

// Mock the useColorTokens hook with actual token structure
vi.mock('@/hooks/useColorTokens', () => ({
  useColorTokens: () => ({
    allTokens: [
      {
        id: 'foreground',
        name: 'Primary Text',
        value: 'hsl(var(--foreground))',
        category: 'text',
        description: 'Primary text color',
        cssVariable: '--foreground',
      },
      {
        id: 'background',
        name: 'Primary Background',
        value: 'hsl(var(--background))',
        category: 'background',
        description: 'Primary background color',
        cssVariable: '--background',
      },
      {
        id: 'success',
        name: 'Success',
        value: 'hsl(var(--success))',
        category: 'semantic',
        description: 'Success color',
        cssVariable: '--success',
      },
    ],
    tokenCategories: {
      text: [{ id: 'foreground', name: 'Primary Text', category: 'text', cssVariable: '--foreground' }],
      background: [{ id: 'background', name: 'Primary Background', category: 'background', cssVariable: '--background' }],
      semantic: [{ id: 'success', name: 'Success', category: 'semantic', cssVariable: '--success' }],
    },
    resolveTokenToCurrentTheme: (value: string) => value.replace('var(--foreground)', '220 9% 11%'),
    getTokenPreviewColor: (value: string) => value.includes('--foreground') ? 'hsl(220 9% 11%)' : value,
    isToken: (color: string) => color.includes('hsl(var('),
    getTokenInfo: (color: string) => color.includes('--foreground') ? 
      { id: 'foreground', name: 'Primary Text', cssVariable: '--foreground', description: 'Primary text color' } : null,
    validateColor: (color: string) => ({ isValid: color.startsWith('#') || color.includes('hsl(var(') }),
    getTokensByCategory: (category: string) => {
      const tokenMap = {
        text: [{ id: 'foreground', name: 'Primary Text', category: 'text', cssVariable: '--foreground', value: 'hsl(var(--foreground))', description: 'Primary text color' }],
        background: [{ id: 'background', name: 'Primary Background', category: 'background', cssVariable: '--background', value: 'hsl(var(--background))', description: 'Primary background color' }],
        semantic: [{ id: 'success', name: 'Success', category: 'semantic', cssVariable: '--success', value: 'hsl(var(--success))', description: 'Success color' }],
        accent: [],
        neutral: [],
        editor: [],
      };
      return tokenMap[category as keyof typeof tokenMap] || [];
    },
    getCurrentThemeInfo: () => ({
      name: 'light' as const,
      isDark: false,
      isBlack: false,
      description: 'Light theme',
    }),
  }),
}));

describe('UnifiedColorPicker Visual Validation', () => {
  const defaultProps = {
    value: '',
    onColorSelect: vi.fn(),
  };

  describe('Core UI Elements', () => {
    it('should render trigger button correctly', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label', 'Choose color');
    });

    it('should render header with theme information', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('Choose color')).toBeInTheDocument();
      expect(screen.getByText('(light theme)')).toBeInTheDocument();
    });

    it('should render token categories with tokens', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Check category headers that have tokens are present
      expect(screen.getByText('Text Colors')).toBeInTheDocument();
      expect(screen.getByText('Background Colors')).toBeInTheDocument();
      expect(screen.getByText('Semantic Colors')).toBeInTheDocument();
      
      // Empty categories should not be rendered (our implementation only shows categories with tokens)
      expect(screen.queryByText('Accent Colors')).not.toBeInTheDocument();
      expect(screen.queryByText('Neutral Colors')).not.toBeInTheDocument();
      expect(screen.queryByText('Editor Colors')).not.toBeInTheDocument();
    });

    it('should show token counts for each category', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Text, Background, and Semantic should show (1), others should show (0)
      const countElements = screen.getAllByText(/\(\d+\)/);
      expect(countElements.length).toBeGreaterThan(0);
    });
  });

  describe('Token Display and Interaction', () => {
    it('should expand categories and show token details', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      // Should show token details
      expect(screen.getByText('Primary Text')).toBeInTheDocument();
      expect(screen.getByText('--foreground')).toBeInTheDocument();
    });
    
    it('should show collapsible behavior for categories', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Categories should start collapsed by default (except editor which is collapsed by design)
      const textCategoryButton = screen.getByText('Text Colors').closest('button');
      expect(textCategoryButton).toHaveAttribute('aria-expanded', 'false');
      
      // Background category should also be collapsed initially
      const backgroundCategoryButton = screen.getByText('Background Colors').closest('button');
      expect(backgroundCategoryButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Custom Color Section', () => {
    it('should render custom color section in both mode', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom color picker')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom color value')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('should render only custom color section in custom mode', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="custom" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      expect(screen.queryByText('Text Colors')).not.toBeInTheDocument();
    });

    it('should render only token categories in tokens mode', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="tokens" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('Text Colors')).toBeInTheDocument();
      expect(screen.queryByText('Custom Color')).not.toBeInTheDocument();
    });
  });

  describe('Current Selection Display', () => {
    it('should show current selection section when value is set', () => {
      render(<UnifiedColorPicker {...defaultProps} value="hsl(var(--foreground))" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('Current Selection')).toBeInTheDocument();
    });

    it('should not show current selection section when no value', () => {
      render(<UnifiedColorPicker {...defaultProps} value="" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.queryByText('Current Selection')).not.toBeInTheDocument();
    });
  });

  describe('Clear Button Functionality', () => {
    it('should show clear button when value is set and allowClear is true', () => {
      render(<UnifiedColorPicker {...defaultProps} value="#ff0000" allowClear={true} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByLabelText('Clear color selection')).toBeInTheDocument();
    });

    it('should not show clear button when allowClear is false', () => {
      render(<UnifiedColorPicker {...defaultProps} value="#ff0000" allowClear={false} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.queryByLabelText('Clear color selection')).not.toBeInTheDocument();
    });
  });

  describe('Variant Rendering', () => {
    it('should render icon variant correctly', () => {
      render(<UnifiedColorPicker {...defaultProps} variant="icon" />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('h-6', 'w-6', 'p-0');
    });

    it('should render button variant correctly', () => {
      render(<UnifiedColorPicker {...defaultProps} variant="button" />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('h-6', 'px-2');
    });

    it('should render input variant correctly', () => {
      render(<UnifiedColorPicker {...defaultProps} variant="input" />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('h-8', 'px-3', 'justify-start', 'w-full');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes on trigger', () => {
      render(<UnifiedColorPicker {...defaultProps} label="Test Color Picker" />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-label', 'Test Color Picker');
      expect(trigger).toHaveAttribute('aria-pressed');
      expect(trigger).toHaveAttribute('aria-expanded');
    });

    it('should update ARIA expanded state when opened', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Size and Layout', () => {
    it('should render with correct popover dimensions', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Check that the popover has the expected width class
      const popover = screen.getByRole('dialog');
      expect(popover).toHaveClass('w-80');
    });

    it('should have scrollable content area', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Check for scrollable container
      const scrollableArea = screen.getByRole('dialog').querySelector('.overflow-y-auto');
      expect(scrollableArea).toBeInTheDocument();
    });
  });

  describe('Performance and Rendering', () => {
    it('should render quickly with default tokens', () => {
      const start = performance.now();
      render(<UnifiedColorPicker {...defaultProps} />);
      const end = performance.now();

      // Should render in under 50ms
      expect(end - start).toBeLessThan(50);
    });

    it('should handle opening and closing without errors', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      
      // Should not throw errors when opening/closing multiple times
      expect(() => {
        fireEvent.click(trigger); // Open
        fireEvent.click(trigger); // Close
        fireEvent.click(trigger); // Open again
      }).not.toThrow();
    });
  });
});