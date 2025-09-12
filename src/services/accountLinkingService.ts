// ABOUTME: Account linking service orchestrating three-path payment-to-account integration logic

import { findUserByEmail, type UserLookupResult } from '@/services/userLookup';
import { 
  createAccountLinkToken, 
  type TokenData, 
  type TokenCreationResult 
} from '@/services/tokenService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Result of account linking process
 */
export interface AccountLinkingResult {
  success: boolean;
  action: 'immediate_link' | 'login_prompt' | 'registration_invite';
  message: string;
  data?: {
    userId?: string;
    token?: string;
    linkId?: string;
    registrationUrl?: string;
    loginUrl?: string;
    expiresAt?: string;
  };
  error?: string;
}

/**
 * Payment data for account linking
 */
export interface PaymentLinkingData {
  email: string;
  paymentData: {
    planId: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    paidAt: string;
  };
  customerData: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };
  planData: {
    id: string;
    name: string;
    description?: string;
    durationDays: number;
    finalAmount: number;
  };
}

/**
 * Main account linking orchestrator with simplified two-path logic
 * 
 * PATH 1: Existing user → Direct subscription activation (regardless of login status)
 * PATH 2: New user → Registration email with account creation
 */
export const linkPaymentToAccount = async (
  linkingData: PaymentLinkingData
): Promise<AccountLinkingResult> => {
  console.log('🔗 Starting account linking process for:', linkingData.email);
  
  try {
    // Step 1: Identify user status
    const userLookup = await findUserByEmail(linkingData.email);
    console.log('👤 User lookup result:', { 
      exists: userLookup.exists, 
      isLoggedIn: userLookup.isLoggedIn 
    });

    // PATH 1: User exists in system → Direct activation via Edge Function
    if (userLookup.exists && userLookup.userId) {
      console.log('⚡ PATH 1: Direct activation for existing user');
      
      try {
        const { data: activationResult, error: activationError } = await supabase.functions.invoke('activate-subscription-v2', {
          body: {
            userId: userLookup.userId,
            paymentData: linkingData.paymentData,
            planData: linkingData.planData,
          }
        });

        if (activationError || !activationResult?.success) {
          console.error('❌ PATH 1: Edge Function activation failed:', activationError || activationResult);
          return {
            success: false,
            action: 'immediate_link',
            message: 'Payment received but subscription activation failed. Please contact support.',
            error: activationError?.message || activationResult?.error || 'Unknown error',
          };
        }

        console.log('✅ PATH 1: Direct activation successful:', activationResult);
        return {
          success: true,
          action: 'immediate_link',
          message: 'Payment successful! Your subscription has been activated.',
          data: {
            userId: userLookup.userId,
            ...activationResult.data,
          },
        };

      } catch (error) {
        console.error('💥 PATH 1: Edge Function call failed:', error);
        return {
          success: false,
          action: 'immediate_link',
          message: 'Payment received but subscription activation failed. Please contact support.',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // PATH 2: New user → Direct account creation with payment activation
    console.log('✨ PATH 2: Direct account creation for new user');
    
    try {
      // Create user account directly with payment metadata
      const signupResult = await inviteUserWithPaymentData(linkingData);
      
      if (signupResult.success) {
        return {
          success: true,
          action: 'registration_invite',
          message: 'Account created successfully! Please set up your password to complete registration.',
          data: {
            userId: signupResult.userId,
            email: linkingData.email,
          },
        };
      } else {
        return {
          success: false,
          action: 'registration_invite',
          message: 'Failed to create user account',
          error: signupResult.error,
        };
      }
    } catch (error) {
      console.error('💥 Error in PATH 2 account creation:', error);
      return {
        success: false,
        action: 'registration_invite',
        message: 'Failed to process account creation',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

  } catch (error) {
    console.error('💥 Error in linkPaymentToAccount:', error);
    return {
      success: false,
      action: 'immediate_link',
      message: 'Account linking failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Invite user using Supabase's native invitation system via Edge Function
 */
const inviteUserWithPaymentData = async (
  linkingData: PaymentLinkingData
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  console.log('📧 Creating user signup with payment data for:', linkingData.email);

  try {
    // For new users, we'll use a simpler approach: direct signup with payment metadata
    // This creates the user immediately instead of using invitation emails
    
    // Generate a temporary password for the user - they'll set their own later
    const temporaryPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('🔐 Creating user account with temporary credentials');
    
    // Create the user account directly
    const { data: authResult, error: authError } = await supabase.auth.signUp({
      email: linkingData.email,
      password: temporaryPassword,
      options: {
        data: {
          // Include payment information in user metadata
          full_name: linkingData.customerData.name,
          payment_metadata: JSON.stringify({
            paymentData: linkingData.paymentData,
            planData: linkingData.planData,
            customerData: linkingData.customerData,
          }),
          subscription_tier: 'premium',
          invited_via: 'payment',
          plan_name: linkingData.planData.name,
          plan_amount: linkingData.planData.finalAmount,
          transaction_id: linkingData.paymentData.transactionId,
          needs_password_setup: true, // Flag that they need to set a real password
        },
      },
    });

    if (authError) {
      console.error('❌ Direct signup error:', authError);
      
      // Handle specific error cases
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return {
          success: false,
          error: 'Este email já possui uma conta. Tente fazer login.',
        };
      }
      
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authResult.user) {
      console.error('❌ No user created from signup');
      return {
        success: false,
        error: 'Failed to create user account',
      };
    }

    console.log('✅ User account created successfully:', authResult.user.id);
    
    // The database trigger will automatically create the Practitioners record
    // Now we need to activate the subscription
    console.log('⚡ Activating subscription for new user');
    
    const activationResult = await supabase.functions.invoke('activate-subscription-v2', {
      body: {
        userId: authResult.user.id,
        paymentData: linkingData.paymentData,
        planData: linkingData.planData,
      }
    });

    if (activationResult.error || !activationResult.data?.success) {
      console.error('⚠️ Subscription activation failed but user was created:', activationResult.error);
      // Don't fail the whole process - user was created successfully
    } else {
      console.log('✅ Subscription activated for new user');
    }
    
    return {
      success: true,
      userId: authResult.user.id,
    };

  } catch (error) {
    console.error('💥 Error in inviteUserWithPaymentData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Helper function to build login URL with payment token
 */
const buildLoginUrl = (token: string, baseUrl?: string): string => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/login?payment_token=${token}`;
};

/**
 * Helper function to build registration URL with payment token
 */
const buildRegistrationUrl = (token: string, baseUrl?: string): string => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/complete-registration?token=${token}`;
};

/**
 * Complete account linking from token (used in login/registration flows)
 */
export const completeAccountLinking = async (
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  console.log('🔗 Completing account linking with token for user:', userId);

  try {
    // Get token data and validate
    const { validateAccountLinkToken, markTokenAsUsed } = await import('@/services/tokenService');
    
    const tokenValidation = await validateAccountLinkToken(token);
    
    if (!tokenValidation.valid || !tokenValidation.data || !tokenValidation.linkId) {
      return {
        success: false,
        error: tokenValidation.error || 'Invalid token',
      };
    }

    // Link the payment data to the user
    const linkingData: PaymentLinkingData = {
      email: tokenValidation.data.email,
      paymentData: tokenValidation.data.paymentData,
      customerData: tokenValidation.data.customerData,
      planData: tokenValidation.data.planData,
    };

    const linkResult = await linkPaymentImmediately(userId, linkingData);
    
    if (linkResult.success) {
      // Mark token as used
      await markTokenAsUsed(tokenValidation.linkId);
      
      console.log('✅ Account linking completed successfully');
      return { success: true };
    } else {
      return linkResult;
    }

  } catch (error) {
    console.error('💥 Error in completeAccountLinking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};