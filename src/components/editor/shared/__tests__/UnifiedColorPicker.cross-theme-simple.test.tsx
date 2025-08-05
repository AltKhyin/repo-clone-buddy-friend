// ABOUTME: Simplified cross-theme compatibility tests for UnifiedColorPicker to validate core theme functionality

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import type { ColorToken } from '@/components/editor/shared/types/color-types';

// Mock data
const mockTokens: ColorToken[] = [
  {
    id: 'foreground',
    name: 'Primary Text',
    value: 'hsl(var(--foreground))',
    category: 'text',
    description: 'Primary text color',
    cssVariable: '--foreground',
    preview: '#1a1a1a',
  },
  {
    id: 'success',
    name: 'Success',
    value: 'hsl(var(--success))',
    category: 'semantic',
    description: 'Success color',
    cssVariable: '--success',
    preview: '#22c55e',
  },
];

// Track current theme for testing
let mockTheme: 'light' | 'dark' | 'black' = 'light';

// Mock useColorTokens hook
vi.mock('@/hooks/useColorTokens', () => ({
  useColorTokens: () => ({
    allTokens: mockTokens,
    tokenCategories: {
      text: mockTokens.filter(t => t.category === 'text'),
      semantic: mockTokens.filter(t => t.category === 'semantic'),
    },
    resolveTokenToCurrentTheme: (value: string) => {
      // Simple mock that changes based on theme
      if (value.includes('--foreground')) {
        return mockTheme === 'light' ? 'hsl(220 9% 11%)' : 
               mockTheme === 'dark' ? 'hsl(0 0% 95%)' : 'hsl(0 0% 98%)';
      }
      return value;
    },
    getTokenPreviewColor: (value: string) => {
      if (value.includes('--foreground')) {
        return mockTheme === 'light' ? 'hsl(220 9% 11%)' : 
               mockTheme === 'dark' ? 'hsl(0 0% 95%)' : 'hsl(0 0% 98%)';
      }
      return value;
    },
    isToken: (color: string) => color.includes('hsl(var('),
    getTokenInfo: (color: string) => mockTokens.find(t => t.value === color) || null,
    validateColor: () => ({ isValid: true }),
    getTokensByCategory: (category: string) => mockTokens.filter(t => t.category === category),
    getCurrentThemeInfo: () => ({
      name: mockTheme,
      isDark: mockTheme !== 'light',
      isBlack: mockTheme === 'black',
      description: `${mockTheme} theme`,
    }),
  }),
}));

describe('UnifiedColorPicker Cross-Theme Compatibility (Simplified)', () => {
  const defaultProps = {
    value: 'hsl(var(--foreground))',
    onColorSelect: vi.fn(),
  };

  beforeEach(() => {
    mockTheme = 'light';
    vi.clearAllMocks();
  });

  describe('Theme Detection', () => {
    it('should show current theme in header', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('(light theme)')).toBeInTheDocument();
    });

    it('should show dark theme when changed', () => {
      mockTheme = 'dark';
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('(dark theme)')).toBeInTheDocument();
    });

    it('should show black theme when changed', () => {
      mockTheme = 'black';
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('(black theme)')).toBeInTheDocument();
    });
  });

  describe('Token Categories Display', () => {
    it('should show token categories with counts', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show categories with token counts
      expect(screen.getByText('Text Colors')).toBeInTheDocument();
      expect(screen.getByText('Semantic Colors')).toBeInTheDocument();
      expect(screen.getAllByText('(1)')).toHaveLength(2); // Each category has 1 token
    });

    it('should expand and show token details', async () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        expect(screen.getByText('Primary Text')).toBeInTheDocument();
        expect(screen.getByText('--foreground')).toBeInTheDocument();
      });
    });
  });

  describe('Current Selection Display', () => {
    it('should show current selection with token details', () => {
      render(<UnifiedColorPicker {...defaultProps} value="hsl(var(--foreground))" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show current selection
      expect(screen.getByText('Current Selection')).toBeInTheDocument();
      expect(screen.getByText('Primary Text')).toBeInTheDocument();
      expect(screen.getByText('--foreground')).toBeInTheDocument();
    });

    it('should show custom color selection', () => {
      render(<UnifiedColorPicker {...defaultProps} value="#ff0000" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('Current Selection')).toBeInTheDocument();
      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      expect(screen.getByText('#ff0000')).toBeInTheDocument();
    });
  });

  describe('Token Information Display', () => {
    it('should show comprehensive token information', async () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        // Should show token name, CSS variable, and resolved value
        expect(screen.getByText('Primary Text')).toBeInTheDocument();
        expect(screen.getByText('--foreground')).toBeInTheDocument();
        expect(screen.getByText('hsl(220 9% 11%)')).toBeInTheDocument(); // Light theme resolved color
      });
    });

    it('should show correct ARIA labels with token information', async () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        // Should have ARIA label with comprehensive information
        const tokenButton = screen.getByLabelText(/Select Primary Text color/);
        expect(tokenButton).toHaveAttribute('aria-label', 
          expect.stringContaining('CSS variable: --foreground')
        );
      });
    });
  });

  describe('Custom Color Integration', () => {
    it('should show custom color section', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom color picker')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom color value')).toBeInTheDocument();
    });

    it('should handle custom color selection', () => {
      const onColorSelect = vi.fn();
      render(<UnifiedColorPicker {...defaultProps} onColorSelect={onColorSelect} mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      const customInput = screen.getByLabelText('Custom color value');
      fireEvent.change(customInput, { target: { value: '#ff0000' } });

      const applyButton = screen.getByText('Apply');
      fireEvent.click(applyButton);

      expect(onColorSelect).toHaveBeenCalledWith('#ff0000');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper button roles and states', () => {
      render(<UnifiedColorPicker {...defaultProps} />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-label', 'Choose color');
      expect(trigger).toHaveAttribute('aria-pressed', 'true');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should provide clear button when value is set', () => {
      render(<UnifiedColorPicker {...defaultProps} value="#ff0000" allowClear={true} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      const clearButton = screen.getByLabelText('Clear color selection');
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid custom colors', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="custom" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      const customInput = screen.getByLabelText('Custom color value');
      fireEvent.change(customInput, { target: { value: 'invalid-color' } });

      const applyButton = screen.getByText('Apply');
      expect(applyButton).toBeDisabled();
    });
  });
});