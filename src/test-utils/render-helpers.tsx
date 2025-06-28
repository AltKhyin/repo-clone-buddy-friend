// ABOUTME: Enhanced render functions with all necessary providers for comprehensive component testing

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { QueryWrapper, createTestQueryClient } from './query-client-wrapper';
import { MockAuthProvider } from './mock-providers';
import { Toaster } from '@/components/ui/toaster';

/**
 * Enhanced render options with testing context
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Router options
  initialEntries?: string[];
  
  // Query client options
  queryClient?: QueryClient;
  
  // Authentication mocking
  mockAuth?: {
    isAuthenticated?: boolean;
    user?: {
      id: string;
      email: string;
      role?: string;
      subscription_tier?: string;
    };
  };
  
  // Theme options
  theme?: 'light' | 'dark';
  
  // Custom wrapper
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * All providers wrapper for comprehensive testing
 */
interface AllProvidersProps {
  children: React.ReactNode;
  initialEntries: string[];
  queryClient: QueryClient;
  mockAuth?: CustomRenderOptions['mockAuth'];
  theme: 'light' | 'dark';
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  initialEntries,
  queryClient,
  mockAuth,
  theme,
}) => {
  return (
    <div className={theme} data-testid="theme-wrapper">
      <MemoryRouter initialEntries={initialEntries}>
        <QueryWrapper queryClient={queryClient}>
          <MockAuthProvider mockAuth={mockAuth}>
            <div className="mock-theme-provider" data-theme={theme}>
              {children}
              <Toaster />
            </div>
          </MockAuthProvider>
        </QueryWrapper>
      </MemoryRouter>
    </div>
  );
};

/**
 * Enhanced render function with all providers
 * Use this for testing components that need full app context
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    mockAuth = { isAuthenticated: true, user: { id: '123', email: 'test@example.com' } },
    theme = 'light',
    wrapper,
    ...renderOptions
  } = options;

  const Wrapper = wrapper || (({ children }: { children: React.ReactNode }) => (
    <AllProviders
      initialEntries={initialEntries}
      queryClient={queryClient}
      mockAuth={mockAuth}
      theme={theme}
    >
      {children}
    </AllProviders>
  ));

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    queryClient,
  };
};

/**
 * Minimal render for testing components that don't need providers
 * Use this for testing pure UI components
 */
export const renderMinimal = (ui: React.ReactElement, options?: RenderOptions) => {
  return render(ui, options);
};

/**
 * Render with only router context
 * Use this for testing components that only need routing
 */
export const renderWithRouter = (
  ui: React.ReactElement,
  { initialEntries = ['/'], ...options }: { initialEntries?: string[] } & RenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Render with only query client context
 * Use this for testing components that only need TanStack Query
 */
export const renderWithQuery = (
  ui: React.ReactElement,
  { queryClient = createTestQueryClient(), ...options }: { queryClient?: QueryClient } & RenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryWrapper queryClient={queryClient}>
      {children}
    </QueryWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Helper for testing error boundaries
 */
export const renderWithErrorBoundary = (
  ui: React.ReactElement,
  { onError, ...options }: { onError?: (error: Error) => void } & CustomRenderOptions = {}
) => {
  const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    const [hasError, setHasError] = React.useState(false);
    
    React.useEffect(() => {
      const errorHandler = (error: ErrorEvent) => {
        setHasError(true);
        onError?.(new Error(error.message));
      };
      
      window.addEventListener('error', errorHandler);
      return () => window.removeEventListener('error', errorHandler);
    }, []);

    if (hasError) {
      return <div data-testid="error-boundary">Something went wrong</div>;
    }

    return <>{children}</>;
  };

  return renderWithProviders(
    <ErrorBoundary>{ui}</ErrorBoundary>,
    options
  );
};