// ABOUTME: StandardLayout component implementing Reddit-inspired layout system with proper centering and total content width allocation

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateLayoutClasses, generateContentClasses, generateCenteringClasses } from '@/lib/layout-utils';
import { type StandardLayoutProps } from '@/types/layout';
import { cn } from '@/lib/utils';

export const StandardLayout: React.FC<StandardLayoutProps> = ({
  type,
  sidebarType = 'none',
  sidebarContent,
  children,
  className,
  containerClassName,
  contentClassName,
  sidebarClassName,
}) => {
  const isMobile = useIsMobile();

  // Generate layout classes using the utility system
  const layoutClasses = generateLayoutClasses(type, sidebarType, className);
  const mainContentClasses = generateContentClasses('main', contentClassName);
  const sidebarContentClasses = generateContentClasses('sidebar', sidebarClassName);

  // Determine if sidebar should be rendered
  const shouldShowSidebar = sidebarType !== 'none' && sidebarContent;

  // Handle different layout types
  const renderLayout = () => {
    switch (type) {
      case 'standard':
        return (
          // NEW: Wrap in centering container for proper layout within available space
          <div className={cn(
            generateCenteringClasses(), // Center content within available shell space
            className, // Apply className to centering wrapper
            containerClassName
          )}>
            <div className={cn(layoutClasses)}>
              {/* Main content area */}
              <main className={mainContentClasses} role="main">
                {children}
              </main>
              
              {/* Sidebar content area */}
              {shouldShowSidebar && (
                <aside className={sidebarContentClasses} role="complementary">
                  {sidebarContent}
                </aside>
              )}
            </div>
          </div>
        );

      case 'content-only':
        return (
          // NEW: Wrap in centering container for proper layout within available space
          <div className={cn(
            generateCenteringClasses(), // Center content within available shell space
            className, // Apply className to centering wrapper
            containerClassName
          )}>
            <div className={cn(layoutClasses)}>
              <main className={generateContentClasses('full-width', contentClassName)} role="main">
                {children}
              </main>
            </div>
          </div>
        );

      case 'centered':
        return (
          // NEW: Wrap in centering container for proper layout within available space
          <div className={cn(
            generateCenteringClasses(), // Center content within available shell space
            className, // Apply className to centering wrapper
            containerClassName
          )}>
            <div className={cn(layoutClasses)}>
              <main className={generateContentClasses('article', contentClassName)} role="main">
                {children}
              </main>
            </div>
          </div>
        );

      case 'wide':
        return (
          // NEW: Wrap in centering container for proper layout within available space
          <div className={cn(
            generateCenteringClasses(), // Center content within available shell space
            className, // Apply className to centering wrapper
            containerClassName
          )}>
            <div className={cn(layoutClasses)}>
              <main className={generateContentClasses('wide', contentClassName)} role="main">
                {children}
              </main>
            </div>
          </div>
        );

      case 'admin':
        return (
          // NEW: Wrap in centering container for proper layout within available space
          <div className={cn(
            generateCenteringClasses(), // Center content within available shell space
            className, // Apply className to centering wrapper
            containerClassName
          )}>
            <div className={cn(layoutClasses)}>
              <main className={cn('space-y-6', contentClassName)} role="main">
                {children}
              </main>
            </div>
          </div>
        );

      case 'full-width':
        return (
          // Full-width layout uses entire available space without centering
          <div className={cn(layoutClasses, containerClassName)}>
            <main className={generateContentClasses('full-width', contentClassName)} role="main">
              {children}
            </main>
          </div>
        );

      default:
        // Fallback to standard layout with proper centering
        return (
          <div className={cn(
            generateCenteringClasses(), // Center content within available shell space
            className, // Apply className to centering wrapper
            containerClassName
          )}>
            <div className={cn(layoutClasses)}>
              <main className={mainContentClasses} role="main">
                {children}
              </main>
              {shouldShowSidebar && (
                <aside className={sidebarContentClasses} role="complementary">
                  {sidebarContent}
                </aside>
              )}
            </div>
          </div>
        );
    }
  };

  return renderLayout();
};