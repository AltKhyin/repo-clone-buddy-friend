// ABOUTME: Comprehensive subscription management hooks for EVIDENS recurring payment system
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { z } from 'zod'
import type { Tables } from '@/integrations/supabase/types'

// =================================================================
// Types & Schemas
// =================================================================

export const subscriptionSchema = z.object({
  planId: z.string().min(1, { message: 'Plan ID is required' }),
  paymentMethod: z.enum(['credit_card', 'pix'], { message: 'Valid payment method required' }),
  customerId: z.string().optional(),
  cardToken: z.string().optional(),
  cardData: z.object({
    number: z.string().min(13, { message: 'Valid card number required' }),
    holderName: z.string().min(2, { message: 'Cardholder name required' }),
    expirationMonth: z.string().length(2, { message: 'Valid expiration month required' }),
    expirationYear: z.string().length(2, { message: 'Valid expiration year required' }),
    cvv: z.string().min(3, { message: 'Valid CVV required' })
  }).optional(),
  billingAddress: z.object({
    line_1: z.string().min(1, { message: 'Address required' }),
    zip_code: z.string().min(8, { message: 'Valid ZIP code required' }),
    city: z.string().min(1, { message: 'City required' }),
    state: z.string().min(2, { message: 'State required' }),
    country: z.string().default('BR')
  }).optional(),
  metadata: z.object({
    customerName: z.string(),
    customerEmail: z.string().email(),
    customerDocument: z.string(),
    customerPhone: z.string()
  }).optional()
})

export type SubscriptionInput = z.infer<typeof subscriptionSchema>

export const subscriptionUpdateSchema = z.object({
  subscriptionId: z.string().min(1, { message: 'Subscription ID required' }),
  action: z.enum(['cancel', 'reactivate', 'pause'], { message: 'Valid action required' }),
  reason: z.string().optional()
})

export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>

// =================================================================
// Subscription Creation
// =================================================================

export const useCreateSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SubscriptionInput): Promise<any> => {
      console.log('Creating subscription:', { planId: input.planId, paymentMethod: input.paymentMethod })

      // Validate input
      const validatedInput = subscriptionSchema.parse(input)

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Authentication required for subscription creation')
      }

      // Call Edge Function to create subscription
      const { data, error } = await supabase.functions.invoke('evidens-create-subscription', {
        body: validatedInput,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Subscription creation failed:', error)
        throw new Error(error.message || 'Failed to create subscription')
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Subscription creation failed')
      }

      console.log('Subscription created successfully:', data.id)
      return data
    },
    onSuccess: (data) => {
      // Invalidate subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['user-status'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
      
      console.log('Subscription queries invalidated after successful creation')
    },
    onError: (error) => {
      console.error('Subscription creation mutation failed:', error)
    }
  })
}

// =================================================================
// Subscription Status & Management
// =================================================================

