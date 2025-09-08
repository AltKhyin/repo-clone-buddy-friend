// ABOUTME: Enhanced user status hook providing subscription-aware profile data with membership differentiation for profile page

import { useMemo } from 'react';
import { useUserProfileQuery } from '@packages/hooks/useUserProfileQuery';
import { useSubscriptionAccess } from './useSubscriptionAccess';
import type { UserProfile } from '@/types';

export interface MemberBadge {
  text: string;
  color: string;
  textColor: string;
  variant: 'default' | 'secondary' | 'outline';
}

export interface EnhancedUserStatus {
  // Base data
  userProfile: UserProfile | null | undefined;
  isLoading: boolean;
  error: any;

  // Membership status
  isMember: boolean;
  membershipTier: string;
  isTrialing: boolean;
  isPastDue: boolean;

  // Badge configuration
  memberBadge: MemberBadge;
  membershipBadgeColor: string;

  // Upgrade logic
  shouldShowUpgradeButton: boolean;
  upgradeButtonText: string;
  upgradeRedirectPath: string;

  // Subscription states
  subscriptionStatus: string | null;
  subscriptionTier: string;
  isActive: boolean;
}

/**
 * Enhanced user status hook that combines profile and subscription data
 * to provide comprehensive user status information for profile display
 */
export const useEnhancedUserStatus = (): EnhancedUserStatus => {
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfileQuery();
  const {
    isPremium,
    isTrialing,
    isPastDue,
    isActive,
    isLoading: subscriptionLoading,
    subscriptionStatus,
  } = useSubscriptionAccess();

  return useMemo(() => {
    const isLoading = profileLoading || subscriptionLoading;
    const error = profileError;

    // Determine if user is a member based on subscription status
    const isMember = isPremium && isActive && !isPastDue;

    // Determine membership tier display text  
    const membershipTier = isMember ? 'Membro Reviews' : 'Explorar Reviews';

    // Determine subscription tier for display
    const subscriptionTier = userProfile?.subscription_tier || 'free';

    // Badge configuration for members - premium feeling
    const memberBadge: MemberBadge = isMember
      ? {
          text: 'Membro Reviews',
          color: 'bg-black',
          textColor: 'text-white',
          variant: 'default' as const,
        }
      : {
          text: '',  // No badge for free users - cleaner look
          color: 'bg-transparent',
          textColor: 'text-gray-600',
          variant: 'secondary' as const,
        };

    // Determine upgrade button logic
    const shouldShowUpgradeButton = !isMember;
    
    let upgradeButtonText = 'Torne-se membro →';
    if (isPastDue) {
      upgradeButtonText = 'Atualizar pagamento';
    } else if (isTrialing) {
      upgradeButtonText = 'Finalizar assinatura';
    }

    const upgradeRedirectPath = '/pagamento';

    // Badge color for use in components
    const membershipBadgeColor = memberBadge.color;

    return {
      // Base data
      userProfile,
      isLoading,
      error,

      // Membership status
      isMember,
      membershipTier,
      isTrialing: isTrialing || false,
      isPastDue: isPastDue || false,

      // Badge configuration
      memberBadge,
      membershipBadgeColor,

      // Upgrade logic
      shouldShowUpgradeButton,
      upgradeButtonText,
      upgradeRedirectPath,

      // Subscription states
      subscriptionStatus: subscriptionStatus?.subscriptionStatus || null,
      subscriptionTier,
      isActive: isActive || false,
    };
  }, [
    userProfile,
    profileLoading,
    subscriptionLoading,
    profileError,
    isPremium,
    isTrialing,
    isPastDue,
    isActive,
    subscriptionStatus,
  ]);
};