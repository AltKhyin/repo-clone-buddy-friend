// ABOUTME: Simple fast unit tests for Button component without performance monitoring

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

// Simple fast tests without performance monitoring overhead
describe('Button Component - Simple Fast Tests', () => {
  it('should render button text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');
  });

  it('should handle disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render without errors', () => {
    expect(() => {
      render(<Button>Test</Button>);
    }).not.toThrow();
  });
});
