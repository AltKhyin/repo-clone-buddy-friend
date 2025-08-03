// ABOUTME: Migration prompt component for suggesting typography migration to users

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Zap,
  ArrowRight,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { useTypographyMigration } from '@/hooks/useTypographyMigration';
import { MigrationDialog } from './shared/MigrationDialog';

interface MigrationPromptProps {
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const MigrationPrompt: React.FC<MigrationPromptProps> = ({
  onDismiss,
  className,
  showDetails = false,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const {
    blocksNeedingMigration,
    migrationState,
    migrationStats,
    migrateAllBlocks,
    cancelMigration,
    resetMigrationState,
    hasPendingMigrations,
    isProcessing,
  } = useTypographyMigration();

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleStartMigration = async () => {
    try {
      await migrateAllBlocks((current, total, blockId) => {
        console.log(`Migrating block ${current}/${total}: ${blockId}`);
      });
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  const handleShowPreview = () => {
    setShowDialog(true);
  };

  // Don't show if dismissed or no migrations needed
  if (isDismissed || !hasPendingMigrations) {
    return null;
  }

  // Show processing state
  if (isProcessing) {
    return (
      <Alert className={cn('border-blue-200 bg-blue-50', className)}>
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium">Migrating Typography...</div>
            <div className="text-xs text-muted-foreground mt-1">
              Processing block {migrationState.completedBlocks + 1} of {migrationState.totalBlocks}
              {migrationState.currentBlockId && (
                <span className="ml-2">({migrationState.currentBlockId})</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={migrationState.progress} className="w-24 h-2" />
            <Button size="sm" variant="outline" onClick={cancelMigration}>
              Cancel
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show completion state
  if (migrationStats.isComplete && migrationStats.totalBlocks > 0) {
    return (
      <Alert className={cn('border-green-200 bg-green-50', className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium">Migration Complete!</div>
            <div className="text-xs text-muted-foreground mt-1">
              Successfully migrated {migrationStats.totalMigrated} typography properties 
              across {migrationStats.successfulBlocks} blocks
              {migrationStats.failedBlocks > 0 && (
                <span className="text-yellow-600 ml-2">
                  ({migrationStats.failedBlocks} had issues)
                </span>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={resetMigrationState}>
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show migration prompt
  return (
    <>
      <Alert className={cn('border-amber-200 bg-amber-50', className)}>
        <Zap className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                Upgrade to Selection-Based Typography
                <Badge variant="secondary" className="text-xs">
                  {blocksNeedingMigration.length} blocks
                </Badge>
              </div>
              <div className="text-sm mt-1">
                Convert your block-level typography to the new selection-based system for 
                Google Docs-like text formatting.
              </div>
              
              {showDetails && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Blocks with typography data:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {blocksNeedingMigration.slice(0, 5).map((block) => (
                      <Badge key={block.id} variant="outline" className="text-xs">
                        {block.type}
                      </Badge>
                    ))}
                    {blocksNeedingMigration.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{blocksNeedingMigration.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={handleShowPreview}>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button size="sm" onClick={handleStartMigration}>
                <ArrowRight className="h-4 w-4 mr-1" />
                Migrate Now
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Migration Preview Dialog */}
      <MigrationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editor={null} // Will be handled per block
        blockData={{}} // Will be handled per block
        blockId="multiple"
        blockType="multiple"
        onMigrationComplete={(result) => {
          console.log('Migration completed:', result);
          setShowDialog(false);
        }}
      />
    </>
  );
};

/**
 * Compact migration prompt for toolbar
 */
export const CompactMigrationPrompt: React.FC<{
  onAction?: () => void;
  className?: string;
}> = ({ onAction, className }) => {
  const { hasPendingMigrations, blocksNeedingMigration } = useTypographyMigration();

  if (!hasPendingMigrations) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onAction}
      className={cn('flex items-center gap-2 text-xs', className)}
    >
      <Zap className="h-3 w-3 text-amber-500" />
      <span>Upgrade Typography</span>
      <Badge variant="secondary" className="text-xs ml-1">
        {blocksNeedingMigration.length}
      </Badge>
    </Button>
  );
};

/**
 * Migration status indicator
 */
export const MigrationStatusIndicator: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { hasPendingMigrations, isProcessing, migrationStats } = useTypographyMigration();

  if (!hasPendingMigrations && !isProcessing && !migrationStats.isComplete) {
    return null;
  }

  let icon = <Zap className="h-4 w-4 text-amber-500" />;
  let status = 'Pending Migration';
  let color = 'amber';

  if (isProcessing) {
    icon = <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    status = 'Migrating...';
    color = 'blue';
  } else if (migrationStats.isComplete) {
    icon = <CheckCircle className="h-4 w-4 text-green-500" />;
    status = 'Migration Complete';
    color = 'green';
  }

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      {icon}
      <span className={`text-${color}-600`}>{status}</span>
    </div>
  );
};