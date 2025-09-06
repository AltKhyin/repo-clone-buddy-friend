// ABOUTME: Simple editable subscription time cell showing remaining days with basic inline editing

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface EditableSubscriptionTimeCellProps {
  user: {
    id: string;
    full_name?: string;
    subscription_tier: string;
    subscription_start_date?: string | null;
    subscription_end_date?: string | null;
  };
  isEditing: boolean;
  isPending?: boolean;
  onAdjustTime?: (userId: string, days: number) => void;
  className?: string;
}

export const EditableSubscriptionTimeCell: React.FC<EditableSubscriptionTimeCellProps> = ({
  user,
  isEditing,
  isPending = false,
  onAdjustTime,
  className = '',
}) => {
  const [adjustmentDays, setAdjustmentDays] = useState('');

  const calculateRemainingDays = (): number | null => {
    if (!user.subscription_end_date) return null;
    
    const endDate = new Date(user.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getRemainingDaysColor = (days: number | null): string => {
    if (days === null) return 'text-muted-foreground';
    if (days <= 0) return 'text-red-600';
    if (days <= 3) return 'text-red-500';
    if (days <= 7) return 'text-orange-500';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRemainingDaysBadgeVariant = (days: number | null) => {
    if (days === null) return 'secondary';
    if (days <= 0) return 'destructive';
    if (days <= 3) return 'destructive';
    if (days <= 7) return 'outline';
    return 'secondary';
  };

  const handleTimeAdjustment = () => {
    if (!onAdjustTime) return;
    
    const days = parseInt(adjustmentDays);
    if (isNaN(days) || days === 0) return;
    
    onAdjustTime(user.id, days);
    setAdjustmentDays('');
  };

  const remainingDays = calculateRemainingDays();

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          type="number"
          placeholder="±dias"
          value={adjustmentDays}
          onChange={(e) => setAdjustmentDays(e.target.value)}
          className="w-20 text-xs"
          disabled={isPending}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleTimeAdjustment}
          disabled={!adjustmentDays || adjustmentDays === '0' || isPending}
          className="h-8 px-2"
        >
          <Calendar className="h-3 w-3" />
        </Button>
        {isPending && (
          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
        )}
      </div>
    );
  }

  // Show subscription time info for premium users only
  if (user.subscription_tier !== 'premium') {
    return (
      <span className="text-xs text-muted-foreground">-</span>
    );
  }

  if (remainingDays === null) {
    return (
      <Badge variant="secondary" className="text-xs">
        Sem data
      </Badge>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Badge 
        variant={getRemainingDaysBadgeVariant(remainingDays)} 
        className="text-xs w-fit"
      >
        {remainingDays <= 0 ? 'Expirada' : `${remainingDays} dias`}
      </Badge>
      
      {user.subscription_end_date && (
        <span className={`text-xs ${getRemainingDaysColor(remainingDays)}`}>
          até {new Date(user.subscription_end_date).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
};