export const useUserSubscriptions = () => {
  return useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: async () => {
      console.log('Fetching user subscriptions...')

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      // Get subscription data from evidens_subscriptions table
      const { data: subscriptions, error } = await supabase
        .from('evidens_subscriptions')
        .select(`
          *,
          PaymentPlans (
            id,
            name,
            description,
            amount,
            days,
            type,
            billing_interval,
            billing_interval_count,
            promotional_config,
            display_config
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch subscriptions:', error)
        throw new Error('Failed to fetch subscriptions')
      }

      console.log(`Found ${subscriptions?.length || 0} subscriptions for user`)
      return subscriptions || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      console.log('Fetching subscription status...')

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { 
          isSubscribed: false, 
          status: 'inactive',
          currentPlan: null,
          nextBillingDate: null,
          subscriptionTier: 'free'
        }
      }

      // Get user data with subscription info
      const { data: practitioner, error } = await supabase
        .from('Practitioners')
        .select(`
          subscription_status,
          subscription_plan,
          subscription_expires_at,
          next_billing_date,
          subscription_tier,
          evidens_subscription_status,
          evidens_subscription_tier,
          evidens_subscription_expires_at,
          payment_metadata
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Failed to fetch subscription status:', error)
        return {
          isSubscribed: false,
          status: 'inactive',
          currentPlan: null,
          nextBillingDate: null,
          subscriptionTier: 'free'
        }
      }

      // Determine active subscription status (prioritize evidens fields)
      const status = practitioner?.evidens_subscription_status || practitioner?.subscription_status || 'inactive'
      const tier = practitioner?.evidens_subscription_tier || practitioner?.subscription_tier || 'free'
      const expiresAt = practitioner?.evidens_subscription_expires_at || practitioner?.subscription_expires_at
      const nextBilling = practitioner?.next_billing_date

      const isSubscribed = ['active', 'trialing', 'past_due'].includes(status)

      console.log('Subscription status:', { status, tier, isSubscribed })

      return {
        isSubscribed,
        status,
        currentPlan: practitioner?.subscription_plan,
        subscriptionTier: tier,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        nextBillingDate: nextBilling ? new Date(nextBilling) : null,
        paymentMetadata: practitioner?.payment_metadata || {},
        
        // Helper computed properties
        isActive: status === 'active',
        isTrialing: status === 'trial' || status === 'trialing',
        isPastDue: status === 'past_due',
        isCanceled: status === 'canceled' || status === 'cancelled',
        isSuspended: status === 'suspended',
        isPremium: tier === 'premium' || tier === 'enterprise',
        hasValidSubscription: isSubscribed && !['suspended', 'canceled'].includes(status)
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =================================================================
// Subscription Management Actions
// =================================================================

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SubscriptionUpdateInput): Promise<any> => {
      console.log('Updating subscription:', { subscriptionId: input.subscriptionId, action: input.action })

      // Validate input
      const validatedInput = subscriptionUpdateSchema.parse(input)

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Authentication required for subscription management')
      }

      // Call appropriate Edge Function based on action
      let functionName = 'evidens-manage-subscription'
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          subscriptionId: validatedInput.subscriptionId,
          action: validatedInput.action,
          reason: validatedInput.reason
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Subscription update failed:', error)
        throw new Error(error.message || `Failed to ${validatedInput.action} subscription`)
      }

      if (!data || data.error) {
        throw new Error(data?.error || `Subscription ${validatedInput.action} failed`)
      }

      console.log(`Subscription ${validatedInput.action} successful:`, data)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
      queryClient.invalidateQueries({ queryKey: ['user-status'] })
      
      console.log(`Subscription queries invalidated after ${variables.action}`)
    },
    onError: (error) => {
      console.error('Subscription update mutation failed:', error)
    }
  })
}

// =================================================================
// Subscription Analytics & Insights
// =================================================================

export const useSubscriptionMetrics = () => {
  return useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: async () => {
      console.log('Fetching subscription metrics...')

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return null
      }

      // Get subscription history and calculate metrics
      const { data: subscriptions, error } = await supabase
        .from('evidens_subscriptions')
        .select(`
          *,
          PaymentPlans (amount, name, billing_interval)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch subscription metrics:', error)
        return null
      }

      // Calculate total spent, average billing cycle, etc.
      const totalSpent = subscriptions?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0
      const activeSubscriptions = subscriptions?.filter(sub => ['active', 'trialing'].includes(sub.status)).length || 0
      const totalSubscriptions = subscriptions?.length || 0

      return {
        totalSpent,
        activeSubscriptions,
        totalSubscriptions,
        subscriptions: subscriptions || [],
        averageMonthlySpend: totalSpent / Math.max(totalSubscriptions, 1),
        hasSubscriptionHistory: totalSubscriptions > 0
      }
    },
    enabled: false, // Only fetch when specifically requested
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// =================================================================
// Utility Hooks
// =================================================================

export const useSubscriptionFeatureAccess = (feature: string) => {
  const { data: subscriptionStatus } = useSubscriptionStatus()

  return {
    hasAccess: subscriptionStatus?.hasValidSubscription && subscriptionStatus?.isPremium,
    subscriptionRequired: !subscriptionStatus?.hasValidSubscription,
    upgradeRequired: subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.isPremium,
    feature,
    status: subscriptionStatus?.status || 'inactive'
  }
}

export const useSubscriptionActions = () => {
  const createSubscription = useCreateSubscription()
  const updateSubscription = useUpdateSubscription()

  return {
    createSubscription: createSubscription.mutateAsync,
    cancelSubscription: (subscriptionId: string, reason?: string) => 
      updateSubscription.mutateAsync({ subscriptionId, action: 'cancel', reason }),
    reactivateSubscription: (subscriptionId: string) => 
      updateSubscription.mutateAsync({ subscriptionId, action: 'reactivate' }),
    pauseSubscription: (subscriptionId: string, reason?: string) => 
      updateSubscription.mutateAsync({ subscriptionId, action: 'pause', reason }),
    
    // Loading states
    isCreating: createSubscription.isPending,
    isUpdating: updateSubscription.isPending,
    
    // Error states
    createError: createSubscription.error,
    updateError: updateSubscription.error
  }
}