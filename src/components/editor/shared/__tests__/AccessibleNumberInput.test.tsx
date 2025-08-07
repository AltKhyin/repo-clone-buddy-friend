// ABOUTME: Tests for AccessibleNumberInput component UX enhancements

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleNumberInput } from '../AccessibleNumberInput';

describe('AccessibleNumberInput', () => {
  const defaultProps = {
    value: 16,
    onChange: vi.fn(),
    min: 8,
    max: 128,
    step: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with initial value', () => {
      render(<AccessibleNumberInput {...defaultProps} />);
      
      expect(screen.getByDisplayValue('16')).toBeInTheDocument();
    });

    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByDisplayValue('16');
      await user.clear(input);
      await user.type(input, '24');
      
      expect(handleChange).toHaveBeenCalledWith(24);
    });

    it('should handle decimal values with precision', () => {
      const handleChange = vi.fn();
      
      render(
        <AccessibleNumberInput
          value={1.4}
          onChange={handleChange}
          min={0.5}
          max={3.0}
          step={0.1}
          precision={1}
        />
      );
      
      expect(screen.getByDisplayValue('1.4')).toBeInTheDocument();
    });
  });

  describe('Increment/Decrement Controls', () => {
    it('should render increment and decrement buttons', () => {
      render(<AccessibleNumberInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Increase value')).toBeInTheDocument();
      expect(screen.getByLabelText('Decrease value')).toBeInTheDocument();
    });

    it('should increment value when increment button is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const incrementButton = screen.getByLabelText('Increase value');
      await user.click(incrementButton);
      
      expect(handleChange).toHaveBeenCalledWith(17);
    });

    it('should decrement value when decrement button is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const decrementButton = screen.getByLabelText('Decrease value');
      await user.click(decrementButton);
      
      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it('should disable increment button when at maximum value', () => {
      render(<AccessibleNumberInput {...defaultProps} value={128} />);
      
      const incrementButton = screen.getByLabelText('Increase value');
      expect(incrementButton).toBeDisabled();
    });

    it('should disable decrement button when at minimum value', () => {
      render(<AccessibleNumberInput {...defaultProps} value={8} />);
      
      const decrementButton = screen.getByLabelText('Decrease value');
      expect(decrementButton).toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should increment value with ArrowUp key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByDisplayValue('16');
      await user.click(input);
      await user.keyboard('[ArrowUp]');
      
      expect(handleChange).toHaveBeenCalledWith(17);
    });

    it('should decrement value with ArrowDown key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByDisplayValue('16');
      await user.click(input);
      await user.keyboard('[ArrowDown]');
      
      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it('should commit value on Enter key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByDisplayValue('16');
      await user.clear(input);
      await user.type(input, '24');
      await user.keyboard('[Enter]');
      
      // Should blur input and commit final value
      expect(input).not.toHaveFocus();
    });
  });

  describe('Validation and Constraints', () => {
    it('should constrain value to minimum bound', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByDisplayValue('16');
      await user.clear(input);
      await user.type(input, '5'); // Below minimum of 8
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(8); // Should constrain to minimum
      });
    });

    it('should constrain value to maximum bound', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByDisplayValue('16');
      await user.clear(input);
      await user.type(input, '200'); // Above maximum of 128
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(128); // Should constrain to maximum
      });
    });

    it('should handle invalid input gracefully', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<AccessibleNumberInput {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByDisplayValue('16');
      await user.clear(input);
      await user.type(input, 'invalid');
      fireEvent.blur(input);
      
      // Should revert to original value when invalid
      await waitFor(() => {
        expect(screen.getByDisplayValue('16')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should support custom aria-label', () => {
      render(
        <AccessibleNumberInput 
          {...defaultProps} 
          aria-label="Font size in pixels" 
        />
      );
      
      expect(screen.getByLabelText('Font size in pixels')).toBeInTheDocument();
    });

    it('should support custom title attributes', () => {
      render(
        <AccessibleNumberInput 
          {...defaultProps} 
          title="Font size (8-128px)" 
          aria-label="Font size"
        />
      );
      
      const input = screen.getByLabelText('Font size');
      expect(input).toHaveAttribute('title', 'Font size (8-128px)');
      
      const incrementButton = screen.getByLabelText('Increase Font size');
      expect(incrementButton).toHaveAttribute('title', 'Increase Font size (8-128px)');
    });

    it('should render suffix when provided', () => {
      render(
        <AccessibleNumberInput 
          {...defaultProps} 
          suffix="px"
        />
      );
      
      expect(screen.getByText('px')).toBeInTheDocument();
    });

    it('should disable all controls when disabled prop is true', () => {
      render(<AccessibleNumberInput {...defaultProps} disabled={true} />);
      
      expect(screen.getByDisplayValue('16')).toBeDisabled();
      expect(screen.getByLabelText('Increase value')).toBeDisabled();
      expect(screen.getByLabelText('Decrease value')).toBeDisabled();
    });
  });

  describe('UX Improvements', () => {
    it('should use text input type to avoid browser number controls', () => {
      render(<AccessibleNumberInput {...defaultProps} />);
      
      const input = screen.getByDisplayValue('16');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have proper styling to prevent browser number arrows', () => {
      render(<AccessibleNumberInput {...defaultProps} />);
      
      const input = screen.getByDisplayValue('16');
      const styles = window.getComputedStyle(input);
      
      // These styles should prevent browser number input arrows
      expect(input.style.appearance).toBe('textfield');
      expect(input.style.MozAppearance).toBe('textfield');
    });

    it('should provide visual feedback for increment/decrement buttons', () => {
      render(<AccessibleNumberInput {...defaultProps} />);
      
      const incrementButton = screen.getByLabelText('Increase value');
      const decrementButton = screen.getByLabelText('Decrease value');
      
      // Should have hover states and proper visual design
      expect(incrementButton).toHaveClass('hover:bg-muted');
      expect(decrementButton).toHaveClass('hover:bg-muted');
    });
  });
});