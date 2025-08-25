// ABOUTME: Simplified AnnouncementManagement tests - basic rendering only

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnnouncementManagement } from '../AnnouncementManagement';

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

describe('AnnouncementManagement', () => {
  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <AnnouncementManagement />
      </TestWrapper>
    );
    // Simplified test - just ensure it renders
    expect(screen.getByText(/announcement/i)).toBeInTheDocument();
  });
});