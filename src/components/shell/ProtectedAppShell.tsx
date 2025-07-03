// ABOUTME: App shell wrapper with universal route protection for all routes

import React from 'react';
import AppShell from './AppShell';
import { UniversalRouteProtection } from '@/components/routes/UniversalRouteProtection';

/**
 * Protected App Shell that wraps the main app shell with universal route protection
 * This ensures ALL routes are checked automatically without individual wrappers
 */
export const ProtectedAppShell: React.FC = () => {
  return (
    <UniversalRouteProtection showDebugInfo={false}>
      <AppShell />
    </UniversalRouteProtection>
  );
};

export default ProtectedAppShell;
