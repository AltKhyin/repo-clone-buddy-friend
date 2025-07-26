// ABOUTME: TypeScript interfaces and types for the Visual Composition Engine editor

import { z } from 'zod';

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
  height: z.number().min(30), // Block height in pixels (minimum 30px)
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
  // Unified text/heading functionality
  headingLevel: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.null()])
    .optional(),
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
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
});

export const ImageBlockDataSchema = z.object({
  src: z.string(),
  alt: z.string(),
  // HTML caption for typography integration (like TextBlock)
  htmlCaption: z.string().optional(),
  borderRadius: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  // Spacing and styling
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
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
});

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
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
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
});

// DEPRECATED: PollBlockDataSchema - Use RichBlockDataSchema with TipTap poll extension instead
// This schema is maintained for backward compatibility and migration purposes only
export const PollBlockDataSchema = z.object({
  // HTML question for typography integration (like TextBlock)
  htmlQuestion: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      htmlText: z.string(), // HTML text for typography integration
      votes: z.number().default(0),
    })
  ),
  allowMultiple: z.boolean().default(false),
  showResults: z.boolean().default(true),
  totalVotes: z.number().default(0),
  // Universal styling properties
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Typography for question and options - applied as CSS like TextBlock
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
});

export const KeyTakeawayBlockDataSchema = z.object({
  // HTML content for typography integration (like TextBlock)
  htmlContent: z.string(),
  icon: z.string().optional(),
  theme: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  backgroundColor: z.string().optional(),
  // Universal styling properties
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
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
});

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
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
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
});

export const QuoteBlockDataSchema = z.object({
  // HTML content for typography integration (like TextBlock)
  htmlContent: z.string(),
  htmlCitation: z.string().optional(),
  authorImage: z.string().optional(),
  style: z.enum(['default']).default('default'),
  borderColor: z.string().optional(),
  // Universal styling properties
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
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
});

export const VideoEmbedBlockDataSchema = z.object({
  url: z.string(),
  platform: z.enum(['youtube', 'vimeo']),
  autoplay: z.boolean().default(false),
  // Spacing and styling
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  borderRadius: z.number().optional(),
});

export const SeparatorBlockDataSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().optional(),
  thickness: z.number().min(1).max(10).default(1),
  width: z.enum(['full', 'half', 'quarter']).default('full'),
  // Universal styling properties for separator container
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
});

// UNIFIED: RichBlockDataSchema - Single schema for all rich content including tables, polls, text, images, videos
// TipTap extensions handle tables (customTable) and polls (customPoll) natively within the editor
export const RichBlockDataSchema = z.object({
  // Content storage - TipTap JSON is the single source of truth for unified editing
  content: z.object({
    tiptapJSON: z.any().optional(), // TipTap editor JSON content with native table/poll support
    htmlContent: z.string().default('<p>Start typing...</p>'), // HTML representation for fallback display
  }),
  // Universal styling properties (following existing pattern)
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
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
});

// ===== MASTER NODE SCHEMA =====
// NOTE: tableBlock and pollBlock are DEPRECATED - use richBlock with TipTap extensions instead
// These legacy types are maintained for backward compatibility and auto-migration support

