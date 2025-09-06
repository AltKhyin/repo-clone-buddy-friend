// ABOUTME: Optimized route protection using session-based access cache to minimize API calls

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getUserAccessLevel, type AccessLevel } from '@/lib/accessControl';
import { getRouteProtection, isPublicRoute } from '@/config/routeProtection';
import { useQuickAccessCheck } from '../../../packages/hooks/useSessionAccessCache';
import { useProgress } from '@/contexts/ProgressContext';

interface OptimizedRouteProtectionProps {
  children: React.ReactNode;
  requiredLevel?: AccessLevel;
  redirectUrl?: string;
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

export const OptimizedRouteProtection: React.FC<OptimizedRouteProtectionProps> = ({
  children,
  requiredLevel,
  redirectUrl,
  loadingComponent = <DefaultLoadingComponent />,
  showDebugInfo = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading } = useAuthStore();
  const { showProgress, hideProgress, setProgress } = useProgress();
  
  // Track verification state
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Get cached access check (no API call if cached)
  const {
    hasAccess: cacheHasAccess,
    isLoading: cacheLoading,
    redirectUrl: cacheRedirectUrl,
    userAccessLevel,
    requiredAccessLevel
  } = useQuickAccessCheck(location.pathname);

  // Reset verification state when route changes
  useEffect(() => {
    setVerificationComplete(false);
    setAccessDenied(false);
  }, [location.pathname]);

  // Optimized verification effect
  useEffect(() => {
    const currentPath = location.pathname;

    // Check if route is public (no protection needed)
    if (isPublicRoute(currentPath)) {
      setVerificationComplete(true);
      setAccessDenied(false);
      if (showDebugInfo) {
        console.log('🌐 Optimized Route Protection: Public route, no check needed:', currentPath);
      }
      return;
    }

    // Show progress during verification
    const isVerifying = authLoading || cacheLoading;
    if (isVerifying) {
      showProgress();
      if (authLoading) {
        showProgress({ progress: 15 });
      } else if (cacheLoading) {
        showProgress({ progress: 25 });
      }
    }

    // Don't proceed while still loading
    if (authLoading || cacheLoading) return;

    // PRIORITY: Use cached data first, fallback to static config
    let finalRequiredLevel: AccessLevel;
    let finalRedirectUrl: string;

    if (requiredAccessLevel !== 'public') {
      // Cache has configuration for this route
      finalRequiredLevel = requiredAccessLevel;
      finalRedirectUrl = cacheRedirectUrl || '/login';
      
      if (showDebugInfo) {
        console.log('💾 Using CACHED config for route protection:', {
          path: currentPath,
          cachedRequiredLevel: finalRequiredLevel,
          cachedRedirectUrl: finalRedirectUrl,
          userAccessLevel,
        });
      }
    } else {
      // Fallback to static config
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
      console.log('⚡ Optimized Route Protection Final Decision (NO API CALLS):', {
        path: currentPath,
        requiredLevel: finalRequiredLevel,
        userLevel: userAccessLevel,
        hasAccess: cacheHasAccess,
        redirectUrl: finalRedirectUrl,
        cacheHit: requiredAccessLevel !== 'public',
      });
    }

    // Check authentication requirement
    const needsAuthentication = finalRequiredLevel !== 'public';

    if (needsAuthentication && (!user || !session)) {
      if (showDebugInfo) {
        console.log('🚫 Optimized Route Protection: Authentication required, redirecting to:', finalRedirectUrl);
      }
      setProgress(100);
      setVerificationComplete(true);
      setAccessDenied(true);
      setTimeout(() => hideProgress(), 100);
      navigate(finalRedirectUrl, { replace: true });
      return;
    }

    // Use cached access check result
    if (!cacheHasAccess && needsAuthentication) {
      if (showDebugInfo) {
        console.log('🚫 Optimized Route Protection: Insufficient access (CACHED), redirecting to:', finalRedirectUrl);
      }
      setProgress(100);
      setVerificationComplete(true);
      setAccessDenied(true);
      setTimeout(() => hideProgress(), 100);
      navigate(finalRedirectUrl, { replace: true });
      return;
    }

    // Verification complete and access granted
    setProgress(30);
    setVerificationComplete(true);
    setAccessDenied(false);
    
    if (showDebugInfo) {
      console.log('✅ Optimized Route Protection: Access granted (CACHED) for:', currentPath);
    }
  }, [
    authLoading,
    cacheLoading,
    location.pathname,
    user,
    session,
    requiredLevel,
    redirectUrl,
    navigate,
    showDebugInfo,
    cacheHasAccess,
    cacheRedirectUrl,
    userAccessLevel,
    requiredAccessLevel,
    showProgress,
    hideProgress,
    setProgress,
  ]);

  // Block rendering during redirect
  if (accessDenied) {
    return null;
  }

  // Always render children immediately for seamless UX
  return <>{children}</>;
};

/**
 * HOC version for easier integration
 */
export function withOptimizedProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<OptimizedRouteProtectionProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <OptimizedRouteProtection {...options}>
        <Component {...props} />
      </OptimizedRouteProtection>
    );
  };
}