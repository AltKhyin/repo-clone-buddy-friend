// ABOUTME: TDD tests for usePaymentPlansV2 hook ensuring CRUD operations work correctly with V2 isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { usePaymentPlansV2 } from '../usePaymentPlansV2';
import { supabase } from '@/integrations/supabase/client';
import type { PaymentPlanV2FormData, PaymentPlanV2Row } from '@/types/paymentV2.types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockPaymentPlan, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockPaymentPlan, error: null }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock payment plan data
const mockPaymentPlan: PaymentPlanV2Row = {
  id: 'plan-123',
  name: 'Premium Plan V2',
  description: 'Test premium plan',
  base_amount: 2990, // R$ 29.90
  final_amount: 2990,
  plan_type: 'premium',
  duration_days: 365,
  is_active: true,
  slug: 'premium-plan-v2',
  usage_count: 0,
  installment_config: {
    enabled: true,
    options: [
      { installments: 1, feeRate: 0.0299 },
      { installments: 3, feeRate: 0.0699 }
    ]
  },
  discount_config: {
    enabled: false,
    type: 'percentage'
  },
  pix_config: {
    enabled: true,
    expirationMinutes: 60
  },
  credit_card_config: {
    enabled: true,
    requireCvv: true
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null
};

const mockFormData: PaymentPlanV2FormData = {
  name: 'Test Plan',
  description: 'A test payment plan',
  planType: 'premium',
  durationDays: 365,
  baseAmount: 1990, // R$ 19.90
  installmentConfig: {
    enabled: true,
    options: [{ installments: 1, feeRate: 0.0299 }]
  },
  discountConfig: {
    enabled: false,
    type: 'percentage'
  },
  pixConfig: {
    enabled: true,
    expirationMinutes: 60
  },
  creditCardConfig: {
    enabled: true,
    requireCvv: true
  }
};

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePaymentPlansV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch payment plans successfully', async () => {
    // Arrange
    const mockPlans = [mockPaymentPlan];
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPlans, error: null }))
      }))
    } as any);

    // Act
    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.plans).toEqual([]);
    
    // Wait for the query to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  it('should create a new payment plan successfully', async () => {
    // Arrange
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockPaymentPlan, error: null }))
        }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Act
    await act(async () => {
      const createdPlan = await result.current.createPlan(mockFormData);
      expect(createdPlan).toEqual(mockPaymentPlan);
    });

    // Assert
    expect(supabase.from).toHaveBeenCalledWith('paymentplansv2');
  });

  it('should update an existing payment plan', async () => {
    // Arrange
    const updatedPlan = { ...mockPaymentPlan, name: 'Updated Plan Name' };
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [mockPaymentPlan], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: updatedPlan, error: null }))
          }))
        }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Act
    await act(async () => {
      const updated = await result.current.updatePlan('plan-123', { name: 'Updated Plan Name' });
      expect(updated).toEqual(updatedPlan);
    });

    // Assert
    expect(supabase.from).toHaveBeenCalledWith('paymentplansv2');
  });

  it('should delete a payment plan', async () => {
    // Arrange
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [mockPaymentPlan], error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Act
    await act(async () => {
      await result.current.deletePlan('plan-123');
    });

    // Assert
    expect(supabase.from).toHaveBeenCalledWith('paymentplansv2');
  });

  it('should toggle plan active status', async () => {
    // Arrange
    const toggledPlan = { ...mockPaymentPlan, is_active: false };
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [mockPaymentPlan], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: toggledPlan, error: null }))
          }))
        }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Act
    await act(async () => {
      const updated = await result.current.togglePlan('plan-123', false);
      expect(updated.is_active).toBe(false);
    });

    // Assert
    expect(supabase.from).toHaveBeenCalledWith('paymentplansv2');
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const mockError = new Error('Database connection failed');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      }))
    } as any);

    // Act
    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Wait for the query to process
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.error).toBeTruthy();
  });

  it('should filter active plans correctly', async () => {
    // Arrange
    const activePlan = { ...mockPaymentPlan, is_active: true };
    const inactivePlan = { ...mockPaymentPlan, id: 'plan-456', is_active: false };
    const mockPlans = [activePlan, inactivePlan];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPlans, error: null }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Wait for the query to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert - activePlans should only include active plans
    expect(result.current.activePlans).toHaveLength(1);
    expect(result.current.activePlans[0].is_active).toBe(true);
  });

  it('should provide utility functions for finding plans', async () => {
    // Arrange
    const mockPlans = [mockPaymentPlan];
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPlans, error: null }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Wait for the query to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.getPlanById('plan-123')).toEqual(mockPaymentPlan);
    expect(result.current.getPlanBySlug('premium-plan-v2')).toEqual(mockPaymentPlan);
    expect(result.current.getPlanById('non-existent')).toBeUndefined();
  });

  it('should validate form data before creation', async () => {
    // Arrange
    const invalidFormData = { ...mockFormData, name: '' }; // Invalid: empty name

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Act & Assert
    await act(async () => {
      await expect(result.current.createPlan(invalidFormData)).rejects.toThrow();
    });
  });

  it('should handle final amount calculation based on discount config', async () => {
    // Arrange
    const discountFormData = {
      ...mockFormData,
      discountConfig: {
        enabled: true,
        type: 'percentage' as const,
        percentage: 0.15 // 15% discount
      }
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockPaymentPlan, error: null }))
        }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Act
    await act(async () => {
      await result.current.createPlan(discountFormData);
    });

    // The hook should calculate final_amount based on discount config
    // Expected: 1990 * (1 - 0.15) = 1691.5 -> 1692 cents
    expect(supabase.from().insert).toHaveBeenCalledWith(
      expect.objectContaining({
        base_amount: 1990,
        final_amount: 1692 // Should be calculated with discount applied
      })
    );
  });

  it('should maintain loading states correctly during operations', async () => {
    // Arrange
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => 
            new Promise(resolve => 
              setTimeout(() => resolve({ data: mockPaymentPlan, error: null }), 100)
            )
          )
        }))
      }))
    } as any);

    const { result } = renderHook(() => usePaymentPlansV2(), {
      wrapper: createWrapper(),
    });

    // Act - Start creation
    act(() => {
      result.current.createPlan(mockFormData);
    });

    // Assert - Should show creating state
    expect(result.current.isCreating).toBe(true);

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Assert - Should reset creating state
    expect(result.current.isCreating).toBe(false);
  });
});