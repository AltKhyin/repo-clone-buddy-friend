// ABOUTME: Essential test providers for wrapping components in tests with necessary context
import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a fresh query client for each test to avoid cache pollution
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No retries in tests
        gcTime: 0, // No cache persistence in tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Essential providers wrapper for testing React components
export function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Convenience render function with providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, {
    wrapper: TestProviders,
  });
}
