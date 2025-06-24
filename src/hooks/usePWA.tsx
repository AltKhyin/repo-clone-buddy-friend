
// ABOUTME: Hook for PWA capabilities detection and management.

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAHook {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  showInstallPrompt: () => Promise<void>;
  dismissInstallPrompt: () => void;
}

export const usePWA = (): PWAHook => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detect if device is iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Detect if app is running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone || 
                      document.referrer.includes('android-app://');

  // Check if PWA is installable
  const isInstallable = installPrompt !== null || (isIOS && !isStandalone);

  useEffect(() => {
    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (isStandalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const showInstallPrompt = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setInstallPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const dismissInstallPrompt = () => {
    setInstallPrompt(null);
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    installPrompt,
    showInstallPrompt,
    dismissInstallPrompt,
  };
};
