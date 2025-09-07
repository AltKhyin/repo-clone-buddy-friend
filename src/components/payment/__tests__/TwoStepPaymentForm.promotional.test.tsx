// ABOUTME: Tests for TwoStepPaymentForm promotional features integration with EnhancedPlanDisplay component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomThemeProvider } from '../../theme/CustomThemeProvider';
import TwoStepPaymentForm from '../TwoStepPaymentForm';
import type { Tables } from '@/integrations/supabase/types';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
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

// Mock plan data
const mockBasicPlan: Tables<'PaymentPlans'> = {
  id: 'plan-1',
  name: 'Plano Premium',
  description: 'Acesso completo à plataforma',
  amount: 9999, // R$ 99,99 in cents
  days: 365,
  type: 'one-time',
  billing_interval: null,
  billing_interval_count: null,
  billing_type: null,
  is_active: true,
  slug: 'plano-premium',
  usage_count: 0,
  last_used_at: null,
  metadata: null,
  promotional_config: null,
  display_config: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPromotionalPlan: Tables<'PaymentPlans'> = {
  ...mockBasicPlan,
  promotional_config: {
    isActive: true,
    discountPercentage: 25,
    originalPrice: 12999, // R$ 129,99
    urgencyMessage: 'Oferta limitada!',
    promotionalBadge: 'DESCONTO ESPECIAL',
    customMessage: 'Não perca essa oportunidade!',
    showSavingsAmount: true,
    expiresAt: '2024-12-31T23:59:59Z',
  },
  display_config: {
    layout: 'default',
    theme: 'promotional',
    showBadge: true,
    borderStyle: 'default',
    icon: 'star',
  },
};

const mockHandlers = {
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
};

describe('TwoStepPaymentForm - Promotional Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 CRITICAL: Enhanced Plan Display Integration', () => {
    it('should display EnhancedPlanDisplay when plan object is provided', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockBasicPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('Acesso completo à plataforma')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
    });

    it('should display promotional features when plan has promotional config', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('DESCONTO ESPECIAL')).toBeInTheDocument();
      expect(screen.getByText('25% OFF')).toBeInTheDocument();
      expect(screen.getByText('Oferta limitada!')).toBeInTheDocument();
      expect(screen.getByText('Não perca essa oportunidade!')).toBeInTheDocument();
    });

    it('should display promotional pricing correctly', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Original price (strikethrough)
      expect(screen.getByText('R$ 129,99')).toBeInTheDocument();
      
      // Discounted price (25% off R$ 129,99 = R$ 97,49)
      expect(screen.getByText('R$ 97,49')).toBeInTheDocument();
      
      // Savings amount
      expect(screen.getByText(/Economia de R\$ 32,50/)).toBeInTheDocument();
    });

    it('should show urgency messaging for promotional plans', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta limitada!')).toBeInTheDocument();
      expect(screen.getByText(/Válida até 31\/12\/2024/)).toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Backward Compatibility', () => {
    it('should maintain backward compatibility with individual props', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            planName="Plano Individual"
            planPrice={4999}
            planDescription="Plano básico"
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Individual')).toBeInTheDocument();
      expect(screen.getByText('R$ 49,99')).toBeInTheDocument();
      expect(screen.getByText('Plano básico')).toBeInTheDocument();
      
      // Should not have promotional features
      expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
    });

    it('should prefer plan object over individual props when both are provided', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockBasicPlan}
            planName="Old Name"
            planPrice={1999}
            planDescription="Old description"
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Should use plan object data, not individual props
      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.getByText('Acesso completo à plataforma')).toBeInTheDocument();
      
      // Should not show old props
      expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
      expect(screen.queryByText('R$ 19,99')).not.toBeInTheDocument();
    });

    it('should work when only individual props are provided', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            planName="Legacy Plan"
            planPrice={2999}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Legacy Plan')).toBeInTheDocument();
      expect(screen.getByText('R$ 29,99')).toBeInTheDocument();
    });

    it('should handle missing plan data gracefully', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Form should still render without plan display
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Form Integration', () => {
    it('should include promotional plan information in form submission', async () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Fill out customer information (step 1)
      const nameInput = screen.getByLabelText(/Nome completo/i);
      const emailInput = screen.getByLabelText(/E-mail/i);
      const phoneInput = screen.getByLabelText(/Telefone/i);
      const cpfInput = screen.getByLabelText(/CPF/i);

      fireEvent.change(nameInput, { target: { value: 'João Silva' } });
      fireEvent.change(emailInput, { target: { value: 'joao@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '11999999999' } });
      fireEvent.change(cpfInput, { target: { value: '12345678900' } });

      // Proceed to step 2
      const continueButton = screen.getByText(/Continuar para Pagamento/i);
      fireEvent.click(continueButton);

      // The form should include promotional plan data
      // This will be tested when payment processing is implemented
      expect(screen.getByText('DESCONTO ESPECIAL')).toBeInTheDocument();
    });

    it('should display correct total amount including promotional discount', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Should show the discounted price as the amount to pay
      expect(screen.getByText('R$ 97,49')).toBeInTheDocument();
    });

    it('should handle plan without promotional features in form', async () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockBasicPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Should show regular price without promotional elements
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
      expect(screen.queryByText(/DESCONTO/)).not.toBeInTheDocument();
    });
  });

  describe('🔵 STRATEGIC: User Experience', () => {
    it('should make promotional offers visually prominent', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      const promotionalBadge = screen.getByText('DESCONTO ESPECIAL');
      const discountBadge = screen.getByText('25% OFF');
      
      expect(promotionalBadge).toBeInTheDocument();
      expect(discountBadge).toBeInTheDocument();
    });

    it('should display savings information to encourage purchase', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Economia de R\$ 32,50/)).toBeInTheDocument();
    });

    it('should show urgency indicators for time-limited offers', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta limitada!')).toBeInTheDocument();
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument(); // Clock icon
    });

    it('should handle expired promotional offers', () => {
      const expiredPromoPlan = {
        ...mockPromotionalPlan,
        promotional_config: {
          ...mockPromotionalPlan.promotional_config,
          expiresAt: '2020-01-01T00:00:00Z', // Past date
        },
      };

      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={expiredPromoPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Should show regular pricing, no promotional elements
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText('DESCONTO ESPECIAL')).not.toBeInTheDocument();
      expect(screen.queryByText('25% OFF')).not.toBeInTheDocument();
    });
  });

  describe('🔵 STRATEGIC: Event Handlers', () => {
    it('should call onCancel when cancel is clicked', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByText(/Cancelar/i);
      fireEvent.click(cancelButton);

      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not break when optional handlers are not provided', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm plan={mockPromotionalPlan} />
        </TestWrapper>
      );

      // Should render without errors even without handlers
      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
    });
  });

  describe('🟢 ACCESSIBILITY: Promotional Features', () => {
    it('should make promotional information accessible to screen readers', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Important pricing information should be readable
      expect(screen.getByText('R$ 129,99')).toBeInTheDocument();
      expect(screen.getByText('R$ 97,49')).toBeInTheDocument();
      expect(screen.getByText(/Economia de R\$ 32,50/)).toBeInTheDocument();
    });

    it('should provide clear context for promotional badges', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('DESCONTO ESPECIAL')).toBeInTheDocument();
      expect(screen.getByText('25% OFF')).toBeInTheDocument();
    });

    it('should make urgency messages readable', () => {
      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={mockPromotionalPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta limitada!')).toBeInTheDocument();
      expect(screen.getByText('Não perca essa oportunidade!')).toBeInTheDocument();
    });
  });

  describe('🟢 ERROR HANDLING: Promotional Data', () => {
    it('should handle malformed promotional configuration', () => {
      const malformedPlan = {
        ...mockBasicPlan,
        promotional_config: 'invalid-json-string',
      };

      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={malformedPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Should fallback to basic plan display
      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
    });

    it('should handle null promotional configuration', () => {
      const nullPromoPlan = {
        ...mockBasicPlan,
        promotional_config: null,
      };

      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={nullPromoPlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
    });

    it('should handle incomplete promotional configuration', () => {
      const incompletePlan = {
        ...mockBasicPlan,
        promotional_config: {
          isActive: true,
          // Missing other required fields
        },
      };

      render(
        <TestWrapper>
          <TwoStepPaymentForm 
            plan={incompletePlan}
            onSuccess={mockHandlers.onSuccess}
            onCancel={mockHandlers.onCancel}
          />
        </TestWrapper>
      );

      // Should handle gracefully and not show broken promotional elements
      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
    });
  });
});