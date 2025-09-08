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
      return <MessageCircle className="text-blue-500" />;
    case 'post_like':
    case 'comment_like':
      return <Heart className="text-red-500" />;
    case 'new_review':
      return <FileText className="text-green-500" />;
    case 'admin_custom':
      return <Bell className="text-purple-500" />;
    default:
      return <Bell className="text-gray-500" />;
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
      className="fixed sm:absolute 
                 right-2 sm:right-0 
                 top-16 sm:top-full 
                 left-2 sm:left-auto
                 sm:mt-2 
                 w-auto sm:w-80 md:w-96 
                 bg-background border rounded-lg shadow-lg z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="font-medium text-base sm:text-sm">Notificações</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs sm:text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 sm:h-8 sm:w-8 touch-target-44"
          aria-label="Fechar notificações"
        >
          <X className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea 
        className="h-80 sm:h-96 max-h-[60vh] sm:max-h-[70vh] overflow-auto" 
        onScrollCapture={handleScroll}
      >
        <div className="p-3 sm:p-2">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12 sm:py-8 text-base sm:text-sm text-muted-foreground">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-8 text-center px-4">
              <Bell className="h-12 w-12 sm:h-8 sm:w-8 mb-3 sm:mb-2 opacity-50" />
              <p className="text-base sm:text-sm text-muted-foreground font-medium">Nenhuma notificação ainda</p>
              <p className="text-sm sm:text-xs mt-2 sm:mt-1 text-muted-foreground max-w-64">
                Você receberá notificações de likes e comentários aqui
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
              
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-6 sm:py-4 text-base sm:text-sm text-muted-foreground">
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
      className={`p-4 sm:p-3 rounded-lg sm:rounded-md active:bg-muted/70 sm:hover:bg-muted/50 transition-colors touch-target-44 ${
        !notification.is_read ? 'bg-orange-50 border-l-4 sm:border-l-2 border-l-orange-500' : ''
      }`}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-4 sm:gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1 sm:mt-0.5">
          <div className="p-1 sm:p-0">
            {React.cloneElement(getNotificationIcon(notification.type), {
              className: `h-5 w-5 sm:h-4 sm:w-4 ${getNotificationIcon(notification.type).props.className}`
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-base sm:text-sm leading-relaxed sm:leading-normal ${!notification.is_read ? 'font-semibold sm:font-medium' : 'font-medium sm:font-normal'}`}>
            {notification.title}
          </p>
          <p className="text-sm sm:text-xs text-muted-foreground mt-2 sm:mt-1 leading-relaxed sm:leading-normal">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 sm:gap-2 mt-3 sm:mt-2">
            <Badge variant="outline" className="text-xs sm:text-xs px-2 py-1 sm:px-1.5 sm:py-0.5">
              {getNotificationTypeLabel(notification.type)}
            </Badge>
            <span className="text-xs sm:text-xs text-muted-foreground">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};