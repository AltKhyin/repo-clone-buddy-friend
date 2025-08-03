// ABOUTME: DEPRECATED - Legacy typography support for backward compatibility during selection-based typography transition
// 
// ⚠️  This file is DEPRECATED and should be phased out once selection-based typography is fully adopted.
// 🎯 Modern approach: Use selection-based typography with TipTap marks for all content types
// 📅 Target removal: After UnifiedToolbar is fully modernized
//
// Current usage: UnifiedToolbar.tsx (fallback logic only)

import { EditorNodeType } from '@/types/editor';

// Simplified typography properties interface for legacy compatibility
export interface LegacyTypographyProperties {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
}

// Block-specific typography context for legacy support
export interface LegacyBlockTypographyContext {
  blockType: EditorNodeType;
  supportsTypography: boolean;
  typographyScope: 'full' | 'partial' | 'none';
  availableProperties: (keyof LegacyTypographyProperties)[];
  specialHandling?: {
    hasCaption?: boolean;
    hasCells?: boolean;
    hasMultipleTextElements?: boolean;
  };
}

// Most block types support typography in the new selection-based system
const LEGACY_BLOCK_SUPPORT: Record<EditorNodeType, LegacyBlockTypographyContext> = {
  // Text blocks support full typography
  richBlock: {
    blockType: 'richBlock',
    supportsTypography: true,
    typographyScope: 'full',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'textDecoration', 'textAlign', 'color'],
  },
  textBlock: {
    blockType: 'textBlock',
    supportsTypography: true,
    typographyScope: 'full',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'textDecoration', 'textAlign', 'color'],
  },
  headingBlock: {
    blockType: 'headingBlock',
    supportsTypography: true,
    typographyScope: 'full',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'textDecoration', 'textAlign', 'color'],
  },
  quoteBlock: {
    blockType: 'quoteBlock',
    supportsTypography: true,
    typographyScope: 'full',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'textDecoration', 'textAlign', 'color'],
  },

  // Special blocks with partial support
  pollBlock: {
    blockType: 'pollBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: { hasMultipleTextElements: true },
  },
  keyTakeawayBlock: {
    blockType: 'keyTakeawayBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'textAlign'],
  },
  referenceBlock: {
    blockType: 'referenceBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color'],
  },

  // Media blocks with caption support
  imageBlock: {
    blockType: 'imageBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: { hasCaption: true },
  },
  videoEmbedBlock: {
    blockType: 'videoEmbedBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: { hasCaption: true },
  },

  // Table block with cell support
  tableBlock: {
    blockType: 'tableBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: { hasCells: true },
  },

  // No typography support
  separatorBlock: {
    blockType: 'separatorBlock',
    supportsTypography: false,
    typographyScope: 'none',
    availableProperties: [],
  },
};

/**
 * Legacy compatibility: Checks if a block type supports typography
 * Note: In the new selection-based system, typography is primarily handled at the text level
 */
export function isBlockTypographySupported(blockType: EditorNodeType): boolean {
  const context = LEGACY_BLOCK_SUPPORT[blockType];
  return context ? context.supportsTypography : false;
}

/**
 * Legacy compatibility: Gets typography properties for a block type
 * Note: These are now primarily used for fallback when no text is selected
 */
export function getBlockTypographyProperties(blockType: EditorNodeType): (keyof LegacyTypographyProperties)[] {
  const context = LEGACY_BLOCK_SUPPORT[blockType];
  return context ? context.availableProperties : [];
}

/**
 * Legacy compatibility: Gets block typography context
 */
export function getBlockTypographyContext(blockType: EditorNodeType): LegacyBlockTypographyContext | null {
  return LEGACY_BLOCK_SUPPORT[blockType] || null;
}

/**
 * Legacy compatibility: Checks if block has caption support
 */
export function hasBlockCaptionSupport(blockType: EditorNodeType): boolean {
  const context = LEGACY_BLOCK_SUPPORT[blockType];
  return context?.specialHandling?.hasCaption || false;
}

/**
 * Legacy compatibility: Checks if block has cell support
 */
export function hasBlockCellSupport(blockType: EditorNodeType): boolean {
  const context = LEGACY_BLOCK_SUPPORT[blockType];
  return context?.specialHandling?.hasCells || false;
}

/**
 * Legacy compatibility: Checks if block has multiple text elements
 */
export function hasBlockMultipleTextElements(blockType: EditorNodeType): boolean {
  const context = LEGACY_BLOCK_SUPPORT[blockType];
  return context?.specialHandling?.hasMultipleTextElements || false;
}

/**
 * Legacy compatibility: Validates typography properties for a block type
 */
export function validateBlockTypographyProperties(
  blockType: EditorNodeType,
  properties: Partial<LegacyTypographyProperties>
): {
  valid: boolean;
  validProperties: Partial<LegacyTypographyProperties>;
  invalidProperties: string[];
} {
  const availableProperties = getBlockTypographyProperties(blockType);
  const validProperties: Partial<LegacyTypographyProperties> = {};
  const invalidProperties: string[] = [];

  Object.entries(properties).forEach(([key, value]) => {
    if (availableProperties.includes(key as keyof LegacyTypographyProperties)) {
      validProperties[key as keyof LegacyTypographyProperties] = value;
    } else {
      invalidProperties.push(key);
    }
  });

  return {
    valid: invalidProperties.length === 0,
    validProperties,
    invalidProperties,
  };
}

/**
 * Legacy compatibility: Merges typography properties with existing block data
 */
export function mergeBlockTypographyProperties(
  blockType: EditorNodeType,
  existingData: any,
  typographyProperties: Partial<LegacyTypographyProperties>
): any {
  const { validProperties } = validateBlockTypographyProperties(blockType, typographyProperties);

  return {
    ...existingData,
    ...validProperties,
  };
}