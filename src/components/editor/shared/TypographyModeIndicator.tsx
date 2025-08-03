// ABOUTME: Typography mode indicator showing current formatting context (selection vs block)

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MousePointer, Square, Type } from 'lucide-react';
import type { TextSelectionInfo } from '@/hooks/useTextSelection';

interface TypographyModeIndicatorProps {
  textSelection: TextSelectionInfo | null;
  isBlockTypographySupported: boolean;
  selectedNodeType?: string;
  className?: string;
  showLabel?: boolean;
}

export const TypographyModeIndicator: React.FC<TypographyModeIndicatorProps> = ({
  textSelection,
  isBlockTypographySupported,
  selectedNodeType,
  className,
  showLabel = true,
}) => {
  const hasTextSelection = textSelection?.hasSelection ?? false;
  const isTipTapSelection = textSelection?.isTipTapSelection ?? false;
  
  // Determine current typography mode
  const mode = hasTextSelection && isTipTapSelection 
    ? 'selection' 
    : isBlockTypographySupported 
      ? 'block' 
      : 'none';

  if (mode === 'none') {
    return null;
  }

  const modeConfig = {
    selection: {
      icon: MousePointer,
      label: 'Selection Mode',
      description: 'Typography applies to selected text',
      color: 'blue',
      variant: 'default' as const,
    },
    block: {
      icon: Square,
      label: 'Block Mode',
      description: 'Typography applies to entire block',
      color: 'slate',
      variant: 'secondary' as const,
    },
    none: {
      icon: Type,
      label: 'No Typography',
      description: 'Typography not supported',
      color: 'gray',
      variant: 'outline' as const,
    },
  };

  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant={config.variant}
        className={cn(
          'flex items-center gap-1 h-5 px-2 text-xs',
          mode === 'selection' && 'bg-blue-100 text-blue-700 border-blue-200',
          mode === 'block' && 'bg-slate-100 text-slate-700 border-slate-200'
        )}
        title={config.description}
      >
        <Icon size={10} />
        {showLabel && <span>{config.label}</span>}
      </Badge>
      
      {selectedNodeType && (
        <span className="text-xs text-muted-foreground">
          {selectedNodeType}
        </span>
      )}
    </div>
  );
};

/**
 * Compact mode indicator for toolbar
 */
export const CompactTypographyModeIndicator: React.FC<{
  textSelection: TextSelectionInfo | null;
  isBlockTypographySupported: boolean;
  className?: string;
}> = ({ textSelection, isBlockTypographySupported, className }) => {
  return (
    <TypographyModeIndicator
      textSelection={textSelection}
      isBlockTypographySupported={isBlockTypographySupported}
      className={className}
      showLabel={false}
    />
  );
};

/**
 * Typography context indicator with enhanced information
 */
export const TypographyContextIndicator: React.FC<{
  textSelection: TextSelectionInfo | null;
  isBlockTypographySupported: boolean;
  selectedNodeType?: string;
  appliedMarksCount?: number;
  className?: string;
}> = ({ 
  textSelection, 
  isBlockTypographySupported, 
  selectedNodeType, 
  appliedMarksCount = 0,
  className 
}) => {
  const hasTextSelection = textSelection?.hasSelection ?? false;
  const isTipTapSelection = textSelection?.isTipTapSelection ?? false;
  
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <TypographyModeIndicator
        textSelection={textSelection}
        isBlockTypographySupported={isBlockTypographySupported}
        selectedNodeType={selectedNodeType}
        showLabel={true}
      />
      
      {hasTextSelection && isTipTapSelection && appliedMarksCount > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs">
          {appliedMarksCount} {appliedMarksCount === 1 ? 'format' : 'formats'}
        </Badge>
      )}
    </div>
  );
};