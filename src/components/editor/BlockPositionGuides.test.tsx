// ABOUTME: Tests for BlockPositionGuides ensuring proper visual feedback during drag operations

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlockPositionGuides } from './BlockPositionGuides';

describe('BlockPositionGuides', () => {
  const mockNodes = [
    {
      id: 'node-1',
      position: { x: 100, y: 100 },
      width: 300,
      height: 150,
    },
    {
      id: 'node-2',
      position: { x: 200, y: 300 },
      width: 400,
      height: 200,
    },
    {
      id: 'preview-boundary-node',
      position: { x: 50, y: 50 },
      width: 1200,
      height: 800,
    },
  ];

  describe('Visibility Control', () => {
    it('should not render anything when not dragging', () => {
      const { container } = render(
        <BlockPositionGuides isDragging={false} draggedNodeId={null} nodes={mockNodes} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render anything when dragging but no draggedNodeId', () => {
      const { container } = render(
        <BlockPositionGuides isDragging={true} draggedNodeId={null} nodes={mockNodes} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render guides when dragging with valid draggedNodeId', () => {
      render(<BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />);

      // Should render guides for other nodes (excluding dragged node and preview boundary)
      const guides = document.querySelectorAll('.border-dashed.border-blue-300');
      expect(guides.length).toBeGreaterThan(0);
    });
  });

  describe('Node Filtering', () => {
    it('should exclude the dragged node from guides', () => {
      render(<BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />);

      // Should not show guide for the dragged node (node-1)
      // We check this by ensuring only one guide is shown (for node-2)
      const guides = document.querySelectorAll('.border-dashed.border-blue-300');
      expect(guides.length).toBe(1);
    });

    it('should exclude preview boundary node from guides', () => {
      render(<BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />);

      // Should not show guide for preview boundary
      // We check this by ensuring only one guide is shown (for node-2, excluding preview boundary)
      const guides = document.querySelectorAll('.border-dashed.border-blue-300');
      expect(guides.length).toBe(1);
    });

    it('should include other nodes in guides', () => {
      const { container } = render(
        <BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />
      );

      // Should show guide for node-2 but not node-1 or preview-boundary
      const guideElements = container.querySelectorAll('.border-dashed.border-blue-300');
      expect(guideElements.length).toBe(1); // Only node-2 should be shown
    });
  });

  describe('Visual Elements', () => {
    it('should render corner markers for each guide', () => {
      const { container } = render(
        <BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />
      );

      // Each guide should have 4 corner markers
      const cornerMarkers = container.querySelectorAll('.bg-blue-400.rounded-full');
      expect(cornerMarkers.length).toBe(4); // 4 corners for node-2
    });

    it('should render block type indicator', () => {
      render(<BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />);

      expect(screen.getByText('Block')).toBeInTheDocument();
    });

    it('should apply correct positioning styles', () => {
      const { container } = render(
        <BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />
      );

      const guideElement = container.querySelector('.border-dashed.border-blue-300');
      expect(guideElement).toHaveStyle({
        left: '200px',
        top: '300px',
        width: '400px',
        height: '200px',
      });
    });
  });

  describe('Styling and Layout', () => {
    it('should use correct CSS classes for visual styling', () => {
      const { container } = render(
        <BlockPositionGuides isDragging={true} draggedNodeId="node-1" nodes={mockNodes} />
      );

      const guideContainer = container.firstChild;
      expect(guideContainer).toHaveClass('absolute', 'inset-0', 'pointer-events-none', 'z-10');

      const guideElement = container.querySelector('.border-dashed');
      expect(guideElement).toHaveClass(
        'absolute',
        'border-2',
        'border-dashed',
        'border-blue-300',
        'bg-blue-50',
        'bg-opacity-20',
        'rounded-md'
      );
    });

    it('should handle nodes with style-based dimensions', () => {
      const nodesWithStyleDimensions = [
        {
          id: 'styled-node',
          position: { x: 100, y: 100 },
          style: { width: '250px', height: '180px' },
        },
      ];

      const { container } = render(
        <BlockPositionGuides
          isDragging={true}
          draggedNodeId="other-node"
          nodes={nodesWithStyleDimensions}
        />
      );

      const guideElement = container.querySelector('.border-dashed.border-blue-300');
      expect(guideElement).toHaveStyle({
        width: '250px',
        height: '180px',
      });
    });

    it('should use default dimensions when width/height not provided', () => {
      const nodesWithoutDimensions = [
        {
          id: 'no-dims-node',
          position: { x: 50, y: 75 },
        },
      ];

      const { container } = render(
        <BlockPositionGuides
          isDragging={true}
          draggedNodeId="other-node"
          nodes={nodesWithoutDimensions}
        />
      );

      const guideElement = container.querySelector('.border-dashed.border-blue-300');
      expect(guideElement).toHaveStyle({
        width: '400px', // default width
        height: '100px', // default height
      });
    });
  });
});
