// ABOUTME: Test suite for WYSIWYGRenderer V3 native rendering component with positioning validation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WYSIWYGRenderer from '../WYSIWYGRenderer';
import { StructuredContentV3 } from '@/types/editor';

// Mock useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

describe('WYSIWYGRenderer', () => {
  const mockV3Content: StructuredContentV3 = {
    version: '3.0.0',
    nodes: [
      {
        id: 'text-block-1',
        type: 'textBlock',
        data: {
          htmlContent: '<p>Test text content</p>',
        },
      },
      {
        id: 'rich-block-1',
        type: 'richBlock',
        data: {
          content: {
            htmlContent: '<h2>Test Rich Content</h2><p>Rich block content</p>',
          },
        },
      },
    ],
    positions: {
      'text-block-1': {
        id: 'text-block-1',
        x: 0,
        y: 0,
        width: 400,
        height: 100,
      },
      'rich-block-1': {
        id: 'rich-block-1',
        x: 0,
        y: 120,
        width: 600,
        height: 200,
      },
    },
    canvas: {
      canvasWidth: 800,
      canvasHeight: 400,
      gridColumns: 12,
      snapTolerance: 10,
    },
    metadata: {
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      editorVersion: '2.0.0',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Content Validation', () => {
    it('should render V3 content successfully', () => {
      render(<WYSIWYGRenderer content={mockV3Content} />);
      
      // Should render the canvas container
      const canvas = screen.getByTestId('canvas-type');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('data-canvas-type', 'wysiwyg');
    });

    it('should show error for unsupported content version', () => {
      const invalidContent = {
        ...mockV3Content,
        version: '2.0.0' as any,
      };

      render(<WYSIWYGRenderer content={invalidContent} />);
      
      expect(screen.getByText('Unsupported Content Format')).toBeInTheDocument();
      expect(screen.getByText(/Expected V3.0.0, received: 2.0.0/)).toBeInTheDocument();
    });

    it('should show empty state when no nodes present', () => {
      const emptyContent = {
        ...mockV3Content,
        nodes: [],
      };

      render(<WYSIWYGRenderer content={emptyContent} />);
      
      expect(screen.getByText('No Content Available')).toBeInTheDocument();
    });

    it('should handle missing position data gracefully', () => {
      const contentWithoutPositions = {
        ...mockV3Content,
        positions: {},
      };

      render(<WYSIWYGRenderer content={contentWithoutPositions} />);
      
      // Should fall back to vertical layout
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('Positioning System', () => {
    it('should apply correct positioning to blocks', () => {
      render(<WYSIWYGRenderer content={mockV3Content} />);
      
      // Find positioned blocks by their data attributes
      const textBlock = screen.getByTestId('text-block-1');
      const richBlock = screen.getByTestId('rich-block-1');
      
      expect(textBlock).toHaveStyle({
        left: '0px',
        top: '0px',
        width: '400px',
      });
      
      expect(richBlock).toHaveStyle({
        left: '0px', 
        top: '120px',
        width: '600px',
      });
    });

    it('should set correct canvas dimensions', () => {
      render(<WYSIWYGRenderer content={mockV3Content} />);
      
      const canvas = screen.getByTestId('canvas-type');
      expect(canvas).toHaveStyle({
        width: '800px',
        minHeight: '400px',
      });
    });

    it('should apply z-index when specified', () => {
      const contentWithZIndex = {
        ...mockV3Content,
        positions: {
          ...mockV3Content.positions,
          'text-block-1': {
            ...mockV3Content.positions['text-block-1'],
            zIndex: 10,
          },
        },
      };

      render(<WYSIWYGRenderer content={contentWithZIndex} />);
      
      const textBlock = screen.getByTestId('text-block-1');
      expect(textBlock).toHaveStyle({ zIndex: '10' });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(async () => {
      // Import and mock mobile viewport
      const { useIsMobile } = await import('@/hooks/use-mobile');
      vi.mocked(useIsMobile).mockReturnValue(true);
    });

    afterEach(async () => {
      // Reset to desktop for other tests
      const { useIsMobile } = await import('@/hooks/use-mobile');
      vi.mocked(useIsMobile).mockReturnValue(false);
    });

    it('should scale content for mobile viewport', () => {
      render(<WYSIWYGRenderer content={mockV3Content} />);
      
      const canvas = screen.getByTestId('canvas-type');
      expect(canvas).toHaveAttribute('data-viewport', 'mobile');
      expect(canvas).toHaveAttribute('data-scale-factor', '0.46875'); // 375/800 exact
    });

    it('should use mobile positions when available', () => {
      const contentWithMobilePositions = {
        ...mockV3Content,
        mobilePositions: {
          'text-block-1': {
            id: 'text-block-1',
            x: 10,
            y: 10,
            width: 350,
            height: 80,
          },
        },
      };

      render(<WYSIWYGRenderer content={contentWithMobilePositions} />);
      
      // Should use mobile positions instead of scaled desktop positions
      const textBlock = screen.getByTestId('text-block-1');
      expect(textBlock).toHaveStyle({
        left: '10px',
        top: '10px',
        width: '350px',
      });
    });
  });

  describe('Block Type Support', () => {
    it('should render different block types correctly', () => {
      const multiBlockContent: StructuredContentV3 = {
        ...mockV3Content,
        nodes: [
          {
            id: 'text-1',
            type: 'textBlock',
            data: { htmlContent: '<p>Text block</p>' },
          },
          {
            id: 'quote-1',
            type: 'quoteBlock',
            data: { htmlContent: '<p>Quote content</p>', htmlCitation: 'Author' },
          },
          {
            id: 'takeaway-1',
            type: 'keyTakeawayBlock',
            data: { htmlContent: '<p>Key takeaway</p>' },
          },
        ],
        positions: {
          'text-1': { id: 'text-1', x: 0, y: 0, width: 400, height: 100 },
          'quote-1': { id: 'quote-1', x: 0, y: 120, width: 400, height: 100 },
          'takeaway-1': { id: 'takeaway-1', x: 0, y: 240, width: 400, height: 100 },
        },
      };

      render(<WYSIWYGRenderer content={multiBlockContent} />);
      
      // Verify different block types are rendered
      expect(screen.getByTestId('text-1')).toBeInTheDocument();
      expect(screen.getByTestId('quote-1')).toBeInTheDocument();
      expect(screen.getByTestId('takeaway-1')).toBeInTheDocument();
      
      // Check for block-specific content
      expect(screen.getByText('Text block')).toBeInTheDocument();
      expect(screen.getByText('Quote content')).toBeInTheDocument();
      expect(screen.getByText('Key takeaway')).toBeInTheDocument();
    });

    it('should handle unknown block types gracefully', () => {
      const contentWithUnknownBlock = {
        ...mockV3Content,
        nodes: [
          {
            id: 'unknown-1',
            type: 'unknownBlockType' as any,
            data: { content: 'Unknown content' },
          },
        ],
        positions: {
          'unknown-1': { id: 'unknown-1', x: 0, y: 0, width: 400, height: 100 },
        },
      };

      render(<WYSIWYGRenderer content={contentWithUnknownBlock} />);
      
      expect(screen.getByText('Unsupported block type')).toBeInTheDocument();
      expect(screen.getByText('unknownBlockType')).toBeInTheDocument();
    });
  });

  describe('Development Features', () => {
    it('should show debug info in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<WYSIWYGRenderer content={mockV3Content} />);
      
      expect(screen.getByText('Debug Info (Development Only)')).toBeInTheDocument();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not show debug info in production', () => {
      // Ensure production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(<WYSIWYGRenderer content={mockV3Content} />);
      
      expect(screen.queryByText('Debug Info (Development Only)')).not.toBeInTheDocument();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Read-Only Mode', () => {
    it('should set read-only attributes correctly', () => {
      render(<WYSIWYGRenderer content={mockV3Content} isReadOnly={true} />);
      
      const textBlock = screen.getByTestId('text-block-1');
      expect(textBlock).toHaveAttribute('data-read-only', 'true');
    });

    it('should default to read-only mode', () => {
      render(<WYSIWYGRenderer content={mockV3Content} />);
      
      const textBlock = screen.getByTestId('text-block-1');
      expect(textBlock).toHaveAttribute('data-read-only', 'true');
    });
  });
});