
// ABOUTME: Hook for PWA capabilities detection and management.

import { useState, useEffect } from 'react';
import {
  canShowPWAPrompt,
  dismissPWAPrompt,
  declinePWAInstall,
  hasSeenIOSInstructions,
  markIOSInstructionsAsSeen,
  shouldShowNotificationDot,
  markSessionNotificationShown
} from '@/utils/pwaPreferences';
import {
  getDeviceInfo,
  supportsPWAInstall,
  shouldShowPWAByDefault,
  getPWAInstallMethod,
  isRunningStandalone
} from '@/utils/deviceDetection';

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
  // New methods for notification integration
  shouldShowNotification: boolean;
  shouldShowNotificationDot: boolean;
  canShowPrompt: boolean;
  deviceInfo: ReturnType<typeof getDeviceInfo>;
  installMethod: 'native' | 'manual' | 'unsupported';
  handleDismissNotification: () => void;
  handleDeclineInstall: () => void;
  markNotificationDotSeen: () => void;
}

export const usePWA = (): PWAHook => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Get enhanced device information
  const deviceInfo = getDeviceInfo();
  const isIOS = deviceInfo.isIOS;

  // Detect if app is running in standalone mode
  const isStandalone = isRunningStandalone();

  // Check if PWA is installable (native prompt available or iOS)
  const isInstallable = installPrompt !== null || (isIOS && !isStandalone);

  // Get installation method
  const installMethod = getPWAInstallMethod();

  // Check if user preferences allow showing notifications
  const canShowPrompt = canShowPWAPrompt();

  // Determine if PWA notification should be shown
  const shouldShowNotification =
    !isStandalone && // Not already installed as PWA
    !isInstalled && // Not marked as installed
    supportsPWAInstall() && // Device supports PWA (Android mobile only)
    shouldShowPWAByDefault() && // Device should show PWA by default (Android mobile only)
    canShowPrompt && // User preferences allow it
    installMethod === 'native'; // Only native install method (Android Chrome/Samsung)

  // Determine if notification dot should be shown (once per session)
  const shouldShowNotificationDotValue =
    shouldShowNotification && // Base notification logic
    shouldShowNotificationDot(); // Session-based logic

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

  const handleDismissNotification = () => {
    dismissPWAPrompt();
    setInstallPrompt(null);
  };

  const handleDeclineInstall = () => {
    declinePWAInstall();
    setInstallPrompt(null);
  };

  const markNotificationDotSeen = () => {
    markSessionNotificationShown();
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    installPrompt,
    showInstallPrompt,
    dismissInstallPrompt,
    shouldShowNotification,
    shouldShowNotificationDot: shouldShowNotificationDotValue,
    canShowPrompt,
    deviceInfo,
    installMethod,
    handleDismissNotification,
    handleDeclineInstall,
    markNotificationDotSeen,
  };
};
