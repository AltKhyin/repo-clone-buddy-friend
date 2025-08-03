// ABOUTME: Centralized typography command system for consistent mark application across components

import type { Editor } from '@tiptap/react';
import { FONT_FAMILIES, FONT_WEIGHTS, TEXT_TRANSFORMS, TYPOGRAPHY_CONSTRAINTS } from './typography-system';

/**
 * Typography property types for type safety
 */
export interface TypographyProperties {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textColor?: string;
  backgroundColor?: string;
  textTransform?: string;
  letterSpacing?: string | number;
}

/**
 * Typography command result for feedback
 */
export interface TypographyCommandResult {
  success: boolean;
  appliedProperties: Partial<TypographyProperties>;
  errors: string[];
}

/**
 * Centralized typography command system
 * Provides a clean interface for applying typography marks with validation
 */
export class TypographyCommands {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  /**
   * Apply multiple typography properties at once
   */
  applyProperties(properties: Partial<TypographyProperties>): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: true,
      appliedProperties: {},
      errors: [],
    };

    // Apply each property and track results
    Object.entries(properties).forEach(([key, value]) => {
      try {
        const propertyResult = this.applySingleProperty(key as keyof TypographyProperties, value);
        if (propertyResult.success) {
          result.appliedProperties[key as keyof TypographyProperties] = value;
        } else {
          result.errors.push(...propertyResult.errors);
          result.success = false;
        }
      } catch (error) {
        result.errors.push(`Failed to apply ${key}: ${error}`);
        result.success = false;
      }
    });

    return result;
  }

  /**
   * Apply a single typography property with validation
   */
  private applySingleProperty(property: keyof TypographyProperties, value: any): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    if (!this.editor) {
      result.errors.push('Editor not available');
      return result;
    }

    // Handle null/undefined/empty values as "unset" commands
    if (value === null || value === undefined || value === '') {
      return this.unsetProperty(property);
    }

    try {
      switch (property) {
        case 'fontFamily':
          return this.setFontFamily(value);
        case 'fontSize':
          return this.setFontSize(value);
        case 'fontWeight':
          return this.setFontWeight(value);
        case 'textColor':
          return this.setTextColor(value);
        case 'backgroundColor':
          return this.setBackgroundColor(value);
        case 'textTransform':
          return this.setTextTransform(value);
        case 'letterSpacing':
          return this.setLetterSpacing(value);
        default:
          result.errors.push(`Unknown typography property: ${property}`);
          return result;
      }
    } catch (error) {
      result.errors.push(`Error applying ${property}: ${error}`);
      return result;
    }
  }

  /**
   * Set font family with validation
   */
  setFontFamily(fontFamily: string): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    // Validate against allowed font families
    const isValidFont = FONT_FAMILIES.some(font => font.value === fontFamily) || fontFamily === 'inherit';
    if (!isValidFont) {
      result.errors.push(`Invalid font family: ${fontFamily}`);
      return result;
    }

    try {
      const success = this.editor.commands.setFontFamily(fontFamily);
      if (success) {
        result.success = true;
        result.appliedProperties.fontFamily = fontFamily;
      } else {
        result.errors.push('Failed to apply font family command');
      }
    } catch (error) {
      result.errors.push(`Font family command error: ${error}`);
    }

    return result;
  }

  /**
   * Set font size with validation and constraints
   */
  setFontSize(fontSize: number): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    const numericSize = Number(fontSize);
    if (isNaN(numericSize)) {
      result.errors.push(`Invalid font size: ${fontSize}`);
      return result;
    }

    // Apply constraints
    const constrainedSize = Math.max(
      TYPOGRAPHY_CONSTRAINTS.fontSize.min,
      Math.min(TYPOGRAPHY_CONSTRAINTS.fontSize.max, numericSize)
    );

    if (constrainedSize !== numericSize) {
      console.info(`Font size constrained from ${numericSize}px to ${constrainedSize}px`);
    }

    try {
      const success = this.editor.commands.setFontSize(constrainedSize);
      if (success) {
        result.success = true;
        result.appliedProperties.fontSize = constrainedSize;
      } else {
        result.errors.push('Failed to apply font size command');
      }
    } catch (error) {
      result.errors.push(`Font size command error: ${error}`);
    }

    return result;
  }

  /**
   * Set font weight with validation
   */
  setFontWeight(fontWeight: number): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    const numericWeight = Number(fontWeight);
    if (isNaN(numericWeight)) {
      result.errors.push(`Invalid font weight: ${fontWeight}`);
      return result;
    }

    // Validate against allowed weights
    const validWeights = FONT_WEIGHTS.map(w => w.value);
    if (!validWeights.includes(numericWeight)) {
      result.errors.push(`Invalid font weight: ${fontWeight}. Valid weights: ${validWeights.join(', ')}`);
      return result;
    }

    try {
      const success = this.editor.commands.setFontWeight(numericWeight);
      if (success) {
        result.success = true;
        result.appliedProperties.fontWeight = numericWeight;
      } else {
        result.errors.push('Failed to apply font weight command');
      }
    } catch (error) {
      result.errors.push(`Font weight command error: ${error}`);
    }

    return result;
  }

  /**
   * Set text color with validation
   */
  setTextColor(color: string): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    // Basic color validation
    const trimmedColor = String(color).trim();
    const isValidColor = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|\w+)/.test(trimmedColor);
    
    if (!isValidColor) {
      result.errors.push(`Invalid color format: ${trimmedColor}`);
      return result;
    }

    try {
      const success = this.editor.commands.setTextColor(trimmedColor);
      if (success) {
        result.success = true;
        result.appliedProperties.textColor = trimmedColor;
      } else {
        result.errors.push('Failed to apply text color command');
      }
    } catch (error) {
      result.errors.push(`Text color command error: ${error}`);
    }

    return result;
  }

  /**
   * Set background color with validation
   */
  setBackgroundColor(color: string): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    // Basic color validation
    const trimmedColor = String(color).trim();
    const isValidColor = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|\w+)/.test(trimmedColor);
    
    if (!isValidColor) {
      result.errors.push(`Invalid background color format: ${trimmedColor}`);
      return result;
    }

    try {
      const success = this.editor.commands.setBackgroundColor(trimmedColor);
      if (success) {
        result.success = true;
        result.appliedProperties.backgroundColor = trimmedColor;
      } else {
        result.errors.push('Failed to apply background color command');
      }
    } catch (error) {
      result.errors.push(`Background color command error: ${error}`);
    }

    return result;
  }

  /**
   * Set text transform with validation
   */
  setTextTransform(transform: string): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    // Validate against allowed transforms
    const validTransforms = TEXT_TRANSFORMS.map(t => t.value);
    const trimmedTransform = String(transform).trim().toLowerCase();
    
    if (!validTransforms.includes(trimmedTransform)) {
      result.errors.push(`Invalid text transform: ${transform}. Valid transforms: ${validTransforms.join(', ')}`);
      return result;
    }

    // Handle 'none' as unset
    if (trimmedTransform === 'none') {
      return this.unsetProperty('textTransform');
    }

    try {
      const success = this.editor.commands.setTextTransform(trimmedTransform);
      if (success) {
        result.success = true;
        result.appliedProperties.textTransform = trimmedTransform;
      } else {
        result.errors.push('Failed to apply text transform command');
      }
    } catch (error) {
      result.errors.push(`Text transform command error: ${error}`);
    }

    return result;
  }

  /**
   * Set letter spacing with validation
   */
  setLetterSpacing(spacing: string | number): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    try {
      const success = this.editor.commands.setLetterSpacing(spacing);
      if (success) {
        result.success = true;
        result.appliedProperties.letterSpacing = spacing;
      } else {
        result.errors.push('Failed to apply letter spacing command');
      }
    } catch (error) {
      result.errors.push(`Letter spacing command error: ${error}`);
    }

    return result;
  }

  /**
   * Unset a typography property
   */
  unsetProperty(property: keyof TypographyProperties): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    if (!this.editor) {
      result.errors.push('Editor not available');
      return result;
    }

    try {
      let success = false;
      
      switch (property) {
        case 'fontFamily':
          success = this.editor.commands.unsetFontFamily();
          break;
        case 'fontSize':
          success = this.editor.commands.unsetFontSize();
          break;
        case 'fontWeight':
          success = this.editor.commands.unsetFontWeight();
          break;
        case 'textColor':
          success = this.editor.commands.unsetTextColor();
          break;
        case 'backgroundColor':
          success = this.editor.commands.unsetBackgroundColor();
          break;
        case 'textTransform':
          success = this.editor.commands.unsetTextTransform();
          break;
        case 'letterSpacing':
          success = this.editor.commands.unsetLetterSpacing();
          break;
        default:
          result.errors.push(`Cannot unset unknown property: ${property}`);
          return result;
      }

      if (success) {
        result.success = true;
        // Mark property as undefined to indicate it was unset
        result.appliedProperties[property] = undefined as any;
      } else {
        result.errors.push(`Failed to unset ${property}`);
      }
    } catch (error) {
      result.errors.push(`Error unsetting ${property}: ${error}`);
    }

    return result;
  }

  /**
   * Get current typography attributes from the editor
   */
  getCurrentAttributes(): TypographyProperties {
    if (!this.editor) return {};

    try {
      return {
        fontFamily: this.editor.getAttributes('fontFamily').fontFamily,
        fontSize: this.editor.getAttributes('fontSize').fontSize,
        fontWeight: this.editor.getAttributes('fontWeight').fontWeight,
        textColor: this.editor.getAttributes('textColor').color,
        backgroundColor: this.editor.getAttributes('backgroundColor').backgroundColor,
        textTransform: this.editor.getAttributes('textTransform').textTransform,
        letterSpacing: this.editor.getAttributes('letterSpacing').letterSpacing,
      };
    } catch (error) {
      console.warn('Failed to get current typography attributes:', error);
      return {};
    }
  }

  /**
   * Check which typography marks are currently active
   */
  getActiveMarks(): Record<keyof TypographyProperties, boolean> {
    if (!this.editor) {
      return {
        fontFamily: false,
        fontSize: false,
        fontWeight: false,
        textColor: false,
        backgroundColor: false,
        textTransform: false,
        letterSpacing: false,
      };
    }

    try {
      return {
        fontFamily: this.editor.isActive('fontFamily'),
        fontSize: this.editor.isActive('fontSize'),
        fontWeight: this.editor.isActive('fontWeight'),
        textColor: this.editor.isActive('textColor'),
        backgroundColor: this.editor.isActive('backgroundColor'),
        textTransform: this.editor.isActive('textTransform'),
        letterSpacing: this.editor.isActive('letterSpacing'),
      };
    } catch (error) {
      console.warn('Failed to get active typography marks:', error);
      return {
        fontFamily: false,
        fontSize: false,
        fontWeight: false,
        textColor: false,
        backgroundColor: false,
        textTransform: false,
        letterSpacing: false,
      };
    }
  }

  /**
   * Toggle shortcuts for common formatting
   */
  toggleBold(): TypographyCommandResult {
    const currentWeight = this.editor.getAttributes('fontWeight').fontWeight;
    const isBold = currentWeight === 700;
    
    if (isBold) {
      return this.unsetProperty('fontWeight');
    } else {
      return this.setFontWeight(700);
    }
  }

  /**
   * Toggle highlight with default yellow color
   */
  toggleHighlight(): TypographyCommandResult {
    const currentBackground = this.editor.getAttributes('backgroundColor').backgroundColor;
    const isHighlighted = Boolean(currentBackground);
    
    if (isHighlighted) {
      return this.unsetProperty('backgroundColor');
    } else {
      return this.setBackgroundColor('#ffeb3b');
    }
  }
}

/**
 * Factory function to create typography commands for an editor
 */
export function createTypographyCommands(editor: Editor): TypographyCommands {
  return new TypographyCommands(editor);
}

/**
 * Utility function to apply typography properties with error handling
 */
export function applyTypographyProperties(
  editor: Editor,
  properties: Partial<TypographyProperties>,
  onError?: (errors: string[]) => void
): boolean {
  const commands = createTypographyCommands(editor);
  const result = commands.applyProperties(properties);
  
  if (!result.success && onError) {
    onError(result.errors);
  }
  
  return result.success;
}