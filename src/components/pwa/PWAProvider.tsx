// ABOUTME: PWA provider for managing installation state and lifecycle - simplified without header button.

import React, { useState, useEffect } from 'react';
import { PWAContext, PWAContextType } from '@/contexts/PWAContext';
import { usePWA } from '@/hooks/usePWA';
import PWAInstallPrompt from './PWAInstallPrompt';

interface PWAProviderProps {
  children: React.ReactNode;
}

const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const { isInstalled, isInstallable, isStandalone } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

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

    // Show install prompt after a delay if not installed and installable
    if (!isInstalled && !isStandalone && isInstallable) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstalled, isStandalone, isInstallable]);

  const contextValue: PWAContextType = {
    showInstallPrompt,
    setShowInstallPrompt,
    isInstalled,
    isInstallable,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      {showInstallPrompt && <PWAInstallPrompt onDismiss={() => setShowInstallPrompt(false)} />}
    </PWAContext.Provider>
  );
};

export default PWAProvider;
