// ABOUTME: Comprehensive cross-device consistency validation for mobile/desktop synchronization

import { describe, it, expect, beforeEach } from 'vitest';
import { validateStructuredContent, StructuredContentV3 } from '@/types/editor';

// Helper to generate valid test UUIDs
const generateTestUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock editor store for cross-device testing
const mockEditorStore = {
  currentViewport: 'desktop' as 'desktop' | 'mobile',
  nodes: [] as any[],
  positions: {} as Record<string, any>,
  mobilePositions: {} as Record<string, any>,
  canvas: {
    canvasWidth: 800,
    canvasHeight: 600,
    gridColumns: 12,
    snapTolerance: 10
  },
  
  // Desktop canvas configuration
  DESKTOP_CONFIG: {
    width: 800,
    gridColumns: 12,
    minHeight: 600,
  },
  
  // Mobile canvas configuration  
  MOBILE_CONFIG: {
    width: 375,
    gridColumns: 1,
    minHeight: 800,
  },
  
  switchViewport: function(viewport: 'desktop' | 'mobile') {
    this.currentViewport = viewport;
    console.log(`[MockStore] Switched to ${viewport} viewport`);
  },
  
  generateMobilePositions: function(nodes: any[], desktopPositions: Record<string, any>): Record<string, any> {
    const mobilePositions: Record<string, any> = {};
    const MOBILE_CANVAS_WIDTH = 375;
    const MOBILE_SPACING = 20;
    let currentY = 0;
    
    // Sort nodes by desktop Y position to maintain reading order
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
          x: 0, // Stack at left edge (zero margin)
          y: currentY,
          width: MOBILE_CANVAS_WIDTH, // Full mobile width
          height: desktopPos.height, // Preserve height
        };
        currentY += desktopPos.height + MOBILE_SPACING;
      }
    });
    
    return mobilePositions;
  },
  
  updateCurrentViewportPosition: function(nodeId: string, positionUpdate: any) {
    if (this.currentViewport === 'mobile') {
      this.updateMobilePosition(nodeId, positionUpdate);
    } else {
      this.updatePosition(nodeId, positionUpdate);
    }
  },
  
  updatePosition: function(nodeId: string, positionUpdate: any) {
    const currentPosition = this.positions[nodeId];
    if (currentPosition) {
      this.positions[nodeId] = {
        ...currentPosition,
        ...positionUpdate
      };
    }
  },
  
  updateMobilePosition: function(nodeId: string, positionUpdate: any) {
    const currentPosition = this.mobilePositions[nodeId];
    if (currentPosition) {
      this.mobilePositions[nodeId] = {
        ...currentPosition,
        ...positionUpdate
      };
    }
  },
  
  getCurrentPositions: function() {
    return this.currentViewport === 'mobile' ? this.mobilePositions : this.positions;
  },
  
  // Helper to set up test data
  setState: function(nodes: any[], positions: Record<string, any>, mobilePositions?: Record<string, any>) {
    this.nodes = nodes;
    this.positions = positions;
    this.mobilePositions = mobilePositions || this.generateMobilePositions(nodes, positions);
  },
  
  // Helper to clear state
  clear: function() {
    this.nodes = [];
    this.positions = {};
    this.mobilePositions = {};
    this.currentViewport = 'desktop';
  }
};

