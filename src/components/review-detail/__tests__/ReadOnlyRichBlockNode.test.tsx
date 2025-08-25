// ABOUTME: Tests for ReadOnlyRichBlockNode fixes - line height, mobile padding, and no interactive elements

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadOnlyRichBlockNode } from '../ReadOnlyRichBlockNode';
import { RichBlockData } from '@/types/editor';

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop
}));

vi.mock('../../hooks/useRichTextEditor', () => ({
  useRichTextEditor: vi.fn(() => ({
    editor: {
      commands: {},
      state: { doc: { textContent: 'Test content' } }
    }
  })),
}));

describe('ReadOnlyRichBlockNode Fixes', () => {
  const mockData: RichBlockData = {
    content: {
      htmlContent: '<p>Test content with <span style="line-height: 2.5;">custom line height</span></p>',
      tiptapJSON: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Test content with custom line height',
                marks: [
                  {
                    type: 'textStyle',
                    attrs: {
                      lineHeight: 2.5
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    // Mobile padding configuration
    desktopPadding: {
      top: 20,
      right: 30,
      bottom: 40,
      left: 50
    },
    mobilePadding: {
      top: 10,
      right: 15,
      bottom: 20,
      left: 25
    },
    lineHeight: 1.8,
    fontSize: '18px',
    color: '#333333',
  };

  const defaultProps = {
    id: 'test-block-1',
    data: mockData,
    width: 600,
    height: 200,
    x: 100,
    y: 150,
    canvasWidth: 1200,
    mobileCanvasWidth: 375,
    isMobilePosition: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console.log mock if needed
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Issue #1: No Interactive Elements', () => {
    it('should not show hover effects or selection UI', async () => {
      const user = userEvent.setup();
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      const blockElement = screen.getByTestId('readonly-block-test-block-1');
      
      // Should not have selection rings
      expect(blockElement).not.toHaveClass('ring-2', 'ring-primary');
      
      // Should not have hover classes
      await user.hover(blockElement);
      await waitFor(() => {
        expect(blockElement).not.toHaveClass('ring-2', 'ring-primary', 'opacity-50');
      });
      
      // Should not show selection labels
      expect(screen.queryByText(/RichBlock Selected/)).not.toBeInTheDocument();
      expect(screen.queryByText(/600.*200.*px/)).not.toBeInTheDocument();
    });

    it('should not respond to click interactions', async () => {
      const user = userEvent.setup();
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      const blockElement = screen.getByTestId('readonly-block-test-block-1');
      
      // Click should not trigger selection
      await user.click(blockElement);
      
      // Should still not have selection indicators
      expect(screen.queryByText(/RichBlock Selected/)).not.toBeInTheDocument();
      expect(blockElement).not.toHaveClass('ring-2', 'ring-primary');
    });
  });

  describe('Issue #2: Mobile Padding', () => {
    it('should apply correct desktop padding', () => {
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      // Should log desktop padding debug info
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] Padding Debug:'),
        expect.objectContaining({
          viewport: 'desktop',
          isMobile: false,
          finalPadding: expect.objectContaining({
            top: 20,
            right: 30,
            bottom: 40,
            left: 50
          })
        })
      );
    });

    it('should apply correct mobile padding when on mobile', () => {
      // Mock mobile environment
      const { useIsMobile } = require('@/hooks/use-mobile');
      useIsMobile.mockReturnValue(true);
      
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      // Should log mobile padding debug info
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] Padding Debug:'),
        expect.objectContaining({
          viewport: 'mobile',
          isMobile: true,
          finalPadding: expect.objectContaining({
            top: 10,
            right: 15,
            bottom: 20,
            left: 25
          })
        })
      );
    });

    it('should apply correct scale factor calculations', () => {
      const { useIsMobile } = require('@/hooks/use-mobile');
      useIsMobile.mockReturnValue(true);
      
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      // Should log scale factor debug info
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] Scale Factor Debug:'),
        expect.objectContaining({
          isMobile: true,
          isMobilePosition: false,
          calculatedScaleFactor: 375 / 1200, // mobileCanvasWidth / canvasWidth
          originalDimensions: { x: 100, y: 150, width: 600, height: 200 },
          finalPosition: expect.objectContaining({
            x: 100 * (375 / 1200),
            y: 150 * (375 / 1200),
            width: 600 * (375 / 1200),
            height: 200 * (375 / 1200)
          })
        })
      );
    });
  });

  describe('Issue #3: Line Height Extraction and Application', () => {
    it('should extract line height from TipTap JSON content', () => {
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      // Should log TipTap mark extraction
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] 🎯 EXTRACTED TipTap MARKS:'),
        expect.objectContaining({
          extractedMarks: expect.objectContaining({
            lineHeight: 2.5
          }),
          hasLineHeight: true
        })
      );
    });

    it('should combine block-level and inline typography styles', () => {
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      // Should log typography styles debug info
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] 🎯 TYPOGRAPHY STYLES DEBUG:'),
        expect.objectContaining({
          blockLineHeight: 1.8,
          inlineMarks: expect.objectContaining({
            lineHeight: 2.5
          }),
          combinedStyles: expect.objectContaining({
            lineHeight: 2.5 // Inline should override block
          }),
          finalLineHeight: 2.5
        })
      );
    });

    it('should extract line height from HTML content as fallback', () => {
      const dataWithoutJSON: RichBlockData = {
        ...mockData,
        content: {
          htmlContent: '<p style="line-height: 3.0;">Test content</p>',
          // No tiptapJSON
        }
      };
      
      render(<ReadOnlyRichBlockNode {...defaultProps} data={dataWithoutJSON} />);
      
      // Should log HTML mark extraction
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] 🎯 EXTRACTED HTML MARKS:'),
        expect.objectContaining({
          extractedMarks: expect.objectContaining({
            lineHeight: 3.0
          }),
          hasLineHeight: true
        })
      );
    });
  });

  describe('Issue #4: Mobile Padding Fix for Review Pages', () => {
    beforeEach(() => {
      // Mock mobile environment
      const { useIsMobile } = require('@/hooks/use-mobile');
      useIsMobile.mockReturnValue(true);
    });

    it('should generate mobile padding from desktop padding when mobile padding is missing', () => {
      const dataWithOnlyDesktopPadding = {
        ...mockData,
        desktopPadding: { top: 24, right: 32, bottom: 48, left: 16 },
        mobilePadding: undefined // Simulating missing mobile padding data
      };
      
      render(<ReadOnlyRichBlockNode {...defaultProps} data={dataWithOnlyDesktopPadding} />);
      
      // Should log mobile padding generation from desktop padding
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] 🎯 MOBILE PADDING FIX: Generated mobile padding from desktop padding:'),
        expect.objectContaining({
          originalDesktopPadding: { top: 24, right: 32, bottom: 48, left: 16 },
          generatedMobilePadding: { top: 24, right: 32, bottom: 48, left: 16 }
        })
      );
    });

    it('should generate mobile padding from individual padding values when both viewport paddings are missing', () => {
      const dataWithIndividualPadding = {
        ...mockData,
        desktopPadding: undefined,
        mobilePadding: undefined,
        paddingTop: 12,
        paddingRight: 18,
        paddingBottom: 24,
        paddingLeft: 6
      };
      
      render(<ReadOnlyRichBlockNode {...defaultProps} data={dataWithIndividualPadding} />);
      
      // Should log mobile padding generation from individual values
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] 🎯 MOBILE PADDING FIX: Generated mobile padding from individual values:'),
        expect.objectContaining({
          individualValues: {
            paddingTop: 12,
            paddingRight: 18,
            paddingBottom: 24,
            paddingLeft: 6
          },
          generatedMobilePadding: { top: 12, right: 18, bottom: 24, left: 6 }
        })
      );
    });

    it('should preserve existing mobile padding when already present', () => {
      const dataWithExistingMobilePadding = {
        ...mockData,
        desktopPadding: { top: 20, right: 30, bottom: 40, left: 50 },
        mobilePadding: { top: 8, right: 12, bottom: 16, left: 4 } // Should be preserved
      };
      
      render(<ReadOnlyRichBlockNode {...defaultProps} data={dataWithExistingMobilePadding} />);
      
      // Should NOT log mobile padding generation (already exists)
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] 🎯 MOBILE PADDING FIX: Generated mobile padding')
      );
      
      // Should use existing mobile padding
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ReadOnlyRichBlockNode] 🔍 MOBILE PADDING AUDIT (Review Page):'),
        expect.objectContaining({
          'RECEIVED DATA STRUCTURE': expect.objectContaining({
            hasMobilePadding: true,
            mobilePadding: { top: 8, right: 12, bottom: 16, left: 4 }
          })
        })
      );
    });
  });

  describe('UnifiedBlockWrapper Read-Only Mode', () => {
    it('should use UnifiedBlockWrapper in read-only mode', () => {
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      // Should have read-only specific attributes
      const wrapperElement = screen.getByTestId('unified-block-test-block-1');
      expect(wrapperElement).toHaveClass('readonly-block-wrapper');
      expect(wrapperElement).toHaveAttribute('data-read-only', 'true');
    });

    it('should apply positioning through UnifiedBlockWrapper in read-only mode', () => {
      render(<ReadOnlyRichBlockNode {...defaultProps} />);
      
      const wrapperElement = screen.getByTestId('unified-block-test-block-1');
      
      // Should have absolute positioning styles
      const styles = window.getComputedStyle(wrapperElement);
      expect(styles.position).toBe('absolute');
    });
  });
});