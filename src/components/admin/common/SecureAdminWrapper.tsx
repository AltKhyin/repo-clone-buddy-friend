// ABOUTME: Security-enhanced wrapper for admin components ensuring proper authentication, authorization, and error handling

import React, { ReactNode, useEffect, useState } from 'react';
import { useAdminAuth, isAdminUser, logSecurityEvent } from '../../../utils/adminSecurity';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Shield, AlertTriangle, Lock, User, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SecureAdminWrapperProps {
  children: ReactNode;
  title: string;
  description?: string;
  requiredPermissions?: string[];
  showSecurityStatus?: boolean;
}

export const SecureAdminWrapper = ({
  children,
  title,
  description,
  requiredPermissions = [],
  showSecurityStatus = false,
}: SecureAdminWrapperProps) => {
  const { isAuthenticated, isAdmin, user } = useAdminAuth();
  const navigate = useNavigate();
  const [securityCheck, setSecurityCheck] = useState<'checking' | 'passed' | 'failed'>('checking');

  useEffect(() => {
    // Perform security validation
    const performSecurityCheck = async () => {
      try {
        // Log access attempt
        logSecurityEvent('Admin access attempt', {
          component: title,
          requiredPermissions,
          userAuthenticated: isAuthenticated,
          userAdmin: isAdmin,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });

        // Check authentication
        if (!isAuthenticated) {
          logSecurityEvent('Admin access denied - not authenticated', {
            component: title,
            redirectTo: '/login',
          });
          setSecurityCheck('failed');
          return;
        }

        // Check admin privileges
        if (!isAdmin) {
          logSecurityEvent('Admin access denied - insufficient privileges', {
            component: title,
            userRole: user?.app_metadata?.role,
            requiredRole: 'admin',
          });
          setSecurityCheck('failed');
          return;
        }

        // Check specific permissions if required
        if (requiredPermissions.length > 0) {
          const userPermissions = user?.app_metadata?.permissions || [];
          const hasRequiredPermissions = requiredPermissions.every(permission =>
            userPermissions.includes(permission)
          );

          if (!hasRequiredPermissions) {
            logSecurityEvent('Admin access denied - insufficient permissions', {
              component: title,
              requiredPermissions,
              userPermissions,
            });
            setSecurityCheck('failed');
            return;
          }
        }

        // All security checks passed
        logSecurityEvent('Admin access granted', {
          component: title,
          userId: user?.id,
          userEmail: user?.email,
        });
        setSecurityCheck('passed');
      } catch (error) {
        logSecurityEvent('Security check error', {
          component: title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setSecurityCheck('failed');
      }
    };

    performSecurityCheck();
  }, [isAuthenticated, isAdmin, user, title, requiredPermissions]);

  // Security check loading state
  if (securityCheck === 'checking') {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Validando permissões...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Security check failed - show appropriate error
  if (securityCheck === 'failed') {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>Você não tem permissão para acessar esta área</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                {!isAuthenticated && 'Você precisa estar logado para acessar esta área.'}
                {isAuthenticated && !isAdmin && 'Permissões de administrador são necessárias.'}
                {isAuthenticated &&
                  isAdmin &&
                  requiredPermissions.length > 0 &&
                  'Você não possui as permissões específicas necessárias para esta função.'}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              {!isAuthenticated && (
                <Button onClick={() => navigate('/login')} className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Fazer Login
                </Button>
              )}

              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Security check passed - render admin interface
  return (
    <div className="space-y-6">
      {/* Security Status Header */}
      {showSecurityStatus && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-center justify-between">
              <span>Acesso administrativo ativo</span>
              <div className="flex items-center gap-2 text-xs">
                <span>Usuário: {user?.email}</span>
                <span>•</span>
                <span>Função: {user?.app_metadata?.role}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Seguro</span>
          </div>
        </div>

        {/* Protected Content */}
        {children}
      </div>

      {/* Security Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Área protegida por controle de acesso administrativo</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Higher-order component for securing admin interfaces
 */
export const withAdminSecurity = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    title: string;
    description?: string;
    requiredPermissions?: string[];
    showSecurityStatus?: boolean;
  }
) => {
  return (props: P) => (
    <SecureAdminWrapper {...options}>
      <Component {...props} />
    </SecureAdminWrapper>
  );
};

/**
 * Hook for checking admin permissions at runtime
 */
export const useAdminPermission = (requiredPermissions: string[] = []) => {
  const { isAuthenticated, isAdmin, user } = useAdminAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setHasPermission(false);
      return;
    }

    if (requiredPermissions.length === 0) {
      setHasPermission(true);
      return;
    }

    const userPermissions = user?.app_metadata?.permissions || [];
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    setHasPermission(hasRequiredPermissions);
  }, [isAuthenticated, isAdmin, user, requiredPermissions]);

  return {
    hasPermission,
    isAuthenticated,
    isAdmin,
    user,
  };
};

/**
 * Security context provider for admin interfaces
 */
interface AdminSecurityContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any;
  hasPermission: (permissions: string[]) => boolean;
  logSecurityEvent: (event: string, details: Record<string, any>) => void;
}

const AdminSecurityContext = React.createContext<AdminSecurityContextValue | null>(null);

export const AdminSecurityProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isAdmin, user } = useAdminAuth();

  const hasPermission = (permissions: string[]) => {
    if (!isAuthenticated || !isAdmin) return false;
    if (permissions.length === 0) return true;

    const userPermissions = user?.app_metadata?.permissions || [];
    return permissions.every(permission => userPermissions.includes(permission));
  };

  const value = {
    isAuthenticated,
    isAdmin,
    user,
    hasPermission,
    logSecurityEvent,
  };

  return <AdminSecurityContext.Provider value={value}>{children}</AdminSecurityContext.Provider>;
};

export const useAdminSecurity = () => {
  const context = React.useContext(AdminSecurityContext);
  if (!context) {
    throw new Error('useAdminSecurity must be used within AdminSecurityProvider');
  }
  return context;
};
