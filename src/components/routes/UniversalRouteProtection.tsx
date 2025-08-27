// ABOUTME: Universal route protection component using centralized configuration
/* eslint-disable react-refresh/only-export-components */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getUserAccessLevel, hasAccessLevel, type AccessLevel } from '@/lib/accessControl';
import { getRouteProtection, isPublicRoute } from '@/config/routeProtection';
import { usePageAccessControl } from '../../../packages/hooks/usePageAccessControl';
import { useProgress } from '@/contexts/ProgressContext';

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
  const { showProgress, hideProgress } = useProgress();
  
  // Track background verification state
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Get dynamic page access control from admin database settings
  const {
    hasAccess: databaseHasAccess,
    isLoading: pageAccessLoading,
    requiredAccessLevel: databaseRequiredLevel,
    redirectUrl: databaseRedirectUrl,
    pageConfig
  } = usePageAccessControl(location.pathname, {
    defaultRequiredLevel: requiredLevel || 'public',
    defaultRedirectUrl: redirectUrl || '/login'
  });

  // Reset verification state when route changes
  useEffect(() => {
    setVerificationComplete(false);
    setAccessDenied(false);
  }, [location.pathname]);

  // Background verification effect
  useEffect(() => {
    const currentPath = location.pathname;

    // Check if route is public (no protection needed)
    if (isPublicRoute(currentPath)) {
      setVerificationComplete(true);
      setAccessDenied(false);
      if (showDebugInfo) {
        console.log('🌐 Universal Route Protection: Public route, no check needed:', currentPath);
      }
      return;
    }

    // Show progress during verification
    const isVerifying = authLoading || pageAccessLoading;
    if (isVerifying) {
      showProgress();
    }

    // Don't proceed with checks while still loading
    if (authLoading || pageAccessLoading) return;

    // PRIORITY: Use database config first, fallback to static config
    let finalRequiredLevel: AccessLevel;
    let finalRedirectUrl: string;

    if (pageConfig) {
      // Database has configuration for this route - use it (admin-controlled)
      finalRequiredLevel = databaseRequiredLevel;
      finalRedirectUrl = databaseRedirectUrl || '/login';
      
      if (showDebugInfo) {
        console.log('🗄️ Using DATABASE config for route protection:', {
          path: currentPath,
          dbRequiredLevel: finalRequiredLevel,
          dbRedirectUrl: finalRedirectUrl,
        });
      }
    } else {
      // Fallback to static config for routes not configured by admin
      const staticConfig = getRouteProtection(currentPath.startsWith('/') ? currentPath.slice(1) : currentPath);
      finalRequiredLevel = staticConfig?.requiredLevel || requiredLevel || 'public';
      finalRedirectUrl = staticConfig?.redirectUrl || redirectUrl || '/login';
      
      if (showDebugInfo) {
        console.log('📄 Using STATIC config fallback for route protection:', {
          path: currentPath,
          staticRequiredLevel: finalRequiredLevel,
          staticRedirectUrl: finalRedirectUrl,
        });
      }
    }

    if (showDebugInfo) {
      console.log('🔒 Universal Route Protection Final Decision:', {
        path: currentPath,
        requiredLevel: finalRequiredLevel,
        redirectUrl: finalRedirectUrl,
        user: !!user,
        session: !!session,
        databaseConfigExists: !!pageConfig,
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
      hideProgress();
      setVerificationComplete(true);
      setAccessDenied(true);
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
        hideProgress();
        setVerificationComplete(true);
        setAccessDenied(true);
        navigate(finalRedirectUrl, { replace: true });
        return;
      }
    }

    // Verification complete and access granted
    hideProgress();
    setVerificationComplete(true);
    setAccessDenied(false);
    
    if (showDebugInfo) {
      console.log('✅ Universal Route Protection: Access granted for:', currentPath);
    }
  }, [
    authLoading,
    pageAccessLoading,
    location.pathname,
    user,
    session,
    requiredLevel,
    redirectUrl,
    navigate,
    showDebugInfo,
    pageConfig,
    databaseRequiredLevel,
    databaseRedirectUrl,
    showProgress,
    hideProgress,
  ]);

  // Only block rendering if access has been explicitly denied
  // (i.e., during redirect phase)
  if (accessDenied) {
    return null; // Briefly blank while redirecting
  }

  // SEAMLESS UX: Always render children immediately
  // Progress bar provides visual feedback during background verification
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
