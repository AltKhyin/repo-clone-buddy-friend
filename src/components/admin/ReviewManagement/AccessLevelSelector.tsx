// ABOUTME: Professional access level selector component with new business requirements (free/premium/admin_editor)
import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Crown, Shield } from 'lucide-react';

interface AccessLevelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

type AccessLevel = {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
};

const accessLevels: AccessLevel[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Visible to everyone, including non-users',
    icon: <Users className="h-4 w-4" data-testid="public-icon" />,
    color: 'text-blue-600',
    badge: 'Public',
  },
  {
    value: 'free',
    label: 'Free Users',
    description: 'Available to all registered users',
    icon: <Users className="h-4 w-4" data-testid="users-icon" />,
    color: 'text-green-600',
  },
  {
    value: 'premium',
    label: 'Premium Users',
    description: 'Requires premium subscription',
    icon: <Crown className="h-4 w-4" data-testid="crown-icon" />,
    color: 'text-amber-600',
    badge: 'Premium',
  },
  {
    value: 'admin',
    label: 'Admin/Editor Only',
    description: 'Restricted to admin and editors',
    icon: <Shield className="h-4 w-4" data-testid="shield-icon" />,
    color: 'text-red-600',
  },
];

export const AccessLevelSelector: React.FC<AccessLevelSelectorProps> = ({
  value,
  onChange,
  label = 'Access Level',
  disabled = false,
  className = '',
}) => {
  const selectedLevel = accessLevels.find(level => level.value === value);

  const getDisplayValue = () => {
    if (!selectedLevel) return 'Select access level';
    return selectedLevel.label;
  };

  const isValidValue = (val: string) => {
    return accessLevels.some(level => level.value === val);
  };

  return (
    <div className={`space-y-2 ${className}`} data-testid="access-level-selector">
      <Label htmlFor="access-level">{label}</Label>

      <Select value={isValidValue(value) ? value : ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="access-level" aria-label="Access Level">
          <SelectValue placeholder="Select access level">{getDisplayValue()}</SelectValue>
        </SelectTrigger>

        <SelectContent>
          {accessLevels.map(level => (
            <TooltipProvider key={level.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SelectItem
                    value={level.value}
                    className="cursor-pointer"
                    data-testid={`access-level-${level.value}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={level.color}>{level.icon}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{level.label}</span>
                          {level.badge && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              data-testid="premium-badge"
                            >
                              {level.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{level.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                </TooltipTrigger>

                <TooltipContent side="right">
                  <div className="max-w-xs">
                    <p className="font-medium">{level.label}</p>
                    <p className="text-sm">{level.description}</p>
                    {level.value === 'admin_editor' && (
                      <p className="text-xs text-yellow-200 mt-1">⚠️ Highly restricted content</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </SelectContent>
      </Select>

      {/* Display current selection details */}
      {selectedLevel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={selectedLevel.color}>{selectedLevel.icon}</div>
          <span>{selectedLevel.description}</span>
          {selectedLevel.badge && (
            <Badge variant="outline" className="text-xs">
              {selectedLevel.badge}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
