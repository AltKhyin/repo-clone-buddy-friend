// ABOUTME: Hook for checking user access to pages with configurable defaults and redirect handling

import { useMemo } from 'react';
import { useAuthStore } from '../../src/store/auth';
import { usePageAccessQuery } from './usePageAccessQuery';
import { hasAccessLevel, getUserAccessLevel, type AccessLevel } from '../../src/lib/accessControl';

export interface PageAccessControlOptions {
  defaultRequiredLevel?: AccessLevel;
  defaultRedirectUrl?: string;
}

export interface PageAccessControlResult {
  hasAccess: boolean;
  isLoading: boolean;
  userAccessLevel: AccessLevel;
  requiredAccessLevel: AccessLevel;
  redirectUrl: string | null;
  pageConfig: any | null;
}

/**
 * Hook to check if current user has access to a specific page
 * @param pagePath The page path to check access for
 * @param options Configuration options for defaults
 * @returns Access control result with redirect information
 */
export const usePageAccessControl = (
  pagePath: string,
  options: PageAccessControlOptions = {}
): PageAccessControlResult => {
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: pageConfig, isLoading: pageConfigLoading } = usePageAccessQuery(pagePath);

  const { defaultRequiredLevel = 'public', defaultRedirectUrl = '/login' } = options;

  const result = useMemo(() => {
    // Still loading
    if (authLoading || pageConfigLoading) {
      return {
        hasAccess: false,
        isLoading: true,
        userAccessLevel: 'public' as AccessLevel,
        requiredAccessLevel: 'public' as AccessLevel,
        redirectUrl: null,
        pageConfig: null,
      };
    }

    // Get user's access level
    const userAccessLevel = getUserAccessLevel(user);

    // Get required access level (from config or default)
    const requiredAccessLevel = pageConfig?.required_access_level || defaultRequiredLevel;

    // Check if user has sufficient access
    const hasAccess = hasAccessLevel(userAccessLevel, requiredAccessLevel);

    // Determine redirect URL if access denied
    let redirectUrl: string | null = null;
    if (!hasAccess) {
      redirectUrl = pageConfig?.redirect_url || defaultRedirectUrl;
    }

    return {
      hasAccess,
      isLoading: false,
      userAccessLevel,
      requiredAccessLevel,
      redirectUrl,
      pageConfig,
    };
  }, [authLoading, pageConfigLoading, user, pageConfig, defaultRequiredLevel, defaultRedirectUrl]);

  return result;
};
