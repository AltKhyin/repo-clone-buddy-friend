// ABOUTME: Unified hook for block styling that consolidates styling patterns across all block types

import { useMemo } from 'react';
import { useEditorTheme } from './useEditorTheme';
import { cn } from '@/lib/utils';

interface BaseBlockData {
  // Individual padding system
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Legacy padding fields (for backward compatibility)
  paddingX?: number;
  paddingY?: number;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  color?: string;
}

interface BlockStylingOptions {
  /** Default individual padding values */
  defaultPaddingTop?: number;
  defaultPaddingRight?: number;
  defaultPaddingBottom?: number;
  defaultPaddingLeft?: number;
  /** Legacy default padding values (deprecated) */
  defaultPaddingX?: number;
  defaultPaddingY?: number;
  /** Default background color */
  defaultBackground?: string;
  /** Default border radius */
  defaultBorderRadius?: number;
  /** Default text color */
  defaultTextColor?: string;
  /** Additional CSS classes */
  additionalClasses?: string;
  /** Minimum dimensions for the block */
  minDimensions?: { width: number; height: number };
  /** Whether to apply transparent background when none specified */
  transparentBackground?: boolean;
}

/**
 * Hook that provides standardized styling for blocks
 * Consolidates styling logic and eliminates duplication
 */
export function useBlockStyling<T extends BaseBlockData>(
  data: T,
  selected: boolean,
  options: BlockStylingOptions = {}
) {
  const { colors } = useEditorTheme();

  const {
    defaultPaddingTop = 16,
    defaultPaddingRight = 16,
    defaultPaddingBottom = 16,
    defaultPaddingLeft = 16,
    // Legacy defaults
    defaultPaddingX = 16,
    defaultPaddingY = 16,
    defaultBackground = 'transparent',
    defaultBorderRadius = 8,
    defaultTextColor,
    additionalClasses = '',
    minDimensions = { width: 200, height: 80 },
    transparentBackground = true,
  } = options;

  // Calculate dynamic styles with individual padding support
  const dynamicStyles = useMemo((): React.CSSProperties => {
    // Individual padding with fallback to legacy system
    const paddingTop = data.paddingTop ?? data.paddingY ?? defaultPaddingTop;
    const paddingRight = data.paddingRight ?? data.paddingX ?? defaultPaddingRight;
    const paddingBottom = data.paddingBottom ?? data.paddingY ?? defaultPaddingBottom;
    const paddingLeft = data.paddingLeft ?? data.paddingX ?? defaultPaddingLeft;

    return {
      backgroundColor:
        data.backgroundColor || (transparentBackground ? 'transparent' : defaultBackground),
      borderRadius: data.borderRadius ? `${data.borderRadius}px` : `${defaultBorderRadius}px`,
      borderWidth: data.borderWidth ? `${data.borderWidth}px` : '0px',
      borderColor: data.borderColor || 'transparent',
      borderStyle: 'solid',
      color: data.color || defaultTextColor || colors.block.text,
      padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
      minWidth: `${minDimensions.width}px`,
      minHeight: `${minDimensions.height}px`,
      transition: 'all 0.2s ease-in-out',
    };
  }, [
    data.paddingTop,
    data.paddingRight,
    data.paddingBottom,
    data.paddingLeft,
    data.paddingX,
    data.paddingY,
    data.backgroundColor,
    data.borderRadius,
    data.borderWidth,
    data.borderColor,
    data.color,
    defaultPaddingTop,
    defaultPaddingRight,
    defaultPaddingBottom,
    defaultPaddingLeft,
    defaultPaddingX,
    defaultPaddingY,
    defaultBackground,
    defaultBorderRadius,
    defaultTextColor,
    transparentBackground,
    colors.block.text,
    minDimensions,
  ]);

  // Calculate selection classes
  const selectionClasses = useMemo(() => {
    return selected ? 'ring-2 ring-primary ring-offset-0' : '';
  }, [selected]);

  // Calculate content styles for UnifiedBlockWrapper
  const contentStyles = useMemo((): React.CSSProperties => {
    // Individual padding with fallback to legacy system
    const paddingTop = data.paddingTop ?? data.paddingY ?? defaultPaddingTop;
    const paddingRight = data.paddingRight ?? data.paddingX ?? defaultPaddingRight;
    const paddingBottom = data.paddingBottom ?? data.paddingY ?? defaultPaddingBottom;
    const paddingLeft = data.paddingLeft ?? data.paddingX ?? defaultPaddingLeft;

    return {
      backgroundColor: dynamicStyles.backgroundColor,
      borderRadius: dynamicStyles.borderRadius,
      borderWidth: dynamicStyles.borderWidth,
      borderColor: dynamicStyles.borderColor,
      borderStyle: 'solid',
      padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      minHeight: '100%',
      cursor: 'pointer',
      color: dynamicStyles.color,
    };
  }, [
    dynamicStyles,
    data.paddingTop,
    data.paddingRight,
    data.paddingBottom,
    data.paddingLeft,
    data.paddingX,
    data.paddingY,
    defaultPaddingTop,
    defaultPaddingRight,
    defaultPaddingBottom,
    defaultPaddingLeft,
    defaultPaddingX,
    defaultPaddingY,
  ]);

  // Calculate container classes
  const containerClasses = useMemo(() => {
    return cn(
      'relative cursor-pointer transition-all duration-200',
      selectionClasses,
      additionalClasses
    );
  }, [selectionClasses, additionalClasses]);

  // Get individual style values for convenience
  const styleValues = useMemo(
    () => ({
      // Individual padding values
      paddingTop: data.paddingTop ?? data.paddingY ?? defaultPaddingTop,
      paddingRight: data.paddingRight ?? data.paddingX ?? defaultPaddingRight,
      paddingBottom: data.paddingBottom ?? data.paddingY ?? defaultPaddingBottom,
      paddingLeft: data.paddingLeft ?? data.paddingX ?? defaultPaddingLeft,
      // Legacy padding values (for backward compatibility)
      paddingX: data.paddingX ?? defaultPaddingX,
      paddingY: data.paddingY ?? defaultPaddingY,
      backgroundColor:
        data.backgroundColor || (transparentBackground ? 'transparent' : defaultBackground),
      borderRadius: data.borderRadius ?? defaultBorderRadius,
      borderWidth: data.borderWidth ?? 0,
      borderColor: data.borderColor || 'transparent',
      textColor: data.color || defaultTextColor || colors.block.text,
    }),
    [
      data.paddingTop,
      data.paddingRight,
      data.paddingBottom,
      data.paddingLeft,
      data.paddingX,
      data.paddingY,
      data.backgroundColor,
      data.borderRadius,
      data.borderWidth,
      data.borderColor,
      data.color,
      defaultPaddingTop,
      defaultPaddingRight,
      defaultPaddingBottom,
      defaultPaddingLeft,
      defaultPaddingX,
      defaultPaddingY,
      defaultBackground,
      defaultBorderRadius,
      defaultTextColor,
      transparentBackground,
      colors.block.text,
    ]
  );

  return {
    /** Complete dynamic styles object for inline styling */
    dynamicStyles,
    /** CSS classes for selection state */
    selectionClasses,
    /** Content styles for UnifiedBlockWrapper */
    contentStyles,
    /** Complete container classes */
    containerClasses,
    /** Individual style values for conditional logic */
    styleValues,
    /** Theme colors for convenience */
    colors,
  };
}

