// ABOUTME: Migration utilities for converting block-level typography data to selection-based marks

import type { Editor } from '@tiptap/react';
import { FONT_FAMILIES, FONT_WEIGHTS, TEXT_TRANSFORMS } from './typography-system';

/**
 * Block typography data structure (legacy)
 */
export interface BlockTypographyData {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: string;
  textTransform?: string;
  lineHeight?: number;
  letterSpacing?: string | number;
}

/**
 * Migration result with detailed information
 */
export interface MigrationResult {
  success: boolean;
  migratedProperties: string[];
  skippedProperties: string[];
  errors: string[];
  appliedMarksCount: number;
}

/**
 * Typography migration utilities
 */
export class TypographyMigration {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  /**
   * Migrate block typography data to TipTap marks for entire document content
   */
  migrateBlockTypographyToMarks(blockData: BlockTypographyData): MigrationResult {
    const result: MigrationResult = {
      success: true,
      migratedProperties: [],
      skippedProperties: [],
      errors: [],
      appliedMarksCount: 0,
    };

    if (!this.editor) {
      result.success = false;
      result.errors.push('Editor not available');
      return result;
    }

    try {
      // Select all content in the editor
      this.editor.commands.selectAll();

      // Migrate each typography property
      this.migrateProperty('fontFamily', blockData.fontFamily, result);
      this.migrateProperty('fontSize', blockData.fontSize, result);
      this.migrateProperty('fontWeight', blockData.fontWeight, result);
      this.migrateProperty('textColor', blockData.color, result);
      this.migrateProperty('backgroundColor', blockData.backgroundColor, result);
      this.migrateProperty('textTransform', blockData.textTransform, result);
      this.migrateProperty('letterSpacing', blockData.letterSpacing, result);

      // Handle special cases that don't have direct mark equivalents
      this.handleSpecialProperties(blockData, result);

      // Clear selection after migration
      if (this.editor.state.selection.from !== this.editor.state.selection.to) {
        this.editor.commands.setTextSelection(this.editor.state.selection.to);
      }

      result.appliedMarksCount = result.migratedProperties.length;

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
    }

    return result;
  }

  /**
   * Migrate specific typography property
   */
  private migrateProperty(
    propertyName: keyof BlockTypographyData,
    value: any,
    result: MigrationResult
  ): void {
    if (value === undefined || value === null || value === '') {
      return;
    }

    try {
      let migrated = false;

      switch (propertyName) {
        case 'fontFamily':
          if (this.validateFontFamily(value)) {
            migrated = this.editor.commands.setFontFamily(value);
          } else {
            result.errors.push(`Invalid font family: ${value}`);
          }
          break;

        case 'fontSize':
          if (this.validateFontSize(value)) {
            migrated = this.editor.commands.setFontSize(Number(value));
          } else {
            result.errors.push(`Invalid font size: ${value}`);
          }
          break;

        case 'fontWeight':
          if (this.validateFontWeight(value)) {
            migrated = this.editor.commands.setFontWeight(Number(value));
          } else {
            result.errors.push(`Invalid font weight: ${value}`);
          }
          break;

        case 'color':
          if (this.validateColor(value)) {
            migrated = this.editor.commands.setTextColor(value);
          } else {
            result.errors.push(`Invalid text color: ${value}`);
          }
          break;

        case 'backgroundColor':
          if (this.validateColor(value)) {
            migrated = this.editor.commands.setBackgroundColor(value);
          } else {
            result.errors.push(`Invalid background color: ${value}`);
          }
          break;

        case 'textTransform':
          if (this.validateTextTransform(value)) {
            migrated = this.editor.commands.setTextTransform(value);
          } else {
            result.errors.push(`Invalid text transform: ${value}`);
          }
          break;

        case 'letterSpacing':
          migrated = this.editor.commands.setLetterSpacing(value);
          break;

        default:
          result.skippedProperties.push(propertyName);
          return;
      }

      if (migrated) {
        result.migratedProperties.push(propertyName);
      } else {
        result.errors.push(`Failed to apply ${propertyName}: ${value}`);
      }

    } catch (error) {
      result.errors.push(`Error migrating ${propertyName}: ${error}`);
    }
  }

