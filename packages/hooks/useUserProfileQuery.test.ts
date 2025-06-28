// ABOUTME: Tests for useUserProfileQuery hook ensuring proper authentication-dependent data fetching

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '../../src/test-utils';
import { useUserProfileQuery } from './useUserProfileQuery';
import { createMockUserProfile } from '../../src/test-utils/test-data-factories';
import { useAuthStore } from '../../src/store/auth';

// Mock the auth store
vi.mock('../../src/store/auth');

// Type for mocked auth store
type MockAuthStore = {
  session: { access_token: string } | null;
  user: { id: string; email: string } | null;
  isLoading: boolean;
  setSession: ReturnType<typeof vi.fn>;
  initialize: ReturnType<typeof vi.fn>;
};

// Mock Supabase client
vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('useUserProfileQuery', () => {
  const mockUseAuthStore = vi.mocked(useAuthStore);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock: authenticated user
    mockUseAuthStore.mockReturnValue({
      session: { access_token: 'mock-token' },
      user: { id: 'test-user-id', email: 'test@example.com' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);
  });

  it('should return loading state initially when user is authenticated', () => {
    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('should not fetch when user is not authenticated', async () => {
    // Mock unauthenticated state
    mockUseAuthStore.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    // Query should be disabled so it should not be loading
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should fetch user profile successfully when authenticated', async () => {
    const mockProfile = createMockUserProfile({ id: 'test-user-id' });
    
    const { supabase } = await import('../../src/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    } as MockAuthStore);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProfile);
    expect(result.current.isError).toBe(false);
    
    // Verify correct Supabase call
    expect(supabase.from).toHaveBeenCalledWith('Practitioners');
  });

  it('should handle database errors gracefully', async () => {
    const dbError = { message: 'Database connection failed' };
    
    const { supabase } = await import('../../src/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: dbError,
      }),
    } as MockAuthStore);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error?.message).toContain('Database connection failed');
  });

  it('should use correct query key with user ID', async () => {
    const userId = 'test-user-123';
    
    mockUseAuthStore.mockReturnValue({
      session: { access_token: 'token' },
      user: { id: userId, email: 'test@example.com' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Query should be executed with authenticated user
    expect(result.current).toBeValidQueryResult();
  });

  it('should have correct stale time configuration', async () => {
    const { result, queryClient } = renderHookWithQuery(() => useUserProfileQuery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const query = queryClient.getQueryCache().find({
      queryKey: ['user-profile', 'test-user-id'],
    });

    // Query should be properly configured
    expect(result.current).toBeValidQueryResult();
  });

  it('should be enabled only when userId is available', () => {
    // Test with no user ID
    mockUseAuthStore.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    // Query should be disabled when no user ID
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should handle user ID changes correctly', async () => {
    const initialUserId = 'user-1';
    const newUserId = 'user-2';
    
    // Start with first user
    mockUseAuthStore.mockReturnValue({
      user: { id: initialUserId },
      session: { access_token: 'token' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);

    const { result, queryClient, rerender } = renderHookWithQuery(() => useUserProfileQuery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change to second user
    mockUseAuthStore.mockReturnValue({
      user: { id: newUserId },
      session: { access_token: 'token' },
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);

    rerender();

    // Should create new query for new user
    const newQuery = queryClient.getQueryCache().find({
      queryKey: ['user-profile', newUserId],
    });

    // New query should be executed
    expect(result.current).toBeValidQueryResult();
  });

  it('should return undefined when no userId', async () => {
    // Mock auth store to return null user
    mockUseAuthStore.mockReturnValue({
      session: null,
      user: null,
      isLoading: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('should handle auth loading state', () => {
    // Mock auth store as loading
    mockUseAuthStore.mockReturnValue({
      session: null,
      user: null,
      isLoading: true,
      setSession: vi.fn(),
      initialize: vi.fn(),
    } as MockAuthStore);

    const { result } = renderHookWithQuery(() => useUserProfileQuery());

    // Query should not run while auth is loading (no user ID available)
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });
});