// ABOUTME: Core theme engine for managing, applying, and generating advanced theme systems

import { CustomTheme, ColorPalette, ThemeValidationError } from '@/types/theme';
import { generateNodeId } from '@/types/editor';

// Color generation utilities
export class ColorGenerator {
  /**
   * Generate a complete color palette from a single base color
   */
  static generatePalette(baseColor: string): ColorPalette {
    const hsl = this.hexToHsl(baseColor);

    return {
      50: this.hslToHex(hsl.h, Math.max(hsl.s - 20, 0), Math.min(hsl.l + 45, 95)),
      100: this.hslToHex(hsl.h, Math.max(hsl.s - 15, 0), Math.min(hsl.l + 35, 90)),
      200: this.hslToHex(hsl.h, Math.max(hsl.s - 10, 0), Math.min(hsl.l + 25, 85)),
      300: this.hslToHex(hsl.h, Math.max(hsl.s - 5, 0), Math.min(hsl.l + 15, 80)),
      400: this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 8, 75)),
      500: baseColor,
      600: this.hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.max(hsl.l - 8, 25)),
      700: this.hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.max(hsl.l - 15, 20)),
      800: this.hslToHex(hsl.h, Math.min(hsl.s + 15, 100), Math.max(hsl.l - 25, 15)),
      900: this.hslToHex(hsl.h, Math.min(hsl.s + 20, 100), Math.max(hsl.l - 35, 10)),
      950: this.hslToHex(hsl.h, Math.min(hsl.s + 25, 100), Math.max(hsl.l - 45, 5)),
    };
  }

  /**
   * Generate an accessible color palette with WCAG compliance
   */
  static generateAccessiblePalette(baseColor: string): ColorPalette {
    const palette = this.generatePalette(baseColor);

    // Ensure contrast ratios meet WCAG AA standards
    Object.entries(palette).forEach(([shade, color]) => {
      const contrastWithWhite = this.getContrastRatio(color, '#FFFFFF');
      const contrastWithBlack = this.getContrastRatio(color, '#000000');

      // Adjust colors to meet minimum contrast requirements
      if (parseInt(shade) <= 400 && contrastWithBlack < 4.5) {
        palette[shade as keyof ColorPalette] = this.adjustColorForContrast(color, '#000000', 4.5);
      } else if (parseInt(shade) >= 600 && contrastWithWhite < 4.5) {
        palette[shade as keyof ColorPalette] = this.adjustColorForContrast(color, '#FFFFFF', 4.5);
      }
    });

    return palette;
  }

  /**
   * Convert hex color to HSL
   */
  private static hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Convert HSL to hex color
   */
  private static hslToHex(h: number, s: number, l: number): string {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Calculate contrast ratio between two colors (WCAG formula)
   */
  private static getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (hex: string) => {
      const rgb = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
      ].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);

    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  }

  /**
   * Adjust color to meet minimum contrast ratio
   */
  private static adjustColorForContrast(
    color: string,
    background: string,
    targetRatio: number
  ): string {
    const hsl = this.hexToHsl(color);
    let adjustedColor = color;
    let currentRatio = this.getContrastRatio(color, background);

    // Adjust lightness until we meet the target ratio
    const step = currentRatio < targetRatio ? -2 : 2;

    while (Math.abs(currentRatio - targetRatio) > 0.1 && hsl.l > 0 && hsl.l < 100) {
      hsl.l = Math.max(0, Math.min(100, hsl.l + step));
      adjustedColor = this.hslToHex(hsl.h, hsl.s, hsl.l);
      currentRatio = this.getContrastRatio(adjustedColor, background);

      if (currentRatio >= targetRatio) break;
    }

    return adjustedColor;
  }
}

// Theme generation engine
export class ThemeGenerator {
  /**
   * Create a new theme from brand colors
   */
  static createThemeFromBrandColors(
    name: string,
    primaryColor: string,
    secondaryColor?: string,
    category: CustomTheme['category'] = 'custom'
  ): CustomTheme {
    const id = generateNodeId();
    const now = new Date().toISOString();

    return {
      id,
      name,
      category,
      description: `Custom theme based on brand colors`,

      colors: {
        primary: ColorGenerator.generateAccessiblePalette(primaryColor),
        secondary: secondaryColor
          ? ColorGenerator.generateAccessiblePalette(secondaryColor)
          : ColorGenerator.generateAccessiblePalette('#6b7280'),
        accent: ColorGenerator.generateAccessiblePalette('#3b82f6'),
        neutral: ColorGenerator.generateAccessiblePalette('#6b7280'),
        success: ColorGenerator.generateAccessiblePalette('#10b981'),
        warning: ColorGenerator.generateAccessiblePalette('#f59e0b'),
        error: ColorGenerator.generateAccessiblePalette('#ef4444'),
        info: ColorGenerator.generateAccessiblePalette('#3b82f6'),
      },

      typography: this.generateTypographySystem(),
      layout: this.generateLayoutSystem(),
      metadata: {
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        isPublic: false,
        isDefault: false,
      },
      blockStyles: this.generateDefaultBlockStyles(),
    };
  }

