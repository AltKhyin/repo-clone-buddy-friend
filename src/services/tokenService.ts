// ABOUTME: Secure token generation and validation service for payment-to-account linking

import { supabase } from '@/integrations/supabase/client';
import type { PaymentPlanV2Row } from '@/types/paymentV2.types';

/**
 * Token data for account linking
 */
export interface TokenData {
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
 * Token creation result
 */
export interface TokenCreationResult {
  success: boolean;
  token?: string;
  linkId?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  data?: TokenData;
  linkId?: string;
  error?: string;
}

/**
 * Generate cryptographically secure token
 */
const generateSecureToken = (): string => {
  // Create a secure random token (32 bytes = 256 bits)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Create a secure token for account linking
 * @param tokenData - Data to associate with the token
 * @param linkType - Type of link ('registration' or 'login')
 * @param expirationHours - Hours until token expires (default: 72)
 */
export const createAccountLinkToken = async (
  tokenData: TokenData,
  linkType: 'registration' | 'login',
  expirationHours: number = 72
): Promise<TokenCreationResult> => {
  console.log('🔐 Creating account link token for:', tokenData.email, 'type:', linkType);
  
  try {
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);
    
    const { data, error } = await supabase
      .from('pending_account_links')
      .insert({
        email: tokenData.email.toLowerCase().trim(),
        token,
        payment_data: tokenData.paymentData,
        customer_data: tokenData.customerData,
        plan_data: tokenData.planData,
        link_type: linkType,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Error creating account link token:', error);
      return {
        success: false,
        error: 'Failed to create secure token',
      };
    }
    
    console.log('✅ Token created successfully:', { linkId: data.id, expiresAt: expiresAt.toISOString() });
    
    return {
      success: true,
      token,
      linkId: data.id,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('💥 Error in createAccountLinkToken:', error);
    return {
      success: false,
      error: 'Failed to generate token',
    };
  }
};

/**
 * Validate and retrieve token data
 * @param token - Token to validate
 */
export const validateAccountLinkToken = async (token: string): Promise<TokenValidationResult> => {
  console.log('🔍 Validating account link token');
  
  try {
    const { data, error } = await supabase
      .from('pending_account_links')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error || !data) {
      console.log('❌ Token not found or invalid');
      return {
        valid: false,
        error: 'Invalid token',
      };
    }
    
    // Check if token is already used
    if (data.is_used) {
      console.log('❌ Token already used');
      return {
        valid: false,
        used: true,
        error: 'Token has already been used',
      };
    }
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    if (now > expiresAt) {
      console.log('❌ Token expired');
      return {
        valid: false,
        expired: true,
        error: 'Token has expired',
      };
    }
    
    console.log('✅ Token is valid');
    
    return {
      valid: true,
      data: {
        email: data.email,
        paymentData: data.payment_data,
        customerData: data.customer_data,
        planData: data.plan_data,
      },
      linkId: data.id,
    };
  } catch (error) {
    console.error('💥 Error in validateAccountLinkToken:', error);
    return {
      valid: false,
      error: 'Failed to validate token',
    };
  }
};

/**
 * Mark token as used
 * @param linkId - ID of the pending account link
 */
export const markTokenAsUsed = async (linkId: string): Promise<boolean> => {
  console.log('✅ Marking token as used:', linkId);
  
  try {
    const { error } = await supabase
      .from('pending_account_links')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', linkId);
    
    if (error) {
      console.error('❌ Error marking token as used:', error);
      return false;
    }
    
    console.log('✅ Token marked as used successfully');
    return true;
  } catch (error) {
    console.error('💥 Error in markTokenAsUsed:', error);
    return false;
  }
};

/**
 * Clean up expired tokens (should be called periodically)
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  console.log('🧹 Cleaning up expired tokens');
  
  try {
    const { error } = await supabase
      .from('pending_account_links')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      console.error('❌ Error cleaning up expired tokens:', error);
    } else {
      console.log('✅ Expired tokens cleaned up');
    }
  } catch (error) {
    console.error('💥 Error in cleanupExpiredTokens:', error);
  }
};

/**
 * Helper function to build registration URL
 */
export const buildRegistrationUrl = (token: string, baseUrl?: string): string => {
  const base = baseUrl || window.location.origin;
  return `${base}/complete-registration?token=${token}`;
};

/**
 * Helper function to build login URL  
 */
export const buildLoginUrl = (token: string, baseUrl?: string): string => {
  const base = baseUrl || window.location.origin;
  return `${base}/login?payment_token=${token}`;
};