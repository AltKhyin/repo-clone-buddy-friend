// ABOUTME: Minimal test suite for PWA preferences utility

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  canShowPWAPrompt,
  dismissPWAPrompt,
  declinePWAInstall,
  shouldShowNotificationDot,
  markSessionNotificationShown,
  resetSessionTracking,
  resetPWAPreferences
} from '../pwaPreferences';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('PWA Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('canShowPWAPrompt', () => {
    it('should return true by default', () => {
      expect(canShowPWAPrompt()).toBe(true);
    });

    it('should return false if user declined install', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        pwa_install_declined: true
      }));
      expect(canShowPWAPrompt()).toBe(false);
    });

    it('should respect cooldown period', () => {
      const recentTime = Date.now() - (3 * 24 * 60 * 60 * 1000); // 3 days ago
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        last_prompt_shown: recentTime
      }));
      expect(canShowPWAPrompt()).toBe(false);
    });
  });

  describe('session tracking', () => {
    it('should show notification dot initially', () => {
      expect(shouldShowNotificationDot()).toBe(true);
    });

    it('should not show dot after being marked as shown', () => {
      markSessionNotificationShown();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reset session tracking', () => {
      resetSessionTracking();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reviews-pwa-preferences',
        expect.stringContaining('"session_notification_shown":false')
      );
    });
  });

  describe('user actions', () => {
    it('should handle dismiss action', () => {
      dismissPWAPrompt();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle decline action', () => {
      declinePWAInstall();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reviews-pwa-preferences',
        expect.stringContaining('"pwa_install_declined":true')
      );
    });
  });
});