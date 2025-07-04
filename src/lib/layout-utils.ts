// ABOUTME: Reddit-inspired layout utility system with standardized content width constraints and responsive patterns

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Reddit-inspired layout constants
export const LAYOUT_CONSTANTS = {
  // Content width constraints (based on Reddit's approach)
  MAIN_CONTENT_MAX_WIDTH: 756, // px - Main content area max width
  SIDEBAR_MAX_WIDTH: 316,       // px - Sidebar max width  
  SIDEBAR_MIN_WIDTH: 280,       // px - Sidebar min width
  
  // Responsive breakpoints (aligned with useIsMobile hook)
  MOBILE_BREAKPOINT: 768,       // px - Mobile/desktop breakpoint
  TABLET_BREAKPOINT: 1024,      // px - Tablet breakpoint
  DESKTOP_BREAKPOINT: 1280,     // px - Desktop breakpoint
  
  // Spacing scale
  CONTENT_PADDING: {
    mobile: 16,    // px - Mobile content padding
    tablet: 24,    // px - Tablet content padding  
    desktop: 32,   // px - Desktop content padding
  },
  
  // Grid gaps
  GRID_GAP: {
    small: 16,     // px - Small gap
    medium: 24,    // px - Medium gap
    large: 32,     // px - Large gap
  }
} as const;

// Layout type definitions
export type LayoutType = 
  | 'standard'        // Standard content + sidebar layout
  | 'content-only'    // Content only, no sidebar
  | 'centered'        // Centered content (articles, forms)
  | 'wide'           // Wide content (dashboards, tables)
  | 'full-width'     // Full width (editor, special pages)
  | 'admin';         // Admin layout patterns

export type SidebarType = 
  | 'fixed'          // Fixed width sidebar (316px)
  | 'flexible'       // Flexible width sidebar (auto)
  | 'none';          // No sidebar

// Reddit-inspired layout class generators
export const layoutClasses = {
  // Main container classes (CSS Grid based)
  container: {
    base: "w-full min-h-screen bg-background",
    grid: "grid gap-6 lg:gap-8",
    responsive: "px-4 py-6 lg:px-8",
  },
  
  // Content grid patterns (Reddit-inspired)
  contentGrid: {
    // Single column (mobile-first)
    singleColumn: "grid-cols-1",
    
    // Two column with fixed sidebar (Reddit pattern)
    twoColumnFixed: `
      grid-cols-1 
      lg:grid-cols-[minmax(0,${LAYOUT_CONSTANTS.MAIN_CONTENT_MAX_WIDTH}px)_minmax(${LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH}px,${LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH}px)]
    `,
    
    // Two column with flexible sidebar
    twoColumnFlex: `
      grid-cols-1 
      lg:grid-cols-[minmax(0,${LAYOUT_CONSTANTS.MAIN_CONTENT_MAX_WIDTH}px)_auto]
    `,
    
    // Centered content (articles, forms)
    centered: "grid-cols-1 max-w-4xl mx-auto",
    
    // Wide content (dashboards)
    wide: "grid-cols-1 max-w-6xl mx-auto",
    
    // Admin content
    admin: "grid-cols-1 space-y-6",
  },
  
  // Content area classes
  content: {
    // Main content area with proper constraints
    main: `
      min-w-0 
      max-w-[${LAYOUT_CONSTANTS.MAIN_CONTENT_MAX_WIDTH}px] 
      w-full
      overflow-hidden
    `,
    
    // Sidebar content area
    sidebar: `
      min-w-0 
      max-w-[${LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH}px]
      w-full
      hidden lg:block
    `,
    
    // Article content (centered, readable width)
    article: "max-w-4xl mx-auto w-full prose prose-lg dark:prose-invert",
    
    // Wide content 
    wide: "max-w-6xl mx-auto w-full",
    
    // Full width content
    fullWidth: "w-full",
  },
  
  // Responsive utilities
  responsive: {
    // Hide on mobile
    desktopOnly: "hidden lg:block",
    
    // Show only on mobile  
    mobileOnly: "block lg:hidden",
    
    // Responsive padding
    padding: "px-4 py-6 lg:px-8 lg:py-8",
    
    // Responsive gaps
    gap: "gap-4 lg:gap-6 xl:gap-8",
  },
  
  // Anti-compression utilities (prevents layout breaking)
  antiCompression: {
    // Prevents horizontal overflow
    preventOverflow: "overflow-hidden min-w-0",
    
    // Flexible content that can shrink
    flexContent: "min-w-0 flex-1",
    
    // Fixed content that maintains size
    fixedContent: "flex-shrink-0",
    
    // Grid item that can shrink
    gridItem: "min-w-0",
  }
};

