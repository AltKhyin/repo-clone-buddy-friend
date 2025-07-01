// ABOUTME: Tests for PreviewBoundaryNode React Flow component ensuring canvas anchoring

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewBoundaryNode } from './PreviewBoundaryNode';

// Mock the useIsMobile hook
const mockUseIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe('PreviewBoundaryNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
  });

  describe('React Flow Node Integration', () => {
    it('should render as a React Flow node without absolute positioning', () => {
      render(<PreviewBoundaryNode />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toBeInTheDocument();

      // Should not have transform positioning (that's handled by React Flow)
      const computedStyle = window.getComputedStyle(boundary);
      expect(computedStyle.transform).toBe('');
    });

    it('should have pointer-events-none for canvas integration', () => {
      render(<PreviewBoundaryNode />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toHaveClass('pointer-events-none');
    });

    it('should accept data props from React Flow', () => {
      const nodeData = {
        showControls: true,
        showMeasurements: true,
      };

      render(<PreviewBoundaryNode data={nodeData} />);

      // Controls should be shown
      const previewButton = screen.getByRole('button', { name: 'Preview' });
      expect(previewButton).toBeInTheDocument();
    });
  });

  describe('Canvas Positioning', () => {
    it('should use relative positioning suitable for React Flow', () => {
      render(<PreviewBoundaryNode />);

      const container = screen.getByTestId('preview-boundary').parentElement;
      expect(container).toHaveClass('relative');
    });

    it('should position controls relative to the node', () => {
      render(<PreviewBoundaryNode data={{ showControls: true }} />);

      const controlsContainer = screen.getByRole('button', { name: 'Preview' }).parentElement;
      expect(controlsContainer).toHaveClass('absolute');
      expect(controlsContainer).toHaveClass('-top-12');
    });

    it('should render behind other elements with negative z-index', () => {
      render(<PreviewBoundaryNode />);

      const container = screen.getByTestId('preview-boundary').parentElement;
      expect(container).toHaveStyle('z-index: -1');
    });
  });

  describe('Grid Layout Display', () => {
    it('should show 12 columns for desktop', () => {
      mockUseIsMobile.mockReturnValue(false);

      render(<PreviewBoundaryNode />);

      const gridIndicators = screen.getAllByTestId('grid-column-indicator');
      expect(gridIndicators).toHaveLength(12);
    });

    it('should show single column for mobile', () => {
      mockUseIsMobile.mockReturnValue(true);

      render(<PreviewBoundaryNode />);

      const gridIndicators = screen.getAllByTestId('grid-column-indicator');
      expect(gridIndicators).toHaveLength(1);
    });

    it('should display correct desktop dimensions', () => {
      mockUseIsMobile.mockReturnValue(false);

      render(<PreviewBoundaryNode />);

      const dimensionLabel = screen.getByText('Desktop - 12 Columns');
      expect(dimensionLabel).toBeInTheDocument();
    });
  });

  describe('Node Configuration', () => {
    it('should handle empty data gracefully', () => {
      render(<PreviewBoundaryNode data={{}} />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toBeInTheDocument();
    });

    it('should handle undefined data', () => {
      render(<PreviewBoundaryNode data={undefined} />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toBeInTheDocument();
    });

    it('should respect showControls setting', () => {
      render(<PreviewBoundaryNode data={{ showControls: false }} />);

      const previewButton = screen.queryByRole('button', { name: 'Preview' });
      expect(previewButton).not.toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render corner markers', () => {
      render(<PreviewBoundaryNode />);

      const boundary = screen.getByTestId('preview-boundary');
      const markers = boundary.querySelectorAll('.bg-blue-600.rounded-full');
      expect(markers).toHaveLength(4); // Four corner markers
    });

    it('should show dimension label', () => {
      render(<PreviewBoundaryNode />);

      const dimensionLabel = screen.getByText(/desktop.*columns/i);
      expect(dimensionLabel).toBeInTheDocument();
      expect(dimensionLabel).toHaveClass('bg-blue-600', 'text-white');
    });
  });
});
