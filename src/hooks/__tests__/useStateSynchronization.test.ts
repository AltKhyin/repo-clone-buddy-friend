// ABOUTME: Tests for state synchronization React hooks ensuring proper TipTap-React integration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAttributeSync,
  useContentSync,
  useFullStateSync,
  useStateSyncDebug,
} from '../useStateSynchronization';
import { globalTipTapSynchronizer } from '@/components/editor/shared/tiptapStateSynchronizer';

// Mock lodash debounce
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn, delay) => {
    const debouncedFn = (...args: any[]) => fn(...args);
    debouncedFn.cancel = vi.fn();
    return debouncedFn;
  }),
}));

// Mock TipTap synchronizer
vi.mock('@/components/editor/shared/tiptapStateSynchronizer', () => ({
  globalTipTapSynchronizer: {
    syncNodeAttributes: vi.fn().mockReturnValue('sync-id-123'),
    syncWithUnifiedStore: vi.fn().mockReturnValue('content-sync-id-456'),
    getStats: vi.fn().mockReturnValue({
      queueSize: 0,
      pendingOptimistic: 0,
      isProcessing: false,
      conflictStrategies: 0,
      componentSnapshots: 0,
      components: [],
    }),
    getComponentSnapshot: vi.fn().mockReturnValue({
      componentId: 'test-component-1',
      componentType: 'table',
      attributes: { headers: ['Col 1', 'Col 2'] },
      contentHash: 'abc123',
      timestamp: Date.now(),
    }),
  },
}));

