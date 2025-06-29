// ABOUTME: Data access hooks for Visual Composition Engine persistence with Supabase

import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { StructuredContentV2, validateStructuredContent } from '@/types/editor'

export interface EditorPersistenceData {
  id: string
  review_id: string
  structured_content: StructuredContentV2
  created_at: string
  updated_at: string
}

// ===== SAVE MUTATION =====

export const useEditorSaveMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      reviewId, 
      structuredContent 
    }: { 
      reviewId: string
      structuredContent: StructuredContentV2 
    }) => {
      // Validate content before saving
      const validatedContent = validateStructuredContent(structuredContent)
      
      // First, check if an editor record exists for this review
      const { data: existingData, error: fetchError } = await supabase
        .from('review_editor_content')
        .select('id')
        .eq('review_id', reviewId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - that's expected for new reviews
        throw new Error(`Failed to check existing editor content: ${fetchError.message}`)
      }

      let result
      const now = new Date().toISOString()

      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('review_editor_content')
          .update({
            structured_content: validatedContent,
            updated_at: now
          })
          .eq('id', existingData.id)
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to update editor content: ${error.message}`)
        }
        result = data
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('review_editor_content')
          .insert({
            review_id: reviewId,
            structured_content: validatedContent,
            created_at: now,
            updated_at: now
          })
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to save editor content: ${error.message}`)
        }
        result = data
      }

      return result as EditorPersistenceData
    },
    onSuccess: (data) => {
      // Invalidate and update the cache
      queryClient.invalidateQueries({ 
        queryKey: ['editor-content', data.review_id] 
      })
      
      // Update the cache immediately with the new data
      queryClient.setQueryData(
        ['editor-content', data.review_id], 
        data
      )
    },
    onError: (error) => {
      console.error('Editor save failed:', error)
      // Error will be handled by the component using the mutation
    }
  })
}

// ===== LOAD QUERY =====

export const useEditorLoadQuery = (reviewId: string | null) => {
  return useQuery({
    queryKey: ['editor-content', reviewId],
    queryFn: async (): Promise<EditorPersistenceData | null> => {
      if (!reviewId) {
        return null
      }

      const { data, error } = await supabase
        .from('review_editor_content')
        .select('*')
        .eq('review_id', reviewId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No editor content exists yet - this is fine for new reviews
          return null
        }
        throw new Error(`Failed to load editor content: ${error.message}`)
      }

      // Validate the loaded content
      try {
        const validatedContent = validateStructuredContent(data.structured_content)
        return {
          ...data,
          structured_content: validatedContent
        } as EditorPersistenceData
      } catch (validationError) {
        console.error('Loaded editor content failed validation:', validationError)
        throw new Error(`Invalid editor content format: ${validationError}`)
      }
    },
    enabled: !!reviewId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error.message.includes('Invalid editor content format')) {
        return false
      }
      // Don't retry on "no content found" errors
      if (error.message.includes('PGRST116')) {
        return false
      }
      // Retry other errors up to 2 times
      return failureCount < 2
    }
  })
}

// ===== AUTO-SAVE HOOK =====

export const useEditorAutoSave = (
  reviewId: string | null,
  structuredContent: StructuredContentV2 | null,
  isDirty: boolean,
  debounceMs: number = 30000 // 30 seconds default
) => {
  const saveMutation = useEditorSaveMutation()

  // Auto-save effect
  React.useEffect(() => {
    if (!reviewId || !structuredContent || !isDirty) {
      return
    }

    const timeoutId = setTimeout(() => {
      saveMutation.mutate({ reviewId, structuredContent })
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [reviewId, structuredContent, isDirty, debounceMs, saveMutation])

  return {
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    lastSaveResult: saveMutation.data,
    forceSave: () => {
      if (reviewId && structuredContent) {
        saveMutation.mutate({ reviewId, structuredContent })
      }
    }
  }
}

// ===== MANUAL SAVE HOOK =====

export const useEditorManualSave = () => {
  const saveMutation = useEditorSaveMutation()

  return {
    saveToDatabase: async (reviewId: string, structuredContent: StructuredContentV2) => {
      return saveMutation.mutateAsync({ reviewId, structuredContent })
    },
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    lastSaveResult: saveMutation.data
  }
}