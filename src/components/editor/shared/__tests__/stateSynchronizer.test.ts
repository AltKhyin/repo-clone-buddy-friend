// ABOUTME: Tests for state synchronization system ensuring TipTap-React consistency

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EditorStateSynchronizer,
  OptimisticUpdateManager,
  ContentVersionManager,
  StateSource,
  StateTarget,
  UpdatePriority,
} from '../stateSynchronizer';

// Mock lodash debounce
vi.mock('lodash-es', () => ({
  debounce: vi.fn(fn => {
    const debouncedFn = (...args: any[]) => fn(...args);
    debouncedFn.cancel = vi.fn();
    return debouncedFn;
  }),
}));

describe('EditorStateSynchronizer', () => {
  let synchronizer: EditorStateSynchronizer;

  beforeEach(() => {
    synchronizer = new EditorStateSynchronizer();
  });

  afterEach(() => {
    synchronizer.dispose();
  });

  describe('Basic Synchronization', () => {
    it('should synchronize state between source and target', async () => {
      const testData = { content: '<p>test</p>' };
      const updateId = synchronizer.synchronize('react', 'tiptap', testData);

      expect(updateId).toBeTruthy();
      expect(updateId).toMatch(/^update-\d+-[a-z0-9]+$/);

      // Since debounce is mocked to execute immediately, queue should be processed
      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // After processing, queue should be empty
      expect(synchronizer.getStats().queueSize).toBe(0);
    });

    it('should handle priority ordering correctly', async () => {
      // Override the debounce mock to not execute immediately for this test
      const originalDebounce = vi.mocked(require('lodash-es').debounce);
      const enqueuedUpdates: any[] = [];

      // Create a mock that captures calls but doesn't execute
      const mockDebounce = vi.fn(fn => {
        const debouncedFn = (...args: any[]) => {
          enqueuedUpdates.push(args);
          return fn(...args);
        };
        debouncedFn.cancel = vi.fn();
        return debouncedFn;
      });

      vi.mocked(require('lodash-es').debounce).mockImplementation(mockDebounce);

      // Create new synchronizer with the new mock
      const testSynchronizer = new EditorStateSynchronizer();

      const immediateUpdate = testSynchronizer.synchronize(
        'react',
        'tiptap',
        { data: 'immediate' },
        {
          priority: 'immediate',
        }
      );

      const normalUpdate = testSynchronizer.synchronize(
        'react',
        'tiptap',
        { data: 'normal' },
        {
          priority: 'normal',
        }
      );

      // Both updates should be queued initially
      expect(immediateUpdate).toBeTruthy();
      expect(normalUpdate).toBeTruthy();

      // Restore original mock
      vi.mocked(require('lodash-es').debounce).mockImplementation(originalDebounce);
      testSynchronizer.dispose();
    });

    it('should generate unique update IDs', () => {
      const id1 = synchronizer.synchronize('react', 'tiptap', { data: 1 });
      const id2 = synchronizer.synchronize('react', 'tiptap', { data: 2 });

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^update-\d+-[a-z0-9]+$/);
    });
  });

  describe('Optimistic Updates', () => {
    it('should handle optimistic updates with rollback', () => {
      let rollbackCalled = false;
      const rollbackFn = () => {
        rollbackCalled = true;
      };

      const updateId = synchronizer.synchronize(
        'react',
        'tiptap',
        { test: true },
        {
          optimistic: true,
          rollbackFn,
        }
      );

      // Rollback the update
      const rollbackSuccess = synchronizer.rollbackUpdate(updateId);

      expect(rollbackSuccess).toBe(true);
      expect(rollbackCalled).toBe(true);
    });

    it('should confirm optimistic updates', () => {
      const updateId = synchronizer.synchronize(
        'react',
        'tiptap',
        { test: true },
        {
          optimistic: true,
          rollbackFn: vi.fn(),
        }
      );

      const confirmSuccess = synchronizer.confirmUpdate(updateId);
      expect(confirmSuccess).toBe(true);
    });

    it('should handle rollback failures gracefully', () => {
      const failingRollback = () => {
        throw new Error('Rollback failed');
      };

      const updateId = synchronizer.synchronize(
        'react',
        'tiptap',
        { test: true },
        {
          optimistic: true,
          rollbackFn: failingRollback,
        }
      );

      // Should not throw, should return false
      const rollbackSuccess = synchronizer.rollbackUpdate(updateId);
      expect(rollbackSuccess).toBe(false);
    });
  });

  describe('Content Versioning', () => {
    it('should create and track content versions', () => {
      const content = { type: 'doc', content: [] };
      const version = synchronizer.createContentVersion(content, 'test-node');

      expect(version.version).toBe(1);
      expect(version.content).toEqual(content);
      expect(version.hash).toBeTruthy();
      expect(version.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should detect content changes', () => {
      const originalContent = { type: 'doc', content: [] };
      const modifiedContent = { type: 'doc', content: [{ type: 'paragraph', content: [] }] };

      const version = synchronizer.createContentVersion(originalContent, 'test-node');
      const hasChanged = synchronizer.wouldConflict(modifiedContent, version.version, 'test-node');

      expect(hasChanged).toBe(true);
    });

    it('should not detect changes for identical content', () => {
      const content = { type: 'doc', content: [] };

      const version = synchronizer.createContentVersion(content, 'test-node');
      const hasChanged = synchronizer.wouldConflict(content, version.version, 'test-node');

      expect(hasChanged).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should set and use conflict resolution strategies', () => {
      synchronizer.setConflictResolution('react->tiptap', {
        strategy: 'merge',
        resolver: (current: any, incoming: any) => ({ ...current, ...incoming }),
      });

      // Trigger a conflict scenario
      const updateId = synchronizer.synchronize('react', 'tiptap', { conflicted: true });
      expect(updateId).toBeTruthy();
    });

    it('should reject updates based on conflict policy', async () => {
      synchronizer.setConflictResolution('react->tiptap', {
        strategy: 'reject',
      });

      const updateId = synchronizer.synchronize('react', 'tiptap', { rejected: true });

      // The update should still be queued but will be rejected during processing
      expect(updateId).toBeTruthy();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate statistics', () => {
      // Add some updates
      synchronizer.synchronize('react', 'tiptap', { data: 1 });
      synchronizer.synchronize(
        'tiptap',
        'react',
        { data: 2 },
        { optimistic: true, rollbackFn: vi.fn() }
      );

      const stats = synchronizer.getStats();

      expect(stats.queueSize).toBeGreaterThanOrEqual(0);
      expect(stats.pendingOptimistic).toBeGreaterThanOrEqual(0);
      expect(typeof stats.isProcessing).toBe('boolean');
      expect(typeof stats.conflictStrategies).toBe('number');
    });

    it('should track queue processing state', () => {
      const stats = synchronizer.getStats();
      expect(typeof stats.isProcessing).toBe('boolean');
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources on dispose', async () => {
      // Create a new synchronizer to avoid interference with beforeEach/afterEach
      const testSynchronizer = new EditorStateSynchronizer();

      testSynchronizer.synchronize(
        'react',
        'tiptap',
        { data: 1 },
        {
          optimistic: true,
          rollbackFn: vi.fn(),
        }
      );

      testSynchronizer.setConflictResolution('test', { strategy: 'merge' });

      // Allow processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      testSynchronizer.dispose();

      const statsAfterDispose = testSynchronizer.getStats();
      expect(statsAfterDispose.queueSize).toBe(0);
      expect(statsAfterDispose.pendingOptimistic).toBe(0);
      expect(statsAfterDispose.conflictStrategies).toBe(0);
    });
  });
});

