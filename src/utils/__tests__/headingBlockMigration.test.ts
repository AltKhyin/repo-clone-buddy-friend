// ABOUTME: Tests for heading block migration utility

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  migrateHeadingBlockToTextBlock,
  migrateAllHeadingBlocks,
  isLegacyHeadingBlock,
  isMigratedHeadingBlock,
  getMigrationStats,
  validateMigratedHeadingBlock,
  batchMigrateHeadingBlocks,
  rollbackMigratedHeadingBlock,
} from '../headingBlockMigration';
import { NodeObject } from '@/types/editor';

describe('Heading Block Migration', () => {
  describe('migrateHeadingBlockToTextBlock', () => {
    it('should migrate a basic heading block to text block', () => {
      const headingBlock: NodeObject = {
        id: 'heading-1',
        type: 'headingBlock',
        data: {
          htmlContent: '<h1>Test Heading</h1>',
          level: 1,
          textAlign: 'center',
          color: '#333333',
          fontFamily: 'Arial',
          fontWeight: 700,
        },
        position: { x: 100, y: 200, width: 400, height: 60 },
        metadata: {
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      };

      const migratedBlock = migrateHeadingBlockToTextBlock(headingBlock);

      expect(migratedBlock.type).toBe('textBlock');
      expect(migratedBlock.id).toBe('heading-1');
      expect(migratedBlock.data.htmlContent).toBe('<h1>Test Heading</h1>');
      expect(migratedBlock.data.headingLevel).toBe(1);
      expect(migratedBlock.data.textAlign).toBe('center');
      expect(migratedBlock.data.color).toBe('#333333');
      expect(migratedBlock.data.fontFamily).toBe('Arial');
      expect(migratedBlock.data.fontWeight).toBe(700);
      expect(migratedBlock.metadata.migratedFrom).toBe('headingBlock');
      expect(migratedBlock.metadata.migratedAt).toBeDefined();
    });

    it('should handle heading blocks with extended properties', () => {
      const headingBlock: NodeObject = {
        id: 'heading-2',
        type: 'headingBlock',
        data: {
          htmlContent: '<h2>Styled Heading</h2>',
          level: 2,
          letterSpacing: 2,
          textTransform: 'uppercase',
          textDecoration: 'underline',
          backgroundColor: '#f0f0f0',
          paddingX: 16,
          paddingY: 8,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: '#cccccc',
        },
        position: { x: 0, y: 0, width: 300, height: 50 },
        metadata: {},
      };

      const migratedBlock = migrateHeadingBlockToTextBlock(headingBlock);

      expect(migratedBlock.data.headingLevel).toBe(2);
      expect(migratedBlock.data.letterSpacing).toBe(2);
      expect(migratedBlock.data.textTransform).toBe('uppercase');
      expect(migratedBlock.data.textDecoration).toBe('underline');
      expect(migratedBlock.data.backgroundColor).toBe('#f0f0f0');
      expect(migratedBlock.data.paddingX).toBe(16);
      expect(migratedBlock.data.paddingY).toBe(8);
      expect(migratedBlock.data.borderRadius).toBe(4);
      expect(migratedBlock.data.borderWidth).toBe(2);
      expect(migratedBlock.data.borderColor).toBe('#cccccc');
    });

    it('should provide default values for missing properties', () => {
      const headingBlock: NodeObject = {
        id: 'heading-3',
        type: 'headingBlock',
        data: {
          htmlContent: '<h3>Minimal Heading</h3>',
          level: 3,
        },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      const migratedBlock = migrateHeadingBlockToTextBlock(headingBlock);

      expect(migratedBlock.data.headingLevel).toBe(3);
      expect(migratedBlock.data.textAlign).toBe('left');
      expect(migratedBlock.data.textTransform).toBe('none');
      expect(migratedBlock.data.textDecoration).toBe('none');
      expect(migratedBlock.data.backgroundColor).toBe('transparent');
      expect(migratedBlock.data.paddingX).toBe(0);
      expect(migratedBlock.data.paddingY).toBe(0);
      expect(migratedBlock.data.borderWidth).toBe(0);
    });

    it('should throw error for non-heading blocks', () => {
      const textBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<p>Text content</p>' },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(() => migrateHeadingBlockToTextBlock(textBlock)).toThrow(
        'Cannot migrate non-heading block'
      );
    });
  });

  describe('migrateAllHeadingBlocks', () => {
    it('should migrate all heading blocks in an array', () => {
      const nodes: NodeObject[] = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Text content</p>' },
          position: { x: 0, y: 0, width: 200, height: 40 },
          metadata: {},
        },
        {
          id: 'heading-1',
          type: 'headingBlock',
          data: { htmlContent: '<h1>Heading 1</h1>', level: 1 },
          position: { x: 0, y: 100, width: 300, height: 60 },
          metadata: {},
        },
        {
          id: 'heading-2',
          type: 'headingBlock',
          data: { htmlContent: '<h2>Heading 2</h2>', level: 2 },
          position: { x: 0, y: 200, width: 250, height: 50 },
          metadata: {},
        },
        {
          id: 'image-1',
          type: 'imageBlock',
          data: { src: 'image.jpg', alt: 'Image' },
          position: { x: 0, y: 300, width: 200, height: 150 },
          metadata: {},
        },
      ];

      const migratedNodes = migrateAllHeadingBlocks(nodes);

      expect(migratedNodes).toHaveLength(4);
      expect(migratedNodes[0].type).toBe('textBlock'); // Original text block
      expect(migratedNodes[1].type).toBe('textBlock'); // Migrated heading 1
      expect(migratedNodes[2].type).toBe('textBlock'); // Migrated heading 2
      expect(migratedNodes[3].type).toBe('imageBlock'); // Original image block

      expect(migratedNodes[1].data.headingLevel).toBe(1);
      expect(migratedNodes[2].data.headingLevel).toBe(2);
    });

    it('should handle empty array', () => {
      const result = migrateAllHeadingBlocks([]);
      expect(result).toEqual([]);
    });

    it('should handle array with no heading blocks', () => {
      const nodes: NodeObject[] = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Text content</p>' },
          position: { x: 0, y: 0, width: 200, height: 40 },
          metadata: {},
        },
      ];

      const result = migrateAllHeadingBlocks(nodes);
      expect(result).toEqual(nodes);
    });
  });

  describe('isLegacyHeadingBlock', () => {
    it('should identify legacy heading blocks', () => {
      const headingBlock: NodeObject = {
        id: 'heading-1',
        type: 'headingBlock',
        data: { htmlContent: '<h1>Test</h1>', level: 1 },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(isLegacyHeadingBlock(headingBlock)).toBe(true);
    });

    it('should not identify text blocks as legacy heading blocks', () => {
      const textBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<p>Text</p>' },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(isLegacyHeadingBlock(textBlock)).toBe(false);
    });
  });

  describe('isMigratedHeadingBlock', () => {
    it('should identify migrated heading blocks', () => {
      const migratedBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<h1>Test</h1>', headingLevel: 1 },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(isMigratedHeadingBlock(migratedBlock)).toBe(true);
    });

    it('should not identify regular text blocks as migrated heading blocks', () => {
      const textBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<p>Text</p>' },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(isMigratedHeadingBlock(textBlock)).toBe(false);
    });
  });

  describe('getMigrationStats', () => {
    it('should provide accurate migration statistics', () => {
      const nodes: NodeObject[] = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Text</p>' },
          position: { x: 0, y: 0, width: 200, height: 40 },
          metadata: {},
        },
        {
          id: 'heading-1',
          type: 'headingBlock',
          data: { htmlContent: '<h1>Legacy</h1>', level: 1 },
          position: { x: 0, y: 100, width: 300, height: 60 },
          metadata: {},
        },
        {
          id: 'text-2',
          type: 'textBlock',
          data: { htmlContent: '<h2>Migrated</h2>', headingLevel: 2 },
          position: { x: 0, y: 200, width: 250, height: 50 },
          metadata: {},
        },
        {
          id: 'image-1',
          type: 'imageBlock',
          data: { src: 'image.jpg', alt: 'Image' },
          position: { x: 0, y: 300, width: 200, height: 150 },
          metadata: {},
        },
      ];

      const stats = getMigrationStats(nodes);

      expect(stats.totalNodes).toBe(4);
      expect(stats.legacyHeadingBlocks).toBe(1);
      expect(stats.migratedHeadingBlocks).toBe(1);
      expect(stats.regularTextBlocks).toBe(1);
      expect(stats.otherBlocks).toBe(1);
    });
  });

  describe('validateMigratedHeadingBlock', () => {
    it('should validate correct migrated heading block', () => {
      const migratedBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<h1>Test</h1>', headingLevel: 1 },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: { migratedFrom: 'headingBlock' },
      };

      expect(validateMigratedHeadingBlock(migratedBlock)).toBe(true);
    });

    it('should reject non-text blocks', () => {
      const headingBlock: NodeObject = {
        id: 'heading-1',
        type: 'headingBlock',
        data: { htmlContent: '<h1>Test</h1>', level: 1 },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(validateMigratedHeadingBlock(headingBlock)).toBe(false);
    });

    it('should reject text blocks without headingLevel', () => {
      const textBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<p>Text</p>' },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: { migratedFrom: 'headingBlock' },
      };

      expect(validateMigratedHeadingBlock(textBlock)).toBe(false);
    });

    it('should reject text blocks without migration metadata', () => {
      const textBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<h1>Test</h1>', headingLevel: 1 },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(validateMigratedHeadingBlock(textBlock)).toBe(false);
    });
  });

  describe('batchMigrateHeadingBlocks', () => {
    it('should migrate nodes in batches with progress tracking', async () => {
      const nodes: NodeObject[] = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Text</p>' },
          position: { x: 0, y: 0, width: 200, height: 40 },
          metadata: {},
        },
        {
          id: 'heading-1',
          type: 'headingBlock',
          data: { htmlContent: '<h1>Heading</h1>', level: 1 },
          position: { x: 0, y: 100, width: 300, height: 60 },
          metadata: {},
        },
      ];

      const progressCalls: Array<{ progress: number; total: number }> = [];
      const onProgress = (progress: number, total: number) => {
        progressCalls.push({ progress, total });
      };

      const result = await batchMigrateHeadingBlocks(nodes, onProgress);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('textBlock');
      expect(result[1].type).toBe('textBlock');
      expect(result[1].data.headingLevel).toBe(1);

      expect(progressCalls).toEqual([
        { progress: 1, total: 2 },
        { progress: 2, total: 2 },
      ]);
    });

    it('should handle empty array', async () => {
      const result = await batchMigrateHeadingBlocks([]);
      expect(result).toEqual([]);
    });
  });

  describe('rollbackMigratedHeadingBlock', () => {
    it('should rollback migrated heading block to original format', () => {
      const migratedBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: {
          htmlContent: '<h1>Test Heading</h1>',
          headingLevel: 1,
          textAlign: 'center',
          color: '#333333',
          letterSpacing: 2,
          textTransform: 'uppercase',
        },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: { migratedFrom: 'headingBlock' },
      };

      const rolledBackBlock = rollbackMigratedHeadingBlock(migratedBlock);

      expect(rolledBackBlock.type).toBe('headingBlock');
      expect(rolledBackBlock.data.level).toBe(1);
      expect(rolledBackBlock.data.htmlContent).toBe('<h1>Test Heading</h1>');
      expect(rolledBackBlock.data.textAlign).toBe('center');
      expect(rolledBackBlock.data.color).toBe('#333333');
      expect(rolledBackBlock.data.letterSpacing).toBe(2);
      expect(rolledBackBlock.data.textTransform).toBe('uppercase');
      expect(rolledBackBlock.metadata.rolledBackFrom).toBe('textBlock');
    });

    it('should throw error for invalid migrated block', () => {
      const textBlock: NodeObject = {
        id: 'text-1',
        type: 'textBlock',
        data: { htmlContent: '<p>Text</p>' },
        position: { x: 0, y: 0, width: 200, height: 40 },
        metadata: {},
      };

      expect(() => rollbackMigratedHeadingBlock(textBlock)).toThrow(
        'Cannot rollback non-migrated heading block'
      );
    });
  });
});
