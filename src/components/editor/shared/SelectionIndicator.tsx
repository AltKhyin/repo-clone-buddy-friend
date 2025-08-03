// ABOUTME: Visual selection feedback component for showing active typography formatting

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Type, Palette, Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import type { TextSelectionInfo } from '@/hooks/useTextSelection';

interface SelectionIndicatorProps {
  textSelection: TextSelectionInfo;
  className?: string;
  compact?: boolean;
}

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
  textSelection,
  className,
  compact = false,
}) => {
  const { hasSelection, selectedText, appliedMarks, isTipTapSelection } = textSelection;

  if (!hasSelection || !selectedText.trim()) {
    return null;
  }

  // Extract applied formatting
  const hasFont = appliedMarks.fontFamily && appliedMarks.fontFamily !== 'inherit';
  const hasSize = appliedMarks.fontSize && appliedMarks.fontSize !== 16;
  const hasWeight = appliedMarks.fontWeight && appliedMarks.fontWeight !== 400;
  const hasColor = appliedMarks.textColor;
  const hasBackground = appliedMarks.backgroundColor;
  const hasTransform = appliedMarks.textTransform && appliedMarks.textTransform !== 'none';
  const hasSpacing = appliedMarks.letterSpacing && appliedMarks.letterSpacing !== 'normal';

  const activeFormats = [];
  
  // Collect active formats for display
  if (hasFont) {
    activeFormats.push({
      key: 'font',
      label: appliedMarks.fontFamily?.split(',')[0] || 'Custom Font',
      icon: Type,
      color: 'blue',
    });
  }
  
  if (hasSize) {
    activeFormats.push({
      key: 'size',
      label: `${appliedMarks.fontSize}px`,
      icon: Type,
      color: 'green',
    });
  }
  
  if (hasWeight && appliedMarks.fontWeight === 700) {
    activeFormats.push({
      key: 'bold',
      label: 'Bold',
      icon: Bold,
      color: 'slate',
    });
  }
  
  if (hasColor) {
    activeFormats.push({
      key: 'color',
      label: 'Color',
      icon: Palette,
      color: 'purple',
      style: { color: appliedMarks.textColor },
    });
  }
  
  if (hasBackground) {
    activeFormats.push({
      key: 'highlight',
      label: 'Highlight',
      icon: Palette,
      color: 'yellow',
      style: { backgroundColor: appliedMarks.backgroundColor },
    });
  }
  
  if (hasTransform) {
    const transformLabel = appliedMarks.textTransform === 'uppercase' ? 'UPPER' :
                          appliedMarks.textTransform === 'lowercase' ? 'lower' :
                          appliedMarks.textTransform === 'capitalize' ? 'Title' : 'Transform';
    activeFormats.push({
      key: 'transform',
      label: transformLabel,
      icon: Type,
      color: 'orange',
    });
  }
  
  if (hasSpacing) {
    activeFormats.push({
      key: 'spacing',
      label: 'Spacing',
      icon: Type,
      color: 'indigo',
    });
  }

  if (activeFormats.length === 0 && !compact) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Type size={12} />
        <span>"{selectedText.slice(0, 20)}{selectedText.length > 20 ? '...' : ''}" • No formatting</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Type size={12} />
          <span className="max-w-32 truncate">
            "{selectedText.slice(0, 15)}{selectedText.length > 15 ? '...' : ''}"
          </span>
        </div>
      )}
      
      {activeFormats.length > 0 && (
        <div className="flex items-center gap-1">
          {compact && activeFormats.length > 3 ? (
            <>
              {activeFormats.slice(0, 2).map((format) => {
                const Icon = format.icon;
                return (
                  <Badge
                    key={format.key}
                    variant="secondary"
                    className={cn(
                      'h-5 px-1.5 text-xs flex items-center gap-1',
                      `bg-${format.color}-100 text-${format.color}-700 border-${format.color}-200`
                    )}
                    style={format.style}
                  >
                    <Icon size={10} />
                    {!compact && <span>{format.label}</span>}
                  </Badge>
                );
              })}
              <Badge variant="outline" className="h-5 px-1.5 text-xs">
                +{activeFormats.length - 2}
              </Badge>
            </>
          ) : (
            activeFormats.map((format) => {
              const Icon = format.icon;
              return (
                <Badge
                  key={format.key}
                  variant="secondary"
                  className={cn(
                    'h-5 px-1.5 text-xs flex items-center gap-1',
                    `bg-${format.color}-100 text-${format.color}-700 border-${format.color}-200`
                  )}
                  style={format.style}
                >
                  <Icon size={10} />
                  {!compact && <span>{format.label}</span>}
                </Badge>
              );
            })
          )}
        </div>
      )}
      
      {isTipTapSelection && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs">
          TipTap
        </Badge>
      )}
    </div>
  );
};

/**
 * Compact selection indicator for toolbar use
 */
export const CompactSelectionIndicator: React.FC<{
  textSelection: TextSelectionInfo;
  className?: string;
}> = ({ textSelection, className }) => {
  return (
    <SelectionIndicator
      textSelection={textSelection}
      className={className}
      compact={true}
    />
  );
};

/**
 * Floating selection indicator that follows text selection
 */
export const FloatingSelectionIndicator: React.FC<{
  textSelection: TextSelectionInfo;
  className?: string;
}> = ({ textSelection, className }) => {
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!textSelection.hasSelection || !textSelection.range) {
      setPosition(null);
      return;
    }

    try {
      const rect = textSelection.range.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 40, // Position above the selection
      });
    } catch (error) {
      console.warn('Failed to get selection position:', error);
      setPosition(null);
    }
  }, [textSelection]);

  if (!position || !textSelection.hasSelection) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        'bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg',
        'px-2 py-1 text-xs',
        'transform -translate-x-1/2',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <SelectionIndicator textSelection={textSelection} compact={true} />
    </div>
  );
};