// ABOUTME: Stabilized provider chain with isolated error boundaries and React 18 compliant initialization

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../ErrorBoundary';
import AuthSessionProvider from '../auth/AuthSessionProvider';
import { CustomThemeProvider } from '../theme/CustomThemeProvider';
import PWAProvider from '../pwa/PWAProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  // CRITICAL FIX: Use React 18 lazy initialization pattern to prevent hook corruption
  // This ensures React is fully initialized before QueryClient creation
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - per [D3.4] TanStack Query standards
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (
                error?.message?.includes('unauthorized') ||
                error?.message?.includes('forbidden')
              ) {
                return false;
              }
              // Retry up to 2 times for other errors - per KB standards
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false, // Don't retry mutations by default
          },
        },
      })
  );

  return (
    // STRATEGIC FIX: Isolate each provider with its own Error Boundary
    // This prevents cascade failures per Error Boundary Hierarchy requirements
    <ErrorBoundary tier="provider" context="QueryClientProvider">
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary tier="provider" context="AuthSessionProvider">
          <AuthSessionProvider>
            <ErrorBoundary tier="provider" context="CustomThemeProvider">
              <CustomThemeProvider defaultTheme="light" storageKey="evidens-theme">
                <ErrorBoundary tier="provider" context="PWAProvider">
                  <PWAProvider>{children}</PWAProvider>
                </ErrorBoundary>
              </CustomThemeProvider>
            </ErrorBoundary>
          </AuthSessionProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
