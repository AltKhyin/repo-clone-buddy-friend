// ABOUTME: Reusable editable role cell component for unified user management table

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditableRoleCellProps {
  value: string;
  isEditing: boolean;
  isPending?: boolean;
  onValueChange: (newValue: string) => void;
  className?: string;
}

export const EditableRoleCell: React.FC<EditableRoleCellProps> = ({
  value,
  isEditing,
  isPending = false,
  onValueChange,
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

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'destructive' : 'outline';
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="practitioner">Praticante</SelectItem>
          </SelectContent>
        </Select>
        {isPending && (
          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
        )}
      </div>
    );
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors ${className}`}
      title="Ative o modo de edição inline para editar este campo"
    >
      <Badge variant={getRoleBadgeVariant(value)}>
        {getRoleLabel(value)}
      </Badge>
    </div>
  );
};