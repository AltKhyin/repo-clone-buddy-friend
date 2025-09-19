// ABOUTME: Enhanced mobile positioning algorithm with content-aware spacing and intelligent height adjustments

import { NodeObject, BlockPosition, BlockPositions } from '@/types/editor';

interface ContentAnalysis {
  type: 'text' | 'heading' | 'image' | 'video' | 'table' | 'list' | 'quote' | 'code' | 'unknown';
  complexity: 'simple' | 'medium' | 'complex';
  hasRichFormatting: boolean;
  approximateLineCount: number;
  // Text-aware analysis
  actualTextContent: string;
  characterCount: number;
  fontSize: number; // in pixels
  lineHeight: number; // multiplier (e.g., 1.5)
  hasHeadingSize: boolean;
  hasBoldText: boolean;
}

interface SpacingConfig {
  baseSpacing: number;
  heightMultiplier: number;
  topMargin: number;
  textReflowMultiplier: number; // Factor for text reflow from desktop to mobile width
}

/**
 * Enhanced Mobile Positioning Algorithm
 * Based on analysis of hand-edited vs auto-converted mobile layouts
 */
export class EnhancedMobilePositioning {
  private static readonly MOBILE_WIDTH = 375; // Mobile canvas logical width

  // Spacing configurations based on content analysis patterns with refined text reflow calculations
  private static readonly SPACING_CONFIGS: Record<string, SpacingConfig> = {
    'heading-simple': { baseSpacing: 44, heightMultiplier: 1.0, topMargin: 44, textReflowMultiplier: 1.3 },
    'heading-complex': { baseSpacing: 50, heightMultiplier: 1.1, topMargin: 44, textReflowMultiplier: 1.4 },
    'text-simple': { baseSpacing: 30, heightMultiplier: 1.0, topMargin: 0, textReflowMultiplier: 1.4 },
    'text-medium': { baseSpacing: 35, heightMultiplier: 1.05, topMargin: 0, textReflowMultiplier: 1.5 },
    'text-complex': { baseSpacing: 40, heightMultiplier: 1.1, topMargin: 0, textReflowMultiplier: 1.6 },
    'image-simple': { baseSpacing: 45, heightMultiplier: 1.0, topMargin: 0, textReflowMultiplier: 1.0 }, // No text reflow
    'image-complex': { baseSpacing: 55, heightMultiplier: 1.0, topMargin: 0, textReflowMultiplier: 1.0 }, // No text reflow
    'video': { baseSpacing: 50, heightMultiplier: 1.0, topMargin: 0, textReflowMultiplier: 1.0 }, // No text reflow
    'table': { baseSpacing: 60, heightMultiplier: 1.2, topMargin: 0, textReflowMultiplier: 1.8 }, // Tables still need more reflow
    'list': { baseSpacing: 35, heightMultiplier: 1.05, topMargin: 0, textReflowMultiplier: 1.4 },
    'quote': { baseSpacing: 45, heightMultiplier: 1.1, topMargin: 0, textReflowMultiplier: 1.4 },
    'code': { baseSpacing: 40, heightMultiplier: 1.0, topMargin: 0, textReflowMultiplier: 1.2 }, // Code wraps less
    'default': { baseSpacing: 35, heightMultiplier: 1.0, topMargin: 0, textReflowMultiplier: 1.4 },
  };