  /**
   * Generate typography system with font families and scales
   */
  private static generateTypographySystem() {
    return {
      fontFamilies: {
        primary: {
          name: 'Inter',
          fallback: ['system-ui', 'sans-serif'],
          weights: [400, 500, 600, 700],
          googleFont: true,
          url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
        secondary: {
          name: 'Merriweather',
          fallback: ['Georgia', 'serif'],
          weights: [400, 700],
          googleFont: true,
          url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
        },
        monospace: {
          name: 'JetBrains Mono',
          fallback: ['Consolas', 'Monaco', 'monospace'],
          weights: [400, 500, 600],
          googleFont: true,
          url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
        },
      },
      scales: {
        heading: {
          xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 600 },
          sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 600 },
          base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 600 },
          lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 600 },
          xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 700 },
          '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 700 },
          '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 700 },
          '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: 700 },
        },
        body: {
          xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400 },
          sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 400 },
          base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
          lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 400 },
          xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 400 },
          '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 400 },
          '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 400 },
          '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: 400 },
        },
        caption: {
          xs: { fontSize: '0.625rem', lineHeight: '0.75rem', fontWeight: 400 },
          sm: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400 },
          base: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 400 },
          lg: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
          xl: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 400 },
          '2xl': { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 400 },
          '3xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 400 },
          '4xl': { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 400 },
        },
      },
    };
  }

  /**
   * Generate layout system with spacing, shadows, and borders
   */
  private static generateLayoutSystem() {
    return {
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      maxWidth: {
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
        full: '100%',
      },
    };
  }

  /**
   * Generate default block styles
   */
  private static generateDefaultBlockStyles() {
    return {
      textBlock: {
        defaultFontFamily: 'primary' as const,
        defaultSize: 'base',
        lineHeight: 1.6,
        letterSpacing: '0',
      },
      headingBlock: {
        defaultFontFamily: 'primary' as const,
        fontWeight: 700,
        marginBottom: '1rem',
      },
      keyTakeawayBlock: {
        borderWidth: '1px',
        borderStyle: 'solid' as const,
        padding: '1rem',
        borderRadius: '0.5rem',
        iconSize: 20,
      },
      separatorBlock: {
        defaultThickness: 1,
        defaultStyle: 'solid' as const,
        margin: '1.5rem',
        opacity: 0.6,
      },
      referenceBlock: {
        fontSize: '0.875rem',
        fontStyle: 'italic' as const,
        borderLeft: true,
        backgroundColor: '#f8fafc',
        padding: '0.75rem',
      },
    };
  }
}

// Theme validation engine
export class ThemeValidator {
  /**
   * Validate a complete theme object
   */
  static validateTheme(theme: unknown): { isValid: boolean; errors: ThemeValidationError[] } {
    const errors: ThemeValidationError[] = [];

    try {
      // Basic structure validation using Zod (this would be imported)
      // For now, we'll do manual validation

      if (!theme || typeof theme !== 'object') {
        errors.push({
          field: 'root',
          message: 'Theme must be a valid object',
          severity: 'error',
        });
        return { isValid: false, errors };
      }

      const t = theme as any;

      // Validate required fields
      if (!t.id || typeof t.id !== 'string') {
        errors.push({
          field: 'id',
          message: 'Theme ID is required and must be a string',
          severity: 'error',
        });
      }

      if (!t.name || typeof t.name !== 'string') {
        errors.push({
          field: 'name',
          message: 'Theme name is required and must be a string',
          severity: 'error',
        });
      }

      // Validate color palettes
      if (t.colors) {
        Object.entries(t.colors).forEach(([colorName, palette]) => {
          const colorErrors = this.validateColorPalette(palette, colorName);
          errors.push(...colorErrors);
        });
      }

      // Validate accessibility
      const accessibilityErrors = this.validateAccessibility(t);
      errors.push(...accessibilityErrors);

      return { isValid: errors.filter(e => e.severity === 'error').length === 0, errors };
    } catch (error) {
      errors.push({
        field: 'root',
        message: `Theme validation failed: ${error}`,
        severity: 'error',
      });

      return { isValid: false, errors };
    }
  }

  /**
   * Validate a single color palette
   */
  private static validateColorPalette(palette: any, paletteName: string): ThemeValidationError[] {
    const errors: ThemeValidationError[] = [];
    const requiredShades = [
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      '950',
    ];

    if (!palette || typeof palette !== 'object') {
      errors.push({
        field: `colors.${paletteName}`,
        message: 'Color palette must be an object',
        severity: 'error',
      });
      return errors;
    }

    requiredShades.forEach(shade => {
      if (!palette[shade]) {
        errors.push({
          field: `colors.${paletteName}.${shade}`,
          message: `Missing color shade ${shade}`,
          severity: 'error',
          suggestion: 'Use ColorGenerator.generatePalette() to create missing shades',
        });
      } else if (!this.isValidHexColor(palette[shade])) {
        errors.push({
          field: `colors.${paletteName}.${shade}`,
          message: `Invalid hex color format: ${palette[shade]}`,
          severity: 'error',
          suggestion: 'Use format #RRGGBB (e.g., #3b82f6)',
        });
      }
    });

    return errors;
  }

