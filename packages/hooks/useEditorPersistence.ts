// ABOUTME: Data access hooks for Visual Composition Engine persistence with Supabase

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StructuredContent, validateStructuredContent } from '@/types/editor';

export interface EditorPersistenceData {
  id: string;
  review_id: number;
  structured_content: StructuredContent;
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
      structuredContent: StructuredContent;
    }) => {
      // Convert reviewId to number at database boundary
      const numericReviewId = parseInt(reviewId, 10);
      if (isNaN(numericReviewId)) {
        throw new Error(`Invalid reviewId: ${reviewId}`);
      }
      // 🎯 PHASE 2A: Enhanced logging to trace positioning data through save pipeline
      let validatedContent;
      try {
        // 📊 POSITIONING DATA AUDIT: Log positioning data before validation
        const originalPositions = (structuredContent as any)?.positions || {};
        const originalMobilePositions = (structuredContent as any)?.mobilePositions || {};
        const positionsCount = Object.keys(originalPositions).length;
        const mobilePositionsCount = Object.keys(originalMobilePositions).length;

        console.log('[PERSISTENCE AUDIT] 💾 SAVE PIPELINE - Attempting to validate content:', {
          reviewId,
          contentType: typeof structuredContent,
          contentKeys: Object.keys(structuredContent || {}),
          hasVersion: 'version' in (structuredContent || {}),
          hasNodes: 'nodes' in (structuredContent || {}),
          hasLayouts: 'layouts' in (structuredContent || {}),
          hasPositions: 'positions' in (structuredContent || {}),
          nodeCount: structuredContent?.nodes?.length || 0,
          version: structuredContent?.version || 'unknown',
          
          // 🎯 POSITIONING DATA TRACKING
          positionsCount,
          mobilePositionsCount,
          samplePositions: positionsCount > 0 ? Object.entries(originalPositions).slice(0, 2).map(([id, pos]: [string, any]) => ({
            id,
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
          })) : [],

          // 🔍 RICHBLOCK CONTENT STRUCTURE AUDIT
          richBlockNodes: structuredContent?.nodes?.filter((node: any) => node.type === 'richBlock').map((node: any) => ({
            id: node.id,
            hasData: !!node.data,
            hasContent: !!node.data?.content,
            contentType: typeof node.data?.content,
            isContentString: typeof node.data?.content === 'string',
            hasCorrectStructure: node.data?.content && typeof node.data.content === 'object' && 'htmlContent' in node.data.content,
          })) || [],
          
          structuredContentSample: JSON.stringify(structuredContent).substring(0, 300) + '...',
        });

        validatedContent = validateStructuredContent(structuredContent);
        
        // 📊 POST-VALIDATION POSITIONING DATA AUDIT
        const validatedPositions = (validatedContent as any)?.positions || {};
        const validatedMobilePositions = (validatedContent as any)?.mobilePositions || {};
        const validatedPositionsCount = Object.keys(validatedPositions).length;
        const validatedMobilePositionsCount = Object.keys(validatedMobilePositions).length;

        console.log('[PERSISTENCE AUDIT] ✅ SAVE PIPELINE - Content validation successful:', {
          reviewId,
          validatedNodeCount: validatedContent.nodes.length,
          validatedVersion: validatedContent.version,
          isV3: validatedContent.version === '3.0.0',
          hasPositions: 'positions' in validatedContent,
          hasLayouts: 'layouts' in validatedContent,
          
          // 🎯 POSITIONING DATA PRESERVATION CHECK
          positionsPreserved: positionsCount === validatedPositionsCount,
          mobilePositionsPreserved: mobilePositionsCount === validatedMobilePositionsCount,
          originalPositionsCount: positionsCount,
          validatedPositionsCount,
          originalMobilePositionsCount: mobilePositionsCount,
          validatedMobilePositionsCount,
          
          positioningDataStatus: positionsCount === validatedPositionsCount && mobilePositionsCount === validatedMobilePositionsCount ? 
            '✅ PRESERVED' : 
            '❌ LOST/MODIFIED'
        });

        console.log('Content validation successful:', {
          reviewId,
          validatedNodeCount: validatedContent.nodes.length,
          validatedVersion: validatedContent.version,
          isV3: validatedContent.version === '3.0.0',
          hasPositions: 'positions' in validatedContent,
          hasLayouts: 'layouts' in validatedContent,
        });
      } catch (validationError) {
        console.error('Content validation failed:', {
          reviewId,
          error:
            validationError instanceof Error ? validationError.message : String(validationError),
          fullError: validationError,
          contentKeys: Object.keys(structuredContent || {}),
          nodeCount: structuredContent?.nodes?.length || 0,
          version: structuredContent?.version || 'unknown',
          hasPositions: 'positions' in (structuredContent || {}),
          hasLayouts: 'layouts' in (structuredContent || {}),
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
        // Use stable JSON stringify to avoid key ordering issues
        const intendedStr = JSON.stringify(validatedContent, Object.keys(validatedContent).sort());
        const actualStr = JSON.stringify(
          data.structured_content,
          Object.keys(data.structured_content || {}).sort()
        );

        if (data && actualStr !== intendedStr) {
          const intendedKeys = Object.keys(validatedContent);
          const actualKeys = Object.keys(data.structured_content || {});

          // Safely cast database Json to StructuredContent for property access
          const actualContent = data.structured_content as any;

          // Check if this is just a key ordering issue
          const sameKeys =
            intendedKeys.length === actualKeys.length &&
            intendedKeys.every(key => actualKeys.includes(key));
          const sameNodeCount = validatedContent.nodes?.length === actualContent?.nodes?.length;
          const sameVersion = validatedContent.version === actualContent?.version;

          // Only show warning if there are actual structural differences
          if (!sameKeys || !sameNodeCount || !sameVersion) {
            // Detailed comparison to identify the mismatch source
            const detailedAnalysis = {
              reviewId: numericReviewId,
              intendedNodeCount: validatedContent.nodes?.length || 0,
              actualNodeCount: actualContent?.nodes?.length || 0,
              intendedVersion: validatedContent.version,
              actualVersion: actualContent?.version,
              intendedKeys,
              actualKeys,
              keysMismatch: !sameKeys,
              nodeCountMismatch: !sameNodeCount,
              versionMismatch: !sameVersion,
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
          console.log('[PERSISTENCE AUDIT] 📥 LOAD PIPELINE - No content found for review:', reviewId);
          return null;
        }
        throw new Error(`Failed to load editor content: ${error.message}`);
      }

      // 🎯 PHASE 2A: Enhanced logging to trace loaded content structure
      const rawContent = data.structured_content as any;
      const rawPositions = rawContent?.positions || {};
      const rawMobilePositions = rawContent?.mobilePositions || {};
      const rawPositionsCount = Object.keys(rawPositions).length;
      const rawMobilePositionsCount = Object.keys(rawMobilePositions).length;

      console.log('[PERSISTENCE AUDIT] 📥 LOAD PIPELINE - Raw content loaded from database:', {
        reviewId,
        hasStructuredContent: !!rawContent,
        contentType: typeof rawContent,
        rawVersion: rawContent?.version,
        rawNodeCount: Array.isArray(rawContent?.nodes) ? rawContent.nodes.length : 0,
        hasRawPositions: !!rawContent?.positions,
        hasRawMobilePositions: !!rawContent?.mobilePositions,
        
        // 🎯 RAW POSITIONING DATA AUDIT
        rawPositionsCount,
        rawMobilePositionsCount,
        sampleRawPositions: rawPositionsCount > 0 ? Object.entries(rawPositions).slice(0, 2).map(([id, pos]: [string, any]) => ({
          id,
          x: pos.x,
          y: pos.y,
          width: pos.width,
          height: pos.height,
        })) : [],

        // 🔍 RAW RICHBLOCK CONTENT STRUCTURE AUDIT
        rawRichBlockNodes: rawContent?.nodes?.filter((node: any) => node.type === 'richBlock').map((node: any) => ({
          id: node.id,
          hasData: !!node.data,
          hasContent: !!node.data?.content,
          contentType: typeof node.data?.content,
          isContentString: typeof node.data?.content === 'string',
          hasCorrectStructure: node.data?.content && typeof node.data.content === 'object' && 'htmlContent' in node.data.content,
          contentPreview: typeof node.data?.content === 'string' 
            ? node.data.content.substring(0, 30) + '...'
            : JSON.stringify(node.data?.content).substring(0, 50) + '...',
        })) || [],

        // 🎯 MOBILE PADDING DATA AUDIT: Specifically track mobile padding presence and structure
        mobilePaddingAudit: rawContent?.nodes?.map((node: any) => ({
          nodeId: node.id,
          nodeType: node.type,
          hasData: !!node.data,
          paddingAnalysis: {
            // Viewport-specific padding (the new system we need)
            hasDesktopPadding: !!node.data?.desktopPadding,
            hasMobilePadding: !!node.data?.mobilePadding,
            desktopPaddingValue: node.data?.desktopPadding,
            mobilePaddingValue: node.data?.mobilePadding,
            // Legacy padding system
            hasLegacyIndividual: !!(node.data?.paddingTop || node.data?.paddingRight || node.data?.paddingBottom || node.data?.paddingLeft),
            hasLegacySymmetric: !!(node.data?.paddingX || node.data?.paddingY),
            legacyPaddingData: {
              paddingTop: node.data?.paddingTop,
              paddingRight: node.data?.paddingRight,
              paddingBottom: node.data?.paddingBottom,
              paddingLeft: node.data?.paddingLeft,
              paddingX: node.data?.paddingX,
              paddingY: node.data?.paddingY,
            }
          }
        })) || [],
        
        created_at: data.created_at,
        updated_at: data.updated_at,
      });

      // Validate the loaded content
      try {
        const validatedContent = validateStructuredContent(data.structured_content);
        
        // 📊 POST-VALIDATION LOAD AUDIT
        const validatedPositions = (validatedContent as any)?.positions || {};
        const validatedMobilePositions = (validatedContent as any)?.mobilePositions || {};
        const validatedPositionsCount = Object.keys(validatedPositions).length;
        const validatedMobilePositionsCount = Object.keys(validatedMobilePositions).length;

        // 🎯 POST-VALIDATION MOBILE PADDING AUDIT: Check if mobile padding survived validation
        const validatedMobilePaddingAudit = validatedContent.nodes.map((node: any) => ({
          nodeId: node.id,
          nodeType: node.type,
          hasData: !!node.data,
          paddingAnalysis: {
            hasDesktopPadding: !!node.data?.desktopPadding,
            hasMobilePadding: !!node.data?.mobilePadding,
            desktopPaddingValue: node.data?.desktopPadding,
            mobilePaddingValue: node.data?.mobilePadding,
            hasLegacyIndividual: !!(node.data?.paddingTop || node.data?.paddingRight || node.data?.paddingBottom || node.data?.paddingLeft),
            hasLegacySymmetric: !!(node.data?.paddingX || node.data?.paddingY),
            legacyPaddingData: {
              paddingTop: node.data?.paddingTop,
              paddingRight: node.data?.paddingRight,
              paddingBottom: node.data?.paddingBottom,
              paddingLeft: node.data?.paddingLeft,
              paddingX: node.data?.paddingX,
              paddingY: node.data?.paddingY,
            }
          }
        }));

        // Compare raw vs validated mobile padding data
        const rawNodesWithMobilePadding = rawContent?.nodes?.filter((node: any) => !!node.data?.mobilePadding) || [];
        const validatedNodesWithMobilePadding = validatedContent.nodes.filter((node: any) => !!node.data?.mobilePadding);

        console.log('[PERSISTENCE AUDIT] ✅ LOAD PIPELINE - Content validation successful:', {
          reviewId,
          validatedNodeCount: validatedContent.nodes.length,
          validatedVersion: validatedContent.version,
          
          // 🎯 POSITIONING DATA PRESERVATION CHECK
          positionsPreserved: rawPositionsCount === validatedPositionsCount,
          mobilePositionsPreserved: rawMobilePositionsCount === validatedMobilePositionsCount,
          rawPositionsCount,
          validatedPositionsCount,
          rawMobilePositionsCount,
          validatedMobilePositionsCount,
          
          loadPositioningDataStatus: rawPositionsCount === validatedPositionsCount && rawMobilePositionsCount === validatedMobilePositionsCount ? 
            '✅ PRESERVED THROUGH LOAD' : 
            '❌ LOST/MODIFIED DURING LOAD',

          // 🎯 MOBILE PADDING PRESERVATION CHECK
          mobilePaddingPreservationAudit: {
            rawNodesWithMobilePadding: rawNodesWithMobilePadding.length,
            validatedNodesWithMobilePadding: validatedNodesWithMobilePadding.length,
            mobilePaddingPreserved: rawNodesWithMobilePadding.length === validatedNodesWithMobilePadding.length,
            mobilePaddingDataStatus: rawNodesWithMobilePadding.length === validatedNodesWithMobilePadding.length ?
              '✅ MOBILE PADDING PRESERVED THROUGH VALIDATION' :
              '❌ MOBILE PADDING LOST DURING VALIDATION',
            validatedMobilePaddingDetails: validatedMobilePaddingAudit.filter(node => node.paddingAnalysis.hasMobilePadding),
            allValidatedPaddingDetails: validatedMobilePaddingAudit
          }
        });

        return {
          ...data,
          structured_content: validatedContent,
        } as EditorPersistenceData;
      } catch (validationError) {
        console.error('[PERSISTENCE AUDIT] ❌ LOAD PIPELINE - Loaded content validation FAILED:', {
          reviewId,
          error: validationError instanceof Error ? validationError.message : String(validationError),
          rawPositionsCount,
          rawMobilePositionsCount,
          validationErrorType: validationError instanceof Error ? validationError.constructor.name : typeof validationError,
        });
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
  structuredContent: StructuredContent | null,
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
    saveToDatabase: async (reviewId: string, structuredContent: StructuredContent) => {
      return saveMutation.mutateAsync({ reviewId, structuredContent });
    },
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    lastSaveResult: saveMutation.data,
  };
};
