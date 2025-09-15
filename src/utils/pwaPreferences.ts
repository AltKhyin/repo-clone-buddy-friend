// ABOUTME: PWA user preferences storage utility with localStorage persistence and cooldown logic

interface PWAPreferences {
  pwa_prompt_dismissed: boolean;
  pwa_install_declined: boolean;
  last_prompt_shown: number | null;
  ios_instructions_seen: boolean;
  session_notification_shown: boolean;
}

const PWA_STORAGE_KEY = 'reviews-pwa-preferences';
const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// Default preferences
const DEFAULT_PREFERENCES: PWAPreferences = {
  pwa_prompt_dismissed: false,
  pwa_install_declined: false,
  last_prompt_shown: null,
  ios_instructions_seen: false,
  session_notification_shown: false,
};

/**
 * Get PWA preferences from localStorage with fallback to defaults
 */
export const getPWAPreferences = (): PWAPreferences => {
  try {
    const stored = localStorage.getItem(PWA_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(stored) as Partial<PWAPreferences>;

    // Merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch (error) {
    console.warn('Failed to load PWA preferences:', error);
    return { ...DEFAULT_PREFERENCES };
  }
};

/**
 * Save PWA preferences to localStorage
 */
export const setPWAPreferences = (preferences: Partial<PWAPreferences>): void => {
  try {
    const current = getPWAPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(PWA_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save PWA preferences:', error);
  }
};

/**
 * Check if PWA prompt can be shown based on user preferences and cooldown
 */
export const canShowPWAPrompt = (): boolean => {
  const preferences = getPWAPreferences();

  // User permanently declined
  if (preferences.pwa_install_declined) {
    return false;
  }

  // Check cooldown period
  if (preferences.last_prompt_shown) {
    const timeSinceLastPrompt = Date.now() - preferences.last_prompt_shown;
    if (timeSinceLastPrompt < COOLDOWN_MS) {
      return false;
    }
  }

  return true;
};

/**
 * Mark PWA prompt as dismissed with cooldown
 */
export const dismissPWAPrompt = (): void => {
  setPWAPreferences({
    pwa_prompt_dismissed: true,
    last_prompt_shown: Date.now(),
  });
};

/**
 * Permanently decline PWA installation
 */
export const declinePWAInstall = (): void => {
  setPWAPreferences({
    pwa_install_declined: true,
    pwa_prompt_dismissed: true,
    last_prompt_shown: Date.now(),
  });
};

/**
 * Mark iOS instructions as seen
 */
export const markIOSInstructionsAsSeen = (): void => {
  setPWAPreferences({
    ios_instructions_seen: true,
  });
};

/**
 * Check if iOS instructions have been seen
 */
export const hasSeenIOSInstructions = (): boolean => {
  return getPWAPreferences().ios_instructions_seen;
};

/**
 * Reset PWA preferences (for testing or user request)
 */
export const resetPWAPreferences = (): void => {
  try {
    localStorage.removeItem(PWA_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to reset PWA preferences:', error);
  }
};

/**
 * Get days remaining in cooldown period
 */
export const getCooldownDaysRemaining = (): number => {
  const preferences = getPWAPreferences();

  if (!preferences.last_prompt_shown) {
    return 0;
  }

  const timeSinceLastPrompt = Date.now() - preferences.last_prompt_shown;
  const remainingMs = COOLDOWN_MS - timeSinceLastPrompt;

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
};

/**
 * Check if session notification has been shown
 */
export const hasShownSessionNotification = (): boolean => {
  return getPWAPreferences().session_notification_shown;
};

/**
 * Mark session notification as shown
 */
export const markSessionNotificationShown = (): void => {
  setPWAPreferences({
    session_notification_shown: true,
  });
};

/**
 * Reset session tracking (call on app start)
 */
export const resetSessionTracking = (): void => {
  setPWAPreferences({
    session_notification_shown: false,
  });
};

/**
 * Check if notification dot should be shown (once per session)
 */
export const shouldShowNotificationDot = (): boolean => {
  const preferences = getPWAPreferences();

  // Don't show if permanently declined
  if (preferences.pwa_install_declined) {
    return false;
  }

  // Don't show if already shown this session
  if (preferences.session_notification_shown) {
    return false;
  }

  // Check cooldown period
  if (preferences.last_prompt_shown) {
    const timeSinceLastPrompt = Date.now() - preferences.last_prompt_shown;
    if (timeSinceLastPrompt < COOLDOWN_MS) {
      return false;
    }
  }

  return true;
};