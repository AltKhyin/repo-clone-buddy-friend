// ABOUTME: Tests for PreviewBoundary component ensuring correct review page dimensions and responsive behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewBoundary } from './PreviewBoundary';

// Mock the useIsMobile hook
const mockUseIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe('PreviewBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should render desktop preview boundary with correct dimensions', () => {
      render(<PreviewBoundary />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toBeInTheDocument();

      // Should have desktop-specific classes
      expect(boundary).toHaveClass('preview-boundary-desktop');
    });

    it('should show 12-column grid indicators for desktop', () => {
      render(<PreviewBoundary />);

      const gridIndicators = screen.getAllByTestId('grid-column-indicator');
      expect(gridIndicators).toHaveLength(12);
    });

    it('should display correct desktop dimensions', () => {
      render(<PreviewBoundary />);

      const dimensionLabel = screen.getByText(/desktop.*12.*columns/i);
      expect(dimensionLabel).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should render mobile preview boundary with correct dimensions', () => {
      render(<PreviewBoundary />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toBeInTheDocument();

      // Should have mobile-specific classes
      expect(boundary).toHaveClass('preview-boundary-mobile');
    });

    it('should show single column for mobile', () => {
      render(<PreviewBoundary />);

      const gridIndicators = screen.getAllByTestId('grid-column-indicator');
      expect(gridIndicators).toHaveLength(1);
    });

    it('should display correct mobile dimensions', () => {
      render(<PreviewBoundary />);

      const dimensionLabel = screen.getByText(/mobile.*single.*column/i);
      expect(dimensionLabel).toBeInTheDocument();
    });
  });

  describe('Visibility and Controls', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should be visible by default', () => {
      render(<PreviewBoundary />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).not.toHaveClass('opacity-0');
    });

    it('should allow toggling visibility when showControls is true', () => {
      render(<PreviewBoundary showControls={true} />);

      const toggleButton = screen.getByRole('button', { name: 'Preview' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should hide controls when showControls is false', () => {
      render(<PreviewBoundary showControls={false} />);

      const toggleButton = screen.queryByRole('button', { name: 'Preview' });
      expect(toggleButton).not.toBeInTheDocument();
    });
  });

  describe('Grid Measurements', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should show gap measurements between columns', () => {
      render(<PreviewBoundary showMeasurements={true} />);

      const gapLabels = screen.getAllByText('2rem');
      expect(gapLabels.length).toBeGreaterThan(0);
    });

    it('should hide measurements when showMeasurements is false', () => {
      render(<PreviewBoundary showMeasurements={false} />);

      const gapLabels = screen.queryAllByText('2rem');
      expect(gapLabels).toHaveLength(0);
    });
  });

  describe('Canvas Integration', () => {
    it('should not interfere with React Flow interactions', () => {
      render(<PreviewBoundary />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toHaveClass('pointer-events-none');
    });

    it('should use canvas coordinates for positioning', () => {
      render(<PreviewBoundary canvasPosition={{ x: 100, y: 50 }} />);

      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toHaveStyle('left: 100px');
      expect(boundary).toHaveStyle('top: 50px');
      expect(boundary).toHaveStyle('position: absolute');
    });
  });

  describe('Responsive Behavior', () => {
    it('should switch layouts when viewport changes', () => {
      const { rerender } = render(<PreviewBoundary />);

      // Start with desktop
      mockUseIsMobile.mockReturnValue(false);
      rerender(<PreviewBoundary />);

      expect(screen.getByTestId('preview-boundary')).toHaveClass('preview-boundary-desktop');

      // Switch to mobile
      mockUseIsMobile.mockReturnValue(true);
      rerender(<PreviewBoundary />);

      expect(screen.getByTestId('preview-boundary')).toHaveClass('preview-boundary-mobile');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing viewport data gracefully', () => {
      mockUseIsMobile.mockReturnValue(undefined);

      expect(() => render(<PreviewBoundary />)).not.toThrow();
    });

    it('should render fallback when grid data is invalid', () => {
      render(<PreviewBoundary />);

      // Should still render the boundary container
      const boundary = screen.getByTestId('preview-boundary');
      expect(boundary).toBeInTheDocument();
    });
  });
});
