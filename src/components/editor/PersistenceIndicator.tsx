// ABOUTME: Visual indicator for persistence state with auto-save, backup status, and conflict resolution

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { PersistenceState, PersistenceActions } from '@/hooks/useEnhancedPersistence';

interface PersistenceIndicatorProps {
  state: PersistenceState;
  actions: PersistenceActions;
  className?: string;
}

export function PersistenceIndicator({ 
  state, 
  actions, 
  className 
}: PersistenceIndicatorProps) {
  const [showConflictDialog, setShowConflictDialog] = React.useState(false);

  // Show conflict dialog when conflict is detected
  React.useEffect(() => {
    if (state.conflictDetected) {
      setShowConflictDialog(true);
    }
  }, [state.conflictDetected]);

  // Format time ago
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  // Get primary status
  const getPrimaryStatus = () => {
    if (state.conflictDetected) {
      return {
        icon: AlertTriangle,
        label: 'Conflict Detected',
        variant: 'destructive' as const,
        description: 'Document conflict needs resolution'
      };
    }
    
    if (state.isSaving) {
      return {
        icon: Loader2,
        label: 'Saving...',
        variant: 'default' as const,
        description: 'Saving to database',
        animate: true
      };
    }

    if (state.saveError) {
      return {
        icon: WifiOff,
        label: 'Save Failed',
        variant: 'destructive' as const,
        description: state.saveError.message
      };
    }

    if (state.hasUnsavedChanges) {
      return {
        icon: Clock,
        label: 'Unsaved Changes',
        variant: 'secondary' as const,
        description: state.autoSaveEnabled ? 'Auto-save in progress' : 'Auto-save disabled'
      };
    }

    return {
      icon: CheckCircle,
      label: 'All Changes Saved',
      variant: 'default' as const,
      description: `Last saved ${formatTimeAgo(state.lastSaved)}`
    };
  };

  const primaryStatus = getPrimaryStatus();
  const StatusIcon = primaryStatus.icon;

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Primary Status Badge */}
        <Badge 
          variant={primaryStatus.variant}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1",
            state.conflictDetected && "animate-pulse"
          )}
        >
          <StatusIcon 
            size={12} 
            className={cn(
              primaryStatus.animate && "animate-spin"
            )}
          />
          <span className="text-xs font-medium">
            {primaryStatus.label}
          </span>
        </Badge>

        {/* Backup Status */}
        {state.lastBackup && (
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
            <HardDrive size={10} />
            <span className="text-xs">
              Backup {formatTimeAgo(state.lastBackup)}
            </span>
          </Badge>
        )}

        {/* Auto-save Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={state.autoSaveEnabled ? actions.disableAutoSave : actions.enableAutoSave}
          className="h-6 px-2"
          title={state.autoSaveEnabled ? "Disable auto-save" : "Enable auto-save"}
        >
          <RefreshCw 
            size={12} 
            className={cn(
              state.autoSaveEnabled ? "text-green-600" : "text-gray-400"
            )}
          />
        </Button>

        {/* Manual Save Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={actions.forceSave}
          disabled={state.isSaving || !state.hasUnsavedChanges}
          className="h-6 px-2"
        >
          <Save size={12} />
          <span className="ml-1 text-xs">Save</span>
        </Button>
      </div>

      {/* Conflict Resolution Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" size={20} />
              Document Conflict Detected
            </DialogTitle>
            <DialogDescription>
              This document has been modified in another session. You need to choose which version to keep.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive size={16} />
                  <span className="font-medium">Your Local Changes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your current unsaved changes and overwrite the server version.
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi size={16} />
                  <span className="font-medium">Server Version</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Discard your local changes and use the version from the server.
                </p>
              </div>
            </div>

            {state.lastBackup && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Note:</strong> Your local changes are backed up from {formatTimeAgo(state.lastBackup)}.
                  You can restore them later if needed.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                actions.resolveConflict(false);
                setShowConflictDialog(false);
              }}
              className="flex items-center gap-2"
            >
              <Wifi size={16} />
              Use Server Version
            </Button>
            <Button
              onClick={() => {
                actions.resolveConflict(true);
                setShowConflictDialog(false);
              }}
              className="flex items-center gap-2"
            >
              <HardDrive size={16} />
              Keep My Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}