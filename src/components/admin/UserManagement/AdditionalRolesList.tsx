// ABOUTME: Component for displaying and managing additional roles from UserRoles table with inline editing

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { RoleDataSource } from '../../../../packages/hooks/useUserManagementQuery';

interface AdditionalRolesListProps {
  roles: Array<RoleDataSource & {
    expires?: string;
    grantedBy?: string;
    grantedAt: string;
  }>;
  isEditing: boolean;
  onRemoveRole: (roleName: string) => void;
  isPending?: boolean;
  className?: string;
}

export const AdditionalRolesList: React.FC<AdditionalRolesListProps> = ({
  roles,
  isEditing,
  onRemoveRole,
  isPending = false,
  className = '',
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isRoleExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (roles.length === 0) {
    return (
      <div className={`space-y-1 ${className}`}>
        <span className="text-xs text-muted-foreground">Nenhum</span>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {roles.map((role, index) => {
        const expired = isRoleExpired(role.expires);
        
        return (
          <div key={index} className="flex items-center gap-1">
            <Badge 
              variant={expired ? "secondary" : "outline"} 
              className={`text-xs ${expired ? 'opacity-60' : ''}`}
            >
              {role.value}
              {expired && ' (Expirado)'}
            </Badge>
            
            {role.expires && !expired && (
              <span className="text-xs text-muted-foreground">
                até {formatDate(role.expires)}
              </span>
            )}
            
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => onRemoveRole(role.value)}
                disabled={isPending}
                title="Remover este papel adicional"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
      
      {isEditing && (
        <div className="text-xs text-muted-foreground mt-1">
          Clique no ❌ para remover papéis adicionais
        </div>
      )}
    </div>
  );
};