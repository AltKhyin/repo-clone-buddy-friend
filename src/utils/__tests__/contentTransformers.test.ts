// ABOUTME: Tests for content transformation utilities ensuring heading block synchronization works correctly

import { describe, it, expect } from 'vitest';
import {
  transformContent,
  extractTextContent,
  needsTransformation,
  validateContentStructure,
  getHeadingLevelFromContent,
  updateContentSafely,
} from '../contentTransformers';

describe('Content Transformers', () => {
  describe('transformContent', () => {
    it('should transform paragraph to heading', () => {
      const input = '<p>Hello world</p>';
      const result = transformContent(input, null, 1);
      expect(result).toBe('<h1>Hello world</h1>');
    });

    it('should transform heading to paragraph', () => {
      const input = '<h1>Hello world</h1>';
      const result = transformContent(input, 1, null);
      expect(result).toBe('<p>Hello world</p>');
    });

    it('should transform between heading levels', () => {
      const input = '<h1>Hello world</h1>';
      const result = transformContent(input, 1, 3);
      expect(result).toBe('<h3>Hello world</h3>');
    });

    it('should handle empty content for headings', () => {
      const result = transformContent('', null, 2);
      expect(result).toBe('<h2>Your heading here</h2>');
    });

    it('should handle empty content for paragraphs', () => {
      const result = transformContent('', 1, null);
      expect(result).toBe('<p>Type something...</p>');
    });

    it('should preserve inline formatting', () => {
      const input = '<p>Hello <strong>world</strong> with <em>emphasis</em></p>';
      const result = transformContent(input, null, 1);
      expect(result).toBe('<h1>Hello <strong>world</strong> with <em>emphasis</em></h1>');
    });
  });

  describe('extractTextContent', () => {
    it('should extract text from paragraph', () => {
      const input = '<p>Hello world</p>';
      const result = extractTextContent(input);
      expect(result).toBe('Hello world');
    });

    it('should extract text from heading', () => {
      const input = '<h1>Hello world</h1>';
      const result = extractTextContent(input);
      expect(result).toBe('Hello world');
    });

    it('should preserve inline formatting', () => {
      const input = '<p>Hello <strong>world</strong> with <em>emphasis</em></p>';
      const result = extractTextContent(input);
      expect(result).toBe('Hello <strong>world</strong> with <em>emphasis</em>');
    });

    it('should handle nested block elements', () => {
      const input = '<div><p>Hello world</p></div>';
      const result = extractTextContent(input);
      expect(result).toBe('Hello world');
    });

    it('should handle empty content', () => {
      const result = extractTextContent('');
      expect(result).toBe('');
    });
  });

  describe('needsTransformation', () => {
    it('should return true when paragraph needs to become heading', () => {
      const content = '<p>Hello world</p>';
      const result = needsTransformation(content, 1);
      expect(result).toBe(true);
    });

    it('should return true when heading needs to become paragraph', () => {
      const content = '<h1>Hello world</h1>';
      const result = needsTransformation(content, null);
      expect(result).toBe(true);
    });

    it('should return true when heading level needs to change', () => {
      const content = '<h1>Hello world</h1>';
      const result = needsTransformation(content, 3);
      expect(result).toBe(true);
    });

    it('should return false when content already matches expected level', () => {
      const content = '<h1>Hello world</h1>';
      const result = needsTransformation(content, 1);
      expect(result).toBe(false);
    });

    it('should return false for empty content', () => {
      const result = needsTransformation('', 1);
      expect(result).toBe(false);
    });
  });

  describe('validateContentStructure', () => {
    it('should validate correct heading structure', () => {
      const content = '<h1>Hello world</h1>';
      const result = validateContentStructure(content, 1);
      expect(result).toBe(true);
    });

    it('should validate correct paragraph structure', () => {
      const content = '<p>Hello world</p>';
      const result = validateContentStructure(content, null);
      expect(result).toBe(true);
    });

    it('should invalidate incorrect heading structure', () => {
      const content = '<p>Hello world</p>';
      const result = validateContentStructure(content, 1);
      expect(result).toBe(false);
    });

    it('should invalidate incorrect paragraph structure', () => {
      const content = '<h1>Hello world</h1>';
      const result = validateContentStructure(content, null);
      expect(result).toBe(false);
    });

    it('should accept empty content as valid', () => {
      const result = validateContentStructure('', 1);
      expect(result).toBe(true);
    });
  });

  describe('getHeadingLevelFromContent', () => {
    it('should extract heading level from content', () => {
      const content = '<h3>Hello world</h3>';
      const result = getHeadingLevelFromContent(content);
      expect(result).toBe(3);
    });

    it('should return null for paragraph content', () => {
      const content = '<p>Hello world</p>';
      const result = getHeadingLevelFromContent(content);
      expect(result).toBe(null);
    });

    it('should return null for empty content', () => {
      const result = getHeadingLevelFromContent('');
      expect(result).toBe(null);
    });

    it('should handle heading with attributes', () => {
      const content = '<h2 class="title">Hello world</h2>';
      const result = getHeadingLevelFromContent(content);
      expect(result).toBe(2);
    });
  });

  describe('updateContentSafely', () => {
    it('should return content unchanged if structure is already correct', () => {
      const content = '<h1>Hello world</h1>';
      const result = updateContentSafely(content, 1);
      expect(result).toBe(content);
    });

    it('should transform content when structure is incorrect', () => {
      const content = '<p>Hello world</p>';
      const result = updateContentSafely(content, 1);
      expect(result).toBe('<h1>Hello world</h1>');
    });

    it('should handle transformation between heading levels', () => {
      const content = '<h1>Hello world</h1>';
      const result = updateContentSafely(content, 3);
      expect(result).toBe('<h3>Hello world</h3>');
    });

    it('should handle heading to paragraph transformation', () => {
      const content = '<h2>Hello world</h2>';
      const result = updateContentSafely(content, null);
      expect(result).toBe('<p>Hello world</p>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only content', () => {
      const result = transformContent('   ', null, 1);
      expect(result).toBe('<h1>Your heading here</h1>');
    });

    it('should handle malformed HTML', () => {
      const input = '<p>Hello world';
      const result = transformContent(input, null, 1);
      expect(result).toBe('<h1>Hello world</h1>');
    });

    it('should handle content with line breaks', () => {
      const input = '<p>Hello\nworld</p>';
      const result = transformContent(input, null, 1);
      expect(result).toBe('<h1>Hello\nworld</h1>');
    });

    it('should handle content with multiple inline elements', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em> and <u>underline</u></p>';
      const result = transformContent(input, null, 2);
      expect(result).toBe(
        '<h2><strong>Bold</strong> and <em>italic</em> and <u>underline</u></h2>'
      );
    });
  });
});