  /**
   * Generate enhanced mobile positions with content-aware spacing
   */
  static generateEnhancedMobilePositions(
    nodes: NodeObject[],
    desktopPositions: BlockPositions,
    spacingMultiplier: number = 1.0,
    heightMultiplier: number = 1.0
  ): BlockPositions {
    if (!nodes.length || !Object.keys(desktopPositions).length) {
      return {};
    }

    // Sort nodes by desktop Y position to maintain reading order
    const sortedNodes = nodes
      .filter(node => desktopPositions[node.id])
      .sort((a, b) => desktopPositions[a.id].y - desktopPositions[b.id].y);

    const mobilePositions: BlockPositions = {};
    let currentY = this.SPACING_CONFIGS['heading-simple'].topMargin; // Professional top margin

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const desktopPos = desktopPositions[node.id];

      // Analyze content to determine optimal spacing and height
      const analysis = this.analyzeNodeContent(node);
      const spacingConfig = this.getSpacingConfig(analysis);

      // Calculate intelligent height with content-aware adjustments and text reflow
      const baseHeight = desktopPos.height;

      // Try text-aware calculation first, fall back to reflow calculation
      const textAwareHeight = this.calculateTextAwareHeight(desktopPos, analysis);

      // If text-aware calculation is reasonable, use it; otherwise fall back to reflow
      const shouldUseTextAware = analysis.actualTextContent &&
                                 analysis.characterCount > 0 &&
                                 textAwareHeight > baseHeight * 0.8; // Sanity check

      let calculatedHeight = shouldUseTextAware
        ? textAwareHeight
        : Math.round(Math.max(
            baseHeight * spacingConfig.heightMultiplier,
            this.calculateTextReflowHeight(desktopPos, analysis, spacingConfig.textReflowMultiplier)
          ));

      // Apply 10% base increase for more generous default heights
      calculatedHeight = Math.round(calculatedHeight * 1.1);

      // Apply user height multiplier
      const enhancedHeight = Math.round(calculatedHeight * heightMultiplier);

      // Calculate spacing to next element (content-aware)
      const spacingToNext = i < sortedNodes.length - 1
        ? Math.round(spacingConfig.baseSpacing * spacingMultiplier)
        : 0;

      // Create mobile position with enhanced values
      mobilePositions[node.id] = {
        id: node.id,
        x: 0, // Always left-aligned for mobile
        y: currentY,
        width: this.MOBILE_WIDTH, // Full mobile width
        height: enhancedHeight,
      };

      // Update Y position for next block
      currentY += enhancedHeight + spacingToNext;
    }

