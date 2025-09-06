// ABOUTME: Enhanced user status hook with comprehensive subscription timing data and admin management capabilities

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionTimingData {
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_created_by?: 'user' | 'admin';
  subscription_payment_method_used?: 'pix' | 'credit_card' | 'boleto' | 'admin_manual';
  admin_subscription_notes?: string;
  subscription_days_granted?: number;
  trial_end_date?: string;
  last_payment_date?: string;
  next_billing_date?: string;
  subscription_id?: string;
}

interface EnhancedUserStatus {
  // Basic user info
  id: string;
  full_name: string;
  email: string;
  role: string;
  subscription_tier: string;
  created_at: string;
  avatar_url?: string;
  profession?: string;
  
  // Subscription timing data
  subscriptionData: SubscriptionTimingData;
  
  // Computed subscription status
  subscriptionStatus: {
    isActive: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean; // <= 7 days
    isCritical: boolean; // <= 3 days
    remainingDays: number | null;
    daysUntilRenewal: number | null;
    isPremium: boolean;
    hasTrial: boolean;
    trialExpired: boolean;
    trialRemainingDays: number | null;
  };
  
  // Admin tracking
  adminTracking: {
    wasCreatedByAdmin: boolean;
    hasAdminNotes: boolean;
    adminGrantedDays: number;
    lastAdminAction?: string;
    creationMethod: 'user_payment' | 'admin_granted' | 'unknown';
  };
  
  // Billing information
  billingInfo: {
    hasRecurringSubscription: boolean;
    nextBillingDate?: string;
    lastPaymentDate?: string;
    paymentMethod?: string;
    totalDaysGranted: number;
  };
}

interface TimeAdjustmentParams {
  userId: string;
  days: number;
  notes: string;
}

interface SubscriptionResetParams {
  userId: string;
  notes: string;
}

// Helper function to calculate remaining days
const calculateRemainingDays = (endDate?: string): number | null => {
  if (!endDate) return null;
  
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Helper function to calculate trial remaining days
const calculateTrialRemainingDays = (trialEndDate?: string): number | null => {
  if (!trialEndDate) return null;
  
  const trialEnd = new Date(trialEndDate);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Transform raw user data into enhanced status
const transformUserData = (userData: any): EnhancedUserStatus => {
  const subscriptionData: SubscriptionTimingData = {
    subscription_start_date: userData.subscription_start_date,
    subscription_end_date: userData.subscription_end_date,
    subscription_created_by: userData.subscription_created_by,
    subscription_payment_method_used: userData.subscription_payment_method_used,
    admin_subscription_notes: userData.admin_subscription_notes,
    subscription_days_granted: userData.subscription_days_granted,
    trial_end_date: userData.trial_end_date,
    last_payment_date: userData.last_payment_date,
    next_billing_date: userData.next_billing_date,
    subscription_id: userData.subscription_id,
  };

  const remainingDays = calculateRemainingDays(subscriptionData.subscription_end_date);
  const trialRemainingDays = calculateTrialRemainingDays(subscriptionData.trial_end_date);
  const nextBillingDays = calculateRemainingDays(subscriptionData.next_billing_date);

  const subscriptionStatus = {
    isActive: userData.subscription_tier === 'premium' && (remainingDays === null || remainingDays > 0),
    isExpired: remainingDays !== null && remainingDays <= 0,
    isExpiringSoon: remainingDays !== null && remainingDays > 0 && remainingDays <= 7,
    isCritical: remainingDays !== null && remainingDays > 0 && remainingDays <= 3,
    remainingDays,
    daysUntilRenewal: nextBillingDays,
    isPremium: userData.subscription_tier === 'premium',
    hasTrial: Boolean(subscriptionData.trial_end_date),
    trialExpired: trialRemainingDays !== null && trialRemainingDays <= 0,
    trialRemainingDays,
  };

  const adminTracking = {
    wasCreatedByAdmin: subscriptionData.subscription_created_by === 'admin',
    hasAdminNotes: Boolean(subscriptionData.admin_subscription_notes?.trim()),
    adminGrantedDays: subscriptionData.subscription_days_granted || 0,
    lastAdminAction: subscriptionData.admin_subscription_notes,
    creationMethod: subscriptionData.subscription_created_by === 'admin' 
      ? 'admin_granted' as const
      : subscriptionData.subscription_created_by === 'user' 
        ? 'user_payment' as const
        : 'unknown' as const,
  };

  const billingInfo = {
    hasRecurringSubscription: Boolean(subscriptionData.subscription_id),
    nextBillingDate: subscriptionData.next_billing_date,
    lastPaymentDate: subscriptionData.last_payment_date,
    paymentMethod: subscriptionData.subscription_payment_method_used,
    totalDaysGranted: subscriptionData.subscription_days_granted || 0,
  };

  return {
    id: userData.id,
    full_name: userData.full_name,
    email: userData.email,
    role: userData.role,
    subscription_tier: userData.subscription_tier,
    created_at: userData.created_at,
    avatar_url: userData.avatar_url,
    profession: userData.profession,
    subscriptionData,
    subscriptionStatus,
    adminTracking,
    billingInfo,
  };
};

// Hook to get enhanced user status for a specific user
export const useUserStatus = (userId?: string) => {
  return useQuery({
    queryKey: ['user-status', userId],
    queryFn: async (): Promise<EnhancedUserStatus> => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Query the Practitioners table directly with all subscription fields
      const { data: userData, error } = await supabase
        .from('Practitioners')
        .select(`
          id,
          full_name,
          email,
          role,
          subscription_tier,
          created_at,
          avatar_url,
          profession,
          subscription_start_date,
          subscription_end_date,
          subscription_created_by,
          subscription_payment_method_used,
          admin_subscription_notes,
          subscription_days_granted,
          trial_end_date,
          last_payment_date,
          next_billing_date,
          subscription_id
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user status:', error);
        throw new Error(`Failed to fetch user status: ${error.message}`);
      }

      return transformUserData(userData);
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute - subscription data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Important for subscription status
    retry: (failureCount, error) => {
      console.error('User status query failed:', error);
      return failureCount < 2;
    },
  });
};

// Hook to get current authenticated user's enhanced status
export const useCurrentUserStatus = () => {
  return useQuery({
    queryKey: ['current-user-status'],
    queryFn: async (): Promise<EnhancedUserStatus | null> => {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return null;
      }

      // Query the Practitioners table with all subscription fields
      const { data: userData, error } = await supabase
        .from('Practitioners')
        .select(`
          id,
          full_name,
          email,
          role,
          subscription_tier,
          created_at,
          avatar_url,
          profession,
          subscription_start_date,
          subscription_end_date,
          subscription_created_by,
          subscription_payment_method_used,
          admin_subscription_notes,
          subscription_days_granted,
          trial_end_date,
          last_payment_date,
          next_billing_date,
          subscription_id
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching current user status:', error);
        throw new Error(`Failed to fetch user status: ${error.message}`);
      }

      return transformUserData(userData);
    },
    staleTime: 30 * 1000, // 30 seconds - current user data is very dynamic
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      console.error('Current user status query failed:', error);
      return failureCount < 2;
    },
  });
};

