// ABOUTME: TypeScript interfaces and types for the Visual Composition Engine editor

import { z } from 'zod';

// ===== ENHANCED PADDING SYSTEM =====

// Viewport-specific padding with zero-to-positive range (0px to +100px)
export const ViewportPaddingSchema = z.object({
  top: z.number().min(0).max(100).optional(),
  right: z.number().min(0).max(100).optional(), 
  bottom: z.number().min(0).max(100).optional(),
  left: z.number().min(0).max(100).optional(),
});

// Enhanced padding system supporting both legacy and viewport-specific padding
export const EnhancedPaddingSchema = z.object({
  // Viewport-specific padding (new system)
  desktopPadding: ViewportPaddingSchema.optional(),
  mobilePadding: ViewportPaddingSchema.optional(),
  
  // Legacy individual padding (for backward compatibility)
  paddingTop: z.number().min(0).max(100).optional(),
  paddingRight: z.number().min(0).max(100).optional(),
  paddingBottom: z.number().min(0).max(100).optional(),
  paddingLeft: z.number().min(0).max(100).optional(),
  
  // Legacy symmetric padding (for migration only)
  paddingX: z.number().optional(), // @deprecated - for migration only
  paddingY: z.number().optional(), // @deprecated - for migration only
});

// ===== BLOCK PRESET SYSTEM =====

// Block preset metadata
export const BlockPresetMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  category: z.enum(['text', 'media', 'layout', 'custom']).default('custom'),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().optional(),
  useCount: z.number().int().min(0).default(0),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

// Complete block preset data structure
export const BlockPresetSchema = z.object({
  metadata: BlockPresetMetadataSchema,
  blockType: z.string(), // e.g., 'richBlock', 'textBlock', etc.
  blockData: z.record(z.any()), // The actual block data to be applied
  thumbnail: z.string().optional(), // Base64 encoded thumbnail for preview
});

// Block preset collection for localStorage persistence
export const BlockPresetCollectionSchema = z.object({
  version: z.literal('1.0'),
  presets: z.array(BlockPresetSchema),
  lastModified: z.string().datetime(),
});

// ===== LAYOUT SYSTEM =====

export const LayoutItemSchema = z.object({
  nodeId: z.string().uuid(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(24), // Increased to support full-width diagrams
  h: z.number().int().min(1),
});

export const LayoutConfigSchema = z.object({
  gridSettings: z.object({
    columns: z.number().int().min(1).max(24), // Increased to support flexible layouts
  }),
  items: z.array(LayoutItemSchema),
});

// Master layout schema (desktop - never auto-overwritten)
export const MasterLayoutSchema = z.object({
  type: z.literal('master'),
  data: LayoutConfigSchema,
  lastModified: z.string().datetime(),
});

// Derived layout schema (mobile - generated from master)
export const DerivedLayoutSchema = z.object({
  type: z.literal('derived'),
  isGenerated: z.boolean(),
  generatedFromHash: z.string().optional(),
  data: LayoutConfigSchema,
  hasCustomizations: z.boolean(),
  lastModified: z.string().datetime(),
});

// Master/Derived layout system
export const MasterDerivedLayoutsSchema = z.object({
  desktop: MasterLayoutSchema,
  mobile: DerivedLayoutSchema,
});

// Legacy layout schema for backward compatibility
export const LegacyLayoutsSchema = z.object({
  desktop: LayoutConfigSchema,
  mobile: LayoutConfigSchema,
});

// Union schema that supports both old and new formats
export const LayoutsSchema = z.union([MasterDerivedLayoutsSchema, LegacyLayoutsSchema]);

// ===== WYSIWYG POSITIONING SYSTEM =====

// Direct pixel positioning for WYSIWYG canvas
export const BlockPositionSchema = z.object({
  id: z.string(),
  x: z.number().min(0), // Direct pixel X coordinate (0-800)
  y: z.number().min(0), // Direct pixel Y coordinate
  width: z.number().min(50), // Block width in pixels (minimum 50px)
  height: z.number(), // Block height in pixels
  zIndex: z.number().optional(), // Stacking order for overlapping blocks
});

// WYSIWYG canvas metadata
export const WYSIWYGCanvasSchema = z.object({
  canvasWidth: z.number().min(600).default(800), // Canvas width (fixed at 800px)
  canvasHeight: z.number().min(400), // Dynamic canvas height based on content
  gridColumns: z.number().min(1).default(12), // Grid columns for snapping (12-column system)
  snapTolerance: z.number().min(0).default(10), // Snap tolerance in pixels
});

// Positions lookup object for all blocks
export const BlockPositionsSchema = z.record(z.string(), BlockPositionSchema);

// ===== BLOCK DATA SCHEMAS =====

export const TextBlockDataSchema = z.object({
  htmlContent: z.string(),
  // Typography
  fontSize: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  lineHeight: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  // Background and borders
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
}).merge(EnhancedPaddingSchema);

export const ImageBlockDataSchema = z.object({
  src: z.string(),
  alt: z.string(),
  // HTML caption for typography integration (like TextBlock)
  htmlCaption: z.string().optional(),
  borderRadius: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  // Spacing and styling 
  backgroundColor: z.string().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Caption styling properties - applied as CSS like TextBlock
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
}).merge(EnhancedPaddingSchema);

// DEPRECATED: TableBlockDataSchema - Use RichBlockDataSchema with TipTap table extension instead
// This schema is maintained for backward compatibility and migration purposes only
export const TableBlockDataSchema = z.object({
  // HTML headers for typography integration (like TextBlock)
  htmlHeaders: z.array(z.string()),
  // HTML cells for typography integration with multi-line support
  htmlRows: z.array(z.array(z.string())),
  headerStyle: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    })
    .optional(),
  alternatingRowColors: z.boolean().optional(),
  sortable: z.boolean().default(true),
  // Spacing and styling properties
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Table content styling properties - applied as CSS like TextBlock
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
}).merge(EnhancedPaddingSchema);

// REMOVED: PollBlockDataSchema - Poll functionality moved to community-only features
// Editor polls were removed as part of M1.2 selection system cleanup
// Community polls remain available in the community section

export const KeyTakeawayBlockDataSchema = z.object({
  // HTML content for typography integration (like TextBlock)
  htmlContent: z.string(),
  icon: z.string().optional(),
  theme: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Typography for content - applied as CSS like TextBlock
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
}).merge(EnhancedPaddingSchema);

export const ReferenceBlockDataSchema = z.object({
  authors: z.string(),
  year: z.number(),
  title: z.string(),
  source: z.string(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
  formatted: z.string().optional(), // Legacy APA formatted citation (plain text)
  htmlFormatted: z.string().optional(), // HTML formatted citation for rich text editing
  // Universal styling properties
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Typography for reference text
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'overline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic', 'oblique']).optional(),
}).merge(EnhancedPaddingSchema);

export const QuoteBlockDataSchema = z.object({
  // HTML content for typography integration (like TextBlock)
  htmlContent: z.string(),
  htmlCitation: z.string().optional(),
  authorImage: z.string().optional(),
  style: z.enum(['default']).default('default'),
  borderColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  // Typography for quote content - applied as CSS like TextBlock
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
}).merge(EnhancedPaddingSchema);

export const VideoEmbedBlockDataSchema = z.object({
  url: z.string(),
  platform: z.enum(['youtube', 'vimeo']),
  autoplay: z.boolean().default(false),
  // Spacing and styling
  backgroundColor: z.string().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  borderRadius: z.number().optional(),
}).merge(EnhancedPaddingSchema);

