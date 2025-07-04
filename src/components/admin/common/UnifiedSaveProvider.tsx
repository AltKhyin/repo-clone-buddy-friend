// ABOUTME: Unified save state management provider for consistent admin form handling

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SaveState, UnifiedSaveContextValue } from '@/types/admin';
import { usePublicationActionMutation } from '../../../../packages/hooks/usePublicationActionMutation';
import { useUpdateReviewMetadataMutation } from '../../../../packages/hooks/useUpdateReviewMetadataMutation';
import { useToast } from '@/hooks/use-toast';

const UnifiedSaveContext = createContext<UnifiedSaveContextValue | null>(null);

interface UnifiedSaveProviderProps {
  children: ReactNode;
  reviewId: number;
  onSaveComplete?: () => void;
  onPublishComplete?: () => void;
}

export const UnifiedSaveProvider: React.FC<UnifiedSaveProviderProps> = ({
  children,
  reviewId,
  onSaveComplete,
  onPublishComplete,
}) => {
  const { toast } = useToast();
  const publicationMutation = usePublicationActionMutation();
  const metadataMutation = useUpdateReviewMetadataMutation();

  const [saveState, setSaveState] = useState<SaveState>({
    hasChanges: false,
    isSaving: false,
    errors: [],
    pendingChanges: {},
  });

  const updateField = useCallback((field: string, value: any) => {
    setSaveState(prev => ({
      ...prev,
      hasChanges: true,
      pendingChanges: {
        ...prev.pendingChanges,
        [field]: value,
      },
      errors: prev.errors.filter(error => !error.includes(field)),
    }));
  }, []);

  const save = useCallback(async () => {
    if (!saveState.hasChanges) return;

    setSaveState(prev => ({ ...prev, isSaving: true, errors: [] }));

    try {
      // Update review metadata with pending changes
      await metadataMutation.mutateAsync({
        reviewId,
        metadata: saveState.pendingChanges,
      });

      setSaveState(prev => ({
        ...prev,
        hasChanges: false,
        isSaving: false,
        pendingChanges: {},
      }));

      toast({
        title: 'Success',
        description: 'Changes saved successfully!',
      });

      onSaveComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        errors: [errorMessage],
      }));

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [saveState.hasChanges, saveState.pendingChanges, reviewId, metadataMutation, toast, onSaveComplete]);

  const publish = useCallback(async () => {
    // First save any pending changes
    if (saveState.hasChanges) {
      await save();
    }

    setSaveState(prev => ({ ...prev, isSaving: true, errors: [] }));

    try {
      await publicationMutation.mutateAsync({
        reviewId,
        action: 'publish',
      });

      setSaveState(prev => ({ ...prev, isSaving: false }));

      toast({
        title: 'Success',
        description: 'Review published successfully!',
      });

      onPublishComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish review';
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        errors: [errorMessage],
      }));

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [reviewId, saveState.hasChanges, save, publicationMutation, toast, onPublishComplete]);

  const addError = useCallback((error: string) => {
    setSaveState(prev => ({
      ...prev,
      errors: [...prev.errors, error],
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setSaveState(prev => ({
      ...prev,
      errors: [],
    }));
  }, []);

  const resetChanges = useCallback(() => {
    setSaveState({
      hasChanges: false,
      isSaving: false,
      errors: [],
      pendingChanges: {},
    });
  }, []);

  const contextValue: UnifiedSaveContextValue = {
    saveState,
    updateField,
    save,
    publish,
    resetChanges,
    addError,
    clearErrors,
  };

  return (
    <UnifiedSaveContext.Provider value={contextValue}>
      {children}
    </UnifiedSaveContext.Provider>
  );
};

export const useSaveContext = (): UnifiedSaveContextValue => {
  const context = useContext(UnifiedSaveContext);
  if (!context) {
    throw new Error('useSaveContext must be used within a UnifiedSaveProvider');
  }
  return context;
};