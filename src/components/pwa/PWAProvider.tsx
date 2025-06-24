
// ABOUTME: PWA provider for managing installation state and lifecycle - simplified without header button.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import PWAInstallPrompt from './PWAInstallPrompt';

interface PWAContextType {
  showInstallPrompt: boolean;
  setShowInstallPrompt: (show: boolean) => void;
  isInstalled: boolean;
  isInstallable: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
};

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
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
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
      {showInstallPrompt && (
        <PWAInstallPrompt 
          onDismiss={() => setShowInstallPrompt(false)} 
        />
      )}
    </PWAContext.Provider>
  );
};

export default PWAProvider;
