// ABOUTME: Simple logic for detecting missing essential user profile data to prevent users from getting lost between flows

import { User } from '@supabase/supabase-js';
import type { 
  Practitioner, 
  ProfileCompleteness, 
  OnboardingAction,
  UserJourney,
  JourneyParams,
  PaymentUserData
} from '@/types/onboarding';

/**
 * Essential fields needed to prevent users from getting lost
 */
const ESSENTIAL_FIELDS = [
  'full_name',
  'profession'
] as const;

/**
 * Simple check for essential profile data to prevent users from getting lost
 */
export function checkProfileCompleteness(
  user: User | null,
  practitioner: Practitioner | null
): ProfileCompleteness {
  // If no user data, profile is incomplete
  if (!user || !practitioner) {
    return {
      isComplete: false,
      missingFields: ['user_account'],
      completionPercentage: 0,
      requiredActions: ['complete_profile'],
      optionalActions: []
    };
  }

  const missingFields: string[] = [];
  const requiredActions: OnboardingAction[] = [];

  // Check email verification status
  if (!user.email_confirmed_at) {
    missingFields.push('email_verification');
    requiredActions.push('verify_email');
  }

  // Check essential profile fields
  let missingEssentialFields = false;
  
  if (!practitioner.full_name || practitioner.full_name.trim() === '') {
    missingFields.push('full_name');
    missingEssentialFields = true;
  }

  if (!practitioner.profession || practitioner.profession.trim() === '') {
    missingFields.push('profession');
    missingEssentialFields = true;
  }

  if (missingEssentialFields) {
    requiredActions.push('complete_profile');
  }

  // Calculate simple completion percentage
  const totalEssentialFields = ESSENTIAL_FIELDS.length + 1; // +1 for email verification
  const completedFields = totalEssentialFields - missingFields.length;
  const completionPercentage = Math.round((completedFields / totalEssentialFields) * 100);

  return {
    isComplete: requiredActions.length === 0,
    missingFields,
    completionPercentage,
    requiredActions,
    optionalActions: []
  };
}

/**
 * Simple journey determination to bridge payment and auth flows
 */
export function determineUserJourney(
  user: User | null,
  practitioner: Practitioner | null,
  params: JourneyParams,
  preservedPaymentData?: PaymentUserData
): UserJourney {
  const completeness = checkProfileCompleteness(user, practitioner);
  
  // If user needs profile completion, direct them to complete it
  if (!completeness.isComplete) {
    return {
      needsProfileCompletion: true,
      nextStep: completeness.requiredActions[0] || null,
      targetRoute: '/completar-perfil',
      preservedData: preservedPaymentData
    };
  }

  // If coming from payment and profile is complete, go to success
  if (params.source === 'payment') {
    return {
      needsProfileCompletion: false,
      nextStep: null,
      targetRoute: '/pagamento-sucesso',
      preservedData: preservedPaymentData
    };
  }

  // Otherwise, go to main app
  return {
    needsProfileCompletion: false,
    nextStep: null,
    targetRoute: '/',
    preservedData: undefined
  };
}

/**
 * Helper function to detect Google auth users
 */
export function isGoogleUser(user: User): boolean {
  return user.app_metadata?.provider === 'google' || 
         user.identities?.some(identity => identity.provider === 'google') === true;
}

/**
 * Helper function to detect if user has existing email/password auth
 */
export function hasEmailAuth(user: User): boolean {
  return user.identities?.some(identity => identity.provider === 'email') === true;
}

/**
 * Simple check if account with this email already exists
 * Returns the auth method conflict if detected
 */
export function detectAuthMethodConflict(
  email: string,
  currentAuthMethod: 'email' | 'google'
): { hasConflict: boolean; existingMethod?: 'email' | 'google' } {
  // This would need to be implemented with a database check in practice
  // For now, just a placeholder structure
  return {
    hasConflict: false
  };
}