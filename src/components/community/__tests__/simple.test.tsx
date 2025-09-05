// ABOUTME: Simple test to verify test infrastructure works
import { describe, it, expect } from 'vitest';

describe('Simple Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should verify test environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});