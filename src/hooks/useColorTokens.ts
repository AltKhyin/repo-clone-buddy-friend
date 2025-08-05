// ABOUTME: React hook for theme-aware color token management and resolution with dynamic theme integration

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/components/theme/CustomThemeProvider';
import {
  ALL_COLOR_TOKENS,
  COLOR_TOKEN_CATEGORIES,
  COLOR_TOKEN_MAP,
  isThemeToken,
  extractTokenId,
  getTokenByValue,
  validateColorValue,
  DEFAULT_COLOR_SETS,
} from '@/utils/color-tokens';
import type { ColorToken, ColorValidationResult } from '@/components/editor/shared/types/color-types';

/**
 * Theme information interface for enhanced theme awareness
 */
interface ThemeInfo {
  name: 'light' | 'dark' | 'black';
  isDark: boolean;
  isBlack: boolean;
  description: string;
}

/**
 * Hook for managing color tokens with theme integration
 * Provides theme-aware color resolution and token management with real-time theme detection
 * OPTIMIZED: Enhanced caching and memoization for better performance
 */
export function useColorTokens() {
  const { actualTheme } = useTheme(); // Global app theme - single source of truth
  
  // OPTIMIZATION: State for computed color values with theme-aware caching and LRU-style cleanup
  const [computedColors, setComputedColors] = useState<Map<string, string>>(new Map());
  
  // OPTIMIZATION: Cache cleanup to prevent memory leaks
  useEffect(() => {
    // Clear cache when theme changes to ensure accuracy
    setComputedColors(new Map());
  }, [actualTheme]);
  
  // OPTIMIZATION: Throttled cache cleanup for memory management (max 100 entries)
  const cleanupCache = useCallback(() => {
    setComputedColors(prev => {
      if (prev.size > 100) {
        // Keep only the last 50 entries (LRU-style cleanup)
        const entries = Array.from(prev.entries());
        return new Map(entries.slice(-50));
      }
      return prev;
    });
  }, []);

  // Get current theme info (app-wide theme only)
  const currentThemeInfo = useMemo((): ThemeInfo => {
    return {
      name: actualTheme,
      isDark: actualTheme === 'dark',
      isBlack: actualTheme === 'black',
      description: actualTheme === 'black' ? 'Pure black theme with Notion-inspired aesthetics' :
                   actualTheme === 'dark' ? 'Refined dark theme with sophisticated grays' :
                   'Warm monochromatic light theme',
    };
  }, [actualTheme]);

  // App-wide dark mode detection (no editor-specific themes)
  const isDarkMode = actualTheme === 'dark' || actualTheme === 'black';

  // Clear computed colors cache when theme changes
  useEffect(() => {
    setComputedColors(new Map());
  }, [actualTheme]);

  /**
   * Dynamically resolve a token to its actual computed color value in the current theme
   * This provides real-time color resolution for theme-aware previews
   */
  const resolveTokenToCurrentTheme = useCallback((tokenValue: string): string => {
    if (!tokenValue || !isThemeToken(tokenValue)) {
      return tokenValue || 'transparent';
    }

    // Check cache first for performance
    const cacheKey = `${tokenValue}-${actualTheme}`;
    if (computedColors.has(cacheKey)) {
      return computedColors.get(cacheKey)!;
    }

    try {
      // Extract the CSS variable name from the token
      const tokenId = extractTokenId(tokenValue);
      if (!tokenId) return tokenValue;

      // Get computed style from the document root
      const rootStyles = getComputedStyle(document.documentElement);
      const computedValue = rootStyles.getPropertyValue(`--${tokenId}`).trim();
      
      if (computedValue) {
        // Convert HSL values to full hsl() format for consistency
        const resolvedColor = computedValue.includes('hsl(') ? computedValue : `hsl(${computedValue})`;
        
        // OPTIMIZATION: Cache the result and trigger cleanup if needed
        setComputedColors(prev => {
          const newCache = new Map(prev).set(cacheKey, resolvedColor);
          // Trigger cleanup every 20 additions to maintain performance
          if (newCache.size > 0 && newCache.size % 20 === 0) {
            setTimeout(cleanupCache, 0); // Async cleanup to avoid blocking render
          }
          return newCache;
        });
        return resolvedColor;
      }
    } catch (error) {
      console.warn(`Failed to resolve token ${tokenValue} in theme ${actualTheme}:`, error);
    }

    // Fallback to original token value
    return tokenValue;
  }, [actualTheme, computedColors, cleanupCache]);

  /**
   * Get enhanced preview color that reflects the current theme
   * This replaces the static preview system with dynamic theme-aware colors
   */
  const getTokenPreviewColor = useCallback((value: string): string => {
    if (!value) return 'transparent';
    
    // For theme tokens, resolve to actual current theme color
    if (isThemeToken(value)) {
      return resolveTokenToCurrentTheme(value);
    }
    
    // For custom colors, return as-is
    return value;
  }, [resolveTokenToCurrentTheme]);

  /**
   * Validate a token in the context of the current theme
   */
  const validateTokenInCurrentTheme = useCallback((tokenValue: string): boolean => {
    if (!tokenValue || !isThemeToken(tokenValue)) {
      return validateColorValue(tokenValue);
    }

    const tokenId = extractTokenId(tokenValue);
    if (!tokenId || !COLOR_TOKEN_MAP.has(tokenId)) {
      return false;
    }

    // Check if the token exists in the current theme's CSS
    try {
      const rootStyles = getComputedStyle(document.documentElement);
      const computedValue = rootStyles.getPropertyValue(`--${tokenId}`).trim();
      return Boolean(computedValue);
    } catch {
      return false;
    }
  }, []);

  /**
   * Get tokens organized by category with enhanced categorization
   */
  const getTokensByCategory = useCallback((category: string): ColorToken[] => {
    if (category === 'all') return ALL_COLOR_TOKENS;
    
    return ALL_COLOR_TOKENS.filter(token => token.category === category);
  }, []);

  /**
   * Get current theme information for UI display
   */
  const getCurrentThemeInfo = useCallback((): ThemeInfo => {
    return currentThemeInfo;
  }, [currentThemeInfo]);

  /**
   * Resolve a color token or custom color to its actual CSS value (legacy compatibility)
   */
  const resolveColor = useCallback((value: string): string => {
    if (!value) return 'transparent';
    
    // If it's already a theme token, return as-is for CSS
    if (isThemeToken(value)) {
      return value;
    }
    
    // For custom colors (hex, rgb, etc.), return as-is
    return value;
  }, []);

  /**
   * Get the computed/preview color for display purposes (legacy compatibility)
   * Enhanced to use dynamic theme resolution when possible
   */
  const getPreviewColor = useCallback((value: string): string => {
    if (!value) return 'transparent';
    
    // For theme tokens, use the enhanced preview system
    if (isThemeToken(value)) {
      // Try dynamic resolution first
      const dynamicColor = getTokenPreviewColor(value);
      if (dynamicColor && dynamicColor !== value) {
        return dynamicColor;
      }
      
      // Fallback to static preview if available
      const token = getTokenByValue(value);
      if (token?.preview) {
        return token.preview;
      }
      
      // Return the token value for CSS custom property resolution
      return value;
    }
    
    // For custom colors, return as-is
    return value;
  }, [getTokenPreviewColor]);

  /**
   * Check if a color value is a theme token
   */
  const isToken = useCallback((value: string): boolean => {
    return isThemeToken(value);
  }, []);

  /**
   * Get token information for a given value
   */
  const getTokenInfo = useCallback((value: string): ColorToken | null => {
    return getTokenByValue(value);
  }, []);

  /**
   * Validate a color value and provide feedback
   */
  const validateColor = useCallback((value: string): ColorValidationResult => {
    if (!value || typeof value !== 'string') {
      return {
        isValid: false,
        error: 'Color value is required',
      };
    }

    const trimmedValue = value.trim();

    // Check if it's a valid theme token
    if (isThemeToken(trimmedValue)) {
      const tokenId = extractTokenId(trimmedValue);
      const isValidToken = tokenId && COLOR_TOKEN_MAP.has(tokenId);
      
      return {
        isValid: isValidToken,
        error: isValidToken ? undefined : 'Unknown theme token',
        format: 'token',
      };
    }

    // Validate other color formats
    const isValid = validateColorValue(trimmedValue);
    
    if (!isValid) {
      return {
        isValid: false,
        error: 'Invalid color format',
        suggestion: 'Use hex (#000000), rgb(), hsl(), or select a theme token',
      };
    }

    // Determine format
    let format: ColorValidationResult['format'] = 'hex';
    if (trimmedValue.startsWith('#')) format = 'hex';
    else if (trimmedValue.startsWith('rgb')) format = 'rgb';
    else if (trimmedValue.startsWith('hsl')) format = 'hsl';
    else format = 'named';

    return {
      isValid: true,
      format,
    };
  }, []);

  /**
   * Get tokens for a specific use case
   */
  const getTokensForUseCase = useCallback((useCase: keyof typeof DEFAULT_COLOR_SETS): ColorToken[] => {
    return DEFAULT_COLOR_SETS[useCase] || ALL_COLOR_TOKENS;
  }, []);


  return {
    // Token collections
    allTokens: ALL_COLOR_TOKENS,
    tokenCategories: COLOR_TOKEN_CATEGORIES,
    
    // Enhanced theme-aware functions
    resolveTokenToCurrentTheme,
    getTokenPreviewColor,
    validateTokenInCurrentTheme,
    getTokensByCategory,
    getCurrentThemeInfo,
    
    // Legacy utility functions (backward compatibility)
    resolveColor,
    getPreviewColor,
    isToken,
    getTokenInfo,
    validateColor,
    getTokensForUseCase,
    
    // Theme information
    isDarkMode, // Editor theme
    currentTheme: currentThemeInfo, // Global app theme
  };
}