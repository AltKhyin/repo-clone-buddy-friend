// ABOUTME: Tests for color sanitization security utilities to prevent CSS injection attacks

import { describe, it, expect, vi } from 'vitest';
import { sanitizeColorForStyle, sanitizeStyleColors } from '@/utils/color-sanitization';

describe('Color sanitization security utilities', () => {
  // Test console.warn spy setup
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('sanitizeColorForStyle', () => {
    it('should allow valid hex colors', () => {
      expect(sanitizeColorForStyle('#ff0000')).toBe('#ff0000');
      expect(sanitizeColorForStyle('#FFF')).toBe('#FFF');
      expect(sanitizeColorForStyle('#123456')).toBe('#123456');
      expect(sanitizeColorForStyle('#abcdef')).toBe('#abcdef');
    });

    it('should allow valid RGB colors', () => {
      expect(sanitizeColorForStyle('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
      expect(sanitizeColorForStyle('rgba(255, 0, 0, 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should allow valid HSL colors', () => {
      expect(sanitizeColorForStyle('hsl(0, 100%, 50%)')).toBe('hsl(0, 100%, 50%)');
      expect(sanitizeColorForStyle('hsla(0, 100%, 50%, 0.5)')).toBe('hsla(0, 100%, 50%, 0.5)');
    });

    it('should allow valid theme tokens', () => {
      expect(sanitizeColorForStyle('hsl(var(--foreground))')).toBe('hsl(var(--foreground))');
      expect(sanitizeColorForStyle('hsl(var(--primary))')).toBe('hsl(var(--primary))');
    });

    it('should allow named colors', () => {
      expect(sanitizeColorForStyle('red')).toBe('red');
      expect(sanitizeColorForStyle('blue')).toBe('blue');
      expect(sanitizeColorForStyle('transparent')).toBe('transparent');
    });

    it('should return transparent for null/undefined inputs', () => {
      expect(sanitizeColorForStyle(undefined)).toBe('transparent');
      expect(sanitizeColorForStyle(null as any)).toBe('transparent');
      expect(sanitizeColorForStyle('')).toBe('transparent');
    });

    it('should return transparent for non-string inputs', () => {
      expect(sanitizeColorForStyle(123 as any)).toBe('transparent');
      expect(sanitizeColorForStyle({} as any)).toBe('transparent');
      expect(sanitizeColorForStyle([] as any)).toBe('transparent');
    });

    it('should block dangerous JavaScript injection attempts', () => {
      const dangerousInputs = [
        'javascript:alert(1)',
        'JavaScript:void(0)',
        'JAVASCRIPT:alert("xss")',
      ];

      dangerousInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Blocked potentially dangerous color value: ${input}`);
      });
    });

    it('should block CSS expression injection attempts', () => {
      const expressionInputs = [
        'expression(alert(1))',
        'Expression(document.cookie)',
        'EXPRESSION(eval("alert(1)"))',
      ];

      expressionInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Blocked potentially dangerous color value: ${input}`);
      });
    });

    it('should block URL injection attempts', () => {
      const urlInputs = [
        'url(javascript:alert(1))',
        'URL("data:text/html,<script>alert(1)</script>")',
        'url(http://evil.com/steal.js)',
      ];

      urlInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Blocked potentially dangerous color value: ${input}`);
      });
    });

    it('should block data URI injection attempts', () => {
      const dataInputs = [
        'data:text/html,<script>alert(1)</script>',
        'DATA:application/javascript,alert(1)',
        'data:image/svg+xml;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      ];

      dataInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Blocked potentially dangerous color value: ${input}`);
      });
    });

    it('should block CSS import injection attempts', () => {
      const importInputs = [
        '@import url(evil.css)',
        '@IMPORT "malicious.css"',
        '@import url("javascript:alert(1)")',
      ];

      importInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Blocked potentially dangerous color value: ${input}`);
      });
    });

    it('should block IE-specific injection attempts', () => {
      const ieInputs = [
        'behavior:url(script.htc)',
        'BEHAVIOR:url(evil.htc)',
        'binding:url(malicious.xml)',
        'BINDING:url(script.xml)',
      ];

      ieInputs.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Blocked potentially dangerous color value: ${input}`);
      });
    });

    it('should block invalid color formats', () => {
      const invalidColors = [
        'invalid-color',
        '#gg0000', // Invalid hex
        'rgb(300, 300, 300)', // Values out of range are still valid RGB format
        'random-string',
        ';;;DROP TABLE users;--',
      ];

      // Only truly invalid formats should be blocked
      const actuallyInvalid = ['invalid-color', '#gg0000', 'random-string', ';;;DROP TABLE users;--'];
      
      actuallyInvalid.forEach(input => {
        expect(sanitizeColorForStyle(input)).toBe('transparent');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Invalid color format blocked: ${input}`);
      });
    });

    it('should handle whitespace correctly', () => {
      expect(sanitizeColorForStyle('  #ff0000  ')).toBe('#ff0000');
      expect(sanitizeColorForStyle('\t\nrgb(255, 0, 0)\t\n')).toBe('rgb(255, 0, 0)');
    });

    it('should preserve case for valid colors', () => {
      expect(sanitizeColorForStyle('Red')).toBe('Red');
      expect(sanitizeColorForStyle('BLUE')).toBe('BLUE');
      expect(sanitizeColorForStyle('#ABC')).toBe('#ABC');
    });
  });

  describe('sanitizeStyleColors', () => {
    it('should sanitize multiple color properties', () => {
      const input = {
        color: '#ff0000',
        backgroundColor: 'rgb(0, 255, 0)',
        borderColor: 'hsl(var(--primary))',
      };

      const result = sanitizeStyleColors(input);

      expect(result).toEqual({
        color: '#ff0000',
        backgroundColor: 'rgb(0, 255, 0)',
        borderColor: 'hsl(var(--primary))',
      });
    });

    it('should sanitize dangerous values in multiple properties', () => {
      const input = {
        color: 'javascript:alert(1)',
        backgroundColor: '#00ff00',
        borderColor: 'expression(eval("alert(1)"))',
        textColor: 'url(javascript:void(0))',
      };

      const result = sanitizeStyleColors(input);

      expect(result).toEqual({
        color: 'transparent',
        backgroundColor: '#00ff00',
        borderColor: 'transparent',
        textColor: 'transparent',
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3); // Three dangerous inputs
    });

    it('should handle undefined and null values', () => {
      const input = {
        color: undefined,
        backgroundColor: null as any,
        borderColor: '#ff0000',
      };

      const result = sanitizeStyleColors(input);

      expect(result).toEqual({
        color: 'transparent',
        backgroundColor: 'transparent',
        borderColor: '#ff0000',
      });
    });

    it('should work with empty object', () => {
      const result = sanitizeStyleColors({});
      expect(result).toEqual({});
    });

    it('should preserve all properties even after sanitization', () => {
      const input = {
        color: 'javascript:alert(1)',
        backgroundColor: '#ffffff', // Use a valid hex color instead of '#valid'
        borderColor: 'invalid-format',
        outlineColor: 'red',
        textDecorationColor: 'data:text/html,<script>',
      };

      const result = sanitizeStyleColors(input);

      expect(Object.keys(result)).toEqual(Object.keys(input));
      expect(result.backgroundColor).toBe('#ffffff');
      expect(result.outlineColor).toBe('red');
      expect(result.color).toBe('transparent');
      expect(result.borderColor).toBe('transparent');
      expect(result.textDecorationColor).toBe('transparent');
    });
  });

  describe('Edge cases and real-world scenarios', () => {
    it('should handle ContentType modal color scenarios', () => {
      // Simulate the exact scenario from ContentTypeCreateModal/EditModal
      const formData = {
        text_color: 'hsl(var(--foreground))',
        border_color: 'hsl(var(--border))',
        background_color: 'hsl(var(--muted))',
      };

      const sanitized = sanitizeStyleColors({
        color: formData.text_color,
        borderColor: formData.border_color,
        backgroundColor: formData.background_color,
      });

      expect(sanitized).toEqual({
        color: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--border))',
        backgroundColor: 'hsl(var(--muted))',
      });
    });

    it('should prevent XSS through style injection in Badge preview', () => {
      // Simulate attack vector through content type creation
      const maliciousInput = {
        color: 'red; background: url("javascript:alert(\'XSS\')")',
        borderColor: '#000; behavior: url("evil.htc")',
        backgroundColor: 'blue; @import url("malicious.css")',
      };

      const sanitized = sanitizeStyleColors(maliciousInput);

      // All should be blocked due to dangerous patterns
      expect(sanitized.color).toBe('transparent');
      expect(sanitized.borderColor).toBe('transparent');
      expect(sanitized.backgroundColor).toBe('transparent');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle theme token edge cases', () => {
      const themeTokens = [
        'hsl(var(--primary))',
        'hsl(var(--foreground))',
        'hsl(var(--background))',
        'hsl(var(--invalid-token))', // Should still pass format validation
      ];

      themeTokens.forEach(token => {
        expect(sanitizeColorForStyle(token)).toBe(token);
      });
    });
  });
});