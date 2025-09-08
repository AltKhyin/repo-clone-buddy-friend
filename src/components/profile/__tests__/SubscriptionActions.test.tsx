// ABOUTME: Tests for subscription actions component providing subscription management functionality

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionActions } from '../SubscriptionActions';

// Mock dependencies
vi.mock('@/hooks/useEnhancedUserStatus', () => ({
  useEnhancedUserStatus: vi.fn()
}));

vi.mock('@/hooks/mutations/useSubscriptionMutations', () => ({
  useSubscriptionMutations: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() }))
}));

import { useEnhancedUserStatus } from '@/hooks/useEnhancedUserStatus';
import { useSubscriptionMutations } from '@/hooks/mutations/useSubscriptionMutations';

const mockUseEnhancedUserStatus = useEnhancedUserStatus as vi.MockedFunction<typeof useEnhancedUserStatus>;
const mockUseSubscriptionMutations = useSubscriptionMutations as vi.MockedFunction<typeof useSubscriptionMutations>;

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

describe('SubscriptionActions', () => {
  const mockMutations = {
    cancelSubscription: vi.fn(),
    updatePaymentMethod: vi.fn(),
    pauseSubscription: vi.fn(),
    resumeSubscription: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSubscriptionMutations.mockReturnValue(mockMutations as any);
  });

  it('should display actions for active premium subscription', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      isActive: true,
      subscriptionTier: 'premium',
      isPastDue: false,
      isTrialing: false,
      userProfile: {
        id: 'user-1',
        subscription_id: 'sub_123',
        subscription_status: 'active'
      }
    } as any);

    render(<SubscriptionActions />, { wrapper: createWrapper() });

    expect(screen.getByText('Gerenciar Assinatura')).toBeInTheDocument();
    expect(screen.getByText('Cancelar Assinatura')).toBeInTheDocument();
    expect(screen.getByText('Atualizar Método de Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Pausar Assinatura')).toBeInTheDocument();
  });

  it('should display actions for past due subscription', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: false,
      isActive: false,
      subscriptionTier: 'premium',
      isPastDue: true,
      isTrialing: false,
      userProfile: {
        id: 'user-2',
        subscription_id: 'sub_456',
        subscription_status: 'past_due'
      }
    } as any);

    render(<SubscriptionActions />, { wrapper: createWrapper() });

    expect(screen.getByText('Atualizar Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Cancelar Assinatura')).toBeInTheDocument();
    expect(screen.queryByText('Pausar Assinatura')).not.toBeInTheDocument();
  });

  it('should not display actions for free users', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: false,
      isActive: false,
      subscriptionTier: 'free',
      isPastDue: false,
      isTrialing: false,
      userProfile: {
        id: 'user-3',
        subscription_tier: 'free'
      }
    } as any);

    render(<SubscriptionActions />, { wrapper: createWrapper() });

    expect(screen.queryByText('Gerenciar Assinatura')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelar Assinatura')).not.toBeInTheDocument();
  });

  it('should handle cancel subscription click', async () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      isActive: true,
      subscriptionTier: 'premium',
      isPastDue: false,
      isTrialing: false,
      userProfile: {
        id: 'user-4',
        subscription_id: 'sub_789',
        subscription_status: 'active'
      }
    } as any);

    render(<SubscriptionActions />, { wrapper: createWrapper() });

    const cancelButton = screen.getByText('Cancelar Assinatura');
    fireEvent.click(cancelButton);

    // Should show confirmation dialog
    expect(screen.getByText('Confirmar Cancelamento')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja cancelar/)).toBeInTheDocument();

    // Click confirm
    const confirmButton = screen.getByText('Confirmar Cancelamento');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockMutations.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: 'sub_789',
        action: 'cancel',
        reason: 'user_requested'
      });
    });
  });

  it('should handle update payment method click', async () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      isActive: true,
      subscriptionTier: 'premium',
      isPastDue: false,
      isTrialing: false,
      userProfile: {
        id: 'user-5',
        subscription_id: 'sub_999',
        subscription_status: 'active'
      }
    } as any);

    render(<SubscriptionActions />, { wrapper: createWrapper() });

    const updatePaymentButton = screen.getByText('Atualizar Método de Pagamento');
    fireEvent.click(updatePaymentButton);

    await waitFor(() => {
      expect(mockMutations.updatePaymentMethod).toHaveBeenCalledWith({
        subscriptionId: 'sub_999'
      });
    });
  });

  it('should show loading state during mutations', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      isActive: true,
      subscriptionTier: 'premium',
      isPastDue: false,
      isTrialing: false,
      userProfile: {
        id: 'user-6',
        subscription_id: 'sub_loading',
        subscription_status: 'active'
      }
    } as any);

    mockUseSubscriptionMutations.mockReturnValue({
      ...mockMutations,
      isLoading: true
    } as any);

    render(<SubscriptionActions />, { wrapper: createWrapper() });

    const cancelButton = screen.getByText('Cancelar Assinatura');
    expect(cancelButton).toBeDisabled();
  });

  it('should display resume action for paused subscription', () => {
    mockUseEnhancedUserStatus.mockReturnValue({
      isLoading: false,
      isMember: true,
      isActive: false,
      subscriptionTier: 'premium',
      isPastDue: false,
      isTrialing: false,
      userProfile: {
        id: 'user-7',
        subscription_id: 'sub_paused',
        subscription_status: 'paused'
      }
    } as any);

    render(<SubscriptionActions />, { wrapper: createWrapper() });

    expect(screen.getByText('Retomar Assinatura')).toBeInTheDocument();
    expect(screen.queryByText('Pausar Assinatura')).not.toBeInTheDocument();
  });
});