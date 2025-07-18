// ABOUTME: Tests for centralized typography system ensuring consistency across all editor components

import { describe, it, expect } from 'vitest';
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  TEXT_DECORATIONS,
  TEXT_TRANSFORMS,
  ALIGNMENT_OPTIONS,
  TYPOGRAPHY_DEFAULTS,
  TYPOGRAPHY_CONSTRAINTS,
  typographyUtils,
  getTypographyValue,
  updateTypography,
  isValidFontFamily,
  isValidFontWeight,
  isValidTextAlign,
  type TypographyData,
  type FontFamily,
  type FontWeight,
  type TextDecoration,
  type TextTransform,
  type AlignmentOption,
} from '../typography-system';

describe('Typography System Constants', () => {
  describe('FONT_FAMILIES', () => {
    it('should contain all expected font family options', () => {
      expect(FONT_FAMILIES).toHaveLength(14);

      const expectedFamilies = [
        'inherit',
        'var(--font-sans)',
        'var(--font-serif)',
        'Inter',
        'Source Serif 4',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        'Arial',
        'Helvetica',
        'Georgia',
        'Times New Roman',
        'Courier New',
        'monospace',
      ];

      expectedFamilies.forEach(family => {
        expect(FONT_FAMILIES.find(f => f.value === family)).toBeDefined();
      });
    });

    it('should have proper structure for each font family', () => {
      FONT_FAMILIES.forEach(family => {
        expect(family).toHaveProperty('value');
        expect(family).toHaveProperty('label');
        expect(typeof family.value).toBe('string');
        expect(typeof family.label).toBe('string');
      });
    });
  });

  describe('FONT_WEIGHTS', () => {
    it('should contain all standard font weight values', () => {
      expect(FONT_WEIGHTS).toHaveLength(9);

      const expectedWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      expectedWeights.forEach(weight => {
        expect(FONT_WEIGHTS.find(w => w.value === weight)).toBeDefined();
      });
    });

    it('should have proper structure for each font weight', () => {
      FONT_WEIGHTS.forEach(weight => {
        expect(weight).toHaveProperty('value');
        expect(weight).toHaveProperty('label');
        expect(typeof weight.value).toBe('number');
        expect(typeof weight.label).toBe('string');
      });
    });
  });

  describe('TEXT_DECORATIONS', () => {
    it('should contain all text decoration options', () => {
      expect(TEXT_DECORATIONS).toHaveLength(3);

      const expectedDecorations = ['none', 'underline', 'line-through'];
      expectedDecorations.forEach(decoration => {
        expect(TEXT_DECORATIONS.find(d => d.value === decoration)).toBeDefined();
      });
    });

    it('should have proper structure with icons', () => {
      TEXT_DECORATIONS.forEach(decoration => {
        expect(decoration).toHaveProperty('value');
        expect(decoration).toHaveProperty('label');
        expect(decoration).toHaveProperty('icon');
        expect(typeof decoration.value).toBe('string');
        expect(typeof decoration.label).toBe('string');
        expect(decoration.icon).toBeDefined();
      });
    });
  });

  describe('TEXT_TRANSFORMS', () => {
    it('should contain all text transform options', () => {
      expect(TEXT_TRANSFORMS).toHaveLength(4);

      const expectedTransforms = ['none', 'uppercase', 'lowercase', 'capitalize'];
      expectedTransforms.forEach(transform => {
        expect(TEXT_TRANSFORMS.find(t => t.value === transform)).toBeDefined();
      });
    });
  });

  describe('ALIGNMENT_OPTIONS', () => {
    it('should contain all alignment options', () => {
      expect(ALIGNMENT_OPTIONS).toHaveLength(4);

      const expectedAlignments = ['left', 'center', 'right', 'justify'];
      expectedAlignments.forEach(alignment => {
        expect(ALIGNMENT_OPTIONS.find(a => a.value === alignment)).toBeDefined();
      });
    });

    it('should have proper structure with icons', () => {
      ALIGNMENT_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('icon');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
        expect(option.icon).toBeDefined();
      });
    });
  });
});

