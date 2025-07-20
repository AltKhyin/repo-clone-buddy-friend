// ABOUTME: Comprehensive tests for block typography utilities and property management

import { describe, it, expect } from 'vitest';
import {
  getBlockTypographyProperties,
  isBlockTypographySupported,
  getBlockTypographyContext,
  hasBlockCaptionSupport,
  hasBlockCellSupport,
  hasBlockMultipleTextElements,
  getBlockTypographyPropertiesByCategory,
  validateBlockTypographyProperties,
  mergeBlockTypographyProperties,
  BLOCK_TYPOGRAPHY_SUPPORT,
  TYPOGRAPHY_PROPERTY_CATEGORIES,
  TypographyProperties,
} from '../blockTypographyUtils';
import { EditorNodeType } from '@/types/editor';

describe('blockTypographyUtils', () => {
  describe('getBlockTypographyProperties', () => {
    it('should return full typography properties for textBlock', () => {
      const properties = getBlockTypographyProperties('textBlock');
      expect(properties).toEqual([
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'lineHeight',
        'letterSpacing',
        'textTransform',
        'textDecoration',
        'textAlign',
        'color',
      ]);
    });

    it('should return full typography properties for headingBlock', () => {
      const properties = getBlockTypographyProperties('headingBlock');
      expect(properties).toEqual([
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'lineHeight',
        'letterSpacing',
        'textTransform',
        'textDecoration',
        'textAlign',
        'color',
      ]);
    });

    it('should return partial properties for pollBlock', () => {
      const properties = getBlockTypographyProperties('pollBlock');
      expect(properties).toEqual(['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign']);
    });

    it('should return empty array for separatorBlock', () => {
      const properties = getBlockTypographyProperties('separatorBlock');
      expect(properties).toEqual([]);
    });

    it('should return empty array for unknown block type', () => {
      const properties = getBlockTypographyProperties('unknownBlock' as EditorNodeType);
      expect(properties).toEqual([]);
    });
  });

  describe('isBlockTypographySupported', () => {
    it('should return true for blocks with typography support', () => {
      expect(isBlockTypographySupported('textBlock')).toBe(true);
      expect(isBlockTypographySupported('headingBlock')).toBe(true);
      expect(isBlockTypographySupported('quoteBlock')).toBe(true);
      expect(isBlockTypographySupported('pollBlock')).toBe(true);
      expect(isBlockTypographySupported('keyTakeawayBlock')).toBe(true);
      expect(isBlockTypographySupported('referenceBlock')).toBe(true);
      expect(isBlockTypographySupported('imageBlock')).toBe(true);
      expect(isBlockTypographySupported('videoEmbedBlock')).toBe(true);
      expect(isBlockTypographySupported('tableBlock')).toBe(true);
    });

    it('should return false for blocks without typography support', () => {
      expect(isBlockTypographySupported('separatorBlock')).toBe(false);
    });

    it('should return false for unknown block type', () => {
      expect(isBlockTypographySupported('unknownBlock' as EditorNodeType)).toBe(false);
    });
  });

  describe('getBlockTypographyContext', () => {
    it('should return correct context for textBlock', () => {
      const context = getBlockTypographyContext('textBlock');
      expect(context).toEqual({
        blockType: 'textBlock',
        supportsTypography: true,
        typographyScope: 'full',
        availableProperties: [
          'fontFamily',
          'fontSize',
          'fontWeight',
          'fontStyle',
          'lineHeight',
          'letterSpacing',
          'textTransform',
          'textDecoration',
          'textAlign',
          'color',
        ],
      });
    });

    it('should return correct context for pollBlock with special handling', () => {
      const context = getBlockTypographyContext('pollBlock');
      expect(context).toEqual({
        blockType: 'pollBlock',
        supportsTypography: true,
        typographyScope: 'partial',
        availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
        specialHandling: {
          hasMultipleTextElements: true,
        },
      });
    });

    it('should return correct context for imageBlock with caption support', () => {
      const context = getBlockTypographyContext('imageBlock');
      expect(context).toEqual({
        blockType: 'imageBlock',
        supportsTypography: true,
        typographyScope: 'partial',
        availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
        specialHandling: {
          hasCaption: true,
        },
      });
    });

    it('should return null for unknown block type', () => {
      const context = getBlockTypographyContext('unknownBlock' as EditorNodeType);
      expect(context).toBeNull();
    });
  });

  describe('hasBlockCaptionSupport', () => {
    it('should return true for blocks with caption support', () => {
      expect(hasBlockCaptionSupport('imageBlock')).toBe(true);
      expect(hasBlockCaptionSupport('videoEmbedBlock')).toBe(true);
    });

    it('should return false for blocks without caption support', () => {
      expect(hasBlockCaptionSupport('textBlock')).toBe(false);
      expect(hasBlockCaptionSupport('pollBlock')).toBe(false);
      expect(hasBlockCaptionSupport('separatorBlock')).toBe(false);
    });
  });

  describe('hasBlockCellSupport', () => {
    it('should return true for blocks with cell support', () => {
      expect(hasBlockCellSupport('tableBlock')).toBe(true);
    });

    it('should return false for blocks without cell support', () => {
      expect(hasBlockCellSupport('textBlock')).toBe(false);
      expect(hasBlockCellSupport('imageBlock')).toBe(false);
      expect(hasBlockCellSupport('pollBlock')).toBe(false);
    });
  });

  describe('hasBlockMultipleTextElements', () => {
    it('should return true for blocks with multiple text elements', () => {
      expect(hasBlockMultipleTextElements('pollBlock')).toBe(true);
    });

    it('should return false for blocks without multiple text elements', () => {
      expect(hasBlockMultipleTextElements('textBlock')).toBe(false);
      expect(hasBlockMultipleTextElements('headingBlock')).toBe(false);
      expect(hasBlockMultipleTextElements('imageBlock')).toBe(false);
    });
  });

  describe('getBlockTypographyPropertiesByCategory', () => {
    it('should categorize properties correctly for textBlock', () => {
      const categorized = getBlockTypographyPropertiesByCategory('textBlock');
      expect(categorized).toEqual({
        font: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle'],
        spacing: ['lineHeight', 'letterSpacing'],
        styling: ['textTransform', 'textDecoration', 'color'],
        alignment: ['textAlign'],
      });
    });

    it('should categorize properties correctly for pollBlock', () => {
      const categorized = getBlockTypographyPropertiesByCategory('pollBlock');
      expect(categorized).toEqual({
        font: ['fontFamily', 'fontSize', 'fontWeight'],
        spacing: [],
        styling: ['color'],
        alignment: ['textAlign'],
      });
    });

    it('should return empty categories for separatorBlock', () => {
      const categorized = getBlockTypographyPropertiesByCategory('separatorBlock');
      expect(categorized).toEqual({
        font: [],
        spacing: [],
        styling: [],
        alignment: [],
      });
    });
  });

  describe('validateBlockTypographyProperties', () => {
    it('should validate properties correctly for textBlock', () => {
      const properties: Partial<TypographyProperties> = {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 700,
        invalidProperty: 'test',
      } as any;

      const result = validateBlockTypographyProperties('textBlock', properties);
      expect(result.valid).toBe(false);
      expect(result.validProperties).toEqual({
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 700,
      });
      expect(result.invalidProperties).toEqual(['invalidProperty']);
    });

    it('should validate properties correctly for pollBlock', () => {
      const properties: Partial<TypographyProperties> = {
        fontFamily: 'Arial',
        fontSize: 16,
        lineHeight: 1.5, // Not supported by pollBlock
        color: '#000000',
      };

      const result = validateBlockTypographyProperties('pollBlock', properties);
      expect(result.valid).toBe(false);
      expect(result.validProperties).toEqual({
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#000000',
      });
      expect(result.invalidProperties).toEqual(['lineHeight']);
    });

    it('should return valid result for all supported properties', () => {
      const properties: Partial<TypographyProperties> = {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 700,
        color: '#000000',
        textAlign: 'center',
      };

      const result = validateBlockTypographyProperties('pollBlock', properties);
      expect(result.valid).toBe(true);
      expect(result.validProperties).toEqual(properties);
      expect(result.invalidProperties).toEqual([]);
    });
  });

  describe('mergeBlockTypographyProperties', () => {
    it('should merge typography properties with existing block data', () => {
      const existingData = {
        content: 'Test content',
        theme: 'primary',
        fontSize: 14,
      };

      const typographyProperties: Partial<TypographyProperties> = {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 700,
        color: '#000000',
      };

      const result = mergeBlockTypographyProperties(
        'textBlock',
        existingData,
        typographyProperties
      );

      expect(result).toEqual({
        content: 'Test content',
        theme: 'primary',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 700,
        color: '#000000',
      });
    });

    it('should only merge valid properties for block type', () => {
      const existingData = {
        content: 'Test content',
        theme: 'primary',
      };

      const typographyProperties: Partial<TypographyProperties> = {
        fontFamily: 'Arial',
        fontSize: 16,
        lineHeight: 1.5, // Not supported by pollBlock
        color: '#000000',
      };

      const result = mergeBlockTypographyProperties(
        'pollBlock',
        existingData,
        typographyProperties
      );

      expect(result).toEqual({
        content: 'Test content',
        theme: 'primary',
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#000000',
        // lineHeight should not be included
      });
    });

    it('should preserve existing data when merging', () => {
      const existingData = {
        content: 'Test content',
        theme: 'primary',
        fontSize: 14,
        fontWeight: 400,
      };

      const typographyProperties: Partial<TypographyProperties> = {
        fontSize: 16,
        color: '#000000',
      };

      const result = mergeBlockTypographyProperties(
        'textBlock',
        existingData,
        typographyProperties
      );

      expect(result).toEqual({
        content: 'Test content',
        theme: 'primary',
        fontSize: 16, // Updated
        fontWeight: 400, // Preserved
        color: '#000000', // Added
      });
    });
  });

  describe('BLOCK_TYPOGRAPHY_SUPPORT constant', () => {
    it('should contain all expected block types', () => {
      const expectedBlockTypes: EditorNodeType[] = [
        'textBlock',
        'headingBlock',
        'quoteBlock',
        'pollBlock',
        'keyTakeawayBlock',
        'referenceBlock',
        'imageBlock',
        'videoEmbedBlock',
        'tableBlock',
        'separatorBlock',
      ];

      expectedBlockTypes.forEach(blockType => {
        expect(BLOCK_TYPOGRAPHY_SUPPORT[blockType]).toBeDefined();
      });
    });

    it('should have consistent block type references', () => {
      Object.entries(BLOCK_TYPOGRAPHY_SUPPORT).forEach(([blockType, context]) => {
        expect(context.blockType).toBe(blockType);
      });
    });
  });

  describe('TYPOGRAPHY_PROPERTY_CATEGORIES constant', () => {
    it('should contain all expected categories', () => {
      expect(TYPOGRAPHY_PROPERTY_CATEGORIES.FONT).toEqual([
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
      ]);
      expect(TYPOGRAPHY_PROPERTY_CATEGORIES.SPACING).toEqual(['lineHeight', 'letterSpacing']);
      expect(TYPOGRAPHY_PROPERTY_CATEGORIES.STYLING).toEqual([
        'textTransform',
        'textDecoration',
        'color',
      ]);
      expect(TYPOGRAPHY_PROPERTY_CATEGORIES.ALIGNMENT).toEqual(['textAlign']);
    });

    it('should contain all typography properties across categories', () => {
      const allCategoryProperties = [
        ...TYPOGRAPHY_PROPERTY_CATEGORIES.FONT,
        ...TYPOGRAPHY_PROPERTY_CATEGORIES.SPACING,
        ...TYPOGRAPHY_PROPERTY_CATEGORIES.STYLING,
        ...TYPOGRAPHY_PROPERTY_CATEGORIES.ALIGNMENT,
      ];

      const expectedProperties = [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'lineHeight',
        'letterSpacing',
        'textTransform',
        'textDecoration',
        'textAlign',
        'color',
      ];

      expectedProperties.forEach(property => {
        expect(allCategoryProperties).toContain(property);
      });
    });
  });
});