// Hook to get multiple users' status with pagination
export const useBulkUserStatus = (userIds: string[]) => {
  return useQuery({
    queryKey: ['bulk-user-status', userIds.sort().join(',')],
    queryFn: async (): Promise<EnhancedUserStatus[]> => {
      if (userIds.length === 0) return [];

      // Query multiple users at once
      const { data: usersData, error } = await supabase
        .from('Practitioners')
        .select(`
          id,
          full_name,
          email,
          role,
          subscription_tier,
          created_at,
          avatar_url,
          profession,
          subscription_start_date,
          subscription_end_date,
          subscription_created_by,
          subscription_payment_method_used,
          admin_subscription_notes,
          subscription_days_granted,
          trial_end_date,
          last_payment_date,
          next_billing_date,
          subscription_id
        `)
        .in('id', userIds);

      if (error) {
        console.error('Error fetching bulk user status:', error);
        throw new Error(`Failed to fetch users status: ${error.message}`);
      }

      return (usersData || []).map(transformUserData);
    },
    enabled: userIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('Bulk user status query failed:', error);
      return failureCount < 2;
    },
  });
};

// Mutation for adjusting subscription time (admin only)
export const useTimeAdjustmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, days, notes }: TimeAdjustmentParams) => {
      // Get current user subscription data
      const { data: currentUser, error: fetchError } = await supabase
        .from('Practitioners')
        .select('subscription_end_date, subscription_days_granted')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch user data: ${fetchError.message}`);
      }

      // Calculate new end date
      const currentEndDate = currentUser?.subscription_end_date 
        ? new Date(currentUser.subscription_end_date)
        : new Date();
      
      const newEndDate = new Date(currentEndDate.getTime() + (days * 24 * 60 * 60 * 1000));
      const currentGrantedDays = currentUser?.subscription_days_granted || 0;

      // Update user subscription
      const { error: updateError } = await supabase
        .from('Practitioners')
        .update({
          subscription_end_date: newEndDate.toISOString(),
          subscription_days_granted: currentGrantedDays + days,
          admin_subscription_notes: notes,
          subscription_created_by: 'admin',
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to adjust subscription time: ${updateError.message}`);
      }

      return { userId, days, newEndDate, notes };
    },
    onSuccess: (data) => {
      console.log(`Time adjustment successful for user ${data.userId}: ${data.days} days`);
      
      // Invalidate user status queries
      queryClient.invalidateQueries({ queryKey: ['user-status', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      console.error('Time adjustment failed:', error);
    },
  });
};

// Mutation for resetting subscription (admin only)
export const useSubscriptionResetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, notes }: SubscriptionResetParams) => {
      const { error } = await supabase
        .from('Practitioners')
        .update({
          subscription_tier: 'free',
          subscription_start_date: null,
          subscription_end_date: null,
          subscription_created_by: null,
          subscription_payment_method_used: null,
          admin_subscription_notes: `RESET: ${notes}`,
          subscription_days_granted: 0,
          trial_end_date: null,
          last_payment_date: null,
          next_billing_date: null,
          subscription_id: null,
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to reset subscription: ${error.message}`);
      }

      return { userId, notes };
    },
    onSuccess: (data) => {
      console.log(`Subscription reset successful for user ${data.userId}`);
      
      // Invalidate user status queries
      queryClient.invalidateQueries({ queryKey: ['user-status', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-user-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      console.error('Subscription reset failed:', error);
    },
  });
};

// Export types for component usage
export type {
  EnhancedUserStatus,
  SubscriptionTimingData,
  TimeAdjustmentParams,
  SubscriptionResetParams,
};