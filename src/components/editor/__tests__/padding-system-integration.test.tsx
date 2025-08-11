// ABOUTME: Integration tests for zero-margin canvas and individual padding system transformation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualPaddingEditor } from '../Inspector/shared/VisualPaddingEditor';
import { generateMobilePositions } from '@/store/editorStore';
import { NodeObject, BlockPositions } from '@/types/editor';

// Mock data for testing
const mockRichBlockData = {
  content: { htmlContent: '<p>Test content</p>' },
  paddingTop: 16,
  paddingRight: 24,
  paddingBottom: 12,
  paddingLeft: 20,
  backgroundColor: 'transparent',
};

const mockPositivePaddingData = {
  content: { htmlContent: '<p>Positive padding test</p>' },
  paddingTop: 10,
  paddingRight: 20,
  paddingBottom: 5,
  paddingLeft: 0,
  backgroundColor: 'transparent',
};

const mockZeroPaddingData = {
  content: { htmlContent: '<p>Zero padding test</p>' },
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  backgroundColor: 'transparent',
};

const mockLegacyBlockData = {
  content: { htmlContent: '<p>Legacy content</p>' },
  paddingX: 16,
  paddingY: 12,
  backgroundColor: 'transparent',
};

const mockNodes: NodeObject[] = [
  {
    id: 'block-1',
    type: 'richBlock',
    data: mockRichBlockData,
  },
  {
    id: 'block-2', 
    type: 'richBlock',
    data: mockLegacyBlockData,
  },
];

const mockDesktopPositions: BlockPositions = {
  'block-1': { id: 'block-1', x: 100, y: 0, width: 600, height: 200 },
  'block-2': { id: 'block-2', x: 100, y: 220, width: 600, height: 150 },
};

