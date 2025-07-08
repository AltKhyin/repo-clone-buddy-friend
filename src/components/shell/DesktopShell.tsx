// ABOUTME: Desktop shell layout component with proper content constraints and overflow handling.

import React from 'react';
import CollapsibleSidebar from './CollapsibleSidebar';

interface DesktopShellProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

const DesktopShell = ({ children, isCollapsed, onToggleSidebar }: DesktopShellProps) => {

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Fixed sidebar with restored positioning */}
      <CollapsibleSidebar isCollapsed={isCollapsed} onToggle={onToggleSidebar} />

      {/* Main content area with precise positioning, header spacing, and constrained scrolling */}
      <main
        className={`min-h-screen overflow-y-auto transition-all duration-300 pt-16 ${
          isCollapsed ? 'ml-20' : 'ml-60'
        }`}
      >
        <div className="w-full max-w-[1200px] mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default DesktopShell;
