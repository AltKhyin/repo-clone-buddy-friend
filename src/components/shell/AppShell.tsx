
// ABOUTME: The main application shell controller - pure layout manager with no data dependencies.

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ErrorBoundary } from '../ErrorBoundary';
import DesktopShell from './DesktopShell';
import MobileShell from './MobileShell';
import FixedHeader from './FixedHeader';

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

  // Shell Component Factory - AppShell is now data-independent with fixed header
  return (
    <>
      {/* Fixed glass header - appears on all pages */}
      <FixedHeader>
        {/* Empty for now - ready for future content */}
      </FixedHeader>
      
      {/* Shell content with header spacing compensation */}
      {isMobile ? (
        <MobileShell>{PageContent}</MobileShell>
      ) : (
        <DesktopShell>{PageContent}</DesktopShell>
      )}
    </>
  );
};

export default AppShell;
