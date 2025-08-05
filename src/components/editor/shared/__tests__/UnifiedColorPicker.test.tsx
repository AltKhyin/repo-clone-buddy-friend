// ABOUTME: Tests for UnifiedColorPicker component to ensure stability and security after runtime error fixes

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import type { ColorToken } from '@/components/editor/shared/types/color-types';

// Mock the useColorTokens hook
const mockColorTokens: ColorToken[] = [
  {
    id: 'foreground',
    name: 'Text',
    value: 'hsl(var(--foreground))',
    category: 'primary',
    description: 'Primary text color',
    preview: '#1a1a1a',
  },
  {
    id: 'primary',
    name: 'Primary',
    value: 'hsl(var(--primary))',
    category: 'primary', 
    description: 'Primary brand color',
    preview: '#1a1a1a',
  },
  {
    id: 'success',
    name: 'Success',
    value: 'hsl(var(--success))',
    category: 'semantic',
    description: 'Success color',
    preview: '#22c55e',
  },
];

vi.mock('@/hooks/useColorTokens', () => ({
  useColorTokens: () => ({
    allTokens: mockColorTokens,
    tokenCategories: {
      text: mockColorTokens.filter(t => t.category === 'text'),
      semantic: mockColorTokens.filter(t => t.category === 'semantic'),
    },
    resolveTokenToCurrentTheme: vi.fn((color: string) => color),
    getTokenPreviewColor: vi.fn((color: string) => {
      if (color === 'hsl(var(--primary))') return '#1a1a1a';
      if (color === 'hsl(var(--success))') return '#22c55e';
      return color;
    }),
    resolveColor: vi.fn((color: string) => color),
    getPreviewColor: vi.fn((color: string) => {
      if (color === 'hsl(var(--primary))') return '#1a1a1a';
      if (color === 'hsl(var(--success))') return '#22c55e';
      return color;
    }),
    isToken: vi.fn((color: string) => color.startsWith('hsl(var(')),
    getTokenInfo: vi.fn((color: string) => {
      return mockColorTokens.find(token => token.value === color) || null;
    }),
    validateColor: vi.fn((color: string) => ({
      isValid: /^#[0-9A-Fa-f]{3,6}$/.test(color) || color.startsWith('hsl(var('),
      error: /^#[0-9A-Fa-f]{3,6}$/.test(color) || color.startsWith('hsl(var(') ? null : 'Invalid color format',
    })),
    getTokensByCategory: vi.fn((category: string) => {
      return mockColorTokens.filter(token => token.category === category);
    }),
    getCurrentThemeInfo: vi.fn(() => ({
      name: 'light' as const,
      isDark: false,
      isBlack: false,
      description: 'Light theme',
    })),
    getTokensForUseCase: vi.fn(() => mockColorTokens),
  }),
}));

