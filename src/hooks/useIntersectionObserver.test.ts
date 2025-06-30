// ABOUTME: Tests for intersection observer hook ensuring proper lazy loading behavior

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIntersectionObserver } from './useIntersectionObserver';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

beforeEach(() => {
  mockIntersectionObserver.mockImplementation(callback => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: vi.fn(),
  }));

  // @ts-expect-error - Mocking global IntersectionObserver for testing
  global.IntersectionObserver = mockIntersectionObserver;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useIntersectionObserver', () => {
  it('should return ref and initial intersection state', () => {
    const { result } = renderHook(() => useIntersectionObserver());

    const [ref, isIntersecting] = result.current;

    expect(ref.current).toBeNull();
    expect(isIntersecting).toBe(false);
  });

  it('should create intersection observer with default options', () => {
    renderHook(() => useIntersectionObserver());

    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.1,
      rootMargin: '50px',
    });
  });

  it('should create intersection observer with custom options', () => {
    const options = {
      threshold: 0.5,
      rootMargin: '100px',
      triggerOnce: false,
    };

    renderHook(() => useIntersectionObserver(options));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.5,
      rootMargin: '100px',
    });
  });

  it('should observe element when ref is set', () => {
    const { result } = renderHook(() => useIntersectionObserver());
    const [ref] = result.current;

    const mockElement = document.createElement('div');
    // @ts-expect-error - Mocking global IntersectionObserver for testing
    ref.current = mockElement;

    // Re-render to trigger useEffect
    renderHook(() => useIntersectionObserver());

    expect(mockObserve).toHaveBeenCalledWith(mockElement);
  });

  it('should update intersection state when callback is triggered', () => {
    let intersectionCallback: (entries: any[]) => void;

    mockIntersectionObserver.mockImplementation(callback => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: vi.fn(),
      };
    });

    const { result, rerender } = renderHook(() => useIntersectionObserver());
    const [ref] = result.current;

    const mockElement = document.createElement('div');
    // @ts-expect-error - Mocking global IntersectionObserver for testing
    ref.current = mockElement;

    rerender();

    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);

    rerender();

    const [, isIntersecting] = result.current;
    expect(isIntersecting).toBe(true);
  });

  it('should handle triggerOnce option correctly', () => {
    let intersectionCallback: (entries: any[]) => void;

    mockIntersectionObserver.mockImplementation(callback => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: vi.fn(),
      };
    });

    const { result, rerender } = renderHook(() => useIntersectionObserver({ triggerOnce: true }));
    const [ref] = result.current;

    const mockElement = document.createElement('div');
    // @ts-expect-error - Mocking global IntersectionObserver for testing
    ref.current = mockElement;

    rerender();

    // Simulate intersection
    intersectionCallback([{ isIntersecting: true }]);
    rerender();

    // Simulate leaving intersection
    intersectionCallback([{ isIntersecting: false }]);
    rerender();

    const [, isIntersecting] = result.current;
    // Should still be true due to triggerOnce
    expect(isIntersecting).toBe(true);
  });

  it('should cleanup observer on unmount', () => {
    const { result, unmount } = renderHook(() => useIntersectionObserver());
    const [ref] = result.current;

    const mockElement = document.createElement('div');
    // @ts-expect-error - Mocking global IntersectionObserver for testing
    ref.current = mockElement;

    unmount();

    expect(mockUnobserve).toHaveBeenCalledWith(mockElement);
  });
});
