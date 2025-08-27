// ABOUTME: Simplified StandardLayout component following Gemini's architectural recommendations for single-purpose container

import React from 'react';
import { type StandardLayoutProps } from '@/types/layout';
import { cn } from '@/lib/utils';

// Simplified layout class generator following Gemini's approach
const getSimpleLayoutClasses = (type: string): string => {
  switch (type) {
    case 'full-width':
      return 'w-full min-h-screen bg-background';
    default:
      return 'w-full min-h-screen bg-background';
  }
};

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
  // Determine if sidebar should be rendered
  const shouldShowSidebar = sidebarType !== 'none' && sidebarContent;

  // Full-width layout (for editor, special pages)
  if (type === 'full-width') {
    return <div className={cn(getSimpleLayoutClasses(type), className)}>{children}</div>;
  }

  // All other layouts use the simplified container approach
  return (
    <div className={cn(getSimpleLayoutClasses(type), className)}>
      <div className={cn('w-full max-w-[1200px] mx-auto px-4 lg:px-8', containerClassName)}>
        {shouldShowSidebar ? (
          // Two-column layout with sidebar
          <div className="grid grid-cols-1 lg:grid-cols-[756px_316px] gap-6 lg:gap-8">
            <main className={cn('min-w-0', contentClassName)} role="main">
              {children}
            </main>
            <aside className={cn('w-full max-w-[316px]', sidebarClassName)} role="complementary">
              {sidebarContent}
            </aside>
          </div>
        ) : (
          // Single-column layout
          <main className={cn('w-full', contentClassName)} role="main">
            {children}
          </main>
        )}
      </div>
    </div>
  );
};
