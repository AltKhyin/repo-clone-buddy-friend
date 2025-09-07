// ABOUTME: Tests for plan-based payment integration ensuring promotional pricing resolution works correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  useCreatePlanBasedPixPayment, 
  useCreatePlanBasedCreditCardPayment,
  planBasedPixPaymentSchema,
  planBasedCreditCardPaymentSchema 
} from '../usePaymentMutations';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn()
    }
  }
}));

// Mock fetch for Edge Function calls
global.fetch = vi.fn();

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

describe('Plan-Based Payment Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful auth session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-jwt-token'
        }
      }
    });
    
    // Mock environment variable
    import.meta.env.VITE_SUPABASE_URL = 'https://mock.supabase.co';
  });

  describe('Plan Pricing Resolution', () => {
    it('should resolve base plan pricing when no promotion is active', async () => {
      // Mock plan data without promotion
      const mockPlan = {
        id: 'plan-basic',
        name: 'Plano Básico',
        amount: 9999, // R$ 99,99
        type: 'one-time',
        billing_interval: null,
        promotional_config: null,
        display_config: null,
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null
            })
          })
        })
      });

      // Mock successful Edge Function response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'order_123',
          amount: 9999,
          status: 'pending'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'plan-basic',
        customerId: 'customer_123',
        metadata: {
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify plan data was fetched
      expect(supabase.from).toHaveBeenCalledWith('PaymentPlans');
      
      // Verify Edge Function was called with correct amount
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock.supabase.co/functions/v1/create-pix-payment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('9999') // Base amount
        })
      );
    });

    it('should resolve promotional pricing when active promotion exists', async () => {
      // Mock plan with active promotion
      const mockPlan = {
        id: 'plan-premium',
        name: 'Plano Premium',
        amount: 19999, // R$ 199,99 base price
        type: 'one-time',
        billing_interval: null,
        promotional_config: {
          isActive: true,
          finalPrice: 14999, // R$ 149,99 promotional price
          customName: 'Oferta Especial Premium',
          expiresAt: '2025-12-31T23:59:59Z' // Future date
        },
        display_config: {
          showCustomName: true
        },
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null
            })
          })
        })
      });

      // Mock successful Edge Function response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'order_456',
          amount: 14999,
          status: 'pending'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'plan-premium',
        customerId: 'customer_456',
        metadata: {
          customerName: 'Premium User',
          customerEmail: 'premium@example.com',
          customerDocument: '98765432100',
          customerPhone: '+5511888888888'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify Edge Function was called with promotional amount
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.amount).toBe(14999); // Promotional price
      expect(requestBody.description).toBe('Oferta Especial Premium'); // Custom name
      expect(requestBody.metadata.promotional).toBe(true);
      expect(requestBody.metadata.originalAmount).toBe(19999);
      expect(requestBody.metadata.finalAmount).toBe(14999);
    });

    it('should use base pricing when promotion is expired', async () => {
      // Mock plan with expired promotion
      const mockPlan = {
        id: 'plan-expired',
        name: 'Plano Expirado',
        amount: 9999,
        type: 'one-time',
        promotional_config: {
          isActive: true,
          finalPrice: 7999,
          expiresAt: '2024-01-01T00:00:00Z' // Past date
        },
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null
            })
          })
        })
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'order_789',
          amount: 9999,
          status: 'pending'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'plan-expired',
        customerId: 'customer_789',
        metadata: {
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify base amount is used instead of expired promotion
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.amount).toBe(9999); // Base price, not promotional
      expect(requestBody.metadata.promotional).toBe(false);
    });

    it('should validate minimum amount requirements', async () => {
      // Mock plan with amount below Pagar.me minimum
      const mockPlan = {
        id: 'plan-invalid',
        name: 'Plano Inválido',
        amount: 25, // Below 50 cents minimum
        type: 'one-time',
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null
            })
          })
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'plan-invalid',
        customerId: 'customer_invalid',
        metadata: {
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toContain('Pagar.me minimum');
      });
    });
  });

  describe('Credit Card Plan-Based Payments', () => {
    it('should create credit card payment with plan pricing', async () => {
      const mockPlan = {
        id: 'plan-cc',
        name: 'Plano Cartão',
        amount: 15999,
        type: 'recurring',
        billing_interval: 'monthly',
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null
            })
          })
        })
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'order_cc_123',
          amount: 15999,
          status: 'pending'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedCreditCardPayment(), { wrapper });

      const paymentData = {
        planId: 'plan-cc',
        customerId: 'customer_cc',
        installments: 12,
        metadata: {
          customerName: 'CC User',
          customerEmail: 'cc@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        },
        billingAddress: {
          line_1: 'Rua Exemplo, 123',
          zip_code: '01234567',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR'
        },
        cardData: {
          number: '4111111111111111',
          holderName: 'CC User',
          expirationMonth: '12',
          expirationYear: '25',
          cvv: '123'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify credit card Edge Function was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock.supabase.co/functions/v1/evidens-create-payment',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('Schema Validation', () => {
    it('should validate PIX payment schema correctly', () => {
      const validData = {
        planId: 'plan-123',
        customerId: 'customer-456',
        metadata: {
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      const result = planBasedPixPaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid PIX payment data', () => {
      const invalidData = {
        planId: '', // Empty plan ID
        customerId: 'customer-456',
        metadata: {
          customerName: '',
          customerEmail: 'invalid-email',
          customerDocument: '123', // Too short
          customerPhone: '+5511999999999'
        }
      };

      const result = planBasedPixPaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate credit card payment schema correctly', () => {
      const validData = {
        planId: 'plan-123',
        customerId: 'customer-456',
        installments: 6,
        metadata: {
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        },
        billingAddress: {
          line_1: 'Rua Exemplo, 123',
          zip_code: '01234567',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR'
        },
        cardData: {
          number: '4111111111111111',
          holderName: 'Test User',
          expirationMonth: '12',
          expirationYear: '25',
          cvv: '123'
        }
      };

      const result = planBasedCreditCardPaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle plan not found errors', async () => {
      // Mock plan not found
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Plan not found' }
            })
          })
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'nonexistent-plan',
        customerId: 'customer_123',
        metadata: {
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toContain('Plan not found');
      });
    });

    it('should handle Edge Function errors', async () => {
      const mockPlan = {
        id: 'plan-123',
        name: 'Test Plan',
        amount: 9999,
        type: 'one-time',
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPlan,
              error: null
            })
          })
        })
      });

      // Mock Edge Function error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: 'Payment creation failed'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'plan-123',
        customerId: 'customer_123',
        metadata: {
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});