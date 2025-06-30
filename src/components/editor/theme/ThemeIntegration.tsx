// ABOUTME: Theme integration utilities and components for applying themes to editor blocks

/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo } from 'react';
import { useCurrentTheme } from '@/store/themeStore';
import { CustomTheme } from '@/types/theme';
import { ThemeApplicator } from '@/components/editor/theme/themeEngine';

// Theme Provider Component
interface ThemeProviderProps {
  children: React.ReactNode;
  scope?: HTMLElement;
}

export const ThemeProvider = React.memo(function ThemeProvider({
  children,
  scope,
}: ThemeProviderProps) {
  const currentTheme = useCurrentTheme();

  useEffect(() => {
    if (currentTheme) {
      ThemeApplicator.applyThemeToDOM(currentTheme, scope);
    }
  }, [currentTheme, scope]);

  return <>{children}</>;
});

// Hook to get themed styles for blocks
export const useThemedStyles = (blockType: keyof CustomTheme['blockStyles']) => {
  const currentTheme = useCurrentTheme();

  return useMemo(() => {
    if (!currentTheme) return {};

    const blockStyles = currentTheme.blockStyles[blockType];
    const colors = currentTheme.colors;
    const layout = currentTheme.layout;
    const typography = currentTheme.typography;

    // Generate CSS-in-JS styles based on theme
    return {
      // Typography styles
      fontFamily:
        blockStyles?.defaultFontFamily && typography?.fontFamilies
          ? typography.fontFamilies[blockStyles.defaultFontFamily] ||
            typography.fontFamilies['primary']
          : typography?.fontFamilies?.['primary']?.name,
      fontSize:
        blockStyles?.defaultSize && typography?.scales?.body
          ? typography.scales.body[blockStyles.defaultSize as keyof typeof typography.scales.body]
              ?.fontSize
          : undefined,
      lineHeight: blockStyles?.lineHeight,
      fontWeight: blockStyles?.fontWeight,
      letterSpacing: blockStyles?.letterSpacing,
      fontStyle: blockStyles?.fontStyle,

      // Color styles
      color: blockStyles?.color || colors?.neutral?.['700'],
      backgroundColor: blockStyles?.backgroundColor,

      // Layout styles
      padding:
        blockStyles?.padding && layout?.spacing
          ? layout.spacing[blockStyles.padding as keyof typeof layout.spacing] ||
            blockStyles.padding
          : undefined,
      margin:
        blockStyles?.margin && layout?.spacing
          ? layout.spacing[blockStyles.margin as keyof typeof layout.spacing] || blockStyles.margin
          : undefined,
      marginBottom:
        blockStyles?.marginBottom && layout?.spacing
          ? layout.spacing[blockStyles.marginBottom as keyof typeof layout.spacing] ||
            blockStyles.marginBottom
          : undefined,
      borderRadius:
        blockStyles?.borderRadius && layout?.borderRadius
          ? layout.borderRadius[blockStyles.borderRadius as keyof typeof layout.borderRadius] ||
            blockStyles.borderRadius
          : undefined,

      // Border styles
      borderWidth: blockStyles?.borderWidth,
      borderStyle: blockStyles?.borderStyle,
      borderLeftWidth: blockStyles?.borderLeft ? '4px' : undefined,
      borderLeftColor: blockStyles?.borderLeft ? colors?.primary?.['500'] : undefined,

      // Visual effects
      opacity: blockStyles?.opacity,

      // Block-specific styles
      ...(blockType === 'separatorBlock' && {
        borderTopWidth: blockStyles?.defaultThickness ? `${blockStyles.defaultThickness}px` : '1px',
        borderTopStyle: blockStyles?.defaultStyle || 'solid',
        borderTopColor: colors?.neutral?.['300'] || '#d1d5db',
        opacity: blockStyles?.opacity,
      }),
    };
  }, [currentTheme, blockType]);
};

// Hook to get themed color palette
export const useThemedColors = () => {
  const currentTheme = useCurrentTheme();

  return useMemo(() => {
    if (!currentTheme) return null;

    return {
      primary: currentTheme.colors.primary,
      secondary: currentTheme.colors.secondary,
      accent: currentTheme.colors.accent,
      neutral: currentTheme.colors.neutral,
      success: currentTheme.colors.success,
      warning: currentTheme.colors.warning,
      error: currentTheme.colors.error,
      info: currentTheme.colors.info,
    };
  }, [currentTheme]);
};

