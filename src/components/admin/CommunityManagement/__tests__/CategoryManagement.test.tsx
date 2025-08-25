// ABOUTME: Simplified CategoryManagement tests - basic rendering only

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryManagement } from '../CategoryManagement';

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CategoryManagement', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <CategoryManagement />
      </TestWrapper>
    );
    // Simplified test - just ensure it renders without crashing
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });
});