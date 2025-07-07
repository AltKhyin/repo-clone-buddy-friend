// ABOUTME: Desktop shell layout component with proper content constraints and overflow handling.

import React, { useState } from 'react';
import CollapsibleSidebar from './CollapsibleSidebar';
import { cn } from '@/lib/utils';

interface DesktopShellProps {
  children: React.ReactNode;
}

const DesktopShell = ({ children }: DesktopShellProps) => {
  // This component manages the collapsed state to coordinate sidebar and content layout
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Fixed sidebar with restored positioning */}
      <CollapsibleSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* Main content area with precise positioning and constrained scrolling */}
      <main
        className={`min-h-screen overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-60'
        }`}
      >
        <div className="w-full max-w-[1200px] mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default DesktopShell;
