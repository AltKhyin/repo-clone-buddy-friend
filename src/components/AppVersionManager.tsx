// ABOUTME: App-wide version management component that handles automatic updates and notifications

import React from 'react';
import { UpdateNotification } from './UpdateNotification';

interface AppVersionManagerProps {
  /** Whether to enable automatic update checking */
  enabled?: boolean;
  /** How often to check for updates (in milliseconds) */
  checkInterval?: number;
  /** Position for update notifications */
  notificationPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether to show detailed version info in notifications */
  showVersionInfo?: boolean;
  /** Children to render */
  children?: React.ReactNode;
}

/**
 * App Version Manager - Add this to your main App component to enable
 * automatic version checking and update notifications.
 * 
 * Usage:
 * ```tsx
 * function App() {
 *   return (
 *     <AppVersionManager>
 *       <Router>
 *         // Your app content
 *       </Router>
 *     </AppVersionManager>
 *   );
 * }
 * ```
 */
export const AppVersionManager: React.FC<AppVersionManagerProps> = ({
  enabled = true,
  checkInterval = 5 * 60 * 1000, // 5 minutes
  notificationPosition = 'bottom-right',
  showVersionInfo = false,
  children,
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <UpdateNotification
        position={notificationPosition}
        showVersionInfo={showVersionInfo}
      />
    </>
  );
};

// Export version checking utilities for programmatic use
export { useVersionCheck } from '../hooks/useVersionCheck';
export { UpdateNotification } from './UpdateNotification';