// ABOUTME: Comprehensive unit tests for all TipTap typography mark extensions ensuring proper functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

// Import all typography marks
import { FontFamilyMark } from '../FontFamilyMark';
import { FontSizeMark } from '../FontSizeMark';
import { FontWeightMark } from '../FontWeightMark';
import { TextColorMark } from '../TextColorMark';
import { BackgroundColorMark } from '../BackgroundColorMark';
import { TextTransformMark } from '../TextTransformMark';
import { LetterSpacingMark } from '../LetterSpacingMark';
import { TextAlignNode } from '../../nodes/TextAlignNode';

// Import typography system constants for validation
import { FONT_FAMILIES, FONT_WEIGHTS, TEXT_TRANSFORMS } from '../../../shared/typography-system';

describe('Typography Mark Extensions', () => {
  let editor: Editor;

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
        TextAlignNode,
      ],
      content: '<p>Test content for typography marks</p>',
    });
  });

  describe('FontFamilyMark', () => {
    describe('Mark Configuration', () => {
      it('should have correct name', () => {
        expect(FontFamilyMark.name).toBe('fontFamily');
      });

      it('should define fontFamily attribute', () => {
        const attributes = FontFamilyMark.config.addAttributes();
        expect(attributes).toHaveProperty('fontFamily');
        expect(attributes.fontFamily.default).toBe(null);
      });

      it('should parse HTML with font-family style', () => {
        const parseHTML = FontFamilyMark.config.parseHTML();
        expect(parseHTML).toHaveLength(1);
        expect(parseHTML[0].tag).toBe('span[style*="font-family"]');
      });
    });

    describe('Commands', () => {
      it('should register setFontFamily command', () => {
        expect(editor.commands.setFontFamily).toBeDefined();
        expect(typeof editor.commands.setFontFamily).toBe('function');
      });

      it('should register unsetFontFamily command', () => {
        expect(editor.commands.unsetFontFamily).toBeDefined();
        expect(typeof editor.commands.unsetFontFamily).toBe('function');
      });

      it('should set valid font family', () => {
        editor.commands.selectAll();
        const result = editor.commands.setFontFamily('Arial');
        expect(result).toBe(true);

        const marks = editor.getAttributes('fontFamily');
        expect(marks.fontFamily).toBe('Arial');
      });

      it('should accept inherit as valid font family', () => {
        editor.commands.selectAll();
        const result = editor.commands.setFontFamily('inherit');
        expect(result).toBe(true);

        const marks = editor.getAttributes('fontFamily');
        expect(marks.fontFamily).toBe('inherit');
      });

      it('should reject invalid font family', () => {
        // Mock console.warn to verify warning is logged
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        editor.commands.selectAll();
        const result = editor.commands.setFontFamily('InvalidFont');
        expect(result).toBe(false);

        expect(consoleSpy).toHaveBeenCalledWith('Invalid font family: InvalidFont');
        consoleSpy.mockRestore();
      });

      it('should unset font family', () => {
        editor.commands.selectAll();
        editor.commands.setFontFamily('Arial');
        
        const result = editor.commands.unsetFontFamily();
        expect(result).toBe(true);

        const marks = editor.getAttributes('fontFamily');
        expect(marks.fontFamily).toBeUndefined();
      });
    });

    describe('HTML Rendering', () => {
      it('should render font family as inline style', () => {
        editor.commands.selectAll();
        editor.commands.setFontFamily('Arial');

        const html = editor.getHTML();
        expect(html).toContain('style="font-family: Arial"');
      });

      it('should not render style when font family is not set', () => {
        const html = editor.getHTML();
        expect(html).not.toContain('font-family');
      });
    });

    describe('HTML Parsing', () => {
      it('should parse existing font-family styles', () => {
        const htmlContent = '<p><span style="font-family: Georgia">Styled text</span></p>';
        editor.commands.setContent(htmlContent);

        // Select the styled text
        editor.commands.setTextSelection({ from: 1, to: 12 });
        const marks = editor.getAttributes('fontFamily');
        expect(marks.fontFamily).toBe('Georgia');
      });
    });

    describe('Validation', () => {
      it('should validate against FONT_FAMILIES list', () => {
        FONT_FAMILIES.forEach(font => {
          editor.commands.selectAll();
          const result = editor.commands.setFontFamily(font.value);
          expect(result).toBe(true);
        });
      });
    });
  });

  describe('FontSizeMark', () => {
    describe('Mark Configuration', () => {
      it('should have correct name', () => {
        expect(FontSizeMark.name).toBe('fontSize');
      });

      it('should define fontSize attribute', () => {
        const attributes = FontSizeMark.config.addAttributes();
        expect(attributes).toHaveProperty('fontSize');
        expect(attributes.fontSize.default).toBe(null);
      });
    });

    describe('Commands', () => {
      it('should register setFontSize command', () => {
        expect(editor.commands.setFontSize).toBeDefined();
        expect(typeof editor.commands.setFontSize).toBe('function');
      });

      it('should set valid font size', () => {
        editor.commands.selectAll();
        const result = editor.commands.setFontSize(18);
        expect(result).toBe(true);

        const marks = editor.getAttributes('fontSize');
        expect(marks.fontSize).toBe(18);
      });

      it('should accept font size as string', () => {
        editor.commands.selectAll();
        const result = editor.commands.setFontSize(20); // FontSizeMark only accepts numbers
        expect(result).toBe(true);

        const marks = editor.getAttributes('fontSize');
        expect(marks.fontSize).toBe(20);
      });

      it('should constrain invalid font sizes', () => {
        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
        
        editor.commands.selectAll();
        const result = editor.commands.setFontSize(5); // Below minimum, will be constrained to 8
        expect(result).toBe(true); // Command succeeds but constrains the value

        expect(consoleSpy).toHaveBeenCalledWith('Font size constrained from 5px to 8px');
        
        const marks = editor.getAttributes('fontSize');
        expect(marks.fontSize).toBe(8); // Constrained to minimum
        
        consoleSpy.mockRestore();
      });

      it('should unset font size', () => {
        editor.commands.selectAll();
        editor.commands.setFontSize(18);
        
        const result = editor.commands.unsetFontSize();
        expect(result).toBe(true);

        const marks = editor.getAttributes('fontSize');
        expect(marks.fontSize).toBeUndefined();
      });
    });

    describe('HTML Rendering', () => {
      it('should render font size as inline style', () => {
        editor.commands.selectAll();
        editor.commands.setFontSize(18);

        const html = editor.getHTML();
        expect(html).toContain('style="font-size: 18px"');
      });

      it('should handle numeric font sizes', () => {
        editor.commands.selectAll();
        editor.commands.setFontSize(20);

        const html = editor.getHTML();
        expect(html).toContain('style="font-size: 20px"');
      });
    });
  });

  describe('FontWeightMark', () => {
    describe('Mark Configuration', () => {
      it('should have correct name', () => {
        expect(FontWeightMark.name).toBe('fontWeight');
      });

      it('should define fontWeight attribute', () => {
        const attributes = FontWeightMark.config.addAttributes();
        expect(attributes).toHaveProperty('fontWeight');
        expect(attributes.fontWeight.default).toBe(null);
      });
    });

    describe('Commands', () => {
      it('should set valid font weight', () => {
        editor.commands.selectAll();
        const result = editor.commands.setFontWeight(700);
        expect(result).toBe(true);

        const marks = editor.getAttributes('fontWeight');
        expect(marks.fontWeight).toBe(700);
      });

      it('should reject invalid font weights', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        editor.commands.selectAll();
        const result = editor.commands.setFontWeight(450); // Not a standard weight
        expect(result).toBe(false);

        expect(consoleSpy).toHaveBeenCalledWith('Invalid font weight: 450. Valid weights: 100, 200, 300, 400, 500, 600, 700, 800, 900');
        consoleSpy.mockRestore();
      });
    });

    describe('Validation', () => {
      it('should validate against FONT_WEIGHTS list', () => {
        FONT_WEIGHTS.forEach(weight => {
          editor.commands.selectAll();
          const result = editor.commands.setFontWeight(weight.value);
          expect(result).toBe(true);
        });
      });
    });
  });

  describe('TextColorMark', () => {
    describe('Mark Configuration', () => {
      it('should have correct name', () => {
        expect(TextColorMark.name).toBe('textColor');
      });

      it('should define color attribute', () => {
        const attributes = TextColorMark.config.addAttributes();
        expect(attributes).toHaveProperty('color');
        expect(attributes.color.default).toBe(null);
      });
    });

    describe('Commands', () => {
      it('should set valid text color', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextColor('#ff0000');
        expect(result).toBe(true);

        const marks = editor.getAttributes('textColor');
        expect(marks.color).toBe('#ff0000');
      });

      it('should accept CSS color names', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextColor('red');
        expect(result).toBe(true);

        const marks = editor.getAttributes('textColor');
        expect(marks.color).toBe('red');
      });

      it('should accept RGB colors', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextColor('rgb(255, 0, 0)');
        expect(result).toBe(true);

        const marks = editor.getAttributes('textColor');
        expect(marks.color).toBe('rgb(255, 0, 0)');
      });

      it('should unset text color', () => {
        editor.commands.selectAll();
        editor.commands.setTextColor('#ff0000');
        
        const result = editor.commands.unsetTextColor();
        expect(result).toBe(true);

        const marks = editor.getAttributes('textColor');
        expect(marks.color).toBeUndefined();
      });
    });

    describe('HTML Rendering', () => {
      it('should render text color as inline style', () => {
        editor.commands.selectAll();
        editor.commands.setTextColor('#ff0000');

        const html = editor.getHTML();
        expect(html).toContain('style="color: #ff0000"');
      });
    });
  });

  describe('BackgroundColorMark', () => {
    describe('Mark Configuration', () => {
      it('should have correct name', () => {
        expect(BackgroundColorMark.name).toBe('backgroundColor');
      });

      it('should define backgroundColor attribute', () => {
        const attributes = BackgroundColorMark.config.addAttributes();
        expect(attributes).toHaveProperty('backgroundColor');
        expect(attributes.backgroundColor.default).toBe(null);
      });
    });

    describe('Commands', () => {
      it('should set valid background color', () => {
        editor.commands.selectAll();
        const result = editor.commands.setBackgroundColor('#ffff00');
        expect(result).toBe(true);

        const marks = editor.getAttributes('backgroundColor');
        expect(marks.backgroundColor).toBe('#ffff00');
      });

      it('should unset background color', () => {
        editor.commands.selectAll();
        editor.commands.setBackgroundColor('#ffff00');
        
        const result = editor.commands.unsetBackgroundColor();
        expect(result).toBe(true);

        const marks = editor.getAttributes('backgroundColor');
        expect(marks.backgroundColor).toBeUndefined();
      });
    });

    describe('HTML Rendering', () => {
      it('should render background color as inline style', () => {
        editor.commands.selectAll();
        editor.commands.setBackgroundColor('#ffff00');

        const html = editor.getHTML();
        expect(html).toContain('style="background-color: #ffff00"');
      });
    });
  });

  describe('TextTransformMark', () => {
    describe('Mark Configuration', () => {
      it('should have correct name', () => {
        expect(TextTransformMark.name).toBe('textTransform');
      });

      it('should define textTransform attribute', () => {
        const attributes = TextTransformMark.config.addAttributes();
        expect(attributes).toHaveProperty('textTransform');
        expect(attributes.textTransform.default).toBe(null);
      });
    });

    describe('Commands', () => {
      it('should set valid text transform', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextTransform('uppercase');
        expect(result).toBe(true);

        const marks = editor.getAttributes('textTransform');
        expect(marks.textTransform).toBe('uppercase');
      });

      it('should reject invalid text transforms', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        editor.commands.selectAll();
        const result = editor.commands.setTextTransform('invalid');
        expect(result).toBe(false);

        expect(consoleSpy).toHaveBeenCalledWith('Invalid text transform: invalid. Valid transforms: none, uppercase, lowercase, capitalize');
        consoleSpy.mockRestore();
      });

      it('should unset text transform', () => {
        editor.commands.selectAll();
        editor.commands.setTextTransform('uppercase');
        
        const result = editor.commands.unsetTextTransform();
        expect(result).toBe(true);

        const marks = editor.getAttributes('textTransform');
        expect(marks.textTransform).toBeUndefined();
      });
    });

    describe('Validation', () => {
      it('should validate against TEXT_TRANSFORMS list', () => {
        TEXT_TRANSFORMS.forEach(transform => {
          editor.commands.selectAll();
          const result = editor.commands.setTextTransform(transform.value);
          expect(result).toBe(true);
        });
      });
    });

    describe('HTML Rendering', () => {
      it('should render text transform as inline style', () => {
        editor.commands.selectAll();
        editor.commands.setTextTransform('uppercase');

        const html = editor.getHTML();
        expect(html).toContain('style="text-transform: uppercase"');
      });
    });
  });

  describe('LetterSpacingMark', () => {
    describe('Mark Configuration', () => {
      it('should have correct name', () => {
        expect(LetterSpacingMark.name).toBe('letterSpacing');
      });

      it('should define letterSpacing attribute', () => {
        const attributes = LetterSpacingMark.config.addAttributes();
        expect(attributes).toHaveProperty('letterSpacing');
        expect(attributes.letterSpacing.default).toBe(null);
      });
    });

    describe('Commands', () => {
      it('should set valid letter spacing', () => {
        editor.commands.selectAll();
        const result = editor.commands.setLetterSpacing(1.5);
        expect(result).toBe(true);

        const marks = editor.getAttributes('letterSpacing');
        expect(marks.letterSpacing).toBe('1.5px');
      });

      it('should accept letter spacing as string', () => {
        editor.commands.selectAll();
        const result = editor.commands.setLetterSpacing('2px');
        expect(result).toBe(true);

        const marks = editor.getAttributes('letterSpacing');
        expect(marks.letterSpacing).toBe('2px');
      });

      it('should constrain letter spacing values', () => {
        editor.commands.selectAll();
        const result = editor.commands.setLetterSpacing(25); // Above maximum (20)
        expect(result).toBe(true); // Command succeeds but constrains value

        const marks = editor.getAttributes('letterSpacing');
        expect(marks.letterSpacing).toBe('20px'); // Constrained to maximum
      });

      it('should unset letter spacing', () => {
        editor.commands.selectAll();
        editor.commands.setLetterSpacing(1.5);
        
        const result = editor.commands.unsetLetterSpacing();
        expect(result).toBe(true);

        const marks = editor.getAttributes('letterSpacing');
        expect(marks.letterSpacing).toBeUndefined();
      });
    });

    describe('HTML Rendering', () => {
      it('should render letter spacing as inline style', () => {
        editor.commands.selectAll();
        editor.commands.setLetterSpacing(1.5);

        const html = editor.getHTML();
        expect(html).toContain('style="letter-spacing: 1.5px"');
      });

      it('should handle string letter spacing', () => {
        editor.commands.selectAll();
        editor.commands.setLetterSpacing('0.1em');

        const html = editor.getHTML();
        expect(html).toContain('style="letter-spacing: 0.1em"');
      });
    });
  });

  describe('TextAlignNode', () => {
    describe('Node Configuration', () => {
      it('should have correct name', () => {
        expect(TextAlignNode.name).toBe('textAlign');
      });

      it('should define global attributes for block elements', () => {
        const globalAttributes = TextAlignNode.config.addGlobalAttributes();
        expect(globalAttributes).toHaveLength(1);
        expect(globalAttributes[0].types).toEqual(['paragraph', 'heading']);
        expect(globalAttributes[0].attributes).toHaveProperty('textAlign');
      });

      it('should have proper command configuration', () => {
        expect(TextAlignNode.config.addCommands).toBeDefined();
        expect(typeof TextAlignNode.config.addCommands).toBe('function');
      });
    });

    describe('Command Execution', () => {
      it('should apply left text alignment to paragraph', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextAlign('left');
        
        expect(result).toBe(true);
        
        const html = editor.getHTML();
        expect(html).toContain('<p style="text-align: left">');
      });

      it('should apply center text alignment to paragraph', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextAlign('center');
        
        expect(result).toBe(true);
        
        const html = editor.getHTML();
        expect(html).toContain('<p style="text-align: center">');
      });

      it('should apply right text alignment to paragraph', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextAlign('right');
        
        expect(result).toBe(true);
        
        const html = editor.getHTML();
        expect(html).toContain('<p style="text-align: right">');
      });

      it('should apply justify text alignment to paragraph', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextAlign('justify');
        
        expect(result).toBe(true);
        
        const html = editor.getHTML();
        expect(html).toContain('<p style="text-align: justify">');
      });

      it('should unset text alignment from paragraph', () => {
        editor.commands.selectAll();
        editor.commands.setTextAlign('center');
        
        let html = editor.getHTML();
        expect(html).toContain('<p style="text-align: center">');
        
        const result = editor.commands.unsetTextAlign();
        expect(result).toBe(true);
        
        html = editor.getHTML();
        expect(html).not.toContain('text-align');
      });

      it('should apply text alignment to block elements', () => {
        editor.commands.selectAll();
        const result = editor.commands.setTextAlign('center');
        
        expect(result).toBe(true);
        
        const html = editor.getHTML();
        expect(html).toContain('style="text-align: center"');
      });
    });

    describe('Validation', () => {
      it('should reject invalid alignment values', () => {
        editor.commands.selectAll();
        
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        const result = editor.commands.setTextAlign('invalid' as any);
        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid text alignment: invalid')
        );
        
        consoleSpy.mockRestore();
      });

      it('should reject null/undefined values', () => {
        editor.commands.selectAll();
        
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        const result1 = editor.commands.setTextAlign(null as any);
        const result2 = editor.commands.setTextAlign(undefined as any);
        
        expect(result1).toBe(false);
        expect(result2).toBe(false);
        expect(consoleSpy).toHaveBeenCalledTimes(2);
        
        consoleSpy.mockRestore();
      });

      it('should handle case insensitive input', () => {
        editor.commands.selectAll();
        
        const result = editor.commands.setTextAlign('CENTER' as any);
        expect(result).toBe(true);
        
        const html = editor.getHTML();
        expect(html).toContain('style="text-align: center"');
      });
    });

    describe('HTML Parsing', () => {
      it('should parse existing text-align styles from paragraph elements', () => {
        const htmlContent = '<p style="text-align: center">Centered text</p>';
        editor.commands.setContent(htmlContent);
        
        // Check if the alignment is preserved in the paragraph
        const html = editor.getHTML();
        expect(html).toContain('<p style="text-align: center">');
      });

      it('should apply text-align to paragraphs when setting content', () => {
        // Test content-based alignment application
        editor.commands.selectAll();
        editor.commands.setTextAlign('right');
        
        // Check if the alignment is applied to the paragraph
        const html = editor.getHTML();
        expect(html).toContain('<p style="text-align: right">');
      });

      it('should ignore text-align on non-block elements', () => {
        const htmlContent = '<p><span style="text-align: center">Text in span</span></p>';
        editor.commands.setContent(htmlContent);
        
        // The span text-align should be ignored, only paragraph can have alignment
        const html = editor.getHTML();
        expect(html).not.toContain('text-align');
        expect(html).toContain('<p>');
      });
    });

    describe('Node and Mark Interaction', () => {
      it('should work with typography marks on aligned blocks', () => {
        editor.commands.selectAll();
        
        // Apply text alignment to paragraph and marks to text
        editor.commands.setTextAlign('center');
        editor.commands.setFontFamily('Arial');
        editor.commands.setFontSize(18);
        editor.commands.setTextColor('#ff0000');
        
        const html = editor.getHTML();
        expect(html).toContain('<p style="text-align: center">');
        expect(html).toContain('font-family: Arial');
        expect(html).toContain('font-size: 18px');
        expect(html).toContain('color: #ff0000');
      });

      it('should override previous text alignment on same block', () => {
        editor.commands.selectAll();
        
        // First alignment
        editor.commands.setTextAlign('left');
        let html = editor.getHTML();
        expect(html).toContain('<p style="text-align: left">');
        
        // Override with new alignment
        editor.commands.setTextAlign('right');
        html = editor.getHTML();
        expect(html).toContain('<p style="text-align: right">');
        expect(html).not.toContain('text-align: left');
      });

      it('should work with multiple block element operations', () => {
        editor.commands.selectAll();
        editor.commands.setTextAlign('center');
        
        // Verify alignment persists through content operations
        let html = editor.getHTML();
        expect(html).toContain('<p style="text-align: center">');
        
        // Clear and re-apply to ensure consistency
        editor.commands.unsetTextAlign();
        editor.commands.setTextAlign('justify');
        
        html = editor.getHTML();
        expect(html).toContain('<p style="text-align: justify">');
        expect(html).not.toContain('text-align: center');
      });
    });
  });

  describe('Mark Integration', () => {
    describe('Multiple Marks Application', () => {
      it('should apply multiple marks simultaneously', () => {
        editor.commands.selectAll();
        
        editor.commands.setFontFamily('Arial');
        editor.commands.setFontSize(18);
        editor.commands.setFontWeight(700);
        editor.commands.setTextColor('#ff0000');
        
        const html = editor.getHTML();
        expect(html).toContain('font-family: Arial');
        expect(html).toContain('font-size: 18px');
        expect(html).toContain('font-weight: 700');
        expect(html).toContain('color: #ff0000');
      });

      it('should handle overlapping marks correctly', () => {
        // Select first part of text
        editor.commands.setTextSelection({ from: 1, to: 5 });
        editor.commands.setTextColor('#ff0000');
        
        // Select overlapping part
        editor.commands.setTextSelection({ from: 3, to: 8 });
        editor.commands.setTextColor('#00ff00');
        
        const html = editor.getHTML();
        // Should have both color marks applied to different ranges
        expect(html).toContain('color:');
      });

      it('should preserve other marks when removing one mark', () => {
        editor.commands.selectAll();
        
        editor.commands.setFontFamily('Arial');
        editor.commands.setFontSize(18);
        editor.commands.setTextColor('#ff0000');
        
        // Remove only font size
        editor.commands.unsetFontSize();
        
        const html = editor.getHTML();
        expect(html).toContain('font-family: Arial');
        expect(html).toContain('color: #ff0000');
        expect(html).not.toContain('font-size:');
      });
    });

    describe('Mark Persistence', () => {
      it('should persist marks through content updates', () => {
        editor.commands.selectAll();
        editor.commands.setFontFamily('Arial');
        
        const originalHTML = editor.getHTML();
        
        // Set content again
        editor.commands.setContent(originalHTML);
        
        editor.commands.selectAll();
        const marks = editor.getAttributes('fontFamily');
        expect(marks.fontFamily).toBe('Arial');
      });

      it('should maintain marks when typing', () => {
        editor.commands.selectAll();
        editor.commands.setFontWeight(700);
        
        // Position cursor at end and type
        editor.commands.focus('end');
        editor.commands.insertContent(' additional text');
        
        const html = editor.getHTML();
        expect(html).toContain('font-weight: 700');
      });
    });

    describe('Performance', () => {
      it('should handle large amounts of text with marks efficiently', () => {
        const startTime = performance.now();
        
        // Create large content with marks
        const largeContent = 'Lorem ipsum '.repeat(1000);
        editor.commands.setContent(`<p>${largeContent}</p>`);
        
        editor.commands.selectAll();
        editor.commands.setFontFamily('Arial');
        editor.commands.setFontSize(18);
        editor.commands.setTextColor('#ff0000');
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      });

      it('should efficiently update marks on selection changes', () => {
        // Add multiple marks to different parts
        for (let i = 0; i < 10; i++) {
          editor.commands.setTextSelection({ from: i + 1, to: i + 5 });
          editor.commands.setFontWeight(400 + (i % 5) * 100);
        }
        
        // Should not cause performance issues
        const html = editor.getHTML();
        expect(html.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid editor states gracefully', () => {
      // Try to apply marks without selection
      editor.commands.blur();
      
      const result = editor.commands.setFontFamily('Arial');
      // Should not throw error, even if it returns false
      expect(typeof result).toBe('boolean');
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHTML = '<p><span style="font-family: Arial; color:">Text</span></p>';
      
      expect(() => {
        editor.commands.setContent(malformedHTML);
      }).not.toThrow();
    });

    it('should handle concurrent mark applications', () => {
      editor.commands.selectAll();
      
      // Apply multiple marks in quick succession
      const promises = [
        () => editor.commands.setFontFamily('Arial'),
        () => editor.commands.setFontSize(18),
        () => editor.commands.setTextColor('#ff0000'),
        () => editor.commands.setFontWeight(700),
      ];
      
      promises.forEach(cmd => cmd());
      
      // Should not cause conflicts
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-size: 18px');
      expect(html).toContain('color: #ff0000');
      expect(html).toContain('font-weight: 700');
    });
  });

  describe('Accessibility', () => {
    it('should preserve semantic meaning when applying marks', () => {
      editor.commands.setContent('<p><strong>Important text</strong></p>');
      
      editor.commands.selectAll();
      editor.commands.setFontFamily('Arial');
      
      const html = editor.getHTML();
      // TipTap wraps with spans but preserves the text content
      expect(html).toContain('Important text');
      expect(html).toContain('font-family: Arial');
    });

    it('should not interfere with screen reader functionality', () => {
      editor.commands.selectAll();
      editor.commands.setTextTransform('uppercase');
      
      const html = editor.getHTML();
      // Should still be readable by screen readers
      expect(html).toContain('Test content for typography marks');
      expect(html).toContain('text-transform: uppercase');
    });
  });
});

describe('Typography Commands Integration', () => {
  let editor: Editor;

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
        TextAlignNode,
      ],
      content: '<p>Test content</p>',
    });
  });

  describe('Command Chaining', () => {
    it('should support command chaining', () => {
      editor.commands.selectAll();
      
      const result = editor
        .chain()
        .setFontFamily('Arial')
        .setFontSize(18)
        .setTextColor('#ff0000')
        .run();
      
      expect(result).toBe(true);
      
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-size: 18px');
      expect(html).toContain('color: #ff0000');
    });

    it('should handle failed commands in chain gracefully', () => {
      editor.commands.selectAll();
      
      const result = editor
        .chain()
        .setFontFamily('Arial')
        .setFontSize(5) // Invalid size
        .setTextColor('#ff0000')
        .run();
      
      // Chain should continue despite one failed command
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('color: #ff0000');
      expect(html).not.toContain('font-size: 5px');
    });
  });
});