describe('useAttributeSync', () => {
  const mockUpdateAttributes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('component-state-update', () => {});
  });

  describe('Basic Functionality', () => {
    it('should sync attributes when they change', () => {
      const attributes = { headers: ['Col 1', 'Col 2'], rows: [['A', 'B']] };

      const { rerender } = renderHook(
        ({ attrs }) =>
          useAttributeSync(
            'test-component-1',
            'table',
            attrs,
            mockUpdateAttributes,
            { enabled: true, debounceMs: 0 } // No debounce for testing
          ),
        { initialProps: { attrs: attributes } }
      );

      expect(globalTipTapSynchronizer.syncNodeAttributes).toHaveBeenCalledWith(
        'test-component-1',
        'table',
        attributes,
        expect.objectContaining({
          optimistic: true,
          source: 'react',
        })
      );

      // Change attributes
      const newAttributes = { headers: ['Col 1', 'Col 2', 'Col 3'], rows: [['A', 'B', 'C']] };
      rerender({ attrs: newAttributes });

      expect(globalTipTapSynchronizer.syncNodeAttributes).toHaveBeenCalledWith(
        'test-component-1',
        'table',
        newAttributes,
        expect.objectContaining({
          optimistic: true,
          source: 'react',
        })
      );
    });

    it('should not sync when disabled', () => {
      const attributes = { headers: ['Col 1', 'Col 2'] };

      renderHook(() =>
        useAttributeSync('test-component-1', 'table', attributes, mockUpdateAttributes, {
          enabled: false,
        })
      );

      expect(globalTipTapSynchronizer.syncNodeAttributes).not.toHaveBeenCalled();
    });

    it('should not sync when componentId is null', () => {
      const attributes = { headers: ['Col 1', 'Col 2'] };

      renderHook(() =>
        useAttributeSync(null, 'table', attributes, mockUpdateAttributes, { enabled: true })
      );

      expect(globalTipTapSynchronizer.syncNodeAttributes).not.toHaveBeenCalled();
    });
  });

  describe('External State Updates', () => {
    it('should handle external component state updates', () => {
      const attributes = { headers: ['Col 1', 'Col 2'] };

      renderHook(() =>
        useAttributeSync('test-component-1', 'table', attributes, mockUpdateAttributes, {
          enabled: true,
        })
      );

      // Simulate external state update
      const updateEvent = new CustomEvent('component-state-update', {
        detail: {
          componentId: 'test-component-1',
          attributes: { headers: ['Updated Col 1', 'Updated Col 2'] },
        },
      });

      act(() => {
        document.dispatchEvent(updateEvent);
      });

      expect(mockUpdateAttributes).toHaveBeenCalledWith({
        headers: ['Updated Col 1', 'Updated Col 2'],
      });
    });

    it('should ignore updates for different components', () => {
      renderHook(() =>
        useAttributeSync(
          'test-component-1',
          'table',
          { headers: ['Col 1'] },
          mockUpdateAttributes,
          { enabled: true }
        )
      );

      // Simulate update for different component
      const updateEvent = new CustomEvent('component-state-update', {
        detail: {
          componentId: 'different-component',
          attributes: { headers: ['Should not update'] },
        },
      });

      act(() => {
        document.dispatchEvent(updateEvent);
      });

      expect(mockUpdateAttributes).not.toHaveBeenCalled();
    });
  });

  describe('Conflict Detection', () => {
    it('should provide conflict checking functionality', () => {
      const { result } = renderHook(() =>
        useAttributeSync(
          'test-component-1',
          'table',
          { headers: ['Col 1', 'Col 2'] },
          mockUpdateAttributes,
          { enabled: true, detectConflicts: true }
        )
      );

      expect(typeof result.current.checkForConflicts).toBe('function');

      act(() => {
        const hasConflicts = result.current.checkForConflicts();
        expect(typeof hasConflicts).toBe('boolean');
      });
    });

    it('should provide manual sync functionality', () => {
      const { result } = renderHook(() =>
        useAttributeSync(
          'test-component-1',
          'table',
          { headers: ['Col 1', 'Col 2'] },
          mockUpdateAttributes,
          { enabled: true }
        )
      );

      expect(typeof result.current.syncNow).toBe('function');

      act(() => {
        result.current.syncNow();
      });

      expect(globalTipTapSynchronizer.syncNodeAttributes).toHaveBeenCalled();
    });
  });

  describe('Options Configuration', () => {
    it('should respect custom debounce settings', () => {
      renderHook(() =>
        useAttributeSync(
          'test-component-1',
          'table',
          { headers: ['Col 1', 'Col 2'] },
          mockUpdateAttributes,
          { enabled: true, debounceMs: 500 }
        )
      );

      // The debounce setting should be used in the mocked debounce function
      expect(globalTipTapSynchronizer.syncNodeAttributes).toHaveBeenCalled();
    });

    it('should respect optimistic update settings', () => {
      renderHook(() =>
        useAttributeSync(
          'test-component-1',
          'table',
          { headers: ['Col 1', 'Col 2'] },
          mockUpdateAttributes,
          { enabled: true, optimistic: false }
        )
      );

      expect(globalTipTapSynchronizer.syncNodeAttributes).toHaveBeenCalledWith(
        'test-component-1',
        'table',
        expect.any(Object),
        expect.objectContaining({
          optimistic: false,
          source: 'react',
        })
      );
    });
  });
});

describe('useContentSync', () => {
  const mockOnContentChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should sync content changes with unified store', () => {
      const content = { type: 'doc', content: [] };

      const { rerender } = renderHook(
        ({ contentData }) =>
          useContentSync('block-123', contentData, mockOnContentChange, {
            enabled: true,
            debounceMs: 0,
          }),
        { initialProps: { contentData: content } }
      );

      expect(globalTipTapSynchronizer.syncWithUnifiedStore).toHaveBeenCalledWith(
        'block-123',
        content,
        { source: 'tiptap' }
      );

      // Change content
      const newContent = { type: 'doc', content: [{ type: 'paragraph' }] };
      rerender({ contentData: newContent });

      expect(globalTipTapSynchronizer.syncWithUnifiedStore).toHaveBeenCalledWith(
        'block-123',
        newContent,
        { source: 'tiptap' }
      );
    });

    it('should not sync when disabled', () => {
      const content = { type: 'doc', content: [] };

      renderHook(() =>
        useContentSync('block-123', content, mockOnContentChange, { enabled: false })
      );

      expect(globalTipTapSynchronizer.syncWithUnifiedStore).not.toHaveBeenCalled();
    });

    it('should provide manual sync functionality', () => {
      const content = { type: 'doc', content: [] };

      const { result } = renderHook(() =>
        useContentSync('block-123', content, mockOnContentChange, { enabled: true })
      );

      expect(typeof result.current.syncContent).toBe('function');

      const newContent = { type: 'doc', content: [{ type: 'paragraph' }] };
      act(() => {
        result.current.syncContent(newContent);
      });

      expect(globalTipTapSynchronizer.syncWithUnifiedStore).toHaveBeenCalledWith(
        'block-123',
        newContent,
        { source: 'manual' }
      );
    });
  });
});