// Layout pattern generators
export const generateLayoutClasses = (
  type: LayoutType, 
  sidebarType: SidebarType = 'none',
  className?: string
): string => {
  const baseClasses = [
    layoutClasses.container.base,
    layoutClasses.container.responsive,
    layoutClasses.antiCompression.preventOverflow,
  ];
  
  // Add grid classes based on layout type
  switch (type) {
    case 'standard':
      baseClasses.push(
        layoutClasses.container.grid,
        sidebarType === 'fixed' 
          ? layoutClasses.contentGrid.twoColumnFixed
          : sidebarType === 'flexible'
          ? layoutClasses.contentGrid.twoColumnFlex  
          : layoutClasses.contentGrid.singleColumn
      );
      break;
      
    case 'content-only':
      baseClasses.push(
        layoutClasses.container.grid,
        layoutClasses.contentGrid.singleColumn
      );
      break;
      
    case 'centered':
      baseClasses.push(
        layoutClasses.container.grid,
        layoutClasses.contentGrid.centered
      );
      break;
      
    case 'wide':
      baseClasses.push(
        layoutClasses.container.grid,
        layoutClasses.contentGrid.wide
      );
      break;
      
    case 'admin':
      baseClasses.push(layoutClasses.contentGrid.admin);
      break;
      
    case 'full-width':
      // Full width doesn't need additional grid classes
      break;
  }
  
  return twMerge(clsx(baseClasses, className));
};

// Content area class generators
export const generateContentClasses = (
  type: 'main' | 'sidebar' | 'article' | 'wide' | 'full-width',
  className?: string
): string => {
  const baseClasses = [layoutClasses.antiCompression.gridItem];
  
  switch (type) {
    case 'main':
      baseClasses.push(layoutClasses.content.main);
      break;
    case 'sidebar':
      baseClasses.push(layoutClasses.content.sidebar);
      break;
    case 'article':
      baseClasses.push(layoutClasses.content.article);
      break;
    case 'wide':
      baseClasses.push(layoutClasses.content.wide);
      break;
    case 'full-width':
      baseClasses.push(layoutClasses.content.fullWidth);
      break;
  }
  
  return twMerge(clsx(baseClasses, className));
};

// Responsive utility class generator
export const generateResponsiveClasses = (
  pattern: 'desktop-only' | 'mobile-only' | 'padding' | 'gap',
  className?: string
): string => {
  const baseClass = layoutClasses.responsive[
    pattern.replace('-', '') as keyof typeof layoutClasses.responsive
  ];
  
  return twMerge(clsx(baseClass, className));
};

// Anti-compression utility generator
export const generateAntiCompressionClasses = (
  pattern: 'prevent-overflow' | 'flex-content' | 'fixed-content' | 'grid-item',
  className?: string
): string => {
  const baseClass = layoutClasses.antiCompression[
    pattern.replace('-', '') as keyof typeof layoutClasses.antiCompression
  ];
  
  return twMerge(clsx(baseClass, className));
};

// Utility function to calculate responsive grid columns
export const calculateGridCols = (
  mainContentWidth: number = LAYOUT_CONSTANTS.MAIN_CONTENT_MAX_WIDTH,
  sidebarWidth: number = LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH,
  gap: number = LAYOUT_CONSTANTS.GRID_GAP.large
): string => {
  return `minmax(0,${mainContentWidth}px) minmax(${LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH}px,${sidebarWidth}px)`;
};

// Breakpoint utilities aligned with existing useIsMobile hook
export const breakpoints = {
  mobile: `(max-width: ${LAYOUT_CONSTANTS.MOBILE_BREAKPOINT - 1}px)`,
  tablet: `(min-width: ${LAYOUT_CONSTANTS.MOBILE_BREAKPOINT}px) and (max-width: ${LAYOUT_CONSTANTS.TABLET_BREAKPOINT - 1}px)`,
  desktop: `(min-width: ${LAYOUT_CONSTANTS.TABLET_BREAKPOINT}px)`,
  
  // Utility to check if current viewport matches breakpoint
  matches: (breakpoint: keyof typeof breakpoints) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(breakpoints[breakpoint]).matches;
  }
};

// Export everything for easy consumption
export default {
  LAYOUT_CONSTANTS,
  layoutClasses,
  generateLayoutClasses,
  generateContentClasses,
  generateResponsiveClasses,
  generateAntiCompressionClasses,
  calculateGridCols,
  breakpoints,
};