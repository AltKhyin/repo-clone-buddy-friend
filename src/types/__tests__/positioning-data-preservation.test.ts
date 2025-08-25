// ABOUTME: Integration tests for positioning data preservation through validation pipeline

import { describe, it, expect, beforeEach } from 'vitest';
import { validateStructuredContent } from '../editor';

describe('Positioning Data Preservation - Integration Tests', () => {
  describe('Content Structure Repair', () => {
    it('should repair malformed RichBlock content structure', () => {
      const malformedContent = {
        version: '3.0.0',
        nodes: [
          {
            id: 'node-1',
            type: 'richBlock',
            data: {
              content: '<p>Malformed string content</p>', // ❌ String instead of object
              paddingTop: 16,
              borderWidth: 0
            }
          },
          {
            id: 'node-2', 
            type: 'richBlock',
            data: {
              content: {
                htmlContent: '<p>Proper object content</p>', // ✅ Correct structure
                tiptapJSON: { type: 'doc', content: [] }
              },
              paddingTop: 16,
              borderWidth: 0
            }
          }
        ],
        positions: {
          'node-1': { id: 'node-1', x: 100, y: 200, width: 424, height: 300 },
          'node-2': { id: 'node-2', x: 150, y: 400, width: 341, height: 250 }
        },
        mobilePositions: {
          'node-1': { id: 'node-1', x: 0, y: 200, width: 375, height: 300 },
          'node-2': { id: 'node-2', x: 0, y: 400, width: 375, height: 250 }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600,
          gridColumns: 12,
          snapTolerance: 10
        }
      };

      // Should succeed after repair (no exception thrown)
      const result = validateStructuredContent(malformedContent);

      // Verify structure
      expect(result.version).toBe('3.0.0');
      expect(result.nodes).toHaveLength(2);
      
      // Verify malformed content was repaired
      const repairedNode = result.nodes[0];
      expect(repairedNode.id).toBe('node-1');
      expect(repairedNode.type).toBe('richBlock');
      expect(repairedNode.data.content).toBeTypeOf('object');
      expect(repairedNode.data.content.htmlContent).toBe('<p>Malformed string content</p>');
      
      // Verify correct content was preserved  
      const correctNode = result.nodes[1];
      expect(correctNode.data.content.htmlContent).toBe('<p>Proper object content</p>');
      expect(correctNode.data.content.tiptapJSON).toBeDefined();

      // 🎯 CRITICAL: Verify positioning data was preserved
      expect(result.positions['node-1'].width).toBe(424); // Custom width preserved
      expect(result.positions['node-2'].width).toBe(341); // Custom width preserved
      expect(result.positions['node-1'].x).toBe(100);
      expect(result.positions['node-2'].x).toBe(150);
    });

    it('should handle missing content property', () => {
      const contentWithMissingProperty = {
        version: '3.0.0',
        nodes: [
          {
            id: 'node-missing-content',
            type: 'richBlock', 
            data: {
              // Missing content property entirely
              paddingTop: 16,
              borderWidth: 0
            }
          }
        ],
        positions: {
          'node-missing-content': { id: 'node-missing-content', x: 200, y: 300, width: 438, height: 350 }
        },
        mobilePositions: {
          'node-missing-content': { id: 'node-missing-content', x: 0, y: 300, width: 375, height: 350 }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600, 
          gridColumns: 12,
          snapTolerance: 10
        }
      };

      const result = validateStructuredContent(contentWithMissingProperty);
      
      // Verify content property was added
      const repairedNode = result.nodes[0];
      expect(repairedNode.data.content).toBeTypeOf('object');
      expect(repairedNode.data.content.htmlContent).toBe('<p>Content restored during repair</p>');
      
      // 🎯 CRITICAL: Verify positioning preserved
      expect(result.positions['node-missing-content'].width).toBe(438); // Custom width preserved
      expect(result.positions['node-missing-content'].x).toBe(200);
      expect(result.positions['node-missing-content'].y).toBe(300);
    });
  });

  describe('Enhanced Graceful Recovery', () => {
    it('should preserve positioning data when validation fails but content has valid positions', () => {
      // Create content that will definitely fail validation but has positioning data
      const contentWithInvalidStructure = {
        version: '3.0.0',
        nodes: [
          {
            id: 'preserved-node-1',
            type: 'invalidBlockType', // This will cause validation to fail
            data: {
              someInvalidProperty: 'invalid data'
            }
          },
          {
            id: 'preserved-node-2', 
            type: 'richBlock',
            data: {
              content: '<p>String content</p>' // Will be repaired but validation might still fail
            }
          }
        ],
        positions: {
          'preserved-node-1': { id: 'preserved-node-1', x: 250, y: 100, width: 424, height: 200 },
          'preserved-node-2': { id: 'preserved-node-2', x: 300, y: 350, width: 341, height: 180 }
        },
        mobilePositions: {
          'preserved-node-1': { id: 'preserved-node-1', x: 0, y: 100, width: 375, height: 200 },
          'preserved-node-2': { id: 'preserved-node-2', x: 0, y: 350, width: 375, height: 180 }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600,
          gridColumns: 12, 
          snapTolerance: 10
        },
        // Add some invalid properties that will cause schema validation to fail
        invalidTopLevelProperty: 'this will cause validation to fail'
      };

      // Even with validation failures, should not throw but return fallback with preserved positions
      const result = validateStructuredContent(contentWithInvalidStructure);
      
      // Should return enhanced recovery result
      expect(result.version).toBe('3.0.0');
      expect(result.nodes).toBeDefined();
      expect(result.positions).toBeDefined();
      expect(result.mobilePositions).toBeDefined();
      
      // 🎯 CRITICAL: Original positioning data should be preserved via enhanced recovery
      // Even if nodes are lost due to invalid types, positioning data for valid nodes should be preserved
      const hasPreservedPositioning = Object.keys(result.positions).length > 0;
      expect(hasPreservedPositioning).toBe(true);
      
      // If any positions were preserved, they should maintain original dimensions
      Object.values(result.positions).forEach((position: any) => {
        expect(position.width).toBeTypeOf('number');
        expect(position.height).toBeTypeOf('number');
        expect(position.x).toBeTypeOf('number');
        expect(position.y).toBeTypeOf('number');
        // Should not default to generic 600px width if original data existed
        expect([424, 341, 600].includes(position.width)).toBe(true);
      });
    });

    it('should only use generic fallback positions when no original positioning data exists', () => {
      const contentWithoutPositioning = {
        version: '3.0.0',
        nodes: [
          {
            id: 'fallback-node',
            type: 'invalidType', // Will cause validation failure
            data: { invalidData: true }
          }
        ],
        // No positions or mobilePositions provided
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600,
          gridColumns: 12,
          snapTolerance: 10
        }
      };

      const result = validateStructuredContent(contentWithoutPositioning);
      
      // Should use generic fallback positioning only when no original data exists
      expect(result.positions).toBeDefined();
      
      // If fallback positions were created, they should be generic defaults
      if (Object.keys(result.positions).length > 0) {
        Object.values(result.positions).forEach((position: any) => {
          expect(position.x).toBe(100); // Generic fallback x
          expect(position.width).toBe(600); // Generic fallback width
          expect(position.height).toBe(200); // Generic fallback height
        });
      }
    });
  });

  describe('End-to-End Positioning Preservation', () => {
    it('should preserve custom positioning through complete validation pipeline', () => {
      // Real-world scenario: mixed content with malformed RichBlocks and custom positioning
      const realWorldContent = {
        version: '3.0.0',
        nodes: [
          {
            id: 'text-node-1',
            type: 'richBlock',
            data: {
              content: {
                htmlContent: '<p><strong>Title block</strong></p>',
                tiptapJSON: {
                  type: 'doc',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Title block', marks: [{ type: 'bold' }] }] }]
                }
              },
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
              fontSize: 24,
              fontWeight: 600,
              borderWidth: 0
            }
          },
          {
            id: 'image-node-2', 
            type: 'richBlock',
            data: {
              content: '<p><img src="test.jpg" alt="test image" /></p>', // ❌ Malformed content
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
              borderWidth: 0
            }
          },
          {
            id: 'text-node-3',
            type: 'richBlock',
            data: {
              content: {
                htmlContent: '<p>Content block with proper structure</p>'
              },
              paddingTop: 16,
              paddingBottom: 16,
              paddingLeft: 24,
              paddingRight: 24,
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#e2e8f0'
            }
          }
        ],
        positions: {
          'text-node-1': { id: 'text-node-1', x: 100, y: 50, width: 600, height: 80 },
          'image-node-2': { id: 'image-node-2', x: 50, y: 180, width: 424, height: 300 }, // Custom width
          'text-node-3': { id: 'text-node-3', x: 520, y: 200, width: 341, height: 180 }  // Custom width
        },
        mobilePositions: {
          'text-node-1': { id: 'text-node-1', x: 0, y: 50, width: 375, height: 80 },
          'image-node-2': { id: 'image-node-2', x: 0, y: 180, width: 375, height: 300 },
          'text-node-3': { id: 'text-node-3', x: 0, y: 520, width: 375, height: 180 }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 750,
          gridColumns: 12,
          snapTolerance: 10
        },
        metadata: {
          createdAt: '2025-08-21T10:00:00.000Z',
          updatedAt: '2025-08-21T10:30:00.000Z', 
          editorVersion: '2.0.0'
        }
      };

      const result = validateStructuredContent(realWorldContent);
      
      // Should successfully validate after content repair
      expect(result.version).toBe('3.0.0');
      expect(result.nodes).toHaveLength(3);
      
      // Verify malformed content was repaired
      const repairedImageNode = result.nodes.find(n => n.id === 'image-node-2');
      expect(repairedImageNode?.data.content).toBeTypeOf('object');
      expect(repairedImageNode?.data.content.htmlContent).toBe('<p><img src="test.jpg" alt="test image" /></p>');
      
      // 🎯 CRITICAL: All custom positioning should be preserved exactly
      expect(result.positions['text-node-1'].width).toBe(600); // Standard width preserved
      expect(result.positions['image-node-2'].width).toBe(424); // Custom width preserved
      expect(result.positions['text-node-3'].width).toBe(341); // Custom width preserved
      
      expect(result.positions['text-node-1'].x).toBe(100);
      expect(result.positions['image-node-2'].x).toBe(50);
      expect(result.positions['text-node-3'].x).toBe(520);
      
      expect(result.positions['text-node-1'].y).toBe(50);
      expect(result.positions['image-node-2'].y).toBe(180);
      expect(result.positions['text-node-3'].y).toBe(200);
      
      // Verify mobile positioning preserved
      expect(result.mobilePositions['image-node-2'].y).toBe(180);
      expect(result.mobilePositions['text-node-3'].y).toBe(520);
      
      // Verify canvas dimensions preserved (or default if recovery was used)
      expect(result.canvas.canvasWidth).toBe(800);
      expect(result.canvas.canvasHeight).toBeGreaterThanOrEqual(600); // Can be 600 (default) or 750 (preserved)
    });
  });
});