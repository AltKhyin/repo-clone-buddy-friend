// ABOUTME: Dialog component for typography migration with preview and confirmation

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  Zap,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import {
  TypographyMigration,
  type BlockTypographyData,
  type MigrationResult,
} from './typography-migration';

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
  blockData: BlockTypographyData;
  blockId: string;
  blockType: string;
  onMigrationComplete?: (result: MigrationResult) => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  open,
  onOpenChange,
  editor,
  blockData,
  blockId,
  blockType,
  onMigrationComplete,
}) => {
  const [migration, setMigration] = useState<TypographyMigration | null>(null);
  const [preview, setPreview] = useState<{
    willMigrate: string[];
    willSkip: string[];
    warnings: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'preview' | 'confirm' | 'processing' | 'complete'>('preview');

  // Initialize migration when dialog opens
  useEffect(() => {
    if (open && editor && !migration) {
      const migrationInstance = new TypographyMigration(editor);
      setMigration(migrationInstance);
      
      // Generate preview
      const previewResult = migrationInstance.previewMigration(blockData);
      setPreview(previewResult);
      setCurrentStep('preview');
    } else if (!open) {
      // Reset state when dialog closes
      setMigration(null);
      setPreview(null);
      setResult(null);
      setCurrentStep('preview');
      setIsProcessing(false);
    }
  }, [open, editor, blockData]);

  const handleStartMigration = async () => {
    if (!migration) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      // Simulate progress for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const migrationResult = migration.migrateBlockTypographyToMarks(blockData);
      setResult(migrationResult);
      setCurrentStep('complete');
      
      onMigrationComplete?.(migrationResult);
    } catch (error) {
      setResult({
        success: false,
        migratedProperties: [],
        skippedProperties: [],
        errors: [`Migration failed: ${error}`],
        appliedMarksCount: 0,
      });
      setCurrentStep('complete');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          Preview what will happen when migrating block-level typography to selection-based marks.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Will Migrate ({preview?.willMigrate.length || 0})
          </h4>
          <div className="flex flex-wrap gap-1">
            {preview?.willMigrate.map((property) => (
              <Badge key={property} variant="default" className="text-xs">
                {property}
              </Badge>
            )) || <span className="text-sm text-muted-foreground">None</span>}
          </div>
        </div>

        {(preview?.willSkip.length || 0) > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Will Skip ({preview?.willSkip.length || 0})
            </h4>
            <div className="flex flex-wrap gap-1">
              {preview?.willSkip.map((property) => (
                <Badge key={property} variant="secondary" className="text-xs">
                  {property}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(preview?.warnings.length || 0) > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Warnings
            </h4>
            <ScrollArea className="h-20">
              <div className="space-y-1">
                {preview?.warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-muted-foreground p-2 bg-yellow-50 rounded">
                    {warning}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="bg-muted/30 p-3 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Block Information</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Block ID: <code className="bg-background px-1 rounded">{blockId}</code></div>
          <div>Block Type: <Badge variant="outline" className="text-xs">{blockType}</Badge></div>
          <div>Properties: {Object.keys(blockData).filter(key => blockData[key as keyof BlockTypographyData] != null).length}</div>
        </div>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-medium">Migrating Typography...</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Converting block-level formatting to selection-based marks
        </p>
      </div>
      <Progress value={75} className="w-full" />
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4">
      <Alert className={cn(
        result?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      )}>
        {result?.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription>
          {result?.success 
            ? `Successfully migrated ${result.appliedMarksCount} typography properties`
            : 'Migration completed with errors'
          }
        </AlertDescription>
      </Alert>

      {result && (
        <div className="space-y-3">
          {result.migratedProperties.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Migrated ({result.migratedProperties.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {result.migratedProperties.map((property) => (
                  <Badge key={property} variant="default" className="text-xs">
                    {property}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {result.skippedProperties.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Skipped ({result.skippedProperties.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {result.skippedProperties.map((property) => (
                  <Badge key={property} variant="secondary" className="text-xs">
                    {property}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Errors ({result.errors.length})
              </h4>
              <ScrollArea className="h-20">
                <div className="space-y-1">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-600 p-2 bg-red-50 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'preview':
        return 'Migration Preview';
      case 'confirm':
        return 'Confirm Migration';
      case 'processing':
        return 'Processing Migration';
      case 'complete':
        return 'Migration Complete';
      default:
        return 'Typography Migration';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'preview':
        return 'Review what typography properties will be migrated from block-level to selection-based formatting.';
      case 'processing':
        return 'Converting typography properties to TipTap marks...';
      case 'complete':
        return result?.success 
          ? 'Typography has been successfully migrated to selection-based marks.'
          : 'Migration encountered some issues. See details below.';
      default:
        return 'Migrate block typography to selection-based formatting.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="py-4">
          {currentStep === 'preview' && renderPreviewStep()}
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>

        <DialogFooter>
          {currentStep === 'preview' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleStartMigration}
                disabled={!preview?.willMigrate.length}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Start Migration
              </Button>
            </>
          )}
          
          {currentStep === 'processing' && (
            <Button variant="outline" disabled>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Button>
          )}
          
          {currentStep === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};