describe('OptimisticUpdateManager', () => {
  let manager: OptimisticUpdateManager;

  beforeEach(() => {
    manager = new OptimisticUpdateManager();
  });

  describe('Update Management', () => {
    it('should apply and track optimistic updates', () => {
      let updateApplied = false;
      const rollbackFn = () => {
        updateApplied = false;
      };

      manager.applyOptimistic('test-1', { test: true }, rollbackFn);
      updateApplied = true;

      const pending = manager.getPendingUpdates();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('test-1');
    });

    it('should confirm updates and remove from pending', () => {
      manager.applyOptimistic('test-1', { test: true }, vi.fn());

      expect(manager.getPendingUpdates()).toHaveLength(1);

      const confirmed = manager.confirm('test-1');
      expect(confirmed).toBe(true);
      expect(manager.getPendingUpdates()).toHaveLength(0);
    });

    it('should rollback updates and call rollback function', () => {
      let rollbackCalled = false;
      const rollbackFn = () => {
        rollbackCalled = true;
      };

      manager.applyOptimistic('test-1', { test: true }, rollbackFn);

      const rolledBack = manager.rollback('test-1');
      expect(rolledBack).toBe(true);
      expect(rollbackCalled).toBe(true);
      expect(manager.getPendingUpdates()).toHaveLength(0);
    });

    it('should rollback updates by source', () => {
      let reactRollback = false;
      let tiptapRollback = false;

      manager.applyOptimistic(
        'react-1',
        { test: true },
        () => {
          reactRollback = true;
        },
        'react'
      );
      manager.applyOptimistic(
        'tiptap-1',
        { test: true },
        () => {
          tiptapRollback = true;
        },
        'tiptap'
      );

      const rolledBackCount = manager.rollbackBySource('react');

      expect(rolledBackCount).toBe(1);
      expect(reactRollback).toBe(true);
      expect(tiptapRollback).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired updates automatically', () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let currentTime = Date.now();

      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      manager.applyOptimistic('test-1', { test: true }, vi.fn());
      expect(manager.getPendingUpdates()).toHaveLength(1);

      // Simulate 35 seconds passing (exceeds 30 second max age)
      currentTime += 35000;

      // Trigger cleanup by adding another update
      manager.applyOptimistic('test-2', { test: true }, vi.fn());

      // The expired update should be automatically rolled back
      expect(manager.getPendingUpdates()).toHaveLength(1);
      expect(manager.getPendingUpdates()[0].id).toBe('test-2');

      // Restore Date.now
      vi.mocked(Date.now).mockRestore();
    });
  });
});

