
// ABOUTME: Protected route wrapper that handles authentication and authorization without global data dependencies.

import React from 'react';
import ProtectedRoute from '../auth/ProtectedRoute';

interface ProtectedAppRouteProps {
  children: React.ReactNode;
  requiredRole?: 'practitioner' | 'editor' | 'admin';
}

export const ProtectedAppRoute = ({ children, requiredRole = 'practitioner' }: ProtectedAppRouteProps) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      {children}
    </ProtectedRoute>
  );
};
