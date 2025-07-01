// ABOUTME: Tests to ensure color inputs never receive invalid values like "transparent"

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColorControl } from '../shared/ColorControl';
import { BackgroundControls } from '../shared/BackgroundControls';
import { BorderControls } from '../shared/BorderControls';

describe('Color Input Validation', () => {
  describe('ColorControl', () => {
    it('should never pass "transparent" to HTML color input', () => {
      const mockOnChange = vi.fn();

      render(
        <ColorControl
          label="Test Color"
          value="transparent"
          onChange={mockOnChange}
          allowTransparent={true}
        />
      );

      // Find the HTML color input element
      const colorInput = screen.getByDisplayValue('#000000') as HTMLInputElement;

      // Verify that the color input has a valid hex value, not "transparent"
      expect(colorInput).toBeInTheDocument();
      expect(colorInput.type).toBe('color');
      expect(colorInput.value).toBe('#000000'); // Should fallback to valid hex
      expect(colorInput.value).not.toBe('transparent'); // Should never be transparent
    });

    it('should handle valid hex colors correctly', () => {
      const mockOnChange = vi.fn();

      render(<ColorControl label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const colorInput = screen.getByDisplayValue('#ff0000') as HTMLInputElement;
      expect(colorInput.value).toBe('#ff0000');
    });

    it('should handle undefined/null values gracefully', () => {
      const mockOnChange = vi.fn();

      render(<ColorControl label="Test Color" value={undefined} onChange={mockOnChange} />);

      // Should fallback to default color
      const colorInput = screen.getByDisplayValue('#000000') as HTMLInputElement;
      expect(colorInput.value).toBe('#000000');
    });
  });

  describe('BackgroundControls', () => {
    it('should handle transparent background values in color inputs', () => {
      const mockOnChange = vi.fn();

      render(
        <BackgroundControls
          data={{ backgroundColor: 'transparent' }}
          onChange={mockOnChange}
          enableImage={false}
        />
      );

      // Should not crash and should handle transparent values safely
      expect(screen.getByText(/background/i)).toBeInTheDocument();

      // Any color inputs should have valid hex values
      const colorInputs = screen.getAllByDisplayValue(/#[0-9a-fA-F]{6}/);
      colorInputs.forEach(input => {
        expect(input.value).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(input.value).not.toBe('transparent');
      });
    });
  });

  describe('BorderControls', () => {
    it('should handle transparent border values in color inputs', () => {
      const mockOnChange = vi.fn();

      render(
        <BorderControls
          data={{
            borderWidth: 1,
            borderColor: 'transparent',
          }}
          onChange={mockOnChange}
          enableToggle={true}
        />
      );

      // Should not crash and should handle transparent values safely
      expect(screen.getByText(/border/i)).toBeInTheDocument();

      // Any color inputs should have valid hex values
      const colorInputs = screen.getAllByDisplayValue(/#[0-9a-fA-F]{6}/);
      colorInputs.forEach(input => {
        expect(input.value).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(input.value).not.toBe('transparent');
      });
    });
  });

  describe('HTML Color Input Compliance', () => {
    it('should validate that all rendered color inputs have valid values', () => {
      const invalidColorValues = ['transparent', 'inherit', 'initial', 'unset', 'auto'];

      // Test that our components never render color inputs with invalid values
      invalidColorValues.forEach(invalidValue => {
        const mockOnChange = vi.fn();

        render(<ColorControl label="Test" value={invalidValue} onChange={mockOnChange} />);

        // Get all color input elements
        const colorInputs = document.querySelectorAll('input[type="color"]');

        colorInputs.forEach(input => {
          const htmlInput = input as HTMLInputElement;
          // Verify each color input has a valid hex value
          expect(htmlInput.value).toMatch(/^#[0-9a-fA-F]{6}$/);
          expect(htmlInput.value).not.toBe(invalidValue);
        });
      });
    });
  });
});
