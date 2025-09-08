// ABOUTME: TypeScript definitions for centralized user onboarding and profile completion system

import { User } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

// Core practitioner type from database
export type Practitioner = Tables<'Practitioners'>;

/**
 * Simplified actions to prevent users from getting lost between flows
 */
export type OnboardingAction = 
  | 'complete_profile'      // Missing basic profile info (name, profession)
  | 'verify_email'          // Email not confirmed

/**
 * Represents the completeness state of a user's profile
 */
export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  requiredActions: OnboardingAction[];
  optionalActions: OnboardingAction[];
}

/**
 * Payment user data that might need to be carried through auth flow
 */
export interface PaymentUserData {
  customerName?: string;
  customerEmail?: string;
  customerDocument?: string;
  customerPhone?: string;
  paymentId?: string;
  planPurchased?: string;
  amountPaid?: number;
}

/**
 * Simple parameters for flow bridging
 */
export interface JourneyParams {
  flow?: 'payment-complete' | 'profile-incomplete';
  paymentId?: string;
  source?: 'payment' | 'google-auth';
  token?: string; // Secure token for payment-to-auth transitions
}

/**
 * Simple journey determination
 */
export interface UserJourney {
  needsProfileCompletion: boolean;
  nextStep: OnboardingAction | null;
  targetRoute: string;
  preservedData?: PaymentUserData;
}

/**
 * Auth method types for conflict resolution
 */
export type AuthMethod = 'email' | 'google';