// ABOUTME: TypeScript type definitions for the standardized layout system with Reddit-inspired constraints

import { type ReactNode } from 'react';

// Layout configuration types
export type LayoutType = 
  | 'standard'        // Standard content + sidebar layout (Reddit-style)
  | 'content-only'    // Content only, no sidebar
  | 'centered'        // Centered content (articles, forms)
  | 'wide'           // Wide content (dashboards, tables)
  | 'full-width'     // Full width (editor, special pages)
  | 'admin';         // Admin layout patterns

export type SidebarType = 
  | 'fixed'          // Fixed width sidebar (316px max, 280px min)
  | 'flexible'       // Flexible width sidebar (auto)
  | 'none';          // No sidebar

export type ContentType = 
  | 'main'           // Main content area with width constraints
  | 'sidebar'        // Sidebar content area
  | 'article'        // Article content with prose styling
  | 'wide'           // Wide content for dashboards
  | 'full-width';    // Full width content

export type ResponsivePattern = 
  | 'desktop-only'   // Hide on mobile, show on desktop
  | 'mobile-only'    // Show on mobile, hide on desktop
  | 'padding'        // Responsive padding pattern
  | 'gap';           // Responsive gap pattern

export type AntiCompressionPattern = 
  | 'prevent-overflow'  // Prevents horizontal overflow
  | 'flex-content'      // Flexible content that can shrink
  | 'fixed-content'     // Fixed content that maintains size
  | 'grid-item';        // Grid item that can shrink

// Layout component prop interfaces
export interface BaseLayoutProps {
  children: ReactNode;
  className?: string;
}

export interface StandardLayoutProps extends BaseLayoutProps {
  type: LayoutType;
  sidebarType?: SidebarType;
  sidebarContent?: ReactNode;
  containerClassName?: string;
  contentClassName?: string;
  sidebarClassName?: string;
}

export interface ContentGridProps extends BaseLayoutProps {
  mainContent: ReactNode;
  sidebarContent?: ReactNode;
  sidebarType?: SidebarType;
  mainClassName?: string;
  sidebarClassName?: string;
}

export interface PageContainerProps extends BaseLayoutProps {
  type: LayoutType;
  maxWidth?: string;
  centerContent?: boolean;
}

// Layout configuration objects
export interface LayoutConfig {
  type: LayoutType;
  sidebarType: SidebarType;
  maxWidth?: number;
  centered?: boolean;
  responsive?: boolean;
}

export interface ResponsiveConfig {
  mobile: {
    columns: number;
    padding: number;
    gap: number;
  };
  tablet: {
    columns: number;
    padding: number;
    gap: number;
  };
  desktop: {
    columns: number;
    padding: number;
    gap: number;
    mainWidth?: number;
    sidebarWidth?: number;
  };
}

// Grid system types
export interface GridSystemConfig {
  mainContentMaxWidth: number;
  sidebarMaxWidth: number;
  sidebarMinWidth: number;
  gridGap: number;
  containerPadding: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

// Breakpoint types (aligned with existing system)
export interface BreakpointConfig {
  mobile: number;     // 767px and below
  tablet: number;     // 768px to 1023px
  desktop: number;    // 1024px and above
}

// Layout utility types
export interface LayoutUtilities {
  generateLayoutClasses: (type: LayoutType, sidebarType?: SidebarType, className?: string) => string;
  generateContentClasses: (type: ContentType, className?: string) => string;
  generateResponsiveClasses: (pattern: ResponsivePattern, className?: string) => string;
  generateAntiCompressionClasses: (pattern: AntiCompressionPattern, className?: string) => string;
}

// Page-specific layout types
export interface HomePageLayoutConfig extends LayoutConfig {
  showSidebar: boolean;
  carouselLayout: 'horizontal' | 'vertical' | 'grid';
}

export interface ArchivePageLayoutConfig extends LayoutConfig {
  gridColumns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  showFilters: boolean;
}

export interface CommunityPageLayoutConfig extends LayoutConfig {
  feedLayout: 'single' | 'two-column';
  sidebarWidgets: string[];
}

export interface ReviewDetailLayoutConfig extends LayoutConfig {
  contentWidth: 'narrow' | 'standard' | 'wide';
  showTableOfContents: boolean;
  showComments: boolean;
}

export interface AdminPageLayoutConfig extends LayoutConfig {
  headerHeight: number;
  showBreadcrumbs: boolean;
  actionBarPosition: 'top' | 'bottom' | 'both';
}

// Layout context types (for React Context if needed)
export interface LayoutContextValue {
  currentLayout: LayoutConfig;
  updateLayout: (config: Partial<LayoutConfig>) => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Layout measurement types
export interface LayoutMeasurements {
  containerWidth: number;
  contentWidth: number;
  sidebarWidth: number;
  availableSpace: number;
  gridGap: number;
}

// Layout state types
export interface LayoutState {
  type: LayoutType;
  sidebarType: SidebarType;
  sidebarCollapsed: boolean;
  measurements: LayoutMeasurements;
  isResponsive: boolean;
}

// Layout action types (for reducers if needed)
export type LayoutAction = 
  | { type: 'SET_LAYOUT_TYPE'; payload: LayoutType }
  | { type: 'SET_SIDEBAR_TYPE'; payload: SidebarType }
  | { type: 'TOGGLE_SIDEBAR'; }
  | { type: 'UPDATE_MEASUREMENTS'; payload: Partial<LayoutMeasurements> }
  | { type: 'SET_RESPONSIVE'; payload: boolean };

// Export a comprehensive layout configuration type
export interface LayoutSystemConfig {
  constants: GridSystemConfig;
  breakpoints: BreakpointConfig;
  responsive: ResponsiveConfig;
  utilities: LayoutUtilities;
}

// Re-export commonly used types
export type {
  ReactNode
} from 'react';