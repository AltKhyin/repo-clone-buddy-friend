// ABOUTME: Core utilities for block-specific typography integration and property management across all editor blocks

import { EditorNodeType } from '@/types/editor';

// Typography properties that can be applied to blocks
export interface TypographyProperties {
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

// Block-specific typography contexts
export interface BlockTypographyContext {
  blockType: EditorNodeType;
  supportsTypography: boolean;
  typographyScope: 'full' | 'partial' | 'none';
  availableProperties: (keyof TypographyProperties)[];
  specialHandling?: {
    hasCaption?: boolean;
    hasCells?: boolean;
    hasMultipleTextElements?: boolean;
  };
}

// Typography property categories for different block types
export const TYPOGRAPHY_PROPERTY_CATEGORIES = {
  FONT: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle'] as const,
  SPACING: ['lineHeight', 'letterSpacing'] as const,
  STYLING: ['textTransform', 'textDecoration', 'color'] as const,
  ALIGNMENT: ['textAlign'] as const,
} as const;

// Block type to typography support mapping
export const BLOCK_TYPOGRAPHY_SUPPORT: Record<EditorNodeType, BlockTypographyContext> = {
  // Full typography support blocks
  richBlock: {
    blockType: 'richBlock',
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
  },
  textBlock: {
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
  },
  headingBlock: {
    blockType: 'headingBlock',
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
  },
  quoteBlock: {
    blockType: 'quoteBlock',
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
  },

  // Partial typography support blocks (have typography but with limitations)
  pollBlock: {
    blockType: 'pollBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: {
      hasMultipleTextElements: true,
    },
  },
  keyTakeawayBlock: {
    blockType: 'keyTakeawayBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'lineHeight',
      'color',
      'textAlign',
    ],
  },
  referenceBlock: {
    blockType: 'referenceBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color'],
  },

  // Caption-supporting blocks
  imageBlock: {
    blockType: 'imageBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: {
      hasCaption: true,
    },
  },
  videoEmbedBlock: {
    blockType: 'videoEmbedBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: {
      hasCaption: true,
    },
  },

  // Cell-supporting blocks
  tableBlock: {
    blockType: 'tableBlock',
    supportsTypography: true,
    typographyScope: 'partial',
    availableProperties: ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textAlign'],
    specialHandling: {
      hasCells: true,
    },
  },

  // No direct typography support
  separatorBlock: {
    blockType: 'separatorBlock',
    supportsTypography: false,
    typographyScope: 'none',
    availableProperties: [],
  },
} as const;

/**
 * Gets the typography properties available for a specific block type
 * @param blockType - The type of block to get properties for
 * @returns Array of available typography properties
 */
export function getBlockTypographyProperties(
  blockType: EditorNodeType
): (keyof TypographyProperties)[] {
  const context = BLOCK_TYPOGRAPHY_SUPPORT[blockType];
  return context ? context.availableProperties : [];
}

/**
 * Checks if a block type supports typography customization
 * @param blockType - The type of block to check
 * @returns Boolean indicating if block supports typography
 */
export function isBlockTypographySupported(blockType: EditorNodeType): boolean {
  const context = BLOCK_TYPOGRAPHY_SUPPORT[blockType];
  return context ? context.supportsTypography : false;
}

/**
 * Gets the typography context for a specific block type
 * @param blockType - The type of block to get context for
 * @returns Block typography context object
 */
export function getBlockTypographyContext(
  blockType: EditorNodeType
): BlockTypographyContext | null {
  return BLOCK_TYPOGRAPHY_SUPPORT[blockType] || null;
}

/**
 * Determines if a block has caption typography support
 * @param blockType - The type of block to check
 * @returns Boolean indicating if block has caption support
 */
export function hasBlockCaptionSupport(blockType: EditorNodeType): boolean {
  const context = BLOCK_TYPOGRAPHY_SUPPORT[blockType];
  return context?.specialHandling?.hasCaption || false;
}

/**
 * Determines if a block has cell typography support
 * @param blockType - The type of block to check
 * @returns Boolean indicating if block has cell support
 */
export function hasBlockCellSupport(blockType: EditorNodeType): boolean {
  const context = BLOCK_TYPOGRAPHY_SUPPORT[blockType];
  return context?.specialHandling?.hasCells || false;
}

/**
 * Determines if a block has multiple text elements
 * @param blockType - The type of block to check
 * @returns Boolean indicating if block has multiple text elements
 */
export function hasBlockMultipleTextElements(blockType: EditorNodeType): boolean {
  const context = BLOCK_TYPOGRAPHY_SUPPORT[blockType];
  return context?.specialHandling?.hasMultipleTextElements || false;
}

/**
 * Gets typography properties grouped by category for a block type
 * @param blockType - The type of block to get categorized properties for
 * @returns Object with properties grouped by category
 */
export function getBlockTypographyPropertiesByCategory(blockType: EditorNodeType): {
  font: (keyof TypographyProperties)[];
  spacing: (keyof TypographyProperties)[];
  styling: (keyof TypographyProperties)[];
  alignment: (keyof TypographyProperties)[];
} {
  const availableProperties = getBlockTypographyProperties(blockType);

  return {
    font: availableProperties.filter(prop =>
      TYPOGRAPHY_PROPERTY_CATEGORIES.FONT.includes(prop as any)
    ),
    spacing: availableProperties.filter(prop =>
      TYPOGRAPHY_PROPERTY_CATEGORIES.SPACING.includes(prop as any)
    ),
    styling: availableProperties.filter(prop =>
      TYPOGRAPHY_PROPERTY_CATEGORIES.STYLING.includes(prop as any)
    ),
    alignment: availableProperties.filter(prop =>
      TYPOGRAPHY_PROPERTY_CATEGORIES.ALIGNMENT.includes(prop as any)
    ),
  };
}

/**
 * Validates typography properties for a specific block type
 * @param blockType - The type of block to validate for
 * @param properties - Typography properties to validate
 * @returns Object with validation results
 */
export function validateBlockTypographyProperties(
  blockType: EditorNodeType,
  properties: Partial<TypographyProperties>
): {
  valid: boolean;
  validProperties: Partial<TypographyProperties>;
  invalidProperties: string[];
} {
  const availableProperties = getBlockTypographyProperties(blockType);
  const validProperties: Partial<TypographyProperties> = {};
  const invalidProperties: string[] = [];

  Object.entries(properties).forEach(([key, value]) => {
    if (availableProperties.includes(key as keyof TypographyProperties)) {
      validProperties[key as keyof TypographyProperties] = value;
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
 * Merges typography properties with existing block data
 * @param blockType - The type of block
 * @param existingData - Existing block data
 * @param typographyProperties - Typography properties to merge
 * @returns Merged block data with validated typography properties
 */
export function mergeBlockTypographyProperties(
  blockType: EditorNodeType,
  existingData: any,
  typographyProperties: Partial<TypographyProperties>
): any {
  const { validProperties } = validateBlockTypographyProperties(blockType, typographyProperties);

  return {
    ...existingData,
    ...validProperties,
  };
}