  /**
   * Handle properties that don't have direct mark equivalents
   */
  private handleSpecialProperties(blockData: BlockTypographyData, result: MigrationResult): void {
    // Font style (italic) - handle through built-in TipTap commands
    if (blockData.fontStyle === 'italic') {
      try {
        if (this.editor.commands.toggleItalic()) {
          result.migratedProperties.push('fontStyle');
        }
      } catch (error) {
        result.errors.push(`Failed to apply italic: ${error}`);
      }
    }

    // Text decoration - handle through built-in TipTap commands
    if (blockData.textDecoration) {
      try {
        if (blockData.textDecoration.includes('underline')) {
          this.editor.commands.toggleUnderline?.();
          result.migratedProperties.push('textDecoration');
        }
        if (blockData.textDecoration.includes('line-through')) {
          this.editor.commands.toggleStrike();
          result.migratedProperties.push('textDecoration');
        }
      } catch (error) {
        result.errors.push(`Failed to apply text decoration: ${error}`);
      }
    }

    // Text alignment and line height are typically node-level properties
    // These will be handled differently or skipped for now
    if (blockData.textAlign) {
      result.skippedProperties.push('textAlign');
    }
    if (blockData.lineHeight) {
      result.skippedProperties.push('lineHeight');
    }
  }

  /**
   * Validation methods
   */
  private validateFontFamily(fontFamily: string): boolean {
    return FONT_FAMILIES.some(font => font.value === fontFamily) || fontFamily === 'inherit';
  }

  private validateFontSize(fontSize: number): boolean {
    const size = Number(fontSize);
    return !isNaN(size) && size >= 8 && size <= 128;
  }

  private validateFontWeight(fontWeight: number): boolean {
    const weight = Number(fontWeight);
    return FONT_WEIGHTS.some(w => w.value === weight);
  }

