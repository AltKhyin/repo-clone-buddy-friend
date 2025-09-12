// ABOUTME: V2 User lookup service - simplified for frontend security constraints

import { supabase } from '@/integrations/supabase/client';

/**
 * Result of user lookup by email
 */
export interface UserLookupResult {
  exists: boolean;
  userId?: string;
  isLoggedIn: boolean;
  practitionerData?: {
    id: string;
    email: string;
    full_name: string;
    subscription_tier: string;
    subscription_ends_at: string | null;
  };
}

/**
 * Normalize email for consistent lookups
 */
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * V2 Enhanced user lookup using Edge Function with admin access
 * Can properly identify existing users even when they're not currently logged in
 * @param email - User email to lookup
 * @returns Promise<UserLookupResult>
 */
export const findUserByEmail = async (email: string): Promise<UserLookupResult> => {
  console.log('🔍 V2: Looking up user by email using Edge Function:', email);
  
  const normalizedEmail = normalizeEmail(email);
  
  try {
    // Call the new user-lookup-v2 Edge Function with admin access
    const { data, error } = await supabase.functions.invoke('user-lookup-v2', {
      body: { email: normalizedEmail }
    });

    if (error) {
      console.error('❌ Error calling user lookup Edge Function:', error);
      // Fallback to frontend-only lookup if Edge Function fails
      return await fallbackFrontendLookup(normalizedEmail);
    }

    console.log('✅ V2: User lookup Edge Function result:', data);
    return data as UserLookupResult;
    
  } catch (error) {
    console.error('💥 Error in findUserByEmail Edge Function:', error);
    // Fallback to frontend-only lookup
    return await fallbackFrontendLookup(normalizedEmail);
  }
};

/**
 * Fallback frontend-only lookup (original V2 logic)
 * Used when Edge Function fails
 */
const fallbackFrontendLookup = async (normalizedEmail: string): Promise<UserLookupResult> => {
  console.log('🔄 V2: Falling back to frontend-only lookup');
  
  try {
    // Check if user is currently logged in
    const { data: authUser } = await supabase.auth.getUser();
    const isCurrentUserEmail = authUser.user?.email === normalizedEmail;
    
    if (isCurrentUserEmail && authUser.user) {
      // User is logged in and email matches - get their practitioner data
      const { data: practitioner, error: practitionerError } = await supabase
        .from('Practitioners')
        .select('id, full_name, subscription_tier, subscription_ends_at')
        .eq('id', authUser.user.id)
        .single();
      
      if (practitionerError) {
        console.error('❌ Error fetching practitioner data:', practitionerError);
        // User exists in auth but not in Practitioners table
        return {
          exists: true,
          userId: authUser.user.id,
          isLoggedIn: true,
        };
      }
      
      return {
        exists: true,
        userId: authUser.user.id,
        isLoggedIn: true,
        practitionerData: {
          id: practitioner.id,
          email: normalizedEmail,
          full_name: practitioner.full_name || '',
          subscription_tier: practitioner.subscription_tier,
          subscription_ends_at: practitioner.subscription_ends_at,
        },
      };
    }
    
    // V2: Since we can't query other users from frontend, we assume user doesn't exist
    // This will trigger the registration invite flow, which is the safest approach
    console.log('👤 V2: User lookup - email does not match current user, assuming new user');
    return {
      exists: false,
      isLoggedIn: false,
    };
    
  } catch (error) {
    console.error('💥 Error in fallback lookup:', error);
    return {
      exists: false,
      isLoggedIn: false,
    };
  }
};

/**
 * Simplified user lookup for payment processing
 * Returns basic existence and login status only
 */
export const checkUserExists = async (email: string): Promise<{ exists: boolean; isLoggedIn: boolean }> => {
  const result = await findUserByEmail(email);
  return {
    exists: result.exists,
    isLoggedIn: result.isLoggedIn,
  };
};