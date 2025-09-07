// ABOUTME: Tests for AdminPaymentManagement promotional configuration interface and functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomThemeProvider } from '@/components/theme/CustomThemeProvider';
import AdminPaymentManagement from '../AdminPaymentManagement';
import type { Tables } from '@/integrations/supabase/types';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Supabase client with promotional configuration data
const mockPlans: Tables<'PaymentPlans'>[] = [
  {
    id: 'plan-1',
    name: 'Plano Basic',
    description: 'Plano básico sem promoção',
    amount: 4999,
    days: 365,
    type: 'one-time',
    billing_interval: null,
    billing_interval_count: null,
    billing_type: null,
    is_active: true,
    slug: 'plano-basic',
    usage_count: 0,
    last_used_at: null,
    metadata: null,
    promotional_config: null,
    display_config: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan-2',
    name: 'Plano Premium',
    description: 'Plano premium com promoção ativa',
    amount: 9999,
    days: 365,
    type: 'one-time',
    billing_interval: null,
    billing_interval_count: null,
    billing_type: null,
    is_active: true,
    slug: 'plano-premium',
    usage_count: 5,
    last_used_at: '2024-01-15T00:00:00Z',
    metadata: null,
    promotional_config: {
      isActive: true,
      discountPercentage: 30,
      originalPrice: 14999,
      urgencyMessage: 'Oferta por tempo limitado!',
      promotionalBadge: 'SUPER DESCONTO',
      customMessage: 'Aproveite agora!',
      showSavingsAmount: true,
      expiresAt: '2024-12-31T23:59:59Z',
    },
    display_config: {
      layout: 'featured',
      theme: 'promotional',
      showBadge: true,
      borderStyle: 'gradient',
      icon: 'star',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: mockPlans, error: null })),
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        select: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockPlans[1], error: null })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
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

