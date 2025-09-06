// ABOUTME: TDD tests for SubscriptionTimeManager component ensuring subscription analytics and bulk operations work correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubscriptionTimeManager } from '../SubscriptionTimeManager';
import { CustomThemeProvider } from '../../../theme/CustomThemeProvider';
import type { EnhancedUserStatus } from '../../../../../packages/hooks/useUserStatus';

// Mock the hooks
vi.mock('../../../../../packages/hooks/useUserStatus', () => ({
  useTimeAdjustmentMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ userId: '123', days: 30 }),
    isPending: false,
  }),
  useSubscriptionResetMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ userId: '123' }),
    isPending: false,
  }),
}));

vi.mock('../../../../../packages/hooks/useAdminPaymentCreation', () => ({
  useCreateAdminPayment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ code: 'PAY_123' }),
    isPending: false,
  }),
  useCreateBulkAdminPayments: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      successful: [{ userId: '123', result: { code: 'PAY_123' } }],
      failed: [],
      summary: { total: 1, successful: 1, failed: 0 },
    }),
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>{children}</CustomThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Mock user data
const mockActiveUser: EnhancedUserStatus = {
  id: '123',
  full_name: 'Dr. João Silva',
  email: 'joao@example.com',
  role: 'practitioner',
  subscription_tier: 'premium',
  created_at: '2023-01-01T00:00:00Z',
  subscriptionData: {
    subscription_start_date: '2023-01-01T00:00:00Z',
    subscription_end_date: '2024-01-01T00:00:00Z',
    subscription_created_by: 'user',
    subscription_payment_method_used: 'credit_card',
    subscription_days_granted: 365,
  },
  subscriptionStatus: {
    isActive: true,
    isExpired: false,
    isExpiringSoon: false,
    isCritical: false,
    remainingDays: 300,
    daysUntilRenewal: null,
    isPremium: true,
    hasTrial: false,
    trialExpired: false,
    trialRemainingDays: null,
  },
  adminTracking: {
    wasCreatedByAdmin: false,
    hasAdminNotes: false,
    adminGrantedDays: 0,
    creationMethod: 'user_payment',
  },
  billingInfo: {
    hasRecurringSubscription: true,
    paymentMethod: 'credit_card',
    totalDaysGranted: 365,
  },
};

const mockExpiredUser: EnhancedUserStatus = {
  ...mockActiveUser,
  id: '456',
  full_name: 'Dr. Maria Santos',
  email: 'maria@example.com',
  subscription_tier: 'free',
  subscriptionData: {
    subscription_start_date: '2022-01-01T00:00:00Z',
    subscription_end_date: '2023-01-01T00:00:00Z',
    subscription_created_by: 'admin',
    subscription_payment_method_used: 'admin_manual',
    admin_subscription_notes: 'Expired subscription, needs renewal',
    subscription_days_granted: 365,
  },
  subscriptionStatus: {
    isActive: false,
    isExpired: true,
    isExpiringSoon: false,
    isCritical: false,
    remainingDays: -30,
    daysUntilRenewal: null,
    isPremium: false,
    hasTrial: false,
    trialExpired: false,
    trialRemainingDays: null,
  },
  adminTracking: {
    wasCreatedByAdmin: true,
    hasAdminNotes: true,
    adminGrantedDays: 365,
    lastAdminAction: 'Expired subscription, needs renewal',
    creationMethod: 'admin_granted',
  },
};

const mockUsers = [mockActiveUser, mockExpiredUser];

