// ABOUTME: React hook for account linking operations during payment-to-account flows

import { useState } from 'react';
import { 
  linkPaymentToAccount, 
  completeAccountLinking, 
  type AccountLinkingResult 
} from '@/services/accountLinkingService';
import { 
  validateAccountLinkToken,
  markTokenAsUsed,
  type TokenValidationResult 
} from '@/services/tokenService';
import { toast } from 'sonner';

/**
 * Hook for managing account linking operations
 */
export const useAccountLinking = () => {
  const [isLinking, setIsLinking] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Link payment to account with three-path logic
   */
  const linkPayment = async (linkingData: any): Promise<AccountLinkingResult | null> => {
    setIsLinking(true);
    setError(null);

    try {
      const result = await linkPaymentToAccount(linkingData);
      
      if (!result.success) {
        setError(result.error || 'Account linking failed');
        toast.error(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Account linking failed';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ useAccountLinking linkPayment error:', err);
      return null;
    } finally {
      setIsLinking(false);
    }
  };

  /**
   * Complete account linking from token (used in login/registration flows)
   */
  const completeAccountLink = async (token: string, userId: string): Promise<boolean> => {
    setIsLinking(true);
    setError(null);

    try {
      const result = await completeAccountLinking(token, userId);
      
      if (result.success) {
        toast.success('Account linked successfully!');
        return true;
      } else {
        setError(result.error || 'Account linking completion failed');
        toast.error(result.error || 'Account linking completion failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Account linking completion failed';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ useAccountLinking completeAccountLink error:', err);
      return false;
    } finally {
      setIsLinking(false);
    }
  };

  /**
   * Validate account link token
   */
  const validateToken = async (token: string): Promise<TokenValidationResult | null> => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await validateAccountLinkToken(token);
      
      if (!result.valid) {
        setError(result.error || 'Invalid token');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token validation failed';
      setError(errorMessage);
      console.error('❌ useAccountLinking validateToken error:', err);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Mark token as used
   */
  const useToken = async (linkId: string): Promise<boolean> => {
    try {
      const result = await markTokenAsUsed(linkId);
      
      if (!result) {
        console.warn('⚠️ Failed to mark token as used');
        // Don't throw error, this is not critical
      }

      return result;
    } catch (err) {
      console.error('❌ useAccountLinking useToken error:', err);
      // Don't throw error, this is not critical for the user experience
      return false;
    }
  };

  return {
    // Actions
    linkPayment,
    completeAccountLink,
    validateToken,
    useToken,
    
    // States
    isLinking,
    isValidating,
    error,
    
    // Helpers
    clearError: () => setError(null),
  };
};