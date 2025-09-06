// ABOUTME: Simple editable subscription tier cell with basic Premium/Free selection

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditableSubscriptionCellProps {
  value: string;
  isEditing: boolean;
  isPending?: boolean;
  onValueChange: (newValue: string) => void;
  className?: string;
}

export const EditableSubscriptionCell: React.FC<EditableSubscriptionCellProps> = ({
  value,
  isEditing,
  isPending = false,
  onValueChange,
  className = '',
}) => {
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

  const getSubscriptionBadgeVariant = (tier: string) => {
    return tier === 'premium' ? 'default' : 'secondary';
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={isPending}
          aria-label="Nível de assinatura"
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        {isPending && (
          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
        )}
      </div>
    );
  }

  return (
    <Badge variant={getSubscriptionBadgeVariant(value)} className={className}>
      {getSubscriptionLabel(value)}
    </Badge>
  );
};