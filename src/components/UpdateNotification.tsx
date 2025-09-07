// ABOUTME: Non-intrusive update notification that prompts users to refresh when new versions are available

import React, { useState } from 'react';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { X, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateNotificationProps {
  /** Custom position for the notification */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Custom class names */
  className?: string;
  /** Whether to show detailed version info */
  showVersionInfo?: boolean;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  position = 'bottom-right',
  className,
  showVersionInfo = false,
}) => {
  const {
    updateAvailable,
    currentVersion,
    latestVersion,
    reloadApp,
    dismissUpdate,
    isChecking,
  } = useVersionCheck({
    checkInterval: 5 * 60 * 1000, // Check every 5 minutes
    checkOnMount: true,
    checkOnFocus: true,
  });

  const [isAnimating, setIsAnimating] = useState(false);

  // Don't render if no update available
  if (!updateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    setIsAnimating(true);
    // Small delay for animation
    setTimeout(() => {
      reloadApp();
    }, 500);
  };

  const handleDismiss = () => {
    dismissUpdate();
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 max-w-sm',
        positionClasses[position],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg border border-border/20 p-4 space-y-3 animate-in slide-in-from-right-full duration-500">
        {/* Header with dismiss button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 flex-shrink-0" />
            <h3 className="font-semibold text-sm">Atualização Disponível</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-0.5 hover:bg-primary-foreground/10 rounded"
            aria-label="Dispensar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm text-primary-foreground/90">
            Uma nova versão está disponível com melhorias e correções.
          </p>
          
          {showVersionInfo && latestVersion && (
            <div className="text-xs text-primary-foreground/70 space-y-1">
              <div>Atual: {currentVersion}</div>
              <div>Nova: {latestVersion}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            disabled={isAnimating}
            className={cn(
              "flex-1 bg-primary-foreground text-primary px-3 py-2 rounded-md text-sm font-medium transition-all",
              "hover:bg-primary-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary-foreground/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
            aria-label="Atualizar aplicativo"
          >
            {isAnimating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </>
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-md transition-colors"
            aria-label="Lembrar mais tarde"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for programmatic control (optional)
export const useUpdateNotification = () => {
  const versionCheck = useVersionCheck();
  
  const showUpdateDialog = () => {
    if (versionCheck.updateAvailable) {
      const confirmed = window.confirm(
        `Nova versão disponível!\n\nVersão atual: ${versionCheck.currentVersion}\nNova versão: ${versionCheck.latestVersion}\n\nDeseja atualizar agora?`
      );
      
      if (confirmed) {
        versionCheck.reloadApp();
      }
    }
  };

  return {
    ...versionCheck,
    showUpdateDialog,
  };
};