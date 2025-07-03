// ABOUTME: Universal route protection component using centralized configuration
/* eslint-disable react-refresh/only-export-components */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getUserAccessLevel, hasAccessLevel, type AccessLevel } from '@/lib/accessControl';
import { getRouteProtection, isPublicRoute } from '@/config/routeProtection';

interface UniversalRouteProtectionProps {
  children: React.ReactNode;

  // Override options (optional - config takes precedence)
  requiredLevel?: AccessLevel;
  redirectUrl?: string;

  // UI customization
  loadingComponent?: React.ReactNode;
  showDebugInfo?: boolean;
}

const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Verificando acesso...</p>
    </div>
  </div>
);

export const UniversalRouteProtection: React.FC<UniversalRouteProtectionProps> = ({
  children,
  requiredLevel,
  redirectUrl,
  loadingComponent = <DefaultLoadingComponent />,
  showDebugInfo = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    // Don't check while auth is still loading
    if (authLoading) return;

    const currentPath = location.pathname;
    // Remove leading slash to match config format
    const normalizedPath = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;

    // Check if route is public (no protection needed)
    if (isPublicRoute(currentPath)) {
      if (showDebugInfo) {
        console.log('🌐 Universal Route Protection: Public route, no check needed:', currentPath);
      }
      return;
    }

    // Get protection config from centralized source (try both formats)
    const routeConfig = getRouteProtection(normalizedPath) || getRouteProtection(currentPath);

    // Determine required access level (config takes precedence over props)
    const finalRequiredLevel = routeConfig?.requiredLevel || requiredLevel || 'public';
    const finalRedirectUrl = routeConfig?.redirectUrl || redirectUrl || '/login';

    if (showDebugInfo) {
      console.log('🔒 Universal Route Protection Debug:', {
        path: currentPath,
        configFound: !!routeConfig,
        requiredLevel: finalRequiredLevel,
        redirectUrl: finalRedirectUrl,
        user: !!user,
        session: !!session,
      });
    }

    // Check authentication requirement
    const needsAuthentication = finalRequiredLevel !== 'public';

    if (needsAuthentication && (!user || !session)) {
      if (showDebugInfo) {
        console.log(
          '🚫 Universal Route Protection: Authentication required, redirecting to:',
          finalRedirectUrl
        );
      }
      navigate(finalRedirectUrl, { replace: true });
      return;
    }

    // Check authorization (access level)
    if (user) {
      const userAccessLevel = getUserAccessLevel(user);
      const hasAccess = hasAccessLevel(userAccessLevel, finalRequiredLevel);

      if (showDebugInfo) {
        console.log('🔐 Universal Route Protection: Access check:', {
          userLevel: userAccessLevel,
          requiredLevel: finalRequiredLevel,
          hasAccess,
        });
      }

      if (!hasAccess) {
        if (showDebugInfo) {
          console.log(
            '🚫 Universal Route Protection: Insufficient access level, redirecting to:',
            finalRedirectUrl
          );
        }
        navigate(finalRedirectUrl, { replace: true });
        return;
      }
    }

    if (showDebugInfo) {
      console.log('✅ Universal Route Protection: Access granted for:', currentPath);
    }
  }, [
    authLoading,
    location.pathname,
    user,
    session,
    requiredLevel,
    redirectUrl,
    navigate,
    showDebugInfo,
  ]);

  // Show loading while auth is loading
  if (authLoading) {
    return <>{loadingComponent}</>;
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * HOC version for easier integration
 */
export function withUniversalProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<UniversalRouteProtectionProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <UniversalRouteProtection {...options}>
        <Component {...props} />
      </UniversalRouteProtection>
    );
  };
}
