// ABOUTME: App shell wrapper with optimized route protection for all routes

import React from 'react';
import AppShell from './AppShell';
import { OptimizedRouteProtection } from '@/components/routes/OptimizedRouteProtection';

/**
 * Protected App Shell that wraps the main app shell with optimized route protection
 * This ensures ALL routes are checked automatically without individual wrappers
 * Uses session-based caching to minimize API calls and reduce security logging
 */
export const ProtectedAppShell: React.FC = () => {
  return (
    <OptimizedRouteProtection showDebugInfo={false}>
      <AppShell />
    </OptimizedRouteProtection>
  );
};

export default ProtectedAppShell;
