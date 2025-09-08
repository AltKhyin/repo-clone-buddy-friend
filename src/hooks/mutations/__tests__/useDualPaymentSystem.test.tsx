// ABOUTME: Tests for dual payment system ensuring correct routing between subscriptions and one-time payments

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  useCreatePlanBasedPixPayment, 
  useCreatePlanBasedCreditCardPayment 
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

describe('Dual Payment System', () => {
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

  describe('Subscription Flow Routing', () => {
    it('should create subscription for subscription-type plan via PIX', async () => {
      // Mock subscription plan
      const mockSubscriptionPlan = {
        id: 'sub-plan-123',
        name: 'Monthly Subscription',
        type: 'subscription',
        amount: 9999,
        billing_interval: 'month',
        promotional_config: null,
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubscriptionPlan,
              error: null
            })
          })
        })
      });

      // Mock subscription Edge Function response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Subscription created successfully',
          subscription_id: 'sub_123',
          status: 'active',
          plan_name: 'Monthly Subscription',
          subscription_details: {
            id: 'sub_123',
            status: 'active',
            next_billing_at: '2025-02-07'
          }
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'sub-plan-123',
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

      // Verify subscription Edge Function was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock.supabase.co/functions/v1/evidens-create-subscription',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('boleto') // PIX through boleto for subscriptions
        })
      );

      expect(result.current.data.subscription_id).toBe('sub_123');
    });

    it('should create subscription for subscription-type plan via Credit Card', async () => {
      // Mock subscription plan
      const mockSubscriptionPlan = {
        id: 'sub-plan-cc',
        name: 'Yearly Subscription',
        type: 'subscription',
        amount: 99999,
        billing_interval: 'year',
        promotional_config: null,
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubscriptionPlan,
              error: null
            })
          })
        })
      });

      // Mock subscription Edge Function response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          subscription_id: 'sub_cc_123',
          status: 'active',
          plan_name: 'Yearly Subscription'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedCreditCardPayment(), { wrapper });

      const paymentData = {
        planId: 'sub-plan-cc',
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

      // Verify subscription Edge Function was called with credit card data
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock.supabase.co/functions/v1/evidens-create-subscription',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('credit_card')
        })
      );

      const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(requestBody.paymentMethod).toBe('credit_card');
      expect(requestBody.cardData).toBeDefined();
      expect(requestBody.billingAddress).toBeDefined();
      expect(requestBody.installments).toBe(12);
    });
  });

  describe('One-Time Payment Flow Routing', () => {
    it('should create one-time payment for one-time plan via PIX', async () => {
      // Mock one-time plan
      const mockOneTimePlan = {
        id: 'onetime-plan-123',
        name: 'Single Purchase',
        type: 'one-time',
        amount: 19999,
        billing_interval: null,
        promotional_config: null,
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockOneTimePlan,
              error: null
            })
          })
        })
      });

      // Mock PIX order Edge Function response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'order_pix_123',
          amount: 19999,
          status: 'pending',
          charges: [{
            last_transaction: {
              qr_code: 'mock-qr-code',
              qr_code_url: 'https://qr.code/url'
            }
          }]
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'onetime-plan-123',
        customerId: 'customer_onetime',
        metadata: {
          customerName: 'One-time User',
          customerEmail: 'onetime@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify PIX payment Edge Function was called (not subscription)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock.supabase.co/functions/v1/evidens-create-payment',
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(result.current.data.id).toBe('order_pix_123');
    });

    it('should create one-time payment for one-time plan via Credit Card', async () => {
      // Mock one-time plan with promotion
      const mockOneTimePlan = {
        id: 'onetime-promo-123',
        name: 'Discounted Purchase',
        type: 'one-time',
        amount: 39999,
        billing_interval: null,
        promotional_config: {
          isActive: true,
          finalPrice: 29999,
          customName: 'Special Offer',
          expiresAt: '2025-12-31T23:59:59Z'
        },
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockOneTimePlan,
              error: null
            })
          })
        })
      });

      // Mock credit card order Edge Function response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'order_cc_123',
          amount: 29999, // Promotional price
          status: 'paid'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedCreditCardPayment(), { wrapper });

      const paymentData = {
        planId: 'onetime-promo-123',
        customerId: 'customer_promo',
        installments: 1,
        metadata: {
          customerName: 'Promo User',
          customerEmail: 'promo@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        },
        billingAddress: {
          line_1: 'Rua Promo, 123',
          zip_code: '01234567',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR'
        },
        cardData: {
          number: '4111111111111111',
          holderName: 'Promo User',
          expirationMonth: '12',
          expirationYear: '25',
          cvv: '123'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify credit card Edge Function was called with promotional amount
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock.supabase.co/functions/v1/evidens-create-payment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('29999') // Promotional amount
        })
      );

      const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(requestBody.amount).toBe(29999);
      expect(requestBody.metadata.promotional).toBe(true);
      expect(requestBody.metadata.originalAmount).toBe(39999);
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription creation failures gracefully', async () => {
      // Mock subscription plan
      const mockPlan = {
        id: 'failing-plan',
        name: 'Failing Plan',
        type: 'subscription',
        amount: 9999,
        billing_interval: 'month',
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

      // Mock subscription Edge Function failure
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Plan must be synchronized with pagar.me first'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'failing-plan',
        customerId: 'customer_fail',
        metadata: {
          customerName: 'Fail User',
          customerEmail: 'fail@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('synchronized with pagar.me');
    });

    it('should validate plan synchronization for subscription plans', async () => {
      // Mock subscription plan without pagar.me plan ID
      const mockUnsyncedPlan = {
        id: 'unsynced-plan',
        name: 'Unsynced Plan',
        type: 'subscription',
        amount: 9999,
        billing_interval: 'month',
        is_active: true
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUnsyncedPlan,
              error: null
            })
          })
        })
      });

      // Mock Edge Function validation error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Plan must be synchronized with pagar.me first. Use evidens-create-plan.'
        })
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreatePlanBasedPixPayment(), { wrapper });

      const paymentData = {
        planId: 'unsynced-plan',
        customerId: 'customer_unsynced',
        metadata: {
          customerName: 'Unsynced User',
          customerEmail: 'unsynced@example.com',
          customerDocument: '12345678900',
          customerPhone: '+5511999999999'
        }
      };

      result.current.mutate(paymentData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('evidens-create-plan');
    });
  });
});