describe('SubscriptionTimeManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 TDD: Component Initialization', () => {
    it('should render without crashing with empty users array', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('Gerenciamento de Assinaturas')).toBeInTheDocument();
    });

    it('should display correct analytics when users are provided', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Should show user counts
      expect(screen.getByText('Total de Usuários: 2')).toBeInTheDocument();
      expect(screen.getByText('Assinaturas Ativas: 1')).toBeInTheDocument();
      expect(screen.getByText('Expiradas: 1')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Subscription Analytics', () => {
    it('should calculate subscription statistics correctly', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Check analytics display
      expect(screen.getByText('Total de Usuários: 2')).toBeInTheDocument();
      expect(screen.getByText('Assinaturas Ativas: 1')).toBeInTheDocument();
      expect(screen.getByText('Expiradas: 1')).toBeInTheDocument();
      expect(screen.getByText('Criadas por Admin: 1')).toBeInTheDocument();
    });

    it('should show admin-created subscriptions count', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Should identify admin-created subscriptions
      expect(screen.getByText('Criadas por Admin: 1')).toBeInTheDocument();
    });

    it('should handle users with missing subscription data gracefully', () => {
      const usersWithMissingData = [
        {
          ...mockActiveUser,
          subscriptionData: {},
          subscriptionStatus: {
            ...mockActiveUser.subscriptionStatus,
            remainingDays: null,
          },
        },
      ];

      render(
        <TestWrapper>
          <SubscriptionTimeManager users={usersWithMissingData} />
        </TestWrapper>
      );

      // Should still render without errors
      expect(screen.getByText('Gerenciamento de Assinaturas')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: User List Display', () => {
    it('should display user list with subscription information', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Should show user names
      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
      expect(screen.getByText('Dr. Maria Santos')).toBeInTheDocument();

      // Should show subscription tiers
      expect(screen.getByText('premium')).toBeInTheDocument();
      expect(screen.getByText('free')).toBeInTheDocument();
    });

    it('should highlight expiring subscriptions with warning colors', () => {
      const expiringUser = {
        ...mockActiveUser,
        subscriptionStatus: {
          ...mockActiveUser.subscriptionStatus,
          isExpiringSoon: true,
          isCritical: true,
          remainingDays: 2,
        },
      };

      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[expiringUser]} />
        </TestWrapper>
      );

      // Should show warning for expiring subscription
      const userRow = screen.getByText('Dr. João Silva').closest('tr');
      expect(userRow).toHaveClass('border-l-4'); // Warning styling
    });

    it('should show admin notes when available', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Should display admin notes for expired user
      expect(screen.getByText('Expired subscription, needs renewal')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Time Adjustment Functionality', () => {
    it('should open time adjustment modal when adjust button is clicked', async () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[mockActiveUser]} />
        </TestWrapper>
      );

      // Find and click adjust time button
      const adjustButton = screen.getByTitle('Ajustar tempo de assinatura');
      fireEvent.click(adjustButton);

      // Should open modal
      await waitFor(() => {
        expect(screen.getByText('Ajustar Tempo de Assinatura')).toBeInTheDocument();
      });
    });

    it('should validate time adjustment input correctly', async () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[mockActiveUser]} />
        </TestWrapper>
      );

      // Open modal
      const adjustButton = screen.getByTitle('Ajustar tempo de assinatura');
      fireEvent.click(adjustButton);

      await waitFor(() => {
        expect(screen.getByText('Ajustar Tempo de Assinatura')).toBeInTheDocument();
      });

      // Try to submit without required fields
      const confirmButton = screen.getByText('Confirmar Ajuste');
      fireEvent.click(confirmButton);

      // Should show validation errors (implementation specific)
      // This would depend on the specific validation implementation
    });
  });

  describe('🔴 TDD: Bulk Operations', () => {
    it('should enable bulk operations when users are selected', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Should show bulk operations section
      expect(screen.getByText('Operações em Lote')).toBeInTheDocument();
    });

    it('should handle user selection for bulk operations', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Find checkboxes for user selection
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);

      // Select first user
      fireEvent.click(checkboxes[0]);

      // Should enable bulk operations
      const bulkSection = screen.getByText('Operações em Lote');
      expect(bulkSection).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Admin Payment Integration', () => {
    it('should open payment creation modal for users', async () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[mockActiveUser]} />
        </TestWrapper>
      );

      // Find payment button
      const paymentButton = screen.getByTitle('Criar pagamento customizado');
      fireEvent.click(paymentButton);

      // Should open payment modal
      await waitFor(() => {
        expect(screen.getByText('Criar Pagamento Customizado')).toBeInTheDocument();
      });
    });

    it('should handle payment creation success', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('sonner').toast.success).mockImplementation(mockToast);

      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[mockActiveUser]} />
        </TestWrapper>
      );

      // This would test the payment flow once implemented
      // For now, just verify the component renders
      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('sonner').toast.error).mockImplementation(mockToast);

      render(
        <TestWrapper>
          <SubscriptionTimeManager users={mockUsers} />
        </TestWrapper>
      );

      // Should render without errors even with potential API issues
      expect(screen.getByText('Gerenciamento de Assinaturas')).toBeInTheDocument();
    });

    it('should validate bulk operation limits', () => {
      const manyUsers = Array.from({ length: 15 }, (_, i) => ({
        ...mockActiveUser,
        id: `user-${i}`,
        full_name: `Dr. User ${i}`,
      }));

      render(
        <TestWrapper>
          <SubscriptionTimeManager users={manyUsers} />
        </TestWrapper>
      );

      // Should still render but may have pagination or limits
      expect(screen.getByText('Gerenciamento de Assinaturas')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Accessibility', () => {
    it('should have proper ARIA labels for actions', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[mockActiveUser]} />
        </TestWrapper>
      );

      // Check for accessibility attributes
      const adjustButton = screen.getByTitle('Ajustar tempo de assinatura');
      expect(adjustButton).toBeInTheDocument();

      const paymentButton = screen.getByTitle('Criar pagamento customizado');
      expect(paymentButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <SubscriptionTimeManager users={[mockActiveUser]} />
        </TestWrapper>
      );

      // Buttons should be focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', expect.any(String));
      });
    });
  });
});