/**
 * Specialized styling hook for text-based blocks
 */
export function useTextBlockStyling<
  T extends BaseBlockData & {
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    fontFamily?: string;
    fontWeight?: number;
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration?: 'none' | 'underline' | 'line-through';
    headingLevel?: 1 | 2 | 3 | 4 | null;
  },
>(data: T, selected: boolean, options: BlockStylingOptions = {}) {
  const base = useBlockStyling(data, selected, options);

  // Text-specific styling
  const textStyles = useMemo((): React.CSSProperties => {
    const isHeading = data.headingLevel && data.headingLevel >= 1 && data.headingLevel <= 4;

    // Heading-specific defaults
    const getHeadingFontSize = (level: number) => {
      const sizes = { 1: '2.25rem', 2: '1.875rem', 3: '1.5rem', 4: '1.25rem' };
      return sizes[level as keyof typeof sizes] || '1rem';
    };

    const getHeadingFontWeight = (level: number) => {
      return level <= 2 ? 700 : 600;
    };

    return {
      ...base.dynamicStyles,
      fontSize: data.fontSize
        ? `${data.fontSize}px`
        : isHeading
          ? getHeadingFontSize(data.headingLevel!)
          : '16px',
      textAlign: data.textAlign || 'left',
      lineHeight: data.lineHeight || (isHeading ? 1.2 : 1.6),
      fontFamily: data.fontFamily || 'inherit',
      fontWeight: data.fontWeight || (isHeading ? getHeadingFontWeight(data.headingLevel!) : 400),
      letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
      textTransform: data.textTransform || 'none',
      textDecoration: data.textDecoration || 'none',
    };
  }, [base.dynamicStyles, data]);

  return {
    ...base,
    /** Text-specific dynamic styles */
    textStyles,
    /** Whether this is a heading block */
    isHeading: data.headingLevel && data.headingLevel >= 1 && data.headingLevel <= 4,
  };
}

/**
 * Hook for blocks that need semantic color theming
 */
export function useSemanticBlockStyling<T extends BaseBlockData>(
  data: T,
  selected: boolean,
  semanticType: 'quote' | 'poll' | 'table' | 'separator' | 'keytakeaway',
  options: BlockStylingOptions = {}
) {
  const base = useBlockStyling(data, selected, options);
  const { colors } = useEditorTheme();

  // Get semantic colors
  const semanticColors = useMemo(() => {
    return colors.semantic[semanticType] || colors.block;
  }, [colors.semantic, colors.block, semanticType]);

  // Apply semantic color defaults
  const semanticStyles = useMemo(
    (): React.CSSProperties => ({
      ...base.dynamicStyles,
      color: data.color || semanticColors.text || colors.block.text,
      backgroundColor:
        data.backgroundColor || semanticColors.background || base.dynamicStyles.backgroundColor,
      borderColor: data.borderColor || semanticColors.border || base.dynamicStyles.borderColor,
    }),
    [
      base.dynamicStyles,
      data.color,
      data.backgroundColor,
      data.borderColor,
      semanticColors,
      colors.block,
    ]
  );

  return {
    ...base,
    /** Semantic-themed styles */
    semanticStyles,
    /** Semantic colors for this block type */
    semanticColors,
  };
}
