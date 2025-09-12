// ABOUTME: React hook for user lookup functionality in payment-to-account linking flow

import { useState } from 'react';
import { findUserByEmail, checkUserExists, type UserLookupResult } from '@/services/userLookup';

/**
 * Hook for looking up users by email during payment process
 */
export const useUserLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Look up user by email with full details
   */
  const lookupUser = async (email: string): Promise<UserLookupResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await findUserByEmail(email);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup user';
      setError(errorMessage);
      console.error('❌ useUserLookup error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Quick check if user exists (simplified for payment flow)
   */
  const quickCheck = async (email: string): Promise<{ exists: boolean; isLoggedIn: boolean } | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await checkUserExists(email);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check user';
      setError(errorMessage);
      console.error('❌ useUserLookup quickCheck error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    lookupUser,
    quickCheck,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};