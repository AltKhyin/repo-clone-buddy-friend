// ABOUTME: Reusable inspector section component with consistent styling and optional collapsible behavior

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface InspectorSectionProps {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  compact?: boolean;
}

export const InspectorSection = React.memo(function InspectorSection({
  title,
  icon: Icon,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className,
  compact = false
}: InspectorSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon 
              size={compact ? 14 : 16} 
              className="text-muted-foreground" 
            />
          )}
          <h3 className={cn(
            'font-medium tracking-tight',
            compact ? 'text-xs uppercase' : 'text-sm'
          )}>
            {title}
          </h3>
        </div>
        
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-6 w-6 p-0"
          >
            {isCollapsed ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </Button>
        )}
      </div>

      {/* Separator */}
      {!compact && <Separator />}

      {/* Section Content */}
      {!isCollapsed && (
        <div className={cn(
          'space-y-3',
          compact && 'space-y-2'
        )}>
          {children}
        </div>
      )}
    </div>
  );
});