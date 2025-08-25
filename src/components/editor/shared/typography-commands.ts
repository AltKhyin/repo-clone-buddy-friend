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
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  backgroundColor?: string;
  textTransform?: string;
  letterSpacing?: string | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  textDecoration?: string;
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
          // Prefix error messages with property name for better debugging
          const prefixedErrors = propertyResult.errors.map(error => `${key}: ${error}`);
          result.errors.push(...prefixedErrors);
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
        case 'fontStyle':
          return this.setFontStyle(value);
        case 'textColor':
          return this.setTextColor(value);
        case 'backgroundColor':
          return this.setBackgroundColor(value);
        case 'textTransform':
          return this.setTextTransform(value);
        case 'letterSpacing':
          return this.setLetterSpacing(value);
        case 'textAlign':
          return this.setTextAlign(value);
        case 'lineHeight':
          return this.setLineHeight(value);
        case 'textDecoration':
          return this.setTextDecoration(value);
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

    // Validate constraints (fail if outside bounds rather than constraining)
    if (numericSize < TYPOGRAPHY_CONSTRAINTS.fontSize.min || numericSize > TYPOGRAPHY_CONSTRAINTS.fontSize.max) {
      result.errors.push(`Invalid font size: ${fontSize}. Must be between ${TYPOGRAPHY_CONSTRAINTS.fontSize.min} and ${TYPOGRAPHY_CONSTRAINTS.fontSize.max}.`);
      return result;
    }

    const constrainedSize = numericSize; // No automatic constraining

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
      result.errors.push(`Invalid font weight: ${fontWeight}. Must be one of: ${validWeights.join(', ')}.`);
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
   * Set font style (italic/normal) with validation
   */
  setFontStyle(fontStyle: 'normal' | 'italic'): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    if (fontStyle !== 'normal' && fontStyle !== 'italic') {
      result.errors.push(`Invalid font style: ${fontStyle}. Valid styles: normal, italic`);
      return result;
    }

    try {
      // Use TipTap's toggleItalic command for better editor integration
      const success = fontStyle === 'italic' 
        ? this.editor.commands.toggleItalic()
        : this.editor.commands.unsetItalic?.() || this.editor.commands.toggleItalic();
        
      if (success) {
        result.success = true;
        result.appliedProperties.fontStyle = fontStyle;
      } else {
        result.errors.push('Failed to apply font style command');
      }
    } catch (error) {
      result.errors.push(`Font style command error: ${error}`);
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

    // Basic color validation - allow any non-empty string (CSS can handle validation)
    const trimmedColor = String(color).trim();
    if (!trimmedColor) {
      result.errors.push(`Invalid color format: empty color value`);
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

    // Basic color validation - allow any non-empty string (CSS can handle validation)
    const trimmedColor = String(color).trim();
    if (!trimmedColor) {
      result.errors.push(`Invalid background color format: empty color value`);
      return result;
    }

    try {
      // Use BackgroundColorMark's setBackgroundColor command
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
      result.errors.push(`Invalid text transform: ${transform}`);
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

    // Validate letter spacing value
    const numericSpacing = Number(spacing);
    if (isNaN(numericSpacing)) {
      result.errors.push(`Invalid letter spacing: ${spacing}. Must be a number.`);
      return result;
    }

    // Apply constraints
    if (numericSpacing < TYPOGRAPHY_CONSTRAINTS.letterSpacing.min || numericSpacing > TYPOGRAPHY_CONSTRAINTS.letterSpacing.max) {
      result.errors.push(`Invalid letter spacing: ${spacing}. Must be between ${TYPOGRAPHY_CONSTRAINTS.letterSpacing.min} and ${TYPOGRAPHY_CONSTRAINTS.letterSpacing.max}.`);
      return result;
    }

    try {
      const success = this.editor.commands.setLetterSpacing(numericSpacing);
      if (success) {
        result.success = true;
        result.appliedProperties.letterSpacing = numericSpacing;
      } else {
        result.errors.push('Failed to apply letter spacing command');
      }
    } catch (error) {
      result.errors.push(`Letter spacing command error: ${error}`);
    }

    return result;
  }

  /**
   * Set text alignment with validation
   * Uses node-based approach to apply alignment to block elements
   */
  setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify'): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    // Validate alignment value
    const validAlignments = ['left', 'center', 'right', 'justify'];
    if (!alignment || typeof alignment !== 'string') {
      result.errors.push(`Invalid text alignment: ${alignment}`);
      return result;
    }

    const trimmedAlignment = alignment.trim().toLowerCase();
    if (!validAlignments.includes(trimmedAlignment)) {
      result.errors.push(`Invalid text alignment: ${alignment}. Valid alignments: ${validAlignments.join(', ')}`);
      return result;
    }

    try {
      // Use node-based text alignment command which targets block elements
      const success = this.editor.commands.setTextAlign(trimmedAlignment as 'left' | 'center' | 'right' | 'justify');
      if (success) {
        result.success = true;
        result.appliedProperties.textAlign = trimmedAlignment as 'left' | 'center' | 'right' | 'justify';
      } else {
        result.errors.push('Failed to apply text alignment command to block elements');
      }
    } catch (error) {
      result.errors.push(`Text alignment command error: ${error}`);
    }

    return result;
  }

  /**
   * Set line height with validation
   */
  setLineHeight(lineHeight: number): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    const numericLineHeight = Number(lineHeight);
    if (isNaN(numericLineHeight)) {
      result.errors.push(`Invalid line height: ${lineHeight}`);
      return result;
    }

    // Clean precision errors by rounding to 1 decimal place
    const cleanLineHeight = Math.round(numericLineHeight * 10) / 10;

    // Validate line height constraints (typical range 0.5-3.0)
    if (cleanLineHeight < 0.5 || cleanLineHeight > 3.0) {
      result.errors.push(`Invalid line height: ${cleanLineHeight}. Must be between 0.5 and 3.0.`);
      return result;
    }

    try {
      // 🎯 ENHANCED DEBUG: Log line height command execution with selection context
      console.log('[Typography Commands] 🚀 EXECUTING setLineHeight:', {
        originalValue: lineHeight,
        cleanedValue: cleanLineHeight,
        editorExists: Boolean(this.editor),
        hasSelection: Boolean(this.editor?.state?.selection),
        selectionEmpty: this.editor?.state?.selection?.empty,
        currentMarks: this.editor?.state?.selection ? this.editor?.getAttributes('textStyle') : null
      });

      // 🎯 EXPLICIT MARK CREATION: Create mark with explicit attribute structure
      const markAttrs = { lineHeight: cleanLineHeight };
      console.log('[Typography Commands] 📝 Creating textStyle mark with attributes:', markAttrs);
      
      // Use our EnhancedTextStyle extension for proper lineHeight handling
      const success = this.editor.commands.setMark('textStyle', markAttrs);
      
      // 🎯 IMMEDIATE VERIFICATION: Check if mark was created correctly
      const immediateMarks = this.editor?.getAttributes('textStyle');
      const markCreatedCorrectly = immediateMarks?.lineHeight === cleanLineHeight;
      
      console.log('[Typography Commands] 🔍 IMMEDIATE MARK VERIFICATION:', {
        commandSuccess: success,
        intendedAttrs: markAttrs,
        retrievedMarks: immediateMarks,
        markCreatedCorrectly,
        attrsType: typeof immediateMarks,
        attrsStructure: immediateMarks ? Object.keys(immediateMarks) : 'null/undefined',
        lineHeightMatch: immediateMarks?.lineHeight === cleanLineHeight
      });

      // 🎯 ENHANCED ERROR DETECTION: Identify specific failure types
      if (success && !markCreatedCorrectly) {
        const errorMsg = 'Mark command succeeded but lineHeight attribute not properly set';
        result.errors.push(errorMsg);
        result.success = false;
        
        console.error('[Typography Commands] 🚨 MARK CREATION FAILURE:', {
          issue: 'Command succeeded but mark not properly created',
          intendedLineHeight: cleanLineHeight,
          actualMarks: immediateMarks,
          possibleCause: immediateMarks === null ? 'textStyle mark not created' : 'lineHeight attribute missing',
          markAttrs,
          editorState: {
            hasSelection: Boolean(this.editor?.state?.selection),
            selectionEmpty: this.editor?.state?.selection?.empty,
            documentSize: this.editor?.state?.doc?.content?.size
          }
        });
        
        return result;
      }

      // 🎯 SELECTION CONTEXT VERIFICATION: Ensure mark applies to current selection
      const currentSelection = this.editor?.state?.selection;
      if (currentSelection && !currentSelection.empty) {
        const doc = this.editor?.state?.doc;
        const from = currentSelection.from;
        const to = currentSelection.to;
        const selectedText = doc?.textBetween(from, to);
        
        console.log('[Typography Commands] 🎯 SELECTION CONTEXT VERIFICATION:', {
          selectionRange: { from, to },
          selectedText: selectedText?.substring(0, 50) + (selectedText && selectedText.length > 50 ? '...' : ''),
          selectionLength: selectedText?.length,
          marksInSelection: this.editor?.getAttributes('textStyle'),
          markAppliedToSelection: Boolean(selectedText && selectedText.length > 0)
        });
      }

      if (success && markCreatedCorrectly) {
        result.success = true;
        result.appliedProperties.lineHeight = cleanLineHeight;
        
        console.log('[Typography Commands] ✅ setLineHeight SUCCESS:', {
          cleanLineHeight,
          finalMarks: immediateMarks,
          resultSuccess: true
        });
        
        // 🎯 DELAYED VERIFICATION: Double-check persistence after editor update cycle
        setTimeout(() => {
          const delayedVerificationMarks = this.editor?.getAttributes('textStyle');
          const persistedCorrectly = delayedVerificationMarks?.lineHeight === cleanLineHeight;
          
          console.log('[Typography Commands] ⏰ DELAYED VERIFICATION (100ms):', {
            marksAfterDelay: delayedVerificationMarks,
            persistedCorrectly,
            lineHeightValue: delayedVerificationMarks?.lineHeight,
            originalValue: cleanLineHeight,
            matchesOriginal: delayedVerificationMarks?.lineHeight === cleanLineHeight
          });
          
          if (!persistedCorrectly) {
            console.error('[Typography Commands] 🚨 PERSISTENCE FAILURE:', {
              issue: 'Mark was created but did not persist through editor update cycle',
              originalLineHeight: cleanLineHeight,
              persistedMarks: delayedVerificationMarks,
              persistenceFailure: true
            });
          }
        }, 100);
        
      } else {
        result.errors.push('Failed to apply line height command');
        result.success = false;
        
        console.error('[Typography Commands] ❌ setLineHeight COMMAND FAILED:', {
          commandSuccess: success,
          markCreatedCorrectly,
          cleanLineHeight,
          editorState: this.editor?.state ? 'exists' : 'missing',
          selection: this.editor?.state?.selection,
          currentMarks: immediateMarks
        });
      }
    } catch (error) {
      result.errors.push(`Line height command error: ${error}`);
      result.success = false;
      
      console.error('[Typography Commands] 💥 setLineHeight EXCEPTION:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cleanLineHeight,
        editorExists: Boolean(this.editor),
        editorState: this.editor?.state ? 'exists' : 'missing'
      });
    }

    return result;
  }

  /**
   * Set text decoration with validation
   */
  setTextDecoration(textDecoration: string): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: false,
      appliedProperties: {},
      errors: [],
    };

    // Validate text decoration
    const validDecorations = ['none', 'underline', 'overline', 'line-through', 'underline overline'];
    if (!textDecoration || typeof textDecoration !== 'string') {
      result.errors.push(`Invalid text decoration: ${textDecoration}`);
      return result;
    }

    const trimmedDecoration = textDecoration.trim();
    if (!validDecorations.includes(trimmedDecoration)) {
      result.errors.push(`Invalid text decoration: ${textDecoration}. Valid decorations: ${validDecorations.join(', ')}`);
      return result;
    }

    try {
      // Use TipTap's TextStyle extension for text decoration
      const success = this.editor.commands.setMark('textStyle', { textDecoration: trimmedDecoration });
      if (success) {
        result.success = true;
        result.appliedProperties.textDecoration = trimmedDecoration;
      } else {
        result.errors.push('Failed to apply text decoration command');
      }
    } catch (error) {
      result.errors.push(`Text decoration command error: ${error}`);
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
        case 'textAlign':
          success = this.editor.commands.unsetTextAlign();
          break;
        case 'lineHeight':
          success = this.editor.commands.unsetMark('textStyle');
          break;
        case 'textDecoration':
          success = this.editor.commands.unsetMark('textStyle');
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
      // Get text alignment from current block node (paragraph/heading)
      const { selection } = this.editor.state;
      const currentNode = selection.$anchor.parent;
      const textAlign = currentNode?.attrs?.textAlign || null;

      return {
        fontFamily: this.editor.getAttributes('fontFamily').fontFamily,
        fontSize: this.editor.getAttributes('fontSize').fontSize,
        fontWeight: this.editor.getAttributes('fontWeight').fontWeight,
        textColor: this.editor.getAttributes('textColor').color || this.editor.getAttributes('textColor').textColor, // Handle both attribute names
        backgroundColor: this.editor.getAttributes('backgroundColor').backgroundColor,
        textTransform: this.editor.getAttributes('textTransform').textTransform,
        letterSpacing: this.editor.getAttributes('letterSpacing').letterSpacing,
        textAlign: textAlign,
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
        textAlign: false,
      };
    }

    try {
      // Check text alignment from current block node
      const { selection } = this.editor.state;
      const currentNode = selection.$anchor.parent;
      const hasTextAlign = Boolean(currentNode?.attrs?.textAlign);

      return {
        fontFamily: this.editor.isActive('fontFamily'),
        fontSize: this.editor.isActive('fontSize'),
        fontWeight: this.editor.isActive('fontWeight'),
        textColor: this.editor.isActive('textColor'),
        backgroundColor: this.editor.isActive('backgroundColor'),
        textTransform: this.editor.isActive('textTransform'),
        letterSpacing: this.editor.isActive('letterSpacing'),
        textAlign: hasTextAlign,
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
        textAlign: false,
      };
    }
  }

  /**
   * Check if typography marks are currently active
   * @param marks Optional array of specific marks to check. If not provided, returns true if ANY marks are active
   */
  hasActiveMarks(marks?: (keyof TypographyProperties)[]): boolean {
    const activeMarks = this.getActiveMarks();
    
    if (!marks) {
      // Return true if ANY typography marks are active
      return Object.values(activeMarks).some(isActive => isActive);
    }
    
    // Return true if ANY of the specified marks are active
    return marks.some(mark => activeMarks[mark]);
  }

  /**
   * Clear all typography marks from the current selection
   */
  clearAllMarks(): TypographyCommandResult {
    const result: TypographyCommandResult = {
      success: true,
      appliedProperties: {},
      errors: [],
    };

    if (!this.editor) {
      result.errors.push('Editor not available');
      result.success = false;
      return result;
    }

    try {
      const properties: (keyof TypographyProperties)[] = [
        'fontFamily',
        'fontSize', 
        'fontWeight',
        'textColor',
        'backgroundColor',
        'textTransform',
        'letterSpacing',
      ];

      let hasErrors = false;
      
      properties.forEach(property => {
        const unsetResult = this.unsetProperty(property);
        if (!unsetResult.success) {
          result.errors.push(...unsetResult.errors);
          hasErrors = true;
        } else {
          result.appliedProperties[property] = undefined as any;
        }
      });

      result.success = !hasErrors;
    } catch (error) {
      result.errors.push(`Error clearing typography marks: ${error}`);
      result.success = false;
    }

    return result;
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