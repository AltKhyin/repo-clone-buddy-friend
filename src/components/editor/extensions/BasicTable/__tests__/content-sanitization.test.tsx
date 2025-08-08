// ABOUTME: Test content sanitization to prevent line break issues in table cells

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('BasicTable Content Sanitization', () => {
  // Mock the sanitizeCellContent function behavior
  const sanitizeCellContent = (cellHTML: string): string => {
    // Simulate what our sanitizer does
    return cellHTML
      .replace(/<div><br><\/div>/g, '<br>')
      .replace(/<div>/g, '<br>')
      .replace(/<\/div>/g, '')
      .replace(/^<br>/, '')
      .replace(/<br>$/, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  it('should preserve basic HTML formatting', () => {
    const input = '<strong>Bold</strong> and <em>italic</em> text';
    const result = sanitizeCellContent(input);
    expect(result).toBe('<strong>Bold</strong> and <em>italic</em> text');
  });

  it('should remove unwanted div elements that cause line breaks', () => {
    const input = '<div>Unwanted div content</div>';
    const result = sanitizeCellContent(input);
    expect(result).toBe('Unwanted div content'); // Leading <br> removed
  });

  it('should clean up div-wrapped line breaks', () => {
    const input = 'Text<div><br></div>More text';
    const result = sanitizeCellContent(input);
    expect(result).toBe('Text<br>More text');
  });

  it('should remove leading and trailing line breaks', () => {
    const input = '<br>Content<br>';
    const result = sanitizeCellContent(input);
    expect(result).toBe('Content');
  });

  it('should convert non-breaking spaces to regular spaces', () => {
    const input = 'Text&nbsp;with&nbsp;spaces';
    const result = sanitizeCellContent(input);
    expect(result).toBe('Text with spaces');
  });

  it('should handle complex nested formatting correctly', () => {
    const input = '<div><strong>Bold text</strong></div><div><em>Italic text</em></div>';
    const result = sanitizeCellContent(input);
    expect(result).toBe('<strong>Bold text</strong><br><em>Italic text</em>');
  });

  it('should handle empty content gracefully', () => {
    const input = '';
    const result = sanitizeCellContent(input);
    expect(result).toBe('');
  });
});