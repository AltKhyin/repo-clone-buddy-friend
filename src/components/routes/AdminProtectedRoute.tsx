
// ABOUTME: Route protection component for admin-only pages with role-based access control and enhanced debugging

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const AdminProtectedRoute = ({ 
  children, 
  requiredRoles = ['admin', 'editor'] 
}: AdminProtectedRouteProps) => {
  const { user, session, isLoading } = useAuthStore();
  
  console.log('AdminProtectedRoute state:', { 
    hasUser: !!user, 
    hasSession: !!session,
    isLoading,
    userMetadata: user?.app_metadata,
    userRole: user?.app_metadata?.role,
    requiredRoles 
  });

  // Show loading state while auth is initializing
  if (isLoading) {
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
    console.log('AdminProtectedRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Extract role with multiple fallback mechanisms
  const userRole = user.app_metadata?.role || 
                   session.user?.app_metadata?.role || 
                   user.user_metadata?.role ||
                   'practitioner'; // Default fallback

  console.log('AdminProtectedRoute: Extracted role:', userRole);

  // Check if user has required role
  if (!requiredRoles.includes(userRole)) {
    console.log('AdminProtectedRoute: Insufficient permissions', { userRole, requiredRoles });
    return <Navigate to="/acesso-negado" replace />;
  }

  console.log('AdminProtectedRoute: Access granted');
  return <>{children}</>;
};