export const SeparatorBlockDataSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().optional(),
  thickness: z.number().min(1).max(10).default(1),
  width: z.enum(['full', 'half', 'quarter']).default('full'),
  // Universal styling properties
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
}).merge(EnhancedPaddingSchema);

// UNIFIED: RichBlockDataSchema - Single schema for all rich content including tables, text, images, videos
// TipTap extensions handle tables (customTable) natively within the editor
export const RichBlockDataSchema = z.object({
  // Content storage - TipTap JSON is the single source of truth for unified editing
  content: z.object({
    tiptapJSON: z.any().optional(), // TipTap editor JSON content with native table support
    htmlContent: z.string().default('<p>Start typing...</p>'), // HTML representation for fallback display
  }),
  // Universal styling properties
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Typography properties
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  // Future collapsible functionality: Heading structure metadata
  headingStructure: z.object({
    headingNodes: z.array(z.object({
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
      text: z.string(),
      position: z.number(), // Position in TipTap document
      id: z.string(), // Unique ID for collapsible grouping
    })),
    lastAnalyzed: z.string().optional(), // ISO string timestamp
  }).optional(),
}).merge(EnhancedPaddingSchema);

// ===== MASTER NODE SCHEMA =====
// NOTE: tableBlock and pollBlock are DEPRECATED
// tableBlock: use richBlock with TipTap table extension instead
// pollBlock: removed from editor, polls moved to community-only features

export const NodeSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string().uuid(), type: z.literal('textBlock'), data: TextBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('imageBlock'), data: ImageBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('tableBlock'), data: TableBlockDataSchema }), // DEPRECATED: Use richBlock with TipTap table extension
  // REMOVED: pollBlock support - polls moved to community-only features
  z.object({
    id: z.string().uuid(),
    type: z.literal('keyTakeawayBlock'),
    data: KeyTakeawayBlockDataSchema,
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('referenceBlock'),
    data: ReferenceBlockDataSchema,
  }),
  z.object({ id: z.string().uuid(), type: z.literal('quoteBlock'), data: QuoteBlockDataSchema }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('videoEmbedBlock'),
    data: VideoEmbedBlockDataSchema,
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('separatorBlock'),
    data: SeparatorBlockDataSchema,
  }),
  z.object({
    id: z.string().uuid(),
    type: z.literal('richBlock'),
    data: RichBlockDataSchema,
  }),
]);

// ===== ROOT SCHEMA =====

export const StructuredContentV2Schema = z.object({
  version: z.literal('2.0.0'),
  nodes: z.array(NodeSchema),
  layouts: LayoutsSchema,
  globalStyles: z.record(z.any()).optional(),
  metadata: z
    .object({
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      editorVersion: z.string(),
    })
    .optional(),
});

// WYSIWYG Structured Content (V3) - uses direct pixel positioning
export const StructuredContentV3Schema = z.object({
  version: z.literal('3.0.0'),
  nodes: z.array(NodeSchema),
  positions: BlockPositionsSchema, // Direct pixel positions for desktop
  mobilePositions: BlockPositionsSchema.optional(), // Optional mobile-specific positions
  canvas: WYSIWYGCanvasSchema, // Canvas configuration and metadata
  globalStyles: z.record(z.any()).optional(),
  metadata: z
    .object({
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      editorVersion: z.string(),
      migratedFrom: z.string().optional(), // Track migration from previous versions
    })
    .optional(),
});

// Union schema supporting both V2 and V3 for backward compatibility
export const StructuredContentSchema = z.union([
  StructuredContentV3Schema,
  StructuredContentV2Schema,
]);

// ===== EXPORTED TYPES =====

export type NodeObject = z.infer<typeof NodeSchema>;
export type LayoutItem = z.infer<typeof LayoutItemSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;

// Master/Derived layout types (legacy)
export type MasterLayout = z.infer<typeof MasterLayoutSchema>;
export type DerivedLayout = z.infer<typeof DerivedLayoutSchema>;
export type MasterDerivedLayouts = z.infer<typeof MasterDerivedLayoutsSchema>;
export type LegacyLayouts = z.infer<typeof LegacyLayoutsSchema>;

// Union type for backward compatibility
export type Layouts = z.infer<typeof LayoutsSchema>;
export type StructuredContentV2 = z.infer<typeof StructuredContentV2Schema>;

// WYSIWYG positioning types
export type BlockPosition = z.infer<typeof BlockPositionSchema>;
export type BlockPositions = z.infer<typeof BlockPositionsSchema>;
export type WYSIWYGCanvas = z.infer<typeof WYSIWYGCanvasSchema>;
export type StructuredContentV3 = z.infer<typeof StructuredContentV3Schema>;
export type StructuredContent = z.infer<typeof StructuredContentSchema>;

// Block-specific types
export type TextBlockData = z.infer<typeof TextBlockDataSchema>;
export type ImageBlockData = z.infer<typeof ImageBlockDataSchema>;
export type TableBlockData = z.infer<typeof TableBlockDataSchema>;
// REMOVED: PollBlockData type - polls moved to community-only features
export type KeyTakeawayBlockData = z.infer<typeof KeyTakeawayBlockDataSchema>;
export type ReferenceBlockData = z.infer<typeof ReferenceBlockDataSchema>;
export type QuoteBlockData = z.infer<typeof QuoteBlockDataSchema>;
export type VideoEmbedBlockData = z.infer<typeof VideoEmbedBlockDataSchema>;
export type SeparatorBlockData = z.infer<typeof SeparatorBlockDataSchema>;
export type RichBlockData = z.infer<typeof RichBlockDataSchema>;

// Enhanced padding system types
export type ViewportPadding = z.infer<typeof ViewportPaddingSchema>;
export type EnhancedPadding = z.infer<typeof EnhancedPaddingSchema>;

// Block preset system types
export type BlockPresetMetadata = z.infer<typeof BlockPresetMetadataSchema>;
export type BlockPreset = z.infer<typeof BlockPresetSchema>;
export type BlockPresetCollection = z.infer<typeof BlockPresetCollectionSchema>;

// ===== EDITOR STATE TYPES =====

export type Viewport = 'desktop' | 'mobile';

export interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
}

// Text Selection State for Unified Typography Editing
export interface TextSelectionInfo {
  /** ID of the block containing the selected text */
  blockId: string | null;
  /** The selected text content */
  selectedText: string;
  /** DOM element containing the selected text */
  textElement: HTMLElement | null;
  /** Selection range for precise text manipulation */
  range: Range | null;
  /** Whether text is currently selected */
  hasSelection: boolean;
}

// ===== UNIFIED SELECTION SYSTEM =====

/**
 * Types of content selection within Rich Blocks
 */
export enum ContentSelectionType {
  NONE = 'none',
  TEXT = 'text', // Text selection within TipTap editor
  TABLE_CELL = 'table_cell', // Table cell editing
  INLINE_IMAGE = 'inlineImage', // Inline image node selection
  VIDEO_EMBED = 'videoEmbed', // Video embed node selection
}

/**
 * Content-specific selection data for different interaction types
 */
export interface ContentSelectionInfo {
  type: ContentSelectionType;
  blockId: string;
  data: {
    // Text selection data (when type === TEXT)
    textSelection?: TextSelectionInfo;

    // Table cell selection data (when type === TABLE_CELL)
    tableCell?: {
      tableId: string;
      cellPosition: { row: number; col: number };
      isEditing: boolean;
      editValue?: string;
    };

    // Media node selection data (when type === INLINE_IMAGE or VIDEO_EMBED)
    mediaNode?: {
      nodeType: 'inlineImage' | 'videoEmbed';
      position: number;
      attrs: {
        src: string;
        alt?: string;
        width?: number;
        height?: number;
        objectFit?: 'contain' | 'cover' | 'fill' | 'original';
        size?: 'small' | 'medium' | 'large' | 'auto';
        // Video-specific attributes
        provider?: 'youtube' | 'vimeo' | 'direct';
        videoId?: string;
        thumbnail?: string;
        // Image-specific attributes
        caption?: string;
        loading?: string;
      };
      // Update function for modifying node attributes
      updateAttributes?: (attributes: Record<string, any>) => void;
    };
  };
}