describe('AdminPaymentManagement - Promotional Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 CRITICAL: Promotional Configuration UI Display', () => {
    it('should display promotional configuration section for each plan', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Plano Basic')).toBeInTheDocument();
        expect(screen.getByText('Plano Premium')).toBeInTheDocument();
      });

      // Should show promotional configuration sections
      const configSections = screen.getAllByText('Configuração Promocional');
      expect(configSections).toHaveLength(2); // One for each plan
    });

    it('should show active promotional badge for plans with active promotions', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Ativa')).toBeInTheDocument();
      });
    });

    it('should allow expanding promotional configuration section', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      // Should show promotional configuration form
      await waitFor(() => {
        expect(screen.getByText('Ativar Promoção')).toBeInTheDocument();
      });
    });
  });

  describe('🔴 CRITICAL: Promotional Configuration Form', () => {
    it('should display all promotional configuration fields when expanded', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[1]); // Click on premium plan
      });

      await waitFor(() => {
        expect(screen.getByText('Ativar Promoção')).toBeInTheDocument();
        expect(screen.getByText('Configurações de Desconto')).toBeInTheDocument();
        expect(screen.getByText('Configurações Visuais')).toBeInTheDocument();
        expect(screen.getByLabelText('Desconto (%)')).toBeInTheDocument();
        expect(screen.getByLabelText('Badge Promocional')).toBeInTheDocument();
        expect(screen.getByLabelText('Mensagem Personalizada')).toBeInTheDocument();
        expect(screen.getByLabelText('Mensagem de Urgência')).toBeInTheDocument();
        expect(screen.getByLabelText('Data de Expiração')).toBeInTheDocument();
      });
    });

    it('should display visual configuration fields', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Layout')).toBeInTheDocument();
        expect(screen.getByText('Tema')).toBeInTheDocument();
        expect(screen.getByText('Estilo da Borda')).toBeInTheDocument();
        expect(screen.getByText('Ícone')).toBeInTheDocument();
      });
    });

    it('should show conditional fields when promotion is active', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      // Toggle promotion to active
      await waitFor(() => {
        const toggleSwitch = screen.getByRole('switch');
        fireEvent.click(toggleSwitch);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Desconto (%)')).toBeInTheDocument();
        expect(screen.getByLabelText('Badge Promocional')).toBeInTheDocument();
        expect(screen.getByLabelText('Mensagem Personalizada')).toBeInTheDocument();
      });
    });
  });

  describe('🔴 CRITICAL: Promotional Configuration Preview', () => {
    it('should show preview toggle button', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Ver Preview')).toBeInTheDocument();
      });
    });

    it('should toggle preview visibility', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      // Click preview button
      await waitFor(() => {
        const previewButton = screen.getByText('Ver Preview');
        fireEvent.click(previewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Preview do Plano:')).toBeInTheDocument();
        expect(screen.getByText('Ocultar Preview')).toBeInTheDocument();
      });
    });

    it('should display enhanced plan preview with current configurations', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[1]); // Premium plan with promotion
      });

      // Show preview
      await waitFor(() => {
        const previewButton = screen.getByText('Ver Preview');
        fireEvent.click(previewButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Preview do Plano:')).toBeInTheDocument();
        // Should show plan name in preview
        const planNames = screen.getAllByText('Plano Premium');
        expect(planNames.length).toBeGreaterThan(1); // Original + preview
      });
    });
  });

  describe('🔴 CRITICAL: Promotional Configuration Save Functionality', () => {
    it('should have save button for promotional configuration', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Salvar')).toBeInTheDocument();
      });
    });

    it('should call update mutation when saving promotional config', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      // Make some changes and save
      await waitFor(() => {
        const discountInput = screen.getByLabelText('Desconto (%)');
        fireEvent.change(discountInput, { target: { value: '25' } });
      });

      const saveButton = screen.getByText('Salvar');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('PaymentPlans');
      });
    });

    it('should show loading state during save', async () => {
      // Mock a delayed response
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => new Promise(resolve => setTimeout(() => resolve({ data: mockPlans[0], error: null }), 100))),
          })),
        })),
      });

      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      const saveButton = screen.getByText('Salvar');
      fireEvent.click(saveButton);

      expect(screen.getByText('Salvando...')).toBeInTheDocument();
    });
  });

  describe('🔴 CRITICAL: Form Input Handling', () => {
    it('should update discount percentage input', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        const discountInput = screen.getByLabelText('Desconto (%)');
        fireEvent.change(discountInput, { target: { value: '35' } });
        expect(discountInput).toHaveValue('35');
      });
    });

    it('should update promotional badge input', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        const badgeInput = screen.getByLabelText('Badge Promocional');
        fireEvent.change(badgeInput, { target: { value: 'OFERTA IMPERDÍVEL' } });
        expect(badgeInput).toHaveValue('OFERTA IMPERDÍVEL');
      });
    });

    it('should update layout selection', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      // Find and interact with layout select
      await waitFor(() => {
        const layoutSelects = screen.getAllByRole('combobox');
        const layoutSelect = layoutSelects.find(select => 
          select.closest('[class*="space-y"]')?.querySelector('label')?.textContent === 'Layout'
        );
        
        if (layoutSelect) {
          fireEvent.click(layoutSelect);
        }
      });

      await waitFor(() => {
        const compactOption = screen.getByText('Compacto');
        fireEvent.click(compactOption);
      });
    });

    it('should handle datetime input for expiration date', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        const expirationInput = screen.getByLabelText('Data de Expiração');
        fireEvent.change(expirationInput, { target: { value: '2024-12-31T23:59' } });
        expect(expirationInput).toHaveValue('2024-12-31T23:59');
      });
    });
  });

  describe('🔵 STRATEGIC: Configuration State Management', () => {
    it('should initialize promotional config with existing data', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[1]); // Premium plan with existing config
      });

      await waitFor(() => {
        const discountInput = screen.getByLabelText('Desconto (%)');
        expect(discountInput).toHaveValue('30'); // From mock data
        
        const badgeInput = screen.getByLabelText('Badge Promocional');
        expect(badgeInput).toHaveValue('SUPER DESCONTO');
      });
    });

    it('should initialize display config with default values for new plans', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]); // Basic plan without config
      });

      await waitFor(() => {
        // Should have default values initialized
        const discountInput = screen.getByLabelText('Desconto (%)');
        expect(discountInput).toHaveValue('');
      });
    });

    it('should handle config changes reactively', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      // Toggle promotion active and check conditional rendering
      await waitFor(() => {
        const toggleSwitch = screen.getByRole('switch');
        fireEvent.click(toggleSwitch);
      });

      // Fields should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText('Desconto (%)')).toBeInTheDocument();
        expect(screen.getByText('Configurações de Desconto')).toBeInTheDocument();
      });
    });
  });

  describe('🔵 STRATEGIC: Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      // Mock error response
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
          })),
        })),
      });

      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      const saveButton = screen.getByText('Salvar');
      fireEvent.click(saveButton);

      // Should still show the save button (not in loading state)
      await waitFor(() => {
        expect(screen.getByText('Salvar')).toBeInTheDocument();
      });
    });

    it('should validate numeric inputs', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        const discountInput = screen.getByLabelText('Desconto (%)');
        
        // Test input validation
        expect(discountInput).toHaveAttribute('type', 'number');
        expect(discountInput).toHaveAttribute('min', '0');
        expect(discountInput).toHaveAttribute('max', '100');
      });
    });
  });

  describe('🟢 ACCESSIBILITY: Promotional Configuration', () => {
    it('should have proper labels for all form inputs', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Desconto (%)')).toBeInTheDocument();
        expect(screen.getByLabelText('Badge Promocional')).toBeInTheDocument();
        expect(screen.getByLabelText('Mensagem Personalizada')).toBeInTheDocument();
        expect(screen.getByLabelText('Mensagem de Urgência')).toBeInTheDocument();
        expect(screen.getByLabelText('Data de Expiração')).toBeInTheDocument();
        expect(screen.getByLabelText('Layout')).toBeInTheDocument();
        expect(screen.getByLabelText('Tema')).toBeInTheDocument();
      });
    });

    it('should have accessible toggle for promotion activation', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        const toggleSwitch = screen.getByRole('switch');
        expect(toggleSwitch).toBeInTheDocument();
        expect(toggleSwitch).toHaveAttribute('aria-checked');
      });
    });

    it('should have accessible buttons with clear labels', async () => {
      render(
        <TestWrapper>
          <AdminPaymentManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const configButtons = screen.getAllByText('Configuração Promocional');
        fireEvent.click(configButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Ver Preview/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
      });
    });
  });
});