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
  marginX: z.number().optional(),
  marginY: z.number().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
});

export const ImageBlockDataSchema = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  borderRadius: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  // Spacing and styling
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  marginX: z.number().optional(),
  marginY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Caption styling properties
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
});

export const TableBlockDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
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
  marginX: z.number().optional(),
  marginY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Table content styling properties
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
});

export const PollBlockDataSchema = z.object({
  question: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      votes: z.number().default(0),
    })
  ),
  allowMultiple: z.boolean().default(false),
  showResults: z.boolean().default(true),
  totalVotes: z.number().default(0),
  // Universal styling properties
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  marginX: z.number().optional(),
  marginY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Typography for question and options
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
});

export const KeyTakeawayBlockDataSchema = z.object({
  content: z.string(),
  icon: z.string().optional(),
  theme: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  backgroundColor: z.string().optional(),
  // Universal styling properties
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  // Typography for content
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
});

export const ReferenceBlockDataSchema = z.object({
  authors: z.string(),
  year: z.number(),
  title: z.string(),
  source: z.string(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
  formatted: z.string().optional(), // APA formatted citation
  // Universal styling properties
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  marginX: z.number().optional(),
  marginY: z.number().optional(),
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
});

export const QuoteBlockDataSchema = z.object({
  content: z.string(),
  citation: z.string().optional(),
  style: z.enum(['default', 'large-quote']).default('default'),
  borderColor: z.string().optional(),
  // Universal styling properties
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  marginX: z.number().optional(),
  marginY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  // Typography for quote content
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
});

export const VideoEmbedBlockDataSchema = z.object({
  url: z.string(),
  platform: z.enum(['youtube', 'vimeo']),
  caption: z.string().optional(),
  autoplay: z.boolean().default(false),
  // Spacing and styling
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  marginX: z.number().optional(),
  marginY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
  borderRadius: z.number().optional(),
  // Caption styling properties
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
});

export const SeparatorBlockDataSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().optional(),
  thickness: z.number().min(1).max(10).default(1),
  width: z.enum(['full', 'half', 'quarter']).default('full'),
  // Universal styling properties for separator container
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  marginX: z.number().optional(),
  marginY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
});

// ===== MASTER NODE SCHEMA =====

export const NodeSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string().uuid(), type: z.literal('textBlock'), data: TextBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('imageBlock'), data: ImageBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('tableBlock'), data: TableBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('pollBlock'), data: PollBlockDataSchema }),
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

// ===== EDITOR STATE TYPES =====

export type Viewport = 'desktop' | 'mobile';

export interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
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

  // WYSIWYG Position Management Actions
  updateNodePosition: (nodeId: string, positionUpdate: Partial<BlockPosition>) => void;
  initializeNodePosition: (nodeId: string) => void;
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

export const validateStructuredContent = (content: unknown): StructuredContent => {
  try {
    return StructuredContentSchema.parse(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid structured content: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

export const validateNode = (node: unknown): NodeObject => {
  try {
    return NodeSchema.parse(node);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid node: ${error.errors.map(e => e.message).join(', ')}`);
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
        marginX: 0,
        marginY: 0,
        backgroundColor: 'transparent',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'imageBlock':
      return {
        src: '',
        alt: '',
        caption: '',
        paddingX: 0,
        paddingY: 0,
        marginX: 0,
        marginY: 0,
        backgroundColor: 'transparent',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'tableBlock':
      return {
        headers: ['Column 1', 'Column 2'],
        rows: [['', '']],
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
        question: 'Your question here',
        options: [
          { id: generateNodeId(), text: 'Option 1', votes: 0 },
          { id: generateNodeId(), text: 'Option 2', votes: 0 },
        ],
        allowMultiple: false,
        showResults: true,
        totalVotes: 0,
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        marginX: 0,
        marginY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    case 'keyTakeawayBlock':
      return {
        content: 'Key takeaway message',
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
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        marginX: 0,
        marginY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    case 'quoteBlock':
      return {
        content: 'Quote text here',
        style: 'default' as const,
        // Default styling properties
        paddingX: 0,
        paddingY: 0,
        marginX: 0,
        marginY: 0,
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
        marginX: 0,
        marginY: 0,
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
        marginX: 0,
        marginY: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#e5e7eb',
      };
    default:
      return {};
  }
};
