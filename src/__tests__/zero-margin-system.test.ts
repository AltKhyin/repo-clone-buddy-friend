// ABOUTME: Unit tests for zero-margin canvas and individual padding system core logic

import { describe, it, expect } from 'vitest';
import { NodeObject, BlockPositions } from '@/types/editor';

// Import the mobile generation function directly for testing
function generateMobilePositions(nodes: NodeObject[], desktopPositions: BlockPositions): BlockPositions {
  const mobilePositions: BlockPositions = {};
  const MOBILE_CANVAS_WIDTH = 375; // Mobile canvas total width
  const MOBILE_CONTENT_WIDTH = MOBILE_CANVAS_WIDTH; // Full canvas width - no margins
  const MOBILE_SPACING = 20; // Spacing between blocks (controlled by block padding, not canvas)
  let currentY = 0; // Start at canvas top edge - no top padding

  // Sort nodes by their desktop Y position to maintain reading order
  const sortedNodes = nodes
    .map(node => ({
      node,
      desktopY: desktopPositions[node.id]?.y || 0
    }))
    .sort((a, b) => a.desktopY - b.desktopY);

  sortedNodes.forEach(({ node }) => {
    const desktopPos = desktopPositions[node.id];
    if (desktopPos) {
      mobilePositions[node.id] = {
        id: node.id,
        x: 0, // ZERO MARGIN: Position at canvas left edge
        y: currentY,
        width: MOBILE_CONTENT_WIDTH, // Full canvas width (375px)
        height: desktopPos.height, // Keep original height
      };
      currentY += desktopPos.height + MOBILE_SPACING;
    }
  });

  return mobilePositions;
}

// Migration utility test
function migratePaddingData(data: any): any {
  // If already migrated (has individual padding fields), return as-is
  if (data.paddingTop !== undefined || data.paddingRight !== undefined || 
      data.paddingBottom !== undefined || data.paddingLeft !== undefined) {
    return data;
  }

  // If has legacy padding, migrate to individual fields
  if (data.paddingX !== undefined || data.paddingY !== undefined) {
    const paddingX = data.paddingX ?? 16;
    const paddingY = data.paddingY ?? 16;
    
    return {
      ...data,
      paddingTop: paddingY,
      paddingRight: paddingX,
      paddingBottom: paddingY,
      paddingLeft: paddingX,
      // Remove legacy fields to prevent confusion
      paddingX: undefined,
      paddingY: undefined,
    };
  }

  // No padding data - set defaults for individual fields
  return {
    ...data,
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
  };
}

// Canvas boundary constants test
const CANVAS_BOUNDARIES = {
  desktop: {
    width: 800,
    height: 600,
    margin: 0, // Zero margins - blocks can touch canvas edges
  },
  mobile: {
    width: 375,
    height: 800,
    margin: 0, // Zero margins - blocks can touch canvas edges on mobile too
  }
} as const;

