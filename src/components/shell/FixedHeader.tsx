// ABOUTME: Fixed glass header component that appears on all pages with backdrop blur effect and theme-aware transparency.

import React from 'react';
import { cn } from '@/lib/utils';

interface FixedHeaderProps {
  className?: string;
  children?: React.ReactNode;
  isCollapsed: boolean;
  isMobile: boolean;
}

const FixedHeader = ({ className, children, isCollapsed, isMobile }: FixedHeaderProps) => {
  return (
    <header 
      className={cn(
        // Fixed positioning and dimensions - higher z-index for proper layering
        "fixed top-0 left-0 right-0 z-[60] h-16",
        
        // Glass effect with pure blur, no background opacity
        "backdrop-blur-md",
        
        // Smooth transitions for theme changes
        "transition-all duration-200",
        
        // Ensure content is properly centered and padded
        "flex items-center",
        
        // Relative positioning for absolute logo placement
        "relative",
        
        className
      )}
      style={{
        // Ensure fixed positioning is not overridden
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: '4rem'
      }}
    >
      {/* Logo positioned to match sidebar location */}
      {!isMobile && (
        <h1 
          className={cn(
            // Absolute positioning to match sidebar centering - CENTER the text around calculated points
            "absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "font-serif font-medium tracking-tight text-3xl text-foreground",
            "transition-all duration-300",
            "z-10",
            // Position calculations: center text around sidebar center points
            isCollapsed ? "left-10" : "left-[120px]" // Center text at 40px and 120px respectively
          )}
        >
          {isCollapsed ? "R." : "Reviews."}
        </h1>
      )}
      
      {/* Mobile logo - always show full logo, centered */}
      {isMobile && (
        <h1 className="absolute left-4 top-1/2 transform -translate-y-1/2 font-serif font-medium tracking-tight text-3xl text-foreground">
          Reviews.
        </h1>
      )}

      {/* Content container with responsive padding */}
      <div className="w-full max-w-[1200px] mx-auto px-4 lg:px-8">
        {children}
      </div>
    </header>
  );
};

export default FixedHeader;