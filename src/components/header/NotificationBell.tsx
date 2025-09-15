// ABOUTME: Notification bell component with live notification count and dropdown for authenticated users only.

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useNotificationCount } from '../../../packages/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { usePWA } from '@/hooks/usePWA';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = ({ className }: NotificationBellProps) => {
  const { user } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Only fetch notifications if user is authenticated
  const { data: countData, isLoading } = useNotificationCount();
  const regularUnreadCount = countData?.unread_count || 0;

  // PWA notification dot logic
  const { shouldShowNotificationDot, markNotificationDotSeen } = usePWA();

  // Total unread count includes PWA notification if applicable
  const unreadCount = regularUnreadCount + (shouldShowNotificationDot ? 1 : 0);

  // Don't render notification bell for unauthenticated users
  if (!user) {
    return null;
  }

  const handleClick = () => {
    if (!isDropdownOpen && shouldShowNotificationDot) {
      markNotificationDotSeen();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClose = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={`h-8 w-8 text-muted-foreground hover:text-foreground transition-colors relative ${className}`}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />

        {/* Notification badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-medium min-w-[16px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-orange-300 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Notification Dropdown */}
      {isDropdownOpen && (
        <NotificationDropdown 
          isOpen={isDropdownOpen} 
          onClose={handleClose}
        />
      )}
    </div>
  );
};
