// ABOUTME: Dialog for offering backup recovery after crashes or navigation

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  HardDrive,
  Clock,
  X,
  RefreshCw
} from 'lucide-react';
import { CrashRecoveryState, CrashRecoveryActions } from '../../hooks/useCrashRecovery';

interface BackupRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: CrashRecoveryState;
  actions: CrashRecoveryActions;
  onRecover: (content: any) => void;
  reviewId: string;
}

export function BackupRecoveryDialog({
  open,
  onOpenChange,
  state,
  actions,
  onRecover,
  reviewId
}: BackupRecoveryDialogProps) {
  
  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Unknown time';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    let timeAgo;
    if (minutes < 1) {
      timeAgo = 'Just now';
    } else if (minutes < 60) {
      timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    return `${date.toLocaleString()} (${timeAgo})`;
  };

  const handleRecover = () => {
    const recoveredContent = actions.recoverFromBackup(reviewId);
    if (recoveredContent) {
      onRecover(recoveredContent);
      onOpenChange(false);
    }
  };

  const handleDismiss = () => {
    actions.dismissBackup(reviewId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Backup Recovery Available
          </DialogTitle>
          <DialogDescription>
            We found a local backup of your work. This might be from an unsaved session 
            or after a browser crash.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Backup Information */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-primary" />
                <span className="font-medium">Local Backup Found</span>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock size={12} />
                Auto-saved
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backup time:</span>
                <span>{formatTimestamp(state.backupTimestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Review ID:</span>
                <span className="font-mono text-xs">
                  {state.backupReviewId}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> If you choose to restore, this will replace your current content 
              with the backup. Make sure this is what you want to do.
            </p>
          </div>

          {/* Recovery Error */}
          {state.recoveryError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Recovery Error:</strong> {state.recoveryError.message}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex items-center gap-2"
          >
            <X size={16} />
            Dismiss Backup
          </Button>
          
          <Button
            onClick={handleRecover}
            disabled={state.isRecovering}
            className="flex items-center gap-2"
          >
            {state.isRecovering ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Recovering...
              </>
            ) : (
              <>
                <HardDrive size={16} />
                Restore Backup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}