// ABOUTME: Tests for simplified profile completeness detection to prevent users from getting lost between flows

import { describe, it, expect } from 'vitest';
import { User } from '@supabase/supabase-js';
import type { Practitioner, JourneyParams, PaymentUserData } from '@/types/onboarding';
import { 
  checkProfileCompleteness,
  determineUserJourney,
  isGoogleUser,
  hasEmailAuth,
  detectAuthMethodConflict
} from '../profileCompleteness';

// Mock data for testing
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  identities: [{
    id: 'test-identity-id',
    user_id: 'test-user-id',
    identity_data: {},
    provider: 'email',
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }],
  ...overrides
});

const createMockPractitioner = (overrides: Partial<Practitioner> = {}): Practitioner => ({
  id: 'test-user-id',
  full_name: 'John Doe',
  avatar_url: null,
  role: 'practitioner',
  subscription_tier: 'free',
  contribution_score: 0,
  display_hover_card: true,
  created_at: new Date().toISOString(),
  profession: 'Médico',
  linkedin_url: null,
  youtube_url: null,
  instagram_url: null,
  facebook_url: null,
  twitter_url: null,
  website_url: null,
  pagarme_customer_id: null,
  subscription_status: 'inactive',
  subscription_plan: null,
  subscription_id: null,
  payment_metadata: {},
  subscription_expires_at: null,
  payment_method_preferred: null,
  evidens_pagarme_customer_id: null,
  evidens_subscription_status: null,
  evidens_subscription_tier: null,
  evidens_subscription_expires_at: null,
  evidens_trial_started_at: null,
  evidens_payment_method_preference: null,
  subscription_start_date: null,
  subscription_end_date: null,
  subscription_created_by: 'user',
  subscription_payment_method_used: null,
  admin_subscription_notes: null,
  trial_end_date: null,
  last_payment_date: null,
  next_billing_date: null,
  subscription_days_granted: 0,
  ...overrides
});

describe('checkProfileCompleteness', () => {
  it('should return incomplete profile when user is null', () => {
    const result = checkProfileCompleteness(null, null);
    
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('user_account');
    expect(result.completionPercentage).toBe(0);
    expect(result.requiredActions).toContain('complete_profile');
  });

  it('should return incomplete when email is not verified', () => {
    const user = createMockUser({ email_confirmed_at: null });
    const practitioner = createMockPractitioner();
    
    const result = checkProfileCompleteness(user, practitioner);
    
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('email_verification');
    expect(result.requiredActions).toContain('verify_email');
  });

  it('should return incomplete when full_name is missing', () => {
    const user = createMockUser();
    const practitioner = createMockPractitioner({ full_name: null });
    
    const result = checkProfileCompleteness(user, practitioner);
    
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('full_name');
    expect(result.requiredActions).toContain('complete_profile');
  });

  it('should return incomplete when profession is missing', () => {
    const user = createMockUser();
    const practitioner = createMockPractitioner({ profession: null });
    
    const result = checkProfileCompleteness(user, practitioner);
    
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('profession');
    expect(result.requiredActions).toContain('complete_profile');
  });

  it('should return complete profile when all required fields are present', () => {
    const user = createMockUser();
    const practitioner = createMockPractitioner();
    
    const result = checkProfileCompleteness(user, practitioner);
    
    expect(result.isComplete).toBe(true);
    expect(result.requiredActions).toHaveLength(0);
    expect(result.completionPercentage).toBe(100);
  });
});

describe('determineUserJourney', () => {
  it('should direct to profile completion when profile is incomplete', () => {
    const user = createMockUser();
    const practitioner = createMockPractitioner({ profession: null });
    const params: JourneyParams = { source: 'google-auth' };
    
    const result = determineUserJourney(user, practitioner, params);
    
    expect(result.needsProfileCompletion).toBe(true);
    expect(result.nextStep).toBe('complete_profile');
    expect(result.targetRoute).toBe('/completar-perfil');
  });

  it('should direct to payment success when coming from payment with complete profile', () => {
    const user = createMockUser();
    const practitioner = createMockPractitioner();
    const params: JourneyParams = { source: 'payment' };
    
    const result = determineUserJourney(user, practitioner, params);
    
    expect(result.needsProfileCompletion).toBe(false);
    expect(result.targetRoute).toBe('/pagamento-sucesso');
  });

  it('should direct to main app when profile is complete and not from payment', () => {
    const user = createMockUser();
    const practitioner = createMockPractitioner();
    const params: JourneyParams = {};
    
    const result = determineUserJourney(user, practitioner, params);
    
    expect(result.needsProfileCompletion).toBe(false);
    expect(result.targetRoute).toBe('/');
  });

  it('should preserve payment data in journey', () => {
    const user = createMockUser();
    const practitioner = createMockPractitioner({ profession: null });
    const params: JourneyParams = { source: 'payment' };
    const paymentData: PaymentUserData = { customerName: 'John Doe', paymentId: 'pay_123' };
    
    const result = determineUserJourney(user, practitioner, params, paymentData);
    
    expect(result.preservedData).toBe(paymentData);
  });
});

describe('utility functions', () => {
  it('should detect Google users correctly', () => {
    const googleUser = createMockUser({ 
      app_metadata: { provider: 'google' }
    });
    const emailUser = createMockUser();
    
    expect(isGoogleUser(googleUser)).toBe(true);
    expect(isGoogleUser(emailUser)).toBe(false);
  });

  it('should detect email auth correctly', () => {
    const emailUser = createMockUser();
    const googleUser = createMockUser({ 
      identities: [{
        id: 'test-identity-id',
        user_id: 'test-user-id',
        identity_data: {},
        provider: 'google',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    });
    
    expect(hasEmailAuth(emailUser)).toBe(true);
    expect(hasEmailAuth(googleUser)).toBe(false);
  });

  it('should have placeholder conflict detection', () => {
    const result = detectAuthMethodConflict('test@example.com', 'email');
    
    expect(result.hasConflict).toBe(false);
  });
});