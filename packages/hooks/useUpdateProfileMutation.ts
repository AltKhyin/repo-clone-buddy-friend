// ABOUTME: TanStack Query mutation hook for updating user profile information

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';
import type { ProfileUpdateData } from '@/types';

const updateProfile = async (
  data: ProfileUpdateData,
  userId: string | undefined
): Promise<{ success: boolean; message: string }> => {
  if (!userId) {
    throw new Error('User must be authenticated to update profile');
  }

  // Build update data with all supported fields
  const updateData: any = {};
  
  // Include all profile fields that are now available after migration
  if (data.full_name !== undefined) {
    updateData.full_name = data.full_name;
  }
  if (data.profession !== undefined) {
    updateData.profession = data.profession;
  }
  if (data.avatar_url !== undefined) {
    updateData.avatar_url = data.avatar_url;
  }
  if (data.linkedin_url !== undefined) {
    updateData.linkedin_url = data.linkedin_url;
  }
  if (data.youtube_url !== undefined) {
    updateData.youtube_url = data.youtube_url;
  }
  if (data.instagram_url !== undefined) {
    updateData.instagram_url = data.instagram_url;
  }
  if (data.facebook_url !== undefined) {
    updateData.facebook_url = data.facebook_url;
  }
  if (data.twitter_url !== undefined) {
    updateData.twitter_url = data.twitter_url;
  }
  if (data.website_url !== undefined) {
    updateData.website_url = data.website_url;
  }

  const { error } = await supabase
    .from('Practitioners')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    // If it's a column doesn't exist error, provide a helpful message
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      throw new Error('Database migration required. Some profile features are not yet available.');
    }
    throw new Error(error.message || 'Failed to update profile');
  }

  return {
    success: true,
    message: 'Profile updated successfully'
  };
};

/**
 * Mutation hook for updating user profile information.
 * Automatically invalidates user profile queries on success.
 */
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (data: ProfileUpdateData) => updateProfile(data, userId),
    onSuccess: () => {
      // Invalidate user profile queries to reflect updates
      queryClient.invalidateQueries({ 
        queryKey: ['user-profile', userId] 
      });
      
      // Also invalidate consolidated homepage data if it includes user profile
      queryClient.invalidateQueries({ 
        queryKey: ['consolidated-homepage-feed'] 
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
    },
  });
};