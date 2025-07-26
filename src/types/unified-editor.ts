// ABOUTME: Type definitions for the EVIDENS Unified Rich Content Editor system

import type { JSONContent } from '@tiptap/react';

// ============================================================================
// CORE EDITOR TYPES
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface RichContentBlock {
  id: string;
  type: 'richText'; // Only one block type in unified system
  position: Point;
  dimensions: Size;
  content: {
    tiptapJSON: JSONContent; // Native TipTap content format
    htmlContent: string; // Rendered HTML for export/display
  };
  styling: {
    backgroundColor: ColorValue; // Token-based or custom color
    borderColor: ColorValue;
    borderWidth: number;
    borderRadius: number;
    padding: { x: number; y: number };
    opacity: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };
}

// ============================================================================
// CANVAS & INTERACTION TYPES
// ============================================================================

export interface CanvasState {
  zoom: number;
  viewport: Point;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface SelectionState {
  primary: string | null; // Primary selected block
  secondary: string[]; // Additional selected blocks
  selectionRect: DOMRect | null; // Multi-selection bounding box
  lastSelected: string | null; // For shift-click selection
}

export interface EditorInteractionState {
  focusedBlockId: string | null;
  activeEditor: {
    blockId: string | null;
    selection: any | null; // TipTap selection range
    contextualFeatures: ToolbarFeature[];
  };
}

// ============================================================================
// TOOLBAR & UI TYPES
// ============================================================================

export interface ToolbarFeature {
  id: string;
  type: 'button' | 'dropdown' | 'color-picker' | 'separator';
  icon?: string;
  label: string;
  isActive: boolean;
  isAvailable: boolean;
  group: 'structure' | 'formatting' | 'block' | 'insert' | 'actions';
  shortcut?: string;
  action: () => void;
}

export interface ContextualToolbarState {
  visible: boolean;
  position: Point;
  features: ToolbarFeature[];
  currentContext: 'text' | 'block' | 'table' | 'image' | 'code' | null;
}

// ============================================================================
// SAFE ZONE & INTERACTION TYPES
// ============================================================================

export enum InteractionZone {
  SAFE_ZONE = 'safe-zone', // Text editing area
  DRAG_HANDLE = 'drag-handle', // Block dragging area
  RESIZE_HANDLE = 'resize-handle', // Block resizing area
  SELECTION_AREA = 'selection-area', // Block selection area
  OUTSIDE = 'outside', // Outside block boundaries
}

export interface SafeZoneConfig {
  HANDLE_WIDTH: number; // px - drag handle width
  RESIZE_CORNER_SIZE: number; // px - resize corner hit area
  SAFE_ZONE_PADDING: number; // px - minimum safe zone padding
  HOVER_THRESHOLD: number; // px - hover detection threshold
  SELECTION_OUTLINE: number; // px - selection outline width
  FOCUS_RING_WIDTH: number; // px - focus ring width
  MIN_DRAG_DISTANCE: number; // px - minimum drag to trigger
  DOUBLE_CLICK_THRESHOLD: number; // ms - double click timing
  LONG_PRESS_THRESHOLD: number; // ms - touch long press
}

export interface DragHandle {
  id: string;
  type: 'corner' | 'edge' | 'move';
  position:
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
  cursor: string;
  hitArea: DOMRect;
  action: 'resize' | 'move';
}

// ============================================================================
// GRID & POSITIONING TYPES
// ============================================================================

export interface GridConfig {
  enabled: boolean;
  size: number; // Grid cell size in pixels
  subdivisions: number; // Sub-grid divisions
  snapThreshold: number; // Snap sensitivity in pixels
  visualStyle: 'dots' | 'lines' | 'none';
  opacity: number; // Grid visibility
  color: string; // Grid color
}

export interface AutoResizeConfig {
  direction: 'down'; // Only expand downward
  minHeight: number; // Minimum block height
  maxHeight: number; // Maximum block height (optional)
  contentPadding: number; // Content to container padding
  debounceMs: number; // Resize debounce timing
  animationDuration: number; // Resize animation duration
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface EditorStore {
  // Canvas State
  canvas: CanvasState;

  // Block Management
  blocks: RichContentBlock[];
  selection: SelectionState;
  interaction: EditorInteractionState;

  // Theme State
  theme: ThemeState;

  // Toolbar State
  toolbar: ContextualToolbarState;

  // Configuration
  config: {
    safeZone: SafeZoneConfig;
    grid: GridConfig;
    autoResize: AutoResizeConfig;
  };

  // Actions
  actions: {
    // Block operations
    createBlock: (position: Point, content?: JSONContent) => string;
    updateBlock: (id: string, updates: Partial<RichContentBlock>) => void;
    deleteBlock: (id: string) => void;
    duplicateBlock: (id: string) => string;

    // Selection operations
    selectBlock: (id: string, options?: { multiSelect?: boolean; rangeSelect?: boolean }) => void;
    focusBlock: (id: string) => void;
    clearSelection: () => void;

    // Content operations
    updateContent: (blockId: string, content: JSONContent) => void;
    applyFormatting: (blockId: string, formatting: any) => void;

    // Canvas operations
    setZoom: (zoom: number) => void;
    setViewport: (viewport: Point) => void;
    toggleGrid: () => void;

    // Theme operations
    setTheme: (mode: 'light' | 'dark') => void;
    updateCustomColor: (key: string, value: string) => void;
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface BlockEvent {
  blockId: string;
  type: 'select' | 'focus' | 'blur' | 'update' | 'delete';
  data?: any;
}

export interface CanvasEvent {
  type: 'zoom' | 'pan' | 'click' | 'key';
  data?: any;
}

export interface EditorEvent {
  type: 'content-change' | 'selection-change' | 'focus-change';
  blockId: string;
  data?: any;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ColorValue = string; // Token reference (--color-*) or custom color (#hex, rgb(), etc.)

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExportOptions {
  format: 'json' | 'html' | 'markdown' | 'docx';
  includeMetadata: boolean;
  resolveTokens: boolean; // Convert tokens to actual colors for export
}

export interface ImportResult {
  blocks: RichContentBlock[];
  warnings: string[];
  errors: string[];
}
