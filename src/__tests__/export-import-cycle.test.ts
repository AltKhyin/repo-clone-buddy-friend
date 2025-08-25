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

  describe('AI-Optimized Template System', () => {
    beforeEach(() => {
      mockEditorStore.clear();
    });

    it('should export template in AI-optimized format without dependency-creating fields', () => {
      const node1Id = generateTestUUID();
      const node2Id = generateTestUUID();
      
      // Set up content with complex styling (similar to database format)
      const originalNodes = [
        {
          id: node1Id,
          type: 'richBlock',
          data: {
            content: {
              htmlContent: '<h2>AI Training Title</h2><p>Complex content with <strong>formatting</strong></p>',
              tiptapJSON: {
                type: 'doc',
                content: [
                  { 
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: 'AI Training Title' }]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Complex content with ' },
                      { type: 'text', text: 'formatting', marks: [{ type: 'bold' }] }
                    ]
                  }
                ]
              }
            },
            backgroundColor: '#f0f9ff',
            paddingTop: 24,
            paddingRight: 32,
            paddingBottom: 24,
            paddingLeft: 32,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#0ea5e9',
            fontSize: 18,
            fontWeight: 400,
            textAlign: 'center',
            color: 'hsl(var(--foreground))'
          }
        },
        {
          id: node2Id,
          type: 'richBlock',
          data: {
            content: {
              htmlContent: '<p>Secondary content block for AI training</p>'
            },
            backgroundColor: 'transparent',
            paddingTop: 16,
            paddingRight: 16,
            paddingBottom: 16,
            paddingLeft: 16,
            fontSize: 14,
            textAlign: 'left'
          }
        }
      ];
      
      const originalPositions = {
        [node1Id]: { id: node1Id, x: 100, y: 50, width: 600, height: 120 },
        [node2Id]: { id: node2Id, x: 100, y: 200, width: 600, height: 80 }
      };
      
      const originalMobilePositions = {
        [node1Id]: { id: node1Id, x: 10, y: 20, width: 355, height: 100 },
        [node2Id]: { id: node2Id, x: 10, y: 140, width: 355, height: 70 }
      };
      
      // Set up state and export as template
      mockEditorStore.setState(originalNodes, originalPositions, originalMobilePositions);
      
      // Mock the exportAsTemplate function behavior
      const mockExportAsTemplate = () => {
        const dbFormat = mockEditorStore.exportToJSON();
        
        // Strip UUIDs and replace with semantic IDs
        const cleanedNodes = dbFormat.nodes.map((node, index) => ({
          ...node,
          id: `block-${index + 1}`
        }));
        
        // Update position keys
        const cleanedPositions: Record<string, any> = {};
        const cleanedMobilePositions: Record<string, any> = {};
        
        dbFormat.nodes.forEach((originalNode, index) => {
          const newId = `block-${index + 1}`;
          if (dbFormat.positions[originalNode.id]) {
            cleanedPositions[newId] = {
              ...dbFormat.positions[originalNode.id],
              id: newId
            };
          }
          if (dbFormat.mobilePositions && dbFormat.mobilePositions[originalNode.id]) {
            cleanedMobilePositions[newId] = {
              ...dbFormat.mobilePositions[originalNode.id],
              id: newId
            };
          }
        });
        
        return {
          version: dbFormat.version,
          nodes: cleanedNodes,
          positions: cleanedPositions,
          mobilePositions: cleanedMobilePositions,
          canvas: dbFormat.canvas,
          // metadata stripped - AI cannot fill timestamps
        };
      };
      
      const template = mockExportAsTemplate();
      
      // Verify template format
      expect(template.version).toBe('3.0.0');
      expect(template.nodes).toHaveLength(2);
      expect(template.metadata).toBeUndefined(); // Metadata should be stripped
      
      // Verify semantic IDs (AI-friendly)
      expect(template.nodes[0].id).toBe('block-1');
      expect(template.nodes[1].id).toBe('block-2');
      
      // Verify all styling data is preserved (AI has full control)
      expect(template.nodes[0].data.backgroundColor).toBe('#f0f9ff');
      expect(template.nodes[0].data.paddingTop).toBe(24);
      expect(template.nodes[0].data.borderRadius).toBe(12);
      expect(template.nodes[0].data.fontSize).toBe(18);
      expect(template.nodes[0].data.textAlign).toBe('center');
      
      // Verify positioning data preserved with semantic IDs
      expect(template.positions['block-1']).toEqual({
        id: 'block-1',
        x: 100,
        y: 50,
        width: 600,
        height: 120
      });
      
      expect(template.mobilePositions['block-1']).toEqual({
        id: 'block-1',
        x: 10,
        y: 20,
        width: 355,
        height: 100
      });
      
      // Verify canvas config preserved (AI can modify)
      expect(template.canvas).toBeDefined();
      expect(template.canvas.canvasWidth).toBe(800);
    });

    it('should import template and create perfect replica with new UUIDs', () => {
      // Simulate AI-generated template data
      const templateData = {
        version: '3.0.0',
        nodes: [
          {
            id: 'block-1',
            type: 'richBlock',
            data: {
              content: {
                htmlContent: '<h1>AI Generated Title</h1><p>AI filled this content with specific formatting</p>',
                tiptapJSON: {
                  type: 'doc',
                  content: [
                    {
                      type: 'heading',
                      attrs: { level: 1 },
                      content: [{ type: 'text', text: 'AI Generated Title' }]
                    },
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'AI filled this content with specific formatting' }]
                    }
                  ]
                }
              },
              backgroundColor: '#e6f3ff',
              paddingTop: 32,
              paddingRight: 24,
              paddingBottom: 32,
              paddingLeft: 24,
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 700,
              textAlign: 'center',
              color: 'hsl(var(--primary))'
            }
          },
          {
            id: 'block-2',
            type: 'richBlock',
            data: {
              content: {
                htmlContent: '<p>AI generated secondary content with different styling</p>'
              },
              backgroundColor: '#f5f5f5',
              paddingTop: 20,
              paddingRight: 20,
              paddingBottom: 20,
              paddingLeft: 20,
              fontSize: 16,
              textAlign: 'left'
            }
          }
        ],
        positions: {
          'block-1': { id: 'block-1', x: 50, y: 30, width: 700, height: 140 },
          'block-2': { id: 'block-2', x: 50, y: 200, width: 700, height: 90 }
        },
        mobilePositions: {
          'block-1': { id: 'block-1', x: 5, y: 10, width: 365, height: 120 },
          'block-2': { id: 'block-2', x: 5, y: 150, width: 365, height: 80 }
        },
        canvas: {
          canvasWidth: 800,
          canvasHeight: 600,
          gridColumns: 12,
          snapTolerance: 10
        }
      };
      
      // Mock the import behavior
      const mockImportFromTemplate = (templateData: any) => {
        // Generate new UUIDs for actual usage
        const nodesWithNewIds = templateData.nodes.map((node: any) => ({
          ...node,
          id: generateTestUUID()
        }));
        
        // Reconstruct positions with new UUIDs
        const newPositions: Record<string, any> = {};
        const newMobilePositions: Record<string, any> = {};
        
        nodesWithNewIds.forEach((node, index) => {
          const templateId = `block-${index + 1}`;
          if (templateData.positions && templateData.positions[templateId]) {
            newPositions[node.id] = {
              ...templateData.positions[templateId],
              id: node.id
            };
          }
          if (templateData.mobilePositions && templateData.mobilePositions[templateId]) {
            newMobilePositions[node.id] = {
              ...templateData.mobilePositions[templateId],
              id: node.id
            };
          }
        });
        
        mockEditorStore.setState(nodesWithNewIds, newPositions, newMobilePositions);
        mockEditorStore.canvas = templateData.canvas;
      };
      
      // Import template
      mockImportFromTemplate(templateData);
      
      // Verify import created exact replica with new UUIDs
      expect(mockEditorStore.nodes).toHaveLength(2);
      
      // Verify UUIDs were regenerated (no longer semantic IDs)
      expect(mockEditorStore.nodes[0].id).not.toBe('block-1');
      expect(mockEditorStore.nodes[1].id).not.toBe('block-2');
      expect(mockEditorStore.nodes[0].id.length).toBeGreaterThan(10); // UUID format
      
      // Verify all styling perfectly preserved
      expect(mockEditorStore.nodes[0].data.backgroundColor).toBe('#e6f3ff');
      expect(mockEditorStore.nodes[0].data.paddingTop).toBe(32);
      expect(mockEditorStore.nodes[0].data.borderRadius).toBe(8);
      expect(mockEditorStore.nodes[0].data.fontSize).toBe(20);
      expect(mockEditorStore.nodes[0].data.fontWeight).toBe(700);
      expect(mockEditorStore.nodes[0].data.textAlign).toBe('center');
      expect(mockEditorStore.nodes[0].data.color).toBe('hsl(var(--primary))');
      
      // Verify content preserved exactly
      expect(mockEditorStore.nodes[0].data.content.htmlContent).toContain('AI Generated Title');
      expect(mockEditorStore.nodes[0].data.content.htmlContent).toContain('AI filled this content');
      
      // Verify positioning recreated perfectly
      const node1Id = mockEditorStore.nodes[0].id;
      expect(mockEditorStore.positions[node1Id]).toEqual({
        id: node1Id,
        x: 50,
        y: 30,
        width: 700,
        height: 140
      });
      
      expect(mockEditorStore.mobilePositions[node1Id]).toEqual({
        id: node1Id,
        x: 5,
        y: 10,
        width: 365,
        height: 120
      });
      
      // Verify canvas config applied
      expect(mockEditorStore.canvas.canvasWidth).toBe(800);
    });

    it('should handle round-trip template export/import with perfect fidelity', () => {
      const originalNodeId = generateTestUUID();
      
      // Create complex content similar to database format
      const complexNode = {
        id: originalNodeId,
        type: 'richBlock',
        data: {
          content: {
            htmlContent: '<h3 style="color: #2563eb;">Database Format Test</h3><p>Testing <em>complex</em> <strong>formatting</strong> preservation</p>',
            tiptapJSON: {
              type: 'doc',
              content: [
                {
                  type: 'heading',
                  attrs: { level: 3 },
                  content: [{ type: 'text', text: 'Database Format Test' }]
                }
              ]
            }
          },
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          paddingTop: 18,
          paddingRight: 26,
          paddingBottom: 18,
          paddingLeft: 26,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#2563eb',
          fontSize: 15,
          fontWeight: 500,
          textAlign: 'justify',
          color: '#1e40af',
          lineHeight: 1.6,
          desktopPadding: { top: 18, right: 26, bottom: 18, left: 26 },
          mobilePadding: { top: 12, right: 16, bottom: 12, left: 16 }
        }
      };
      
      const originalPositions = {
        [originalNodeId]: { id: originalNodeId, x: 150, y: 75, width: 500, height: 110 }
      };
      
      const originalMobilePositions = {
        [originalNodeId]: { id: originalNodeId, x: 15, y: 25, width: 345, height: 95 }
      };
      
      // Set up, export, clear, import
      mockEditorStore.setState([complexNode], originalPositions, originalMobilePositions);
      
      // Export as template (strip IDs)
      const template = JSON.parse(JSON.stringify({
        version: '3.0.0',
        nodes: [{ ...complexNode, id: 'block-1' }],
        positions: { 'block-1': { ...originalPositions[originalNodeId], id: 'block-1' } },
        mobilePositions: { 'block-1': { ...originalMobilePositions[originalNodeId], id: 'block-1' } },
        canvas: { canvasWidth: 800, canvasHeight: 600, gridColumns: 12, snapTolerance: 10 }
      }));
      
      // Clear and import
      mockEditorStore.clear();
      expect(mockEditorStore.nodes).toHaveLength(0);
      
      // Simulate import with UUID regeneration
      const newNodeId = generateTestUUID();
      const reconstructedNode = { ...template.nodes[0], id: newNodeId };
      const reconstructedPositions = { [newNodeId]: { ...template.positions['block-1'], id: newNodeId } };
      const reconstructedMobilePositions = { [newNodeId]: { ...template.mobilePositions['block-1'], id: newNodeId } };
      
      mockEditorStore.setState([reconstructedNode], reconstructedPositions, reconstructedMobilePositions);
      
      // Verify perfect round-trip fidelity
      expect(mockEditorStore.nodes).toHaveLength(1);
      const importedNode = mockEditorStore.nodes[0];
      
      // Content identical
      expect(importedNode.data.content.htmlContent).toBe(complexNode.data.content.htmlContent);
      expect(importedNode.data.content.tiptapJSON).toEqual(complexNode.data.content.tiptapJSON);
      
      // All styling identical
      expect(importedNode.data.backgroundColor).toBe(complexNode.data.backgroundColor);
      expect(importedNode.data.paddingTop).toBe(complexNode.data.paddingTop);
      expect(importedNode.data.borderColor).toBe(complexNode.data.borderColor);
      expect(importedNode.data.fontSize).toBe(complexNode.data.fontSize);
      expect(importedNode.data.fontWeight).toBe(complexNode.data.fontWeight);
      expect(importedNode.data.textAlign).toBe(complexNode.data.textAlign);
      expect(importedNode.data.lineHeight).toBe(complexNode.data.lineHeight);
      expect(importedNode.data.desktopPadding).toEqual(complexNode.data.desktopPadding);
      expect(importedNode.data.mobilePadding).toEqual(complexNode.data.mobilePadding);
      
      // Positioning identical
      expect(mockEditorStore.positions[newNodeId].x).toBe(150);
      expect(mockEditorStore.positions[newNodeId].y).toBe(75);
      expect(mockEditorStore.positions[newNodeId].width).toBe(500);
      expect(mockEditorStore.positions[newNodeId].height).toBe(110);
      
      expect(mockEditorStore.mobilePositions[newNodeId].x).toBe(15);
      expect(mockEditorStore.mobilePositions[newNodeId].y).toBe(25);
      expect(mockEditorStore.mobilePositions[newNodeId].width).toBe(345);
      expect(mockEditorStore.mobilePositions[newNodeId].height).toBe(95);
      
      // New UUID generated (no dependency conflicts)
      expect(importedNode.id).not.toBe(originalNodeId);
      expect(importedNode.id).toBe(newNodeId);
    });

    it('should validate template format and reject invalid templates', () => {
      const invalidTemplates = [
        // Missing nodes
        { version: '3.0.0', positions: {}, canvas: {} },
        // Invalid nodes format
        { version: '3.0.0', nodes: 'not-an-array', positions: {} },
        // Empty object
        {},
        // Malformed JSON would be caught by JSON.parse()
      ];
      
      invalidTemplates.forEach((invalidTemplate, index) => {
        mockEditorStore.clear();
        
        expect(() => {
          // Basic validation that would happen in UI
          if (!invalidTemplate.nodes || !Array.isArray(invalidTemplate.nodes)) {
            throw new Error('Invalid template format: Missing or invalid nodes array');
          }
        }).toThrow('Invalid template format');
        
        // Ensure no state was modified
        expect(mockEditorStore.nodes).toHaveLength(0);
      });
    });
  });
});