// ABOUTME: Tests for usePostCategories hook ensuring it fetches categories correctly from the database

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePostCategories } from '../usePostCategories';

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        neq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [
              {
                id: 1,
                name: 'discussao-geral',
                label: 'Discussão Geral',
                description: 'Discussões gerais da comunidade',
                text_color: '#ffffff',
                border_color: '#4b5563',
                background_color: '#6b7280',
                icon_name: null,
                display_order: 1,
                is_active: true,
                is_system: false,
                hidden_from_user_selection: false
              },
              {
                id: 2,
                name: 'review',
                label: 'Review',
                description: 'Discussões sobre reviews',
                text_color: '#ffffff',
                border_color: '#dc2626',
                background_color: '#ef4444',
                icon_name: null,
                display_order: 2,
                is_active: true,
                is_system: true,
                hidden_from_user_selection: false
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }))
};

// Mock the entire module
vi.mock('../../../src/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePostCategories', () => {
  it('should fetch active categories from the database', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePostCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([
      {
        id: 1,
        name: 'discussao-geral',
        label: 'Discussão Geral',
        description: 'Discussões gerais da comunidade',
        text_color: '#ffffff',
        border_color: '#4b5563',
        background_color: '#6b7280',
        icon_name: null,
        display_order: 1,
        is_active: true,
        is_system: false,
        hidden_from_user_selection: false
      },
      {
        id: 2,
        name: 'review',
        label: 'Review',
        description: 'Discussões sobre reviews',
        text_color: '#ffffff',
        border_color: '#dc2626',
        background_color: '#ef4444',
        icon_name: null,
        display_order: 2,
        is_active: true,
        is_system: true,
        hidden_from_user_selection: false
      }
    ]);
  });

  it('should call the database with correct filters', async () => {
    const wrapper = createWrapper();
    renderHook(() => usePostCategories(), { wrapper });

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('CommunityCategories');
    });

    // Verify the chain of method calls
    expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('is_active', true);
    expect(mockSupabase.from().select().eq().neq).toHaveBeenCalledWith('hidden_from_user_selection', true);
    expect(mockSupabase.from().select().eq().neq().order).toHaveBeenCalledWith('display_order', { ascending: true });
  });
});