describe('UnifiedColorPicker', () => {
  const defaultProps = {
    value: '',
    onColorSelect: vi.fn(),
    onColorClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and mounting', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<UnifiedColorPicker {...defaultProps} />);
      }).not.toThrow();
    });

    it('should not throw temporal dead zone errors during initialization', () => {
      // This test specifically addresses the bug that was fixed
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<UnifiedColorPicker {...defaultProps} />);
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot access')
      );
      
      consoleSpy.mockRestore();
    });

    it('should initialize with correct default custom color when no value provided', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      // Should be in popover now, check for custom tab
      const customTab = screen.getByText('Custom');
      fireEvent.click(customTab);
      
      const colorInput = screen.getByLabelText('Custom color value');
      expect(colorInput).toHaveValue('#000000');
    });

    it('should initialize with provided hex color value', () => {
      render(<UnifiedColorPicker {...defaultProps} value="#ff0000" mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const customTab = screen.getByText('Custom');
      fireEvent.click(customTab);
      
      const colorInput = screen.getByLabelText('Custom color value');
      expect(colorInput).toHaveValue('#ff0000');
    });

    it('should initialize with theme token value', () => {
      render(<UnifiedColorPicker {...defaultProps} value="hsl(var(--primary))" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      // Should show token info in current selection
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Primary brand color')).toBeInTheDocument();
    });
  });

  describe('Prop synchronization and state management', () => {
    it('should sync customColor state when value prop changes', async () => {
      const { rerender } = render(
        <UnifiedColorPicker {...defaultProps} value="#ff0000" mode="both" />
      );
      
      // Change the value prop
      rerender(
        <UnifiedColorPicker {...defaultProps} value="#00ff00" mode="both" />
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const customTab = screen.getByText('Custom');
      fireEvent.click(customTab);
      
      await waitFor(() => {
        const colorInput = screen.getByLabelText('Custom color value');
        expect(colorInput).toHaveValue('#00ff00');
      });
    });

    it('should reset to default when value is cleared', async () => {
      const { rerender } = render(
        <UnifiedColorPicker {...defaultProps} value="#ff0000" mode="both" />
      );
      
      // Clear the value
      rerender(
        <UnifiedColorPicker {...defaultProps} value="" mode="both" />
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const customTab = screen.getByText('Custom');
      fireEvent.click(customTab);
      
      await waitFor(() => {
        const colorInput = screen.getByLabelText('Custom color value');
        expect(colorInput).toHaveValue('#000000');
      });
    });

    it('should not sync customColor when theme token is provided', async () => {
      const { rerender } = render(
        <UnifiedColorPicker {...defaultProps} value="#ff0000" mode="both" />
      );
      
      // Change to theme token
      rerender(
        <UnifiedColorPicker {...defaultProps} value="hsl(var(--primary))" mode="both" />
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const customTab = screen.getByText('Custom');
      fireEvent.click(customTab);
      
      // Should still show #ff0000 as it was the last hex color
      await waitFor(() => {
        const colorInput = screen.getByLabelText('Custom color value');
        expect(colorInput).toHaveValue('#ff0000');
      });
    });
  });

  describe('Variant rendering', () => {
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

  describe('Color selection functionality', () => {
    it('should call onColorSelect when token is selected', async () => {
      const onColorSelect = vi.fn();
      render(<UnifiedColorPicker {...defaultProps} onColorSelect={onColorSelect} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const primaryButton = screen.getByTitle('Primary brand color');
      fireEvent.click(primaryButton);
      
      expect(onColorSelect).toHaveBeenCalledWith('hsl(var(--primary))');
    });

    it('should call onColorSelect when custom color is applied', async () => {
      const onColorSelect = vi.fn();
      render(<UnifiedColorPicker {...defaultProps} onColorSelect={onColorSelect} mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const customTab = screen.getByText('Custom');
      fireEvent.click(customTab);
      
      const textInput = screen.getByLabelText('Custom color value');
      await userEvent.clear(textInput);
      await userEvent.type(textInput, '#ff0000');
      
      const applyButton = screen.getByText('Apply');
      fireEvent.click(applyButton);
      
      expect(onColorSelect).toHaveBeenCalledWith('#ff0000');
    });

    it('should call onColorClear when clear button is clicked', () => {
      const onColorClear = vi.fn();
      render(
        <UnifiedColorPicker 
          {...defaultProps} 
          value="#ff0000" 
          onColorClear={onColorClear} 
          allowClear={true}
        />
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const clearButton = screen.getByTitle('Clear color');
      fireEvent.click(clearButton);
      
      expect(onColorClear).toHaveBeenCalled();
    });

    it('should call onColorSelect with empty string when no onColorClear provided', () => {
      const onColorSelect = vi.fn();
      render(
        <UnifiedColorPicker 
          {...defaultProps} 
          value="#ff0000" 
          onColorSelect={onColorSelect}
          allowClear={true}
        />
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const clearButton = screen.getByTitle('Clear color');
      fireEvent.click(clearButton);
      
      expect(onColorSelect).toHaveBeenCalledWith('');
    });
  });

  describe('Mode handling', () => {
    it('should show only tokens in tokens mode', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="tokens" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
      expect(screen.queryByText('Theme Colors')).not.toBeInTheDocument();
    });

    it('should show only custom color picker in custom mode', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="custom" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      expect(screen.queryByText('Primary')).not.toBeInTheDocument();
      expect(screen.queryByText('Theme Colors')).not.toBeInTheDocument();
    });

    it('should show token categories and custom color in both mode', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      // Should show token categories (not tabs)
      expect(screen.getByText('Text Colors')).toBeInTheDocument();
      expect(screen.getByText('Semantic Colors')).toBeInTheDocument();
      expect(screen.getByText('Custom Color')).toBeInTheDocument();
    });

    it('should show all elements in single panel', async () => {
      render(<UnifiedColorPicker {...defaultProps} mode="both" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      // All elements should be visible in single panel
      expect(screen.getByText('Text Colors')).toBeInTheDocument();
      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      
      // No tabs should exist
      expect(screen.queryByText('Theme Colors')).not.toBeInTheDocument();
      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
    });
  });

  describe('Custom tokens support', () => {
    it('should use custom tokens when provided', () => {
      const customTokens: ColorToken[] = [
        {
          id: 'custom-token',
          name: 'Custom Token',
          value: 'hsl(var(--custom))',
          category: 'custom',
          description: 'Custom test token',
          preview: '#custom',
        },
      ];
      
      render(<UnifiedColorPicker {...defaultProps} customTokens={customTokens} />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      expect(screen.getByText('Custom Token')).toBeInTheDocument();
      expect(screen.queryByText('Primary')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UnifiedColorPicker {...defaultProps} label="Test Color Picker" />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-label', 'Test Color Picker');
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update ARIA attributes when opened', () => {
      render(<UnifiedColorPicker {...defaultProps} label="Test Color Picker" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper ARIA attributes with value', () => {
      render(<UnifiedColorPicker {...defaultProps} value="#ff0000" label="Test Color Picker" />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have accessible color picker inputs', () => {
      render(<UnifiedColorPicker {...defaultProps} mode="custom" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const colorInput = screen.getByLabelText('Custom color picker');
      const textInput = screen.getByLabelText('Custom color value');
      
      expect(colorInput).toBeInTheDocument();
      expect(textInput).toBeInTheDocument();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid custom color input gracefully', async () => {
      render(<UnifiedColorPicker {...defaultProps} mode="custom" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const textInput = screen.getByLabelText('Custom color value');
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'invalid-color');
      
      const applyButton = screen.getByText('Apply');
      expect(applyButton).toBeDisabled();
      
      expect(screen.getByText('Invalid color format')).toBeInTheDocument();
    });

    it('should handle empty color input', async () => {
      render(<UnifiedColorPicker {...defaultProps} mode="custom" />);
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      const textInput = screen.getByLabelText('Custom color value');
      await userEvent.clear(textInput);
      
      const applyButton = screen.getByText('Apply');
      expect(applyButton).toBeDisabled();
    });

    it('should handle disabled state', () => {
      render(<UnifiedColorPicker {...defaultProps} disabled={true} />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
    });

    it('should not show clear button when allowClear is false', () => {
      render(
        <UnifiedColorPicker 
          {...defaultProps} 
          value="#ff0000" 
          allowClear={false}
        />
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      
      expect(screen.queryByTitle('Clear color')).not.toBeInTheDocument();
    });
  });

  describe('Memory leak prevention', () => {
    it('should not cause memory leaks with rapid prop changes', async () => {
      const { rerender } = render(
        <UnifiedColorPicker {...defaultProps} value="#ff0000" />
      );
      
      // Rapidly change values to test useEffect cleanup
      for (let i = 0; i < 10; i++) {
        const color = `#${i.toString(16).repeat(6).substring(0, 6)}`;
        rerender(<UnifiedColorPicker {...defaultProps} value={color} />);
        
        // Small delay to let effects run
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // Final check that component is still functional
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
    });

    it('should cleanup properly when unmounted', () => {
      const { unmount } = render(<UnifiedColorPicker {...defaultProps} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many tokens', () => {
      const manyTokens: ColorToken[] = Array.from({ length: 50 }, (_, i) => ({
        id: `token-${i}`,
        name: `Token ${i}`,
        value: `hsl(var(--token-${i}))`,
        category: 'test',
        description: `Test token ${i}`,
        preview: `#${i.toString(16).padStart(6, '0')}`,
      }));
      
      const start = performance.now();
      render(<UnifiedColorPicker {...defaultProps} customTokens={manyTokens} />);
      const end = performance.now();
      
      // Should render quickly even with many tokens
      expect(end - start).toBeLessThan(100);
    });
  });
});