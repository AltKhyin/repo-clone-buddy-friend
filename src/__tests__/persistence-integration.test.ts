// ABOUTME: Integration test for V2/V3 persistence layer consistency validation

import { describe, it, expect } from 'vitest';
import { validateStructuredContent, StructuredContentV2, StructuredContentV3 } from '@/types/editor';

// Helper to generate valid test UUIDs
const generateTestUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

describe('Persistence Layer Integration', () => {
  describe('V2/V3 Schema Compatibility', () => {
    it('should handle V3 content properly', () => {
      const testNodeId = generateTestUUID();
      const v3Content: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [
          {
            id: testNodeId,
            type: 'richBlock',
            data: {
              content: { htmlContent: '<p>Test content</p>' },
              backgroundColor: 'transparent',
              paddingX: 16,
              paddingY: 16,
              borderRadius: 8,
              borderWidth: 0,
              borderColor: '#e5e7eb',
            }
          }
        ],
        positions: {
          [testNodeId]: {
            id: testNodeId,
            x: 100,
            y: 100,
            width: 600,
            height: 200
          }
        },
        mobilePositions: {
          [testNodeId]: {
            id: testNodeId,
            x: 0,
            y: 0,
            width: 375,
            height: 200
          }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600,
          gridColumns: 12,
          snapTolerance: 10
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '2.0.0'
        }
      };

      const validated = validateStructuredContent(v3Content);
      expect(validated.version).toBe('3.0.0');
      expect(validated.nodes).toHaveLength(1);
      expect(validated.positions).toBeDefined();
      expect(validated.mobilePositions).toBeDefined();
    });

    it('should handle V2 content migration', () => {
      const testNodeId = generateTestUUID();
      const v2Content: StructuredContentV2 = {
        version: '2.0.0',
        nodes: [
          {
            id: testNodeId,
            type: 'richBlock',
            data: {
              content: { htmlContent: '<p>Legacy content</p>' },
              backgroundColor: 'transparent',
              paddingX: 16,
              paddingY: 16,
              borderRadius: 8,
              borderWidth: 0,
              borderColor: '#e5e7eb',
            }
          }
        ],
        layouts: {
          lg: [{ i: testNodeId, x: 0, y: 0, w: 8, h: 4 }],
          md: [{ i: testNodeId, x: 0, y: 0, w: 8, h: 4 }],
          sm: [{ i: testNodeId, x: 0, y: 0, w: 4, h: 4 }],
          xs: [{ i: testNodeId, x: 0, y: 0, w: 4, h: 4 }]
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '1.0.0'
        }
      };

      const validated = validateStructuredContent(v2Content);
      // Should either stay V2 or migrate to V3 - both are valid
      expect(['2.0.0', '3.0.0']).toContain(validated.version);
      expect(validated.nodes).toHaveLength(1);
    });

    it('should handle invalid content with graceful fallback', () => {
      const invalidContent = {
        version: 'invalid',
        nodes: null,
        badData: true
      };

      const validated = validateStructuredContent(invalidContent);
      expect(validated.version).toBe('3.0.0');
      expect(validated.nodes).toBeDefined();
      expect(validated.positions).toBeDefined();
      expect(validated.mobilePositions).toBeDefined();
      expect(validated.metadata?.migratedFrom).toBe('legacy-conflict-recovery');
    });

    it('should preserve block preset integration', () => {
      const testNodeId = generateTestUUID();
      const v3ContentWithPresets: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [
          {
            id: testNodeId,
            type: 'richBlock',
            data: {
              content: { htmlContent: '<p>Preset content</p>' },
              backgroundColor: '#f0f9ff',
              paddingX: 24,
              paddingY: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#0ea5e9',
              // These are preset-specific data
              desktopPadding: {
                top: 24, right: 24, bottom: 24, left: 24
              },
              mobilePadding: {
                top: 16, right: 16, bottom: 16, left: 16
              }
            }
          }
        ],
        positions: {
          [testNodeId]: {
            id: testNodeId,
            x: 200,
            y: 150,
            width: 500,
            height: 300
          }
        },
        mobilePositions: {
          [testNodeId]: {
            id: testNodeId,
            x: 0,
            y: 0,
            width: 375,
            height: 300
          }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600,
          gridColumns: 12,
          snapTolerance: 10
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          editorVersion: '2.0.0'
        }
      };

      const validated = validateStructuredContent(v3ContentWithPresets);
      expect(validated.version).toBe('3.0.0');
      expect(validated.nodes[0].data.desktopPadding).toBeDefined();
      expect(validated.nodes[0].data.mobilePadding).toBeDefined();
      expect(validated.mobilePositions).toBeDefined();
    });
  });

  describe('Data Flow Consistency', () => {
    it('should maintain consistent node structure across versions', () => {
      const testNodeId = generateTestUUID();
      const nodeData = {
        content: { htmlContent: '<p>Test</p>' },
        backgroundColor: 'transparent',
        paddingX: 16,
        paddingY: 16,
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };

      const v3Content: StructuredContentV3 = {
        version: '3.0.0',
        nodes: [{ id: testNodeId, type: 'richBlock', data: nodeData }],
        positions: { [testNodeId]: { id: testNodeId, x: 0, y: 0, width: 400, height: 200 }},
        mobilePositions: { [testNodeId]: { id: testNodeId, x: 0, y: 0, width: 375, height: 200 }},
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 },
        metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), editorVersion: '2.0.0' }
      };

      const validated = validateStructuredContent(v3Content);
      expect(validated.nodes[0].data).toEqual(nodeData);
    });
  });
});