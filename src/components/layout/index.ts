// ABOUTME: Layout components index - exports all standardized layout components

export { StandardLayout } from './StandardLayout';
export { ContentGrid } from './ContentGrid';

// Re-export layout types for convenience
export type {
  LayoutType,
  SidebarType,
  ContentType,
  ResponsivePattern,
  AntiCompressionPattern,
  StandardLayoutProps,
  ContentGridProps,
  PageContainerProps,
  LayoutConfig,
  ResponsiveConfig,
  GridSystemConfig,
  BreakpointConfig,
} from '@/types/layout';