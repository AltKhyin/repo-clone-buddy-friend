// ABOUTME: ContentGrid component implementing Reddit-inspired CSS Grid layout with proper centering and total content width allocation

import React from 'react';
import { type ContentGridProps } from '@/types/layout';
import { layoutClasses, generateContentClasses, generateCenteringClasses, generateContentGrid } from '@/lib/layout-utils';
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
  // Generate content area classes (enhanced for new layout approach)
  const mainContentClasses = generateContentClasses('main', mainClassName);
  const sidebarContentClasses = generateContentClasses('sidebar', sidebarClassName);

  // Determine if sidebar should be rendered
  const shouldShowSidebar = sidebarType !== 'none' && sidebarContent;

  return (
    // NEW: Outer centering wrapper - centers content within available shell space
    <div className={cn(
      layoutClasses.container.responsive, // Responsive padding
      generateCenteringClasses(), // Proper centering within available space
      className
    )}>
      {/* NEW: Inner content grid with proper total width allocation */}
      <div 
        className={cn(
          // Use new content grid generator for proper width allocation
          generateContentGrid(
            shouldShowSidebar 
              ? (sidebarType === 'fixed' ? 'two-column-fixed' : 'two-column-flex')
              : 'single'
          ),
          // Anti-compression utilities
          layoutClasses.antiCompression.gridItem
        )}
      >
        {/* Main content area */}
        <main 
          className={mainContentClasses}
          role="main"
        >
          {mainContent}
          {children}
        </main>

        {/* Sidebar content area (conditional) */}
        {shouldShowSidebar && (
          <aside 
            className={sidebarContentClasses}
            role="complementary"
          >
            {sidebarContent}
          </aside>
        )}
      </div>
    </div>
  );
};