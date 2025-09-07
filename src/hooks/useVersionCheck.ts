// ABOUTME: Automated version checking hook that detects when app updates are available and prompts users to refresh

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { APP_VERSION, BUILD_TIMESTAMP } from '../version';

interface VersionInfo {
  hash: string;
  branch: string;
  buildTime: string;
  timestamp: number;
}

interface UseVersionCheckOptions {
  /** How often to check for updates (in milliseconds) */
  checkInterval?: number;
  /** Whether to check immediately on mount */
  checkOnMount?: boolean;
  /** Whether to check on window focus */
  checkOnFocus?: boolean;
}

interface UseVersionCheckResult {
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Current local version */
  currentVersion: string;
  /** Latest server version */
  latestVersion: string | null;
  /** Function to manually check for updates */
  checkForUpdates: () => void;
  /** Function to reload the app (clears all caches) */
  reloadApp: () => void;
  /** Whether the check is in progress */
  isChecking: boolean;
  /** Last check timestamp */
  lastChecked: Date | null;
  /** Function to dismiss update notification (until next update) */
  dismissUpdate: () => void;
  /** Whether update notification was dismissed */
  isDismissed: boolean;
}

const STORAGE_KEY = 'evidens_dismissed_version';

export const useVersionCheck = (options: UseVersionCheckOptions = {}): UseVersionCheckResult => {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes default
    checkOnMount = true,
    checkOnFocus = true,
  } = options;

  const [isDismissed, setIsDismissed] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Fetch latest version from server
  const {
    data: serverVersionInfo,
    isLoading,
    refetch,
  } = useQuery<VersionInfo>({
    queryKey: ['app-version'],
    queryFn: async () => {
      const response = await fetch('/version.json?' + Date.now()); // Cache busting
      if (!response.ok) {
        throw new Error('Failed to fetch version info');
      }
      return response.json();
    },
    enabled: checkOnMount,
    staleTime: 0, // Always consider stale
    gcTime: 1000, // Keep in cache for 1 second only
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: checkOnFocus,
    refetchInterval: checkInterval,
  });

  // Check if update is available
  const updateAvailable = Boolean(
    serverVersionInfo && 
    serverVersionInfo.hash !== APP_VERSION &&
    serverVersionInfo.timestamp > BUILD_TIMESTAMP
  );

  // Check if this version was already dismissed
  useEffect(() => {
    if (updateAvailable && serverVersionInfo) {
      const dismissedVersion = localStorage.getItem(STORAGE_KEY);
      setIsDismissed(dismissedVersion === serverVersionInfo.hash);
    }
  }, [updateAvailable, serverVersionInfo]);

  // Update last checked timestamp
  useEffect(() => {
    if (serverVersionInfo) {
      setLastChecked(new Date());
    }
  }, [serverVersionInfo]);

  // Manual check function
  const checkForUpdates = () => {
    refetch();
  };

  // Reload app function with cache clearing
  const reloadApp = () => {
    // Clear all possible caches
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    // Clear localStorage for dismissed versions
    localStorage.removeItem(STORAGE_KEY);

    // Clear browser caches if possible
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    // Force hard reload
    window.location.reload();
  };

  // Dismiss update notification
  const dismissUpdate = () => {
    if (serverVersionInfo) {
      localStorage.setItem(STORAGE_KEY, serverVersionInfo.hash);
      setIsDismissed(true);
    }
  };

  return {
    updateAvailable: updateAvailable && !isDismissed,
    currentVersion: APP_VERSION,
    latestVersion: serverVersionInfo?.hash || null,
    checkForUpdates,
    reloadApp,
    isChecking: isLoading,
    lastChecked,
    dismissUpdate,
    isDismissed,
  };
};