    return mobilePositions;
  }

  /**
   * Calculate exact height based on actual text content and typography
   */
  private static calculateTextAwareHeight(
    desktopPos: BlockPosition,
    analysis: ContentAnalysis
  ): number {
    // For non-text content, use original height
    if (analysis.type === 'image' || analysis.type === 'video') {
      return desktopPos.height;
    }

    // If no actual text content, fall back to reflow calculation
    if (!analysis.actualTextContent || analysis.characterCount === 0) {
      return this.calculateTextReflowHeight(desktopPos, analysis, 1.4);
    }

    // Mobile content width calculation - use actual block content width if available
    const MOBILE_PADDING = 20;
    const estimatedContentWidth = this.MOBILE_WIDTH - MOBILE_PADDING; // 355px fallback

    // For mobile, actual content width is often smaller due to block padding
    // Real-world example: 375px block width → 340px content width
    const actualContentWidth = Math.min(estimatedContentWidth, 340); // More realistic content width

    // Typography defaults based on content type
    const fontSize = analysis.fontSize || this.getDefaultFontSize(analysis.type);
    const lineHeight = analysis.lineHeight || this.getDefaultLineHeight(analysis.type);

    // Calculate average characters per line for mobile width
    const avgCharWidth = this.getAverageCharacterWidth(fontSize, analysis.hasBoldText);
    const charsPerLine = Math.floor(actualContentWidth / avgCharWidth);

    // Calculate required lines
    const textLines = Math.ceil(analysis.characterCount / charsPerLine);

    // Add extra lines for rich formatting (bold, links, etc.)
    const formattingLines = analysis.hasRichFormatting ? Math.ceil(textLines * 0.1) : 0;

    // Add safety margin for complex text (based on character count)
    const safetyMargin = analysis.characterCount > 500 ? Math.ceil(textLines * 0.05) : 0;

    // Total lines needed
    const totalLines = textLines + formattingLines + safetyMargin;

    // Calculate height: lines × (fontSize × lineHeight) + padding
    const calculatedTextHeight = totalLines * (fontSize * lineHeight);
    const blockPadding = this.getBlockPadding(analysis.type);
    const totalHeight = Math.round(calculatedTextHeight + blockPadding);

    // Ensure reasonable bounds
    const minHeight = Math.max(40, fontSize * lineHeight + blockPadding);
    const maxHeight = desktopPos.height * 3; // Prevent extreme heights

    return Math.min(Math.max(totalHeight, minHeight), maxHeight);
  }

  /**
   * Get default font size for content type
   */
  private static getDefaultFontSize(type: string): number {
    const fontSizes = {
      'heading': 24, // h1-h6 average
      'text': 16,
      'quote': 18,
      'code': 14,
      'list': 16,
      'table': 14,
      'default': 16,
    };
    return fontSizes[type] || fontSizes['default'];
  }

  /**
   * Get default line height for content type
   */
  private static getDefaultLineHeight(type: string): number {
    const lineHeights = {
      'heading': 1.2,
      'text': 1.5,
      'quote': 1.6,
      'code': 1.4,
      'list': 1.5,
      'table': 1.3,
      'default': 1.5,
    };
    return lineHeights[type] || lineHeights['default'];
  }

  /**
   * Calculate average character width for given font size
   */
  private static getAverageCharacterWidth(fontSize: number, isBold: boolean): number {
    // Average character width is approximately 0.6 × fontSize for normal text
    // Bold text is wider
    const baseWidth = fontSize * 0.6;
    return isBold ? baseWidth * 1.1 : baseWidth;
  }

  /**
   * Get block padding for content type
   */
  private static getBlockPadding(type: string): number {
    const paddings = {
      'heading': 20,
      'text': 16,
      'quote': 24,
      'code': 16,
      'list': 16,
      'table': 12,
      'default': 16,
    };
    return paddings[type] || paddings['default'];
  }

  /**
   * Calculate height adjustment for text reflow from desktop to mobile width (fallback)
   */
  private static calculateTextReflowHeight(
    desktopPos: BlockPosition,
    analysis: ContentAnalysis,
    textReflowMultiplier: number
  ): number {
    // For non-text content (images, videos), use original height
    if (analysis.type === 'image' || analysis.type === 'video') {
      return desktopPos.height;
    }

    // Calculate approximate desktop content width (accounting for typical padding)
    const DESKTOP_PADDING_ESTIMATE = 40; // Typical desktop block padding
    const MOBILE_PADDING_ESTIMATE = 20;  // Typical mobile block padding

    const desktopContentWidth = Math.max(100, desktopPos.width - DESKTOP_PADDING_ESTIMATE);
    const mobileContentWidth = Math.max(100, this.MOBILE_WIDTH - MOBILE_PADDING_ESTIMATE);

    // Calculate width ratio - how much narrower mobile is compared to desktop
    const widthRatio = desktopContentWidth / mobileContentWidth;

    // Text reflow calculation: wider width ratio = more text reflow = more height needed
    let calculatedReflowMultiplier = textReflowMultiplier;

    // Adjust reflow multiplier based on actual width difference (refined for better text-to-block ratio)
    if (widthRatio > 2.0) {
      // Desktop is much wider - increase reflow moderately
      calculatedReflowMultiplier = textReflowMultiplier * 1.15;
    } else if (widthRatio > 1.5) {
      // Desktop is wider - normal reflow
      calculatedReflowMultiplier = textReflowMultiplier;
    } else {
      // Desktop not much wider - reduce reflow slightly
      calculatedReflowMultiplier = textReflowMultiplier * 0.9;
    }

    // Apply content complexity adjustment (reduced)
    if (analysis.complexity === 'complex') {
      calculatedReflowMultiplier *= 1.05; // Slight increase for complex text
    }

    // Calculate final height with text reflow
    const reflowHeight = Math.round(desktopPos.height * calculatedReflowMultiplier);

    // Ensure minimum reasonable height
    return Math.max(reflowHeight, 40);
  }

  /**
   * Analyze node content to determine optimal spacing strategy
   */
  private static analyzeNodeContent(node: NodeObject): ContentAnalysis {
    const content = node.content;

    // Default analysis for unknown content
    const defaultAnalysis: ContentAnalysis = {
      type: 'unknown',
      complexity: 'simple',
      hasRichFormatting: false,
      approximateLineCount: 1,
      // Text-aware defaults
      actualTextContent: '',
      characterCount: 0,
      fontSize: 0,
      lineHeight: 0,
      hasHeadingSize: false,
      hasBoldText: false,
    };

    if (!content) return defaultAnalysis;

    try {
      // Analyze TipTap JSON content structure
      if (typeof content === 'object' && content.type) {
        const analysis = this.analyzeTipTapContent(content);
        return analysis;
      }

      // Fallback for string content
      if (typeof content === 'string') {
        return this.analyzeStringContent(content);
      }

      return defaultAnalysis;
    } catch (error) {
      console.warn('[Enhanced Mobile Positioning] Content analysis failed:', error);
      return defaultAnalysis;
    }
  }

  /**
   * Analyze TipTap JSON content structure with text extraction
   */
  private static analyzeTipTapContent(content: any): ContentAnalysis {
    const type = content.type || 'unknown';

    // Determine content type based on TipTap node type
    const contentType = this.mapTipTapType(type);

    // Extract actual text content from TipTap JSON
    const textExtraction = this.extractTextFromTipTap(content);

    // Analyze complexity based on content structure
    const complexity = this.analyzeComplexity(content);

    // Check for rich formatting
    const hasRichFormatting = this.hasRichFormatting(content);

    // Estimate line count for text content
    const approximateLineCount = this.estimateLineCount(content);

    // Extract typography information
    const typographyInfo = this.extractTypographyInfo(content);

    return {
      type: contentType,
      complexity,
      hasRichFormatting,
      approximateLineCount,
      // Text-aware properties
      actualTextContent: textExtraction.text,
      characterCount: textExtraction.text.length,
      fontSize: typographyInfo.fontSize,
      lineHeight: typographyInfo.lineHeight,
      hasHeadingSize: typographyInfo.hasHeadingSize,
      hasBoldText: textExtraction.hasBold,
    };
  }

  /**
   * Extract actual text content from TipTap JSON structure
   */
  private static extractTextFromTipTap(content: any): { text: string; hasBold: boolean } {
    let text = '';
    let hasBold = false;

    const extractRecursive = (node: any): void => {
      // Direct text node
      if (node.type === 'text' && node.text) {
        text += node.text;

        // Check for bold mark
        if (node.marks) {
          hasBold = hasBold || node.marks.some((mark: any) => mark.type === 'bold');
        }
        return;
      }

      // Node with content array
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractRecursive);
      }

      // Add line breaks for block elements
      if (['paragraph', 'heading', 'listItem'].includes(node.type)) {
        text += ' '; // Add space between blocks
      }
    };

    try {
      extractRecursive(content);
    } catch (error) {
      console.warn('[Enhanced Mobile Positioning] Text extraction failed:', error);
    }

    return {
      text: text.trim(),
      hasBold
    };
  }

  /**
   * Extract typography information from TipTap content
   */
  private static extractTypographyInfo(content: any): {
    fontSize: number;
    lineHeight: number;
    hasHeadingSize: boolean;
  } {
    let fontSize = 0;
    let lineHeight = 0;
    let hasHeadingSize = false;

    const extractTypography = (node: any): void => {
      // Check for heading
      if (node.type === 'heading') {
        hasHeadingSize = true;
        const level = node.attrs?.level || 1;
        // H1=32px, H2=28px, H3=24px, H4=20px, H5=18px, H6=16px
        fontSize = Math.max(fontSize, 38 - (level * 3));
        lineHeight = Math.max(lineHeight, 1.2);
      }

      // Check for text styling attributes
      if (node.attrs) {
        if (node.attrs.fontSize) {
          fontSize = Math.max(fontSize, parseInt(node.attrs.fontSize) || 0);
        }
        if (node.attrs.lineHeight) {
          lineHeight = Math.max(lineHeight, parseFloat(node.attrs.lineHeight) || 0);
        }
      }

      // Recursively check content
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractTypography);
      }
    };

    try {
      extractTypography(content);
    } catch (error) {
      console.warn('[Enhanced Mobile Positioning] Typography extraction failed:', error);
    }

    return {
      fontSize: fontSize || 0, // 0 means use default
      lineHeight: lineHeight || 0, // 0 means use default
      hasHeadingSize
    };
  }

  /**
   * Map TipTap node types to our content categories
   */
  private static mapTipTapType(tipTapType: string): ContentAnalysis['type'] {
    const typeMap: Record<string, ContentAnalysis['type']> = {
      'heading': 'heading',
      'paragraph': 'text',
      'image': 'image',
      'video': 'video',
      'table': 'table',
      'bulletList': 'list',
      'orderedList': 'list',
      'blockquote': 'quote',
      'codeBlock': 'code',
      'text': 'text',
    };

    return typeMap[tipTapType] || 'unknown';
  }

  /**
   * Analyze content complexity
   */
  private static analyzeComplexity(content: any): ContentAnalysis['complexity'] {
    let complexityScore = 0;

    // Check for nested content
    if (content.content && Array.isArray(content.content)) {
      complexityScore += content.content.length > 3 ? 2 : 1;

      // Check for deeply nested structures
      const hasDeepNesting = content.content.some((item: any) =>
        item.content && Array.isArray(item.content) && item.content.length > 0
      );
      if (hasDeepNesting) complexityScore += 2;
    }

    // Check for attributes/formatting
    if (content.attrs && Object.keys(content.attrs).length > 2) {
      complexityScore += 1;
    }

    // Check for marks (bold, italic, etc.)
    if (content.marks && content.marks.length > 0) {
      complexityScore += 1;
    }

    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  /**
   * Check for rich formatting indicators
   */
  private static hasRichFormatting(content: any): boolean {
    // Check for marks
    if (content.marks && content.marks.length > 0) return true;

    // Check for styling attributes
    if (content.attrs) {
      const stylingAttrs = ['textAlign', 'color', 'backgroundColor', 'fontSize'];
      if (stylingAttrs.some(attr => content.attrs[attr])) return true;
    }

    // Recursively check nested content
    if (content.content && Array.isArray(content.content)) {
      return content.content.some((item: any) => this.hasRichFormatting(item));
    }

    return false;
  }

  /**
   * Estimate line count for spacing calculations
   */
  private static estimateLineCount(content: any): number {
    if (content.type === 'text' && content.text) {
      // Rough estimation: 50 characters per line
      return Math.max(1, Math.ceil(content.text.length / 50));
    }

    if (content.content && Array.isArray(content.content)) {
      return content.content.reduce((count: number, item: any) =>
        count + this.estimateLineCount(item), 0
      );
    }

    return 1;
  }

  /**
   * Analyze string content (fallback)
   */
  private static analyzeStringContent(content: string): ContentAnalysis {
    const lineCount = Math.max(1, Math.ceil(content.length / 50));

    return {
      type: 'text',
      complexity: lineCount > 3 ? 'complex' : lineCount > 1 ? 'medium' : 'simple',
      hasRichFormatting: false,
      approximateLineCount: lineCount,
      // Text-aware properties from string content
      actualTextContent: content,
      characterCount: content.length,
      fontSize: 0, // Use default
      lineHeight: 0, // Use default
      hasHeadingSize: false,
      hasBoldText: false,
    };
  }

  /**
   * Get spacing configuration based on content analysis
   */
  private static getSpacingConfig(analysis: ContentAnalysis): SpacingConfig {
    const configKey = `${analysis.type}-${analysis.complexity}`;

    return this.SPACING_CONFIGS[configKey] ||
           this.SPACING_CONFIGS[analysis.type] ||
           this.SPACING_CONFIGS['default'];
  }
}

