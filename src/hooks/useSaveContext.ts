// ABOUTME: Save context hook separated to avoid Fast Refresh warnings

import { useContext } from 'react';
import { UnifiedSaveContext } from '@/contexts/UnifiedSaveContext';
import { UnifiedSaveContextValue } from '@/types/admin';

export const useSaveContext = (): UnifiedSaveContextValue => {
  const context = useContext(UnifiedSaveContext);
  if (!context) {
    throw new Error('useSaveContext must be used within a UnifiedSaveProvider');
  }
  return context;
};
