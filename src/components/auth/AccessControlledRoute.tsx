// ABOUTME: Universal route guard component for 4-tier access control system

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageAccessControl } from '@packages/hooks/usePageAccessControl';
import type { AccessLevel } from '../../lib/accessControl';

interface AccessControlledRouteProps {
  children: React.ReactNode;
  requiredLevel?: AccessLevel;
  redirectUrl?: string;
  loadingComponent?: React.ReactNode;
}

const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Verificando acesso...</p>
    </div>
  </div>
);

export const AccessControlledRoute: React.FC<AccessControlledRouteProps> = ({
  children,
  requiredLevel,
  redirectUrl,
  loadingComponent = <DefaultLoadingComponent />,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const accessControl = usePageAccessControl(location.pathname, {
    defaultRequiredLevel: requiredLevel,
    defaultRedirectUrl: redirectUrl,
  });

  // Handle redirect on access denied
  useEffect(() => {
    if (!accessControl.isLoading && !accessControl.hasAccess) {
      const targetUrl = accessControl.redirectUrl || '/login';
      navigate(targetUrl);
    }
  }, [accessControl.isLoading, accessControl.hasAccess, accessControl.redirectUrl, navigate]);

  // Show loading state
  if (accessControl.isLoading) {
    return <>{loadingComponent}</>;
  }

  // Show nothing while redirecting (access denied)
  if (!accessControl.hasAccess) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
};
