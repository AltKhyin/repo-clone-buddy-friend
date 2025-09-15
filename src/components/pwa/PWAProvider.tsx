// ABOUTME: PWA provider for managing installation state and lifecycle - notification-based, non-intrusive approach.

import React, { useEffect } from 'react';
import { PWAContext, PWAContextType } from '@/contexts/PWAContext';
import { usePWA } from '../../hooks/usePWA';
import { resetSessionTracking } from '@/utils/pwaPreferences';

interface PWAProviderProps {
  children: React.ReactNode;
}

const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const { isInstalled, isInstallable } = usePWA();

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Reset session tracking on app start (session-based notification dot)
    resetSessionTracking();
  }, []);

  const contextValue: PWAContextType = {
    showInstallPrompt: false, // No more popup prompts
    setShowInstallPrompt: () => {}, // No-op function for backward compatibility
    isInstalled,
    isInstallable,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      {/* No more PWAInstallPrompt popup - now handled via notification system */}
    </PWAContext.Provider>
  );
};

export default PWAProvider;
