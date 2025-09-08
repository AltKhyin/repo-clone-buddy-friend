// ABOUTME: Authentication service for payment flow user state detection and account management
import { supabase } from '@/integrations/supabase/client';

// =================================================================
// Types
// =================================================================

export type AuthStatus = 'logged_in' | 'account_exists' | 'no_account';

export interface AuthStatusResult {
  status: AuthStatus;
  userId?: string;
  email?: string;
}

export interface AccountExistenceResult {
  exists: boolean;
  userId?: string;
  error?: string;
}

// =================================================================
// Cache Management
// =================================================================

interface CacheEntry {
  result: AccountExistenceResult;
  timestamp: number;
}

const emailCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedResult = (email: string): AccountExistenceResult | null => {
  const entry = emailCache.get(email.toLowerCase());
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    emailCache.delete(email.toLowerCase());
    return null;
  }
  
  return entry.result;
};

const setCachedResult = (email: string, result: AccountExistenceResult): void => {
  emailCache.set(email.toLowerCase(), {
    result,
    timestamp: Date.now(),
  });
};

// =================================================================
// Core Authentication Functions
// =================================================================

/**
 * Check if an email address has an existing account in the system
 * Uses the `users` table to verify account existence
 */
export const checkEmailAccountExists = async (email: string): Promise<AccountExistenceResult> => {
  try {
    // Check cache first
    const cachedResult = getCachedResult(email);
    if (cachedResult) {
      console.log('Using cached result for email:', email);
      return cachedResult;
    }

    console.log('Checking account existence for email:', email);
    
    // Query the users table to check if account exists
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle(); // Use maybeSingle to handle no results gracefully

    if (error) {
      console.error('Error checking account existence:', error);
      const result = { exists: false, error: error.message };
      setCachedResult(email, result);
      return result;
    }

    const result = {
      exists: !!data,
      userId: data?.id,
    };

    console.log('Account existence check result:', { email, exists: result.exists });
    setCachedResult(email, result);
    return result;

  } catch (error) {
    console.error('Unexpected error checking account existence:', error);
    const result = { exists: false, error: 'Unexpected error occurred' };
    setCachedResult(email, result);
    return result;
  }
};

/**
 * Determine the complete authentication status for a user
 * Returns current login status and account existence information
 */
export const getUserAuthenticationStatus = async (email?: string): Promise<AuthStatusResult> => {
  try {
    // First check if user is currently logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error getting current user:', authError);
    }

    // If user is logged in
    if (user?.id) {
      console.log('User is currently logged in:', user.id);
      return {
        status: 'logged_in',
        userId: user.id,
        email: user.email,
      };
    }

    // If no email provided and user not logged in
    if (!email) {
      return {
        status: 'no_account',
      };
    }

    // Check if the provided email has an existing account
    const accountCheck = await checkEmailAccountExists(email);
    
    if (accountCheck.error) {
      // If there's an error checking, assume no account for safety
      return {
        status: 'no_account',
        email,
      };
    }

    if (accountCheck.exists) {
      return {
        status: 'account_exists',
        userId: accountCheck.userId,
        email: email.toLowerCase(),
      };
    }

    return {
      status: 'no_account',
      email: email.toLowerCase(),
    };

  } catch (error) {
    console.error('Unexpected error getting authentication status:', error);
    return {
      status: 'no_account',
      email: email?.toLowerCase(),
    };
  }
};

/**
 * Authenticate user with email and password
 * Used for existing accounts in payment flow
 */
export const authenticateUser = async (email: string, password: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> => {
  try {
    console.log('Attempting to authenticate user:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No user returned from authentication',
      };
    }

    console.log('User authenticated successfully:', data.user.id);
    
    // Clear cache for this email since authentication status changed
    emailCache.delete(email.toLowerCase());
    
    return {
      success: true,
      user: data.user,
    };

  } catch (error) {
    console.error('Unexpected error during authentication:', error);
    return {
      success: false,
      error: 'Unexpected authentication error',
    };
  }
};

/**
 * Create new user account with email and password
 * Used for new accounts in payment flow
 */
export const createUserAccount = async (email: string, password: string, metadata?: {
  customerName?: string;
  customerPhone?: string;
}): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> => {
  try {
    console.log('Attempting to create account for:', email);
    
    const signUpData: any = {
      email: email.toLowerCase(),
      password,
    };

    // Add user metadata if provided
    if (metadata?.customerName || metadata?.customerPhone) {
      signUpData.options = {
        data: {
          name: metadata.customerName,
          phone: metadata.customerPhone,
        },
      };
    }

    const { data, error } = await supabase.auth.signUp(signUpData);

    if (error) {
      console.error('Account creation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No user returned from account creation',
      };
    }

    console.log('Account created successfully:', data.user.id);
    
    // Clear cache for this email since account now exists
    emailCache.delete(email.toLowerCase());
    
    return {
      success: true,
      user: data.user,
    };

  } catch (error) {
    console.error('Unexpected error during account creation:', error);
    return {
      success: false,
      error: 'Unexpected account creation error',
    };
  }
};

/**
 * Clear authentication cache (useful for testing)
 */
export const clearAuthenticationCache = (): void => {
  emailCache.clear();
  console.log('Authentication cache cleared');
};