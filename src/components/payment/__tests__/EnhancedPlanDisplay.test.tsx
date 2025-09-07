// ABOUTME: Comprehensive tests for EnhancedPlanDisplay component promotional features with various configurations

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
  discountPercentage: 30,
  originalPrice: 14999, // R$ 149,99 in cents
  urgencyMessage: 'Oferta por tempo limitado!',
  promotionalBadge: 'MEGA OFERTA',
  customMessage: 'Economize agora!',
  showSavingsAmount: true,
  expiresAt: '2099-12-31T23:59:59Z', // Future date to ensure it's not expired
  features: ['Acesso ilimitado', 'Suporte prioritário', 'Relatórios avançados']
};

const mockDisplayConfig = {
  layout: 'default',
  theme: 'promotional',
  showBadge: true,
  borderStyle: 'default',
  backgroundColor: '',
  textColor: '',
  accentColor: '',
  icon: 'star'
};

describe('EnhancedPlanDisplay - Promotional Features', () => {
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
      expect(screen.getByText('Acesso completo à plataforma')).toBeInTheDocument();
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      
      // Should not have promotional elements
      expect(screen.queryByText('MEGA OFERTA')).not.toBeInTheDocument();
      expect(screen.queryByText('30% OFF')).not.toBeInTheDocument();
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
        display_config: JSON.stringify(mockDisplayConfig),
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithStringConfig} />
        </TestWrapper>
      );

      expect(screen.getByText('MEGA OFERTA')).toBeInTheDocument();
      expect(screen.getByText('30% OFF')).toBeInTheDocument();
      expect(screen.getByText('Oferta por tempo limitado!')).toBeInTheDocument();
    });

    it('should parse promotional configuration from object', () => {
      const planWithObjectConfig = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithObjectConfig} />
        </TestWrapper>
      );

      expect(screen.getByText('MEGA OFERTA')).toBeInTheDocument();
      expect(screen.getByText('30% OFF')).toBeInTheDocument();
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
      expect(screen.queryByText('MEGA OFERTA')).not.toBeInTheDocument();
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
      expect(screen.queryByText('MEGA OFERTA')).not.toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Promotional Pricing Display', () => {
    it('should display discounted price with strikethrough original price', () => {
      const planWithPromotion = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithPromotion} />
        </TestWrapper>
      );

      // Should show original price with strikethrough
      expect(screen.getByText('R$ 149,99')).toBeInTheDocument();
      
      // Should show discounted price
      expect(screen.getByText('R$ 104,99')).toBeInTheDocument();
      
      // Should show discount badge
      expect(screen.getByText('30% OFF')).toBeInTheDocument();
    });

    it('should display savings amount when enabled', () => {
      const planWithSavings = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          showSavingsAmount: true,
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithSavings} />
        </TestWrapper>
      );

      expect(screen.getByText(/Economia de R\$ 45,00/)).toBeInTheDocument();
    });

    it('should not display savings amount when disabled', () => {
      const planWithoutSavings = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          showSavingsAmount: false,
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithoutSavings} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Economia de/)).not.toBeInTheDocument();
    });

    it('should calculate discount correctly with various percentages', () => {
      const planWith50PercentOff = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          discountPercentage: 50,
          originalPrice: 10000, // R$ 100,00
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWith50PercentOff} />
        </TestWrapper>
      );

      expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Original
      expect(screen.getByText('R$ 50,00')).toBeInTheDocument(); // Discounted
      expect(screen.getByText('50% OFF')).toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Promotional Badges and Messages', () => {
    it('should display promotional badge when configured', () => {
      const planWithBadge = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          promotionalBadge: 'SUPER DESCONTO',
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithBadge} />
        </TestWrapper>
      );

      expect(screen.getByText('SUPER DESCONTO')).toBeInTheDocument();
    });

    it('should display custom message when configured', () => {
      const planWithMessage = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          customMessage: 'Oferta exclusiva para você!',
        },
        display_config: { ...mockDisplayConfig, layout: 'default' },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithMessage} />
        </TestWrapper>
      );

      expect(screen.getByText('Oferta exclusiva para você!')).toBeInTheDocument();
    });

    it('should display urgency message when configured', () => {
      const planWithUrgency = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          urgencyMessage: 'Últimas horas!',
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithUrgency} />
        </TestWrapper>
      );

      expect(screen.getByText('Últimas horas!')).toBeInTheDocument();
    });

    it('should display expiration date when configured', () => {
      const planWithExpiration = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          expiresAt: '2099-12-31T23:59:59Z',
          urgencyMessage: 'Oferta limitada',
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithExpiration} />
        </TestWrapper>
      );

      expect(screen.getByText(/Válida até 31\/12\/2099/)).toBeInTheDocument();
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
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithExpiredPromo} />
        </TestWrapper>
      );

      // Should show regular price, not promotional price
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText('MEGA OFERTA')).not.toBeInTheDocument();
      expect(screen.queryByText('30% OFF')).not.toBeInTheDocument();
    });

    it('should show promotion when not expired', () => {
      const futureExpiration = {
        ...mockPromotionalConfig,
        expiresAt: '2099-12-31T23:59:59Z', // Future date
      };

      const planWithActivePromo = {
        ...mockBasicPlan,
        promotional_config: futureExpiration,
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithActivePromo} />
        </TestWrapper>
      );

      expect(screen.getByText('MEGA OFERTA')).toBeInTheDocument();
      expect(screen.getByText('30% OFF')).toBeInTheDocument();
    });

    it('should show promotion when no expiration date is set', () => {
      const noExpirationPromo = {
        ...mockPromotionalConfig,
        expiresAt: undefined,
      };

      const planWithNoExpiration = {
        ...mockBasicPlan,
        promotional_config: noExpirationPromo,
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithNoExpiration} />
        </TestWrapper>
      );

      expect(screen.getByText('MEGA OFERTA')).toBeInTheDocument();
      expect(screen.getByText('30% OFF')).toBeInTheDocument();
    });
  });

  describe('🔵 STRATEGIC: Display Layouts and Themes', () => {
    it('should render compact layout correctly', () => {
      const compactPlan = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: { ...mockDisplayConfig, layout: 'compact' },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={compactPlan} />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('R$ 104,99')).toBeInTheDocument();
    });

    it('should render featured layout correctly', () => {
      const featuredPlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          features: ['Recurso 1', 'Recurso 2'],
        },
        display_config: { ...mockDisplayConfig, layout: 'featured' },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={featuredPlan} />
        </TestWrapper>
      );

      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      expect(screen.getByText('Recurso 1')).toBeInTheDocument();
      expect(screen.getByText('Recurso 2')).toBeInTheDocument();
    });

    it('should apply promotional theme styling', () => {
      const promotionalThemePlan = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: { ...mockDisplayConfig, theme: 'promotional' },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={promotionalThemePlan} />
        </TestWrapper>
      );

      const planContainer = screen.getByText('Plano Premium').closest('div');
      expect(planContainer).toBeInTheDocument();
    });

    it('should apply premium theme styling', () => {
      const premiumThemePlan = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: { ...mockDisplayConfig, theme: 'premium' },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={premiumThemePlan} />
        </TestWrapper>
      );

      const planContainer = screen.getByText('Plano Premium').closest('div');
      expect(planContainer).toBeInTheDocument();
    });

    it('should render icons when configured', () => {
      const iconPlan = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: { ...mockDisplayConfig, icon: 'star' },
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={iconPlan} />
        </TestWrapper>
      );

      // Should render multiple icons (plan icon + urgency message icon)
      const icons = screen.getAllByTestId('mock-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('🔵 STRATEGIC: Edge Cases and Error Handling', () => {
    it('should handle zero discount percentage', () => {
      const zeroDiscountPlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          discountPercentage: 0,
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={zeroDiscountPlan} />
        </TestWrapper>
      );

      // Should show original price (may appear multiple times)
      expect(screen.getAllByText('R$ 149,99').length).toBeGreaterThan(0);
      expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument();
    });

    it('should handle 100% discount', () => {
      const freePlan = {
        ...mockBasicPlan,
        promotional_config: {
          ...mockPromotionalConfig,
          discountPercentage: 100,
          originalPrice: 10000, // R$ 100,00
        },
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={freePlan} />
        </TestWrapper>
      );

      expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Original
      expect(screen.getByText('R$ 0,00')).toBeInTheDocument(); // Free
      expect(screen.getByText('100% OFF')).toBeInTheDocument();
    });

    it('should handle missing original price in promotion', () => {
      const promoWithoutOriginalPrice = {
        ...mockPromotionalConfig,
        originalPrice: undefined,
      };

      const planWithIncompletePromo = {
        ...mockBasicPlan,
        promotional_config: promoWithoutOriginalPrice,
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithIncompletePromo} />
        </TestWrapper>
      );

      // Should fall back to regular price
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
    });

    it('should handle inactive promotion', () => {
      const inactivePromotion = {
        ...mockPromotionalConfig,
        isActive: false,
      };

      const planWithInactivePromo = {
        ...mockBasicPlan,
        promotional_config: inactivePromotion,
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={planWithInactivePromo} />
        </TestWrapper>
      );

      // Should show regular price and no promotional elements
      expect(screen.getByText('R$ 99,99')).toBeInTheDocument();
      expect(screen.queryByText('MEGA OFERTA')).not.toBeInTheDocument();
      expect(screen.queryByText('30% OFF')).not.toBeInTheDocument();
    });
  });

  describe('🟢 ACCESSIBILITY: Screen Reader Support', () => {
    it('should provide accessible price information', () => {
      const accessiblePlan = {
        ...mockBasicPlan,
        promotional_config: mockPromotionalConfig,
        display_config: mockDisplayConfig,
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={accessiblePlan} />
        </TestWrapper>
      );

      // Plan name should be readable
      expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      
      // Prices should be readable
      expect(screen.getByText('R$ 149,99')).toBeInTheDocument();
      expect(screen.getByText('R$ 104,99')).toBeInTheDocument();
    });

    it('should handle long plan names gracefully', () => {
      const longNamePlan = {
        ...mockBasicPlan,
        name: 'Plano Premium Completo com Acesso Ilimitado e Suporte Técnico Avançado 24/7',
      };

      render(
        <TestWrapper>
          <EnhancedPlanDisplay plan={longNamePlan} />
        </TestWrapper>
      );

      expect(screen.getByText(/Plano Premium Completo/)).toBeInTheDocument();
    });
  });
});