describe('Padding System Integration Tests', () => {
  describe('🎨 Visual Padding Editor Component', () => {
    it('should display individual padding sliders correctly', () => {
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockRichBlockData} 
          onChange={mockOnChange} 
        />
      );

      // Check that sliders show correct values
      expect(screen.getByDisplayValue('16')).toBeInTheDocument(); // Top
      expect(screen.getByDisplayValue('24')).toBeInTheDocument(); // Right
      expect(screen.getByDisplayValue('12')).toBeInTheDocument(); // Bottom
      expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // Left
    });

    it('should handle legacy paddingX/Y data with proper migration', () => {
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockLegacyBlockData} 
          onChange={mockOnChange} 
        />
      );

      // Legacy data should be converted to individual values
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(12); // Top (paddingY)
      expect(inputs[1]).toHaveValue(16); // Right (paddingX)
      expect(inputs[2]).toHaveValue(12); // Bottom (paddingY)
      expect(inputs[3]).toHaveValue(16); // Left (paddingX)
    });

    it('should update all sides when all-link mode is active', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockRichBlockData} 
          onChange={mockOnChange} 
        />
      );

      // Click link button to enable all-link mode
      const linkButton = screen.getByTitle('Link all sides');
      await user.click(linkButton);

      // Change top padding value
      const topInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(topInput);
      await user.type(topInput, '32');

      // Should update all sides when linked
      expect(mockOnChange).toHaveBeenCalledWith({
        paddingTop: 32,
        paddingRight: 32,
        paddingBottom: 32,
        paddingLeft: 32,
      });
    });

    it('should update only specific side when no linking is active', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockRichBlockData} 
          onChange={mockOnChange} 
        />
      );

      // Change right padding value (no linking)
      const rightInput = screen.getAllByRole('spinbutton')[1];
      await user.clear(rightInput);
      await user.type(rightInput, '40');

      // Should update only right side
      expect(mockOnChange).toHaveBeenCalledWith({
        paddingRight: 40,
      });
    });

    it('should link vertical sides (top/bottom) when vertical link is active', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockRichBlockData} 
          onChange={mockOnChange} 
        />
      );

      // Click vertical link button
      const verticalLinkButton = screen.getByTitle('Link top/bottom');
      await user.click(verticalLinkButton);

      // Change top padding value
      const topInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(topInput);
      await user.type(topInput, '28');

      // Should update both top and bottom
      expect(mockOnChange).toHaveBeenCalledWith({
        paddingTop: 28,
        paddingBottom: 28,
      });
    });

    it('should link horizontal sides (left/right) when horizontal link is active', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockRichBlockData} 
          onChange={mockOnChange} 
        />
      );

      // Click horizontal link button
      const horizontalLinkButton = screen.getByTitle('Link left/right');
      await user.click(horizontalLinkButton);

      // Change left padding value
      const leftInput = screen.getAllByRole('spinbutton')[3];
      await user.clear(leftInput);
      await user.type(leftInput, '36');

      // Should update both left and right
      expect(mockOnChange).toHaveBeenCalledWith({
        paddingLeft: 36,
        paddingRight: 36,
      });
    });

    it('should support positive padding values with proper validation and viewport awareness', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      // Test data with positive values for desktop viewport
      const positiveViewportData = {
        desktopPadding: { top: 10, right: 20, bottom: 5, left: 0 },
        mobilePadding: { top: 8, right: 12, bottom: 8, left: 12 },
      };
      
      render(
        <VisualPaddingEditor 
          data={positiveViewportData} 
          onChange={mockOnChange} 
        />
      );

      // Check that positive values are displayed correctly for desktop
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Top
      expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // Right
      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Bottom
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // Left

      // Check visual feedback for zero value (left side)
      expect(screen.getByText('Content touches left edge')).toBeInTheDocument();
      
      // Switch to mobile viewport
      const mobileButton = screen.getByText('Mobile');
      await user.click(mobileButton);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('8')).toBeInTheDocument(); // Mobile top
      });
    });

    it('should show zero padding visual feedback when all values are zero for current viewport', () => {
      const mockOnChange = vi.fn();
      
      // Test data with zero padding for desktop viewport only
      const zeroDesktopData = {
        desktopPadding: { top: 0, right: 0, bottom: 0, left: 0 },
        mobilePadding: { top: 8, right: 12, bottom: 8, left: 12 },
      };
      
      render(
        <VisualPaddingEditor 
          data={zeroDesktopData} 
          onChange={mockOnChange} 
        />
      );

      // Check zero padding feedback for desktop
      expect(screen.getByText('Zero padding')).toBeInTheDocument();
      expect(screen.getByText('Zero Padding Mode:')).toBeInTheDocument();
      expect(screen.getByText(/Content will touch block edges/)).toBeInTheDocument();
    });

    it('should validate padding values within 0 to +100 range', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockRichBlockData} 
          onChange={mockOnChange} 
        />
      );

      // Try to set value beyond maximum
      const topInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(topInput);
      await user.type(topInput, '150');

      // Should clamp to maximum value (100)
      expect(mockOnChange).toHaveBeenCalledWith({
        paddingTop: 100,
      });

      mockOnChange.mockClear();

      // Try to set value below minimum
      await user.clear(topInput);
      await user.type(topInput, '-50');

      // Should clamp to minimum value (0)
      expect(mockOnChange).toHaveBeenCalledWith({
        paddingTop: 0,
      });
    });

    it('should provide quick reset buttons for zero and default values', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mockPositivePaddingData} 
          onChange={mockOnChange} 
        />);

      // Click zero button
      const zeroButton = screen.getByText('Zero');
      await user.click(zeroButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
      });

      mockOnChange.mockClear();

      // Click default button
      const defaultButton = screen.getByText('Default (16px)');
      await user.click(defaultButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        paddingTop: 16,
        paddingRight: 16,
        paddingBottom: 16,
        paddingLeft: 16,
      });
    });

    it('should show enhanced feedback for true zero padding', () => {
      const zeroData = {
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
      };

      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={zeroData} 
          onChange={mockOnChange} 
        />
      );

      // Check enhanced zero padding feedback
      expect(screen.getByText('True Zero Padding Active:')).toBeInTheDocument();
      expect(screen.getByText('• Content touches block edges directly')).toBeInTheDocument();
      expect(screen.getByText('• Creates seamless layouts between adjacent blocks')).toBeInTheDocument();
      expect(screen.getByText('• Perfect for edge-to-edge content presentation')).toBeInTheDocument();
    });
  });

  describe('📱 Zero-Margin Mobile Layout Generation', () => {
    it('should generate mobile positions with zero margins', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      // All blocks should start at x=0 (no left margin)
      expect(mobilePositions['block-1'].x).toBe(0);
      expect(mobilePositions['block-2'].x).toBe(0);

      // Blocks should use full mobile canvas width (375px)
      expect(mobilePositions['block-1'].width).toBe(375);
      expect(mobilePositions['block-2'].width).toBe(375);

      // First block should start at y=0 (no top margin)
      expect(mobilePositions['block-1'].y).toBe(0);
    });

    it('should stack blocks vertically with proper spacing', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      // Second block should be positioned after first block + spacing
      const expectedY = mobilePositions['block-1'].height + 20; // 20px spacing
      expect(mobilePositions['block-2'].y).toBe(expectedY);
    });

    it('should preserve original height in mobile layout', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      // Heights should match desktop positions
      expect(mobilePositions['block-1'].height).toBe(mockDesktopPositions['block-1'].height);
      expect(mobilePositions['block-2'].height).toBe(mockDesktopPositions['block-2'].height);
    });

    it('should maintain proper reading order based on desktop Y positions', () => {
      // Create positions with reversed Y order
      const reversedPositions: BlockPositions = {
        'block-1': { id: 'block-1', x: 100, y: 300, width: 600, height: 200 },
        'block-2': { id: 'block-2', x: 100, y: 100, width: 600, height: 150 },
      };

      const mobilePositions = generateMobilePositions(mockNodes, reversedPositions);

      // block-2 should come first in mobile (has lower desktop Y)
      expect(mobilePositions['block-2'].y).toBe(0);
      expect(mobilePositions['block-1'].y).toBe(170); // 150 height + 20 spacing
    });
  });

  describe('🔧 Canvas Boundary Validation', () => {
    it('should allow blocks to touch canvas edges', () => {
      // Test that validation allows x=0, y=0 positioning
      const position = { id: 'test', x: 0, y: 0, width: 375, height: 200 };
      
      // This should not throw or modify the position for zero-margin system
      // Since validatePosition is internal, we test through mobile generation
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);
      
      expect(mobilePositions['block-1'].x).toBe(0);
      expect(mobilePositions['block-1'].y).toBe(0);
    });

    it('should allow full canvas width utilization', () => {
      const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);

      // Desktop canvas width is 800px, mobile is 375px
      expect(mobilePositions['block-1'].width).toBe(375);
      expect(mobilePositions['block-2'].width).toBe(375);
    });
  });

  describe('🎯 Legacy Padding Migration', () => {
    it('should convert paddingX/Y to individual padding fields', () => {
      const legacyData = {
        paddingX: 20,
        paddingY: 15,
        content: { htmlContent: '<p>Test</p>' }
      };

      // This would be handled by migratePaddingData in the store
      // Test the expected behavior indirectly through component rendering
      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={legacyData} 
          onChange={mockOnChange} 
        />
      );

      // Should display migrated values in input fields
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(15); // Top (paddingY)
      expect(inputs[1]).toHaveValue(20); // Right (paddingX)
      expect(inputs[2]).toHaveValue(15); // Bottom (paddingY)
      expect(inputs[3]).toHaveValue(20); // Left (paddingX)
    });

    it('should handle mixed legacy and new padding data', () => {
      const mixedData = {
        paddingTop: 25,
        paddingRight: 30,
        // Missing bottom and left - should not fall back to legacy
        paddingX: 16, // Should be ignored
        paddingY: 12, // Should be ignored
        content: { htmlContent: '<p>Test</p>' }
      };

      const mockOnChange = vi.fn();
      
      render(
        <VisualPaddingEditor 
          data={mixedData} 
          onChange={mockOnChange} 
        />
      );

      // Should use individual values where available, defaults otherwise
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(25); // Top
      expect(inputs[1]).toHaveValue(30); // Right
      expect(inputs[2]).toHaveValue(16); // Bottom (default)
      expect(inputs[3]).toHaveValue(16); // Left (default)
    });
  });

  describe('🚀 Performance and Edge Cases', () => {
    it('should handle empty nodes array gracefully', () => {
      const mobilePositions = generateMobilePositions([], {});
      expect(mobilePositions).toEqual({});
    });

    it('should handle missing desktop positions', () => {
      const nodesWithoutPositions = [mockNodes[0]];
      const partialPositions = {}; // Empty positions
      
      const mobilePositions = generateMobilePositions(nodesWithoutPositions, partialPositions);
      expect(mobilePositions).toEqual({});
    });

    it('should handle large numbers of blocks efficiently', () => {
      const largeNodeArray = Array.from({ length: 100 }, (_, i) => ({
        id: `block-${i}`,
        type: 'richBlock',
        data: mockRichBlockData,
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

      // Should complete in reasonable time (< 50ms for 100 blocks)
      expect(end - start).toBeLessThan(50);
      expect(Object.keys(mobilePositions)).toHaveLength(100);
    });
  });
});

describe('Integration Test Summary', () => {
  it('should demonstrate complete zero-margin padding system integration', () => {
    // This test validates the entire transformation is working together
    const testData = {
      paddingTop: 10,
      paddingRight: 15, 
      paddingBottom: 20,
      paddingLeft: 25,
    };

    const mockOnChange = vi.fn();
    
    render(
      <VisualPaddingEditor 
        data={testData} 
        onChange={mockOnChange} 
      />
    );

    // Visual padding editor displays individual values
    expect(screen.getByTitle('Top padding: 10px')).toBeInTheDocument();
    expect(screen.getByTitle('Right padding: 15px')).toBeInTheDocument();
    expect(screen.getByTitle('Bottom padding: 20px')).toBeInTheDocument();
    expect(screen.getByTitle('Left padding: 25px')).toBeInTheDocument();

    // Mobile generation uses zero margins
    const mobilePositions = generateMobilePositions(mockNodes, mockDesktopPositions);
    expect(mobilePositions['block-1'].x).toBe(0); // Zero left margin
    expect(mobilePositions['block-1'].width).toBe(375); // Full canvas width

    // Integration successful: UI + mobile + zero-margin all working together
    expect(true).toBe(true);
  });
});