// ABOUTME: Centralized mock registry with tiered mocking system for optimal test performance

import React from 'react';
import { vi } from 'vitest';

/**
 * Mock complexity levels for different test scenarios
 */
export type MockTier = 'minimal' | 'lightweight' | 'comprehensive';

/**
 * Mock configuration interface
 */
interface MockConfig {
  tier: MockTier;
  dependencies: string[];
  setup: () => Record<string, any>;
  cleanup?: () => void;
}

/**
 * Registry of all available mocks organized by tier
 */
export class MockRegistry {
  private static instance: MockRegistry;
  private mocks = new Map<string, MockConfig>();
  private activeMocks = new Set<string>();

  static getInstance(): MockRegistry {
    if (!MockRegistry.instance) {
      MockRegistry.instance = new MockRegistry();
    }
    return MockRegistry.instance;
  }

  /**
   * Register a mock configuration
   */
  register(name: string, config: MockConfig) {
    this.mocks.set(name, config);
  }

  /**
   * Apply mocks for a specific tier
   */
  applyTier(tier: MockTier, includes?: string[], excludes?: string[]) {
    const mocksToApply = Array.from(this.mocks.entries()).filter(([name, config]) => {
      // Filter by tier
      if (config.tier !== tier) return false;

      // Apply includes filter
      if (includes && !includes.includes(name)) return false;

      // Apply excludes filter
      if (excludes && excludes.includes(name)) return false;

      return true;
    });

    // Apply each mock
    mocksToApply.forEach(([name, config]) => {
      if (!this.activeMocks.has(name)) {
        config.setup();
        this.activeMocks.add(name);
      }
    });

    return mocksToApply.map(([name]) => name);
  }

  /**
   * Clear all active mocks
   */
  cleanup() {
    this.mocks.forEach((config, name) => {
      if (this.activeMocks.has(name) && config.cleanup) {
        config.cleanup();
      }
    });
    this.activeMocks.clear();
    vi.clearAllMocks();
  }

  /**
   * Get mock by name
   */
  getMock(name: string) {
    return this.mocks.get(name);
  }

  /**
   * List all registered mocks
   */
  list(tier?: MockTier) {
    if (tier) {
      return Array.from(this.mocks.entries())
        .filter(([, config]) => config.tier === tier)
        .map(([name]) => name);
    }
    return Array.from(this.mocks.keys());
  }
}

// Global registry instance
export const mockRegistry = MockRegistry.getInstance();

/**
 * Register core mocks for different tiers
 */

// MINIMAL TIER - Bare essentials for unit tests
mockRegistry.register('react-router-minimal', {
  tier: 'minimal',
  dependencies: ['react-router-dom'],
  setup: () => {
    vi.mock('react-router-dom', () => ({
      useNavigate: vi.fn(() => vi.fn()),
      useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
      useParams: vi.fn(() => ({})),
      Link: ({ children, to, ...props }: any) => (
        <a href={to} {...props}>
          {children}
        </a>
      ),
      Navigate: () => null,
      Outlet: () => null,
    }));
    return {};
  },
});

mockRegistry.register('editor-store-minimal', {
  tier: 'minimal',
  dependencies: ['@/store/editorStore'],
  setup: () => {
    vi.mock('@/store/editorStore', () => ({
      useEditorStore: vi.fn(() => ({
        nodes: [],
        selectedNodeId: null,
        addNode: vi.fn(),
        updateNode: vi.fn(),
        deleteNode: vi.fn(),
      })),
    }));
    return {};
  },
});

// LIGHTWEIGHT TIER - Essential functionality with fast mocks
mockRegistry.register('supabase-lightweight', {
  tier: 'lightweight',
  dependencies: ['@/integrations/supabase/client'],
  setup: () => {
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          onAuthStateChange: vi
            .fn()
            .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
    }));
    return {};
  },
});

mockRegistry.register('tanstack-query-lightweight', {
  tier: 'lightweight',
  dependencies: ['@tanstack/react-query'],
  setup: () => {
    vi.mock('@tanstack/react-query', () => ({
      useQuery: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
      useMutation: vi.fn(() => ({ mutate: vi.fn(), isLoading: false })),
      useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    }));
    return {};
  },
});

