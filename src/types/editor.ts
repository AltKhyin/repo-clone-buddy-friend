// ABOUTME: TypeScript interfaces and types for the Visual Composition Engine editor

import { z } from 'zod';

// ===== LAYOUT SYSTEM =====

export const LayoutItemSchema = z.object({
  nodeId: z.string().uuid(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
});

export const LayoutConfigSchema = z.object({
  gridSettings: z.object({
    columns: z.number().int().min(1).max(12),
  }),
  items: z.array(LayoutItemSchema),
});

export const LayoutsSchema = z.object({
  desktop: LayoutConfigSchema,
  mobile: LayoutConfigSchema,
});

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
  // Background and borders
  backgroundColor: z.string().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
});

export const HeadingBlockDataSchema = z.object({
  htmlContent: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  // Typography
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  color: z.string().optional(),
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
  caption: z.string().optional(),
  borderRadius: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  // Spacing and styling
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().default(0),
  borderColor: z.string().optional(),
});

export const TableBlockDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  headerStyle: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
  }).optional(),
  alternatingRowColors: z.boolean().optional(),
  sortable: z.boolean().default(true),
});

export const DiagramBlockDataSchema = z.object({
  diagramType: z.enum(['flowchart', 'consort', 'prisma', 'study-design', 'custom']),
  diagramData: z.record(z.any()), // Complex diagram structure
  templateId: z.string().optional(),
  exportFormat: z.enum(['svg', 'png', 'pdf']).default('svg'),
});

export const PollBlockDataSchema = z.object({
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    votes: z.number().default(0),
  })),
  allowMultiple: z.boolean().default(false),
  showResults: z.boolean().default(true),
  totalVotes: z.number().default(0),
});

export const KeyTakeawayBlockDataSchema = z.object({
  content: z.string(),
  icon: z.string().optional(),
  theme: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  backgroundColor: z.string().optional(),
});

export const ReferenceBlockDataSchema = z.object({
  authors: z.string(),
  year: z.number(),
  title: z.string(),
  source: z.string(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
  formatted: z.string().optional(), // APA formatted citation
});

export const QuoteBlockDataSchema = z.object({
  content: z.string(),
  citation: z.string().optional(),
  style: z.enum(['default', 'large-quote']).default('default'),
  borderColor: z.string().optional(),
});

export const VideoEmbedBlockDataSchema = z.object({
  url: z.string(),
  platform: z.enum(['youtube', 'vimeo']),
  caption: z.string().optional(),
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
});

// ===== MASTER NODE SCHEMA =====

export const NodeSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string().uuid(), type: z.literal('textBlock'), data: TextBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('headingBlock'), data: HeadingBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('imageBlock'), data: ImageBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('tableBlock'), data: TableBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('diagramBlock'), data: DiagramBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('pollBlock'), data: PollBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('keyTakeawayBlock'), data: KeyTakeawayBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('referenceBlock'), data: ReferenceBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('quoteBlock'), data: QuoteBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('videoEmbedBlock'), data: VideoEmbedBlockDataSchema }),
  z.object({ id: z.string().uuid(), type: z.literal('separatorBlock'), data: SeparatorBlockDataSchema }),
]);

// ===== ROOT SCHEMA =====

export const StructuredContentV2Schema = z.object({
  version: z.literal('2.0.0'),
  nodes: z.array(NodeSchema),
  layouts: LayoutsSchema,
  globalStyles: z.record(z.any()).optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    editorVersion: z.string(),
  }).optional(),
});

// ===== EXPORTED TYPES =====

export type NodeObject = z.infer<typeof NodeSchema>;
export type LayoutItem = z.infer<typeof LayoutItemSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type StructuredContentV2 = z.infer<typeof StructuredContentV2Schema>;

// Block-specific types
export type TextBlockData = z.infer<typeof TextBlockDataSchema>;
export type HeadingBlockData = z.infer<typeof HeadingBlockDataSchema>;
export type ImageBlockData = z.infer<typeof ImageBlockDataSchema>;
export type TableBlockData = z.infer<typeof TableBlockDataSchema>;
export type DiagramBlockData = z.infer<typeof DiagramBlockDataSchema>;
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
  
  // Content State (structured_content v2.0)
  nodes: NodeObject[];
  layouts: {
    desktop: LayoutConfig;
    mobile: LayoutConfig;
  };
  
  // Editor State
  selectedNodeId: string | null;
  currentViewport: Viewport;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  isFullscreen: boolean;
  
  // Canvas State
  canvasTransform: CanvasTransform;
  canvasTheme: 'light' | 'dark';
  showGrid: boolean;
  showRulers: boolean;
  showGuidelines: boolean;
  guidelines: {
    horizontal: number[];
    vertical: number[];
  };
  
  // Clipboard State
  clipboardData: NodeObject[] | null;
  
  // History State (for undo/redo)
  history: StructuredContentV2[];
  historyIndex: number;
  
  // Persistence Callbacks
  persistenceCallbacks: {
    save: (reviewId: string, content: StructuredContentV2) => Promise<any>;
    load: (reviewId: string) => Promise<any>;
  } | null;
  
  // Actions
  addNode: (node: Partial<NodeObject>) => void;
  updateNode: (nodeId: string, updates: Partial<NodeObject>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  updateLayout: (nodeId: string, layout: LayoutItem, viewport: Viewport) => void;
  selectNode: (nodeId: string | null) => void;
  switchViewport: (viewport: Viewport) => void;
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
  loadFromJSON: (json: StructuredContentV2) => void;
  exportToJSON: () => StructuredContentV2;
  exportToPDF: () => Promise<void>;
  
  // Persistence
  setPersistenceCallbacks: (callbacks: {
    save: (reviewId: string, content: StructuredContentV2) => Promise<any>;
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

export interface MedicalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'consort' | 'prisma' | 'study-design' | 'flowchart';
  nodes: any[]; // React Flow nodes
  edges: any[]; // React Flow edges
  previewImage?: string;
}

// ===== VALIDATION UTILITIES =====

export const validateStructuredContent = (content: unknown): StructuredContentV2 => {
  try {
    return StructuredContentV2Schema.parse(content);
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getDefaultDataForBlockType = (blockType: string): any => {
  switch (blockType) {
    case 'textBlock':
      return { htmlContent: '<p>Enter your text here...</p>' };
    case 'headingBlock':
      return { htmlContent: 'Heading', level: 1 as const };
    case 'imageBlock':
      return { src: '', alt: '', caption: '' };
    case 'tableBlock':
      return { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    case 'diagramBlock':
      return { diagramType: 'custom' as const, diagramData: {} };
    case 'pollBlock':
      return { 
        question: 'Your question here', 
        options: [
          { id: generateNodeId(), text: 'Option 1', votes: 0 },
          { id: generateNodeId(), text: 'Option 2', votes: 0 }
        ]
      };
    case 'keyTakeawayBlock':
      return { content: 'Key takeaway message', theme: 'info' as const };
    case 'referenceBlock':
      return { authors: '', year: new Date().getFullYear(), title: '', source: '' };
    case 'quoteBlock':
      return { content: 'Quote text here', style: 'default' as const };
    case 'videoEmbedBlock':
      return { url: '', platform: 'youtube' as const };
    case 'separatorBlock':
      return { style: 'solid' as const };
    default:
      return {};
  }
};