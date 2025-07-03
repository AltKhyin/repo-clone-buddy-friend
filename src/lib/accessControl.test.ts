// ABOUTME: Tests for access control utility functions ensuring proper 4-tier hierarchy validation

import { describe, it, expect } from 'vitest';
import {
  ACCESS_LEVELS,
  hasAccessLevel,
  getUserAccessLevel,
  validateAccessLevel,
  getAccessLevelHierarchy,
} from './accessControl';

describe('Access Control Utilities', () => {
  describe('ACCESS_LEVELS constants', () => {
    it('should define correct 4-tier hierarchy', () => {
      expect(ACCESS_LEVELS.public).toBe(0);
      expect(ACCESS_LEVELS.free).toBe(1);
      expect(ACCESS_LEVELS.premium).toBe(2);
      expect(ACCESS_LEVELS.editor_admin).toBe(3);
    });

    it('should have proper ordering', () => {
      expect(ACCESS_LEVELS.public).toBeLessThan(ACCESS_LEVELS.free);
      expect(ACCESS_LEVELS.free).toBeLessThan(ACCESS_LEVELS.premium);
      expect(ACCESS_LEVELS.premium).toBeLessThan(ACCESS_LEVELS.editor_admin);
    });
  });

  describe('hasAccessLevel', () => {
    it('should allow access when user level equals required level', () => {
      expect(hasAccessLevel('free', 'free')).toBe(true);
      expect(hasAccessLevel('premium', 'premium')).toBe(true);
    });

    it('should allow access when user level exceeds required level', () => {
      expect(hasAccessLevel('premium', 'free')).toBe(true);
      expect(hasAccessLevel('editor_admin', 'premium')).toBe(true);
      expect(hasAccessLevel('editor_admin', 'public')).toBe(true);
    });

    it('should deny access when user level is below required level', () => {
      expect(hasAccessLevel('public', 'free')).toBe(false);
      expect(hasAccessLevel('free', 'premium')).toBe(false);
      expect(hasAccessLevel('premium', 'editor_admin')).toBe(false);
    });

    it('should handle invalid access levels gracefully', () => {
      expect(hasAccessLevel('invalid', 'free')).toBe(false);
      expect(hasAccessLevel('free', 'invalid')).toBe(false);
      expect(hasAccessLevel('invalid', 'invalid')).toBe(false);
    });

    it('should handle null/undefined values', () => {
      expect(hasAccessLevel(null as any, 'free')).toBe(false);
      expect(hasAccessLevel('free', null as any)).toBe(false);
      expect(hasAccessLevel(undefined as any, 'free')).toBe(false);
    });
  });

  describe('getUserAccessLevel', () => {
    const mockUser = {
      app_metadata: { role: 'admin' },
      subscription_tier: 'premium',
    };

    it('should return editor_admin for admin role', () => {
      const user = { ...mockUser, app_metadata: { role: 'admin' } };
      expect(getUserAccessLevel(user as any)).toBe('editor_admin');
    });

    it('should return editor_admin for editor role', () => {
      const user = { ...mockUser, app_metadata: { role: 'editor' } };
      expect(getUserAccessLevel(user as any)).toBe('editor_admin');
    });

    it('should return premium for premium subscription', () => {
      const user = {
        app_metadata: { role: 'practitioner' },
        subscription_tier: 'premium',
      };
      expect(getUserAccessLevel(user as any)).toBe('premium');
    });

    it('should return free for free subscription', () => {
      const user = {
        app_metadata: { role: 'practitioner' },
        subscription_tier: 'free',
      };
      expect(getUserAccessLevel(user as any)).toBe('free');
    });

    it('should return public for anonymous users', () => {
      expect(getUserAccessLevel(null)).toBe('public');
      expect(getUserAccessLevel(undefined)).toBe('public');
    });

    it('should default to public for users without metadata', () => {
      expect(getUserAccessLevel({} as any)).toBe('public');
    });
  });

  describe('validateAccessLevel', () => {
    it('should return true for valid access levels', () => {
      expect(validateAccessLevel('public')).toBe(true);
      expect(validateAccessLevel('free')).toBe(true);
      expect(validateAccessLevel('premium')).toBe(true);
      expect(validateAccessLevel('editor_admin')).toBe(true);
    });

    it('should return false for invalid access levels', () => {
      expect(validateAccessLevel('admin')).toBe(false);
      expect(validateAccessLevel('paying')).toBe(false);
      expect(validateAccessLevel('invalid')).toBe(false);
      expect(validateAccessLevel('')).toBe(false);
      expect(validateAccessLevel(null as any)).toBe(false);
    });
  });

  describe('getAccessLevelHierarchy', () => {
    it('should return all levels user has access to', () => {
      expect(getAccessLevelHierarchy('public')).toEqual(['public']);
      expect(getAccessLevelHierarchy('free')).toEqual(['public', 'free']);
      expect(getAccessLevelHierarchy('premium')).toEqual(['public', 'free', 'premium']);
      expect(getAccessLevelHierarchy('editor_admin')).toEqual([
        'public',
        'free',
        'premium',
        'editor_admin',
      ]);
    });

    it('should return empty array for invalid levels', () => {
      expect(getAccessLevelHierarchy('invalid')).toEqual([]);
    });
  });
});
