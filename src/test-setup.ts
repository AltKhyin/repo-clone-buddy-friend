// ABOUTME: Global test setup configuration for Vitest and React Testing Library
import '@testing-library/jest-dom';
import React from 'react';
import { vi, beforeEach, afterEach, afterAll, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockSupabaseClient, resetSupabaseMocks } from './test-utils/supabase-mocks';
import './test-utils/custom-matchers';

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Polyfill pointer capture APIs for Radix UI components
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || vi.fn(() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || vi.fn();
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || vi.fn();
}

// Polyfill scrollIntoView for JSDOM
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || vi.fn();
}

// Polyfill getBoundingClientRect for layout-dependent tests
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect =
    Element.prototype.getBoundingClientRect ||
    vi.fn(() => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }));
}

// Mock animate method for animation-based components
if (typeof Element !== 'undefined') {
  Element.prototype.animate =
    Element.prototype.animate ||
    vi.fn(() => ({
      cancel: vi.fn(),
      finish: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      reverse: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
}

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.location for navigation testing
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: 0,
    key: vi.fn(),
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Supabase client globally
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient(),
}));

// Mock supabase functions
vi.mock('@/lib/supabase-functions', () => ({
  invokeFunction: vi.fn().mockResolvedValue({ success: true }),
  invokeFunctionGet: vi.fn().mockResolvedValue({ success: true }),
  invokeFunctionPost: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    session: null,
    user: null,
    isLoading: false,
    setSession: vi.fn(),
    initialize: vi.fn(() => vi.fn()), // Returns cleanup function
  })),
}));

// Mock PWA hooks
vi.mock('@/hooks/usePWA', () => ({
  usePWA: vi.fn(() => ({
    isInstallable: false,
    install: vi.fn(),
    isInstalled: false,
  })),
}));

// Mock mobile detection
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

// Mock toast notifications
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

// Mock theme provider
vi.mock('@/components/theme/CustomThemeProvider', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
    actualTheme: 'light',
  })),
  CustomThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    useMatch: vi.fn(() => null),
    useMatches: vi.fn(() => []),
    useRouteError: vi.fn(() => null),
    Outlet: ({ context }: { context?: any }) => null,
    Link: ({ children, to, ...props }: any) =>
      React.createElement('a', { href: to, ...props }, children),
    NavLink: ({ children, to, ...props }: any) =>
      React.createElement('a', { href: to, ...props }, children),
    Navigate: () => null,
    useBlocker: vi.fn(() => ({ state: 'unblocked' })),
    useNavigationType: vi.fn(() => 'POP'),
    useResolvedPath: vi.fn((to: string) => ({ pathname: to, search: '', hash: '' })),
    useHref: vi.fn((to: string) => to),
    useLinkClickHandler: vi.fn(() => vi.fn()),
    useInRouterContext: vi.fn(() => true),
    useOutlet: vi.fn(() => null),
    useOutletContext: vi.fn(() => ({})),
  };
});

// Global setup and teardown
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  resetSupabaseMocks();

  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Reset localStorage and sessionStorage
  window.localStorage.clear();
  window.sessionStorage.clear();

  // Reset location
  window.location.href = 'http://localhost:3000/';
  window.location.pathname = '/';
  window.location.search = '';
  window.location.hash = '';
});

afterEach(() => {
  // Cleanup DOM after each test
  cleanup();

  // Reset any global state
  vi.restoreAllMocks();
});

// PERFORMANCE: Add performance monitoring matchers
expect.extend(performanceMatchers);

// PERFORMANCE: Print test suite summary at the end
afterAll(() => {
  if (process.env.NODE_ENV !== 'test' || process.env.VITEST_PERFORMANCE_SUMMARY === 'false') {
    return;
  }

  // Print performance summary
  globalTestTracker.printSummary();
});