/**
 * Unified selection state coordinating block and content selection
 * Following the hierarchy: Block Selection > Content Selection > UI State
 */
export interface SelectionState {
  // Block-level selection (shows resize handles, activates block)
  activeBlockId: string | null;

  // Content-level selection (editing within the active block)
  contentSelection: ContentSelectionInfo | null;

  // Selection coordination flags
  hasBlockSelection: boolean;
  hasContentSelection: boolean;

  // Prevents multiple selections across different blocks
  preventMultiSelection: boolean;
}

// Unified Content Boundary System for Resize
export interface ContentBoundaryProps {
  /** Block ID for identification */
  id: string;
  /** Content width in pixels */
  width: number;
  /** Content height in pixels */
  height: number;
  /** X position on canvas */
  x: number;
  /** Y position on canvas */
  y: number;
  /** Whether block is currently selected */
  selected: boolean;
  /** Block type for styling purposes */
  blockType: string;
  /** Content to be rendered inside the boundary */
  children: React.ReactNode;
  /** Additional styling for content */
  contentStyles?: React.CSSProperties;
  /** Callback when content boundaries are resized */
  onResize?: (dimensions: { width: number; height: number }) => void;
  /** Callback when content is moved */
  onMove?: (position: { x: number; y: number }) => void;
  /** Callback when block is selected (for unified selection system) */
  onSelect?: () => void;
  /** Whether resize handles should be visible */
  showResizeHandles?: boolean;
  /** Minimum content dimensions */
  minDimensions?: { width: number; height: number };
  /** Maximum content dimensions */
  maxDimensions?: { width: number; height: number };
  /** Whether to show drag handle for better discoverability */
  showDragHandle?: boolean;
  /** Whether to enable resize constraints (default: true) */
  enableConstraints?: boolean;
  /** Whether this is a read-only instance (disables interactions) */
  readOnly?: boolean;
}

// Content-Aware Block Position (extends existing BlockPosition)
export interface ContentAwareBlockPosition extends BlockPosition {
  /** Actual content width (may differ from container width) */
  contentWidth: number;
  /** Actual content height (may differ from container height) */
  contentHeight: number;
  /** Content offset from container left edge */
  contentOffsetX: number;
  /** Content offset from container top edge */
  contentOffsetY: number;
  /** Whether content boundaries are locked to container */
  contentLocked: boolean;
}

export interface EditorState {
  // Document State
  reviewId: string | null;
  title: string;
  description: string;

  // Content State (structured_content v3.0 - WYSIWYG positioning)
  nodes: NodeObject[];
  positions: BlockPositions; // Direct pixel positioning for desktop
  mobilePositions: BlockPositions; // Direct pixel positioning for mobile
  canvas: WYSIWYGCanvas; // Canvas configuration
  currentViewport: Viewport; // Current editing viewport (desktop/mobile)

  // Editor State
  selectedNodeId: string | null;
  textSelection: TextSelectionInfo | null; // Text selection for unified typography editing
  canvasZoom: number; // Zoom level for precision editing
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  isFullscreen: boolean;

  // Simple Block Activation - replaces complex interaction system
  activeBlockId: string | null;

  // Unified Selection System - coordinates all selection types
  selectionState: SelectionState;

  // WYSIWYG Canvas Display Options
  showGrid: boolean; // Show grid overlay for alignment
  showSnapGuides: boolean; // Show snapping guides during drag

  // Legacy support for migration
  layouts?: MasterDerivedLayouts; // Optional for backward compatibility
  canvasTransform?: CanvasTransform; // Optional for backward compatibility
  canvasTheme?: 'light' | 'dark'; // Optional for backward compatibility
  canvasBackgroundColor?: string; // Canvas background color using theme tokens
  showRulers?: boolean; // Optional for backward compatibility
  showGuidelines?: boolean; // Optional for backward compatibility
  guidelines?: {
    // Optional for backward compatibility
    horizontal: number[];
    vertical: number[];
  };

  // TipTap Editor Registry for unified insertion architecture
  editorRegistry: Map<string, any>; // Maps nodeId to TipTap editor instance

  // Clipboard State
  clipboardData: NodeObject[] | null;

  // History State (for undo/redo)
  history: (StructuredContentV2 | StructuredContentV3)[];
  historyIndex: number;

  // Persistence Callbacks
  persistenceCallbacks: {
    save: (reviewId: string, content: StructuredContentV2 | StructuredContentV3) => Promise<any>;
    load: (reviewId: string) => Promise<any>;
  } | null;