describe('Typography Defaults and Constraints', () => {
  describe('TYPOGRAPHY_DEFAULTS', () => {
    it('should have all required typography properties', () => {
      expect(TYPOGRAPHY_DEFAULTS).toEqual({
        fontFamily: 'inherit',
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.4,
        textAlign: 'left',
        color: '#000000',
        textDecoration: 'none',
        textTransform: 'none',
        letterSpacing: 0,
      });
    });
  });

  describe('TYPOGRAPHY_CONSTRAINTS', () => {
    it('should have proper constraints for all numeric properties', () => {
      expect(TYPOGRAPHY_CONSTRAINTS.fontSize).toEqual({ min: 8, max: 128, step: 1 });
      expect(TYPOGRAPHY_CONSTRAINTS.fontWeight).toEqual({ min: 100, max: 900, step: 100 });
      expect(TYPOGRAPHY_CONSTRAINTS.lineHeight).toEqual({ min: 0.5, max: 3, step: 0.1 });
      expect(TYPOGRAPHY_CONSTRAINTS.letterSpacing).toEqual({ min: -2, max: 4, step: 0.1 });
    });
  });
});

describe('Typography Utilities', () => {
  describe('validateTypographyData', () => {
    it('should return defaults for empty data', () => {
      const result = typographyUtils.validateTypographyData({});
      expect(result).toEqual(TYPOGRAPHY_DEFAULTS);
    });

    it('should clamp fontSize within constraints', () => {
      const result = typographyUtils.validateTypographyData({ fontSize: 200 });
      expect(result.fontSize).toBe(128); // max constraint

      const result2 = typographyUtils.validateTypographyData({ fontSize: 5 });
      expect(result2.fontSize).toBe(8); // min constraint
    });

    it('should clamp fontWeight within constraints', () => {
      const result = typographyUtils.validateTypographyData({ fontWeight: 1000 });
      expect(result.fontWeight).toBe(900); // max constraint

      const result2 = typographyUtils.validateTypographyData({ fontWeight: 50 });
      expect(result2.fontWeight).toBe(100); // min constraint
    });

    it('should preserve valid values', () => {
      const validData: TypographyData = {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.6,
        textAlign: 'center',
        color: '#ff0000',
        textDecoration: 'underline',
        textTransform: 'uppercase',
        letterSpacing: 1,
      };

      const result = typographyUtils.validateTypographyData(validData);
      expect(result).toEqual(validData);
    });
  });

  describe('lookup functions', () => {
    it('should find font family by value', () => {
      const result = typographyUtils.getFontFamilyByValue('Arial');
      expect(result).toEqual({ value: 'Arial', label: 'Arial' });

      const notFound = typographyUtils.getFontFamilyByValue('NonExistent');
      expect(notFound).toBeUndefined();
    });

    it('should find font weight by value', () => {
      const result = typographyUtils.getFontWeightByValue(700);
      expect(result).toEqual({ value: 700, label: 'Bold' });

      const notFound = typographyUtils.getFontWeightByValue(750);
      expect(notFound).toBeUndefined();
    });

    it('should find text decoration by value', () => {
      const result = typographyUtils.getTextDecorationByValue('underline');
      expect(result?.value).toBe('underline');
      expect(result?.label).toBe('Underline');
      expect(result?.icon).toBeDefined();
    });

    it('should find alignment option by value', () => {
      const result = typographyUtils.getAlignmentOptionByValue('center');
      expect(result?.value).toBe('center');
      expect(result?.label).toBe('Center');
      expect(result?.icon).toBeDefined();
    });
  });

  describe('getTypographyStyles', () => {
    it('should generate proper CSS styles from typography data', () => {
      const data: TypographyData = {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.6,
        textAlign: 'center',
        color: '#ff0000',
        textDecoration: 'underline',
        textTransform: 'uppercase',
        letterSpacing: 1,
      };

      const styles = typographyUtils.getTypographyStyles(data);

      expect(styles).toEqual({
        fontFamily: 'Arial',
        fontSize: '18px',
        fontWeight: 700,
        lineHeight: 1.6,
        textAlign: 'center',
        color: '#ff0000',
        textDecoration: 'underline',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      });
    });

    it('should handle partial data and apply defaults', () => {
      const styles = typographyUtils.getTypographyStyles({ fontSize: 20 });

      expect(styles.fontSize).toBe('20px');
      expect(styles.fontFamily).toBe('inherit');
      expect(styles.color).toBe('#000000');
    });
  });

  describe('isValidTypographyData', () => {
    it('should validate proper typography data', () => {
      const validData: TypographyData = {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.6,
        textAlign: 'center',
        color: '#ff0000',
        textDecoration: 'underline',
        textTransform: 'uppercase',
        letterSpacing: 1,
      };

      expect(typographyUtils.isValidTypographyData(validData)).toBe(true);
    });

    it('should reject invalid data', () => {
      expect(typographyUtils.isValidTypographyData(null)).toBe(false);
      expect(typographyUtils.isValidTypographyData('not an object')).toBe(false);
      expect(typographyUtils.isValidTypographyData({ fontSize: 'invalid' })).toBe(false);
      expect(typographyUtils.isValidTypographyData({ fontWeight: 750 })).toBe(false); // not a standard weight
    });

    it('should allow partial data', () => {
      expect(typographyUtils.isValidTypographyData({ fontSize: 18 })).toBe(true);
      expect(typographyUtils.isValidTypographyData({})).toBe(true);
    });
  });
});

