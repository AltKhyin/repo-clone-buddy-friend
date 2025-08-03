// ABOUTME: Unit tests for typography migration utilities ensuring proper conversion from block-level to selection-based typography

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

// Import typography marks
import { FontFamilyMark } from '../../extensions/marks/FontFamilyMark';
import { FontSizeMark } from '../../extensions/marks/FontSizeMark';
import { FontWeightMark } from '../../extensions/marks/FontWeightMark';
import { TextColorMark } from '../../extensions/marks/TextColorMark';
import { BackgroundColorMark } from '../../extensions/marks/BackgroundColorMark';
import { TextTransformMark } from '../../extensions/marks/TextTransformMark';
import { LetterSpacingMark } from '../../extensions/marks/LetterSpacingMark';

// Import migration utilities
import {
  TypographyMigration,
  createTypographyMigration,
  batchMigrateBlocks,
  validateMigrationData,
  type BlockTypographyData,
  type MigrationResult,
  type MigrationPreview,
} from '../typography-migration';

describe('Typography Migration System', () => {
  let editor: Editor;
  let migration: TypographyMigration;

  beforeEach(() => {
    editor = new Editor({
      extensions: [
        Document,
        Paragraph,
        Text,
        FontFamilyMark,
        FontSizeMark,
        FontWeightMark,
        TextColorMark,
        BackgroundColorMark,
        TextTransformMark,
        LetterSpacingMark,
      ],
      content: '<p>Test content for migration</p>',
    });

    migration = new TypographyMigration(editor);
  });

  describe('TypographyMigration Class', () => {
    describe('Constructor', () => {
      it('should create instance with editor', () => {
        expect(migration).toBeInstanceOf(TypographyMigration);
        expect(migration['editor']).toBe(editor);
      });
    });

    describe('migrateBlockTypographyToMarks Method', () => {
      it('should migrate basic typography properties', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 700,
          color: '#ff0000',
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(true);
        expect(result.migratedProperties).toEqual(['fontFamily', 'fontSize', 'fontWeight', 'color']);
        expect(result.appliedMarksCount).toBe(4);
        expect(result.errors).toHaveLength(0);

        // Verify marks were applied
        const attributes = editor.getAttributes('fontFamily');
        expect(attributes.fontFamily).toBe('Arial');
      });

      it('should handle all supported properties', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Georgia',
          fontSize: 20,
          fontWeight: 600,
          color: '#0000ff',
          backgroundColor: '#ffff00',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(true);
        expect(result.migratedProperties).toHaveLength(7);
        expect(result.appliedMarksCount).toBe(7);

        // Verify all properties were migrated
        expect(editor.getAttributes('fontFamily').fontFamily).toBe('Georgia');
        expect(editor.getAttributes('fontSize').fontSize).toBe(20);
        expect(editor.getAttributes('fontWeight').fontWeight).toBe(600);
        expect(editor.getAttributes('textColor').textColor).toBe('#0000ff');
        expect(editor.getAttributes('backgroundColor').backgroundColor).toBe('#ffff00');
        expect(editor.getAttributes('textTransform').textTransform).toBe('uppercase');
        expect(editor.getAttributes('letterSpacing').letterSpacing).toBe(1.5);
      });

      it('should handle partial block data', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
          fontSize: 16,
          // Other properties undefined
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(true);
        expect(result.migratedProperties).toEqual(['fontFamily', 'fontSize']);
        expect(result.appliedMarksCount).toBe(2);
      });

      it('should handle empty block data', () => {
        const blockData: BlockTypographyData = {};

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(true);
        expect(result.migratedProperties).toHaveLength(0);
        expect(result.appliedMarksCount).toBe(0);
        expect(result.skippedProperties).toHaveLength(0);
      });

      it('should handle invalid properties', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const blockData: BlockTypographyData = {
          fontFamily: 'InvalidFont',
          fontSize: 5, // Below minimum
          fontWeight: 450, // Not standard
          color: '#ff0000', // Valid
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(false); // Overall failure due to invalid properties
        expect(result.migratedProperties).toEqual(['color']); // Only valid property
        expect(result.skippedProperties).toContain('fontFamily');
        expect(result.skippedProperties).toContain('fontSize');
        expect(result.skippedProperties).toContain('fontWeight');
        expect(result.errors.length).toBeGreaterThan(0);

        consoleSpy.mockRestore();
      });

      it('should handle unsupported legacy properties', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
          textAlign: 'center', // Node-level property, not mark
          lineHeight: 1.5, // Node-level property, not mark
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(true);
        expect(result.migratedProperties).toEqual(['fontFamily']);
        expect(result.skippedProperties).toContain('textAlign');
        expect(result.skippedProperties).toContain('lineHeight');
        expect(result.warnings).toContain('textAlign is a node-level property and cannot be migrated to marks');
        expect(result.warnings).toContain('lineHeight is a node-level property and cannot be migrated to marks');
      });
    });

    describe('previewMigration Method', () => {
      it('should preview migration without applying changes', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
          fontSize: 18,
          color: '#ff0000',
        };

        const preview = migration.previewMigration(blockData);

        expect(preview.willMigrate).toEqual(['fontFamily', 'fontSize', 'color']);
        expect(preview.willSkip).toHaveLength(0);
        expect(preview.willError).toHaveLength(0);
        expect(preview.estimatedMarksCount).toBe(3);

        // Verify no changes were actually applied
        const attributes = editor.getAttributes('fontFamily');
        expect(attributes.fontFamily).toBeUndefined();
      });

      it('should preview with validation errors', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'InvalidFont',
          fontSize: 5,
          color: '#ff0000',
        };

        const preview = migration.previewMigration(blockData);

        expect(preview.willMigrate).toEqual(['color']);
        expect(preview.willError).toContain('fontFamily');
        expect(preview.willError).toContain('fontSize');
        expect(preview.estimatedMarksCount).toBe(1);
        expect(preview.hasIssues).toBe(true);
      });

      it('should preview unsupported properties', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
          textAlign: 'center',
          lineHeight: 1.5,
        };

        const preview = migration.previewMigration(blockData);

        expect(preview.willMigrate).toEqual(['fontFamily']);
        expect(preview.willSkip).toContain('textAlign');
        expect(preview.willSkip).toContain('lineHeight');
        expect(preview.estimatedMarksCount).toBe(1);
      });
    });

    describe('validateMigrationData Method', () => {
      it('should validate correct migration data', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 700,
        };

        const validation = migration.validateMigrationData(blockData);

        expect(validation.isValid).toBe(true);
        expect(validation.validProperties).toEqual(['fontFamily', 'fontSize', 'fontWeight']);
        expect(validation.invalidProperties).toHaveLength(0);
        expect(validation.errors).toHaveLength(0);
      });

      it('should identify invalid properties', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'InvalidFont',
          fontSize: 200, // Above maximum
          fontWeight: 450, // Not standard
          color: '#ff0000', // Valid
        };

        const validation = migration.validateMigrationData(blockData);

        expect(validation.isValid).toBe(false);
        expect(validation.validProperties).toEqual(['color']);
        expect(validation.invalidProperties).toContain('fontFamily');
        expect(validation.invalidProperties).toContain('fontSize');
        expect(validation.invalidProperties).toContain('fontWeight');
        expect(validation.errors.length).toBeGreaterThan(0);
      });

      it('should handle empty data', () => {
        const validation = migration.validateMigrationData({});

        expect(validation.isValid).toBe(true);
        expect(validation.validProperties).toHaveLength(0);
        expect(validation.invalidProperties).toHaveLength(0);
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle null/undefined values', () => {
        const blockData: BlockTypographyData = {
          fontFamily: undefined,
          fontSize: null as any,
          color: '#ff0000',
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(true);
        expect(result.migratedProperties).toEqual(['color']);
        expect(result.appliedMarksCount).toBe(1);
      });

      it('should handle non-string/non-number values', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 123 as any,
          fontSize: 'invalid' as any,
          color: true as any,
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        expect(result.success).toBe(false);
        expect(result.migratedProperties).toHaveLength(0);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle editor without selection', () => {
        editor.commands.blur();

        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
        };

        const result = migration.migrateBlockTypographyToMarks(blockData);

        // Should handle gracefully
        expect(typeof result.success).toBe('boolean');
      });
    });
  });

  describe('Factory Functions', () => {
    describe('createTypographyMigration', () => {
      it('should create TypographyMigration instance', () => {
        const newMigration = createTypographyMigration(editor);

        expect(newMigration).toBeInstanceOf(TypographyMigration);
        expect(newMigration['editor']).toBe(editor);
      });

      it('should create independent instances', () => {
        const migration1 = createTypographyMigration(editor);
        const migration2 = createTypographyMigration(editor);

        expect(migration1).not.toBe(migration2);
      });
    });

    describe('validateMigrationData', () => {
      it('should validate migration data independently', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'Arial',
          fontSize: 18,
        };

        const validation = validateMigrationData(blockData);

        expect(validation.isValid).toBe(true);
        expect(validation.validProperties).toEqual(['fontFamily', 'fontSize']);
      });

      it('should identify validation errors', () => {
        const blockData: BlockTypographyData = {
          fontFamily: 'InvalidFont',
          fontSize: 5,
        };

        const validation = validateMigrationData(blockData);

        expect(validation.isValid).toBe(false);
        expect(validation.invalidProperties).toContain('fontFamily');
        expect(validation.invalidProperties).toContain('fontSize');
      });
    });
  });

  describe('Batch Migration', () => {
    describe('batchMigrateBlocks', () => {
      it('should migrate multiple blocks successfully', () => {
        const editor1 = new Editor({
          extensions: [Document, Paragraph, Text, FontFamilyMark, FontSizeMark],
          content: '<p>Block 1</p>',
        });

        const editor2 = new Editor({
          extensions: [Document, Paragraph, Text, FontFamilyMark, FontSizeMark],
          content: '<p>Block 2</p>',
        });

        const blocks = [
          {
            editor: editor1,
            data: { fontFamily: 'Arial', fontSize: 16 },
            blockId: 'block1',
          },
          {
            editor: editor2,
            data: { fontFamily: 'Georgia', fontSize: 18 },
            blockId: 'block2',
          },
        ];

        let progressCalls = 0;
        const results = batchMigrateBlocks(blocks, (current, total, blockId) => {
          progressCalls++;
          expect(current).toBeGreaterThan(0);
          expect(total).toBe(2);
          expect(['block1', 'block2']).toContain(blockId);
        });

        expect(results).toHaveLength(2);
        expect(progressCalls).toBe(2);

        // Verify both blocks were migrated
        results.forEach((result, index) => {
          expect(result.blockId).toBe(blocks[index].blockId);
          expect(result.result.success).toBe(true);
          expect(result.result.appliedMarksCount).toBeGreaterThan(0);
        });
      });

      it('should handle migration failures gracefully', () => {
        const editor1 = new Editor({
          extensions: [Document, Paragraph, Text, FontFamilyMark],
          content: '<p>Block 1</p>',
        });

        const blocks = [
          {
            editor: editor1,
            data: { fontFamily: 'InvalidFont' },
            blockId: 'block1',
          },
        ];

        const results = batchMigrateBlocks(blocks);

        expect(results).toHaveLength(1);
        expect(results[0].result.success).toBe(false);
        expect(results[0].result.errors.length).toBeGreaterThan(0);
      });

      it('should handle empty block list', () => {
        const results = batchMigrateBlocks([]);

        expect(results).toHaveLength(0);
      });

      it('should track progress correctly', () => {
        const editors = Array.from({ length: 5 }, (_, i) => 
          new Editor({
            extensions: [Document, Paragraph, Text, FontFamilyMark],
            content: `<p>Block ${i}</p>`,
          })
        );

        const blocks = editors.map((editor, i) => ({
          editor,
          data: { fontFamily: 'Arial' },
          blockId: `block${i}`,
        }));

        const progressUpdates: Array<{ current: number; total: number; blockId: string }> = [];

        batchMigrateBlocks(blocks, (current, total, blockId) => {
          progressUpdates.push({ current, total, blockId });
        });

        expect(progressUpdates).toHaveLength(5);
        expect(progressUpdates[0].current).toBe(1);
        expect(progressUpdates[4].current).toBe(5);
        expect(progressUpdates.every(p => p.total === 5)).toBe(true);
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large migration data efficiently', () => {
      const startTime = performance.now();

      const largeBlockData: BlockTypographyData = {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        color: '#ff0000',
        backgroundColor: '#ffff00',
        textTransform: 'uppercase',
        letterSpacing: 1,
      };

      // Perform multiple migrations
      for (let i = 0; i < 100; i++) {
        migration.migrateBlockTypographyToMarks(largeBlockData);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle batch migration of many blocks efficiently', () => {
      const startTime = performance.now();

      const blocks = Array.from({ length: 50 }, (_, i) => ({
        editor: new Editor({
          extensions: [Document, Paragraph, Text, FontFamilyMark, FontSizeMark],
          content: `<p>Block ${i}</p>`,
        }),
        data: { fontFamily: 'Arial', fontSize: 12 + (i % 10) },
        blockId: `block${i}`,
      }));

      batchMigrateBlocks(blocks);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('Integration with Typography Commands', () => {
    it('should work correctly with typography command system', () => {
      const blockData: BlockTypographyData = {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
      };

      const result = migration.migrateBlockTypographyToMarks(blockData);

      expect(result.success).toBe(true);

      // Verify the migrated content can be read by typography commands
      const typographyCommands = editor.extensionManager.extensions
        .find(ext => ext.name === 'fontFamily')?.config.addCommands();

      expect(typographyCommands).toBeDefined();
    });

    it('should maintain consistency with manual mark application', () => {
      // Migrate via migration system
      const blockData: BlockTypographyData = {
        fontFamily: 'Arial',
        fontSize: 18,
      };

      migration.migrateBlockTypographyToMarks(blockData);

      // Apply additional marks manually
      editor.commands.setTextColor('#ff0000');

      // Should work together harmoniously
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-size: 18px');
      expect(html).toContain('color: #ff0000');
    });
  });
});