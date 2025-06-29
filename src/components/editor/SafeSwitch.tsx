// ABOUTME: Safe Switch wrapper to prevent infinite re-render loops with Radix UI Switch

import React from 'react';
import { Switch } from '@/components/ui/switch';

/**
 * SafeSwitch prevents infinite loops that can occur with Radix UI Switch
 * by memoizing the component and ensuring the callback only fires when
 * the checked state actually changes.
 */
export const SafeSwitch = React.memo<React.ComponentProps<typeof Switch>>(
  ({ checked, onCheckedChange, ...props }) => {
    const handleChange = React.useCallback((newChecked: boolean) => {
      // Only call the handler if the value actually changed
      if (newChecked !== checked) {
        onCheckedChange?.(newChecked);
      }
    }, [checked, onCheckedChange]);

    return <Switch checked={checked} onCheckedChange={handleChange} {...props} />;
  }
);

SafeSwitch.displayName = 'SafeSwitch';