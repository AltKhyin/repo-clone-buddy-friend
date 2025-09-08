// ABOUTME: Tests for enhanced user status hook providing subscription-aware profile data with membership differentiation

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEnhancedUserStatus } from '../useEnhancedUserStatus';

// Mock the dependencies
vi.mock('@packages/hooks/useUserProfileQuery', () => ({
  useUserProfileQuery: vi.fn()
}));

vi.mock('../useSubscriptionAccess', () => ({
  useSubscriptionAccess: vi.fn()
}));

import { useUserProfileQuery } from '@packages/hooks/useUserProfileQuery';
import { useSubscriptionAccess } from '../useSubscriptionAccess';

const mockUseUserProfileQuery = useUserProfileQuery as vi.MockedFunction<typeof useUserProfileQuery>;
const mockUseSubscriptionAccess = useSubscriptionAccess as vi.MockedFunction<typeof useSubscriptionAccess>;

// Test wrapper with QueryClient
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

describe('useEnhancedUserStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state when profile data is loading', () => {
    mockUseUserProfileQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    mockUseSubscriptionAccess.mockReturnValue({
      isPremium: false,
      isLoading: true,
    } as any);

    const { result } = renderHook(() => useEnhancedUserStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.userProfile).toBe(null);
  });

  it('should identify premium member correctly', () => {
    const mockProfile = {
      id: 'user-1',
      full_name: 'Dr. João Silva',
      profession: 'Médico',
      subscription_tier: 'premium',
      subscription_status: 'active',
    };

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    mockUseSubscriptionAccess.mockReturnValue({
      isPremium: true,
      isActive: true,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useEnhancedUserStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isMember).toBe(true);
    expect(result.current.membershipTier).toBe('Membro Reviews');
    expect(result.current.shouldShowUpgradeButton).toBe(false);
    expect(result.current.membershipBadgeColor).toBe('bg-orange-500');
  });

  it('should identify free user correctly', () => {
    const mockProfile = {
      id: 'user-2',
      full_name: 'Ana Silva',
      profession: 'Enfermeira',
      subscription_tier: 'free',
      subscription_status: 'inactive',
    };

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    mockUseSubscriptionAccess.mockReturnValue({
      isPremium: false,
      isActive: false,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useEnhancedUserStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isMember).toBe(false);
    expect(result.current.membershipTier).toBe('Usuário Gratuito');
    expect(result.current.shouldShowUpgradeButton).toBe(true);
    expect(result.current.upgradeButtonText).toBe('Tornar-se Membro');
    expect(result.current.upgradeRedirectPath).toBe('/pagamento');
  });

  it('should handle trial users correctly', () => {
    const mockProfile = {
      id: 'user-3',
      full_name: 'Carlos Mendes',
      profession: 'Fisioterapeuta',
      subscription_tier: 'premium',
      subscription_status: 'trialing',
    };

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    mockUseSubscriptionAccess.mockReturnValue({
      isPremium: true,
      isTrialing: true,
      isActive: true,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useEnhancedUserStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isMember).toBe(true);
    expect(result.current.isTrialing).toBe(true);
    expect(result.current.membershipTier).toBe('Membro Reviews');
    expect(result.current.shouldShowUpgradeButton).toBe(false);
  });

  it('should handle past due subscriptions', () => {
    const mockProfile = {
      id: 'user-4',
      full_name: 'Maria Santos',
      profession: 'Médica',
      subscription_tier: 'premium',
      subscription_status: 'past_due',
    };

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    mockUseSubscriptionAccess.mockReturnValue({
      isPremium: false,
      isPastDue: true,
      isActive: false,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useEnhancedUserStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isMember).toBe(false);
    expect(result.current.isPastDue).toBe(true);
    expect(result.current.shouldShowUpgradeButton).toBe(true);
    expect(result.current.upgradeButtonText).toBe('Atualizar Pagamento');
  });

  it('should return proper member badge configuration', () => {
    const mockProfile = {
      id: 'user-5',
      full_name: 'Pedro Costa',
      subscription_tier: 'premium',
      subscription_status: 'active',
    };

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    mockUseSubscriptionAccess.mockReturnValue({
      isPremium: true,
      isActive: true,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useEnhancedUserStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.memberBadge).toEqual({
      text: 'Membro Reviews',
      color: 'bg-orange-500',
      textColor: 'text-white',
      variant: 'default'
    });
  });
});