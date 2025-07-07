// ABOUTME: Simplified ContentGrid component following Gemini's architectural recommendations

import React from 'react';
import { type ContentGridProps } from '@/types/layout';
import { cn } from '@/lib/utils';

export const ContentGrid: React.FC<ContentGridProps> = ({
  mainContent,
  sidebarContent,
  sidebarType = 'none',
  mainClassName,
  sidebarClassName,
  className,
  children,
}) => {
  // Determine if sidebar should be rendered
  const shouldShowSidebar = sidebarType !== 'none' && sidebarContent;

  return (
    <div className={cn('w-full min-h-screen bg-background', className)}>
      <div className="w-full max-w-[1200px] mx-auto px-4 py-6 lg:px-8">
        {shouldShowSidebar ? (
          // Two-column layout with sidebar
          <div className="grid grid-cols-1 lg:grid-cols-[756px_316px] gap-6 lg:gap-8">
            <main className={cn('min-w-0', mainClassName)} role="main">
              {mainContent}
              {children}
            </main>
            <aside className={cn('w-full max-w-[316px]', sidebarClassName)} role="complementary">
              {sidebarContent}
            </aside>
          </div>
        ) : (
          // Single-column layout
          <main className={cn('w-full', mainClassName)} role="main">
            {mainContent}
            {children}
          </main>
        )}
      </div>
    </div>
  );
};
