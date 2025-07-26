// ABOUTME: Export all components from the unified editor system

export { UnifiedEditor } from './UnifiedEditor';
export { EditorCanvas } from './EditorCanvas';
export { RichContentBlock } from './RichContentBlock';
export { UnifiedTipTapEditor } from './UnifiedTipTapEditor';

// Re-export store hooks for convenience
export {
  useUnifiedEditorStore,
  useEditorActions,
  useBlocks,
  useCanvasState,
  useSelection,
  useBlock,
  useIsBlockSelected,
  useFocusedBlock,
} from '@/store/unifiedEditorStore';

// Re-export types
export type {
  RichContentBlock as RichContentBlockType,
  Point,
  Size,
  EditorStore,
  InteractionZone,
  ToolbarFeature,
  ExportOptions,
  ImportResult,
} from '@/types/unified-editor';
