// ABOUTME: TanStack Query test wrapper with proper cleanup and error handling for hook testing

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, RenderHookOptions } from '@testing-library/react';

/**
 * Creates a fresh QueryClient for testing with optimal settings
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster failures
        retry: false,
        // Disable cache time in tests for predictable behavior
        gcTime: 0,
        // Disable background refetching in tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Immediately consider data stale in tests
        staleTime: 0,
      },
      mutations: {
        // Disable retries for mutations in tests
        retry: false,
      },
    },
    // Disable logging in tests to reduce noise
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

/**
 * QueryClient provider wrapper for testing components that use queries
 */
interface QueryWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const QueryWrapper: React.FC<QueryWrapperProps> = ({ 
  children, 
  queryClient = createTestQueryClient() 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Enhanced renderHook with QueryClient wrapper
 * Use this for testing hooks that use TanStack Query
 */
export const renderHookWithQuery = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: {
    initialProps?: TProps;
    queryClient?: QueryClient;
  } & Omit<RenderHookOptions<TProps>, 'wrapper'>
) => {
  const queryClient = options?.queryClient || createTestQueryClient();
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryWrapper queryClient={queryClient}>{children}</QueryWrapper>
  );

  const result = renderHook(hook, {
    ...options,
    wrapper,
  });

  return {
    ...result,
    queryClient,
  };
};

/**
 * Utility to wait for queries to settle in tests
 */
export const waitForQueriesToSettle = async (queryClient: QueryClient) => {
  queryClient.getQueryCache().getAll().forEach(query => {
    if (query.state.fetchStatus === 'fetching') {
      query.cancel();
    }
  });
};

/**
 * Helper to mock successful query responses
 */
export const mockQuerySuccess = (queryClient: QueryClient, queryKey: unknown[], data: unknown) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Helper to mock query errors
 */
export const mockQueryError = (queryClient: QueryClient, queryKey: unknown[], error: Error) => {
  queryClient.setQueryData(queryKey, () => {
    throw error;
  });
};