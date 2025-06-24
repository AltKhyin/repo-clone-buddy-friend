
// ABOUTME: Focused TanStack Query hook for fetching user profile data for shell components.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';
import type { UserProfile } from '@/types';

// Focused function to fetch the complete profile data matching UserProfile type
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('Practitioners')
    .select('*') // Select all columns to match UserProfile type completely
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error.message);
    throw new Error(error.message);
  }
  
  return data;
};

/**
 * Custom hook for fetching user profile data in shell components.
 * This hook is self-contained and independent of any page-level data providers.
 * It follows the new decoupled architecture pattern where shell components
 * manage their own data fetching and loading states.
 */
export const useUserProfileQuery = () => {
  // Get userId from global auth store
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    // Unique query key with userId for proper cache invalidation
    queryKey: ['user-profile', userId],
    
    // Query function that only executes when userId is available
    queryFn: () => {
      if (!userId) {
        return Promise.resolve(null);
      }
      return fetchUserProfile(userId);
    },
    
    // Only run query when userId is available
    enabled: !!userId,
    
    // Keep data fresh for 15 minutes since profile data changes infrequently
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};
