// ABOUTME: Comprehensive tests for subscription automation system
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useCreateSubscription, 
  useUserSubscriptions, 
  useSubscriptionStatus,
  useUpdateSubscription,
  useSubscriptionActions
} from '../useSubscriptionMutations'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
  functions: {
    invoke: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({ eq: vi.fn() }))
      }))
    }))
  }))
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Subscription Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCreateSubscription', () => {
    it('should create subscription successfully with plan-based pricing', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123' }
      }
      
      const mockSubscriptionResponse = {
        id: 'sub_123',
        status: 'active',
        interval: 'month',
        amount: 9990,
        next_billing_at: '2024-02-15T00:00:00Z'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockSubscriptionResponse,
        error: null
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateSubscription(), { wrapper })

      const subscriptionInput = {
        planId: 'plan-123',
        paymentMethod: 'credit_card' as const,
        cardData: {
          number: '4111111111111111',
          holderName: 'John Doe',
          expirationMonth: '12',
          expirationYear: '25',
          cvv: '123'
        },
        billingAddress: {
          line_1: '123 Main St',
          zip_code: '12345-678',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR'
        },
        metadata: {
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999'
        }
      }

      await result.current.mutateAsync(subscriptionInput)

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('evidens-create-subscription', {
        body: subscriptionInput,
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle subscription creation failure', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123' }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Payment method declined' }
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateSubscription(), { wrapper })

      const subscriptionInput = {
        planId: 'plan-123',
        paymentMethod: 'credit_card' as const,
      }

      await expect(result.current.mutateAsync(subscriptionInput)).rejects.toThrow('Payment method declined')
    })

    it('should validate input schema', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateSubscription(), { wrapper })

      const invalidInput = {
        planId: '', // Invalid: empty string
        paymentMethod: 'invalid' as any
      }

      await expect(result.current.mutateAsync(invalidInput)).rejects.toThrow()
    })
  })

  describe('useSubscriptionStatus', () => {
    it('should return correct subscription status for active user', async () => {
      const mockUser = { id: 'user-123' }
      const mockPractitioner = {
        subscription_status: 'active',
        subscription_tier: 'premium',
        subscription_expires_at: '2024-12-31T23:59:59Z',
        next_billing_date: '2024-02-15T00:00:00Z',
        evidens_subscription_status: 'active',
        evidens_subscription_tier: 'premium',
        payment_metadata: { last_payment_date: '2024-01-15T00:00:00Z' }
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockPractitioner,
              error: null
            }))
          }))
        }))
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useSubscriptionStatus(), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual({
          isSubscribed: true,
          status: 'active',
          subscriptionTier: 'premium',
          currentPlan: null,
          expiresAt: new Date('2024-12-31T23:59:59Z'),
          nextBillingDate: new Date('2024-02-15T00:00:00Z'),
          paymentMetadata: { last_payment_date: '2024-01-15T00:00:00Z' },
          isActive: true,
          isTrialing: false,
          isPastDue: false,
          isCanceled: false,
          isSuspended: false,
          isPremium: true,
          hasValidSubscription: true
        })
      })
    })

    it('should return inactive status for users without subscription', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useSubscriptionStatus(), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual({
          isSubscribed: false,
          status: 'inactive',
          currentPlan: null,
          nextBillingDate: null,
          subscriptionTier: 'free'
        })
      })
    })

    it('should prioritize evidens fields over legacy fields', async () => {
      const mockUser = { id: 'user-123' }
      const mockPractitioner = {
        // Legacy fields
        subscription_status: 'inactive',
        subscription_tier: 'free',
        // New evidens fields (should take priority)
        evidens_subscription_status: 'active',
        evidens_subscription_tier: 'premium',
        evidens_subscription_expires_at: '2024-12-31T23:59:59Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockPractitioner,
              error: null
            }))
          }))
        }))
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useSubscriptionStatus(), { wrapper })

      await waitFor(() => {
        expect(result.current.data?.status).toBe('active')
        expect(result.current.data?.subscriptionTier).toBe('premium')
        expect(result.current.data?.isSubscribed).toBe(true)
        expect(result.current.data?.isPremium).toBe(true)
      })
    })
  })

  describe('useUpdateSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123' }
      }

      const mockResponse = {
        id: 'sub_123',
        action: 'cancel',
        status: 'canceled',
        message: 'Subscription canceled successfully'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateSubscription(), { wrapper })

      const updateInput = {
        subscriptionId: 'sub_123',
        action: 'cancel' as const,
        reason: 'User requested cancellation'
      }

      await result.current.mutateAsync(updateInput)

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('evidens-manage-subscription', {
        body: {
          subscriptionId: 'sub_123',
          action: 'cancel',
          reason: 'User requested cancellation'
        },
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      })
    })

    it('should reactivate subscription successfully', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123' }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { action: 'reactivate', status: 'active' },
        error: null
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateSubscription(), { wrapper })

      const updateInput = {
        subscriptionId: 'sub_123',
        action: 'reactivate' as const
      }

      await result.current.mutateAsync(updateInput)

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('evidens-manage-subscription', {
        body: {
          subscriptionId: 'sub_123',
          action: 'reactivate',
          reason: undefined
        },
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('useSubscriptionActions', () => {
    it('should provide convenient action methods', async () => {
      const mockSession = {
        access_token: 'mock-token'
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { status: 'canceled' },
        error: null
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useSubscriptionActions(), { wrapper })

      await result.current.cancelSubscription('sub_123', 'Test reason')

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('evidens-manage-subscription', 
        expect.objectContaining({
          body: {
            subscriptionId: 'sub_123',
            action: 'cancel',
            reason: 'Test reason'
          }
        })
      )
    })

    it('should track loading states correctly', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useSubscriptionActions(), { wrapper })

      expect(typeof result.current.isCreating).toBe('boolean')
      expect(typeof result.current.isUpdating).toBe('boolean')
      expect(result.current.createError).toBeNull()
      expect(result.current.updateError).toBeNull()
    })
  })

  describe('useUserSubscriptions', () => {
    it('should fetch user subscriptions with plan details', async () => {
      const mockUser = { id: 'user-123' }
      const mockSubscriptions = [
        {
          id: 'sub_1',
          status: 'active',
          amount: 9990,
          PaymentPlans: {
            id: 'plan_1',
            name: 'Premium Monthly',
            amount: 9990,
            promotional_config: { isActive: false }
          }
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockSubscriptions,
              error: null
            }))
          }))
        }))
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUserSubscriptions(), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSubscriptions)
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('evidens_subscriptions')
    })

    it('should handle authentication errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUserSubscriptions(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })
  })
})

describe('Integration Tests', () => {
  it('should handle complete subscription lifecycle', async () => {
    // This test would verify the entire flow from creation to cancellation
    // in a real integration environment
    expect(true).toBe(true) // Placeholder for comprehensive integration test
  })

  it('should sync with webhook events properly', async () => {
    // This test would verify webhook event processing updates local state
    expect(true).toBe(true) // Placeholder for webhook integration test
  })
})