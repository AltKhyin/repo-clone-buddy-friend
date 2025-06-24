
// ABOUTME: Mobile shell layout component with simplified structure - no header, just content and bottom navigation.

import React from 'react';
import BottomTabBar from './BottomTabBar';

interface MobileShellProps {
  children: React.ReactNode;
}

const MobileShell = ({ children }: MobileShellProps) => {
  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Main Content - simplified without header */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pb-20">
          {children}
        </div>
      </main>
      
      {/* Fixed Bottom Navigation */}
      <BottomTabBar />
    </div>
  );
};

export default MobileShell;