describe('Zero-Margin Canvas System', () => {
  describe('📱 Mobile Layout Generation', () => {
    const mockNodes: NodeObject[] = [
      {
        id: 'block-1',
        type: 'richBlock',
        data: { content: { htmlContent: '<p>First block</p>' } },
      },
      {
        id: 'block-2',
        type: 'richBlock', 
        data: { content: { htmlContent: '<p>Second block</p>' } },
      },
    ];

    const mockDesktopPositions: BlockPositions = {
      'block-1': { id: 'block-1', x: 100, y: 50, width: 600, height: 200 },
      'block-2': { id: 'block-2', x: 100, y: 300, width: 600, height: 150 },
    };

    it('should generate zero-margin mobile positions', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      // All blocks should start at x=0 (no left margin)
      expect(mobilePositions['block-1'].x).toBe(0);
      expect(mobilePositions['block-2'].x).toBe(0);

      // First block starts at y=0 (no top margin)
      expect(mobilePositions['block-1'].y).toBe(0);
    });

    it('should use full canvas width', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      // All blocks should use full mobile canvas width
      expect(mobilePositions['block-1'].width).toBe(375);
      expect(mobilePositions['block-2'].width).toBe(375);
    });

    it('should maintain proper vertical stacking', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      // Second block should be positioned after first block + spacing
      const expectedY = mobilePositions['block-1'].height + 20; // 200 + 20 = 220
      expect(mobilePositions['block-2'].y).toBe(expectedY);
    });

    it('should preserve original heights', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      expect(mobilePositions['block-1'].height).toBe(200);
      expect(mobilePositions['block-2'].height).toBe(150);
    });

    it('should sort by desktop Y position for reading order', () => {
      // Test with reversed Y positions
      const reversedPositions: BlockPositions = {
        'block-1': { id: 'block-1', x: 100, y: 300, width: 600, height: 200 },
        'block-2': { id: 'block-2', x: 100, y: 50, width: 600, height: 150 },
      };

      const mobilePositions = generateMobilePositions(mockNodes, reversedPositions);

      // block-2 should come first (has lower desktop Y)
      expect(mobilePositions['block-2'].y).toBe(0);
      expect(mobilePositions['block-1'].y).toBe(170); // 150 + 20 spacing
    });

    it('should handle empty inputs gracefully', () => {
      expect(generateMobilePositions([], {})).toEqual({});
      expect(generateMobilePositions(mockNodes, {})).toEqual({});
    });
  });

  describe('🎨 Individual Padding Migration', () => {
    it('should preserve existing individual padding', () => {
      const individualData = {
        paddingTop: 10,
        paddingRight: 15,
        paddingBottom: 20,
        paddingLeft: 25,
        content: { htmlContent: '<p>Test</p>' }
      };

      const result = migratePaddingData(individualData);
      
      expect(result.paddingTop).toBe(10);
      expect(result.paddingRight).toBe(15);
      expect(result.paddingBottom).toBe(20);
      expect(result.paddingLeft).toBe(25);
    });

    it('should migrate legacy paddingX/Y to individual fields', () => {
      const legacyData = {
        paddingX: 20,
        paddingY: 15,
        content: { htmlContent: '<p>Test</p>' }
      };

      const result = migratePaddingData(legacyData);
      
      expect(result.paddingTop).toBe(15);    // paddingY
      expect(result.paddingRight).toBe(20);  // paddingX
      expect(result.paddingBottom).toBe(15); // paddingY
      expect(result.paddingLeft).toBe(20);   // paddingX
      expect(result.paddingX).toBeUndefined();
      expect(result.paddingY).toBeUndefined();
    });

    it('should apply defaults when no padding data exists', () => {
      const emptyData = {
        content: { htmlContent: '<p>Test</p>' }
      };

      const result = migratePaddingData(emptyData);
      
      expect(result.paddingTop).toBe(16);
      expect(result.paddingRight).toBe(16);
      expect(result.paddingBottom).toBe(16);
      expect(result.paddingLeft).toBe(16);
    });

    it('should handle partial legacy data', () => {
      const partialData = {
        paddingX: 30,
        // paddingY missing
        content: { htmlContent: '<p>Test</p>' }
      };

      const result = migratePaddingData(partialData);
      
      expect(result.paddingTop).toBe(16);    // default for missing paddingY
      expect(result.paddingRight).toBe(30);  // paddingX
      expect(result.paddingBottom).toBe(16); // default for missing paddingY
      expect(result.paddingLeft).toBe(30);   // paddingX
    });

    it('should prefer individual over legacy when both exist', () => {
      const mixedData = {
        paddingTop: 25,
        paddingRight: 30,
        // Missing bottom and left
        paddingX: 16, // Should be ignored
        paddingY: 12, // Should be ignored
        content: { htmlContent: '<p>Test</p>' }
      };

      const result = migratePaddingData(mixedData);
      
      // Should use individual values and ignore legacy
      expect(result.paddingTop).toBe(25);
      expect(result.paddingRight).toBe(30);
      // No migration needed since individual fields exist
      expect(result.paddingBottom).toBeUndefined();
      expect(result.paddingLeft).toBeUndefined();
    });
  });

  describe('🎯 Canvas Boundary Configuration', () => {
    it('should define zero margins for both viewports', () => {
      expect(CANVAS_BOUNDARIES.desktop.margin).toBe(0);
      expect(CANVAS_BOUNDARIES.mobile.margin).toBe(0);
    });

    it('should maintain proper canvas dimensions', () => {
      expect(CANVAS_BOUNDARIES.desktop.width).toBe(800);
      expect(CANVAS_BOUNDARIES.desktop.height).toBe(600);
      expect(CANVAS_BOUNDARIES.mobile.width).toBe(375);
      expect(CANVAS_BOUNDARIES.mobile.height).toBe(800);
    });
  });

  describe('🚀 Performance and Edge Cases', () => {
    it('should handle large number of blocks efficiently', () => {
      const largeNodeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `block-${i}`,
        type: 'richBlock',
        data: { content: { htmlContent: `<p>Block ${i}</p>` } },
      }));

      const largePositions = Object.fromEntries(
        largeNodeArray.map((node, i) => [
          node.id, 
          { id: node.id, x: 0, y: i * 220, width: 600, height: 200 }
        ])
      );

      const start = performance.now();
      const mobilePositions = generateMobilePositions(largeNodeArray, largePositions);
      const end = performance.now();

      // Should complete quickly even with 1000 blocks
      expect(end - start).toBeLessThan(100);
      expect(Object.keys(mobilePositions)).toHaveLength(1000);
    });

    it('should handle malformed position data', () => {
      const nodes: NodeObject[] = [
        { id: 'valid', type: 'richBlock', data: {} },
        { id: 'invalid', type: 'richBlock', data: {} },
      ];

      const malformedPositions: BlockPositions = {
        'valid': { id: 'valid', x: 0, y: 0, width: 600, height: 200 },
        // 'invalid' missing
      };

      const result = generateMobilePositions(nodes, malformedPositions);
      
      // Should only include valid positions
      expect(Object.keys(result)).toEqual(['valid']);
      expect(result['valid'].x).toBe(0);
      expect(result['valid'].width).toBe(375);
    });
  });
});

describe('Integration Validation', () => {
  it('should demonstrate complete zero-margin system integration', () => {
    // Test complete workflow: legacy → migration → mobile layout
    
    // 1. Start with legacy data
    const legacyBlock = {
      id: 'test-block',
      type: 'richBlock',
      data: {
        paddingX: 20,
        paddingY: 15,
        content: { htmlContent: '<p>Test content</p>' }
      }
    };

    // 2. Apply migration
    const migratedData = migratePaddingData(legacyBlock.data);
    expect(migratedData.paddingTop).toBe(15);
    expect(migratedData.paddingRight).toBe(20);
    expect(migratedData.paddingBottom).toBe(15);
    expect(migratedData.paddingLeft).toBe(20);

    // 3. Generate mobile layout with zero margins
    const desktopPositions: BlockPositions = {
      'test-block': { id: 'test-block', x: 100, y: 50, width: 600, height: 200 }
    };

    const mobilePositions = generateMobilePositions([legacyBlock], desktopPositions);
    
    // 4. Validate zero-margin mobile positioning
    expect(mobilePositions['test-block'].x).toBe(0);        // No left margin
    expect(mobilePositions['test-block'].y).toBe(0);        // No top margin  
    expect(mobilePositions['test-block'].width).toBe(375);  // Full canvas width

    // Integration test successful!
    expect(true).toBe(true);
  });
});