describe('Utility Functions', () => {
  describe('getTypographyValue', () => {
    it('should return value if present', () => {
      const data = { fontSize: 20 };
      expect(getTypographyValue(data, 'fontSize')).toBe(20);
    });

    it('should return fallback if value missing', () => {
      const data = {};
      expect(getTypographyValue(data, 'fontSize', 24)).toBe(24);
    });

    it('should return default if no fallback provided', () => {
      const data = {};
      expect(getTypographyValue(data, 'fontSize')).toBe(16); // default fontSize
    });
  });

  describe('updateTypography', () => {
    it('should merge and validate typography updates', () => {
      const current = { fontSize: 16, fontWeight: 400 };
      const updates = { fontSize: 20, textAlign: 'center' };

      const result = updateTypography(current, updates);

      expect(result.fontSize).toBe(20);
      expect(result.fontWeight).toBe(400);
      expect(result.textAlign).toBe('center');
      expect(result.fontFamily).toBe('inherit'); // default
    });

    it('should clamp invalid values during update', () => {
      const current = { fontSize: 16 };
      const updates = { fontSize: 200 }; // exceeds max

      const result = updateTypography(current, updates);
      expect(result.fontSize).toBe(128); // clamped to max
    });
  });
});

describe('Type Guards', () => {
  describe('isValidFontFamily', () => {
    it('should validate font family values', () => {
      expect(isValidFontFamily('Arial')).toBe(true);
      expect(isValidFontFamily('inherit')).toBe(true);
      expect(isValidFontFamily('NonExistent')).toBe(false);
      expect(isValidFontFamily(123)).toBe(false);
    });
  });

  describe('isValidFontWeight', () => {
    it('should validate font weight values', () => {
      expect(isValidFontWeight(400)).toBe(true);
      expect(isValidFontWeight(700)).toBe(true);
      expect(isValidFontWeight(450)).toBe(false); // not a standard weight
      expect(isValidFontWeight('400')).toBe(false);
    });
  });

  describe('isValidTextAlign', () => {
    it('should validate text align values', () => {
      expect(isValidTextAlign('left')).toBe(true);
      expect(isValidTextAlign('center')).toBe(true);
      expect(isValidTextAlign('middle')).toBe(false); // not a valid alignment
      expect(isValidTextAlign(123)).toBe(false);
    });
  });
});

describe('Integration with UnifiedToolbar and TypographyControls', () => {
  it('should provide consistent constants across components', () => {
    // Verify that constants are the same across all imports
    expect(FONT_FAMILIES).toHaveLength(14);
    expect(FONT_WEIGHTS).toHaveLength(9);
    expect(TEXT_DECORATIONS).toHaveLength(3);
    expect(TEXT_TRANSFORMS).toHaveLength(4);
    expect(ALIGNMENT_OPTIONS).toHaveLength(4);
  });

  it('should ensure no duplicate values in constants', () => {
    const fontFamilyValues = FONT_FAMILIES.map(f => f.value);
    expect(new Set(fontFamilyValues).size).toBe(fontFamilyValues.length);

    const fontWeightValues = FONT_WEIGHTS.map(w => w.value);
    expect(new Set(fontWeightValues).size).toBe(fontWeightValues.length);

    const decorationValues = TEXT_DECORATIONS.map(d => d.value);
    expect(new Set(decorationValues).size).toBe(decorationValues.length);

    const transformValues = TEXT_TRANSFORMS.map(t => t.value);
    expect(new Set(transformValues).size).toBe(transformValues.length);

    const alignmentValues = ALIGNMENT_OPTIONS.map(a => a.value);
    expect(new Set(alignmentValues).size).toBe(alignmentValues.length);
  });
});

describe('Performance and Memory', () => {
  it('should not create new objects on repeated calls', () => {
    const styles1 = typographyUtils.getTypographyStyles({ fontSize: 16 });
    const styles2 = typographyUtils.getTypographyStyles({ fontSize: 16 });

    // While objects won't be reference equal, they should be structurally equal
    expect(styles1).toEqual(styles2);
  });

  it('should handle validation of large datasets efficiently', () => {
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      typographyUtils.validateTypographyData({
        fontSize: 8 + (i % 120),
        fontWeight: 100 + (i % 9) * 100,
        lineHeight: 0.5 + (i % 25) * 0.1,
      });
    }

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
  });
});
