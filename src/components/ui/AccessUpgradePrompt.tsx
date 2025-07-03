// ABOUTME: Component to display upgrade prompts when content is filtered by access level

import React from 'react';
import { Crown, Star, Lock } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import type { ContentFilterStatistics } from '../../hooks/useContentAccessFilter';

interface AccessUpgradePromptProps {
  filteredCount: number;
  statistics: ContentFilterStatistics;
  userAccessLevel?: string;
  onUpgradeClick?: () => void;
  onLoginClick?: () => void;
}

export const AccessUpgradePrompt: React.FC<AccessUpgradePromptProps> = ({
  filteredCount,
  statistics,
  userAccessLevel = 'public',
  onUpgradeClick,
  onLoginClick,
}) => {
  if (filteredCount === 0) return null;

  // For anonymous users, show login prompt
  if (userAccessLevel === 'public' && statistics.byAccessLevel.free > 0) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50" data-testid="access-upgrade-prompt">
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center mb-2">
            <Star className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-lg text-blue-900">Faça login para ver mais conteúdo</CardTitle>
          <CardDescription className="text-blue-700">
            {statistics.byAccessLevel.free > 0 && (
              <span>{statistics.byAccessLevel.free} reviews exclusivos para usuários</span>
            )}
            {statistics.byAccessLevel.premium > 0 && statistics.byAccessLevel.free > 0 && ' • '}
            {statistics.byAccessLevel.premium > 0 && (
              <span>{statistics.byAccessLevel.premium} reviews premium</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-0">
          <Button onClick={onLoginClick} className="bg-blue-600 hover:bg-blue-700 text-white">
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // For free users, show premium upgrade prompt
  if (userAccessLevel === 'free' && statistics.byAccessLevel.premium > 0) {
    return (
      <Card
        className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50"
        data-testid="access-upgrade-prompt"
      >
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center mb-2">
            <Crown className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-lg text-purple-900">
            {statistics.byAccessLevel.premium} review
            {statistics.byAccessLevel.premium > 1 ? 's' : ''} premium disponível
            {statistics.byAccessLevel.premium > 1 ? 'is' : ''}
          </CardTitle>
          <CardDescription className="text-purple-700">
            Desbloqueie acesso a conteúdo exclusivo e análises aprofundadas
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-0">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Premium
            </Badge>
            <Badge variant="outline" className="border-purple-200 text-purple-600">
              +{statistics.byAccessLevel.premium} reviews
            </Badge>
          </div>
          <Button
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Upgrade para Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  // For other cases (e.g., premium users missing admin content)
  if (statistics.byAccessLevel.editor_admin > 0) {
    return (
      <Card className="mb-6 border-gray-200 bg-gray-50" data-testid="access-upgrade-prompt">
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle className="text-lg text-gray-900">Conteúdo Administrativo Restrito</CardTitle>
          <CardDescription className="text-gray-700">
            {statistics.byAccessLevel.editor_admin} review
            {statistics.byAccessLevel.editor_admin > 1 ? 's' : ''} disponível
            {statistics.byAccessLevel.editor_admin > 1 ? 'is' : ''} apenas para editores
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return null;
};
