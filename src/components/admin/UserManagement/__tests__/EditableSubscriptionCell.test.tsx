// ABOUTME: TDD tests for EditableSubscriptionCell component ensuring subscription editing and timing display work correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditableSubscriptionCell } from '../EditableSubscriptionCell';
import { CustomThemeProvider } from '../../../theme/CustomThemeProvider';
import type { EnhancedUserStatus } from '../../../../../packages/hooks/useUserStatus';

// Mock the hooks
vi.mock('../../../../../packages/hooks/useUserManagementQuery', () => ({
  useUpdateUserSubscriptionMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
}));

vi.mock('../../../../../packages/hooks/useUserStatus', () => ({
  useUserStatus: () => ({
    data: {
      subscriptionStatus: {
        remainingDays: 300,
        isExpiringSoon: false,
        isCritical: false,
      },
      adminTracking: {
        wasCreatedByAdmin: true,
        adminGrantedDays: 365,
      },
    },
    isLoading: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
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
const mockUser = {
  id: '123',
  full_name: 'Dr. João Silva',
  email: 'joao@example.com',
  subscription_tier: 'premium' as const,
  subscription_start_date: '2023-01-01T00:00:00Z',
  subscription_end_date: '2024-01-01T00:00:00Z',
  subscription_created_by: 'admin' as const,
  admin_subscription_notes: 'Granted for testing purposes',
  subscription_days_granted: 365,
};

const mockFreeUser = {
  ...mockUser,
  id: '456',
  subscription_tier: 'free' as const,
  subscription_start_date: null,
  subscription_end_date: null,
  subscription_created_by: null,
  admin_subscription_notes: null,
  subscription_days_granted: 0,
};

describe('EditableSubscriptionCell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 TDD: Basic Rendering', () => {
    it('should render subscription tier correctly', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('premium')).toBeInTheDocument();
    });

    it('should render free tier for users without subscription', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockFreeUser} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('free')).toBeInTheDocument();
    });

    it('should show subscription timing information for premium users', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show remaining days
      expect(screen.getByText(/300 dias restantes/)).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Subscription Timing Display', () => {
    it('should calculate and display remaining days correctly', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show subscription timing
      expect(screen.getByText(/300 dias restantes/)).toBeInTheDocument();
    });

    it('should show expired status for past-due subscriptions', () => {
      const expiredUser = {
        ...mockUser,
        subscription_end_date: '2022-01-01T00:00:00Z', // Past date
      };

      // Mock the hook to return expired status
      vi.mocked(require('../../../../../packages/hooks/useUserStatus').useUserStatus).mockReturnValue({
        data: {
          subscriptionStatus: {
            remainingDays: -30,
            isExpiringSoon: false,
            isCritical: false,
            isExpired: true,
          },
          adminTracking: {
            wasCreatedByAdmin: true,
            adminGrantedDays: 365,
          },
        },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={expiredUser} />
        </TestWrapper>
      );

      // Should show expired status
      expect(screen.getByText(/Expirada/)).toBeInTheDocument();
    });

    it('should highlight expiring subscriptions with warning colors', () => {
      // Mock expiring soon status
      vi.mocked(require('../../../../../packages/hooks/useUserStatus').useUserStatus).mockReturnValue({
        data: {
          subscriptionStatus: {
            remainingDays: 3,
            isExpiringSoon: true,
            isCritical: true,
          },
          adminTracking: {
            wasCreatedByAdmin: true,
            adminGrantedDays: 365,
          },
        },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show critical warning
      const warningElement = screen.getByText(/3 dias restantes/);
      expect(warningElement).toHaveClass('text-red-600');
    });
  });

  describe('🔴 TDD: Admin Information Display', () => {
    it('should show admin-created indicator for admin subscriptions', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show admin indicator
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should display admin notes when available', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show admin notes
      expect(screen.getByText('Granted for testing purposes')).toBeInTheDocument();
    });

    it('should show granted days information', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show days granted by admin
      expect(screen.getByText(/365 dias concedidos/)).toBeInTheDocument();
    });

    it('should not show admin information for user-created subscriptions', () => {
      const userCreatedSubscription = {
        ...mockUser,
        subscription_created_by: 'user' as const,
      };

      // Mock user-created subscription status
      vi.mocked(require('../../../../../packages/hooks/useUserStatus').useUserStatus).mockReturnValue({
        data: {
          subscriptionStatus: {
            remainingDays: 300,
            isExpiringSoon: false,
            isCritical: false,
          },
          adminTracking: {
            wasCreatedByAdmin: false,
            adminGrantedDays: 0,
          },
        },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={userCreatedSubscription} />
        </TestWrapper>
      );

      // Should not show admin indicator
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Subscription Tier Editing', () => {
    it('should allow changing subscription tier via select dropdown', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(require('../../../../../packages/hooks/useUserManagementQuery').useUpdateUserSubscriptionMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockFreeUser} />
        </TestWrapper>
      );

      // Find and change select value
      const select = screen.getByDisplayValue('free');
      fireEvent.change(select, { target: { value: 'premium' } });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          userId: '456',
          subscription_tier: 'premium',
        });
      });
    });

    it('should handle subscription tier change errors gracefully', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('API Error'));
      const mockToastError = vi.fn();
      
      vi.mocked(require('../../../../../packages/hooks/useUserManagementQuery').useUpdateUserSubscriptionMutation).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      
      vi.mocked(require('sonner').toast.error).mockImplementation(mockToastError);

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockFreeUser} />
        </TestWrapper>
      );

      const select = screen.getByDisplayValue('free');
      fireEvent.change(select, { target: { value: 'premium' } });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Erro ao atualizar assinatura');
      });
    });

    it('should disable select during mutation', () => {
      vi.mocked(require('../../../../../packages/hooks/useUserManagementQuery').useUpdateUserSubscriptionMutation).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true, // Mutation in progress
      });

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      const select = screen.getByDisplayValue('premium');
      expect(select).toBeDisabled();
    });
  });

  describe('🔴 TDD: Action Buttons', () => {
    it('should show action buttons for subscription management', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show adjust time button
      expect(screen.getByTitle('Ajustar tempo de assinatura')).toBeInTheDocument();
      
      // Should show payment creation button
      expect(screen.getByTitle('Criar pagamento customizado')).toBeInTheDocument();
    });

    it('should handle adjust time button click', () => {
      const onAdjustTime = vi.fn();
      
      render(
        <TestWrapper>
          <EditableSubscriptionCell 
            user={mockUser} 
            onAdjustTime={onAdjustTime}
          />
        </TestWrapper>
      );

      const adjustButton = screen.getByTitle('Ajustar tempo de assinatura');
      fireEvent.click(adjustButton);

      expect(onAdjustTime).toHaveBeenCalledWith(mockUser);
    });

    it('should handle payment creation button click', () => {
      const onCreatePayment = vi.fn();
      
      render(
        <TestWrapper>
          <EditableSubscriptionCell 
            user={mockUser} 
            onCreatePayment={onCreatePayment}
          />
        </TestWrapper>
      );

      const paymentButton = screen.getByTitle('Criar pagamento customizado');
      fireEvent.click(paymentButton);

      expect(onCreatePayment).toHaveBeenCalledWith(mockUser);
    });

    it('should not show action buttons for free tier users', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockFreeUser} />
        </TestWrapper>
      );

      // Should not show adjust time button for free users
      expect(screen.queryByTitle('Ajustar tempo de assinatura')).not.toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Loading States', () => {
    it('should show loading state when user status is being fetched', () => {
      vi.mocked(require('../../../../../packages/hooks/useUserStatus').useUserStatus).mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      // Should show loading indicator or skeleton
      expect(screen.getByText(/Carregando/)).toBeInTheDocument();
    });

    it('should show updated information after successful mutation', async () => {
      const mockToastSuccess = vi.fn();
      vi.mocked(require('sonner').toast.success).mockImplementation(mockToastSuccess);

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockFreeUser} />
        </TestWrapper>
      );

      const select = screen.getByDisplayValue('free');
      fireEvent.change(select, { target: { value: 'premium' } });

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Assinatura atualizada com sucesso');
      });
    });
  });

  describe('🔴 TDD: Edge Cases', () => {
    it('should handle users with null subscription dates', () => {
      const userWithNullDates = {
        ...mockUser,
        subscription_start_date: null,
        subscription_end_date: null,
      };

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={userWithNullDates} />
        </TestWrapper>
      );

      // Should not crash and should show appropriate message
      expect(screen.getByDisplayValue('premium')).toBeInTheDocument();
    });

    it('should handle users with invalid date formats', () => {
      const userWithInvalidDates = {
        ...mockUser,
        subscription_start_date: 'invalid-date',
        subscription_end_date: 'also-invalid',
      };

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={userWithInvalidDates} />
        </TestWrapper>
      );

      // Should handle gracefully without crashing
      expect(screen.getByDisplayValue('premium')).toBeInTheDocument();
    });

    it('should handle very long admin notes gracefully', () => {
      const userWithLongNotes = {
        ...mockUser,
        admin_subscription_notes: 'A'.repeat(500), // Very long string
      };

      render(
        <TestWrapper>
          <EditableSubscriptionCell user={userWithLongNotes} />
        </TestWrapper>
      );

      // Should truncate or handle long text appropriately
      expect(screen.getByDisplayValue('premium')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Accessibility', () => {
    it('should have proper labels for screen readers', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      const select = screen.getByDisplayValue('premium');
      expect(select).toHaveAttribute('aria-label', 'Nível de assinatura');
    });

    it('should have proper button titles for accessibility', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      expect(screen.getByTitle('Ajustar tempo de assinatura')).toBeInTheDocument();
      expect(screen.getByTitle('Criar pagamento customizado')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <EditableSubscriptionCell user={mockUser} />
        </TestWrapper>
      );

      const select = screen.getByDisplayValue('premium');
      expect(select).toHaveAttribute('tabIndex');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });
  });
});