
// ABOUTME: The main application shell controller - pure layout manager with no data dependencies.

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '../../hooks/use-mobile';
import { ErrorBoundary } from '../ErrorBoundary';
import DesktopShell from './DesktopShell';
import MobileShell from './MobileShell';
import FixedHeader from './FixedHeader';

const AppShell = () => {
  const isMobile = useIsMobile();
  
  // Sidebar state management - moved from DesktopShell for header coordination
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

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

  // Shell Component Factory - AppShell coordinates header and sidebar state
  return (
    <>
      {/* Fixed glass header with logo - appears on all pages */}
      <FixedHeader isCollapsed={isCollapsed} isMobile={isMobile}>
        {/* Logo will be positioned here */}
      </FixedHeader>
      
      {/* Shell content with header spacing compensation */}
      {isMobile ? (
        <MobileShell>{PageContent}</MobileShell>
      ) : (
        <DesktopShell isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar}>
          {PageContent}
        </DesktopShell>
      )}
    </>
  );
};

export default AppShell;