// Component to wrap blocks with theme context
interface ThemedBlockWrapperProps {
  blockType: keyof CustomTheme['blockStyles'];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ThemedBlockWrapper = React.memo(function ThemedBlockWrapper({
  blockType,
  children,
  className,
  style,
}: ThemedBlockWrapperProps) {
  const themedStyles = useThemedStyles(blockType);

  return (
    <div
      className={className}
      style={{
        ...themedStyles,
        ...style,
      }}
    >
      {children}
    </div>
  );
});

// Utility function to get CSS custom properties for a theme
export const generateThemeCSS = (theme: CustomTheme): string => {
  return ThemeApplicator.generateCSS(theme, {
    prefix: 'evidens-',
    includeUtilities: true,
  });
};

// Component to inject theme styles into the document
interface ThemeStyleInjectorProps {
  theme?: CustomTheme;
}

export const ThemeStyleInjector = React.memo(function ThemeStyleInjector({
  theme,
}: ThemeStyleInjectorProps) {
  const currentTheme = useCurrentTheme();
  const activeTheme = theme || currentTheme;

  useEffect(() => {
    if (!activeTheme) return;

    // Create or update theme style element
    let styleElement = document.getElementById('evidens-theme-styles') as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'evidens-theme-styles';
      document.head.appendChild(styleElement);
    }

    // Generate and inject CSS
    const css = generateThemeCSS(activeTheme);
    styleElement.textContent = css;

    return () => {
      // Cleanup on unmount
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, [activeTheme]);

  return null;
});

// Hook to get font loading URLs for Google Fonts
export const useThemeFonts = () => {
  const currentTheme = useCurrentTheme();

  return useMemo(() => {
    if (!currentTheme) return [];

    const fontUrls: string[] = [];

    Object.values(currentTheme.typography.fontFamilies).forEach(fontFamily => {
      if (fontFamily.googleFont && fontFamily.url) {
        fontUrls.push(fontFamily.url);
      }
    });

    return fontUrls;
  }, [currentTheme]);
};

// Component to load Google Fonts
export const ThemeFontLoader = React.memo(function ThemeFontLoader() {
  const fontUrls = useThemeFonts();

  useEffect(() => {
    // Remove existing theme font links
    const existingLinks = document.querySelectorAll('link[data-evidens-theme-font]');
    existingLinks.forEach(link => link.remove());

    // Add new font links
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute('data-evidens-theme-font', 'true');
      document.head.appendChild(link);
    });

    return () => {
      // Cleanup on unmount
      const links = document.querySelectorAll('link[data-evidens-theme-font]');
      links.forEach(link => link.remove());
    };
  }, [fontUrls]);

  return null;
});

// Theme-aware component for rendering themed text
interface ThemedTextProps {
  variant?: 'heading' | 'body' | 'caption';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  color?: keyof CustomTheme['colors'];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

export const ThemedText = React.memo(function ThemedText({
  variant = 'body',
  size = 'base',
  color = 'neutral',
  children,
  className,
  style,
  as: Component = 'div',
}: ThemedTextProps) {
  const currentTheme = useCurrentTheme();

  const themedStyle = useMemo(() => {
    if (!currentTheme) return {};

    const typography = currentTheme.typography.scales[variant][size];
    const colorValue = currentTheme.colors[color]['700'];

    return {
      fontSize: typography.fontSize,
      lineHeight: typography.lineHeight,
      fontWeight: typography.fontWeight,
      color: colorValue,
      fontFamily: currentTheme.typography.fontFamilies.primary.name,
    };
  }, [currentTheme, variant, size, color]);

  return (
    <Component
      className={className}
      style={{
        ...themedStyle,
        ...style,
      }}
    >
      {children}
    </Component>
  );
});

// Higher-order component to add theme support to existing components
export function withTheme<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  blockType: keyof CustomTheme['blockStyles']
) {
  return React.memo(function ThemedComponent(props: T) {
    const themedStyles = useThemedStyles(blockType);
    const themedColors = useThemedColors();

    return <WrappedComponent {...props} themedStyles={themedStyles} themedColors={themedColors} />;
  });
}

// Component for theme-aware spacing
interface ThemedSpacingProps {
  size: keyof CustomTheme['layout']['spacing'];
  direction?: 'vertical' | 'horizontal' | 'all';
  children?: React.ReactNode;
}

export const ThemedSpacing = React.memo(function ThemedSpacing({
  size,
  direction = 'vertical',
  children,
}: ThemedSpacingProps) {
  const currentTheme = useCurrentTheme();

  const spacing = currentTheme?.layout.spacing[size] || '1rem';

  const style = useMemo(() => {
    switch (direction) {
      case 'vertical':
        return { marginTop: spacing, marginBottom: spacing };
      case 'horizontal':
        return { marginLeft: spacing, marginRight: spacing };
      case 'all':
        return { margin: spacing };
      default:
        return {};
    }
  }, [spacing, direction]);

  if (children) {
    return <div style={style}>{children}</div>;
  }

  return <div style={style} />;
});

// Theme context for nested components
const ThemeContext = React.createContext<CustomTheme | null>(null);

export const useThemeContext = () => {
  const context = React.useContext(ThemeContext);
  const globalTheme = useCurrentTheme();
  return context || globalTheme;
};

export const ThemeContextProvider = React.memo(function ThemeContextProvider({
  theme,
  children,
}: {
  theme: CustomTheme;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
});
