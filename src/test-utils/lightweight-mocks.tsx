// ABOUTME: Lightweight mock utilities for fast unit tests with minimal overhead

import React from 'react';
import { vi } from 'vitest';

/**
 * Lightweight React Router mock for unit tests
 * Only includes essential functionality to minimize performance impact
 */
export const createLightweightRouterMock = () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useLocation: vi.fn().mockReturnValue({ pathname: '/', search: '', hash: '', state: null }),
  useParams: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props} data-testid="router-link">
      {children}
    </a>
  ),
  Navigate: () => null,
  Outlet: () => null,
});

/**
 * Lightweight Supabase mock for unit tests
 * Provides minimal functionality without complex query building
 */
export const createLightweightSupabaseMock = () => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi
      .fn()
      .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
});

/**
 * Lightweight TanStack Query mock for unit tests
 */
export const createLightweightQueryMock = () => ({
  useQuery: vi.fn().mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useInfiniteQuery: vi.fn().mockReturnValue({
    data: { pages: [], pageParams: [] },
    isLoading: false,
    isError: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
  }),
  useMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isLoading: false,
    isError: false,
    error: null,
    data: null,
  }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  }),
});

/**
 * Lightweight store mock for unit tests
 */
export const createLightweightStoreMock = () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  useEditorStore: vi.fn().mockReturnValue({
    nodes: [],
    selectedNodeId: null,
    addNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
  }),
});

/**
 * Lightweight UI component mocks
 */
export const createLightweightUIMocks = () => ({
  // Replace heavy components with lightweight versions
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  Select: ({ children, value, onValueChange }: any) => (
    <select data-testid="select" value={value} onChange={e => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  Tabs: ({ children, value }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid="tabs-content" data-value={value}>
      {children}
    </div>
  ),
});

/**
 * Quick setup function for lightweight unit tests
 */
export const setupLightweightTest = () => {
  const routerMock = createLightweightRouterMock();
  const supabaseMock = createLightweightSupabaseMock();
  const queryMock = createLightweightQueryMock();
  const storeMock = createLightweightStoreMock();
  const uiMocks = createLightweightUIMocks();

  // Apply all mocks
  vi.mock('react-router-dom', () => routerMock);
  vi.mock('@/integrations/supabase/client', () => ({ supabase: supabaseMock }));
  vi.mock('@tanstack/react-query', () => queryMock);
  vi.mock('@/store/authStore', () => storeMock);
  vi.mock('@/components/ui/dialog', () => uiMocks);
  vi.mock('@/components/ui/select', () => uiMocks);
  vi.mock('@/components/ui/tabs', () => uiMocks);

  return {
    router: routerMock,
    supabase: supabaseMock,
    query: queryMock,
    store: storeMock,
    ui: uiMocks,
  };
};

/**
 * Performance-optimized test wrapper for unit tests
 */
export const createFastTestWrapper = ({ children }: { children: React.ReactNode }) => {
  // Minimal wrapper without heavy providers
  return <div data-testid="test-wrapper">{children}</div>;
};

/**
 * Mock implementations that return immediately (no async delays)
 */
export const instantMocks = {
  setTimeout: (fn: () => void) => {
    fn();
    return 1;
  },
  requestAnimationFrame: (fn: (time: number) => void) => {
    fn(0);
    return 1;
  },
  Promise: {
    resolve: (value: any) => ({ then: (fn: (val: any) => void) => fn(value) }),
    reject: (error: any) => ({ catch: (fn: (err: any) => void) => fn(error) }),
  },
};

/**
 * Replace async operations with synchronous versions for testing
 */
export const synchronizeMocks = () => {
  // Mock timers to execute immediately
  vi.stubGlobal('setTimeout', instantMocks.setTimeout);
  vi.stubGlobal('requestAnimationFrame', instantMocks.requestAnimationFrame);

  // Mock IntersectionObserver for components that use it
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  );

  // Mock ResizeObserver for responsive components
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  );
};

/**
 * Cleanup function for lightweight tests
 */
export const cleanupLightweightTest = () => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
};

export {
  createLightweightRouterMock as fastRouterMock,
  createLightweightSupabaseMock as fastSupabaseMock,
  createLightweightQueryMock as fastQueryMock,
  createLightweightStoreMock as fastStoreMock,
  createLightweightUIMocks as fastUIMocks,
};
