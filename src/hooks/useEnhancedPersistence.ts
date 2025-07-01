// ABOUTME: Enhanced persistence system with auto-save, LocalStorage backup, and crash recovery

import React, { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StructuredContentV2, validateStructuredContent } from '@/types/editor';
import { useEditorSaveMutation } from '../../packages/hooks/useEditorPersistence';
import { useToast } from '@/hooks/use-toast';

export interface PersistenceState {
  isSaving: boolean;
  isBackingUp: boolean;
  lastSaved: Date | null;
  lastBackup: Date | null;
  hasUnsavedChanges: boolean;
  saveError: Error | null;
  backupError: Error | null;
  autoSaveEnabled: boolean;
  conflictDetected: boolean;
}

export interface PersistenceActions {
  forceSave: () => Promise<void>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  restoreFromBackup: () => StructuredContentV2 | null;
  clearBackup: () => void;
  resolveConflict: (useLocal: boolean) => Promise<void>;
}

const AUTOSAVE_DELAY = 5000; // 5 seconds as specified
const BACKUP_DELAY = 2000; // 2 seconds for LocalStorage backup
const BACKUP_KEY_PREFIX = 'evidens_editor_backup_';
const BACKUP_METADATA_KEY = 'evidens_backup_metadata';

interface BackupMetadata {
  reviewId: string;
  timestamp: string;
  version: string;
  conflictDetected?: boolean;
}

