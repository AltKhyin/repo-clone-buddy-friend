// ABOUTME: Tests for subscription status component displaying comprehensive subscription information

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
        subscription_start_date: '2024-12-01T00:00:00Z',
        subscription_end_date: '2025-01-01T00:00:00Z',
        next_billing_date: '2025-01-01T00:00:00Z',
        payment_method_preferred: 'credit_card',
        last_payment_date: '2024-12-01T00:00:00Z',
        subscription_plan: 'monthly_premium'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Status da Assinatura')).toBeInTheDocument();
    expect(screen.getByText('Membro Reviews')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText('Plano Mensal Premium')).toBeInTheDocument();
    expect(screen.getByText(/Próxima cobrança:/)).toBeInTheDocument();
    expect(screen.getByText(/01\/01\/2025/)).toBeInTheDocument();
  });

  it('should display trial subscription correctly', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      membershipTier: 'Membro Reviews',
      isActive: true,
      subscriptionStatus: 'trialing',
      subscriptionTier: 'premium',
      isTrialing: true,
      isPastDue: false,
      userProfile: {
        id: 'user-2',
        trial_end_date: '2025-01-15T00:00:00Z',
        subscription_plan: 'monthly_premium'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Período de Teste')).toBeInTheDocument();
    expect(screen.getByText(/Trial termina em:/)).toBeInTheDocument();
    expect(screen.getByText(/15\/01\/2025/)).toBeInTheDocument();
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
        subscription_end_date: '2024-12-15T00:00:00Z',
        next_billing_date: '2024-12-15T00:00:00Z',
        payment_method_preferred: 'credit_card'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText('Pagamento em Atraso')).toBeInTheDocument();
    expect(screen.getByText(/Pagamento venceu em:/)).toBeInTheDocument();
    expect(screen.getByText(/15\/12\/2024/)).toBeInTheDocument();
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

    expect(screen.getByText('Plano Gratuito')).toBeInTheDocument();
    expect(screen.getByText('Usuário Gratuito')).toBeInTheDocument();
    expect(screen.getByText(/Acesso aos recursos básicos da plataforma/)).toBeInTheDocument();
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

  it('should display payment method information', () => {
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
        payment_method_preferred: 'pix',
        last_payment_date: '2024-12-01T00:00:00Z'
      }
    } as any);

    render(<SubscriptionStatus />, { wrapper: createWrapper() });

    expect(screen.getByText(/Método de pagamento:/)).toBeInTheDocument();
    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText(/Último pagamento:/)).toBeInTheDocument();
  });
});