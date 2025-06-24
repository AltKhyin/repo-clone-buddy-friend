
// ABOUTME: TanStack Query mutation hook for performing moderation actions on community posts - improved type safety.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { toast } from 'sonner';
import type { PostActionParams, ModerationAction } from '../../src/types/community';
import type { ApiResponse } from '../../src/types/api';

const executePostAction = async ({ postId, action }: PostActionParams): Promise<ApiResponse> => {
  console.log('Executing post action:', { postId, action });
  
  const { data, error } = await supabase.functions.invoke('moderate-community-post', {
    body: { 
      post_id: postId, 
      action_type: action 
    }
  });

  if (error) {
    console.error('Post action error:', error);
    throw new Error(error.message || 'Failed to execute post action');
  }

  if (data?.error) {
    console.error('Post action API error:', data.error);
    throw new Error(data.error.message || 'Failed to execute post action');
  }

  console.log('Post action executed successfully');
  return data as ApiResponse;
};

export const usePostActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executePostAction,
    onSuccess: (data, variables) => {
      // Invalidate community feed to show updated post status
      queryClient.invalidateQueries({ queryKey: ['community-page-data'] });
      
      // Show success toast with proper typing
      const actionLabels: Record<ModerationAction, string> = {
        pin: 'fixado',
        unpin: 'desfixado',
        lock: 'bloqueado',
        unlock: 'desbloqueado',
        hide: 'ocultado',
        delete: 'excluído'
      };
      
      toast.success(`Post ${actionLabels[variables.action]} com sucesso`);
    },
    onError: (error: Error) => {
      console.error('Post action mutation error:', error);
      toast.error(error.message || 'Erro ao executar ação');
    },
  });
};
