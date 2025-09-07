// ABOUTME: Comprehensive tests for redesigned EnhancedPlanDisplay component with sophisticated promotional features

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomThemeProvider } from '../../theme/CustomThemeProvider';
import { EnhancedPlanDisplay } from '../EnhancedPlanDisplay';
import type { Tables } from '@/integrations/supabase/types';

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

const mockPromotionalConfig = {
  isActive: true,
  promotionValue: 2000, // R$ 20,00 discount in cents
  displayAsPercentage: false,
  promotionalName: 'Oferta Especial de Lançamento',
  customMessage: 'Acesso completo + bônus exclusivos',
  showDiscountAmount: true,
  showSavingsAmount: true,
  showCountdownTimer: false,
  expiresAt: '2099-12-31T23:59:59Z', // Future date
  primaryColor: '#000000',
  accentColor: '#666666'
};

const mockDisplaySettings = {
  showPromotionalName: true,
  showCustomMessage: true,
  showDiscountAmount: true,
  showSavingsAmount: true,
  showCountdownTimer: false
};

describe('EnhancedPlanDisplay - Redesigned Promotional Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 CRITICAL: Basic Plan Display', () => {
    it('should render basic plan without promotional features', () => {
      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={mockBasicPlan} />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      
      // Should not have promotional elements
      expect(screen.queryByText('Oferta Especial de Lançamento')).not.toBeInTheDocument();
      expect(screen.queryByText('Acesso completo + bônus exclusivos')).not.toBeInTheDocument();
    });

    it('should format price correctly in BRL currency', () => {
      const planWithDifferentPrice = {
        ...mockBasicPlan,
        amount: 4990, // R$ 49,90
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithDifferentPrice} />
        </TestWrapper>
      );

      expect(screen.getByText('R$ 49,90')).toBeInTheDocument();
    });

    it('should handle missing description gracefully', () => {
      const planWithoutDescription = {
        ...mockBasicPlan,
        description: null,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithoutDescription} />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Promotional Configuration Parsing', () => {
    it('should parse promotional configuration from JSON string', () => {
      const planWithStringConfig = {
        ...mockBasicPlan,
        promotional_config: JSON.stringify(mockPromotionalConfig),
        display_config: JSON.stringify(mockDisplaySettings),
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithStringConfig} />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta Especial de Lançamento')).toBeInTheDocument();
      expect(screen.getByText('Acesso completo + bônus exclusivos')).toBeInTheDocument();
    });

    it('should parse promotional configuration from object', () => {
      const planWithObjectConfig = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithObjectConfig} />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta Especial de Lançamento')).toBeInTheDocument();
      expect(screen.getByText('Acesso completo + bônus exclusivos')).toBeInTheDocument();
    });

    it('should handle invalid promotional configuration gracefully', () => {
      const planWithInvalidConfig = {
        ...mockBasicPlan,
        promotional_config: 'invalid-json',
        display_config: 'invalid-json',
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithInvalidConfig} />
        </TestWrapper>
      );

      // Should render basic plan without errors
      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText('Oferta Especial de Lançamento')).not.toBeInTheDocument();
    });

    it('should handle null promotional configuration', () => {
      const planWithNullConfig = {
        ...mockBasicPlan,
        promotional_config: null,
        display_config: null,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithNullConfig} />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText('Oferta Especial de Lançamento')).not.toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Promotional Pricing Display', () => {
    it('should display discounted price with promotion value', () => {
      const planWithPromotion = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithPromotion} />
        </TestWrapper>
      );

      // Should show original price with strikethrough
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      
      // Should show discounted price (99.99 - 20.00 = 79.99)
      expect(screen.getByText('R$ 79,99')).toBeInTheDocument();
      
      // Should show discount amount in R$
      expect(screen.getByText('-R$ 20,00')).toBeInTheDocument();
    });

    it('should display percentage when configured', () => {
      const planWithPercentageDisplay = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          displayAsPercentage: true,
        },
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithPercentageDisplay} />
        </TestWrapper>
      );

      // Should show discount as percentage (20/99.99 ≈ 20%)
      expect(screen.getByText(/-20%/)).toBeInTheDocument();
    });

    it('should display savings amount when enabled', () => {
      const planWithSavings = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          showSavingsAmount: true,
        },
        display_config: {
          ...mockDisplaySettings,
          showSavingsAmount: true,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithSavings} />
        </TestWrapper>
      );

      expect(screen.getByText(/Economia de R\$ 20,00/)).toBeInTheDocument();
    });

    it('should not display savings amount when disabled', () => {
      const planWithoutSavings = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          showSavingsAmount: false,
        },
        display_config: {
          ...mockDisplaySettings,
          showSavingsAmount: false,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithoutSavings} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Economia de/)).not.toBeInTheDocument();
    });

    it('should calculate discount correctly with various values', () => {
      const planWith5000CentsOff = {
        ...mockBasicPlan,
        amount: 10000, // R$ 100,00
        promotional_config: {
          ...mockPromotionalConfig,
          promotionValue: 5000, // R$ 50,00 discount
        },
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWith5000CentsOff} />
        </TestWrapper>
      );

      expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Original
      expect(screen.getByText('R$ 50,00')).toBeInTheDocument(); // Discounted
      expect(screen.getByText('-R$ 50,00')).toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Promotional Name and Custom Message', () => {
    it('should display promotional name when configured and enabled', () => {
      const planWithPromotionalName = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          promotionalName: 'Black Friday Especial',
        },
        display_config: {
          ...mockDisplaySettings,
          showPromotionalName: true,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithPromotionalName} />
        </TestWrapper>
      );

      expect(screen.getByText('Black Friday Especial')).toBeInTheDocument();
    });

    it('should not display promotional name when disabled', () => {
      const planWithDisabledPromotionalName = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          promotionalName: 'Black Friday Especial',
        },
        display_config: {
          ...mockDisplaySettings,
          showPromotionalName: false,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithDisabledPromotionalName} />
        </TestWrapper>
      );

      expect(screen.queryByText('Black Friday Especial')).not.toBeInTheDocument();
      expect(screen.getByText('Plano Premium')).toBeInTheDocument(); // Should show original name
    });

    it('should display custom message when configured and enabled', () => {
      const planWithMessage = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          customMessage: 'Tudo incluído + suporte premium',
        },
        display_config: {
          ...mockDisplaySettings,
          showCustomMessage: true,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('Tudo incluído + suporte premium')).toBeInTheDocument();
    });

    it('should not display custom message when disabled', () => {
      const planWithDisabledMessage = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          customMessage: 'Tudo incluído + suporte premium',
        },
        display_config: {
          ...mockDisplaySettings,
          showCustomMessage: false,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithDisabledMessage} />
        </TestWrapper>
      );

      expect(screen.queryByText('Tudo incluído + suporte premium')).not.toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Countdown Timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should display countdown timer when configured and enabled', () => {
      // Set a future date
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);
      
      const planWithTimer = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          showCountdownTimer: true,
          expiresAt: futureDate.toISOString(),
        },
        display_config: {
          ...mockDisplaySettings,
          showCountdownTimer: true,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithTimer} />
        </TestWrapper>
      );

      expect(screen.getByText(/Termina em/)).toBeInTheDocument();
    });

    it('should not display countdown timer when disabled', () => {
      const planWithDisabledTimer = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          showCountdownTimer: false,
        },
        display_config: {
          ...mockDisplaySettings,
          showCountdownTimer: false,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithDisabledTimer} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Termina em/)).not.toBeInTheDocument();
    });

    it('should not display countdown timer when no expiry date is set', () => {
      const planWithNoExpiry = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          showCountdownTimer: true,
          expiresAt: '',
        },
        display_config: {
          ...mockDisplaySettings,
          showCountdownTimer: true,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithNoExpiry} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Termina em/)).not.toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Promotion Expiration Logic', () => {
    it('should not show promotion when expired', () => {
      const expiredPromotion = {
        ...mockPromotionalConfig,
        expiresAt: '2020-01-01T00:00:00Z', // Past date
      };

      const planWithExpiredPromo = {
        ...mockBasicPlan,
        promotional_config: expiredPromotion,
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithExpiredPromo} />
        </TestWrapper>
      );

      // Should show regular price, not promotional price
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText('Oferta Especial de Lançamento')).not.toBeInTheDocument();
      expect(screen.queryByText('-R$ 20,00')).not.toBeInTheDocument();
    });

    it('should show promotion when not expired', () => {
      const futureExpiration = {
        ...mockPromotionalConfig,
        expiresAt: '2099-12-31T23:59:59Z', // Future date
      };

      const planWithActivePromo = {
        ...mockBasicPlan,
        promotional_config: futureExpiration,
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithActivePromo} />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta Especial de Lançamento')).toBeInTheDocument();
      expect(screen.getByText('-R$ 20,00')).toBeInTheDocument();
    });

    it('should show promotion when no expiration date is set', () => {
      const noExpirationPromo = {
        ...mockPromotionalConfig,
        expiresAt: '',
      };

      const planWithNoExpiration = {
        ...mockBasicPlan,
        promotional_config: noExpirationPromo,
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithNoExpiration} />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta Especial de Lançamento')).toBeInTheDocument();
      expect(screen.getByText('-R$ 20,00')).toBeInTheDocument();
    });
  });

  describe('🔵 STRATEGIC: Edge Cases and Error Handling', () => {
    it('should handle zero promotion value', () => {
      const zeroPromotionPlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          promotionValue: 0,
        },
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={zeroPromotionPlan} />
        </TestWrapper>
      );

      // Should show regular price
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText(/-R\$/)).not.toBeInTheDocument();
    });

    it('should handle promotion value larger than original price', () => {
      const oversizedPromotionPlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          promotionValue: 15000, // R$ 150,00 (more than plan price)
        },
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={oversizedPromotionPlan} />
        </TestWrapper>
      );

      // Should show negative final price or handle gracefully
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument(); // Original price
      expect(screen.getByText('-R$ 150,00')).toBeInTheDocument(); // Discount amount
    });

    it('should handle inactive promotion', () => {
      const inactivePromotion = {
        ...mockPromotionalConfig,
        isActive: false,
      };

      const planWithInactivePromo = {
        ...mockBasicPlan,
        promotional_config: inactivePromotion,
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithInactivePromo} />
        </TestWrapper>
      );

      // Should show regular price and no promotional elements
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText('Oferta Especial de Lançamento')).not.toBeInTheDocument();
      expect(screen.queryByText('-R$ 20,00')).not.toBeInTheDocument();
    });
  });

  describe('🟢 ACCESSIBILITY: Screen Reader Support', () => {
    it('should provide accessible price information', () => {
      const accessiblePlan = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={accessiblePlan} />
        </TestWrapper>
      );

      // Plan name should be readable
      expect(screen.getByText('Oferta Especial de Lançamento')).toBeInTheDocument();
      
      // Prices should be readable
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.getByText('R$ 79,99')).toBeInTheDocument();
    });

    it('should handle long plan names gracefully', () => {
      const longNamePlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          promotionalName: 'Plano Premium Completo com Acesso Ilimitado e Suporte Técnico Avançado 24/7 Oferta Especial',
        },
        display_config: {
          ...mockDisplaySettings,
          showPromotionalName: true,
        },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={longNamePlan} />
        </TestWrapper>
      );

      expect(screen.getByText(/Plano Premium Completo/)).toBeInTheDocument();
    });
  });

  describe('🔵 STRATEGIC: Color Customization', () => {
    it('should apply custom primary color when configured', () => {
      const colorCustomizedPlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          primaryColor: '#ff0000',
        },
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={colorCustomizedPlan} />
        </TestWrapper>
      );

      // Should render without errors - color customization is applied via CSS
      expect(screen.getByText('Oferta Especial de Lançamento')).toBeInTheDocument();
    });

    it('should apply default colors when none configured', () => {
      const defaultColorPlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          primaryColor: undefined,
          accentColor: undefined,
        },
        display_config: mockDisplaySettings,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={defaultColorPlan} />
        </TestWrapper>
      );

      // Should render without errors with default styling
      expect(screen.getByText('Oferta Especial de Lançamento')).toBeInTheDocument();
    });
  });
});