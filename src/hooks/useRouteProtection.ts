// ABOUTME: Hook for route-level access control with automatic redirect capabilities

import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageAccessControl } from '../../packages/hooks/usePageAccessControl';
import type { AccessLevel } from '../lib/accessControl';
import type { PageAccessControl } from '../../packages/hooks/usePageAccessQuery';

interface RouteProtectionOptions {
  requiredLevel?: AccessLevel;
  redirectUrl?: string;
  autoRedirect?: boolean;
}

interface RouteProtectionResult {
  isAllowed: boolean;
  isLoading: boolean;
  shouldRedirect: boolean;
  redirectUrl: string | null;
  userAccessLevel: AccessLevel;
  requiredAccessLevel: AccessLevel;
  pageConfig: PageAccessControl | null;
}

/**
 * Hook for protecting routes with automatic redirect capabilities
 * @param options Configuration options for route protection
 * @returns Route protection result with access information
 */
export const useRouteProtection = (options: RouteProtectionOptions = {}): RouteProtectionResult => {
  const { requiredLevel, redirectUrl, autoRedirect = false } = options;
  const location = useLocation();
  const navigate = useNavigate();

  const accessControl = usePageAccessControl(location.pathname, {
    defaultRequiredLevel: requiredLevel,
    defaultRedirectUrl: redirectUrl,
  });

  // Handle automatic redirect if enabled
  useEffect(() => {
    if (
      autoRedirect &&
      !accessControl.isLoading &&
      !accessControl.hasAccess &&
      accessControl.redirectUrl
    ) {
      navigate(accessControl.redirectUrl);
    }
  }, [
    autoRedirect,
    accessControl.isLoading,
    accessControl.hasAccess,
    accessControl.redirectUrl,
    navigate,
  ]);

  const result = useMemo((): RouteProtectionResult => {
    return {
      isAllowed: accessControl.hasAccess,
      isLoading: accessControl.isLoading,
      shouldRedirect: !accessControl.isLoading && !accessControl.hasAccess,
      redirectUrl: accessControl.redirectUrl,
      userAccessLevel: accessControl.userAccessLevel,
      requiredAccessLevel: accessControl.requiredAccessLevel,
      pageConfig: accessControl.pageConfig,
    };
  }, [
    accessControl.hasAccess,
    accessControl.isLoading,
    accessControl.redirectUrl,
    accessControl.userAccessLevel,
    accessControl.requiredAccessLevel,
    accessControl.pageConfig,
  ]);

  return result;
};
