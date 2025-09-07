
// ABOUTME: Simplified tag management hook using direct Supabase operations with RLS policies

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TagWithStats {
  id: number;
  tag_name: string;
  parent_id: number | null;
  created_at: string;
  usage_count: number; // Keep only essential usage info
  color?: string;
  description?: string;
}

// Analytics interface removed - no longer needed

export interface TagOperationPayload {
  action: 'create' | 'update' | 'delete' | 'merge'; // Removed 'move' and 'cleanup' - not needed
  tagId?: number;
  parentId?: number | null;
  name?: string;
  description?: string;
  color?: string;
  mergeTargetId?: number;
  forceDelete?: boolean; // Allow force deletion
}

// Fetch tags with usage statistics using direct Supabase operations
const fetchTagsWithHierarchy = async (): Promise<TagWithStats[]> => {
  // Fetch all tags
  const { data: tags, error: tagsError } = await supabase
    .from('Tags')
    .select('id, tag_name, parent_id, created_at, color, description')
    .order('tag_name');

  if (tagsError) {
    throw new Error(`Failed to fetch tags: ${tagsError.message}`);
  }

  // Get usage statistics for each tag
  const tagsWithStats = await Promise.all((tags || []).map(async (tag) => {
    const { count: usageCount } = await supabase
      .from('ReviewTags')
      .select('*', { count: 'exact' })
      .eq('tag_id', tag.id);

    return {
      ...tag,
      usage_count: usageCount || 0
    };
  }));

  return tagsWithStats;
};

// Analytics function removed - no longer needed

