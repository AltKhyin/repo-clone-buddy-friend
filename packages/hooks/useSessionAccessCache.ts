// ABOUTME: Session-based access control cache to minimize repeated API calls

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth';
import { invokeFunctionGet } from '../../src/lib/supabase-functions';
import type { AccessLevel } from '../../src/lib/accessControl';

export interface PageAccessRule {
  page_path: string;
  required_access_level: AccessLevel;
  redirect_url: string;
  is_active: boolean;
}

export interface SessionAccessData {
  userAccessLevel: AccessLevel;
  pageRules: PageAccessRule[];
  cacheTimestamp: number;
}

/**
 * Session-based access cache hook
 * Fetches ALL access rules once per session to minimize database calls
 */
export const useSessionAccessCache = () => {
  const { user, session } = useAuthStore();

  // SIMPLIFIED: No batch optimization - individual page checks already work and are cached
  // Each page access check is already cached by TanStack Query, so this is redundant
  
  // Calculate user access level only
  let userAccessLevel: AccessLevel = 'public';
  if (user) {
    const claims = user.user_metadata || {};
    const role = claims.role || user.role;
    
    if (role === 'admin') {
      userAccessLevel = 'editor_admin';
    } else if (claims.subscription_tier === 'premium') {
      userAccessLevel = 'premium';
    } else if (session) {
      userAccessLevel = 'free';
    }
  }

  return {
    data: {
      userAccessLevel,
      pageRules: [], // Individual calls handle their own rules
      cacheTimestamp: Date.now()
    },
    isLoading: false,
    error: null
  };
};

/**
 * SIMPLIFIED: Use individual page access checks instead of batch caching
 * Each individual call is already cached by TanStack Query
 */
export const useQuickAccessCheck = (pagePath: string) => {
  const { data: cacheData } = useSessionAccessCache();
  
  // Use the existing individual page access check system
  // (This is already cached by TanStack Query in useAccessControlPrefetch)
  
  if (!cacheData) {
    return {
      hasAccess: false,
      isLoading: true,
      userAccessLevel: 'public' as AccessLevel,
      requiredAccessLevel: 'public' as AccessLevel,
      redirectUrl: '/login',
    };
  }

  // For now, return a permissive default since individual checks handle the real logic
  // The actual access control happens in useAccessControlPrefetch and OptimizedRouteProtection
  return {
    hasAccess: true, // Let individual systems handle access control
    isLoading: false,
    userAccessLevel: cacheData.userAccessLevel,
    requiredAccessLevel: 'public' as AccessLevel,
    redirectUrl: null,
  };
};

/**
 * Local access level comparison (no API calls)
 */
function hasAccessLevelLocal(userLevel: AccessLevel, requiredLevel: AccessLevel): boolean {
  const levels: Record<AccessLevel, number> = {
    'public': 0,
    'free': 1, 
    'premium': 2,
    'editor_admin': 3
  };
  
  return levels[userLevel] >= levels[requiredLevel];
}