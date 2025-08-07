// ABOUTME: Standardized save button component with consistent behavior and loading states

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Send, Loader2 } from 'lucide-react';
import { useSaveContext } from '../../../hooks/useSaveContext';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  variant?: 'save' | 'publish';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  disabled?: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  variant = 'save',
  size = 'default',
  className,
  showIcon = true,
  disabled = false,
}) => {
  const { saveState, save, publish } = useSaveContext();

  const handleClick = variant === 'save' ? save : publish;
  const isLoading = saveState.isSaving;
  const hasChanges = saveState.hasChanges;

  const buttonProps = {
    save: {
      label: isLoading ? 'Saving...' : 'Save Changes',
      icon: isLoading ? Loader2 : Save,
      variant: 'outline' as const,
      disabled: disabled || isLoading || (!hasChanges && variant === 'save'),
    },
    publish: {
      label: isLoading ? 'Publishing...' : 'Publish',
      icon: isLoading ? Loader2 : Send,
      variant: 'default' as const,
      disabled: disabled || isLoading,
    },
  };

  const config = buttonProps[variant];
  const Icon = config.icon;

  return (
    <Button
      onClick={handleClick}
      variant={config.variant}
      size={size}
      disabled={config.disabled}
      className={cn(
        variant === 'save' && hasChanges && 'border-blue-300 text-blue-700 hover:bg-blue-50',
        className
      )}
    >
      {showIcon && <Icon className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />}
      {config.label}
    </Button>
  );
};
