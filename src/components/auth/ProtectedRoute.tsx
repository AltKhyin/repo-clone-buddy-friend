
// ABOUTME: Enhanced component to protect routes with authentication and role-based access control.
import { useAuthStore } from '@/store/auth';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserProfile } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserProfile['role'];
}

// Role hierarchy: admin > moderator > practitioner
const roleHierarchy: Record<UserProfile['role'], number> = {
  admin: 3,
  moderator: 2,
  practitioner: 1,
  editor: 2, // Same level as moderator
};

const checkRolePermission = (userRole: UserProfile['role'], requiredRole: UserProfile['role']): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

const ProtectedRoute = ({ children, requiredRole = 'practitioner' }: ProtectedRouteProps) => {
  const { session, isLoading } = useAuthStore();
  const location = useLocation();

  console.log('ProtectedRoute state:', { 
    session: !!session, 
    isLoading, 
    requiredRole,
    userRole: session?.user?.app_metadata?.role 
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions for protected routes
  const userRole = (session.user?.app_metadata?.role as UserProfile['role']) || 'practitioner';
  const hasPermission = checkRolePermission(userRole, requiredRole);

  if (!hasPermission) {
    console.log('Insufficient permissions, redirecting to unauthorized');
    return <Navigate to="/unauthorized" state={{ requiredRole, userRole }} replace />;
  }

  console.log('Session and permissions valid, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
