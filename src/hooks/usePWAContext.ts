// ABOUTME: PWA context hook separated for Fast Refresh compatibility

import { useContext } from 'react';
import { PWAContext, PWAContextType } from '@/contexts/PWAContext';

export const usePWAContext = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
};