describe('useFullStateSync', () => {
  const mockUpdateAttributes = vi.fn();
  const mockOnContentChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Combined Functionality', () => {
    it('should combine attribute and content sync', () => {
      const attributes = { headers: ['Col 1', 'Col 2'] };
      const content = { type: 'doc', content: [] };

      const { result } = renderHook(() =>
        useFullStateSync(
          'test-component-1',
          'table',
          'block-123',
          attributes,
          content,
          mockUpdateAttributes,
          mockOnContentChange,
          { enabled: true, debounceMs: 0 }
        )
      );

      expect(result.current.attributes).toBeDefined();
      expect(result.current.content).toBeDefined();
      expect(typeof result.current.syncAll).toBe('function');
      expect(typeof result.current.checkAllConflicts).toBe('function');
    });

    it('should provide syncAll functionality', () => {
      const attributes = { headers: ['Col 1', 'Col 2'] };
      const content = { type: 'doc', content: [] };

      const { result } = renderHook(() =>
        useFullStateSync(
          'test-component-1',
          'table',
          'block-123',
          attributes,
          content,
          mockUpdateAttributes,
          mockOnContentChange,
          { enabled: true }
        )
      );

      act(() => {
        result.current.syncAll();
      });

      expect(globalTipTapSynchronizer.syncNodeAttributes).toHaveBeenCalled();
      expect(globalTipTapSynchronizer.syncWithUnifiedStore).toHaveBeenCalled();
    });
  });
});

describe('useStateSyncDebug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Debug Functionality', () => {
    it('should provide debug information', () => {
      const { result } = renderHook(() => useStateSyncDebug('test-component-1'));

      expect(result.current.stats).toBeDefined();
      expect(result.current.componentSnapshot).toBeDefined();
      expect(typeof result.current.logCurrentState).toBe('function');
    });

    it('should log debug information', () => {
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      const { result } = renderHook(() => useStateSyncDebug('test-component-1'));

      act(() => {
        result.current.logCurrentState();
      });

      expect(consoleSpy).toHaveBeenCalledWith('State Sync Debug');
      expect(consoleLogSpy).toHaveBeenCalledWith('Component ID:', 'test-component-1');
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      // Restore console methods
      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });
});

describe('Error Handling', () => {
  const mockUpdateAttributes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle synchronization errors gracefully', () => {
    // Mock syncNodeAttributes to throw an error
    vi.mocked(globalTipTapSynchronizer.syncNodeAttributes).mockImplementationOnce(() => {
      throw new Error('Sync failed');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Should not throw, should handle error internally
    expect(() => {
      renderHook(() =>
        useAttributeSync(
          'test-component-1',
          'table',
          { headers: ['Col 1', 'Col 2'] },
          mockUpdateAttributes,
          { enabled: true, debounceMs: 0 }
        )
      );
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith('Attribute sync failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should handle updateAttributes errors gracefully', () => {
    mockUpdateAttributes.mockImplementationOnce(() => {
      throw new Error('Update failed');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() =>
      useAttributeSync(
        'test-component-1',
        'table',
        { headers: ['Col 1', 'Col 2'] },
        mockUpdateAttributes,
        { enabled: true }
      )
    );

    // Simulate external update that would trigger the error
    const updateEvent = new CustomEvent('component-state-update', {
      detail: {
        componentId: 'test-component-1',
        attributes: { headers: ['Updated Col 1'] },
      },
    });

    act(() => {
      document.dispatchEvent(updateEvent);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update component attributes:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
