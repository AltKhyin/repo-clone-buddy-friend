
// ABOUTME: Mobile shell layout component with simplified structure - no header, just content and bottom navigation.

import React from 'react';
import BottomTabBar from './BottomTabBar';

interface MobileShellProps {
  children: React.ReactNode;
}

const MobileShell = ({ children }: MobileShellProps) => {
  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Main Content - full space provision without content constraints */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="w-full h-full min-w-0 overflow-hidden pb-20">
          {children}
        </div>
      </main>
      
      {/* Fixed Bottom Navigation */}
      <BottomTabBar />
    </div>
  );
};

export default MobileShell;
