// ABOUTME: Typography mode indicator showing current formatting context (selection vs block)

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MousePointer, Square, Type } from 'lucide-react';
import { useUnifiedSelection } from '@/hooks/useUnifiedSelection';

interface TypographyModeIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const TypographyModeIndicator: React.FC<TypographyModeIndicatorProps> = ({
  className,
  showLabel = true,
}) => {
  // 🎯 UNIFIED SELECTION: Use unified system to determine typography mode
  const { hasSelection, canApplyTypography, currentSelection } = useUnifiedSelection();
  
  // Determine current typography mode based on unified selection
  const mode = hasSelection && canApplyTypography
    ? currentSelection.type === 'table-cell' 
      ? 'table-cell'
      : 'selection'
    : hasSelection && currentSelection.type === 'block'
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
    'table-cell': {
      icon: Square,
      label: 'Table Cell Mode',
      description: 'Typography applies to table cell content',
      color: 'green',
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
          mode === 'table-cell' && 'bg-green-100 text-green-700 border-green-200',
          mode === 'block' && 'bg-slate-100 text-slate-700 border-slate-200'
        )}
        title={config.description}
      >
        <Icon size={10} />
        {showLabel && <span>{config.label}</span>}
      </Badge>
      
      {/* TODO: Add selected node type indicator when available from editor state */}
    </div>
  );
};

/**
 * Compact mode indicator for toolbar
 */
export const CompactTypographyModeIndicator: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <TypographyModeIndicator
      className={className}
      showLabel={false}
    />
  );
};

/**
 * Typography context indicator with enhanced information
 */
export const TypographyContextIndicator: React.FC<{
  className?: string;
}> = ({ className }) => {
  // 🎯 UNIFIED SELECTION: Use unified system for context indicator
  const { hasSelection, canApplyTypography, appliedMarks } = useUnifiedSelection();
  
  // Count applied marks
  const appliedMarksCount = Object.values(appliedMarks).filter(Boolean).length;
  
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <TypographyModeIndicator showLabel={true} />
      
      {hasSelection && canApplyTypography && appliedMarksCount > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs">
          {appliedMarksCount} {appliedMarksCount === 1 ? 'format' : 'formats'}
        </Badge>
      )}
    </div>
  );
};