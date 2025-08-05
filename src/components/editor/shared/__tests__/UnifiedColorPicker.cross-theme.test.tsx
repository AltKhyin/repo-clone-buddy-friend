// ABOUTME: Cross-theme compatibility tests for UnifiedColorPicker to validate theme switching and dynamic color resolution

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { CustomThemeProvider } from '@/components/theme/CustomThemeProvider';
import type { ColorToken } from '@/components/editor/shared/types/color-types';

// Mock data - defined at top level to avoid hoisting issues
const mockColorTokens: ColorToken[] = [
  {
    id: 'foreground',
    name: 'Primary Text',
    value: 'hsl(var(--foreground))',
    category: 'text',
    description: 'Primary text color that adapts to theme',
    cssVariable: '--foreground',
    preview: '#1a1a1a',
    useCase: ['body text', 'headings'],
    accessibilityNotes: 'WCAG AA compliant across all themes',
  },
  {
    id: 'background',
    name: 'Primary Background',
    value: 'hsl(var(--background))',
    category: 'background',
    description: 'Primary background color',
    cssVariable: '--background',
    preview: '#ffffff',
    useCase: ['page background', 'main container'],
    accessibilityNotes: 'High contrast foundation',
  },
  {
    id: 'success',
    name: 'Success',
    value: 'hsl(var(--success))',
    category: 'semantic',
    description: 'Success and positive feedback color',
    cssVariable: '--success',
    preview: '#22c55e',
    useCase: ['success messages', 'positive actions'],
    accessibilityNotes: 'WCAG AA compliant green',
  },
];

const mockComputedStyles: Record<string, Record<string, string>> = {
  light: {
    '--foreground': '220 9% 11%',
    '--background': '48 33.3% 97.1%',
    '--success': '140 60% 45%',
  },
  dark: {
    '--foreground': '0 0% 95%',
    '--background': '0 0% 7%',
    '--success': '140 60% 45%',
  },
  black: {
    '--foreground': '0 0% 98%',
    '--background': '0 0% 0%',
    '--success': '140 60% 45%',
  },
};

let currentMockTheme: 'light' | 'dark' | 'black' = 'light';

// Mock the useColorTokens hook
vi.mock('@/hooks/useColorTokens', () => ({
  useColorTokens: () => ({
    allTokens: mockColorTokens,
    tokenCategories: {
      text: mockColorTokens.filter(t => t.category === 'text'),
      background: mockColorTokens.filter(t => t.category === 'background'),
      semantic: mockColorTokens.filter(t => t.category === 'semantic'),
    },
    resolveTokenToCurrentTheme: (tokenValue: string) => {
      if (!tokenValue.includes('var(--')) return tokenValue;
      const match = tokenValue.match(/var\(--([^)]+)\)/);
      if (match) {
        const tokenId = match[1];
        const themeValues = mockComputedStyles[currentMockTheme];
        if (themeValues && themeValues[`--${tokenId}`]) {
          return `hsl(${themeValues[`--${tokenId}`]})`;
        }
      }
      return tokenValue;
    },
    getTokenPreviewColor: (tokenValue: string) => {
      if (!tokenValue.includes('var(--')) return tokenValue;
      const match = tokenValue.match(/var\(--([^)]+)\)/);
      if (match) {
        const tokenId = match[1];
        const themeValues = mockComputedStyles[currentMockTheme];
        if (themeValues && themeValues[`--${tokenId}`]) {
          return `hsl(${themeValues[`--${tokenId}`]})`;
        }
      }
      return tokenValue;
    },
    isToken: (color: string) => color.includes('hsl(var('),
    getTokenInfo: (color: string) => {
      return mockColorTokens.find(token => token.value === color) || null;
    },
    validateColor: (color: string) => ({
      isValid: /^#[0-9A-Fa-f]{3,6}$/.test(color) || color.includes('hsl(var('),
      error: /^#[0-9A-Fa-f]{3,6}$/.test(color) || color.includes('hsl(var(') ? null : 'Invalid color format',
    }),
    getTokensByCategory: (category: string) => {
      return mockColorTokens.filter(token => token.category === category);
    },
    getCurrentThemeInfo: () => ({
      name: currentMockTheme,
      isDark: currentMockTheme === 'dark',
      isBlack: currentMockTheme === 'black',
      description: currentMockTheme === 'black' ? 'Pure black theme' :
                   currentMockTheme === 'dark' ? 'Refined dark theme' :
                   'Warm light theme',
    }),
  }),
}));

