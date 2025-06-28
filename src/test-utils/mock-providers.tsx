// ABOUTME: Mock providers for testing with proper authentication and context simulation

import React, { createContext, useContext } from 'react';
import { vi } from 'vitest';

// Mock the useTheme hook globally
vi.mock('@/components/theme/CustomThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    actualTheme: 'light',
  }),
  CustomThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

/**
 * Mock authentication context for testing
 */
interface MockAuthContextType {
  session: unknown;
  user: unknown;
  isLoading: boolean;
  setSession: (session: unknown) => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

/**
 * Mock authentication provider
 */
interface MockAuthProviderProps {
  children: React.ReactNode;
  mockAuth?: {
    isAuthenticated?: boolean;
    user?: {
      id: string;
      email: string;
      role?: string;
      subscription_tier?: string;
    };
  };
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
  children,
  mockAuth = { isAuthenticated: true, user: { id: '123', email: 'test@example.com' } },
}) => {
  const { isAuthenticated = true, user = { id: '123', email: 'test@example.com' } } = mockAuth;

  const mockSession = isAuthenticated ? {
    access_token: 'mock-access-token',
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        role: user.role || 'practitioner',
        subscription_tier: user.subscription_tier || 'free',
      },
    },
  } : null;

  const mockUser = isAuthenticated ? {
    id: user.id,
    email: user.email,
    role: user.role || 'practitioner',
    subscription_tier: user.subscription_tier || 'free',
  } : null;

  const contextValue: MockAuthContextType = {
    session: mockSession,
    user: mockUser,
    isLoading: false,
    setSession: vi.fn(),
  };

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Hook to access mock auth context in tests
 */
export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

/**
 * Mock Supabase client for testing
 */
export const createMockSupabaseClient = () => {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      update: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      delete: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  };
};

/**
 * Mock toast provider for testing
 */
export const MockToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock toast functionality for tests
  return <div data-testid="mock-toast-provider">{children}</div>;
};

/**
 * Mock theme context type matching the real implementation
 */
type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
}

const MockThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Mock theme provider for testing
 */
interface MockThemeProviderProps {
  children: React.ReactNode;
  theme?: Theme;
}

export const MockThemeProvider: React.FC<MockThemeProviderProps> = ({
  children,
  theme = 'light',
}) => {
  const mockThemeContext: ThemeContextType = {
    theme,
    setTheme: vi.fn(),
    actualTheme: theme === 'system' ? 'light' : theme as 'dark' | 'light',
  };

  return (
    <MockThemeContext.Provider value={mockThemeContext}>
      <div data-theme={theme} data-testid="mock-theme-provider">
        {children}
      </div>
    </MockThemeContext.Provider>
  );
};

/**
 * Mock useTheme hook for testing
 */
export const useMockTheme = () => {
  const context = useContext(MockThemeContext);
  if (context === undefined) {
    throw new Error('useMockTheme must be used within a MockThemeProvider');
  }
  return context;
};

/**
 * Mock PWA provider for testing
 */
export const MockPWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockPWAContext = {
    isInstallable: false,
    install: vi.fn(),
    isInstalled: false,
  };

  return (
    <div data-testid="mock-pwa-provider">
      {children}
    </div>
  );
};

/**
 * Comprehensive mock providers wrapper
 */
interface MockAllProvidersProps {
  children: React.ReactNode;
  mockAuth?: MockAuthProviderProps['mockAuth'];
  theme?: 'light' | 'dark';
}

export const MockAllProviders: React.FC<MockAllProvidersProps> = ({
  children,
  mockAuth,
  theme = 'light',
}) => {
  return (
    <MockThemeProvider theme={theme}>
      <MockPWAProvider>
        <MockToastProvider>
          <MockAuthProvider mockAuth={mockAuth}>
            {children}
          </MockAuthProvider>
        </MockToastProvider>
      </MockPWAProvider>
    </MockThemeProvider>
  );
};