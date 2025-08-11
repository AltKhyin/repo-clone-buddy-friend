// ABOUTME: Comprehensive test for complete export/import cycle validation with V2/V3 compatibility

import { describe, it, expect, beforeEach } from 'vitest';
import { validateStructuredContent, StructuredContentV2, StructuredContentV3 } from '@/types/editor';

// Helper to generate valid test UUIDs
const generateTestUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock editor store functionality for export/import testing
const mockEditorStore = {
  nodes: [] as any[],
  positions: {} as Record<string, any>,
  mobilePositions: {} as Record<string, any>,
  canvas: {
    canvasWidth: 800,
    canvasHeight: 600,
    gridColumns: 12,
    snapTolerance: 10
  },
  
  exportToJSON: function(): StructuredContentV3 {
    return {
      version: '3.0.0',
      nodes: this.nodes,
      positions: this.positions,
      mobilePositions: this.mobilePositions,
      canvas: this.canvas,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editorVersion: '2.0.0',
      },
    };
  },
  
  loadFromJSON: function(json: StructuredContentV2 | StructuredContentV3) {
    const validated = validateStructuredContent(json);
    
    this.nodes = validated.nodes;
    this.positions = validated.positions || {};
    this.mobilePositions = validated.mobilePositions || {};
    this.canvas = validated.canvas || {
      canvasWidth: 800,
      canvasHeight: 600,
      gridColumns: 12,
      snapTolerance: 10
    };
  },
  
  // Helper to set state for testing
  setState: function(nodes: any[], positions: Record<string, any>, mobilePositions: Record<string, any>) {
    this.nodes = nodes;
    this.positions = positions;
    this.mobilePositions = mobilePositions;
  },
  
  // Helper to clear state for testing
  clear: function() {
    this.nodes = [];
    this.positions = {};
    this.mobilePositions = {};
  }
};