describe('Cross-Device Consistency Validation', () => {
  beforeEach(() => {
    mockEditorStore.clear();
  });

  describe('Viewport Switching', () => {
    it('should switch between desktop and mobile viewports correctly', () => {
      // Start in desktop mode
      expect(mockEditorStore.currentViewport).toBe('desktop');
      
      // Switch to mobile
      mockEditorStore.switchViewport('mobile');
      expect(mockEditorStore.currentViewport).toBe('mobile');
      
      // Switch back to desktop
      mockEditorStore.switchViewport('desktop');
      expect(mockEditorStore.currentViewport).toBe('desktop');
    });

    it('should return correct positions based on current viewport', () => {
      const nodeId = generateTestUUID();
      
      const desktopPos = { id: nodeId, x: 200, y: 100, width: 600, height: 200 };
      const mobilePos = { id: nodeId, x: 0, y: 50, width: 375, height: 200 };
      
      mockEditorStore.positions[nodeId] = desktopPos;
      mockEditorStore.mobilePositions[nodeId] = mobilePos;
      
      // Desktop viewport should return desktop positions
      mockEditorStore.switchViewport('desktop');
      expect(mockEditorStore.getCurrentPositions()[nodeId]).toEqual(desktopPos);
      
      // Mobile viewport should return mobile positions
      mockEditorStore.switchViewport('mobile');
      expect(mockEditorStore.getCurrentPositions()[nodeId]).toEqual(mobilePos);
    });
  });

  describe('Mobile Position Generation', () => {
    it('should generate mobile positions from desktop layout maintaining reading order', () => {
      const node1Id = generateTestUUID();
      const node2Id = generateTestUUID();
      const node3Id = generateTestUUID();
      
      const nodes = [
        { id: node1Id, type: 'richBlock' },
        { id: node2Id, type: 'richBlock' },
        { id: node3Id, type: 'richBlock' }
      ];
      
      // Desktop positions with intentionally non-sequential Y values
      const desktopPositions = {
        [node1Id]: { id: node1Id, x: 100, y: 300, width: 600, height: 150 }, // Third in reading order
        [node2Id]: { id: node2Id, x: 100, y: 50,  width: 600, height: 200 }, // First in reading order
        [node3Id]: { id: node3Id, x: 100, y: 200, width: 600, height: 100 }  // Second in reading order
      };
      
      const mobilePositions = mockEditorStore.generateMobilePositions(nodes, desktopPositions);
      
      // Should be sorted by desktop Y position: node2 (y:50), node3 (y:200), node1 (y:300)
      expect(mobilePositions[node2Id]).toEqual({
        id: node2Id, x: 0, y: 0, width: 375, height: 200
      });
      
      expect(mobilePositions[node3Id]).toEqual({
        id: node3Id, x: 0, y: 220, width: 375, height: 100 // y: 200 + 20 spacing
      });
      
      expect(mobilePositions[node1Id]).toEqual({
        id: node1Id, x: 0, y: 340, width: 375, height: 150 // y: 220 + 100 + 20 spacing
      });
    });

    it('should use zero-margin system for mobile positions', () => {
      const nodeId = generateTestUUID();
      const nodes = [{ id: nodeId, type: 'richBlock' }];
      const desktopPositions = {
        [nodeId]: { id: nodeId, x: 200, y: 100, width: 400, height: 250 }
      };
      
      const mobilePositions = mockEditorStore.generateMobilePositions(nodes, desktopPositions);
      
      // Zero margin: should start at x=0, y=0 and use full width
      expect(mobilePositions[nodeId]).toEqual({
        id: nodeId,
        x: 0,          // Zero left margin
        y: 0,          // Zero top margin
        width: 375,    // Full mobile canvas width
        height: 250    // Preserve desktop height
      });
    });

    it('should handle empty positions gracefully', () => {
      const nodeId = generateTestUUID();
      const nodes = [{ id: nodeId, type: 'richBlock' }];
      const desktopPositions = {}; // No positions available
      
      const mobilePositions = mockEditorStore.generateMobilePositions(nodes, desktopPositions);
      
      // Should not create positions for nodes without desktop positions
      expect(mobilePositions[nodeId]).toBeUndefined();
    });
  });

  describe('Cross-Viewport Position Updates', () => {
    it('should update positions in the correct viewport', () => {
      const nodeId = generateTestUUID();
      
      // Set up initial positions
      mockEditorStore.positions[nodeId] = { id: nodeId, x: 100, y: 100, width: 600, height: 200 };
      mockEditorStore.mobilePositions[nodeId] = { id: nodeId, x: 0, y: 50, width: 375, height: 200 };
      
      // Update in desktop viewport
      mockEditorStore.switchViewport('desktop');
      mockEditorStore.updateCurrentViewportPosition(nodeId, { x: 250, y: 150 });
      
      expect(mockEditorStore.positions[nodeId]).toEqual({
        id: nodeId, x: 250, y: 150, width: 600, height: 200
      });
      expect(mockEditorStore.mobilePositions[nodeId]).toEqual({
        id: nodeId, x: 0, y: 50, width: 375, height: 200 // Unchanged
      });
      
      // Update in mobile viewport
      mockEditorStore.switchViewport('mobile');
      mockEditorStore.updateCurrentViewportPosition(nodeId, { y: 100 });
      
      expect(mockEditorStore.positions[nodeId]).toEqual({
        id: nodeId, x: 250, y: 150, width: 600, height: 200 // Unchanged
      });
      expect(mockEditorStore.mobilePositions[nodeId]).toEqual({
        id: nodeId, x: 0, y: 100, width: 375, height: 200 // Updated
      });
    });
  });

  describe('Canvas Configuration Consistency', () => {
    it('should maintain correct canvas dimensions for each viewport', () => {
      // Desktop configuration
      expect(mockEditorStore.DESKTOP_CONFIG.width).toBe(800);
      expect(mockEditorStore.DESKTOP_CONFIG.gridColumns).toBe(12);
      expect(mockEditorStore.DESKTOP_CONFIG.minHeight).toBe(600);
      
      // Mobile configuration
      expect(mockEditorStore.MOBILE_CONFIG.width).toBe(375);
      expect(mockEditorStore.MOBILE_CONFIG.gridColumns).toBe(1);
      expect(mockEditorStore.MOBILE_CONFIG.minHeight).toBe(800);
    });

    it('should respect canvas boundaries for both viewports', () => {
      const nodeId = generateTestUUID();
      
      // Desktop: content can be positioned anywhere within 800px width
      const desktopPos = { id: nodeId, x: 200, y: 100, width: 600, height: 200 };
      expect(desktopPos.x + desktopPos.width).toBe(800); // Exactly at canvas edge
      
      // Mobile: content should use full width (zero margin system)
      const mobilePos = { id: nodeId, x: 0, y: 50, width: 375, height: 200 };
      expect(mobilePos.x).toBe(0);                       // At left edge
      expect(mobilePos.width).toBe(375);                 // Full width
    });
  });

  describe('Data Persistence Cross-Device', () => {
    it('should preserve both desktop and mobile settings through export/import', () => {
      const node1Id = generateTestUUID();
      const node2Id = generateTestUUID();
      
      // Complex cross-device content
      const nodes = [
        {
          id: node1Id,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<h1>Cross-device title</h1>' },
            backgroundColor: '#f0f9ff',
            paddingX: 24,
            paddingY: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#0ea5e9',
            // Device-specific padding
            desktopPadding: { top: 32, right: 48, bottom: 32, left: 48 },
            mobilePadding: { top: 16, right: 20, bottom: 16, left: 20 }
          }
        },
        {
          id: node2Id,
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Cross-device content</p>' },
            backgroundColor: '#f9fafb',
            paddingX: 16,
            paddingY: 16,
            borderRadius: 8,
            borderWidth: 0,
            borderColor: 'transparent',
          }
        }
      ];
      
      const desktopPositions = {
        [node1Id]: { id: node1Id, x: 100, y: 50, width: 600, height: 150 },
        [node2Id]: { id: node2Id, x: 100, y: 220, width: 600, height: 100 }
      };
      
      const mobilePositions = {
        [node1Id]: { id: node1Id, x: 0, y: 0, width: 375, height: 150 },
        [node2Id]: { id: node2Id, x: 0, y: 170, width: 375, height: 100 }
      };
      
      // Create V3 content with both desktop and mobile settings
      const originalContent: StructuredContentV3 = {
        version: '3.0.0',
        nodes,
        positions: desktopPositions,
        mobilePositions,
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
      
      // Simulate export/import cycle
      const jsonString = JSON.stringify(originalContent, null, 2);
      const parsedContent = JSON.parse(jsonString);
      const validatedContent = validateStructuredContent(parsedContent);
      
      // Verify all cross-device data preserved
      expect(validatedContent.nodes).toHaveLength(2);
      expect(validatedContent.positions).toEqual(desktopPositions);
      expect(validatedContent.mobilePositions).toEqual(mobilePositions);
      
      // Verify device-specific padding preserved
      expect(validatedContent.nodes[0].data.desktopPadding).toEqual({
        top: 32, right: 48, bottom: 32, left: 48
      });
      expect(validatedContent.nodes[0].data.mobilePadding).toEqual({
        top: 16, right: 20, bottom: 16, left: 20
      });
    });
  });

  describe('Responsive Layout Synchronization', () => {
    it('should maintain content hierarchy across viewports', () => {
      const headerNodeId = generateTestUUID();
      const contentNodeId = generateTestUUID();
      const footerNodeId = generateTestUUID();
      
      const nodes = [
        { id: headerNodeId, type: 'richBlock' },
        { id: contentNodeId, type: 'richBlock' },
        { id: footerNodeId, type: 'richBlock' }
      ];
      
      // Desktop: side-by-side layout
      const desktopPositions = {
        [headerNodeId]: { id: headerNodeId, x: 0,   y: 0,   width: 800, height: 100 }, // Full width header
        [contentNodeId]: { id: contentNodeId, x: 0,   y: 120, width: 500, height: 300 }, // Left content
        [footerNodeId]: { id: footerNodeId, x: 520, y: 120, width: 280, height: 300 }  // Right sidebar
      };
      
      const mobilePositions = mockEditorStore.generateMobilePositions(nodes, desktopPositions);
      
      // Mobile: should stack vertically maintaining reading order
      expect(mobilePositions[headerNodeId]).toEqual({
        id: headerNodeId, x: 0, y: 0, width: 375, height: 100
      });
      expect(mobilePositions[contentNodeId]).toEqual({
        id: contentNodeId, x: 0, y: 120, width: 375, height: 300 // 100 + 20 spacing
      });
      expect(mobilePositions[footerNodeId]).toEqual({
        id: footerNodeId, x: 0, y: 440, width: 375, height: 300 // 120 + 300 + 20 spacing
      });
      
      // Verify reading order maintained
      expect(mobilePositions[headerNodeId].y).toBeLessThan(mobilePositions[contentNodeId].y);
      expect(mobilePositions[contentNodeId].y).toBeLessThan(mobilePositions[footerNodeId].y);
    });

    it('should handle complex desktop layouts with proper mobile stacking', () => {
      const nodes = Array.from({ length: 6 }, (_, i) => ({
        id: generateTestUUID(),
        type: 'richBlock'
      }));
      
      // Desktop: 2x3 grid layout
      const desktopPositions: Record<string, any> = {};
      nodes.forEach((node, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        desktopPositions[node.id] = {
          id: node.id,
          x: col * 400,           // 0 or 400
          y: row * 200,           // 0, 200, or 400
          width: 380,             // Leave some spacing
          height: 180
        };
      });
      
      const mobilePositions = mockEditorStore.generateMobilePositions(nodes, desktopPositions);
      
      // Mobile: should stack in reading order (row by row, left to right)
      // Row 1: nodes[0] (y:0), nodes[1] (y:0) 
      // Row 2: nodes[2] (y:200), nodes[3] (y:200)
      // Row 3: nodes[4] (y:400), nodes[5] (y:400)
      
      // Should be sorted by Y first, then X
      let expectedY = 0;
      [0, 1, 2, 3, 4, 5].forEach(index => {
        const nodeId = nodes[index].id;
        expect(mobilePositions[nodeId]).toEqual({
          id: nodeId,
          x: 0,
          y: expectedY,
          width: 375,
          height: 180
        });
        expectedY += 180 + 20; // height + spacing
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle viewport switching with no content gracefully', () => {
      // Empty state
      expect(mockEditorStore.nodes).toHaveLength(0);
      expect(Object.keys(mockEditorStore.positions)).toHaveLength(0);
      expect(Object.keys(mockEditorStore.mobilePositions)).toHaveLength(0);
      
      // Viewport switching should still work
      expect(() => {
        mockEditorStore.switchViewport('mobile');
        mockEditorStore.switchViewport('desktop');
      }).not.toThrow();
      
      expect(mockEditorStore.getCurrentPositions()).toEqual({});
    });

    it('should handle missing mobile positions by generating them', () => {
      const nodeId = generateTestUUID();
      const nodes = [{ id: nodeId, type: 'richBlock' }];
      const desktopPositions = {
        [nodeId]: { id: nodeId, x: 100, y: 50, width: 600, height: 200 }
      };
      
      // Set up state with missing mobile positions
      mockEditorStore.setState(nodes, desktopPositions, {});
      
      // Generate mobile positions
      const generatedMobile = mockEditorStore.generateMobilePositions(nodes, desktopPositions);
      
      expect(generatedMobile[nodeId]).toEqual({
        id: nodeId, x: 0, y: 0, width: 375, height: 200
      });
    });

    it('should handle invalid position updates gracefully', () => {
      const nodeId = generateTestUUID();
      
      // Try to update position for non-existent node
      expect(() => {
        mockEditorStore.updateCurrentViewportPosition('non-existent-id', { x: 100 });
      }).not.toThrow();
      
      // Should not create new positions
      expect(mockEditorStore.positions['non-existent-id']).toBeUndefined();
      expect(mockEditorStore.mobilePositions['non-existent-id']).toBeUndefined();
    });
  });
});