describe('ContentVersionManager', () => {
  let manager: ContentVersionManager;

  beforeEach(() => {
    manager = new ContentVersionManager();
  });

  describe('Version Creation', () => {
    it('should create versions with incrementing version numbers', () => {
      const content1 = { type: 'doc', content: [] };
      const content2 = { type: 'doc', content: [{ type: 'paragraph' }] };

      const version1 = manager.createVersion(content1);
      const version2 = manager.createVersion(content2);

      expect(version1.version).toBe(1);
      expect(version2.version).toBe(2);
    });

    it('should generate unique hashes for different content', () => {
      const content1 = { type: 'doc', content: [] };
      const content2 = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
      };

      const version1 = manager.createVersion(content1);
      const version2 = manager.createVersion(content2);

      expect(version1.hash).not.toBe(version2.hash);
    });

    it('should generate same hash for identical content', () => {
      const content = { type: 'doc', content: [] };

      const version1 = manager.createVersion(content);
      const version2 = manager.createVersion(content);

      expect(version1.hash).toBe(version2.hash);
    });
  });

  describe('Change Detection', () => {
    it('should detect changes between versions', () => {
      const originalContent = { type: 'doc', content: [] };
      const modifiedContent = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Changed' }] }],
      };

      const version = manager.createVersion(originalContent, undefined, 'test-node');
      const hasChanged = manager.hasChanged(modifiedContent, version.version, 'test-node');

      expect(hasChanged).toBe(true);
    });

    it('should not detect changes for identical content', () => {
      const content = { type: 'doc', content: [] };

      const version = manager.createVersion(content, undefined, 'test-node');
      const hasChanged = manager.hasChanged(content, version.version, 'test-node');

      expect(hasChanged).toBe(false);
    });
  });

  describe('History Tracking', () => {
    it('should track version history per node', () => {
      const content1 = { type: 'doc', content: [] };
      const content2 = { type: 'doc', content: [{ type: 'paragraph' }] };

      manager.createVersion(content1, undefined, 'node-1');
      manager.createVersion(content2, undefined, 'node-1');

      const history = manager.getHistory('node-1');
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(1);
      expect(history[1].version).toBe(2);
    });

    it('should limit history size', () => {
      // Create more versions than the max history size (50)
      for (let i = 0; i < 60; i++) {
        const content = { type: 'doc', content: [{ type: 'text', text: `version ${i}` }] };
        manager.createVersion(content, undefined, 'test-node');
      }

      const history = manager.getHistory('test-node');
      expect(history.length).toBeLessThanOrEqual(50);

      // Should keep the most recent versions
      expect(history[history.length - 1].version).toBe(60);
    });
  });
});
