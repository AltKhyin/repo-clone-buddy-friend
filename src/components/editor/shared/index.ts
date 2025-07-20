// ABOUTME: Barrel export for unified editor components and hooks

// Unified components
export { EditableField } from './EditableField';
export { UnifiedBlockWrapper } from './UnifiedBlockWrapper';

// Unified hooks
export {
  useBlockDataUpdate,
  useTextBlockDataUpdate,
  useStyledBlockDataUpdate,
} from '../../../hooks/useBlockDataUpdate';

export {
  useBlockStyling,
  useTextBlockStyling,
  useSemanticBlockStyling,
} from '../../../hooks/useBlockStyling';

// Common imports and constants
export * from './common-imports';
export * from './placeholder-constants';

// Re-export types for convenience
export type { EditableFieldProps } from './EditableField';
export type { ContentBoundaryProps } from '../../../types/editor';
