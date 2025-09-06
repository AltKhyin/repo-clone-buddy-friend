// ABOUTME: Admin payment creation hooks for one-time payments and subscription plans with comprehensive error handling

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BasePaymentData {
  targetUserId: string;
  amount: number; // in cents
  description: string;
  paymentMethod: 'pix' | 'credit_card';
  adminNotes?: string;
  metadata: {
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    customerPhone: string;
    planName: string;
    adminCreated: boolean;
    adminUserId: string;
  };
  billingAddress?: {
    line_1: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
  cardData?: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
  };
}

interface OneTimePaymentData extends BasePaymentData {
  subscriptionDaysToGrant: number;
  cardToken?: string;
  installments?: number;
}

interface SubscriptionPlanData extends BasePaymentData {
  planName: string;
  billingInterval: 'month' | 'year';
  intervalCount: number;
  trialDays?: number;
  cardToken?: string;
}

interface PaymentResult {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  target_user_id: string;
  admin_created: boolean;
  admin_user_id: string;
  created_at: string;
  
  // One-time payment specific
  subscription_days_granted?: number;
  
  // Subscription specific  
  subscription_id?: string;
  plan_name?: string;
  billing_interval?: string;
  interval_count?: number;
  trial_days?: number;
  
  // PIX specific
  qr_code?: string;
  qr_code_url?: string;
  expires_at?: string;
  
  // Credit card specific
  authorization_code?: string;
}

interface PaymentError {
  message: string;
  code?: string;
  details?: any;
}

interface BulkPaymentParams {
  userIds: string[];
  paymentTemplate: Omit<OneTimePaymentData, 'targetUserId' | 'metadata'>;
  individualNotes?: Record<string, string>; // userId -> custom notes
}

interface BulkPaymentResult {
  successful: Array<{
    userId: string;
    result: PaymentResult;
  }>;
  failed: Array<{
    userId: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Hook for creating one-time admin payments
export const useCreateAdminPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: OneTimePaymentData): Promise<PaymentResult> => {
      console.log('Creating admin one-time payment:', { 
        targetUser: paymentData.targetUserId,
        amount: paymentData.amount,
        days: paymentData.subscriptionDaysToGrant 
      });

      const { data, error } = await supabase.functions.invoke('admin-create-custom-payment', {
        body: paymentData,
      });

      if (error) {
        console.error('Admin payment creation failed:', error);
        throw new Error(`Payment creation failed: ${error.message}`);
      }

      if (!data.success && data.error) {
        throw new Error(data.error.message || 'Payment creation failed');
      }

      const result = data.success ? data.data : data;
      console.log('Admin payment created successfully:', result);

      return result as PaymentResult;
    },
    onSuccess: (result) => {
      console.log(`Admin payment successful: ${result.code} for user ${result.target_user_id}`);
      
      // Invalidate user status queries for the target user
      queryClient.invalidateQueries({ queryKey: ['user-status', result.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ['bulk-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      // Invalidate current user status if it's the current user
      queryClient.invalidateQueries({ queryKey: ['current-user-status'] });
      
      // Invalidate community data as subscription status may have changed
      queryClient.invalidateQueries({ queryKey: ['community-sidebar-data'] });
    },
    onError: (error: Error) => {
      console.error('Admin payment creation error:', error);
    },
  });
};

// Hook for creating recurring subscription plans
export const useCreateAdminSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionData: SubscriptionPlanData): Promise<PaymentResult> => {
      console.log('Creating admin subscription plan:', { 
        targetUser: subscriptionData.targetUserId,
        amount: subscriptionData.amount,
        interval: `${subscriptionData.intervalCount} ${subscriptionData.billingInterval}(s)`,
        trial: subscriptionData.trialDays || 0
      });

      const { data, error } = await supabase.functions.invoke('admin-create-subscription-plan', {
        body: subscriptionData,
      });

      if (error) {
        console.error('Admin subscription creation failed:', error);
        throw new Error(`Subscription creation failed: ${error.message}`);
      }

      if (!data.success && data.error) {
        throw new Error(data.error.message || 'Subscription creation failed');
      }

      const result = data.success ? data.data : data;
      console.log('Admin subscription created successfully:', result);

      return result as PaymentResult;
    },
    onSuccess: (result) => {
      console.log(`Admin subscription successful: ${result.code} for user ${result.target_user_id}`);
      
      // Invalidate user status queries for the target user
      queryClient.invalidateQueries({ queryKey: ['user-status', result.target_user_id] });
      queryClient.invalidateQueries({ queryKey: ['bulk-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      // Invalidate current user status if it's the current user
      queryClient.invalidateQueries({ queryKey: ['current-user-status'] });
      
      // Invalidate community data as subscription status may have changed
      queryClient.invalidateQueries({ queryKey: ['community-sidebar-data'] });
    },
    onError: (error: Error) => {
      console.error('Admin subscription creation error:', error);
    },
  });
};

// Hook for bulk payment creation (admin only)
export const useCreateBulkAdminPayments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, paymentTemplate, individualNotes }: BulkPaymentParams): Promise<BulkPaymentResult> => {
      console.log(`Creating bulk admin payments for ${userIds.length} users`);
      
      const results: BulkPaymentResult = {
        successful: [],
        failed: [],
        summary: {
          total: userIds.length,
          successful: 0,
          failed: 0,
        },
      };

      // Process each user individually to track successes/failures
      for (const userId of userIds) {
        try {
          // Get user data for metadata
          const { data: userData, error: userError } = await supabase
            .from('Practitioners')
            .select('full_name, email')
            .eq('id', userId)
            .single();

          if (userError || !userData) {
            throw new Error(`Failed to fetch user data: ${userError?.message || 'User not found'}`);
          }

          // Create individual payment data
          const individualPaymentData: OneTimePaymentData = {
            ...paymentTemplate,
            targetUserId: userId,
            adminNotes: individualNotes?.[userId] || paymentTemplate.adminNotes,
            metadata: {
              ...paymentTemplate.metadata,
              customerName: userData.full_name || 'Nome não informado',
              customerEmail: userData.email || 'email@example.com',
            },
          };

          const { data, error } = await supabase.functions.invoke('admin-create-custom-payment', {
            body: individualPaymentData,
          });

          if (error) {
            throw new Error(error.message);
          }

          if (!data.success && data.error) {
            throw new Error(data.error.message || 'Payment creation failed');
          }

          const result = data.success ? data.data : data;
          results.successful.push({ userId, result });
          results.summary.successful++;

        } catch (error) {
          console.error(`Bulk payment failed for user ${userId}:`, error);
          results.failed.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          results.summary.failed++;
        }
      }

      return results;
    },
    onSuccess: (result) => {
      console.log('Bulk admin payments completed:', result.summary);
      
      // Invalidate all user-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['community-sidebar-data'] });
    },
    onError: (error) => {
      console.error('Bulk admin payments failed:', error);
    },
  });
};