// Mock getComputedStyle to simulate CSS custom property resolution
const originalGetComputedStyle = window.getComputedStyle;
beforeEach(() => {
  window.getComputedStyle = vi.fn((element) => {
    const mockStyle = {
      getPropertyValue: vi.fn((property: string) => {
        const themeValues = mockComputedStyles[currentMockTheme];
        return themeValues?.[property] || '';
      }),
    };
    return mockStyle as any;
  });
});

afterEach(() => {
  window.getComputedStyle = originalGetComputedStyle;
  vi.clearAllMocks();
  currentMockTheme = 'light';
});

// Test wrapper component
const TestWrapper: React.FC<{ 
  theme: 'light' | 'dark' | 'black';
  children: React.ReactNode;
}> = ({ theme, children }) => {
  currentMockTheme = theme;
  return (
    <CustomThemeProvider defaultTheme={theme}>
      {children}
    </CustomThemeProvider>
  );
};

describe('UnifiedColorPicker Cross-Theme Compatibility', () => {
  const defaultProps = {
    value: 'hsl(var(--foreground))',
    onColorSelect: vi.fn(),
    onColorClear: vi.fn(),
  };

  describe('Theme Detection and Display', () => {
    it('should display correct theme name in header for light theme', () => {
      render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('(light theme)')).toBeInTheDocument();
    });

    it('should display correct theme name in header for dark theme', () => {
      render(
        <TestWrapper theme="dark">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('(dark theme)')).toBeInTheDocument();
    });

    it('should display correct theme name in header for black theme', () => {
      render(
        <TestWrapper theme="black">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(screen.getByText('(black theme)')).toBeInTheDocument();
    });
  });

  describe('Dynamic Color Resolution', () => {
    it('should resolve colors correctly in light theme', async () => {
      render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        // Should show resolved light theme color
        expect(screen.getByText('hsl(220 9% 11%)')).toBeInTheDocument();
      });
    });

    it('should resolve colors correctly in dark theme', async () => {
      currentMockTheme = 'dark';
      
      render(
        <TestWrapper theme="dark">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        // Should show resolved dark theme color
        expect(screen.getByText('hsl(0 0% 95%)')).toBeInTheDocument();
      });
    });

    it('should resolve colors correctly in black theme', async () => {
      currentMockTheme = 'black';
      
      render(
        <TestWrapper theme="black">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        // Should show resolved black theme color
        expect(screen.getByText('hsl(0 0% 98%)')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Switching Behavior', () => {
    it('should update color previews when theme changes', async () => {
      const { rerender } = render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      // Verify light theme color
      await waitFor(() => {
        expect(screen.getByText('hsl(220 9% 11%)')).toBeInTheDocument();
      });

      // Switch to dark theme
      currentMockTheme = 'dark';
      rerender(
        <TestWrapper theme="dark">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      // Click trigger again to open picker
      fireEvent.click(trigger);
      
      // Expand text category again
      const textCategoryDark = screen.getByText('Text Colors');
      fireEvent.click(textCategoryDark);

      // Verify dark theme color appears
      await waitFor(() => {
        expect(screen.getByText('hsl(0 0% 95%)')).toBeInTheDocument();
        expect(screen.queryByText('hsl(220 9% 11%)')).not.toBeInTheDocument();
      });
    });

    it('should maintain token selection across theme changes', async () => {
      const onColorSelect = vi.fn();
      const { rerender } = render(
        <TestWrapper theme="light">
          <UnifiedColorPicker 
            {...defaultProps} 
            onColorSelect={onColorSelect}
            value="hsl(var(--success))"
          />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Verify success token is selected in light theme
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('--success')).toBeInTheDocument();

      // Switch to dark theme
      currentMockTheme = 'dark';
      rerender(
        <TestWrapper theme="dark">
          <UnifiedColorPicker 
            {...defaultProps} 
            onColorSelect={onColorSelect}
            value="hsl(var(--success))"
          />
        </TestWrapper>
      );

      // Open picker in dark theme
      fireEvent.click(trigger);

      // Token should still be selected with same CSS variable but different resolved color
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('--success')).toBeInTheDocument();
      expect(screen.getByText('hsl(140 60% 45%)')).toBeInTheDocument(); // Same color for success across themes
    });
  });

  describe('Token Categories Across Themes', () => {
    it('should show all token categories consistently across themes', async () => {
      const themes: Array<'light' | 'dark' | 'black'> = ['light', 'dark', 'black'];

      for (const theme of themes) {
        currentMockTheme = theme;
        
        const { unmount } = render(
          <TestWrapper theme={theme}>
            <UnifiedColorPicker {...defaultProps} />
          </TestWrapper>
        );

        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        // All categories should be present
        expect(screen.getByText('Text Colors')).toBeInTheDocument();
        expect(screen.getByText('Background Colors')).toBeInTheDocument();
        expect(screen.getByText('Semantic Colors')).toBeInTheDocument();

        unmount();
      }
    });

    it('should show correct token counts across themes', async () => {
      render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show correct counts for each category
      expect(screen.getByText('(1)')).toBeInTheDocument(); // Text category has 1 token
    });
  });

  describe('Accessibility Across Themes', () => {
    it('should provide correct ARIA labels with theme-specific color values', async () => {
      render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        const tokenButton = screen.getByLabelText(/Select Primary Text color/);
        expect(tokenButton).toHaveAttribute(
          'aria-label',
          expect.stringContaining('CSS variable: --foreground')
        );
        expect(tokenButton).toHaveAttribute(
          'aria-label',
          expect.stringContaining('Current value: hsl(220 9% 11%)')
        );
      });
    });

    it('should update tooltips with theme-specific information', async () => {
      render(
        <TestWrapper theme="dark">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand text category
      const textCategory = screen.getByText('Text Colors');
      fireEvent.click(textCategory);

      await waitFor(() => {
        const tokenButton = screen.getByTitle(/Primary text color that adapts to theme/);
        expect(tokenButton).toHaveAttribute(
          'title',
          expect.stringContaining('CSS Variable: --foreground')
        );
        expect(tokenButton).toHaveAttribute(
          'title',
          expect.stringContaining('Current Value: hsl(0 0% 95%)')
        );
      });
    });
  });

  describe('Performance Across Themes', () => {
    it('should render efficiently across theme changes', async () => {
      const { rerender } = render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Expand and collapse categories multiple times
      const textCategory = screen.getByText('Text Colors');
      
      for (let i = 0; i < 3; i++) {
        fireEvent.click(textCategory);
        await waitFor(() => {
          expect(screen.getByText('Primary Text')).toBeInTheDocument();
        });
        fireEvent.click(textCategory);
      }

      // Switch themes multiple times to test performance
      const themes: Array<'light' | 'dark' | 'black'> = ['dark', 'black', 'light'];
      
      for (const theme of themes) {
        currentMockTheme = theme;
        rerender(
          <TestWrapper theme={theme}>
            <UnifiedColorPicker {...defaultProps} />
          </TestWrapper>
        );
        
        // Should render quickly without errors
        fireEvent.click(trigger);
        expect(screen.getByText(`(${theme} theme)`)).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling Across Themes', () => {
    it('should handle missing token values gracefully', async () => {
      render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} value="hsl(var(--missing-token))" />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should handle missing tokens gracefully - our mock will return the original token value
      // when no match is found, which is expected behavior
      await waitFor(() => {
        expect(screen.getByText('hsl(var(--missing-token))')).toBeInTheDocument();
      });
    });

    it('should handle theme switching during open state', async () => {
      const { rerender } = render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Picker is open, now switch theme
      currentMockTheme = 'dark';
      rerender(
        <TestWrapper theme="dark">
          <UnifiedColorPicker {...defaultProps} />
        </TestWrapper>
      );

      // Should handle theme switch gracefully without crashes
      expect(screen.getByText('(dark theme)')).toBeInTheDocument();
    });
  });

  describe('Current Selection Display Across Themes', () => {
    it('should show current selection with theme-appropriate values', async () => {
      render(
        <TestWrapper theme="light">
          <UnifiedColorPicker {...defaultProps} value="hsl(var(--foreground))" />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show current selection with light theme values
      await waitFor(() => {
        expect(screen.getByText('Current Selection')).toBeInTheDocument();
        expect(screen.getByText('Primary Text')).toBeInTheDocument();
        expect(screen.getByText('--foreground')).toBeInTheDocument();
        expect(screen.getByText('hsl(220 9% 11%)')).toBeInTheDocument();
      });
    });
  });
});