// ABOUTME: Crash recovery system that detects and offers to restore from LocalStorage backups

import React, { useCallback, useEffect } from 'react';
import { StructuredContentV2, validateStructuredContent } from '@/types/editor';
import { useToast } from '@/hooks/use-toast';

export interface CrashRecoveryState {
  hasBackup: boolean;
  backupTimestamp: Date | null;
  backupReviewId: string | null;
  isRecovering: boolean;
  recoveryError: Error | null;
}

export interface CrashRecoveryActions {
  checkForBackup: (reviewId: string) => boolean;
  recoverFromBackup: (reviewId: string) => StructuredContentV2 | null;
  dismissBackup: (reviewId: string) => void;
  clearAllBackups: () => void;
}

const BACKUP_KEY_PREFIX = 'evidens_editor_backup_';
const BACKUP_METADATA_KEY = 'evidens_backup_metadata';
const CRASH_DETECTION_KEY = 'evidens_crash_detection';

// Crash detection mechanism
const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const CRASH_THRESHOLD = 30000; // 30 seconds without heartbeat = likely crash

export function useCrashRecovery(reviewId: string | null) {
  const { toast } = useToast();
  
  const [state, setState] = React.useState<CrashRecoveryState>({
    hasBackup: false,
    backupTimestamp: null,
    backupReviewId: null,
    isRecovering: false,
    recoveryError: null,
  });

  // Generate backup key for specific review
  const getBackupKey = useCallback((id: string) => {
    return `${BACKUP_KEY_PREFIX}${id}`;
  }, []);

  // Check if backup exists for current review
  const checkForBackup = useCallback((id: string): boolean => {
    try {
      const backupKey = getBackupKey(id);
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) return false;

      const backup = JSON.parse(backupData);
      const isValid = backup.content && backup.timestamp && backup.reviewId === id;
      
      if (isValid) {
        setState(prev => ({
          ...prev,
          hasBackup: true,
          backupTimestamp: new Date(backup.timestamp),
          backupReviewId: id,
        }));
      }
      
      return isValid;
    } catch (error) {
      console.error('Error checking for backup:', error);
      return false;
    }
  }, [getBackupKey]);

  // Recover content from backup
  const recoverFromBackup = useCallback((id: string): StructuredContentV2 | null => {
    try {
      setState(prev => ({ ...prev, isRecovering: true, recoveryError: null }));
      
      const backupKey = getBackupKey(id);
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        throw new Error('No backup data found');
      }

      const backup = JSON.parse(backupData);
      const validatedContent = validateStructuredContent(backup.content);

      setState(prev => ({
        ...prev,
        isRecovering: false,
        hasBackup: false,
        backupTimestamp: null,
        backupReviewId: null,
      }));

      toast({
        title: "Backup Restored",
        description: `Successfully restored content from ${new Date(backup.timestamp).toLocaleString()}`,
      });

      return validatedContent;
    } catch (error) {
      console.error('Recovery failed:', error);
      setState(prev => ({
        ...prev,
        isRecovering: false,
        recoveryError: error as Error,
      }));

      toast({
        title: "Recovery Failed",
        description: "Could not restore from backup. The backup may be corrupted.",
        variant: "destructive",
      });

      return null;
    }
  }, [getBackupKey, toast]);

  // Dismiss backup (remove it)
  const dismissBackup = useCallback((id: string) => {
    const backupKey = getBackupKey(id);
    localStorage.removeItem(backupKey);
    
    setState(prev => ({
      ...prev,
      hasBackup: false,
      backupTimestamp: null,
      backupReviewId: null,
    }));

    toast({
      title: "Backup Dismissed",
      description: "Local backup has been removed.",
    });
  }, [getBackupKey, toast]);

  // Clear all backups
  const clearAllBackups = useCallback(() => {
    try {
      // Find all backup keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(BACKUP_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove all backup keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(BACKUP_METADATA_KEY);

      setState(prev => ({
        ...prev,
        hasBackup: false,
        backupTimestamp: null,
        backupReviewId: null,
      }));

      toast({
        title: "All Backups Cleared",
        description: "All local backups have been removed.",
      });
    } catch (error) {
      console.error('Error clearing backups:', error);
    }
  }, [toast]);

  // Crash detection using heartbeat mechanism
  useEffect(() => {
    // Check for previous crash on component mount
    const checkForCrash = () => {
      const lastHeartbeat = localStorage.getItem(CRASH_DETECTION_KEY);
      if (lastHeartbeat) {
        const lastTime = parseInt(lastHeartbeat, 10);
        const now = Date.now();
        
        if (now - lastTime > CRASH_THRESHOLD) {
          console.warn('Potential crash detected based on heartbeat');
          
          // Check if current review has backup
          if (reviewId && checkForBackup(reviewId)) {
            toast({
              title: "Crash Recovery Available",
              description: "We detected a potential crash. You can restore your unsaved changes.",
              duration: 10000, // Show longer for crash recovery
            });
          }
        }
      }
    };

    checkForCrash();

    // Set up heartbeat
    const heartbeatInterval = setInterval(() => {
      localStorage.setItem(CRASH_DETECTION_KEY, Date.now().toString());
    }, HEARTBEAT_INTERVAL);

    // Initial heartbeat
    localStorage.setItem(CRASH_DETECTION_KEY, Date.now().toString());

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [reviewId, checkForBackup, toast]);

  // Clean up heartbeat on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem(CRASH_DETECTION_KEY);
    };
  }, []);

  // Check for backup when reviewId changes
  useEffect(() => {
    if (reviewId) {
      checkForBackup(reviewId);
    }
  }, [reviewId, checkForBackup]);

  const actions: CrashRecoveryActions = {
    checkForBackup,
    recoverFromBackup,
    dismissBackup,
    clearAllBackups,
  };

  return { state, actions };
}