// ABOUTME: Data access hooks for Visual Composition Engine persistence with Supabase

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StructuredContentV2, validateStructuredContent } from '@/types/editor';

export interface EditorPersistenceData {
  id: string;
  review_id: number;
  structured_content: StructuredContentV2;
  created_at: string;
  updated_at: string;
}

// ===== SAVE MUTATION =====

export const useEditorSaveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      structuredContent,
    }: {
      reviewId: string;
      structuredContent: StructuredContentV2;
    }) => {
      // Convert reviewId to number at database boundary
      const numericReviewId = parseInt(reviewId, 10);
      if (isNaN(numericReviewId)) {
        throw new Error(`Invalid reviewId: ${reviewId}`);
      }
      // Validate content before saving with detailed error handling
      let validatedContent;
      try {
        console.log('Attempting to validate content:', {
          reviewId,
          contentType: typeof structuredContent,
          contentKeys: Object.keys(structuredContent || {}),
          hasVersion: 'version' in (structuredContent || {}),
          hasNodes: 'nodes' in (structuredContent || {}),
          hasLayouts: 'layouts' in (structuredContent || {}),
          nodeCount: structuredContent?.nodes?.length || 0,
          layoutKeys: Object.keys(structuredContent?.layouts || {}),
          structuredContentSample: JSON.stringify(structuredContent).substring(0, 300) + '...',
        });

        validatedContent = validateStructuredContent(structuredContent);

        console.log('Content validation successful:', {
          reviewId,
          validatedNodeCount: validatedContent.nodes.length,
          validatedLayoutKeys: Object.keys(validatedContent.layouts),
        });
      } catch (validationError) {
        console.error('Content validation failed:', {
          reviewId,
          error:
            validationError instanceof Error ? validationError.message : String(validationError),
          fullError: validationError,
          contentKeys: Object.keys(structuredContent || {}),
          nodeCount: structuredContent?.nodes?.length || 0,
          layoutKeys: Object.keys(structuredContent?.layouts || {}),
        });
        throw new Error(
          `Content validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`
        );
      }

      // First, check if an editor record exists for this review
      const { data: existingData, error: fetchError } = await supabase
        .from('review_editor_content')
        .select('id')
        .eq('review_id', numericReviewId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - that's expected for new reviews
        throw new Error(`Failed to check existing editor content: ${fetchError.message}`);
      }

      let result;
      const now = new Date().toISOString();

      if (existingData) {
        // Update existing record with optimistic locking check
        const { data, error } = await supabase
          .from('review_editor_content')
          .update({
            structured_content: validatedContent,
            updated_at: now,
          })
          .eq('id', existingData.id)
          .select()
          .single();

        // Additional integrity check: verify the update actually happened
        const intendedStr = JSON.stringify(validatedContent);
        const actualStr = JSON.stringify(data.structured_content);

        if (data && actualStr !== intendedStr) {
          const intendedKeys = Object.keys(validatedContent);
          const actualKeys = Object.keys(data.structured_content || {});

          // Safely cast database Json to StructuredContentV2 for property access
          const actualContent = data.structured_content as StructuredContentV2 | null;

          // Detailed comparison to identify the mismatch source
          const detailedAnalysis = {
            reviewId: numericReviewId,
            intendedNodeCount: validatedContent.nodes?.length || 0,
            actualNodeCount: actualContent?.nodes?.length || 0,
            intendedLayoutCount: Object.keys(validatedContent.layouts || {}).length,
            actualLayoutCount: Object.keys(actualContent?.layouts || {}).length,
            intendedKeys,
            actualKeys,
            keysMismatch: intendedKeys.length !== actualKeys.length,
            stringLengthMismatch: intendedStr.length !== actualStr.length,
            timestamp: new Date().toISOString(),
            // Character-by-character comparison for small diffs
            ...(Math.abs(intendedStr.length - actualStr.length) < 100 && {
              charDiff: intendedStr.split('').findIndex((char, i) => char !== actualStr[i]),
              intendedSample: intendedStr.substring(0, 500),
              actualSample: actualStr.substring(0, 500),
            }),
            // Only log previews for larger diffs
            ...(Math.abs(intendedStr.length - actualStr.length) >= 100 && {
              intendedPreview: intendedStr.substring(0, 200) + '...',
              actualPreview: actualStr.substring(0, 200) + '...',
            }),
          };

          console.warn(
            'Database integrity warning: Saved content differs from intended content',
            detailedAnalysis
          );

          // If the difference is significant, this might indicate a real persistence issue
          if (Math.abs(intendedStr.length - actualStr.length) > 1000) {
            console.error(
              'CRITICAL: Major content mismatch detected during save operation',
              detailedAnalysis
            );
          }
        }

        if (error) {
          throw new Error(`Failed to update editor content: ${error.message}`);
        }
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('review_editor_content')
          .insert({
            review_id: numericReviewId,
            structured_content: validatedContent,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to save editor content: ${error.message}`);
        }
        result = data;
      }

      return result as EditorPersistenceData;
    },
    onSuccess: data => {
      // Invalidate and update the cache
      queryClient.invalidateQueries({
        queryKey: ['editor-content', data.review_id],
      });

      // Update the cache immediately with the new data
      queryClient.setQueryData(['editor-content', data.review_id], data);
    },
    onError: error => {
      console.error('Editor save failed:', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        reviewId: 'from-mutation-context',
      });
      // Error will be handled by the component using the mutation
    },
    retry: (failureCount, error) => {
      // Don't retry validation errors
      if (error.message.includes('Content validation failed')) {
        return false;
      }
      // Don't retry invalid reviewId errors
      if (error.message.includes('Invalid reviewId')) {
        return false;
      }
      // Retry network/database errors up to 3 times with exponential backoff
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
  });
};

// ===== LOAD QUERY =====

export const useEditorLoadQuery = (reviewId: string | null) => {
  return useQuery({
    queryKey: ['editor-content', reviewId],
    queryFn: async (): Promise<EditorPersistenceData | null> => {
      if (!reviewId) {
        return null;
      }

      // Convert reviewId to number at database boundary
      const numericReviewId = parseInt(reviewId, 10);
      if (isNaN(numericReviewId)) {
        throw new Error(`Invalid reviewId: ${reviewId}`);
      }

      const { data, error } = await supabase
        .from('review_editor_content')
        .select('*')
        .eq('review_id', numericReviewId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No editor content exists yet - this is fine for new reviews
          return null;
        }
        throw new Error(`Failed to load editor content: ${error.message}`);
      }

      // Validate the loaded content
      try {
        const validatedContent = validateStructuredContent(data.structured_content);
        return {
          ...data,
          structured_content: validatedContent,
        } as EditorPersistenceData;
      } catch (validationError) {
        console.error('Loaded editor content failed validation:', validationError);
        throw new Error(`Invalid editor content format: ${validationError}`);
      }
    },
    enabled: !!reviewId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error.message.includes('Invalid editor content format')) {
        return false;
      }
      // Don't retry on "no content found" errors
      if (error.message.includes('PGRST116')) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
};

// ===== AUTO-SAVE HOOK =====

export const useEditorAutoSave = (
  reviewId: string | null,
  structuredContent: StructuredContentV2 | null,
  isDirty: boolean,
  debounceMs: number = 30000 // 30 seconds default
) => {
  const saveMutation = useEditorSaveMutation();

  // Auto-save effect
  React.useEffect(() => {
    if (!reviewId || !structuredContent || !isDirty) {
      return;
    }

    const timeoutId = setTimeout(() => {
      saveMutation.mutate({ reviewId, structuredContent });
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [reviewId, structuredContent, isDirty, debounceMs, saveMutation]);

  return {
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    lastSaveResult: saveMutation.data,
    forceSave: () => {
      if (reviewId && structuredContent) {
        saveMutation.mutate({ reviewId, structuredContent });
      }
    },
  };
};

// ===== MANUAL SAVE HOOK =====

export const useEditorManualSave = () => {
  const saveMutation = useEditorSaveMutation();

  return {
    saveToDatabase: async (reviewId: string, structuredContent: StructuredContentV2) => {
      return saveMutation.mutateAsync({ reviewId, structuredContent });
    },
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    lastSaveResult: saveMutation.data,
  };
};
