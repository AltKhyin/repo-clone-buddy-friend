// ABOUTME: Tests for line height command integration with typography system

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TypographyCommands } from '../typography-commands';
import type { Editor } from '@tiptap/react';

describe('Line Height Command Integration', () => {
  let mockEditor: Partial<Editor>;
  let typographyCommands: TypographyCommands;

  beforeEach(() => {
    // Mock TipTap editor with commands
    mockEditor = {
      commands: {
        setMark: vi.fn(),
        unsetMark: vi.fn(),
      },
    };

    typographyCommands = new TypographyCommands(mockEditor as Editor);
  });

  describe('Line Height Property Support', () => {
    it('should accept lineHeight property in applyProperties', () => {
      const setMarkSpy = vi.fn().mockReturnValue(true);
      mockEditor.commands!.setMark = setMarkSpy;

      const result = typographyCommands.applyProperties({
        lineHeight: 1.5,
      });

      expect(result.success).toBe(true);
      expect(result.appliedProperties.lineHeight).toBe(1.5);
      expect(result.errors).toHaveLength(0);

      // Verify TipTap TextStyle mark was called
      expect(setMarkSpy).toHaveBeenCalledWith('textStyle', { lineHeight: 1.5 });
    });

    it('should validate line height values', () => {
      const result = typographyCommands.applyProperties({
        lineHeight: 5.0, // Too high (max 3.0)
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('lineHeight: Invalid line height: 5. Must be between 0.5 and 3.0.');
    });

    it('should reject invalid line height values', () => {
      const result = typographyCommands.applyProperties({
        lineHeight: 0.2, // Too low (min 0.5)
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('lineHeight: Invalid line height: 0.2. Must be between 0.5 and 3.0.');
    });

    it('should handle line height command failures gracefully', () => {
      const setMarkSpy = vi.fn().mockReturnValue(false); // Command fails
      mockEditor.commands!.setMark = setMarkSpy;

      const result = typographyCommands.applyProperties({
        lineHeight: 1.2,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('lineHeight: Failed to apply line height command');
    });
  });

  describe('Text Decoration Property Support', () => {
    it('should accept textDecoration property in applyProperties', () => {
      const setMarkSpy = vi.fn().mockReturnValue(true);
      mockEditor.commands!.setMark = setMarkSpy;

      const result = typographyCommands.applyProperties({
        textDecoration: 'underline',
      });

      expect(result.success).toBe(true);
      expect(result.appliedProperties.textDecoration).toBe('underline');
      expect(result.errors).toHaveLength(0);

      // Verify TipTap TextStyle mark was called
      expect(setMarkSpy).toHaveBeenCalledWith('textStyle', { textDecoration: 'underline' });
    });

    it('should validate text decoration values', () => {
      const result = typographyCommands.applyProperties({
        textDecoration: 'invalid-decoration',
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid text decoration: invalid-decoration');
    });

    it('should accept multiple valid text decoration values', () => {
      const setMarkSpy = vi.fn().mockReturnValue(true);
      mockEditor.commands!.setMark = setMarkSpy;

      const validDecorations = ['none', 'underline', 'line-through'];
      
      validDecorations.forEach(decoration => {
        const result = typographyCommands.applyProperties({
          textDecoration: decoration,
        });

        expect(result.success).toBe(true);
        expect(result.appliedProperties.textDecoration).toBe(decoration);
      });
    });
  });

  describe('Combined Typography Properties', () => {
    it('should handle line height combined with other typography properties', () => {
      const setMarkSpy = vi.fn().mockReturnValue(true);
      const setFontSizeSpy = vi.fn().mockReturnValue(true);
      
      mockEditor.commands!.setMark = setMarkSpy;
      mockEditor.commands!.setFontSize = setFontSizeSpy;

      const result = typographyCommands.applyProperties({
        fontSize: 16,
        lineHeight: 1.4,
        textDecoration: 'underline',
      });

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toEqual({
        fontSize: 16,
        lineHeight: 1.4,
        textDecoration: 'underline',
      });

      // Verify both commands were called
      expect(setFontSizeSpy).toHaveBeenCalledWith(16);
      expect(setMarkSpy).toHaveBeenCalledWith('textStyle', { lineHeight: 1.4 });
      expect(setMarkSpy).toHaveBeenCalledWith('textStyle', { textDecoration: 'underline' });
    });
  });

  describe('Unset Property Support', () => {
    it('should support unsetting line height', () => {
      const unsetMarkSpy = vi.fn().mockReturnValue(true);
      mockEditor.commands!.unsetMark = unsetMarkSpy;

      // Test unsetProperty directly 
      const result = (typographyCommands as any).unsetProperty('lineHeight');

      expect(result.success).toBe(true);
      expect(unsetMarkSpy).toHaveBeenCalledWith('textStyle');
    });

    it('should support unsetting text decoration', () => {
      const unsetMarkSpy = vi.fn().mockReturnValue(true);
      mockEditor.commands!.unsetMark = unsetMarkSpy;

      // Test unsetProperty directly
      const result = (typographyCommands as any).unsetProperty('textDecoration');

      expect(result.success).toBe(true);
      expect(unsetMarkSpy).toHaveBeenCalledWith('textStyle');
    });
  });

  describe('Error Handling', () => {
    it('should handle editor command exceptions for line height', () => {
      const setMarkSpy = vi.fn().mockImplementation(() => {
        throw new Error('TipTap command failed');
      });
      mockEditor.commands!.setMark = setMarkSpy;

      const result = typographyCommands.applyProperties({
        lineHeight: 1.5,
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Line height command error: Error: TipTap command failed');
    });

    it('should handle non-numeric line height values', () => {
      const result = typographyCommands.applyProperties({
        lineHeight: 'invalid' as any,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('lineHeight: Invalid line height: invalid');
    });
  });
});