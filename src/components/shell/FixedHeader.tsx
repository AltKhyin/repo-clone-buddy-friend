// ABOUTME: Fixed glass header component that appears on all pages with backdrop blur effect and theme-aware transparency.

import React from 'react';
import { cn } from '@/lib/utils';

interface FixedHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

const FixedHeader = ({ className, children }: FixedHeaderProps) => {
  return (
    <header 
      className={cn(
        // Fixed positioning and dimensions
        "fixed top-0 left-0 right-0 z-50 h-16",
        
        // Glass effect with pure blur, no background opacity
        "backdrop-blur-md",
        
        // Subtle border for definition
        "border-b border-border/20",
        
        // Smooth transitions for theme changes
        "transition-all duration-200",
        
        // Ensure content is properly centered and padded
        "flex items-center",
        
        className
      )}
    >
      {/* Content container with responsive padding */}
      <div className="w-full max-w-[1200px] mx-auto px-4 lg:px-8">
        {children}
      </div>
    </header>
  );
};

export default FixedHeader;