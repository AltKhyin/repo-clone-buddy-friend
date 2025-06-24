
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
    <div className="min-h-screen w-full bg-background flex">
      {/* Fixed sidebar - independent positioning */}
      <CollapsibleSidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />

      {/* Main content wrapper - positioned to avoid sidebar overlap with proper constraints */}
      <div
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out min-w-0', // FIXED: Added min-w-0 to prevent flex item overflow
          isCollapsed ? 'ml-20' : 'ml-60' // Match sidebar widths exactly
        )}
      >
        {/* Scrollable content area with overflow constraints */}
        <main className="min-h-screen overflow-y-auto overflow-x-hidden"> {/* FIXED: Added overflow-x-hidden */}
          <div className="p-4 md:p-6 max-w-full"> {/* FIXED: Added max-w-full constraint */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DesktopShell;