  // Actions
  addNode: (node: Partial<NodeObject>) => void;
  updateNode: (nodeId: string, updates: Partial<NodeObject>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setTextSelection: (textSelection: TextSelectionInfo | null) => void;

  // TipTap Editor Registry Actions
  registerEditor: (nodeId: string, editor: any) => void;
  unregisterEditor: (nodeId: string) => void;
  getEditor: (nodeId: string) => any;

  // Simple Block Activation Actions (Legacy - maintained for compatibility)
  setActiveBlock: (blockId: string | null) => void;

  // Unified Selection Coordination Actions
  activateBlock: (blockId: string | null) => void;
  setContentSelection: (contentSelection: ContentSelectionInfo | null) => void;
  clearAllSelection: () => void;

  // Content-specific selection actions
  selectTableCell: (
    blockId: string,
    tableId: string,
    cellPosition: { row: number; col: number },
    isEditing?: boolean
  ) => void;
  // REMOVED: selectPollOption and selectPollQuestion - polls moved to community-only features

  // Selection state queries
  isBlockActive: (blockId: string) => boolean;
  hasContentSelection: () => boolean;
  getActiveContentType: () => ContentSelectionType;

  // WYSIWYG Position Management Actions
  updateNodePosition: (nodeId: string, positionUpdate: Partial<BlockPosition>) => void;
  initializeNodePosition: (nodeId: string, blockType?: string) => void;
  updateCanvasZoom: (zoom: number) => void;
  toggleSnapGuides: () => void;

  // Legacy Layout Actions (for backward compatibility)
  updateLayout: (nodeId: string, layout: LayoutItem, viewport: Viewport) => void;

  // Dual Viewport System  
  switchViewport: (viewport: Viewport) => void;
  generateMobileLayout: () => void; // Simple mobile layout generation from desktop
  updateCanvasTransform: (transform: Partial<CanvasTransform>) => void;
  setCanvasTheme: (theme: 'light' | 'dark') => void;
  setCanvasBackgroundColor: (color: string) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuidelines: () => void;
  toggleFullscreen: () => void;
  addGuideline: (type: 'horizontal' | 'vertical', position: number) => void;
  removeGuideline: (type: 'horizontal' | 'vertical', position: number) => void;
  clearGuidelines: () => void;

  // Clipboard actions
  copyNodes: (nodeIds: string[]) => void;
  pasteNodes: () => void;

  // History actions
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;

  // Data persistence
  saveToDatabase: () => Promise<void>;
  loadFromDatabase: (reviewId: string) => Promise<void>;
  loadFromJSON: (json: StructuredContentV2 | StructuredContentV3) => void;
  exportToJSON: () => StructuredContentV2 | StructuredContentV3;
  exportAsTemplate: () => any;
  importFromTemplate: (templateData: any) => void;
  exportToPDF: () => Promise<void>;

  // Persistence
  setPersistenceCallbacks: (callbacks: {
    save: (reviewId: string, content: StructuredContentV2 | StructuredContentV3) => Promise<any>;
    load: (reviewId: string) => Promise<any>;
  }) => void;

  // Utilities
  reset: () => void;
  setError: (error: string | null) => void;
}

// ===== BLOCK PALETTE TYPES =====

export interface BlockType {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: 'content' | 'media' | 'data' | 'visual' | 'interactive' | 'evidens';
  description: string;
}

// ===== MEDICAL TEMPLATE TYPES =====

// ===== VALIDATION UTILITIES =====

// Migration utility: Convert plain text to HTML format
const textToHtml = (text: string | undefined | null): string => {
  if (!text || text.trim() === '') return '<p></p>';
  return `<p>${text.replace(/\n/g, '<br>')}</p>`;
};

// Migration function: Convert legacy block data to new HTML schema
const migrateLegacyBlockData = (node: any): any => {
  if (!node || !node.type || !node.data) return node;

  const migratedData = { ...node.data };

  // 🎯 MOBILE PADDING PRESERVATION: Track mobile padding during migration
  const originalMobilePadding = node.data?.mobilePadding;
  const originalDesktopPadding = node.data?.desktopPadding;
  const hasOriginalMobilePadding = Boolean(originalMobilePadding);
  const hasOriginalDesktopPadding = Boolean(originalDesktopPadding);

  switch (node.type) {
    case 'quoteBlock':
      // Migrate content -> htmlContent, citation -> htmlCitation
      if ('content' in migratedData && !('htmlContent' in migratedData)) {
        migratedData.htmlContent = textToHtml(migratedData.content);
        delete migratedData.content;
      }
      if ('citation' in migratedData && !('htmlCitation' in migratedData)) {
        migratedData.htmlCitation = textToHtml(migratedData.citation);
        delete migratedData.citation;
      }
      break;

    case 'keyTakeawayBlock':
      // Migrate content -> htmlContent, remove title/subtitle
      if ('content' in migratedData && !('htmlContent' in migratedData)) {
        migratedData.htmlContent = textToHtml(migratedData.content);
        delete migratedData.content;
      }
      // Remove legacy title/subtitle fields
      delete migratedData.title;
      delete migratedData.subtitle;
      break;

    case 'imageBlock':
      // Migrate caption -> htmlCaption
      if ('caption' in migratedData && !('htmlCaption' in migratedData)) {
        migratedData.htmlCaption = textToHtml(migratedData.caption);
        delete migratedData.caption;
      }
      break;

    // REMOVED: pollBlock migration - polls moved to community-only features

    case 'tableBlock':
      // Migrate headers -> htmlHeaders
      if ('headers' in migratedData && !('htmlHeaders' in migratedData)) {
        migratedData.htmlHeaders = Array.isArray(migratedData.headers)
          ? migratedData.headers.map((header: string) => textToHtml(header))
          : [];
        delete migratedData.headers;
      }
      // Migrate rows -> htmlRows
      if ('rows' in migratedData && !('htmlRows' in migratedData)) {
        migratedData.htmlRows = Array.isArray(migratedData.rows)
          ? migratedData.rows.map((row: string[]) =>
              Array.isArray(row) ? row.map((cell: string) => textToHtml(cell)) : []
            )
          : [];
        delete migratedData.rows;
      }

      // CRITICAL: Ensure required fields exist (handle corrupted/empty tables)
      if (!('htmlHeaders' in migratedData) || !Array.isArray(migratedData.htmlHeaders)) {
        migratedData.htmlHeaders = ['<p>Column 1</p>', '<p>Column 2</p>'];
      }
      if (!('htmlRows' in migratedData) || !Array.isArray(migratedData.htmlRows)) {
        migratedData.htmlRows = [['<p></p>', '<p></p>']];
      }

      // Ensure rows match header count
      if (migratedData.htmlHeaders.length > 0) {
        // CRITICAL: Filter out any undefined/null rows and ensure all rows are valid arrays
        migratedData.htmlRows = migratedData.htmlRows
          .filter((row: any) => row !== null && row !== undefined)
          .map((row: string[]) => {
            const normalizedRow = Array.isArray(row) ? [...row] : [];
            while (normalizedRow.length < migratedData.htmlHeaders.length) {
              normalizedRow.push('<p></p>');
            }
            return normalizedRow.slice(0, migratedData.htmlHeaders.length);
          });

        // CRITICAL: Ensure we have at least one row
        if (migratedData.htmlRows.length === 0) {
          migratedData.htmlRows = [new Array(migratedData.htmlHeaders.length).fill('<p></p>')];
        }
      }
      break;

    case 'referenceBlock':
      // Migrate formatted -> htmlFormatted
      if (
        'formatted' in migratedData &&
        migratedData.formatted &&
        !('htmlFormatted' in migratedData)
      ) {
        migratedData.htmlFormatted = textToHtml(migratedData.formatted as string);
        // Keep original formatted field for backward compatibility
      }
      break;
  }

  // 🎯 MOBILE PADDING PRESERVATION AUDIT: Log mobile padding status after migration
  const finalMobilePadding = migratedData?.mobilePadding;
  const finalDesktopPadding = migratedData?.desktopPadding;
  const hasFinalMobilePadding = Boolean(finalMobilePadding);
  const hasFinalDesktopPadding = Boolean(finalDesktopPadding);

  if (hasOriginalMobilePadding || hasOriginalDesktopPadding || hasFinalMobilePadding || hasFinalDesktopPadding) {
    console.log('[MIGRATION AUDIT] 🎯 Mobile Padding Migration Status:', {
      nodeId: node.id,
      nodeType: node.type,
      before: {
        hasDesktopPadding: hasOriginalDesktopPadding,
        hasMobilePadding: hasOriginalMobilePadding,
        desktopPaddingValue: originalDesktopPadding,
        mobilePaddingValue: originalMobilePadding
      },
      after: {
        hasDesktopPadding: hasFinalDesktopPadding,
        hasMobilePadding: hasFinalMobilePadding,
        desktopPaddingValue: finalDesktopPadding,
        mobilePaddingValue: finalMobilePadding
      },
      preservationStatus: {
        desktopPaddingPreserved: hasOriginalDesktopPadding === hasFinalDesktopPadding,
        mobilePaddingPreserved: hasOriginalMobilePadding === hasFinalMobilePadding,
        overallStatus: (hasOriginalMobilePadding === hasFinalMobilePadding && hasOriginalDesktopPadding === hasFinalDesktopPadding) ? 
          '✅ PRESERVED' : '❌ LOST/MODIFIED'
      }
    });
  }

  return { ...node, data: migratedData };
};

/**
 * 🎯 PHASE 3A: Repair malformed content structure before validation
 * Fixes common issues like RichBlock content being string instead of object
 */
const repairContentStructure = (content: any): any => {
  if (!content || typeof content !== 'object' || !Array.isArray(content.nodes)) {
    return content; // Can't repair, let validation handle it
  }

  console.log('[CONTENT REPAIR] 🔧 Analyzing content structure for repairs...');

  const repairedNodes = content.nodes.map((node: any, index: number) => {
    if (node.type === 'richBlock' && node.data) {
      // 🚨 CRITICAL REPAIR: Fix malformed RichBlock content structure
      if (typeof node.data.content === 'string') {
        const originalStringContent = node.data.content;
        console.log(`[CONTENT REPAIR] 🔧 Repairing malformed RichBlock content for node ${index} (${node.id}):`, {
          before: { contentType: 'string', content: originalStringContent.substring(0, 50) + '...' },
          after: { contentType: 'object', htmlContent: 'extracted from string' }
        });

        // Transform string content into proper object structure
        return {
          ...node,
          data: {
            ...node.data,
            content: {
              htmlContent: originalStringContent,
              // Don't add tiptapJSON since we don't have it from string content
            }
          }
        };
      }

      // ✅ Content structure is already correct
      if (node.data.content && typeof node.data.content === 'object' && 'htmlContent' in node.data.content) {
        return node; // Already has correct structure
      }

      // 🔧 EDGE CASE: Missing content property entirely
      if (!node.data.content) {
        console.log(`[CONTENT REPAIR] 🔧 Adding missing content property for node ${index} (${node.id})`);
        return {
          ...node,
          data: {
            ...node.data,
            content: {
              htmlContent: '<p>Content restored during repair</p>'
            }
          }
        };
      }
    }

    return node; // Non-richBlock nodes or already valid structure
  });

  const repairCount = repairedNodes.filter((node, index) => node !== content.nodes[index]).length;
  console.log('[CONTENT REPAIR] 🔧 Content repair summary:', {
    totalNodes: content.nodes.length,
    repairedNodes: repairCount,
    repairRate: content.nodes.length > 0 ? Math.round((repairCount / content.nodes.length) * 100) : 0
  });

  return repairCount > 0 ? {
    ...content,
    nodes: repairedNodes
  } : content;
};

export const validateStructuredContent = (content: unknown): StructuredContent => {
  // 🎯 PHASE 3A: Apply content structure repairs BEFORE validation
  const repairedContent = repairContentStructure(content);
  
  // 🎯 PHASE 2A: Enhanced logging to trace validation failures and data loss
  console.log('[PERSISTENCE AUDIT] Starting validateStructuredContent with:', {
    hasContent: !!repairedContent,
    contentType: typeof repairedContent,
    hasVersion: !!(repairedContent as any)?.version,
    version: (repairedContent as any)?.version,
    hasNodes: Array.isArray((repairedContent as any)?.nodes),
    nodeCount: Array.isArray((repairedContent as any)?.nodes) ? (repairedContent as any).nodes.length : 0,
    hasPositions: !!(repairedContent as any)?.positions,
    positionsKeys: (repairedContent as any)?.positions ? Object.keys((repairedContent as any).positions).length : 0,
    hasMobilePositions: !!(repairedContent as any)?.mobilePositions,
    mobilePositionsKeys: (repairedContent as any)?.mobilePositions ? Object.keys((repairedContent as any).mobilePositions).length : 0,
    wasRepaired: repairedContent !== content,
  });

  try {
    // First, try to parse with the new schema (using repaired content)
    const validated = StructuredContentSchema.parse(repairedContent);
    console.log('[PERSISTENCE AUDIT] ✅ Schema validation SUCCESSFUL - positioning data preserved');
    return validated;
  } catch (error) {
    // If validation fails, attempt migration from legacy format
    if (error instanceof z.ZodError) {
      console.error('[PERSISTENCE AUDIT] ❌ Schema validation FAILED - analyzing errors:', {
        errorCount: error.errors.length,
        errorPaths: error.errors.map(err => ({
          path: err.path.join('.'),
          code: err.code,
          message: err.message,
          received: err.received,
        })),
        firstFewErrors: error.errors.slice(0, 3)
      });

      // 🔍 DETAILED NODE ANALYSIS: Check for remaining malformed RichBlock content (after repair)
      if ((repairedContent as any)?.nodes) {
        const nodes = (repairedContent as any).nodes;
        console.log('[PERSISTENCE AUDIT] 🔍 Analyzing node structure after repair:');
        nodes.forEach((node: any, index: number) => {
          if (node.type === 'richBlock') {
            const hasCorrectContentStructure = node.data?.content && 
              typeof node.data.content === 'object' && 
              'htmlContent' in node.data.content;
            
            console.log(`[PERSISTENCE AUDIT] Node ${index} (${node.id}):`, {
              type: node.type,
              hasData: !!node.data,
              hasContent: !!node.data?.content,
              contentType: typeof node.data?.content,
              isContentString: typeof node.data?.content === 'string',
              hasCorrectStructure: hasCorrectContentStructure,
              contentPreview: typeof node.data?.content === 'string' 
                ? node.data.content.substring(0, 50) + '...'
                : JSON.stringify(node.data?.content).substring(0, 100) + '...',
            });

            // 🚨 REMAINING ISSUES AFTER REPAIR
            if (typeof node.data?.content === 'string') {
              console.error('[PERSISTENCE AUDIT] 🚨 REPAIR FAILED: RichBlock still has malformed content after repair!', {
                nodeId: node.id,
                nodeIndex: index,
                contentType: 'string (STILL INCORRECT)',
                expectedType: 'object with htmlContent property',
                actualContent: node.data.content,
              });
            }
          }
        });
      }

      try {
        console.warn('[PERSISTENCE AUDIT] 🔄 Attempting schema migration (using repaired content)...');
        const migrated = migrateStructuredContent(repairedContent);
        const validated = StructuredContentSchema.parse(migrated);
        console.log('[PERSISTENCE AUDIT] ✅ Schema migration SUCCESSFUL - positioning data preserved');
        return validated;
      } catch (migrationError) {
        // 🚨 CRITICAL POINT: This is where positioning data might get DESTROYED (but now with enhanced recovery)
        console.error('[PERSISTENCE AUDIT] 💥 CRITICAL: Migration FAILED - using enhanced recovery to preserve positioning!', {
          originalError: error.errors,
          migrationError: migrationError instanceof Error ? migrationError.message : migrationError,
          contentSample: JSON.stringify(repairedContent).substring(0, 200),
          originalPositionsCount: (repairedContent as any)?.positions ? Object.keys((repairedContent as any).positions).length : 0,
          originalMobilePositionsCount: (repairedContent as any)?.mobilePositions ? Object.keys((repairedContent as any).mobilePositions).length : 0,
        });
        
        // 📊 LOG POSITIONING DATA BEFORE ENHANCED RECOVERY
        if ((repairedContent as any)?.positions) {
          console.warn('[PERSISTENCE AUDIT] 📊 Positioning data will be preserved via enhanced recovery:', {
            positionsCount: Object.keys((repairedContent as any).positions).length,
            samplePositions: Object.entries((repairedContent as any).positions).slice(0, 2).map(([id, pos]: [string, any]) => ({
              id,
              x: pos.x,
              y: pos.y, 
              width: pos.width,
              height: pos.height,
            })),
          });
        }

        // Enhanced recovery: createCleanV3Structure now preserves positioning data
        const fallbackResult = createCleanV3Structure(repairedContent);
        console.warn('[PERSISTENCE AUDIT] 🔄 Enhanced graceful recovery applied - positioning data PRESERVED');
        return fallbackResult;
      }
    }
    throw error;
  }
};

/**
 * Create clean V3 structure when legacy data conflicts prevent normal migration
 */
const createCleanV3Structure = (content: any): StructuredContentV3 => {
  const now = new Date().toISOString();
  
  // Try to preserve any valid nodes from the original content
  let preservedNodes: any[] = [];
  if (content && Array.isArray(content.nodes)) {
    preservedNodes = content.nodes.filter((node: any) => {
      // Basic validation - preserve nodes that have essential properties
      return node && 
             typeof node === 'object' && 
             node.id && 
             node.type && 
             node.data;
    }).map((node: any) => {
      // Clean up node data to ensure compatibility
      try {
        return migrateLegacyBlockData(node);
      } catch {
        // If migration fails, create a basic fallback node
        return {
          id: node.id || generateNodeId(),
          type: 'richBlock',
          data: {
            content: { htmlContent: '<p>Content preserved from legacy data</p>' },
            backgroundColor: 'transparent',
            // 🎯 MOBILE PADDING FIX: Use enhanced padding system instead of legacy paddingX/paddingY
            desktopPadding: { top: 16, right: 16, bottom: 16, left: 16 },
            mobilePadding: { top: 16, right: 16, bottom: 16, left: 16 },
            borderRadius: 8,
            borderWidth: 0,
            borderColor: '#e5e7eb',
          }
        };
      }
    });
  }
  
  // 🎯 PHASE 2B: Enhanced graceful recovery to PRESERVE original positioning data
  const positions: Record<string, any> = {};
  const mobilePositions: Record<string, any> = {};
  
  // Extract original positioning data if it exists and is valid
  const originalPositions = (content as any)?.positions || {};
  const originalMobilePositions = (content as any)?.mobilePositions || {};
  const hasOriginalPositions = Object.keys(originalPositions).length > 0;
  const hasOriginalMobilePositions = Object.keys(originalMobilePositions).length > 0;

  console.log('[ENHANCED RECOVERY] 🎯 Attempting to preserve original positioning data:', {
    hasOriginalPositions,
    hasOriginalMobilePositions,
    originalPositionsCount: Object.keys(originalPositions).length,
    originalMobilePositionsCount: Object.keys(originalMobilePositions).length,
  });
  
  preservedNodes.forEach((node, index) => {
    const nodeId = node.id;
    
    // 🎯 POSITIONING PRESERVATION PRIORITY:
    // 1. Use original positioning data if it exists for this node
    // 2. Fall back to generic stacked positioning only if no original data exists
    
    if (hasOriginalPositions && originalPositions[nodeId]) {
      // ✅ PRESERVE ORIGINAL DESKTOP POSITIONING
      const originalPos = originalPositions[nodeId];
      positions[nodeId] = {
        id: nodeId,
        x: originalPos.x ?? 100,
        y: originalPos.y ?? (100 + index * 220),
        width: originalPos.width ?? 600,
        height: originalPos.height ?? 200,
        ...(originalPos.zIndex && { zIndex: originalPos.zIndex }),
      };
      console.log(`[ENHANCED RECOVERY] ✅ Preserved desktop position for ${nodeId}:`, {
        original: originalPos,
        preserved: positions[nodeId]
      });
    } else {
      // ❌ FALLBACK: Generic stacked positioning (only when no original data)
      const yOffset = index * 220;
      positions[nodeId] = {
        id: nodeId,
        x: 100,
        y: 100 + yOffset,
        width: 600,
        height: 200
      };
      console.log(`[ENHANCED RECOVERY] ⚠️ Using fallback position for ${nodeId} (no original data)`);
    }
    
    if (hasOriginalMobilePositions && originalMobilePositions[nodeId]) {
      // ✅ PRESERVE ORIGINAL MOBILE POSITIONING  
      const originalMobilePos = originalMobilePositions[nodeId];
      mobilePositions[nodeId] = {
        id: nodeId,
        x: originalMobilePos.x ?? 0,
        y: originalMobilePos.y ?? (100 + index * 220),
        width: originalMobilePos.width ?? 375,
        height: originalMobilePos.height ?? 200,
        ...(originalMobilePos.zIndex && { zIndex: originalMobilePos.zIndex }),
      };
      console.log(`[ENHANCED RECOVERY] ✅ Preserved mobile position for ${nodeId}:`, {
        original: originalMobilePos,
        preserved: mobilePositions[nodeId]
      });
    } else {
      // ❌ FALLBACK: Generic mobile stacked positioning (only when no original data)
      const yOffset = index * 220;
      mobilePositions[nodeId] = {
        id: nodeId,
        x: 0,
        y: 100 + yOffset,
        width: 375,
        height: 200
      };
      console.log(`[ENHANCED RECOVERY] ⚠️ Using fallback mobile position for ${nodeId} (no original data)`);
    }
  });

  // 📊 POSITIONING PRESERVATION SUMMARY
  const preservedDesktopCount = preservedNodes.filter(node => hasOriginalPositions && originalPositions[node.id]).length;
  const preservedMobileCount = preservedNodes.filter(node => hasOriginalMobilePositions && originalMobilePositions[node.id]).length;
  
  console.log('[ENHANCED RECOVERY] 📊 Positioning preservation summary:', {
    totalNodes: preservedNodes.length,
    desktopPositionsPreserved: preservedDesktopCount,
    mobilePositionsPreserved: preservedMobileCount,
    desktopPreservationRate: preservedNodes.length > 0 ? Math.round((preservedDesktopCount / preservedNodes.length) * 100) : 0,
    mobilePreservationRate: preservedNodes.length > 0 ? Math.round((preservedMobileCount / preservedNodes.length) * 100) : 0,
  });
  
  console.log('[Graceful Recovery] Preserved nodes from legacy content:', {
    originalNodeCount: content?.nodes?.length || 0,
    preservedNodeCount: preservedNodes.length,
    hasOriginalContent: !!(content && typeof content === 'object')
  });
  
  return {
    version: '3.0.0',
    nodes: preservedNodes,
    positions,
    mobilePositions,
    canvas: {
      canvasWidth: 800,
      canvasHeight: 600,
      gridColumns: 12,
      snapTolerance: 10
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      editorVersion: '2.0.0',
      migratedFrom: 'legacy-conflict-recovery'
    }
  };
};

// Function to migrate entire structured content from legacy format
const migrateStructuredContent = (content: any): any => {
  if (!content || typeof content !== 'object') return content;

  const migratedContent = { ...content };

  // Migrate nodes if present
  if (Array.isArray(migratedContent.nodes)) {
    migratedContent.nodes = migratedContent.nodes.map(migrateLegacyBlockData);
  }

  // Check if this is V2 content that needs layout migration to V3 positions
  if (content.version === '2.0.0' && content.layouts && !content.positions) {
    console.log('[V2 Migration] Converting V2 layouts to V3 positions');
    
    // Convert V2 grid layouts to V3 absolute positions
    const positions: Record<string, any> = {};
    const mobilePositions: Record<string, any> = {};
    
    // Grid configuration for V2 -> V3 conversion
    const DESKTOP_GRID_WIDTH = 800;
    const MOBILE_GRID_WIDTH = 375;
    const GRID_COLS = 12;
    const COL_WIDTH_DESKTOP = DESKTOP_GRID_WIDTH / GRID_COLS;
    const COL_WIDTH_MOBILE = MOBILE_GRID_WIDTH / GRID_COLS;
    const ROW_HEIGHT = 50; // Standard row height
    
    // Convert desktop layout (lg breakpoint)
    if (content.layouts.lg && Array.isArray(content.layouts.lg)) {
      content.layouts.lg.forEach((layoutItem: any) => {
        if (layoutItem.i) {
          positions[layoutItem.i] = {
            id: layoutItem.i,
            x: (layoutItem.x || 0) * COL_WIDTH_DESKTOP,
            y: (layoutItem.y || 0) * ROW_HEIGHT,
            width: (layoutItem.w || 4) * COL_WIDTH_DESKTOP,
            height: (layoutItem.h || 4) * ROW_HEIGHT
          };
        }
      });
    }
    
    // Convert mobile layout (xs or sm breakpoint)
    const mobileLayout = content.layouts.xs || content.layouts.sm;
    if (mobileLayout && Array.isArray(mobileLayout)) {
      mobileLayout.forEach((layoutItem: any) => {
        if (layoutItem.i) {
          mobilePositions[layoutItem.i] = {
            id: layoutItem.i,
            x: (layoutItem.x || 0) * COL_WIDTH_MOBILE,
            y: (layoutItem.y || 0) * ROW_HEIGHT,
            width: (layoutItem.w || 4) * COL_WIDTH_MOBILE,
            height: (layoutItem.h || 4) * ROW_HEIGHT
          };
        }
      });
    } else {
      // Fallback: Use desktop positions but adjust for mobile width
      Object.entries(positions).forEach(([nodeId, pos]: [string, any]) => {
        mobilePositions[nodeId] = {
          id: nodeId,
          x: 0, // Stack vertically on mobile
          y: pos.y,
          width: MOBILE_GRID_WIDTH,
          height: pos.height
        };
      });
    }
    
    // Update to V3 structure
    migratedContent.version = '3.0.0';
    migratedContent.positions = positions;
    migratedContent.mobilePositions = mobilePositions;
    
    // Add V3 canvas properties
    migratedContent.canvas = {
      canvasWidth: DESKTOP_GRID_WIDTH,
      canvasHeight: 600,
      gridColumns: GRID_COLS,
      snapTolerance: 10
    };
    
    // Update metadata to reflect migration
    const now = new Date().toISOString();
    migratedContent.metadata = {
      ...migratedContent.metadata,
      updatedAt: now,
      editorVersion: '2.0.0',
      migratedFrom: 'v2-layouts'
    };
    
    // Remove old V2 layouts property
    delete migratedContent.layouts;
    
    console.log('[V2 Migration] Successfully converted layouts to positions:', {
      positionCount: Object.keys(positions).length,
      mobilePositionCount: Object.keys(mobilePositions).length,
      nodeCount: migratedContent.nodes?.length || 0
    });
  }

  return migratedContent;
};

export const validateNode = (node: unknown): NodeObject => {
  try {
    return NodeSchema.parse(node);
  } catch (error) {
    if (error instanceof z.ZodError) {
      try {
        console.warn('[Node Migration] Attempting to migrate legacy node format');
        const migratedNode = migrateLegacyBlockData(node);
        return NodeSchema.parse(migratedNode);
      } catch (migrationError) {
        console.error('[Node Migration] Migration failed:', migrationError);
        throw new Error(`Invalid node: ${error.errors.map(e => e.message).join(', ')}`);
      }
    }
    throw error;
  }
};

// ===== UTILITY FUNCTIONS =====

export const generateNodeId = (): string => {
  // Use crypto.randomUUID if available, otherwise fallback to custom implementation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getDefaultDataForBlockType = (blockType: string): any => {
  switch (blockType) {
    case 'textBlock':
      return {
        htmlContent: '<p>Enter your text here...</p>',
        // Typography defaults
        fontSize: undefined, // Use component defaults
        textAlign: 'left',
        color: undefined, // Use theme defaults
        lineHeight: undefined, // Use component defaults
        fontFamily: 'inherit',
        fontWeight: undefined, // Use component defaults
        letterSpacing: undefined,
        textTransform: 'none',
        textDecoration: 'none',
        // Background and borders
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'imageBlock':
      return {
        src: '',
        alt: '',
        htmlCaption: '<p></p>',
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'tableBlock':
      return {
        htmlHeaders: ['<p>Column 1</p>', '<p>Column 2</p>'],
        htmlRows: [['<p></p>', '<p></p>']],
        headerStyle: {
          backgroundColor: '#f3f4f6',
          textColor: '#374151',
        },
        alternatingRowColors: false,
        sortable: true,
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    // REMOVED: pollBlock defaults - polls moved to community-only features
    case 'keyTakeawayBlock':
      return {
        htmlContent: '<p>Key takeaway message</p>',
        theme: 'info' as const,
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    case 'referenceBlock':
      return {
        authors: '',
        year: new Date().getFullYear(),
        title: '',
        source: '',
        htmlFormatted: '<p></p>', // Default HTML content for Tiptap integration
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
        // Typography defaults
        textAlign: 'left' as const,
        fontSize: 14,
        fontFamily: 'inherit',
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: 0,
        textTransform: 'none' as const,
        textDecoration: 'none' as const,
        fontStyle: 'normal' as const,
      };
    case 'quoteBlock':
      return {
        htmlContent: '<p>Quote text here</p>',
        htmlCitation: '<p></p>',
        style: 'default' as const,
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    case 'videoEmbedBlock':
      return {
        url: '',
        platform: 'youtube' as const,
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    case 'separatorBlock':
      return {
        style: 'solid' as const,
        thickness: 1,
        width: 'full' as const,
        color: undefined,
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    case 'richBlock':
      return {
        // Content with initial TipTap structure
        content: {
          tiptapJSON: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Start typing...',
                  },
                ],
              },
            ],
          },
          htmlContent: '<p>Start typing...</p>',
        },
        // Default styling properties following existing pattern
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
        // Typography defaults
        textAlign: 'left' as const,
        fontSize: undefined, // Use component defaults
        fontFamily: 'inherit',
        fontWeight: undefined, // Use component defaults
        lineHeight: undefined, // Use component defaults
        letterSpacing: undefined,
        textTransform: 'none' as const,
        textDecoration: 'none' as const,
        fontStyle: 'normal' as const,
      };
    default:
      return {};
  }
};

// ===== ENHANCED PADDING UTILITY FUNCTIONS =====

/**
 * Get the effective padding for a specific viewport from block data
 */
export function getViewportPadding(
  blockData: any, 
  viewport: Viewport, 
  fallbackDefaults: ViewportPadding = {}
): ViewportPadding {

  // Priority order: viewport-specific -> legacy individual -> legacy symmetric -> defaults
  
  if (viewport === 'desktop' && blockData.desktopPadding) {
    return { ...fallbackDefaults, ...blockData.desktopPadding };
  }
  
  if (viewport === 'mobile' && blockData.mobilePadding) {
    return { ...fallbackDefaults, ...blockData.mobilePadding };
  }
  
  // Fallback to legacy individual padding
  if (blockData.paddingTop !== undefined || blockData.paddingRight !== undefined ||
      blockData.paddingBottom !== undefined || blockData.paddingLeft !== undefined) {
    return {
      ...fallbackDefaults,
      top: blockData.paddingTop,
      right: blockData.paddingRight,
      bottom: blockData.paddingBottom,
      left: blockData.paddingLeft,
    };
  }
  
  // Fallback to legacy symmetric padding
  if (blockData.paddingX !== undefined || blockData.paddingY !== undefined) {
    const paddingX = blockData.paddingX ?? 16;
    const paddingY = blockData.paddingY ?? 16;
    return {
      ...fallbackDefaults,
      top: paddingY,
      right: paddingX,
      bottom: paddingY,
      left: paddingX,
    };
  }
  
  return fallbackDefaults;
}

/**
 * Set viewport-specific padding for block data
 */
export function setViewportPadding(
  blockData: any,
  viewport: Viewport,
  padding: ViewportPadding
): any {
  const updatedData = { ...blockData };
  
  if (viewport === 'desktop') {
    updatedData.desktopPadding = { ...padding };
  } else {
    updatedData.mobilePadding = { ...padding };
  }
  
  return updatedData;
}

/**
 * Migrate legacy padding data to enhanced padding system
 */
export function migratePaddingData(blockData: any): any {
  // If already using enhanced padding system, clean up legacy data
  if (blockData.desktopPadding || blockData.mobilePadding) {
    const cleaned = { ...blockData };
    // Clean up legacy padding fields if viewport-specific padding exists
    delete cleaned.paddingX;
    delete cleaned.paddingY;
    return cleaned;
  }
  
  const migratedData = { ...blockData };
  
  // Migrate from individual padding
  if (blockData.paddingTop !== undefined || blockData.paddingRight !== undefined ||
      blockData.paddingBottom !== undefined || blockData.paddingLeft !== undefined) {
    
    const padding: ViewportPadding = {
      top: blockData.paddingTop ?? 16,
      right: blockData.paddingRight ?? 16,
      bottom: blockData.paddingBottom ?? 16,
      left: blockData.paddingLeft ?? 16,
    };
    
    // Apply to both viewports initially (user can customize later)
    migratedData.desktopPadding = padding;
    migratedData.mobilePadding = padding;
    
    // Keep legacy fields for backward compatibility
    return migratedData;
  }
  
  // Migrate from symmetric padding
  if (blockData.paddingX !== undefined || blockData.paddingY !== undefined) {
    const paddingX = blockData.paddingX ?? 16;
    const paddingY = blockData.paddingY ?? 16;
    
    const padding: ViewportPadding = {
      top: paddingY,
      right: paddingX,
      bottom: paddingY,
      left: paddingX,
    };
    
    // Apply to both viewports initially
    migratedData.desktopPadding = padding;
    migratedData.mobilePadding = padding;
    
    // Remove legacy symmetric padding
    delete migratedData.paddingX;
    delete migratedData.paddingY;
    
    return migratedData;
  }
  
  return migratedData;
}

/**
 * Validate padding values are within acceptable range (0-100px)
 */
export function validatePaddingValue(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Convert padding object to CSS style object with true zero padding support
 */
export function paddingToCSSStyle(padding: ViewportPadding): Record<string, string> {
  const style: Record<string, string> = {};
  
  // Ensure zero means exactly 0px for true edge-to-edge content
  style.paddingTop = `${validatePaddingValue(padding.top ?? 0)}px`;
  style.paddingRight = `${validatePaddingValue(padding.right ?? 0)}px`;
  style.paddingBottom = `${validatePaddingValue(padding.bottom ?? 0)}px`;
  style.paddingLeft = `${validatePaddingValue(padding.left ?? 0)}px`;
  
  return style;
}

/**
 * Check if padding values represent true zero padding (content touches edges)
 */
export function isZeroPadding(padding: ViewportPadding): boolean {
  return (padding.top ?? 0) === 0 && 
         (padding.right ?? 0) === 0 && 
         (padding.bottom ?? 0) === 0 && 
         (padding.left ?? 0) === 0;
}

// ===== BLOCK PRESET UTILITIES =====

/**
 * Default block preset collection structure
 */
const getDefaultPresetCollection = (): BlockPresetCollection => ({
  version: '1.0',
  presets: [],
  lastModified: new Date().toISOString(),
});

/**
 * Load block presets from localStorage
 */
export function loadBlockPresets(): BlockPresetCollection {
  try {
    const stored = localStorage.getItem('evidens_block_presets');
    if (!stored) {
      return getDefaultPresetCollection();
    }
    
    const parsed = JSON.parse(stored);
    const validated = BlockPresetCollectionSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.warn('Failed to load block presets, using defaults:', error);
    return getDefaultPresetCollection();
  }
}

/**
 * Save block presets to localStorage
 */
export function saveBlockPresets(collection: BlockPresetCollection): void {
  try {
    const updated = {
      ...collection,
      lastModified: new Date().toISOString(),
    };
    localStorage.setItem('evidens_block_presets', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save block presets:', error);
  }
}

/**
 * Create a new block preset from existing block data
 */
// Generate UUID with fallback for environments without crypto.randomUUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function createBlockPreset(
  name: string,
  blockType: string,
  blockData: any,
  options: {
    description?: string;
    category?: 'text' | 'media' | 'layout' | 'custom';
    tags?: string[];
  } = {}
): BlockPreset {
  const now = new Date().toISOString();
  
  return {
    metadata: {
      id: generateUUID(),
      name,
      description: options.description,
      category: options.category || 'custom',
      createdAt: now,
      useCount: 0,
      isFavorite: false,
      tags: options.tags,
    },
    blockType,
    blockData: JSON.parse(JSON.stringify(blockData)), // Deep clone
  };
}

/**
 * Add a preset to the collection
 */
export function addBlockPreset(preset: BlockPreset): void {
  const collection = loadBlockPresets();
  
  // Check for duplicate names
  const existingIndex = collection.presets.findIndex(p => p.metadata.name === preset.metadata.name);
  if (existingIndex >= 0) {
    // Update existing preset
    collection.presets[existingIndex] = preset;
  } else {
    // Add new preset
    collection.presets.push(preset);
  }
  
  saveBlockPresets(collection);
}

/**
 * Remove a preset from the collection
 */
export function removeBlockPreset(presetId: string): void {
  const collection = loadBlockPresets();
  collection.presets = collection.presets.filter(p => p.metadata.id !== presetId);
  saveBlockPresets(collection);
}

/**
 * Update preset metadata (favorite, rename, etc.)
 */
export function updateBlockPresetMetadata(
  presetId: string, 
  updates: Partial<BlockPresetMetadata>
): void {
  const collection = loadBlockPresets();
  const preset = collection.presets.find(p => p.metadata.id === presetId);
  
  if (preset) {
    preset.metadata = { ...preset.metadata, ...updates };
    saveBlockPresets(collection);
  }
}

/**
 * Record preset usage (increment use count and update lastUsed)
 */
export function recordPresetUsage(presetId: string): void {
  const collection = loadBlockPresets();
  const preset = collection.presets.find(p => p.metadata.id === presetId);
  
  if (preset) {
    preset.metadata.useCount++;
    preset.metadata.lastUsed = new Date().toISOString();
    saveBlockPresets(collection);
  }
}

/**
 * Get presets sorted by usage or category
 */
export function getPresetsBy(
  sortBy: 'usage' | 'recent' | 'category' | 'name' | 'favorites' = 'recent'
): BlockPreset[] {
  const collection = loadBlockPresets();
  
  switch (sortBy) {
    case 'usage':
      return [...collection.presets].sort((a, b) => b.metadata.useCount - a.metadata.useCount);
    
    case 'recent':
      return [...collection.presets].sort((a, b) => {
        const aTime = a.metadata.lastUsed || a.metadata.createdAt;
        const bTime = b.metadata.lastUsed || b.metadata.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    
    case 'category':
      return [...collection.presets].sort((a, b) => {
        if (a.metadata.category === b.metadata.category) {
          return a.metadata.name.localeCompare(b.metadata.name);
        }
        return a.metadata.category.localeCompare(b.metadata.category);
      });
    
    case 'name':
      return [...collection.presets].sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
    
    case 'favorites':
      return [...collection.presets]
        .filter(p => p.metadata.isFavorite)
        .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
    
    default:
      return collection.presets;
  }
}

/**
 * Search presets by name, description, or tags
 */
export function searchBlockPresets(query: string): BlockPreset[] {
  const collection = loadBlockPresets();
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return collection.presets;
  
  return collection.presets.filter(preset => {
    const name = preset.metadata.name.toLowerCase();
    const description = preset.metadata.description?.toLowerCase() || '';
    const tags = preset.metadata.tags?.join(' ').toLowerCase() || '';
    
    return name.includes(searchTerm) || description.includes(searchTerm) || tags.includes(searchTerm);
  });
}

/**
 * Export presets collection for backup
 */
export function exportBlockPresets(): string {
  const collection = loadBlockPresets();
  return JSON.stringify(collection, null, 2);
}

/**
 * Import presets collection from backup
 */
export function importBlockPresets(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = BlockPresetCollectionSchema.parse(parsed);
    saveBlockPresets(validated);
    return true;
  } catch (error) {
    console.error('Failed to import block presets:', error);
    return false;
  }
}