export const NodeSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string().uuid(), type: z.literal('textBlock'), data: TextBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('imageBlock'), data: ImageBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('tableBlock'), data: TableBlockDataSchema }), // DEPRECATED
  z.object({ id: z.string().uuid(), type: z.literal('pollBlock'), data: PollBlockDataSchema }), // DEPRECATED
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
  positions: BlockPositionsSchema, // Direct pixel positions instead of complex layouts
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
export type PollBlockData = z.infer<typeof PollBlockDataSchema>;
export type KeyTakeawayBlockData = z.infer<typeof KeyTakeawayBlockDataSchema>;
export type ReferenceBlockData = z.infer<typeof ReferenceBlockDataSchema>;
export type QuoteBlockData = z.infer<typeof QuoteBlockDataSchema>;
export type VideoEmbedBlockData = z.infer<typeof VideoEmbedBlockDataSchema>;
export type SeparatorBlockData = z.infer<typeof SeparatorBlockDataSchema>;
export type RichBlockData = z.infer<typeof RichBlockDataSchema>;

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
  positions: BlockPositions; // Direct pixel positioning
  canvas: WYSIWYGCanvas; // Canvas configuration

  // Editor State
  selectedNodeId: string | null;
  textSelection: TextSelectionInfo | null; // Text selection for unified typography editing
  canvasZoom: number; // Zoom level for precision editing
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  isFullscreen: boolean;

  // WYSIWYG Canvas Display Options
  showGrid: boolean; // Show grid overlay for alignment
  showSnapGuides: boolean; // Show snapping guides during drag

  // Legacy support for migration
  layouts?: MasterDerivedLayouts; // Optional for backward compatibility
  currentViewport?: Viewport; // Optional for backward compatibility
  canvasTransform?: CanvasTransform; // Optional for backward compatibility
  canvasTheme?: 'light' | 'dark'; // Optional for backward compatibility
  showRulers?: boolean; // Optional for backward compatibility
  showGuidelines?: boolean; // Optional for backward compatibility
  guidelines?: {
    // Optional for backward compatibility
    horizontal: number[];
    vertical: number[];
  };

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

  // WYSIWYG Position Management Actions
  updateNodePosition: (nodeId: string, positionUpdate: Partial<BlockPosition>) => void;
  initializeNodePosition: (nodeId: string, blockType?: string) => void;
  updateCanvasZoom: (zoom: number) => void;
  toggleSnapGuides: () => void;

  // Legacy Layout Actions (for backward compatibility)
  updateLayout: (nodeId: string, layout: LayoutItem, viewport: Viewport) => void;

  // Master/Derived Layout System
  switchViewport: (viewport: Viewport) => void;
  generateMobileFromDesktop: () => void;
  shouldRegenerateMobile: () => boolean;
  resetMobileLayout: () => void;
  updateCanvasTransform: (transform: Partial<CanvasTransform>) => void;
  setCanvasTheme: (theme: 'light' | 'dark') => void;
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

    case 'pollBlock':
      // Migrate question -> htmlQuestion
      if ('question' in migratedData && !('htmlQuestion' in migratedData)) {
        migratedData.htmlQuestion = textToHtml(migratedData.question);
        delete migratedData.question;
      }
      // Migrate options[].text -> options[].htmlText
      if (Array.isArray(migratedData.options)) {
        migratedData.options = migratedData.options.map((option: any) => {
          if ('text' in option && !('htmlText' in option)) {
            return {
              ...option,
              htmlText: textToHtml(option.text),
            };
          }
          return option;
        });
      }
      break;

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

  return { ...node, data: migratedData };
};

export const validateStructuredContent = (content: unknown): StructuredContent => {
  try {
    // First, try to parse with the new schema
    return StructuredContentSchema.parse(content);
  } catch (error) {
    // If validation fails, attempt migration from legacy format
    if (error instanceof z.ZodError) {
      try {
        console.warn('[Schema Migration] Attempting to migrate legacy content format');
        const migrated = migrateStructuredContent(content);
        return StructuredContentSchema.parse(migrated);
      } catch (migrationError) {
        console.error('[Schema Migration] Migration failed:', migrationError);
        throw new Error(
          `Invalid structured content: ${error.errors.map(e => e.message).join(', ')}`
        );
      }
    }
    throw error;
  }
};

// Function to migrate entire structured content from legacy format
const migrateStructuredContent = (content: any): any => {
  if (!content || typeof content !== 'object') return content;

  const migratedContent = { ...content };

  // Migrate nodes if present
  if (Array.isArray(migratedContent.nodes)) {
    migratedContent.nodes = migratedContent.nodes.map(migrateLegacyBlockData);
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
        headingLevel: null, // Default to text mode
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
    case 'pollBlock':
      return {
        htmlQuestion: '<p>Your question here</p>',
        options: [
          { id: generateNodeId(), htmlText: '<p>Option 1</p>', votes: 0 },
          { id: generateNodeId(), htmlText: '<p>Option 2</p>', votes: 0 },
        ],
        allowMultiple: false,
        showResults: true,
        totalVotes: 0,
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
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