export function useEnhancedPersistence(
  reviewId: string | null,
  content: StructuredContentV2 | null,
  isDirty: boolean
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const saveMutation = useEditorSaveMutation();

  // State tracking
  const [persistenceState, setPersistenceState] = React.useState<PersistenceState>({
    isSaving: false,
    isBackingUp: false,
    lastSaved: null,
    lastBackup: null,
    hasUnsavedChanges: false,
    saveError: null,
    backupError: null,
    autoSaveEnabled: true,
    conflictDetected: false,
  });

  // Refs for timers and state tracking
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveContentRef = useRef<string | null>(null);
  const isUnloadingRef = useRef(false);

  // Generate backup key for specific review
  const getBackupKey = useCallback((id: string) => {
    return `${BACKUP_KEY_PREFIX}${id}`;
  }, []);

  // LocalStorage backup functions
  const saveToLocalStorage = useCallback(
    async (data: StructuredContentV2) => {
      if (!reviewId) return;

      try {
        setPersistenceState(prev => ({ ...prev, isBackingUp: true, backupError: null }));

        // Validate content before backup
        const validatedContent = validateStructuredContent(data);

        const backupKey = getBackupKey(reviewId);
        const backup = {
          content: validatedContent,
          timestamp: new Date().toISOString(),
          reviewId,
        };

        // Check backup size before saving to localStorage
        const backupString = JSON.stringify(backup);
        const backupSize = backupString.length;
        const maxSize = 5 * 1024 * 1024; // 5MB limit

        if (backupSize > maxSize) {
          console.warn(
            `Backup too large (${Math.round(backupSize / 1024)}KB), skipping localStorage backup for review ${reviewId}`
          );
          setPersistenceState(prev => ({
            ...prev,
            isBackingUp: false,
            backupError: new Error(
              `Backup too large: ${Math.round(backupSize / 1024)}KB exceeds 5MB limit`
            ),
          }));
          return;
        }

        // Save to localStorage
        localStorage.setItem(backupKey, backupString);

        // Update metadata
        const metadata: BackupMetadata = {
          reviewId,
          timestamp: backup.timestamp,
          version: validatedContent.version,
        };
        localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(metadata));

        setPersistenceState(prev => ({
          ...prev,
          isBackingUp: false,
          lastBackup: new Date(),
          backupError: null,
        }));
      } catch (error) {
        console.error('LocalStorage backup failed:', error);
        setPersistenceState(prev => ({
          ...prev,
          isBackingUp: false,
          backupError: error as Error,
        }));
      }
    },
    [reviewId, getBackupKey]
  );

  const restoreFromBackup = useCallback((): StructuredContentV2 | null => {
    if (!reviewId) return null;

    try {
      const backupKey = getBackupKey(reviewId);
      const backupData = localStorage.getItem(backupKey);

      if (!backupData) return null;

      const backup = JSON.parse(backupData);
      const validatedContent = validateStructuredContent(backup.content);

      return validatedContent;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }, [reviewId, getBackupKey]);

  const clearBackup = useCallback(() => {
    if (!reviewId) return;

    const backupKey = getBackupKey(reviewId);
    localStorage.removeItem(backupKey);
    localStorage.removeItem(BACKUP_METADATA_KEY);

    setPersistenceState(prev => ({ ...prev, lastBackup: null }));
  }, [reviewId, getBackupKey]);

  // Enhanced save function with conflict detection
  const forceSave = useCallback(async () => {
    if (!reviewId || !content) return;

    try {
      setPersistenceState(prev => ({ ...prev, isSaving: true, saveError: null }));

      // Check for conflicts by comparing with server version
      const currentCache = queryClient.getQueryData(['editor-content', reviewId]);
      if (currentCache && lastSaveContentRef.current) {
        const serverContentStr = JSON.stringify(currentCache);
        if (serverContentStr !== lastSaveContentRef.current) {
          setPersistenceState(prev => ({ ...prev, conflictDetected: true }));

          toast({
            title: 'Conflict Detected',
            description: 'The document has been modified elsewhere. Please resolve the conflict.',
            variant: 'destructive',
          });
          return;
        }
      }

      const result = await saveMutation.mutateAsync({
        reviewId,
        structuredContent: content,
      });

      // Update tracking
      lastSaveContentRef.current = JSON.stringify(result);

      setPersistenceState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        saveError: null,
        conflictDetected: false,
      }));

      // Clear backup after successful save
      clearBackup();

      toast({
        title: 'Saved',
        description: 'Your changes have been saved successfully.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Save failed:', error);
      setPersistenceState(prev => ({
        ...prev,
        isSaving: false,
        saveError: error as Error,
      }));

      toast({
        title: 'Save Failed',
        description: 'Failed to save changes. They are backed up locally.',
        variant: 'destructive',
      });
    }
  }, [reviewId, content, queryClient, saveMutation, toast, clearBackup]);

  // Conflict resolution
  const resolveConflict = useCallback(
    async (useLocal: boolean) => {
      if (!reviewId || !content) return;

      if (useLocal) {
        // Force save local version
        setPersistenceState(prev => ({ ...prev, conflictDetected: false }));
        await forceSave();
      } else {
        // Reload from server
        queryClient.invalidateQueries({ queryKey: ['editor-content', reviewId] });
        setPersistenceState(prev => ({ ...prev, conflictDetected: false }));

        toast({
          title: 'Conflict Resolved',
          description: 'Document reloaded from server.',
        });
      }
    },
    [reviewId, content, forceSave, queryClient, toast]
  );

  // Auto-save logic
  useEffect(() => {
    if (!persistenceState.autoSaveEnabled || !isDirty || !content || !reviewId) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new auto-save timer
    autoSaveTimerRef.current = setTimeout(() => {
      if (!isUnloadingRef.current) {
        forceSave();
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, isDirty, reviewId, persistenceState.autoSaveEnabled, forceSave]);

  // LocalStorage backup logic
  useEffect(() => {
    if (!isDirty || !content || !reviewId) {
      return;
    }

    // Clear existing backup timer
    if (backupTimerRef.current) {
      clearTimeout(backupTimerRef.current);
    }

    // Set new backup timer (faster than auto-save)
    backupTimerRef.current = setTimeout(() => {
      if (!isUnloadingRef.current) {
        saveToLocalStorage(content);
      }
    }, BACKUP_DELAY);

    return () => {
      if (backupTimerRef.current) {
        clearTimeout(backupTimerRef.current);
      }
    };
  }, [content, isDirty, reviewId, saveToLocalStorage]);

  // Update unsaved changes state
  useEffect(() => {
    setPersistenceState(prev => ({ ...prev, hasUnsavedChanges: isDirty }));
  }, [isDirty]);

  // Cleanup and emergency save on unmount
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (persistenceState.hasUnsavedChanges) {
        isUnloadingRef.current = true;
        // Try emergency backup
        if (content && reviewId) {
          saveToLocalStorage(content);
        }

        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      isUnloadingRef.current = true;

      // Clear timers
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (backupTimerRef.current) {
        clearTimeout(backupTimerRef.current);
      }
    };
  }, [persistenceState.hasUnsavedChanges, content, reviewId, saveToLocalStorage]);

  // Actions object
  const actions: PersistenceActions = {
    forceSave,
    enableAutoSave: () => setPersistenceState(prev => ({ ...prev, autoSaveEnabled: true })),
    disableAutoSave: () => setPersistenceState(prev => ({ ...prev, autoSaveEnabled: false })),
    restoreFromBackup,
    clearBackup,
    resolveConflict,
  };

  return {
    state: persistenceState,
    actions,
  };
}
