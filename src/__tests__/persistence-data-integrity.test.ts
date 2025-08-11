// ABOUTME: Focused test for persistence data integrity and V2/V3 compatibility validation

import { describe, it, expect } from 'vitest';
import { validateStructuredContent, StructuredContentV2, StructuredContentV3 } from '@/types/editor';

// Helper to generate valid test UUIDs
const generateTestUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

describe('Persistence Data Integrity', () => {
  describe('V2 to V3 Migration Data Preservation', () => {
    it('should preserve all node data during V2 to V3 migration', () => {
      const testNodeId = generateTestUUID();
      const originalNodeData = {
        content: { htmlContent: '<p>Original content with <strong>formatting</strong></p>' },
        backgroundColor: '#f0f9ff',
        paddingX: 24,
        paddingY: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0ea5e9',
      };

      const v2Content: StructuredContentV2 = {
        version: '2.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: originalNodeData
        }],
        layouts: {
          lg: [{ i: testNodeId, x: 2, y: 1, w: 8, h: 4 }],
          md: [{ i: testNodeId, x: 2, y: 1, w: 8, h: 4 }],
          sm: [{ i: testNodeId, x: 0, y: 1, w: 4, h: 4 }],
          xs: [{ i: testNodeId, x: 0, y: 1, w: 4, h: 4 }]
        },
        metadata: {
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T11:00:00Z',
          editorVersion: '1.0.0'
        }
      };

      // Validate and migrate
      const migratedContent = validateStructuredContent(v2Content);

      // Verify version migration
      expect(migratedContent.version).toBe('3.0.0');
      
      // Verify node data preservation
      expect(migratedContent.nodes).toHaveLength(1);
      expect(migratedContent.nodes[0].id).toBe(testNodeId);
      expect(migratedContent.nodes[0].type).toBe('richBlock');
      expect(migratedContent.nodes[0].data).toEqual(originalNodeData);
      
      // Verify layout to position conversion
      expect(migratedContent.positions).toBeDefined();
      expect(migratedContent.positions[testNodeId]).toEqual({
        id: testNodeId,
        x: 133.33333333333334, // 2 * (800/12)
        y: 50, // 1 * 50
        width: 533.3333333333334, // 8 * (800/12) 
        height: 200 // 4 * 50
      });
      
      // Verify mobile positions
      expect(migratedContent.mobilePositions).toBeDefined();
      expect(migratedContent.mobilePositions[testNodeId]).toEqual({
        id: testNodeId,
        x: 0, // 0 * (375/12)
        y: 50, // 1 * 50
        width: 125, // 4 * (375/12)
        height: 200 // 4 * 50
      });
      
      // Verify V3 properties added
      expect(migratedContent.canvas).toEqual({
        canvasWidth: 800,
        canvasHeight: 600,
        gridColumns: 12,
        snapTolerance: 10
      });
      
      // Verify metadata updates
      expect(migratedContent.metadata?.migratedFrom).toBe('v2-layouts');
      expect(migratedContent.metadata?.editorVersion).toBe('2.0.0');
    });

    it('should handle complex V2 layouts with multiple nodes', () => {
      const node1Id = generateTestUUID();
      const node2Id = generateTestUUID();
      const node3Id = generateTestUUID();

      const v2Content: StructuredContentV2 = {
        version: '2.0.0',
        nodes: [
          {
            id: node1Id,
            type: 'richBlock',
            data: {
              content: { htmlContent: '<h1>Header</h1>' },
              backgroundColor: 'transparent',
              paddingX: 16,
              paddingY: 16,
              borderRadius: 8,
              borderWidth: 0,
              borderColor: '#e5e7eb',
            }
          },
          {
            id: node2Id,
            type: 'imageBlock',
            data: {
              src: 'https://example.com/image.jpg',
              alt: 'Test image',
              htmlCaption: '<p>Image caption</p>',
              paddingX: 8,
              paddingY: 8,
              backgroundColor: 'transparent',
              borderRadius: 4,
              borderWidth: 0,
              borderColor: 'transparent',
            }
          },
          {
            id: node3Id,
            type: 'richBlock',
            data: {
              content: { htmlContent: '<p>Footer content</p>' },
              backgroundColor: '#f9fafb',
              paddingX: 20,
              paddingY: 20,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#d1d5db',
            }
          }
        ],
        layouts: {
          lg: [
            { i: node1Id, x: 0, y: 0, w: 12, h: 2 }, // Full width header
            { i: node2Id, x: 0, y: 2, w: 6, h: 6 },  // Left half image
            { i: node3Id, x: 6, y: 2, w: 6, h: 6 }   // Right half footer
          ],
          md: [
            { i: node1Id, x: 0, y: 0, w: 12, h: 2 },
            { i: node2Id, x: 0, y: 2, w: 6, h: 6 },
            { i: node3Id, x: 6, y: 2, w: 6, h: 6 }
          ],
          sm: [
            { i: node1Id, x: 0, y: 0, w: 8, h: 2 },  // Smaller on tablet
            { i: node2Id, x: 0, y: 2, w: 8, h: 4 },  // Stack vertically
            { i: node3Id, x: 0, y: 6, w: 8, h: 4 }
          ],
          xs: [
            { i: node1Id, x: 0, y: 0, w: 4, h: 2 },  // Mobile: stack all
            { i: node2Id, x: 0, y: 2, w: 4, h: 4 },
            { i: node3Id, x: 0, y: 6, w: 4, h: 4 }
          ]
        },
        metadata: {
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T11:00:00Z',
          editorVersion: '1.0.0'
        }
      };

      const migratedContent = validateStructuredContent(v2Content);

      // Verify all nodes preserved
      expect(migratedContent.nodes).toHaveLength(3);
      expect(migratedContent.nodes.map(n => n.id).sort()).toEqual([node1Id, node2Id, node3Id].sort());
      
      // Verify desktop positions (from lg layout)
      expect(migratedContent.positions[node1Id]).toEqual({
        id: node1Id,
        x: 0, // 0 * (800/12)
        y: 0, // 0 * 50
        width: 800, // 12 * (800/12)
        height: 100 // 2 * 50
      });
      
      expect(migratedContent.positions[node2Id]).toEqual({
        id: node2Id,
        x: 0, // 0 * (800/12)
        y: 100, // 2 * 50
        width: 400, // 6 * (800/12)
        height: 300 // 6 * 50
      });
      
      expect(migratedContent.positions[node3Id]).toEqual({
        id: node3Id,
        x: 400, // 6 * (800/12)
        y: 100, // 2 * 50
        width: 400, // 6 * (800/12)
        height: 300 // 6 * 50
      });
      
      // Verify mobile positions (from xs layout)
      expect(migratedContent.mobilePositions[node1Id]).toEqual({
        id: node1Id,
        x: 0, // 0 * (375/12)
        y: 0, // 0 * 50
        width: 125, // 4 * (375/12)
        height: 100 // 2 * 50
      });
      
      expect(migratedContent.mobilePositions[node2Id]).toEqual({
        id: node2Id,
        x: 0, // 0 * (375/12)
        y: 100, // 2 * 50
        width: 125, // 4 * (375/12)
        height: 200 // 4 * 50
      });
      
      expect(migratedContent.mobilePositions[node3Id]).toEqual({
        id: node3Id,
        x: 0, // 0 * (375/12)
        y: 300, // 6 * 50
        width: 125, // 4 * (375/12)
        height: 200 // 4 * 50
      });
    });
  });

  describe('V3 Content Integrity', () => {
    it('should preserve V3 content exactly as-is', () => {
      const testNodeId = generateTestUUID();
      const originalV3Content: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>V3 content with <em>emphasis</em></p>' },
            backgroundColor: '#fef3c7',
            paddingX: 32,
            paddingY: 32,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#f59e0b',
          }
        }],
        positions: {
          [testNodeId]: { id: testNodeId, x: 250, y: 150, width: 500, height: 300 }
        },
        mobilePositions: {
          [testNodeId]: { id: testNodeId, x: 10, y: 50, width: 355, height: 250 }
        },
        canvas: {
          canvasWidth: 1200,
          canvasHeight: 800,
          gridColumns: 16,
          snapTolerance: 5
        },
        metadata: {
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
          editorVersion: '2.0.0'
        }
      };

      const validatedContent = validateStructuredContent(originalV3Content);

      // Should be exactly the same
      expect(validatedContent).toEqual(originalV3Content);
      expect(validatedContent.version).toBe('3.0.0');
      expect(validatedContent.nodes).toHaveLength(1);
      expect(validatedContent.positions[testNodeId]).toEqual({
        id: testNodeId,
        x: 250,
        y: 150,
        width: 500,
        height: 300
      });
      expect(validatedContent.canvas.canvasWidth).toBe(1200);
    });
  });

  describe('Data Round-Trip Integrity', () => {
    it('should maintain data integrity through save-load simulation', () => {
      const testNodeId = generateTestUUID();
      
      // Simulate content being saved
      const originalContent: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [{
          id: testNodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Complex content with <strong>bold</strong> and <em>italic</em> and <u>underline</u></p>' },
            backgroundColor: '#ecfdf5',
            paddingX: 28,
            paddingY: 28,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#10b981',
            // Additional properties that might be present
            desktopPadding: {
              top: 28, right: 28, bottom: 28, left: 28
            },
            mobilePadding: {
              top: 16, right: 16, bottom: 16, left: 16
            }
          }
        }],
        positions: {
          [testNodeId]: { id: testNodeId, x: 150, y: 100, width: 650, height: 250 }
        },
        mobilePositions: {
          [testNodeId]: { id: testNodeId, x: 5, y: 20, width: 365, height: 220 }
        },
        canvas: {
          canvasWidth: 900,
          canvasHeight: 700,
          gridColumns: 12,
          snapTolerance: 8
        },
        metadata: {
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T13:00:00Z',
          editorVersion: '2.0.0'
        }
      };

      // Step 1: Validate before "saving" (simulates persistence layer validation)
      const validatedForSave = validateStructuredContent(originalContent);
      
      // Step 2: Simulate database round-trip by stringifying and parsing (simulates JSONB storage)
      const dbSimulation = JSON.parse(JSON.stringify(validatedForSave));
      
      // Step 3: Validate after "loading" (simulates persistence layer validation on load)
      const validatedAfterLoad = validateStructuredContent(dbSimulation);
      
      // Verify complete data integrity through the round-trip
      expect(validatedAfterLoad).toEqual(originalContent);
      expect(validatedAfterLoad.nodes[0].data.content.htmlContent).toBe(originalContent.nodes[0].data.content.htmlContent);
      expect(validatedAfterLoad.nodes[0].data.desktopPadding).toEqual(originalContent.nodes[0].data.desktopPadding);
      expect(validatedAfterLoad.nodes[0].data.mobilePadding).toEqual(originalContent.nodes[0].data.mobilePadding);
      expect(validatedAfterLoad.positions[testNodeId]).toEqual(originalContent.positions[testNodeId]);
      expect(validatedAfterLoad.mobilePositions[testNodeId]).toEqual(originalContent.mobilePositions[testNodeId]);
      expect(validatedAfterLoad.canvas).toEqual(originalContent.canvas);
      expect(validatedAfterLoad.metadata).toEqual(originalContent.metadata);
    });

    it('should handle edge cases in data preservation', () => {
      const node1Id = generateTestUUID();
      const node2Id = generateTestUUID();
      
      // Content with edge cases
      const edgeCaseContent: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [
          {
            id: node1Id,
            type: 'richBlock',
            data: {
              content: { htmlContent: '<p>Content with special chars: &amp; &lt; &gt; "quotes" \'apostrophes\'</p>' },
              backgroundColor: 'transparent',
              paddingX: 0,
              paddingY: 0,
              borderRadius: 0,
              borderWidth: 0,
              borderColor: 'transparent',
            }
          },
          {
            id: node2Id,
            type: 'imageBlock',
            data: {
              src: '', // Empty src
              alt: '', // Empty alt
              htmlCaption: '<p></p>', // Empty caption
              paddingX: 0,
              paddingY: 0,
              backgroundColor: 'transparent',
              borderRadius: 0,
              borderWidth: 0,
              borderColor: 'transparent',
            }
          }
        ],
        positions: {
          [node1Id]: { id: node1Id, x: 0, y: 0, width: 100, height: 50 }, // Minimal size
          [node2Id]: { id: node2Id, x: 0, y: 50, width: 100, height: 50 }
        },
        mobilePositions: {
          [node1Id]: { id: node1Id, x: 0, y: 0, width: 375, height: 50 },
          [node2Id]: { id: node2Id, x: 0, y: 50, width: 375, height: 50 }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600,
          gridColumns: 12,
          snapTolerance: 10
        },
        metadata: {
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z', // Same time
          editorVersion: '2.0.0'
        }
      };

      // Round-trip validation
      const validated1 = validateStructuredContent(edgeCaseContent);
      const dbSim = JSON.parse(JSON.stringify(validated1));
      const validated2 = validateStructuredContent(dbSim);
      
      expect(validated2).toEqual(edgeCaseContent);
      expect(validated2.nodes[0].data.content.htmlContent).toContain('&amp;');
      expect(validated2.nodes[1].data.src).toBe('');
      expect(validated2.nodes[1].data.alt).toBe('');
    });
  });
});