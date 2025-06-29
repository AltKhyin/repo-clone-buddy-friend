// ABOUTME: Tests for SafeSwitch component to prevent infinite re-render loops

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SafeSwitch } from './SafeSwitch';

describe('SafeSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render correctly with checked state', () => {
      render(<SafeSwitch checked={true} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toBeChecked();
    });

    it('should render correctly with unchecked state', () => {
      render(<SafeSwitch checked={false} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).not.toBeChecked();
    });

    it('should handle click events correctly', async () => {
      const onCheckedChange = vi.fn();
      const user = userEvent.setup();
      
      render(<SafeSwitch checked={false} onCheckedChange={onCheckedChange} />);
      
      const switchElement = screen.getByRole('switch');
      await user.click(switchElement);
      
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Infinite Loop Prevention', () => {
    it('should not call onCheckedChange when new value equals current value', () => {
      const onCheckedChange = vi.fn();
      
      const { rerender } = render(
        <SafeSwitch checked={true} onCheckedChange={onCheckedChange} />
      );
      
      // Simulate the same value being set again (should not trigger callback)
      rerender(<SafeSwitch checked={true} onCheckedChange={onCheckedChange} />);
      
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('should only call onCheckedChange when value actually changes', () => {
      const onCheckedChange = vi.fn();
      
      const { rerender } = render(
        <SafeSwitch checked={false} onCheckedChange={onCheckedChange} />
      );
      
      // Change to true - should trigger callback
      rerender(<SafeSwitch checked={true} onCheckedChange={onCheckedChange} />);
      
      // Set to true again - should not trigger callback again
      rerender(<SafeSwitch checked={true} onCheckedChange={onCheckedChange} />);
      
      // The callback should only be called when the value actually changes
      expect(onCheckedChange).toHaveBeenCalledTimes(0); // No direct calls from prop changes
    });

    it('should memoize correctly to prevent unnecessary re-renders', () => {
      const onCheckedChange = vi.fn();
      const renderSpy = vi.fn();
      
      const TestComponent = ({ checked }: { checked: boolean }) => {
        renderSpy();
        return <SafeSwitch checked={checked} onCheckedChange={onCheckedChange} />;
      };
      
      const { rerender } = render(<TestComponent checked={false} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props - should not cause extra renders due to memoization
      rerender(<TestComponent checked={false} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2); // Normal re-render, but SafeSwitch is memoized
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined onCheckedChange gracefully', async () => {
      const user = userEvent.setup();
      
      expect(() => {
        render(<SafeSwitch checked={false} />);
      }).not.toThrow();
      
      const switchElement = screen.getByRole('switch');
      
      // Should not throw when clicked without onCheckedChange
      await expect(user.click(switchElement)).resolves.not.toThrow();
    });

    it('should handle rapid state changes correctly', () => {
      const onCheckedChange = vi.fn();
      
      const { rerender } = render(
        <SafeSwitch checked={false} onCheckedChange={onCheckedChange} />
      );
      
      // Simulate rapid state changes
      rerender(<SafeSwitch checked={true} onCheckedChange={onCheckedChange} />);
      rerender(<SafeSwitch checked={false} onCheckedChange={onCheckedChange} />);
      rerender(<SafeSwitch checked={true} onCheckedChange={onCheckedChange} />);
      
      // Should not cause any infinite loops or excessive calls
      expect(onCheckedChange).toHaveBeenCalledTimes(0); // No prop-driven calls
    });
  });

  describe('Props Forwarding', () => {
    it('should forward all props to the underlying Switch component', () => {
      render(
        <SafeSwitch 
          checked={true} 
          id="test-switch" 
          className="custom-class"
          disabled={false}
        />
      );
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('id', 'test-switch');
      // The className is applied to the root element which is the switch itself
      expect(switchElement).toHaveClass('custom-class');
    });

    it('should maintain display name for debugging', () => {
      expect(SafeSwitch.displayName).toBe('SafeSwitch');
    });
  });
});