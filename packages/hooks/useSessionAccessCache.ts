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
  const userId = user?.id;

  return useQuery<SessionAccessData>({
    queryKey: ['session-access-cache', userId],
    queryFn: async () => {
      // Batch fetch all page access rules in one request
      const response = await invokeFunctionGet<{rules: PageAccessRule[], cached_at: string, count: number}>('batch-page-access-rules', {});
      
      // Calculate user access level (done once per session)
      let userAccessLevel: AccessLevel = 'public';
      if (user) {
        // Check role from JWT claims or user metadata
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
        userAccessLevel,
        pageRules: response?.rules || [],
        cacheTimestamp: Date.now()
      };
    },
    // Aggressive caching - only invalidate on auth changes
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes  
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Always enabled - fetch access rules for all users (including public)
    enabled: true,
  });
};

/**
 * Fast local access check using cached data
 * No API calls - pure memory lookup
 */
export const useQuickAccessCheck = (pagePath: string) => {
  const { data: cacheData, isLoading } = useSessionAccessCache();
  
  if (isLoading || !cacheData) {
    return {
      hasAccess: false,
      isLoading: true,
      userAccessLevel: 'public' as AccessLevel,
      requiredAccessLevel: 'public' as AccessLevel,
      redirectUrl: '/login',
    };
  }

  // Find rule for this page (fast array lookup - already in memory)
  const pageRule = cacheData.pageRules.find(rule => 
    rule.page_path === pagePath && rule.is_active
  );

  const requiredAccessLevel = pageRule?.required_access_level || 'public';
  const redirectUrl = pageRule?.redirect_url || '/login';
  
  // Fast access level comparison (no database calls)
  const hasAccess = hasAccessLevelLocal(cacheData.userAccessLevel, requiredAccessLevel);

  return {
    hasAccess,
    isLoading: false,
    userAccessLevel: cacheData.userAccessLevel,
    requiredAccessLevel,
    redirectUrl: hasAccess ? null : redirectUrl,
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