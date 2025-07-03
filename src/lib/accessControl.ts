// ABOUTME: Core access control utilities for 4-tier hierarchical permission system

export const ACCESS_LEVELS = {
  public: 0,
  free: 1,
  premium: 2,
  editor_admin: 3,
} as const;

export type AccessLevel = keyof typeof ACCESS_LEVELS;

/**
 * Check if user has sufficient access level for required resource
 */
export function hasAccessLevel(
  userLevel: string | null | undefined,
  requiredLevel: string | null | undefined
): boolean {
  if (!userLevel || !requiredLevel) return false;

  const userLevelNum = ACCESS_LEVELS[userLevel as AccessLevel];
  const requiredLevelNum = ACCESS_LEVELS[requiredLevel as AccessLevel];

  if (userLevelNum === undefined || requiredLevelNum === undefined) return false;

  return userLevelNum >= requiredLevelNum;
}

/**
 * Determine user's access level based on role and subscription
 */
export function getUserAccessLevel(user: any): AccessLevel {
  if (!user) return 'public';

  // Admin and Editor roles get highest access
  const role = user.app_metadata?.role || user.role;
  if (role === 'admin' || role === 'editor') {
    return 'editor_admin';
  }

  // Check subscription tier
  const subscriptionTier = user.subscription_tier;
  if (subscriptionTier === 'premium') {
    return 'premium';
  }

  if (subscriptionTier === 'free') {
    return 'free';
  }

  // Default to public for anonymous or unknown users
  return 'public';
}

/**
 * Validate if access level is one of the valid 4-tier levels
 */
export function validateAccessLevel(level: string | null | undefined): boolean {
  if (!level) return false;
  return level in ACCESS_LEVELS;
}

/**
 * Get all access levels that user has access to (hierarchical)
 */
export function getAccessLevelHierarchy(userLevel: string): AccessLevel[] {
  if (!validateAccessLevel(userLevel)) return [];

  const userLevelNum = ACCESS_LEVELS[userLevel as AccessLevel];
  const accessibleLevels: AccessLevel[] = [];

  for (const [level, levelNum] of Object.entries(ACCESS_LEVELS)) {
    if (levelNum <= userLevelNum) {
      accessibleLevels.push(level as AccessLevel);
    }
  }

  return accessibleLevels;
}
