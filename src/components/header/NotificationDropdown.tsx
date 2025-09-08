// ABOUTME: Clean and minimal notification dropdown with infinite scroll and mark as read functionality.

import React, { useEffect, useRef } from 'react';
import { X, MessageCircle, Heart, FileText, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  useNotifications, 
  useMarkNotificationsRead,
  type Notification,
  type NotificationType
} from '../../../packages/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'comment_reply':
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case 'post_like':
    case 'comment_like':
      return <Heart className="h-4 w-4 text-red-500" />;
    case 'new_review':
      return <FileText className="h-4 w-4 text-green-500" />;
    case 'admin_custom':
      return <Bell className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationTypeLabel = (type: NotificationType) => {
  switch (type) {
    case 'comment_reply':
      return 'Resposta';
    case 'post_like':
      return 'Like em Post';
    case 'comment_like':
      return 'Like em Comentário';
    case 'new_review':
      return 'Nova Revisão';
    case 'admin_custom':
      return 'Administração';
    default:
      return 'Notificação';
  }
};

export const NotificationDropdown = ({ isOpen, onClose }: NotificationDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    data: notificationData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useNotifications({ includeRead: true });

  const markAsReadMutation = useMarkNotificationsRead();

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unread_count || 0;

  // Mark all unread notifications as read when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      if (unreadIds.length > 0) {
        markAsReadMutation.mutate(unreadIds);
      }
    }
  }, [isOpen, notifications, markAsReadMutation]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle infinite scroll
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };


  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-lg z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-medium">Notificações</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea 
        className="h-96" 
        onScrollCapture={handleScroll}
      >
        <div className="p-2">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>Nenhuma notificação ainda</p>
              <p className="text-xs mt-1">Você receberá notificações de likes e comentários aqui</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
              
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  Carregando mais...
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  formatTimeAgo: (dateString: string) => string;
}

const NotificationItem = ({
  notification,
  formatTimeAgo
}: NotificationItemProps) => {
  return (
    <div
      className={`p-3 rounded-md hover:bg-muted/50 transition-colors ${
        !notification.is_read ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {getNotificationTypeLabel(notification.type)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};