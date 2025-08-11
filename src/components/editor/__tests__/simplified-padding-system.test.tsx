// ABOUTME: Simplified tests for padding system focusing on core functionality

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualPaddingEditor } from '../Inspector/shared/VisualPaddingEditor';
import {
  getViewportPadding,
  setViewportPadding,
  validatePaddingValue,
  paddingToCSSStyle,
  isZeroPadding,
  type ViewportPadding,
} from '@/types/editor';

describe('Simplified Padding System Tests', () => {
  describe('Core Utility Functions', () => {
    it('should validate padding values within 0-100 range', () => {
      expect(validatePaddingValue(50)).toBe(50);
      expect(validatePaddingValue(0)).toBe(0);
      expect(validatePaddingValue(100)).toBe(100);
      expect(validatePaddingValue(150)).toBe(100); // Clamps to max
      expect(validatePaddingValue(-10)).toBe(0);   // Clamps to min
    });

    it('should detect true zero padding', () => {
      expect(isZeroPadding({ top: 0, right: 0, bottom: 0, left: 0 })).toBe(true);
      expect(isZeroPadding({ top: 0, right: 0, bottom: 0, left: 5 })).toBe(false);
      expect(isZeroPadding({})).toBe(true); // Undefined values treated as 0
    });

    it('should generate correct CSS styles for zero padding', () => {
      const zeroPadding: ViewportPadding = { top: 0, right: 0, bottom: 0, left: 0 };
      const styles = paddingToCSSStyle(zeroPadding);
      
      expect(styles).toEqual({
        paddingTop: '0px',
        paddingRight: '0px', 
        paddingBottom: '0px',
        paddingLeft: '0px',
      });
    });

    it('should handle viewport-specific padding correctly', () => {
      const data = {
        desktopPadding: { top: 20, right: 24, bottom: 16, left: 20 },
        mobilePadding: { top: 8, right: 12, bottom: 8, left: 12 },
      };
      
      const desktopPadding = getViewportPadding(data, 'desktop');
      expect(desktopPadding).toEqual({ top: 20, right: 24, bottom: 16, left: 20 });
      
      const mobilePadding = getViewportPadding(data, 'mobile');
      expect(mobilePadding).toEqual({ top: 8, right: 12, bottom: 8, left: 12 });
    });

    it('should set viewport padding correctly', () => {
      const originalData = { backgroundColor: 'blue' };
      const newPadding: ViewportPadding = { top: 16, right: 20, bottom: 12, left: 18 };
      
      const result = setViewportPadding(originalData, 'desktop', newPadding);
      
      expect(result).toEqual({
        backgroundColor: 'blue',
        desktopPadding: newPadding,
      });
    });
  });

  describe('VisualPaddingEditor Core Features', () => {
    it('should render desktop and mobile viewport tabs', () => {
      const mockData = {
        desktopPadding: { top: 16, right: 16, bottom: 16, left: 16 },
      };
      
      render(
        <VisualPaddingEditor 
          data={mockData} 
          onChange={() => {}} 
        />
      );

      expect(screen.getByText('Desktop')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    it('should show true zero padding feedback', () => {
      const zeroData = {
        desktopPadding: { top: 0, right: 0, bottom: 0, left: 0 },
      };
      
      render(
        <VisualPaddingEditor 
          data={zeroData} 
          onChange={() => {}} 
        />
      );

      expect(screen.getByText('True zero padding')).toBeInTheDocument();
      expect(screen.getByText('True Zero Padding Active:')).toBeInTheDocument();
    });

    it('should handle padding value changes', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      const mockData = {
        desktopPadding: { top: 16, right: 16, bottom: 16, left: 16 },
      };
      
      render(
        <VisualPaddingEditor 
          data={mockData} 
          onChange={mockOnChange} 
        />
      );

      const topInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(topInput);
      await user.type(topInput, '24');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should provide viewport selector for desktop and mobile', () => {
      const mockOnChange = vi.fn();
      const mockData = {
        desktopPadding: { top: 16, right: 16, bottom: 16, left: 16 },
        mobilePadding: { top: 12, right: 12, bottom: 12, left: 12 },
      };
      
      render(
        <VisualPaddingEditor 
          data={mockData} 
          onChange={mockOnChange} 
        />
      );

      expect(screen.getByText('Desktop')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
      expect(screen.getByText('Desktop Padding')).toBeInTheDocument();
    });
  });

  describe('Legacy Compatibility', () => {
    it('should handle legacy paddingX/Y data', () => {
      const legacyData = {
        paddingX: 20,
        paddingY: 15,
      };
      
      const padding = getViewportPadding(legacyData, 'desktop');
      
      expect(padding).toEqual({
        top: 15,    // paddingY
        right: 20,  // paddingX
        bottom: 15, // paddingY
        left: 20,   // paddingX
      });
    });

    it('should handle mixed legacy and viewport data with correct priority', () => {
      const mixedData = {
        desktopPadding: { top: 20, right: 24, bottom: 16, left: 20 },
        paddingTop: 10,    // Should be ignored when viewport padding exists
        paddingRight: 15,
      };
      
      const padding = getViewportPadding(mixedData, 'desktop');
      
      // Should use viewport-specific padding (higher priority)
      expect(padding).toEqual({
        top: 20,
        right: 24,
        bottom: 16,
        left: 20,
      });
    });
  });
});