// Utility hook for validating payment data
export const useValidatePaymentData = () => {
  return {
    validateOneTimePayment: (data: Partial<OneTimePaymentData>): string[] => {
      const errors: string[] = [];

      if (!data.targetUserId?.trim()) {
        errors.push('Target user ID is required');
      }

      if (!data.amount || data.amount < 1) {
        errors.push('Amount must be greater than 0');
      }

      if (!data.description?.trim()) {
        errors.push('Description is required');
      }

      if (!data.subscriptionDaysToGrant || data.subscriptionDaysToGrant < 1 || data.subscriptionDaysToGrant > 3650) {
        errors.push('Subscription days must be between 1 and 3650');
      }

      if (!data.paymentMethod || !['pix', 'credit_card'].includes(data.paymentMethod)) {
        errors.push('Valid payment method is required');
      }

      if (!data.metadata?.customerName?.trim()) {
        errors.push('Customer name is required');
      }

      if (!data.metadata?.customerEmail?.trim()) {
        errors.push('Customer email is required');
      }

      if (!data.metadata?.customerDocument?.trim()) {
        errors.push('Customer document is required');
      }

      if (!data.metadata?.customerPhone?.trim()) {
        errors.push('Customer phone is required');
      }

      if (data.paymentMethod === 'credit_card') {
        if (!data.cardData?.number?.trim()) {
          errors.push('Card number is required for credit card payments');
        }

        if (!data.cardData?.holderName?.trim()) {
          errors.push('Card holder name is required');
        }

        if (!data.cardData?.expirationMonth?.trim()) {
          errors.push('Card expiration month is required');
        }

        if (!data.cardData?.expirationYear?.trim()) {
          errors.push('Card expiration year is required');
        }

        if (!data.cardData?.cvv?.trim()) {
          errors.push('Card CVV is required');
        }

        if (!data.billingAddress?.line_1?.trim()) {
          errors.push('Billing address is required for credit card payments');
        }

        if (!data.billingAddress?.zip_code?.trim()) {
          errors.push('Billing ZIP code is required');
        }

        if (!data.billingAddress?.city?.trim()) {
          errors.push('Billing city is required');
        }

        if (!data.billingAddress?.state?.trim()) {
          errors.push('Billing state is required');
        }
      }

      return errors;
    },

    validateSubscriptionPlan: (data: Partial<SubscriptionPlanData>): string[] => {
      const errors: string[] = [];

      if (!data.targetUserId?.trim()) {
        errors.push('Target user ID is required');
      }

      if (!data.amount || data.amount < 100) {
        errors.push('Subscription amount must be at least R$ 1.00');
      }

      if (!data.planName?.trim()) {
        errors.push('Plan name is required');
      }

      if (!data.billingInterval || !['month', 'year'].includes(data.billingInterval)) {
        errors.push('Valid billing interval is required');
      }

      if (!data.intervalCount || data.intervalCount < 1 || data.intervalCount > 12) {
        errors.push('Interval count must be between 1 and 12');
      }

      if (data.trialDays && (data.trialDays < 0 || data.trialDays > 365)) {
        errors.push('Trial days must be between 0 and 365');
      }

      if (!data.metadata?.customerName?.trim()) {
        errors.push('Customer name is required');
      }

      if (!data.metadata?.customerEmail?.trim()) {
        errors.push('Customer email is required');
      }

      if (!data.metadata?.customerDocument?.trim()) {
        errors.push('Customer document is required');
      }

      if (!data.metadata?.customerPhone?.trim()) {
        errors.push('Customer phone is required');
      }

      return errors;
    },
  };
};

// Helper functions for formatting currency and dates
export const paymentHelpers = {
  formatCurrency: (amountInCents: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amountInCents / 100);
  },

  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  },

  formatDateTime: (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  },

  getRemainingDays: (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  getPaymentStatusColor: (status: string): string => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  },
};

// Export types for component usage
export type {
  OneTimePaymentData,
  SubscriptionPlanData,
  PaymentResult,
  PaymentError,
  BulkPaymentParams,
  BulkPaymentResult,
};