describe('Export/Import Cycle Validation', () => {
  beforeEach(() => {
    mockEditorStore.clear();
  });

  describe('V3 Content Round-Trip', () => {
    it('should maintain perfect V3 content integrity through export/import cycle', () => {
      const node1Id = generateTestUUID();
      const node2Id = generateTestUUID();
      
      // Create complex V3 content with all features
      const originalNodes = [
        {
          id: node1Id,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<h2>Main Title</h2><p>Content with <strong>bold</strong> and <em>italic</em> text.</p>' },
            backgroundColor: '#f0f9ff',
            paddingX: 32,
            paddingY: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#0ea5e9',
            // Advanced properties
            desktopPadding: {
              top: 24, right: 32, bottom: 24, left: 32
            },
            mobilePadding: {
              top: 16, right: 20, bottom: 16, left: 20
            }
          }
        },
        {
          id: node2Id,
          type: 'imageBlock',
          data: {
            src: 'https://example.com/image.jpg',
            alt: 'Test image',
            htmlCaption: '<p>Image caption with <a href="#">link</a></p>',
            paddingX: 16,
            paddingY: 16,
            backgroundColor: '#fefce8',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#facc15',
          }
        }
      ];
      
      const originalPositions = {
        [node1Id]: { id: node1Id, x: 100, y: 50, width: 600, height: 150 },
        [node2Id]: { id: node2Id, x: 100, y: 220, width: 400, height: 300 }
      };
      
      const originalMobilePositions = {
        [node1Id]: { id: node1Id, x: 10, y: 20, width: 355, height: 120 },
        [node2Id]: { id: node2Id, x: 10, y: 160, width: 355, height: 250 }
      };
      
      // Set up initial state
      mockEditorStore.setState(originalNodes, originalPositions, originalMobilePositions);
      
      // Step 1: Export to JSON
      const exportedData = mockEditorStore.exportToJSON();
      
      // Verify export format
      expect(exportedData.version).toBe('3.0.0');
      expect(exportedData.nodes).toHaveLength(2);
      expect(exportedData.positions).toEqual(originalPositions);
      expect(exportedData.mobilePositions).toEqual(originalMobilePositions);
      expect(exportedData.metadata).toBeDefined();
      
      // Step 2: Simulate JSON serialization (what happens when saving to file)
      const jsonString = JSON.stringify(exportedData, null, 2);
      const parsedData = JSON.parse(jsonString);
      
      // Step 3: Clear state and import
      mockEditorStore.clear();
      expect(mockEditorStore.nodes).toHaveLength(0);
      
      mockEditorStore.loadFromJSON(parsedData);
      
      // Step 4: Verify perfect restoration
      expect(mockEditorStore.nodes).toHaveLength(2);
      expect(mockEditorStore.nodes).toEqual(originalNodes);
      expect(mockEditorStore.positions).toEqual(originalPositions);
      expect(mockEditorStore.mobilePositions).toEqual(originalMobilePositions);
      
      // Verify complex data preservation
      expect(mockEditorStore.nodes[0].data.content.htmlContent).toContain('<strong>bold</strong>');
      expect(mockEditorStore.nodes[0].data.desktopPadding).toEqual({
        top: 24, right: 32, bottom: 24, left: 32
      });
      expect(mockEditorStore.nodes[1].data.htmlCaption).toContain('<a href="#">link</a>');
    });
  });

  describe('V2 Import Compatibility', () => {
    it('should import V2 content and convert to V3 during load', () => {
      const nodeId = generateTestUUID();
      
      // Create V2 format data (as would be exported from legacy system)
      const v2Data: StructuredContentV2 = {
        version: '2.0.0',
        nodes: [{
          id: nodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Legacy V2 content</p>' },
            backgroundColor: '#f3f4f6',
            paddingX: 20,
            paddingY: 20,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#d1d5db',
          }
        }],
        layouts: {
          lg: [{ i: nodeId, x: 2, y: 1, w: 8, h: 3 }],
          md: [{ i: nodeId, x: 2, y: 1, w: 8, h: 3 }],
          sm: [{ i: nodeId, x: 0, y: 1, w: 6, h: 3 }],
          xs: [{ i: nodeId, x: 0, y: 1, w: 4, h: 3 }]
        },
        metadata: {
          createdAt: '2023-01-01T10:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z',
          editorVersion: '1.0.0'
        }
      };
      
      // Import V2 data
      mockEditorStore.loadFromJSON(v2Data);
      
      // Verify automatic V2 to V3 conversion
      expect(mockEditorStore.nodes).toHaveLength(1);
      expect(mockEditorStore.nodes[0].id).toBe(nodeId);
      expect(mockEditorStore.nodes[0].data.content.htmlContent).toBe('<p>Legacy V2 content</p>');
      
      // Verify positions were calculated from layouts
      expect(mockEditorStore.positions[nodeId]).toEqual({
        id: nodeId,
        x: 133.33333333333334, // 2 * (800/12)
        y: 50, // 1 * 50
        width: 533.3333333333334, // 8 * (800/12)
        height: 150 // 3 * 50
      });
      
      // Verify mobile positions were calculated
      expect(mockEditorStore.mobilePositions[nodeId]).toEqual({
        id: nodeId,
        x: 0, // 0 * (375/12)
        y: 50, // 1 * 50
        width: 125, // 4 * (375/12)
        height: 150 // 3 * 50
      });
      
      // Verify the content can now be exported as V3
      const reExported = mockEditorStore.exportToJSON();
      expect(reExported.version).toBe('3.0.0');
      expect(reExported.positions).toBeDefined();
      expect(reExported.mobilePositions).toBeDefined();
      expect(reExported.canvas).toBeDefined();
    });
  });

  describe('Cross-Device Settings Preservation', () => {
    it('should preserve mobile and desktop settings through export/import', () => {
      const nodeId = generateTestUUID();
      
      // Content with device-specific settings
      const deviceSpecificNodes = [{
        id: nodeId,
        type: 'richBlock',
        data: {
          content: { htmlContent: '<p>Cross-device content</p>' },
          backgroundColor: '#ecfdf5',
          paddingX: 24,
          paddingY: 24,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#10b981',
          // Device-specific padding
          desktopPadding: {
            top: 32, right: 48, bottom: 32, left: 48
          },
          mobilePadding: {
            top: 16, right: 20, bottom: 16, left: 20
          }
        }
      }];
      
      const desktopPositions = {
        [nodeId]: { id: nodeId, x: 200, y: 100, width: 400, height: 200 }
      };
      
      const mobilePositions = {
        [nodeId]: { id: nodeId, x: 10, y: 50, width: 355, height: 180 }
      };
      
      // Set up state with device-specific settings
      mockEditorStore.setState(deviceSpecificNodes, desktopPositions, mobilePositions);
      
      // Export
      const exported = mockEditorStore.exportToJSON();
      
      // Clear and import
      mockEditorStore.clear();
      mockEditorStore.loadFromJSON(exported);
      
      // Verify desktop settings preserved
      expect(mockEditorStore.positions[nodeId]).toEqual({
        id: nodeId, x: 200, y: 100, width: 400, height: 200
      });
      
      // Verify mobile settings preserved
      expect(mockEditorStore.mobilePositions[nodeId]).toEqual({
        id: nodeId, x: 10, y: 50, width: 355, height: 180
      });
      
      // Verify device-specific padding preserved
      expect(mockEditorStore.nodes[0].data.desktopPadding).toEqual({
        top: 32, right: 48, bottom: 32, left: 48
      });
      expect(mockEditorStore.nodes[0].data.mobilePadding).toEqual({
        top: 16, right: 20, bottom: 16, left: 20
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      const invalidData = {
        version: 'invalid',
        nodes: null,
        badProperty: true
      };
      
      // Should not throw, but create valid V3 structure through graceful fallback
      expect(() => {
        mockEditorStore.loadFromJSON(invalidData as any);
      }).not.toThrow();
      
      // Should result in valid V3 state
      const exported = mockEditorStore.exportToJSON();
      expect(exported.version).toBe('3.0.0');
      expect(exported.nodes).toBeDefined();
      expect(exported.positions).toBeDefined();
      expect(exported.mobilePositions).toBeDefined();
    });

    it('should handle missing required properties in import', () => {
      const incompleteData = {
        version: '3.0.0',
        nodes: [{
          id: generateTestUUID(),
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Incomplete data</p>' }
            // Missing required properties like backgroundColor, paddingX, etc.
          }
        }]
        // Missing positions, mobilePositions, canvas
      };
      
      // Should handle gracefully
      expect(() => {
        mockEditorStore.loadFromJSON(incompleteData as any);
      }).not.toThrow();
      
      // Should have reasonable defaults
      expect(mockEditorStore.nodes).toHaveLength(1);
      expect(mockEditorStore.positions).toBeDefined();
      expect(mockEditorStore.mobilePositions).toBeDefined();
      expect(mockEditorStore.canvas).toBeDefined();
    });
  });

  describe('Large Content Performance', () => {
    it('should handle large content exports/imports efficiently', () => {
      // Create content with many nodes
      const nodeCount = 20;
      const nodes = [];
      const positions: Record<string, any> = {};
      const mobilePositions: Record<string, any> = {};
      
      for (let i = 0; i < nodeCount; i++) {
        const nodeId = generateTestUUID();
        nodes.push({
          id: nodeId,
          type: 'richBlock',
          data: {
            content: { htmlContent: `<p>Node ${i} with substantial content that includes <strong>formatting</strong> and <em>various</em> <u>text</u> <span style="color: red;">styling</span> options.</p>` },
            backgroundColor: `hsl(${i * 18}, 70%, 95%)`,
            paddingX: 16 + (i % 5) * 4,
            paddingY: 16 + (i % 5) * 4,
            borderRadius: 4 + (i % 3) * 2,
            borderWidth: i % 2,
            borderColor: `hsl(${i * 25}, 60%, 70%)`,
          }
        });
        
        positions[nodeId] = {
          id: nodeId,
          x: (i % 3) * 250 + 50,
          y: Math.floor(i / 3) * 120 + 50,
          width: 200 + (i % 4) * 50,
          height: 100 + (i % 3) * 30
        };
        
        mobilePositions[nodeId] = {
          id: nodeId,
          x: 10,
          y: i * 80 + 20,
          width: 355,
          height: 70 + (i % 2) * 20
        };
      }
      
      const startTime = performance.now();
      
      // Set up large content
      mockEditorStore.setState(nodes, positions, mobilePositions);
      
      // Export
      const exported = mockEditorStore.exportToJSON();
      
      // Serialize
      const jsonString = JSON.stringify(exported);
      const parsed = JSON.parse(jsonString);
      
      // Clear and import
      mockEditorStore.clear();
      mockEditorStore.loadFromJSON(parsed);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Verify performance (should complete in reasonable time)
      expect(duration).toBeLessThan(1000); // Less than 1 second
      
      // Verify all content preserved
      expect(mockEditorStore.nodes).toHaveLength(nodeCount);
      expect(Object.keys(mockEditorStore.positions)).toHaveLength(nodeCount);
      expect(Object.keys(mockEditorStore.mobilePositions)).toHaveLength(nodeCount);
      
      // Verify complex content preserved
      expect(mockEditorStore.nodes[10].data.content.htmlContent).toContain('Node 10');
      expect(mockEditorStore.nodes[10].data.backgroundColor).toContain('hsl(');
      expect(mockEditorStore.positions[nodes[10].id].x).toBe(300); // (10 % 3) * 250 + 50 = (1 * 250) + 50 = 300
    });
  });
});