  private validateColor(color: string): boolean {
    return /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|\w+)/.test(color.trim());
  }

  private validateTextTransform(transform: string): boolean {
    return TEXT_TRANSFORMS.some(t => t.value === transform.toLowerCase());
  }

  /**
   * Create a preview of what would be migrated without actually applying changes
   */
  previewMigration(blockData: BlockTypographyData): {
    willMigrate: string[];
    willSkip: string[];
    warnings: string[];
  } {
    const preview = {
      willMigrate: [] as string[],
      willSkip: [] as string[],
      warnings: [] as string[],
    };

    Object.entries(blockData).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      const propertyName = key as keyof BlockTypographyData;

      switch (propertyName) {
        case 'fontFamily':
          if (this.validateFontFamily(value)) {
            preview.willMigrate.push(propertyName);
          } else {
            preview.warnings.push(`Invalid font family: ${value}`);
            preview.willSkip.push(propertyName);
          }
          break;

        case 'fontSize':
          if (this.validateFontSize(value)) {
            preview.willMigrate.push(propertyName);
          } else {
            preview.warnings.push(`Invalid font size: ${value}`);
            preview.willSkip.push(propertyName);
          }
          break;

        case 'fontWeight':
          if (this.validateFontWeight(value)) {
            preview.willMigrate.push(propertyName);
          } else {
            preview.warnings.push(`Invalid font weight: ${value}`);
            preview.willSkip.push(propertyName);
          }
          break;

        case 'color':
        case 'backgroundColor':
          if (this.validateColor(value)) {
            preview.willMigrate.push(propertyName);
          } else {
            preview.warnings.push(`Invalid color: ${value}`);
            preview.willSkip.push(propertyName);
          }
          break;

        case 'textTransform':
          if (this.validateTextTransform(value)) {
            preview.willMigrate.push(propertyName);
          } else {
            preview.warnings.push(`Invalid text transform: ${value}`);
            preview.willSkip.push(propertyName);
          }
          break;

        case 'letterSpacing':
          preview.willMigrate.push(propertyName);
          break;

        case 'fontStyle':
        case 'textDecoration':
          preview.willMigrate.push(propertyName);
          break;

        case 'textAlign':
        case 'lineHeight':
          preview.willSkip.push(propertyName);
          preview.warnings.push(`${propertyName} is a node-level property and cannot be migrated to marks`);
          break;

        default:
          preview.willSkip.push(propertyName);
      }
    });

    return preview;
  }

  /**
   * Clear all typography marks from the current selection
   */
  clearAllTypographyMarks(): MigrationResult {
    const result: MigrationResult = {
      success: true,
      migratedProperties: [],
      skippedProperties: [],
      errors: [],
      appliedMarksCount: 0,
    };

    if (!this.editor) {
      result.success = false;
      result.errors.push('Editor not available');
      return result;
    }

    try {
      const marksToClear = [
        'fontFamily',
        'fontSize', 
        'fontWeight',
        'textColor',
        'backgroundColor',
        'textTransform',
        'letterSpacing',
        'bold',
        'italic',
        'underline',
        'strike'
      ];

      marksToClear.forEach(markName => {
        try {
          switch (markName) {
            case 'fontFamily':
              this.editor.commands.unsetFontFamily();
              break;
            case 'fontSize':
              this.editor.commands.unsetFontSize();
              break;
            case 'fontWeight':
              this.editor.commands.unsetFontWeight();
              break;
            case 'textColor':
              this.editor.commands.unsetTextColor();
              break;
            case 'backgroundColor':
              this.editor.commands.unsetBackgroundColor();
              break;
            case 'textTransform':
              this.editor.commands.unsetTextTransform();
              break;
            case 'letterSpacing':
              this.editor.commands.unsetLetterSpacing();
              break;
            case 'bold':
              if (this.editor.isActive('bold')) {
                this.editor.commands.toggleBold();
              }
              break;
            case 'italic':
              if (this.editor.isActive('italic')) {
                this.editor.commands.toggleItalic();
              }
              break;
            case 'underline':
              if (this.editor.isActive('underline')) {
                this.editor.commands.toggleUnderline?.();
              }
              break;
            case 'strike':
              if (this.editor.isActive('strike')) {
                this.editor.commands.toggleStrike();
              }
              break;
          }
          result.migratedProperties.push(markName);
        } catch (error) {
          result.errors.push(`Failed to clear ${markName}: ${error}`);
        }
      });

      result.appliedMarksCount = result.migratedProperties.length;

    } catch (error) {
      result.success = false;
      result.errors.push(`Clear operation failed: ${error}`);
    }

    return result;
  }
}

/**
 * Factory function to create migration utilities
 */
export function createTypographyMigration(editor: Editor): TypographyMigration {
  return new TypographyMigration(editor);
}

/**
 * Utility function to migrate block data with error handling
 */
export function migrateBlockTypography(
  editor: Editor,
  blockData: BlockTypographyData,
  onSuccess?: (result: MigrationResult) => void,
  onError?: (errors: string[]) => void
): boolean {
  const migration = createTypographyMigration(editor);
  const result = migration.migrateBlockTypographyToMarks(blockData);
  
  if (result.success) {
    onSuccess?.(result);
  } else {
    onError?.(result.errors);
  }
  
  return result.success;
}

/**
 * Batch migration for multiple blocks
 */
export function batchMigrateBlocks(
  blocks: Array<{ editor: Editor; data: BlockTypographyData; blockId: string }>,
  onProgress?: (current: number, total: number, blockId: string) => void
): Array<{ blockId: string; result: MigrationResult }> {
  const results: Array<{ blockId: string; result: MigrationResult }> = [];

  blocks.forEach((block, index) => {
    onProgress?.(index + 1, blocks.length, block.blockId);
    
    const migration = createTypographyMigration(block.editor);
    const result = migration.migrateBlockTypographyToMarks(block.data);
    
    results.push({
      blockId: block.blockId,
      result,
    });
  });

  return results;
}