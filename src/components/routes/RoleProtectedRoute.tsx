// ABOUTME: Flexible role-based route protection component for multi-role access control

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: string[];
  fallbackPath?: string;
  showLoading?: boolean;
}

export const RoleProtectedRoute = ({ 
  children, 
  requiredRoles,
  fallbackPath = '/acesso-negado',
  showLoading = true
}: RoleProtectedRouteProps) => {
  const { user, session, isLoading } = useAuthStore();
  
  console.log('RoleProtectedRoute state:', { 
    hasUser: !!user, 
    hasSession: !!session,
    isLoading,
    userMetadata: user?.app_metadata,
    userRole: user?.app_metadata?.role,
    requiredRoles 
  });

  // Show loading state while auth is initializing
  if (isLoading && showLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user || !session) {
    console.log('RoleProtectedRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Extract role with multiple fallback mechanisms
  const userRole = user.app_metadata?.role || 
                   session.user?.app_metadata?.role || 
                   user.user_metadata?.role ||
                   'practitioner'; // Default fallback

  console.log('RoleProtectedRoute: Extracted role:', userRole);

  // Check if user has any of the required roles
  if (!requiredRoles.includes(userRole)) {
    console.log('RoleProtectedRoute: Insufficient permissions', { userRole, requiredRoles });
    return <Navigate to={fallbackPath} replace />;
  }

  console.log('RoleProtectedRoute: Access granted');
  return <>{children}</>;
};