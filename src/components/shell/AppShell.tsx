
// ABOUTME: The main application shell controller - pure layout manager with no data dependencies.

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ErrorBoundary } from '../ErrorBoundary';
import DesktopShell from './DesktopShell';
import MobileShell from './MobileShell';

const AppShell = () => {
  const isMobile = useIsMobile();

  console.log('AppShell render state:', { isMobile });

  // Tier 2: Page Content Error Boundary - Isolates page crashes from shell
  const PageContent = (
    <ErrorBoundary 
      tier="page"
      context="conteúdo da página"
      showDetails={false}
      showHomeButton={true}
      showBackButton={true}
    >
      <Outlet />
    </ErrorBoundary>
  );

  // Shell Component Factory - AppShell is now data-independent
  if (isMobile) {
    return <MobileShell>{PageContent}</MobileShell>;
  }

  return <DesktopShell>{PageContent}</DesktopShell>;
};

export default AppShell;
