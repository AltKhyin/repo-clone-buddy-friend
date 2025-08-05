// ABOUTME: Dropdown selector for heading levels (H1-H6) and paragraph mode with compact toolbar design

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeadingOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const HEADING_OPTIONS: HeadingOption[] = [
  {
    value: 'paragraph',
    label: 'Paragraph',
    icon: Type,
  },
  {
    value: 'heading1',
    label: 'Heading 1',
    icon: Heading1,
    level: 1,
  },
  {
    value: 'heading2',
    label: 'Heading 2',
    icon: Heading2,
    level: 2,
  },
  {
    value: 'heading3',
    label: 'Heading 3',
    icon: Heading3,
    level: 3,
  },
  {
    value: 'heading4',
    label: 'Heading 4',
    icon: Heading4,
    level: 4,
  },
  {
    value: 'heading5',
    label: 'Heading 5',
    icon: Heading5,
    level: 5,
  },
  {
    value: 'heading6',
    label: 'Heading 6',
    icon: Heading6,
    level: 6,
  },
];

interface HeadingSelectorProps {
  /** Current heading level, or null for paragraph */
  currentLevel: 1 | 2 | 3 | 4 | 5 | 6 | null;
  
  /** Handler for heading level changes */
  onLevelChange: (level: 1 | 2 | 3 | 4 | 5 | 6 | null) => void;
  
  /** Whether the selector is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Compact mode for toolbar usage */
  compact?: boolean;
}

export const HeadingSelector = React.memo(function HeadingSelector({
  currentLevel,
  onLevelChange,
  disabled = false,
  className,
  compact = true,
}: HeadingSelectorProps) {
  // Debug logging for current level changes
  React.useEffect(() => {
    console.log('[HeadingSelector] Current level changed:', {
      currentLevel,
      disabled,
      type: typeof currentLevel
    });
  }, [currentLevel, disabled]);

  // Determine current value based on heading level
  const currentValue = currentLevel ? `heading${currentLevel}` : 'paragraph';
  
  // Find current option for display
  const currentOption = HEADING_OPTIONS.find(option => option.value === currentValue);
  const CurrentIcon = currentOption?.icon || Type;
  
  console.log('[HeadingSelector] Render state:', {
    currentLevel,
    currentValue,
    currentOption: currentOption?.label,
    disabled
  });

  const handleValueChange = React.useCallback(
    (value: string) => {
      const selectedOption = HEADING_OPTIONS.find(option => option.value === value);
      if (selectedOption) {
        onLevelChange(selectedOption.level || null);
      }
    },
    [onLevelChange]
  );

  return (
    <Select
      value={currentValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          'border-0 bg-transparent gap-1 focus:ring-0 focus:ring-offset-0',
          compact 
            ? 'h-6 w-auto px-1.5 text-xs' 
            : 'h-8 w-32 px-2 text-sm',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={disabled 
          ? "Select a Rich Block to change heading levels" 
          : `Current: ${currentOption?.label || 'Paragraph'}`
        }
        aria-label="Select heading level"
      >
        <div className="flex items-center gap-1">
          <CurrentIcon size={compact ? 14 : 16} />
          {!compact && <SelectValue />}
        </div>
      </SelectTrigger>

      <SelectContent 
        className="min-w-[160px]"
        align="start"
        sideOffset={4}
      >
        {HEADING_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          
          return (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <IconComponent size={14} />
                <span className="flex-1">{option.label}</span>
                {option.level && (
                  <span className="text-xs text-muted-foreground">
                    H{option.level}
                  </span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});

export type { HeadingSelectorProps };