// ABOUTME: Critical access control business logic tests - strategic testing for 4-tier security system
import { describe, it, expect } from 'vitest';
import {
  hasAccessLevel,
  getUserAccessLevel,
  validateAccessLevel,
  getAccessLevelHierarchy,
  ACCESS_LEVELS,
} from './accessControl';

describe('AccessControl - Critical Security Business Logic', () => {
  describe('hasAccessLevel - Permission Checking', () => {
    it('grants access when user level meets requirement', () => {
      expect(hasAccessLevel('premium', 'free')).toBe(true);
      expect(hasAccessLevel('editor_admin', 'premium')).toBe(true);
      expect(hasAccessLevel('free', 'public')).toBe(true);
    });

    it('denies access when user level is insufficient', () => {
      expect(hasAccessLevel('public', 'premium')).toBe(false);
      expect(hasAccessLevel('free', 'editor_admin')).toBe(false);
      expect(hasAccessLevel('premium', 'editor_admin')).toBe(false);
    });

    it('handles null and undefined values securely', () => {
      expect(hasAccessLevel(null, 'premium')).toBe(false);
      expect(hasAccessLevel('premium', null)).toBe(false);
      expect(hasAccessLevel(undefined, 'free')).toBe(false);
      expect(hasAccessLevel('free', undefined)).toBe(false);
    });

    it('handles invalid access levels securely', () => {
      expect(hasAccessLevel('invalid', 'premium')).toBe(false);
      expect(hasAccessLevel('premium', 'invalid')).toBe(false);
      expect(hasAccessLevel('', 'premium')).toBe(false);
    });

    it('allows same-level access', () => {
      expect(hasAccessLevel('public', 'public')).toBe(true);
      expect(hasAccessLevel('free', 'free')).toBe(true);
      expect(hasAccessLevel('premium', 'premium')).toBe(true);
      expect(hasAccessLevel('editor_admin', 'editor_admin')).toBe(true);
    });
  });

  describe('getUserAccessLevel - User Level Determination', () => {
    it('returns editor_admin for admin users', () => {
      const adminUser = { app_metadata: { role: 'admin' } };
      expect(getUserAccessLevel(adminUser)).toBe('editor_admin');
    });

    it('returns editor_admin for editor users', () => {
      const editorUser = { app_metadata: { role: 'editor' } };
      expect(getUserAccessLevel(editorUser)).toBe('editor_admin');
    });

    it('returns premium for premium subscribers', () => {
      const premiumUser = { subscription_tier: 'premium' };
      expect(getUserAccessLevel(premiumUser)).toBe('premium');
    });

    it('returns free for free subscribers', () => {
      const freeUser = { subscription_tier: 'free' };
      expect(getUserAccessLevel(freeUser)).toBe('free');
    });

    it('returns public for null/undefined users', () => {
      expect(getUserAccessLevel(null)).toBe('public');
      expect(getUserAccessLevel(undefined)).toBe('public');
    });

    it('returns public for users without subscription info', () => {
      const anonymousUser = {};
      expect(getUserAccessLevel(anonymousUser)).toBe('public');
    });

    it('prioritizes admin/editor role over subscription tier', () => {
      const adminWithPremium = {
        app_metadata: { role: 'admin' },
        subscription_tier: 'premium',
      };
      expect(getUserAccessLevel(adminWithPremium)).toBe('editor_admin');
    });

    it('handles alternative role property location', () => {
      const userWithDirectRole = { role: 'editor' };
      expect(getUserAccessLevel(userWithDirectRole)).toBe('editor_admin');
    });
  });

  describe('validateAccessLevel - Level Validation', () => {
    it('validates all 4 valid access levels', () => {
      expect(validateAccessLevel('public')).toBe(true);
      expect(validateAccessLevel('free')).toBe(true);
      expect(validateAccessLevel('premium')).toBe(true);
      expect(validateAccessLevel('editor_admin')).toBe(true);
    });

    it('rejects invalid access levels', () => {
      expect(validateAccessLevel('invalid')).toBe(false);
      expect(validateAccessLevel('administrator')).toBe(false);
      expect(validateAccessLevel('user')).toBe(false);
    });

    it('rejects null and undefined values', () => {
      expect(validateAccessLevel(null)).toBe(false);
      expect(validateAccessLevel(undefined)).toBe(false);
      expect(validateAccessLevel('')).toBe(false);
    });
  });

  describe('getAccessLevelHierarchy - Hierarchical Access', () => {
    it('returns correct hierarchy for public level', () => {
      const hierarchy = getAccessLevelHierarchy('public');
      expect(hierarchy).toEqual(['public']);
    });

    it('returns correct hierarchy for free level', () => {
      const hierarchy = getAccessLevelHierarchy('free');
      expect(hierarchy).toEqual(['public', 'free']);
    });

    it('returns correct hierarchy for premium level', () => {
      const hierarchy = getAccessLevelHierarchy('premium');
      expect(hierarchy).toEqual(['public', 'free', 'premium']);
    });

    it('returns correct hierarchy for editor_admin level', () => {
      const hierarchy = getAccessLevelHierarchy('editor_admin');
      expect(hierarchy).toEqual(['public', 'free', 'premium', 'editor_admin']);
    });

    it('returns empty array for invalid levels', () => {
      expect(getAccessLevelHierarchy('invalid')).toEqual([]);
      expect(getAccessLevelHierarchy('')).toEqual([]);
    });
  });

  describe('ACCESS_LEVELS - Security Constants', () => {
    it('maintains correct hierarchical order', () => {
      expect(ACCESS_LEVELS.public).toBe(0);
      expect(ACCESS_LEVELS.free).toBe(1);
      expect(ACCESS_LEVELS.premium).toBe(2);
      expect(ACCESS_LEVELS.editor_admin).toBe(3);
    });

    it('has exactly 4 security levels', () => {
      expect(Object.keys(ACCESS_LEVELS)).toHaveLength(4);
    });

    it('contains no duplicate values', () => {
      const values = Object.values(ACCESS_LEVELS);
      const uniqueValues = [...new Set(values)];
      expect(values).toHaveLength(uniqueValues.length);
    });
  });
});