// Execute tag operations using direct Supabase operations
const executeTagOperation = async (payload: TagOperationPayload): Promise<any> => {
  const { action, tagId, parentId, name, description, color, mergeTargetId, forceDelete } = payload;

  switch (action) {
    case 'create': {
      if (!name) {
        throw new Error('VALIDATION_FAILED: Tag name is required');
      }

      const { data, error } = await supabase
        .from('Tags')
        .insert({
          tag_name: name.trim(),
          parent_id: parentId,
          description: description?.trim(),
          color: color
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('VALIDATION_FAILED: A tag with this name already exists');
        }
        throw new Error(`Failed to create tag: ${error.message}`);
      }

      return { message: 'Tag created successfully', tag: data };
    }

    case 'update': {
      if (!tagId) {
        throw new Error('VALIDATION_FAILED: Tag ID is required');
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.tag_name = name.trim();
      if (parentId !== undefined) updateData.parent_id = parentId;
      if (description !== undefined) updateData.description = description?.trim();
      if (color !== undefined) updateData.color = color;

      if (Object.keys(updateData).length === 0) {
        throw new Error('VALIDATION_FAILED: At least one field must be provided for update');
      }

      const { data, error } = await supabase
        .from('Tags')
        .update(updateData)
        .eq('id', tagId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update tag: ${error.message}`);
      }

      return { message: 'Tag updated successfully', tag: data };
    }

    case 'delete': {
      if (!tagId) {
        throw new Error('VALIDATION_FAILED: Tag ID is required');
      }

      // Check for force delete option
      const shouldForceDelete = forceDelete || false;

      if (!shouldForceDelete) {
        // Standard validation for regular deletes
        const { data: children } = await supabase
          .from('Tags')
          .select('id')
          .eq('parent_id', tagId);

        if (children && children.length > 0) {
          throw new Error('VALIDATION_FAILED: Cannot delete tag with child tags');
        }

        const { data: reviews } = await supabase
          .from('ReviewTags')
          .select('id')
          .eq('tag_id', tagId);

        if (reviews && reviews.length > 0) {
          throw new Error('VALIDATION_FAILED: Cannot delete tag that is used in reviews');
        }
      } else {
        // Force delete logic - remove from reviews first
        const { error: removeFromReviewsError } = await supabase
          .from('ReviewTags')
          .delete()
          .eq('tag_id', tagId);

        if (removeFromReviewsError) {
          console.warn('Warning: Could not remove tag from some reviews:', removeFromReviewsError);
        }
      }

      // Delete the tag itself
      const { error: deleteError } = await supabase
        .from('Tags')
        .delete()
        .eq('id', tagId);

      if (deleteError) {
        throw new Error(`Failed to delete tag: ${deleteError.message}`);
      }

      return { 
        message: shouldForceDelete ? 'Tag force deleted and removed from all reviews' : 'Tag deleted successfully', 
        tagId,
        removedFromReviews: shouldForceDelete 
      };
    }

    case 'merge': {
      if (!tagId || !mergeTargetId) {
        throw new Error('VALIDATION_FAILED: Both source and target tag IDs are required for merge');
      }

      // Update all ReviewTags to use the target tag
      const { error: mergeError } = await supabase
        .from('ReviewTags')
        .update({ tag_id: mergeTargetId })
        .eq('tag_id', tagId);

      if (mergeError) {
        throw new Error(`Failed to merge tags: ${mergeError.message}`);
      }

      // Delete the source tag
      const { error: deleteError } = await supabase
        .from('Tags')
        .delete()
        .eq('id', tagId);

      if (deleteError) {
        throw new Error(`Failed to delete source tag: ${deleteError.message}`);
      }

      return {
        message: 'Tags merged successfully',
        sourceTagId: tagId,
        targetTagId: mergeTargetId
      };
    }

    // Cleanup case removed - not needed for core operations

    default:
      throw new Error(`VALIDATION_FAILED: Invalid action: ${action}`);
  }
};

// Main hook for tag management
export const useTagManagementQuery = () => {
  return useQuery({
    queryKey: ['admin', 'tags', 'management'],
    queryFn: fetchTagsWithHierarchy,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Analytics hook removed - no longer needed

// Parse edge function error messages for user-friendly feedback
const parseTagOperationError = (error: any): { type: string; message: string; action?: string } => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Check for specific validation errors from the edge function
  if (errorMessage.includes('Cannot delete tag that is used in reviews')) {
    return {
      type: 'used_in_reviews',
      message: 'Esta tag não pode ser deletada porque está sendo usada em reviews publicados.',
      action: 'Remova a tag dos reviews primeiro ou considere fazer merge com outra tag.'
    };
  }
  
  if (errorMessage.includes('Cannot delete tag with child tags')) {
    return {
      type: 'has_children',
      message: 'Esta tag não pode ser deletada porque possui sub-tags.',
      action: 'Delete primeiro as sub-tags ou mova-as para outra categoria.'
    };
  }
  
  if (errorMessage.includes('VALIDATION_FAILED: Tag name is required')) {
    return {
      type: 'missing_name',
      message: 'Nome da tag é obrigatório.',
      action: 'Digite um nome válido para a tag.'
    };
  }
  
  if (errorMessage.includes('A tag with this name already exists')) {
    return {
      type: 'duplicate_name',
      message: 'Já existe uma tag com este nome.',
      action: 'Escolha um nome diferente ou faça merge com a tag existente.'
    };
  }
  
  if (errorMessage.includes('FORBIDDEN: Admin privileges required')) {
    return {
      type: 'permission_denied',
      message: 'Você não tem permissão para realizar esta operação.',
      action: 'Verifique se você está logado como administrador.'
    };
  }
  
  // Generic error fallback
  return {
    type: 'generic',
    message: 'Erro inesperado na operação com tags.',
    action: 'Tente novamente ou contate o suporte se o problema persistir.'
  };
};

// Hook for tag operations with enhanced error handling
export const useTagOperationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeTagOperation,
    onSuccess: () => {
      // Invalidate all tag-related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] }); // General tag queries
    },
    onError: (error) => {
      console.error('Tag operation failed:', error);
      // Enhanced error is now handled by the component
    },
  });
};

// Export the error parser for use in components
export { parseTagOperationError };
