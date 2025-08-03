// ABOUTME: Unit tests for the centralized typography command system ensuring proper mark application and validation

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

// Import the command system
import {
  TypographyCommands,
  createTypographyCommands,
  type TypographyProperties,
  type TypographyCommandResult,
} from '../typography-commands';

describe('Typography Commands System', () => {
  let editor: Editor;
  let typographyCommands: TypographyCommands;

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
      content: '<p>Test content for typography commands</p>',
    });

    typographyCommands = new TypographyCommands(editor);
  });

  describe('TypographyCommands Class', () => {
    describe('Constructor', () => {
      it('should create instance with editor', () => {
        expect(typographyCommands).toBeInstanceOf(TypographyCommands);
        expect(typographyCommands['editor']).toBe(editor);
      });
    });

    describe('applyProperties Method', () => {
      beforeEach(() => {
        editor.commands.selectAll();
      });

      it('should apply single property successfully', () => {
        const properties: Partial<TypographyProperties> = {
          fontFamily: 'Arial',
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(true);
        expect(result.appliedProperties).toEqual({ fontFamily: 'Arial' });
        expect(result.errors).toHaveLength(0);

        const marks = editor.getAttributes('fontFamily');
        expect(marks.fontFamily).toBe('Arial');
      });

      it('should apply multiple properties successfully', () => {
        const properties: Partial<TypographyProperties> = {
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 700,
          textColor: '#ff0000',
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(true);
        expect(result.appliedProperties).toEqual(properties);
        expect(result.errors).toHaveLength(0);

        // Verify all properties were applied
        expect(editor.getAttributes('fontFamily').fontFamily).toBe('Arial');
        expect(editor.getAttributes('fontSize').fontSize).toBe(18);
        expect(editor.getAttributes('fontWeight').fontWeight).toBe(700);
        expect(editor.getAttributes('textColor').textColor).toBe('#ff0000');
      });

      it('should handle partial success with some invalid properties', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const properties: Partial<TypographyProperties> = {
          fontFamily: 'Arial', // Valid
          fontSize: 5, // Invalid (below minimum)
          textColor: '#ff0000', // Valid
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(false); // Overall failure due to invalid fontSize
        expect(result.appliedProperties).toEqual({
          fontFamily: 'Arial',
          textColor: '#ff0000',
        });
        expect(result.errors).toContain('fontSize: Invalid font size: 5. Must be between 8 and 128.');

        // Valid properties should still be applied
        expect(editor.getAttributes('fontFamily').fontFamily).toBe('Arial');
        expect(editor.getAttributes('textColor').textColor).toBe('#ff0000');
        expect(editor.getAttributes('fontSize').fontSize).toBeUndefined();

        consoleSpy.mockRestore();
      });

      it('should handle empty properties object', () => {
        const result = typographyCommands.applyProperties({});

        expect(result.success).toBe(true);
        expect(result.appliedProperties).toEqual({});
        expect(result.errors).toHaveLength(0);
      });

      it('should validate fontFamily property', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const properties: Partial<TypographyProperties> = {
          fontFamily: 'InvalidFont',
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(false);
        expect(result.appliedProperties).toEqual({});
        expect(result.errors).toContain('fontFamily: Invalid font family: InvalidFont');

        consoleSpy.mockRestore();
      });

      it('should validate fontSize property', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const properties: Partial<TypographyProperties> = {
          fontSize: 200, // Above maximum
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('fontSize: Invalid font size: 200. Must be between 8 and 128.');

        consoleSpy.mockRestore();
      });

      it('should validate fontWeight property', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const properties: Partial<TypographyProperties> = {
          fontWeight: 450, // Not a standard weight
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('fontWeight: Invalid font weight: 450. Must be one of: 100, 200, 300, 400, 500, 600, 700, 800, 900.');

        consoleSpy.mockRestore();
      });

      it('should validate textTransform property', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const properties: Partial<TypographyProperties> = {
          textTransform: 'invalid',
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('textTransform: Invalid text transform: invalid');

        consoleSpy.mockRestore();
      });

      it('should validate letterSpacing property', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const properties: Partial<TypographyProperties> = {
          letterSpacing: 5, // Above maximum
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('letterSpacing: Invalid letter spacing: 5. Must be between -2 and 4.');

        consoleSpy.mockRestore();
      });

      it('should handle textColor and backgroundColor without validation', () => {
        const properties: Partial<TypographyProperties> = {
          textColor: '#ff0000',
          backgroundColor: 'yellow',
        };

        const result = typographyCommands.applyProperties(properties);

        expect(result.success).toBe(true);
        expect(result.appliedProperties).toEqual(properties);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('unsetProperty Method', () => {
      beforeEach(() => {
        editor.commands.selectAll();
        // Apply some properties first
        typographyCommands.applyProperties({
          fontFamily: 'Arial',
          fontSize: 18,
          textColor: '#ff0000',
        });
      });

      it('should unset single property', () => {
        const result = typographyCommands.unsetProperty('fontFamily');

        expect(result.success).toBe(true);
        expect(result.appliedProperties).toEqual({});
        expect(result.errors).toHaveLength(0);

        expect(editor.getAttributes('fontFamily').fontFamily).toBeUndefined();
        // Other properties should remain
        expect(editor.getAttributes('fontSize').fontSize).toBe(18);
        expect(editor.getAttributes('textColor').textColor).toBe('#ff0000');
      });

      it('should handle unsetting non-existent property', () => {
        const result = typographyCommands.unsetProperty('fontWeight'); // Not previously set

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should unset all supported properties', () => {
        const properties: (keyof TypographyProperties)[] = [
          'fontFamily',
          'fontSize',
          'fontWeight',
          'textColor',
          'backgroundColor',
          'textTransform',
          'letterSpacing',
        ];

        properties.forEach(property => {
          const result = typographyCommands.unsetProperty(property);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('getCurrentAttributes Method', () => {
      it('should return current typography attributes', () => {
        editor.commands.selectAll();
        typographyCommands.applyProperties({
          fontFamily: 'Arial',
          fontSize: 18,
          textColor: '#ff0000',
        });

        const attributes = typographyCommands.getCurrentAttributes();

        expect(attributes.fontFamily).toBe('Arial');
        expect(attributes.fontSize).toBe(18);
        expect(attributes.textColor).toBe('#ff0000');
        expect(attributes.fontWeight).toBeUndefined();
      });

      it('should return empty attributes when none are set', () => {
        editor.commands.selectAll();

        const attributes = typographyCommands.getCurrentAttributes();

        expect(attributes.fontFamily).toBeUndefined();
        expect(attributes.fontSize).toBeUndefined();
        expect(attributes.fontWeight).toBeUndefined();
        expect(attributes.textColor).toBeUndefined();
        expect(attributes.backgroundColor).toBeUndefined();
        expect(attributes.textTransform).toBeUndefined();
        expect(attributes.letterSpacing).toBeUndefined();
      });

      it('should handle partial selection attributes', () => {
        // Apply different formatting to different parts
        editor.commands.setTextSelection({ from: 1, to: 5 });
        typographyCommands.applyProperties({ fontFamily: 'Arial' });

        editor.commands.setTextSelection({ from: 5, to: 10 });
        typographyCommands.applyProperties({ fontFamily: 'Georgia' });

        // Select overlapping area
        editor.commands.setTextSelection({ from: 3, to: 8 });
        const attributes = typographyCommands.getCurrentAttributes();

        // Should handle mixed attributes appropriately
        expect(typeof attributes.fontFamily).toBe('string');
      });
    });

    describe('hasActiveMarks Method', () => {
      it('should return true when marks are active', () => {
        editor.commands.selectAll();
        typographyCommands.applyProperties({
          fontFamily: 'Arial',
          fontSize: 18,
        });

        expect(typographyCommands.hasActiveMarks()).toBe(true);
      });

      it('should return false when no marks are active', () => {
        editor.commands.selectAll();

        expect(typographyCommands.hasActiveMarks()).toBe(false);
      });

      it('should detect specific mark types', () => {
        editor.commands.selectAll();
        typographyCommands.applyProperties({ fontFamily: 'Arial' });

        expect(typographyCommands.hasActiveMarks(['fontFamily'])).toBe(true);
        expect(typographyCommands.hasActiveMarks(['fontSize'])).toBe(false);
        expect(typographyCommands.hasActiveMarks(['fontFamily', 'fontSize'])).toBe(true);
      });
    });

    describe('clearAllMarks Method', () => {
      it('should clear all typography marks', () => {
        editor.commands.selectAll();
        typographyCommands.applyProperties({
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 700,
          textColor: '#ff0000',
          backgroundColor: '#ffff00',
          textTransform: 'uppercase',
          letterSpacing: 1,
        });

        const result = typographyCommands.clearAllMarks();

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);

        // All attributes should be undefined
        const attributes = typographyCommands.getCurrentAttributes();
        expect(attributes.fontFamily).toBeUndefined();
        expect(attributes.fontSize).toBeUndefined();
        expect(attributes.fontWeight).toBeUndefined();
        expect(attributes.textColor).toBeUndefined();
        expect(attributes.backgroundColor).toBeUndefined();
        expect(attributes.textTransform).toBeUndefined();
        expect(attributes.letterSpacing).toBeUndefined();
      });

      it('should handle clearing when no marks are present', () => {
        editor.commands.selectAll();

        const result = typographyCommands.clearAllMarks();

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('createTypographyCommands Factory Function', () => {
    it('should create TypographyCommands instance', () => {
      const commands = createTypographyCommands(editor);

      expect(commands).toBeInstanceOf(TypographyCommands);
      expect(commands['editor']).toBe(editor);
    });

    it('should create independent instances', () => {
      const commands1 = createTypographyCommands(editor);
      const commands2 = createTypographyCommands(editor);

      expect(commands1).not.toBe(commands2);
      expect(commands1).toBeInstanceOf(TypographyCommands);
      expect(commands2).toBeInstanceOf(TypographyCommands);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid editor state', () => {
      // Create editor without typography extensions
      const basicEditor = new Editor({
        extensions: [Document, Paragraph, Text],
        content: '<p>Test</p>',
      });

      const commands = new TypographyCommands(basicEditor);
      basicEditor.commands.selectAll();

      const result = commands.applyProperties({ fontFamily: 'Arial' });

      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle rapid successive property changes', () => {
      editor.commands.selectAll();

      // Apply multiple changes rapidly
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(typographyCommands.applyProperties({
          fontSize: 12 + i,
          fontWeight: 400 + (i % 5) * 100,
        }));
      }

      // Last change should be applied
      const attributes = typographyCommands.getCurrentAttributes();
      expect(attributes.fontSize).toBe(21); // 12 + 9
      expect(attributes.fontWeight).toBe(800); // 400 + (9 % 5) * 100 = 400 + 4 * 100
    });

    it('should handle malformed property values', () => {
      editor.commands.selectAll();

      const result = typographyCommands.applyProperties({
        fontSize: 'invalid' as any,
        fontWeight: '700px' as any,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle editor without selection', () => {
      editor.commands.blur();

      const result = typographyCommands.applyProperties({ fontFamily: 'Arial' });

      // Should not throw error
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Performance', () => {
    it('should handle large property objects efficiently', () => {
      const startTime = performance.now();

      editor.commands.selectAll();

      // Apply many property changes
      for (let i = 0; i < 100; i++) {
        typographyCommands.applyProperties({
          fontSize: 12 + (i % 20),
          fontWeight: 400 + (i % 5) * 100,
          textColor: `#${(i * 1000).toString(16).padStart(6, '0').slice(0, 6)}`,
        });
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should efficiently get current attributes repeatedly', () => {
      editor.commands.selectAll();
      typographyCommands.applyProperties({
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
      });

      const startTime = performance.now();

      // Get attributes many times
      for (let i = 0; i < 1000; i++) {
        typographyCommands.getCurrentAttributes();
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Integration with Mark Extensions', () => {
    it('should work correctly with all mark extensions', () => {
      editor.commands.selectAll();

      const properties: TypographyProperties = {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        textColor: '#ff0000',
        backgroundColor: '#ffff00',
        textTransform: 'uppercase',
        letterSpacing: 1,
      };

      const result = typographyCommands.applyProperties(properties);

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toEqual(properties);

      // Verify HTML output contains all styling
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-size: 18px');
      expect(html).toContain('font-weight: 700');
      expect(html).toContain('color: #ff0000');
      expect(html).toContain('background-color: #ffff00');
      expect(html).toContain('text-transform: uppercase');
      expect(html).toContain('letter-spacing: 1px');
    });

    it('should maintain consistency with direct mark commands', () => {
      editor.commands.selectAll();

      // Apply via typography commands
      typographyCommands.applyProperties({ fontFamily: 'Arial', fontSize: 18 });

      // Apply additional marks directly
      editor.commands.setTextColor('#ff0000');
      editor.commands.setFontWeight(700);

      const attributes = typographyCommands.getCurrentAttributes();
      expect(attributes.fontFamily).toBe('Arial');
      expect(attributes.fontSize).toBe(18);
      expect(attributes.textColor).toBe('#ff0000');
      expect(attributes.fontWeight).toBe(700);
    });
  });
});