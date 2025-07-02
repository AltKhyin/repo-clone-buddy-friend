// ABOUTME: Tests for dark theme text contrast compliance and accessibility verification

import { describe, it, expect } from 'vitest';
import {
  testDarkThemeContrast,
  testDarkThemeColorSystem,
  generateContrastReport,
  quickContrastCheck,
  getContrastRatio,
} from './contrast-testing';

describe('Dark Theme Contrast Testing', () => {
  describe('Basic contrast calculations', () => {
    it('should calculate correct contrast ratio for black on white', () => {
      const black = [0, 0, 0] as [number, number, number];
      const white = [255, 255, 255] as [number, number, number];

      const ratio = getContrastRatio(black, white);
      expect(ratio).toBeCloseTo(21, 0); // Perfect contrast is 21:1
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const gray = [128, 128, 128] as [number, number, number];

      const ratio = getContrastRatio(gray, gray);
      expect(ratio).toBe(1); // Same colors have 1:1 ratio
    });
  });

  describe('Dark theme color combinations', () => {
    it('should pass AA contrast for foreground text on background', () => {
      const result = testDarkThemeContrast(
        '210 40% 95%', // foreground: light text
        '0 0% 7%' // background: dark background
      );

      expect(result.passes.AA).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });

    it('should pass AA contrast for improved secondary text on background', () => {
      const result = testDarkThemeContrast(
        '0 0% 65%', // text-secondary: IMPROVED from 28% to 65%
        '0 0% 7%' // background: dark background
      );

      expect(result.passes.AA).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });

    it('should pass AA contrast for improved secondary text on surface', () => {
      const result = testDarkThemeContrast(
        '0 0% 65%', // text-secondary: IMPROVED
        '0 0% 10%' // surface: card backgrounds
      );

      expect(result.passes.AA).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });

    it('should verify tertiary text contrast', () => {
      const result = testDarkThemeContrast(
        '0 0% 50%', // text-tertiary: IMPROVED from 45% to 50%
        '0 0% 7%' // background
      );

      expect(result.passes.AA).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });
  });

  describe('Old problematic combinations (should fail)', () => {
    it('should fail for old secondary text that was unreadable', () => {
      const result = testDarkThemeContrast(
        '0 0% 28%', // OLD text-secondary: was causing readability issues
        '0 0% 7%' // background
      );

      expect(result.passes.AA).toBe(false);
      expect(result.ratio).toBeLessThan(4.5);
    });

    it('should fail for old muted foreground that was problematic', () => {
      const result = testDarkThemeContrast(
        '0 0% 28%', // OLD muted-foreground: #484848
        '0 0% 10%' // surface
      );

      expect(result.passes.AA).toBe(false);
      expect(result.ratio).toBeLessThan(4.5);
    });
  });

  describe('Full color system validation', () => {
    it('should pass quick contrast check for all critical combinations', () => {
      const passed = quickContrastCheck();
      expect(passed).toBe(true);
    });

    it('should have all critical color combinations passing AA', () => {
      const results = testDarkThemeColorSystem();

      const criticalTests = [
        'foreground-on-background',
        'foreground-on-surface',
        'text-secondary-on-background',
        'text-secondary-on-surface',
      ];

      criticalTests.forEach(testName => {
        expect(results[testName].passes.AA).toBe(true);
        expect(results[testName].ratio).toBeGreaterThan(4.5);
      });
    });

    it('should generate a valid contrast report', () => {
      const report = generateContrastReport();

      expect(report).toContain('DARK THEME CONTRAST REPORT');
      expect(report).toContain('AA Compliance');
      expect(report).toContain('✅ PASS');
      expect(report).not.toContain('text-secondary-on-background: ❌ FAIL');
    });
  });

  describe('Admin page specific scenarios', () => {
    it('should verify card descriptions are readable', () => {
      // Test scenario: AdminTagManagement card descriptions
      const result = testDarkThemeContrast(
        '0 0% 65%', // text-secondary class used in descriptions
        '0 0% 10%' // surface class used in cards
      );

      expect(result.passes.AA).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });

    it('should verify table metadata text is readable', () => {
      // Test scenario: UserListTable metadata (IDs, dates)
      const result = testDarkThemeContrast(
        '0 0% 65%', // text-secondary class
        '0 0% 7%' // background
      );

      expect(result.passes.AA).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });

    it('should verify empty state messages are readable', () => {
      // Test scenario: ContentQueue empty states
      const result = testDarkThemeContrast(
        '0 0% 65%', // text-secondary class
        '0 0% 10%' // surface (table/card background)
      );

      expect(result.passes.AA).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });
  });

  describe('Regression prevention', () => {
    it('should detect if secondary text contrast regresses', () => {
      const currentResult = testDarkThemeContrast('0 0% 65%', '0 0% 7%');
      const regressionResult = testDarkThemeContrast('0 0% 28%', '0 0% 7%'); // Old problematic value

      expect(currentResult.passes.AA).toBe(true);
      expect(regressionResult.passes.AA).toBe(false);
      expect(currentResult.ratio).toBeGreaterThan(regressionResult.ratio);
    });

    it('should ensure minimum contrast improvement was achieved', () => {
      const improvedResult = testDarkThemeContrast('0 0% 65%', '0 0% 7%');
      const oldResult = testDarkThemeContrast('0 0% 28%', '0 0% 7%');

      // Improvement should be significant (more than double the contrast)
      expect(improvedResult.ratio).toBeGreaterThan(oldResult.ratio * 2);
    });
  });
});
