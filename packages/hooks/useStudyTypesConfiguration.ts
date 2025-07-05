// ABOUTME: TanStack Query hook for managing study types configuration via SiteSettings

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import type { StudyTypes } from '../../src/types';

// Fetch study types from SiteSettings
export const useStudyTypesConfiguration = () => {
  return useQuery({
    queryKey: ['site-settings', 'study-types'],
    queryFn: async (): Promise<StudyTypes> => {
      const { data, error } = await supabase
        .from('SiteSettings')
        .select('value')
        .eq('key', 'study_types')
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          console.warn('Study types configuration not found, using empty array');
          return [];
        }
        throw new Error(`Failed to fetch study types: ${error.message}`);
      }

      // Parse JSONB value and ensure it's an array of strings
      const studyTypes = data.value as unknown;
      if (Array.isArray(studyTypes) && studyTypes.every(item => typeof item === 'string')) {
        return studyTypes as StudyTypes;
      }

      console.warn('Invalid study types format, using empty array');
      return [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - longer since this changes infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Update study types configuration
export const useUpdateStudyTypesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studyTypes: StudyTypes): Promise<void> => {
      // Validate input
      if (!Array.isArray(studyTypes)) {
        throw new Error('Study types must be an array');
      }

      if (!studyTypes.every(item => typeof item === 'string' && item.trim().length > 0)) {
        throw new Error('All study types must be non-empty strings');
      }

      // Remove duplicates and trim whitespace
      const cleanedTypes = [...new Set(studyTypes.map(type => type.trim()))];

      const { error } = await supabase
        .from('SiteSettings')
        .upsert({
          key: 'study_types',
          value: cleanedTypes,
          description: 'Available study design types for articles',
          category: 'review_metadata',
        });

      if (error) {
        throw new Error(`Failed to update study types: ${error.message}`);
      }
    },
    onSuccess: () => {
      // Invalidate study types cache
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'study-types'] });
      
      // Also invalidate any review-related queries that might use study types
      queryClient.invalidateQueries({ queryKey: ['admin', 'review'] });
      
      console.log('Study types configuration updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update study types configuration:', error);
    },
  });
};

// Get study type usage analytics
export const useStudyTypeAnalytics = () => {
  return useQuery({
    queryKey: ['study-types', 'analytics'],
    queryFn: async () => {
      // Get all study types from configuration
      const { data: configData } = await supabase
        .from('SiteSettings')
        .select('value')
        .eq('key', 'study_types')
        .single();

      const allStudyTypes = (configData?.value as StudyTypes) || [];

      // Get usage counts for each study type
      const { data: usageData, error } = await supabase
        .from('Reviews')
        .select('study_type')
        .not('study_type', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch study type usage: ${error.message}`);
      }

      // Count usage for each study type
      const usageCounts = allStudyTypes.reduce((counts, type) => {
        counts[type] = usageData?.filter(review => review.study_type === type).length || 0;
        return counts;
      }, {} as Record<string, number>);

      // Find orphaned study types (used in reviews but not in configuration)
      const usedTypes = [...new Set(usageData?.map(review => review.study_type).filter(Boolean) || [])];
      const orphanedTypes = usedTypes.filter(type => !allStudyTypes.includes(type));

      return {
        allTypes: allStudyTypes,
        usageCounts,
        orphanedTypes,
        totalUsages: Object.values(usageCounts).reduce((sum, count) => sum + count, 0),
        mostUsed: Object.entries(usageCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count })),
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Helper functions for study type management
export const getDefaultStudyTypes = (): StudyTypes => [
  'Revisão Sistemática',
  'Meta-análise',
  'Ensaio Clínico Randomizado (RCT)',
  'Estudo de Coorte Prospectivo',
  'Estudo de Coorte Retrospectivo',
  'Estudo Caso-Controle',
  'Estudo Transversal',
  'Estudo Ecológico',
  'Relato de Caso',
  'Série de Casos',
  'Ensaio Clínico Não-Randomizado',
  'Estudo Piloto',
  'Estudo de Validação',
  'Análise Secundária',
  'Revisão Narrativa',
  'Scoping Review',
  'Umbrella Review',
  'Overview',
  'Rapid Review',
  'Living Review',
];

export const validateStudyType = (studyType: string): boolean => {
  return typeof studyType === 'string' && studyType.trim().length > 0 && studyType.length <= 100;
};

export const sanitizeStudyType = (studyType: string): string => {
  return studyType.trim().replace(/\s+/g, ' ');
};