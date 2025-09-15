// ABOUTME: Simple PWA installation row for notification dropdown with minimal intrusion

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallNotificationProps {
  onAction?: () => void;
}

export const PWAInstallNotification = ({ onAction }: PWAInstallNotificationProps) => {
  const {
    shouldShowNotification,
    installMethod,
    deviceInfo,
    showInstallPrompt,
    handleDismissNotification,
    isStandalone
  } = usePWA();

  // Don't render if shouldn't show notification or already installed
  if (!shouldShowNotification || isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (installMethod === 'native') {
      await showInstallPrompt();
    }
    handleDismissNotification();
    onAction?.();
  };

  // Only Android mobile devices will see this component
  const icon = <Download className="h-4 w-4 text-blue-500" />;
  const title = "Instalar como App";
  const message = "Acesso mais rápido ao Reviews";

  return (
    <div
      onClick={handleClick}
      className="p-4 sm:p-3 rounded-lg sm:rounded-md hover:bg-muted/50 transition-colors cursor-pointer touch-target-44"
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-4 sm:gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1 sm:mt-0.5">
          <div className="p-1 sm:p-0">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-base sm:text-sm font-medium">
            {title}
          </p>
          <p className="text-sm sm:text-xs text-muted-foreground mt-2 sm:mt-1 leading-relaxed sm:leading-normal">
            {message}
          </p>
          <div className="flex items-center gap-3 sm:gap-2 mt-3 sm:mt-2">
            <Badge variant="outline" className="text-xs px-2 py-1 sm:px-1.5 sm:py-0.5">
              App
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};