// COMPREHENSIVE TIER - Full functionality for integration tests
mockRegistry.register('supabase-comprehensive', {
  tier: 'comprehensive',
  dependencies: ['@/integrations/supabase/client'],
  setup: () => {
    const { createMockSupabaseClient } = require('./supabase-mocks');
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: createMockSupabaseClient(),
    }));
    return {};
  },
});

mockRegistry.register('editor-comprehensive', {
  tier: 'comprehensive',
  dependencies: ['@/store/editorStore'],
  setup: () => {
    vi.mock('@/store/editorStore', () => ({
      useEditorStore: vi.fn(() => ({
        nodes: [],
        selectedNodeId: null,
        addNode: vi.fn(),
        updateNode: vi.fn(),
        deleteNode: vi.fn(),
        setSelectedNode: vi.fn(),
        clearSelection: vi.fn(),
        isFullscreen: false,
        toggleFullscreen: vi.fn(),
        currentViewport: 'desktop',
        setViewport: vi.fn(),
        layouts: {
          desktop: { gridSettings: { columns: 12 }, items: [] },
          mobile: { gridSettings: { columns: 4 }, items: [] },
        },
      })),
    }));
    return {};
  },
});

/**
 * Quick setup functions for different test scenarios
 */
export const setupMinimalMocks = (includes?: string[], excludes?: string[]) => {
  return mockRegistry.applyTier('minimal', includes, excludes);
};

export const setupLightweightMocks = (includes?: string[], excludes?: string[]) => {
  return mockRegistry.applyTier('lightweight', includes, excludes);
};

export const setupComprehensiveMocks = (includes?: string[], excludes?: string[]) => {
  return mockRegistry.applyTier('comprehensive', includes, excludes);
};

/**
 * Auto-detect optimal mock tier based on test context
 */
export const setupOptimalMocks = (testContext: {
  isUnit?: boolean;
  isIntegration?: boolean;
  hasUserInteraction?: boolean;
  hasAsyncOperations?: boolean;
  hasComplexState?: boolean;
}) => {
  if (testContext.isIntegration || testContext.hasComplexState) {
    return setupComprehensiveMocks();
  }

  if (testContext.hasUserInteraction || testContext.hasAsyncOperations) {
    return setupLightweightMocks();
  }

  return setupMinimalMocks();
};

/**
 * Performance-optimized mock presets
 */
export const mockPresets = {
  /**
   * Ultra-fast unit tests - render testing only
   */
  ultraFast: () => setupMinimalMocks(['react-router-minimal', 'editor-store-minimal']),

  /**
   * Fast unit tests - basic interactions
   */
  fast: () => setupLightweightMocks(['supabase-lightweight', 'tanstack-query-lightweight']),

  /**
   * Standard integration tests
   */
  standard: () => setupComprehensiveMocks(['supabase-comprehensive', 'editor-comprehensive']),

  /**
   * Editor-specific optimized mocks
   */
  editor: () => {
    mockRegistry.applyTier('lightweight', ['editor-store-minimal', 'react-router-minimal']);
    // Add editor-specific mocks
    vi.mock('@xyflow/react', () => ({
      ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
      useReactFlow: () => ({ getViewport: () => ({ x: 0, y: 0, zoom: 1 }) }),
      Controls: () => <div data-testid="controls" />,
      Background: () => <div data-testid="background" />,
    }));

    vi.mock('@dnd-kit/core', () => ({
      DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
      useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
    }));

    return ['editor-optimized'];
  },

  /**
   * Admin-specific optimized mocks
   */
  admin: () => {
    setupLightweightMocks(['supabase-lightweight', 'tanstack-query-lightweight']);

    // Add admin-specific mocks
    vi.mock('@/components/ui/data-table', () => ({
      DataTable: ({ children }: any) => <div data-testid="data-table">{children}</div>,
    }));

    return ['admin-optimized'];
  },
};

/**
 * Cleanup function
 */
export const cleanupMocks = () => {
  mockRegistry.cleanup();
};