  /**
   * Validate accessibility compliance
   */
  private static validateAccessibility(theme: any): ThemeValidationError[] {
    const errors: ThemeValidationError[] = [];

    if (!theme.colors) return errors;

    // Check contrast ratios for primary color combinations
    const checkContrast = (
      color1: string,
      color2: string,
      fieldName: string,
      minRatio: number = 4.5
    ) => {
      if (this.isValidHexColor(color1) && this.isValidHexColor(color2)) {
        const ratio = ColorGenerator['getContrastRatio'](color1, color2);
        if (ratio < minRatio) {
          errors.push({
            field: fieldName,
            message: `Insufficient contrast ratio: ${ratio.toFixed(2)} (minimum: ${minRatio})`,
            severity: 'warning',
            suggestion: 'Adjust colors to meet WCAG AA standards',
          });
        }
      }
    };

    // Check common color combinations
    if (theme.colors.primary) {
      checkContrast(theme.colors.primary['500'], '#FFFFFF', 'colors.primary.500');
      checkContrast(theme.colors.primary['600'], '#FFFFFF', 'colors.primary.600');
    }

    return errors;
  }

  /**
   * Check if a string is a valid hex color
   */
  private static isValidHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }
}

// Theme application engine
export class ThemeApplicator {
  /**
   * Apply theme to CSS custom properties
   */
  static applyThemeToDOM(theme: CustomTheme, scope: HTMLElement = document.documentElement): void {
    // Apply color variables
    Object.entries(theme.colors).forEach(([colorName, palette]) => {
      Object.entries(palette).forEach(([shade, color]) => {
        scope.style.setProperty(`--color-${colorName}-${shade}`, color);
      });
    });

    // Apply typography variables
    Object.entries(theme.typography.fontFamilies).forEach(([familyName, family]) => {
      const fontStack = [family.name, ...family.fallback].join(', ');
      scope.style.setProperty(`--font-family-${familyName}`, fontStack);
    });

    // Apply spacing variables
    Object.entries(theme.layout.spacing).forEach(([sizeName, size]) => {
      scope.style.setProperty(`--spacing-${sizeName}`, size);
    });

    // Apply shadow variables
    Object.entries(theme.layout.shadows).forEach(([shadowName, shadow]) => {
      scope.style.setProperty(`--shadow-${shadowName}`, shadow);
    });

    // Apply border radius variables
    Object.entries(theme.layout.borderRadius).forEach(([radiusName, radius]) => {
      scope.style.setProperty(`--border-radius-${radiusName}`, radius);
    });
  }

  /**
   * Generate CSS string from theme
   */
  static generateCSS(
    theme: CustomTheme,
    options: { prefix?: string; includeUtilities?: boolean } = {}
  ): string {
    const { prefix = '', includeUtilities = false } = options;
    let css = ':root {\n';

    // Color variables
    Object.entries(theme.colors).forEach(([colorName, palette]) => {
      Object.entries(palette).forEach(([shade, color]) => {
        css += `  --${prefix}color-${colorName}-${shade}: ${color};\n`;
      });
    });

    // Typography variables
    Object.entries(theme.typography.fontFamilies).forEach(([familyName, family]) => {
      const fontStack = [family.name, ...family.fallback].join(', ');
      css += `  --${prefix}font-family-${familyName}: ${fontStack};\n`;
    });

    // Layout variables
    Object.entries(theme.layout.spacing).forEach(([sizeName, size]) => {
      css += `  --${prefix}spacing-${sizeName}: ${size};\n`;
    });

    css += '}\n';

    // Add utility classes if requested
    if (includeUtilities) {
      css += this.generateUtilityClasses(theme, prefix);
    }

    return css;
  }

  /**
   * Generate utility classes for theme
   */
  private static generateUtilityClasses(theme: CustomTheme, prefix: string): string {
    let css = '\n/* Utility Classes */\n';

    // Color utilities
    Object.entries(theme.colors).forEach(([colorName, palette]) => {
      Object.entries(palette).forEach(([shade, color]) => {
        css += `.${prefix}text-${colorName}-${shade} { color: var(--${prefix}color-${colorName}-${shade}); }\n`;
        css += `.${prefix}bg-${colorName}-${shade} { background-color: var(--${prefix}color-${colorName}-${shade}); }\n`;
        css += `.${prefix}border-${colorName}-${shade} { border-color: var(--${prefix}color-${colorName}-${shade}); }\n`;
      });
    });

    // Spacing utilities
    Object.entries(theme.layout.spacing).forEach(([sizeName, size]) => {
      css += `.${prefix}p-${sizeName} { padding: var(--${prefix}spacing-${sizeName}); }\n`;
      css += `.${prefix}m-${sizeName} { margin: var(--${prefix}spacing-${sizeName}); }\n`;
    });

    return css;
  }
}
