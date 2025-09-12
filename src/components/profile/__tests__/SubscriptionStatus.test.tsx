// ABOUTME: Tests for V2 subscription status component displaying V2 subscription information

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionStatus } from '../SubscriptionStatus';

// Mock the enhanced user status hook
vi.mock('@/hooks/useEnhancedUserStatus', () => ({
  useEnhancedUserStatus: vi.fn()
}));

import { useEnhancedUserStatus } from '@/hooks/useEnhancedUserStatus';

const mockUseEnhancedUserStatus = useEnhancedUserStatus as vi.MockedFunction<typeof useEnhancedUserStatus>;

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

describe('SubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display active premium subscription correctly', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      membershipTier: 'Membro Reviews',
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionTier: 'premium',
      isTrialing: false,
      isPastDue: false,
      userProfile: {
        id: 'user-1',
        subscription_starts_at: '2024-12-01T00:00:00Z',
        subscription_ends_at: '2025-01-01T00:00:00Z',
        subscription_tier: 'premium',
        subscription_status: 'active'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Status da assinatura')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText(/Expira em/)).toBeInTheDocument();
    expect(screen.getByText(/01\/01\/2025/)).toBeInTheDocument();
  });

  it('should display past due subscription correctly', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: false,
      membershipTier: 'Usuário Gratuito',
      isActive: false,
      subscriptionStatus: 'past_due',
      subscriptionTier: 'premium',
      isTrialing: false,
      isPastDue: true,
      userProfile: {
        id: 'user-3',
        subscription_ends_at: '2024-12-15T00:00:00Z',
        subscription_tier: 'premium',
        subscription_status: 'past_due'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Pagamento pendente')).toBeInTheDocument();
    expect(screen.getByText(/Expirou em/)).toBeInTheDocument();
    expect(screen.getByText(/15\/12\/2024/)).toBeInTheDocument();
    expect(screen.getByText('Pagamento pendente')).toBeInTheDocument();
  });

  it('should display free user correctly', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: false,
      membershipTier: 'Usuário Gratuito',
      isActive: false,
      subscriptionStatus: null,
      subscriptionTier: 'free',
      isTrialing: false,
      isPastDue: false,
      userProfile: {
        id: 'user-4',
        subscription_tier: 'free'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Usuário Gratuito')).toBeInTheDocument();
    expect(screen.getByText(/Acesso aos recursos essenciais da plataforma/)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: true,
      isMember: false,
      membershipTier: '',
      isActive: false,
      subscriptionStatus: null,
      subscriptionTier: 'free',
      isTrialing: false,
      isPastDue: false,
      userProfile: null
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByTestId('subscription-loading')).toBeInTheDocument();
  });

  it('should show subscription expiry warning', () => {
    // Create a date 3 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      membershipTier: 'Membro Reviews',
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionTier: 'premium',
      isTrialing: false,
      isPastDue: false,
      userProfile: {
        id: 'user-5',
        subscription_ends_at: expiryDate.toISOString(),
        subscription_tier: 'premium',
        subscription_status: 'active'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText(/Assinatura expira em 3 dias/)).toBeInTheDocument();
  });
});