// ABOUTME: Read-only component for displaying JWT claims with automatic sync indicators

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import type { RoleDataSource } from '../../../../packages/hooks/useUserManagementQuery';

interface JWTClaimsDisplayProps {
  roleClaim: RoleDataSource;
  subscriptionTierClaim: RoleDataSource;
  className?: string;
}

export const JWTClaimsDisplay: React.FC<JWTClaimsDisplayProps> = ({
  roleClaim,
  subscriptionTierClaim,
  className = '',
}) => {
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'practitioner':
        return 'Praticante';
      default:
        return role;
    }
  };

  const getSubscriptionLabel = (tier: string): string => {
    switch (tier) {
      case 'premium':
        return 'Premium';
      case 'free':
        return 'Gratuito';
      default:
        return tier;
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <Settings className="h-3 w-3 mr-1" />
          {getRoleLabel(roleClaim.value)}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {getSubscriptionLabel(subscriptionTierClaim.value)}
        </Badge>
      </div>
      
      <div className="text-xs text-muted-foreground">
        (Sinc. automática)
      </div>
      
      <div className="text-xs text-muted-foreground opacity-75">
        Fonte: {roleClaim.source}
      </div>
    </div>
  );
};