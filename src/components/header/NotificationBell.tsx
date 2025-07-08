// ABOUTME: Notification bell icon component for future notification system with badge support.

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationBellProps {
  hasNotifications?: boolean;
  notificationCount?: number;
  className?: string;
}

export const NotificationBell = ({
  hasNotifications = false,
  notificationCount = 0,
  className,
}: NotificationBellProps) => {
  const handleClick = () => {
    // TODO: Implement notification system
    console.log('Notifications clicked - future implementation');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={`h-8 w-8 text-muted-foreground hover:text-foreground transition-colors relative ${className}`}
    >
      <Bell className="h-4 w-4" />

      {/* Notification badge - for future implementation */}
      {hasNotifications && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
          {notificationCount > 0 && notificationCount < 10 && (
            <span className="text-[10px] text-destructive-foreground font-medium">
              {notificationCount}
            </span>
          )}
          {notificationCount >= 10 && (
            <span className="text-[8px] text-destructive-foreground font-medium">9+</span>
          )}
        </span>
      )}
    </Button>
  );
};