/**
 * Legacy mobile positioning algorithm (current implementation)
 * Kept for backwards compatibility and comparison
 */
export function generateLegacyMobilePositions(
  nodes: NodeObject[],
  desktopPositions: BlockPositions,
  spacingMultiplier: number = 1.0
): BlockPositions {
  if (!nodes.length || !Object.keys(desktopPositions).length) {
    return {};
  }

  const MOBILE_SPACING = Math.round(20 * spacingMultiplier); // Fixed spacing with multiplier
  const MOBILE_WIDTH = 375;

  // Sort nodes by desktop Y position to maintain reading order
  const sortedNodes = nodes
    .filter(node => desktopPositions[node.id])
    .sort((a, b) => desktopPositions[a.id].y - desktopPositions[b.id].y);

  const mobilePositions: BlockPositions = {};
  let currentY = 0;

  sortedNodes.forEach((node, index) => {
    const desktopPos = desktopPositions[node.id];

    mobilePositions[node.id] = {
      id: node.id,
      x: 0,
      y: currentY,
      width: MOBILE_WIDTH,
      height: desktopPos.height, // Preserve original height
    };

    // Add spacing for next block (except last one)
    if (index < sortedNodes.length - 1) {
      currentY += desktopPos.height + MOBILE_SPACING;
    } else {
      currentY += desktopPos.height;
    }
  });

  return mobilePositions;
}