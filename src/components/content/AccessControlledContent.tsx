// ABOUTME: Component for displaying content with access control checks and upgrade prompts

import React from 'react';
import { Lock, Star, Crown, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuthStore } from '../../store/auth';
import { getUserAccessLevel, hasAccessLevel, type AccessLevel } from '../../lib/accessControl';

interface AccessControlledContentProps {
  children: React.ReactNode;
  requiredLevel: AccessLevel;
  onUpgradeClick?: (requiredLevel: AccessLevel) => void;
  accessDeniedComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  showPreview?: boolean;
  previewHeight?: string;
}

const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center p-8" data-testid="access-loading">
    <div className="text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Verificando acesso...</p>
    </div>
  </div>
);

const getAccessLevelInfo = (level: AccessLevel) => {
  switch (level) {
    case 'free':
      return {
        title: 'Conteúdo Exclusivo',
        description: 'Este conteúdo requer uma conta gratuita',
        icon: Star,
        buttonText: 'Fazer Login',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
      };
    case 'premium':
      return {
        title: 'Conteúdo Premium',
        description: 'Acesso exclusivo para assinantes Premium',
        icon: Crown,
        buttonText: 'Upgrade para Premium',
        buttonClass:
          'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
      };
    case 'editor_admin':
      return {
        title: 'Conteúdo Administrativo',
        description: 'Acesso restrito para editores e administradores',
        icon: Shield,
        buttonText: 'Acesso Restrito',
        buttonClass: 'bg-gray-600 hover:bg-gray-700',
      };
    default:
      return {
        title: 'Conteúdo Restrito',
        description: 'Acesso limitado',
        icon: Lock,
        buttonText: 'Acessar',
        buttonClass: 'bg-gray-600 hover:bg-gray-700',
      };
  }
};

export const AccessControlledContent: React.FC<AccessControlledContentProps> = ({
  children,
  requiredLevel,
  onUpgradeClick,
  accessDeniedComponent,
  loadingComponent = <DefaultLoadingComponent />,
  showPreview = false,
  previewHeight = '200px',
}) => {
  const { user, isLoading } = useAuthStore();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Check user's access level
  const userAccessLevel = getUserAccessLevel(user);
  const canAccess = hasAccessLevel(userAccessLevel, requiredLevel);

  // If user has access, show content
  if (canAccess) {
    return <>{children}</>;
  }

  // If custom access denied component is provided, use it
  if (accessDeniedComponent) {
    return <>{accessDeniedComponent}</>;
  }

  // Show upgrade prompt based on required level
  const levelInfo = getAccessLevelInfo(requiredLevel);
  const IconComponent = levelInfo.icon;

  return (
    <div className="relative" role="region" aria-label="Acesso negado" aria-live="polite">
      {showPreview && (
        <div
          className="relative overflow-hidden mb-4"
          style={{ height: previewHeight }}
          data-testid="content-preview"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white z-10" />
          <div className="blur-sm opacity-40">{children}</div>
        </div>
      )}

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-gray-100 rounded-full">
              <IconComponent className="h-8 w-8 text-gray-600" data-testid="lock-icon" />
            </div>
          </div>
          <CardTitle className="text-xl">{levelInfo.title}</CardTitle>
          <CardDescription className="text-gray-600">{levelInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge variant="secondary" className="mb-4">
            Nível requerido: {requiredLevel}
          </Badge>

          {onUpgradeClick && (
            <Button
              onClick={() => onUpgradeClick(requiredLevel)}
              className={`w-full text-white ${levelInfo.buttonClass}`}
            >
              {levelInfo.buttonText}
            </Button>
          )}

          {!onUpgradeClick && (
            <Button className={`w-full text-white ${levelInfo.buttonClass}`}>
              {levelInfo.buttonText}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
