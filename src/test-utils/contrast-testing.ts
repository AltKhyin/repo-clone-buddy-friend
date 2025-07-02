// ABOUTME: Utility functions for testing dark theme text contrast compliance and accessibility

/**
 * WCAG AA Contrast Requirements:
 * - Normal text: 4.5:1 minimum contrast ratio
 * - Large text (18pt+/24px+ or 14pt+/18.5px+ bold): 3:1 minimum contrast ratio
 * - Enhanced AAA: 7:1 for normal text, 4.5:1 for large text
 */

export interface ContrastResult {
  ratio: number;
  passes: {
    AA: boolean;
    AAA: boolean;
  };
  isLargeText: boolean;
}

/**
 * Convert HSL color to RGB values
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (1 / 6 <= h && h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (2 / 6 <= h && h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (3 / 6 <= h && h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (4 / 6 <= h && h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else if (5 / 6 <= h && h < 1) {
    r = c;
    g = 0;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Parse HSL color string from CSS custom property
 * Example: "0 0% 65%" -> [0, 0, 65]
 */
function parseHslString(hslString: string): [number, number, number] {
  const values = hslString.trim().split(/\s+/);

  if (values.length !== 3) {
    throw new Error(`Invalid HSL string: ${hslString}`);
  }

  const h = parseFloat(values[0]);
  const s = parseFloat(values[1].replace('%', ''));
  const l = parseFloat(values[2].replace('%', ''));

  return [h, s, l];
}

/**
 * Test contrast ratio for dark theme colors
 */
export function testDarkThemeContrast(
  textHsl: string,
  backgroundHsl: string,
  isLargeText = false
): ContrastResult {
  try {
    const [textH, textS, textL] = parseHslString(textHsl);
    const [bgH, bgS, bgL] = parseHslString(backgroundHsl);

    const textRgb = hslToRgb(textH, textS, textL);
    const bgRgb = hslToRgb(bgH, bgS, bgL);

    const ratio = getContrastRatio(textRgb, bgRgb);

    const aaThreshold = isLargeText ? 3.0 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7.0;

    return {
      ratio,
      passes: {
        AA: ratio >= aaThreshold,
        AAA: ratio >= aaaThreshold,
      },
      isLargeText,
    };
  } catch (error) {
    throw new Error(
      `Contrast calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Test all critical dark theme color combinations
 */
export function testDarkThemeColorSystem(): Record<string, ContrastResult> {
  const darkThemeColors = {
    background: '0 0% 7%', // #121212
    surface: '0 0% 10%', // #1a1a1a
    foreground: '210 40% 95%', // Light text
    textSecondary: '0 0% 65%', // IMPROVED: Secondary text
    textTertiary: '0 0% 50%', // IMPROVED: Tertiary text
    border: '0 0% 16%', // #2a2a2a
  };

  const results: Record<string, ContrastResult> = {};

  // Test primary text on main backgrounds
  results['foreground-on-background'] = testDarkThemeContrast(
    darkThemeColors.foreground,
    darkThemeColors.background
  );

  results['foreground-on-surface'] = testDarkThemeContrast(
    darkThemeColors.foreground,
    darkThemeColors.surface
  );

  // Test secondary text (the main issue we fixed)
  results['text-secondary-on-background'] = testDarkThemeContrast(
    darkThemeColors.textSecondary,
    darkThemeColors.background
  );

  results['text-secondary-on-surface'] = testDarkThemeContrast(
    darkThemeColors.textSecondary,
    darkThemeColors.surface
  );

  // Test tertiary text
  results['text-tertiary-on-background'] = testDarkThemeContrast(
    darkThemeColors.textTertiary,
    darkThemeColors.background
  );

  results['text-tertiary-on-surface'] = testDarkThemeContrast(
    darkThemeColors.textTertiary,
    darkThemeColors.surface
  );

  return results;
}

/**
 * Generate a contrast report for debugging
 */
export function generateContrastReport(): string {
  const results = testDarkThemeColorSystem();

  const lines = [
    '=== DARK THEME CONTRAST REPORT ===',
    '',
    'WCAG AA Requirements: 4.5:1 (normal text), 3:1 (large text)',
    'WCAG AAA Requirements: 7:1 (normal text), 4.5:1 (large text)',
    '',
  ];

  for (const [testName, result] of Object.entries(results)) {
    const status = result.passes.AA ? '✅ PASS' : '❌ FAIL';
    const aaStatus = result.passes.AAA ? 'AAA ✅' : 'AAA ❌';

    lines.push(`${testName}: ${result.ratio.toFixed(2)}:1 - ${status} (${aaStatus})`);
  }

  lines.push('');
  lines.push('--- SUMMARY ---');

  const totalTests = Object.keys(results).length;
  const passedAA = Object.values(results).filter(r => r.passes.AA).length;
  const passedAAA = Object.values(results).filter(r => r.passes.AAA).length;

  lines.push(`AA Compliance: ${passedAA}/${totalTests} tests passed`);
  lines.push(`AAA Compliance: ${passedAAA}/${totalTests} tests passed`);

  return lines.join('\n');
}

/**
 * Quick test for the most common contrast issues
 */
export function quickContrastCheck(): boolean {
  const results = testDarkThemeColorSystem();

  // Focus on the critical combinations that were previously failing
  const criticalTests = [
    'text-secondary-on-background',
    'text-secondary-on-surface',
    'foreground-on-background',
    'foreground-on-surface',
  ];

  return criticalTests.every(testName => {
    const result = results[testName];
    return result && result.passes.AA;
  });
}
