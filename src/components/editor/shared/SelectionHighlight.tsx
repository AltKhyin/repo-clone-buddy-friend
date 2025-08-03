// ABOUTME: Visual selection highlighting effects for enhanced typography feedback

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectionHighlightProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  highlightColor?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  intensity?: 'subtle' | 'moderate' | 'strong';
  animated?: boolean;
}

export const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  isActive,
  children,
  className,
  highlightColor = 'blue',
  intensity = 'moderate',
  animated = true,
}) => {
  const colorClasses = {
    blue: {
      subtle: 'ring-blue-200 bg-blue-50/30',
      moderate: 'ring-blue-300 bg-blue-50/50',
      strong: 'ring-blue-400 bg-blue-100/70',
    },
    green: {
      subtle: 'ring-green-200 bg-green-50/30',
      moderate: 'ring-green-300 bg-green-50/50',
      strong: 'ring-green-400 bg-green-100/70',
    },
    purple: {
      subtle: 'ring-purple-200 bg-purple-50/30',
      moderate: 'ring-purple-300 bg-purple-50/50',
      strong: 'ring-purple-400 bg-purple-100/70',
    },
    yellow: {
      subtle: 'ring-yellow-200 bg-yellow-50/30',
      moderate: 'ring-yellow-300 bg-yellow-50/50',
      strong: 'ring-yellow-400 bg-yellow-100/70',
    },
    red: {
      subtle: 'ring-red-200 bg-red-50/30',
      moderate: 'ring-red-300 bg-red-50/50',
      strong: 'ring-red-400 bg-red-100/70',
    },
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        isActive && [
          'ring-2 rounded-md',
          colorClasses[highlightColor][intensity],
          animated && 'animate-pulse',
        ],
        className
      )}
    >
      {children}
      
      {/* Corner indicator for active state */}
      {isActive && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-2 h-2 rounded-full',
            'ring-2 ring-white',
            highlightColor === 'blue' && 'bg-blue-500',
            highlightColor === 'green' && 'bg-green-500',
            highlightColor === 'purple' && 'bg-purple-500',
            highlightColor === 'yellow' && 'bg-yellow-500',
            highlightColor === 'red' && 'bg-red-500',
            animated && 'animate-bounce'
          )}
        />
      )}
    </div>
  );
};

/**
 * Typography control highlight wrapper
 */
export const TypographyControlHighlight: React.FC<{
  isActive: boolean;
  isApplied: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isActive, isApplied, children, className }) => {
  return (
    <SelectionHighlight
      isActive={isActive}
      highlightColor={isApplied ? 'green' : 'blue'}
      intensity={isApplied ? 'strong' : 'moderate'}
      animated={isActive && !isApplied}
      className={className}
    >
      {children}
    </SelectionHighlight>
  );
};

/**
 * Block vs Selection mode visual indicator
 */
export const ModeTransitionHighlight: React.FC<{
  mode: 'selection' | 'block' | 'none';
  children: React.ReactNode;
  className?: string;
}> = ({ mode, children, className }) => {
  const isActive = mode !== 'none';
  const highlightColor = mode === 'selection' ? 'blue' : 'purple';
  
  return (
    <SelectionHighlight
      isActive={isActive}
      highlightColor={highlightColor}
      intensity="subtle"
      animated={false}
      className={cn(
        'transition-all duration-300',
        mode === 'selection' && 'border-l-2 border-blue-400 pl-2',
        mode === 'block' && 'border-l-2 border-purple-400 pl-2',
        className
      )}
    >
      {children}
    </SelectionHighlight>
  );
};

/**
 * Pulsing dot indicator for active states
 */
export const PulsingDot: React.FC<{
  isActive: boolean;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ isActive, color = 'blue', size = 'sm', className }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  if (!isActive) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-300',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full animate-pulse',
          colorClasses[color],
          sizeClasses[size]
        )}
      />
      <div
        className={cn(
          'absolute rounded-full animate-ping',
          colorClasses[color],
          sizeClasses[size],
          'opacity-75'
        )}
      />
    </div>
  );
};

/**
 * Typography status indicator with visual feedback
 */
export const TypographyStatusIndicator: React.FC<{
  hasSelection: boolean;
  appliedFormatsCount: number;
  mode: 'selection' | 'block' | 'none';
  className?: string;
}> = ({ hasSelection, appliedFormatsCount, mode, className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <PulsingDot
        isActive={hasSelection}
        color={mode === 'selection' ? 'blue' : 'purple'}
        size="sm"
      />
      
      {appliedFormatsCount > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(appliedFormatsCount, 5) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1 h-3 rounded-full',
                mode === 'selection' ? 'bg-blue-400' : 'bg-purple-400',
                'animate-pulse'
              )}
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
          {appliedFormatsCount > 5 && (
            <span className="text-xs text-muted-foreground ml-1">
              +{appliedFormatsCount - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
};