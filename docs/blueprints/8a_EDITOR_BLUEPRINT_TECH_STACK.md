# EVIDENS Visual Composition Engine - Technical Stack Specification

**Version:** 2.0  
**Date:** January 22, 2025  
**Status:** Implementation Ready  
**Purpose:** Complete technical specification for implementing the Visual Composition Engine with all V1 features.

---

## 1. Technology Stack & Dependencies

### 1.1. Core Dependencies (New Installations Required)

```json
{
  "dependencies": {
    "@xyflow/react": "^12.0.4",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "lodash-es": "^4.17.21",
    "react-hotkeys-hook": "^4.5.0",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@types/lodash-es": "^4.17.12"
  }
}
```

**Installation Command:**
```bash
npm install @xyflow/react @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lodash-es react-hotkeys-hook
npm install -D @types/lodash-es
```

**Note:** We will NOT install zustand middleware dependencies (`zustand/middleware/devtools`, `zustand/middleware/immer`) to maintain consistency with existing auth store patterns.

### 1.2. Existing Dependencies (Already Available)

✅ **Core Framework:**
- `react: ^18.3.1`
- `typescript: ^5.5.3`
- `vite: ^5.4.1`

✅ **State Management & Data Fetching:**
- `@tanstack/react-query: ^5.56.2`
- `zustand: ^4.5.4`
- `zod: ^3.23.8`

✅ **Text Editing:**
- `@tiptap/react: ^2.14.0`
- `@tiptap/starter-kit: ^2.14.0`
- `@tiptap/extension-placeholder: ^2.14.0`

✅ **UI Components:**
- All `@radix-ui` components (shadcn/ui ecosystem)
- `lucide-react: ^0.462.0`
- `tailwindcss: ^3.4.11`

---

## 2. Architecture Integration with Existing System

### 2.1. Data Fetching Integration (TanStack Query v5)

**New Hooks Required:**
```typescript
// Editor-specific data hooks following existing patterns
useEditorQuery(reviewId: string)           // Load review for editing
useUpdateReviewMutation()                  // Save structured_content
useImageUploadMutation()                   // Upload images to Supabase Storage
useDiagramDataMutation()                   // Save/load diagram data
useTableDataMutation()                     // Save/load table data
```

**Integration with Existing Pattern:**
```typescript
// File: /packages/hooks/useEditorQuery.ts
export const useEditorQuery = (reviewId: string) => {
  return useQuery({
    queryKey: ['editor', reviewId],
    queryFn: () => fetchReviewForEditing(reviewId),
    enabled: !!reviewId,
    staleTime: 0, // Always fresh for editing
    gcTime: 5 * 60 * 1000,
  });
};

// File: /packages/hooks/useUpdateReviewMutation.ts
export const useUpdateReviewMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: UpdateReviewPayload) => {
      const { data, error } = await supabase.functions.invoke('update-review', {
        body: payload
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['review-detail', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['editor', variables.reviewId] });
    }
  });
};
```

### 2.2. Database Integration

**Existing Table Structure (Reviews):**
```sql
CREATE TABLE "Reviews" (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  structured_content JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Editor output
  status TEXT NOT NULL DEFAULT 'draft',
  access_level TEXT NOT NULL DEFAULT 'public',
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
```

**New Edge Functions Required:**
- `update-review` - Save structured_content v2.0
- `upload-editor-image` - Handle image uploads with optimization
- `validate-structured-content` - Server-side validation

---

## 3. State Management Architecture (Zustand)

### 3.1. Central Editor Store Structure

```typescript
// File: src/store/editorStore.ts
interface EditorState {
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
  currentViewport: 'desktop' | 'mobile';
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  
  // Canvas State
  canvasTransform: {
    x: number;
    y: number;
    zoom: number;
  };
  
  // Actions
  addNode: (node: Partial<NodeObject>) => void;
  updateNode: (nodeId: string, updates: Partial<NodeObject>) => void;
  deleteNode: (nodeId: string) => void;
  updateLayout: (nodeId: string, layout: LayoutItem, viewport: 'desktop' | 'mobile') => void;
  selectNode: (nodeId: string | null) => void;
  switchViewport: (viewport: 'desktop' | 'mobile') => void;
  saveToDatabase: () => Promise<void>;
}
```

### 3.2. Performance Optimizations

**Simple Pattern Implementation (Aligned with Existing Auth Store):**
```typescript
const editorStore = create<EditorState>((set, get) => ({
  // State initialization
  nodes: [],
  layouts: { 
    desktop: { gridSettings: { columns: 12 }, items: [] }, 
    mobile: { gridSettings: { columns: 4 }, items: [] } 
  },
  selectedNodeId: null,
  currentViewport: 'desktop',
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  canvasTransform: { x: 0, y: 0, zoom: 1 },
  
  // Actions with manual immutable updates
  addNode: (nodeData) => set((state) => {
    const newNode = {
      id: generateUUID(),
      type: nodeData.type,
      data: nodeData.data,
      ...nodeData
    };
    return {
      ...state,
      nodes: [...state.nodes, newNode],
      isDirty: true
    };
  }),
  
  updateNode: (nodeId, updates) => set((state) => {
    const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return state;
    
    const updatedNodes = [...state.nodes];
    updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], ...updates };
    
    return {
      ...state,
      nodes: updatedNodes,
      isDirty: true
    };
  }),
  
  // Debounced auto-save (implementation without middleware)
  saveToDatabase: debounce(async () => {
    const state = get();
    
    // Check payload size before sending (Issue #8 mitigation)
    const payload = {
      reviewId: state.reviewId,
      structured_content: {
        version: '2.0.0',
        nodes: state.nodes,
        layouts: state.layouts
      }
    };
    
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 5 * 1024 * 1024) { // 5MB limit (conservative)
      // Implement chunking strategy for large documents
      await saveInChunks(payload);
    } else {
      set({ isSaving: true });
      try {
        await updateReviewMutation.mutateAsync(payload);
        set({ isDirty: false, lastSaved: new Date(), isSaving: false });
      } catch (error) {
        set({ isSaving: false });
        throw error;
      }
    }
  }, 3000)
}));

// Chunking strategy for large documents (Issue #8 mitigation)
const saveInChunks = async (payload: any) => {
  const chunkSize = 1000; // Save 1000 nodes at a time
  const { nodes, ...basePayload } = payload.structured_content;
  
  // Save base structure first
  await updateReviewMutation.mutateAsync({
    ...payload,
    structured_content: {
      ...basePayload,
      nodes: [],
      isChunked: true,
      totalChunks: Math.ceil(nodes.length / chunkSize)
    }
  });
  
  // Save nodes in chunks
  for (let i = 0; i < nodes.length; i += chunkSize) {
    const chunk = nodes.slice(i, i + chunkSize);
    await updateReviewChunkMutation.mutateAsync({
      reviewId: payload.reviewId,
      chunkIndex: Math.floor(i / chunkSize),
      nodes: chunk
    });
  }
};
```

### 3.3. Database Optimization for Large Documents (Issue #6 mitigation)

**Required Database Changes:**
```sql
-- Add GIN index for structured_content JSONB queries
CREATE INDEX IF NOT EXISTS idx_reviews_structured_content_gin 
ON "Reviews" USING GIN (structured_content);

-- Add index for structured_content version queries
CREATE INDEX IF NOT EXISTS idx_reviews_structured_content_version 
ON "Reviews" USING GIN ((structured_content->'version'));

-- Add index for node count estimation
CREATE INDEX IF NOT EXISTS idx_reviews_structured_content_nodes_count 
ON "Reviews" USING GIN ((structured_content->'nodes'));
```

**Edge Function Query Optimization:**
```typescript
// File: supabase/functions/get-review-for-editing/index.ts
const getReviewForEditing = async (reviewId: string) => {
  // First, check if document is chunked
  const { data: review } = await supabase
    .from('Reviews')
    .select('structured_content->>isChunked, structured_content->>totalChunks')
    .eq('id', reviewId)
    .single();
    
  if (review?.isChunked) {
    // Load chunks separately for large documents
    return await loadChunkedReview(reviewId);
  } else {
    // Standard query for normal-sized documents
    return await loadStandardReview(reviewId);
  }
};
```

---

## 4. React Flow Integration

### 4.1. Canvas Component Architecture

```typescript
// File: src/components/editor/EditorCanvas.tsx
import ReactFlow, { 
  ReactFlowProvider, 
  useNodesState, 
  useEdgesState,
  applyNodeChanges,
  NodeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  textBlock: TextBlockNode,
  headingBlock: HeadingBlockNode,
  imageBlock: ImageBlockNode,
  tableBlock: TableBlockNode,
  diagramBlock: DiagramBlockNode,
  pollBlock: PollBlockNode,
  keyTakeawayBlock: KeyTakeawayBlockNode,
  referenceBlock: ReferenceBlockNode,
  quoteBlock: QuoteBlockNode,
  separatorBlock: SeparatorBlockNode,
  videoEmbedBlock: VideoEmbedBlockNode,
};

export const EditorCanvas = () => {
  const { nodes, layouts, canvasTransform, updateLayout, selectNode } = useEditorStore();
  const currentViewport = useEditorStore(state => state.currentViewport);
  
  // Convert store state to React Flow format
  const reactFlowNodes = useMemo(() => 
    nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: getPositionFromLayout(node.id, layouts[currentViewport]),
      data: node.data
    }))
  , [nodes, layouts, currentViewport]);
  
  // Performance optimization: Use useCallback for all handlers
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        const layoutItem = convertPositionToGrid(change.position);
        updateLayout(change.id, layoutItem, currentViewport);
      }
    });
  }, [updateLayout, currentViewport]);
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);
  
  return (
    <div className="flex-1 relative bg-gray-50">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={[]} // We don't use edges
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        defaultViewport={canvasTransform}
        panOnScroll={false} // Only pan with spacebar
        panOnDrag={[0]} // Spacebar + drag
        selectionOnDrag={false}
        fitView={false}
        minZoom={0.1}
        maxZoom={2}
        className="editor-canvas"
      >
        <GridBackground />
        <ViewportIndicator />
      </ReactFlow>
    </div>
  );
};
```

### 4.2. Custom Node Components

```typescript
// File: src/components/editor/nodes/TextBlockNode.tsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TextBlockNodeProps {
  id: string;
  data: {
    htmlContent: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
  };
  selected: boolean;
}

export const TextBlockNode = memo<TextBlockNodeProps>(({ id, data, selected }) => {
  const updateNode = useEditorStore(state => state.updateNode);
  
  // Separate Tiptap instance per node
  const editor = useEditor({
    extensions: [StarterKit],
    content: data.htmlContent,
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      // Debounced update to store
      debouncedUpdateNode(id, { ...data, htmlContent });
    },
  });
  
  const debouncedUpdateNode = useCallback(
    debounce((nodeId: string, updates: any) => {
      updateNode(nodeId, { data: updates });
    }, 1000),
    [updateNode]
  );
  
  return (
    <div 
      className={`
        min-h-[120px] min-w-[200px] p-4 bg-white border-2 rounded-lg 
        ${selected ? 'border-blue-500' : 'border-gray-200'}
        shadow-sm hover:shadow-md transition-shadow
      `}
      style={{
        fontSize: data.fontSize ? `${data.fontSize}px` : undefined,
        textAlign: data.textAlign,
        color: data.color,
      }}
    >
      <EditorContent editor={editor} />
      {selected && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full" />
      )}
    </div>
  );
});
```

---

## 5. dnd-kit Integration

### 5.1. Drag and Drop Setup

```typescript
// File: src/components/editor/EditorWorkspace.tsx
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { BlockPalette } from './BlockPalette';
import { EditorCanvas } from './EditorCanvas';

export const EditorWorkspace = () => {
  const addNode = useEditorStore(state => state.addNode);
  const canvasTransform = useEditorStore(state => state.canvasTransform);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'editor-canvas') {
      const blockType = active.id as string;
      const dropPosition = event.delta;
      
      // Convert screen coordinates to canvas coordinates
      const canvasPosition = screenToCanvasCoordinates(
        dropPosition, 
        canvasTransform
      );
      
      // Snap to grid
      const gridPosition = snapToGrid(canvasPosition);
      
      // Create new node
      addNode({
        type: blockType,
        data: getDefaultDataForBlockType(blockType),
        position: gridPosition
      });
    }
  }, [addNode, canvasTransform]);
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen">
        <BlockPalette />
        <EditorCanvas />
        <InspectorPanel />
      </div>
      <DragOverlay>
        {/* Preview component during drag */}
      </DragOverlay>
    </DndContext>
  );
};
```

### 5.2. Block Palette Implementation

```typescript
// File: src/components/editor/BlockPalette.tsx
import { useDraggable } from '@dnd-kit/core';

const BLOCK_TYPES = [
  { id: 'textBlock', label: 'Text', icon: Type, category: 'content' },
  { id: 'headingBlock', label: 'Heading', icon: Heading, category: 'content' },
  { id: 'imageBlock', label: 'Image', icon: Image, category: 'media' },
  { id: 'tableBlock', label: 'Table', icon: Table, category: 'data' },
  { id: 'diagramBlock', label: 'Diagram', icon: GitBranch, category: 'visual' },
  { id: 'pollBlock', label: 'Poll', icon: BarChart, category: 'interactive' },
  { id: 'keyTakeawayBlock', label: 'Key Takeaway', icon: Lightbulb, category: 'evidens' },
  { id: 'referenceBlock', label: 'Reference', icon: Quote, category: 'evidens' },
];

const DraggableBlock = ({ block }: { block: typeof BLOCK_TYPES[0] }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: { type: block.id }
  });
  
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-grab
        ${isDragging ? 'opacity-50' : 'hover:bg-gray-50'}
        transition-colors
      `}
    >
      <block.icon size={20} />
      <span className="text-sm font-medium">{block.label}</span>
    </div>
  );
};

export const BlockPalette = () => {
  const blocksByCategory = BLOCK_TYPES.reduce((acc, block) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, typeof BLOCK_TYPES>);
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">Blocks</h2>
      {Object.entries(blocksByCategory).map(([category, blocks]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {blocks.map(block => (
              <DraggableBlock key={block.id} block={block} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 6. Structured Content v2.0 Schema

### 6.1. Zod Validation Schemas

```typescript
// File: src/types/structured-content.ts
import { z } from 'zod';

// Base layout schema
const LayoutItemSchema = z.object({
  nodeId: z.string().uuid(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
});

const LayoutConfigSchema = z.object({
  gridSettings: z.object({
    columns: z.number().int().min(1).max(12),
  }),
  items: z.array(LayoutItemSchema),
});

const LayoutsSchema = z.object({
  desktop: LayoutConfigSchema,
  mobile: LayoutConfigSchema,
});

// Block data schemas
const TextBlockDataSchema = z.object({
  htmlContent: z.string(),
  fontSize: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  color: z.string().optional(),
});

const HeadingBlockDataSchema = z.object({
  htmlContent: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  color: z.string().optional(),
});

const ImageBlockDataSchema = z.object({
  src: z.string().url(),
  alt: z.string(),
  caption: z.string().optional(),
  borderRadius: z.number().optional(),
});

const TableBlockDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  headerStyle: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
  }).optional(),
  alternatingRowColors: z.boolean().optional(),
});

const DiagramBlockDataSchema = z.object({
  diagramType: z.enum(['flowchart', 'consort', 'prisma', 'study-design', 'custom']),
  diagramData: z.record(z.any()), // Complex diagram structure
  templateId: z.string().optional(),
});

const PollBlockDataSchema = z.object({
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    votes: z.number().default(0),
  })),
  allowMultiple: z.boolean().default(false),
  showResults: z.boolean().default(true),
});

const KeyTakeawayBlockDataSchema = z.object({
  content: z.string(),
  icon: z.string().optional(),
  theme: z.enum(['info', 'success', 'warning', 'error']).default('info'),
});

const ReferenceBlockDataSchema = z.object({
  authors: z.string(),
  year: z.number(),
  title: z.string(),
  source: z.string(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
});

const QuoteBlockDataSchema = z.object({
  content: z.string(),
  citation: z.string().optional(),
  style: z.enum(['default', 'large-quote']).default('default'),
});

const VideoEmbedBlockDataSchema = z.object({
  url: z.string().url(),
  platform: z.enum(['youtube', 'vimeo']),
  caption: z.string().optional(),
});

const SeparatorBlockDataSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().optional(),
  thickness: z.number().min(1).max(10).default(1),
});

// Master node schema with discriminated union
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

// Root schema
export const StructuredContentV2Schema = z.object({
  version: z.literal('2.0.0'),
  nodes: z.array(NodeSchema),
  layouts: LayoutsSchema,
  globalStyles: z.record(z.any()).optional(),
});

export type NodeObject = z.infer<typeof NodeSchema>;
export type LayoutItem = z.infer<typeof LayoutItemSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type StructuredContentV2 = z.infer<typeof StructuredContentV2Schema>;
```

---

## 7. Sub-App Modal Pattern for Complex Blocks

### 7.1. Diagram Editor Sub-App

```typescript
// File: src/components/editor/subapps/DiagramEditor.tsx
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

interface DiagramEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: DiagramBlockDataSchema;
  onSave: (data: DiagramBlockDataSchema) => void;
}

export const DiagramEditor = ({ isOpen, onClose, initialData, onSave }: DiagramEditorProps) => {
  const [diagramData, setDiagramData] = useState(initialData);
  const [selectedTemplate, setSelectedTemplate] = useState(initialData.templateId);
  
  const MEDICAL_TEMPLATES = {
    'consort-flow': {
      name: 'CONSORT Flow Diagram',
      description: 'Standardized clinical trial reporting',
      nodes: [
        { id: 'enrollment', label: 'Enrollment', type: 'start' },
        { id: 'allocation', label: 'Allocation', type: 'process' },
        { id: 'follow-up', label: 'Follow-up', type: 'process' },
        { id: 'analysis', label: 'Analysis', type: 'end' },
      ],
      edges: [
        { source: 'enrollment', target: 'allocation' },
        { source: 'allocation', target: 'follow-up' },
        { source: 'follow-up', target: 'analysis' },
      ]
    },
    'prisma-flow': {
      name: 'PRISMA Flow Diagram',
      description: 'Systematic review evidence synthesis',
      nodes: [
        { id: 'identification', label: 'Identification', type: 'start' },
        { id: 'screening', label: 'Screening', type: 'process' },
        { id: 'eligibility', label: 'Eligibility', type: 'process' },
        { id: 'included', label: 'Included', type: 'end' },
      ],
      edges: [
        { source: 'identification', target: 'screening' },
        { source: 'screening', target: 'eligibility' },
        { source: 'eligibility', target: 'included' },
      ]
    },
    'study-design': {
      name: 'Study Design Flow',
      description: 'Research methodology visualization',
      nodes: [
        { id: 'population', label: 'Target Population', type: 'start' },
        { id: 'inclusion', label: 'Inclusion Criteria', type: 'decision' },
        { id: 'exclusion', label: 'Exclusion Criteria', type: 'decision' },
        { id: 'final-sample', label: 'Final Sample', type: 'end' },
      ],
      edges: [
        { source: 'population', target: 'inclusion' },
        { source: 'inclusion', target: 'exclusion' },
        { source: 'exclusion', target: 'final-sample' },
      ]
    }
  };
  
  const handleSave = () => {
    const updatedData = {
      ...diagramData,
      templateId: selectedTemplate,
    };
    onSave(updatedData);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <h2 className="text-xl font-semibold">Diagram Editor</h2>
        </DialogHeader>
        
        <div className="flex h-full">
          {/* Template Sidebar */}
          <div className="w-64 border-r pr-4">
            <h3 className="font-medium mb-3">Medical Templates</h3>
            {Object.entries(MEDICAL_TEMPLATES).map(([id, template]) => (
              <button
                key={id}
                onClick={() => setSelectedTemplate(id)}
                className={`
                  w-full text-left p-3 rounded-lg border mb-2
                  ${selectedTemplate === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                `}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
              </button>
            ))}
          </div>
          
          {/* Diagram Canvas */}
          <div className="flex-1 pl-4">
            <ReactFlow
              nodes={diagramData.nodes}
              edges={diagramData.edges}
              onNodesChange={/* Handle node changes */}
              onEdgesChange={/* Handle edge changes */}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background />
            </ReactFlow>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Diagram</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 8. Performance Optimization Strategies

### 8.1. React Flow Optimizations

**1. Controlled State Management:**
```typescript
// Prevent React Flow internal state, use Zustand exclusively
const reactFlowInstance = useReactFlow();

useEffect(() => {
  if (reactFlowInstance) {
    reactFlowInstance.setNodes(convertStoreToReactFlowNodes(nodes));
  }
}, [nodes, reactFlowInstance]);
```

**2. Node Virtualization for Large Documents:**
```typescript
// File: src/hooks/useVirtualizedNodes.ts
export const useVirtualizedNodes = (nodes: NodeObject[], viewport: ReactFlowState['viewport']) => {
  return useMemo(() => {
    const viewportBounds = calculateViewportBounds(viewport);
    
    return nodes.filter(node => {
      const nodePosition = getNodePosition(node);
      return isNodeInViewport(nodePosition, viewportBounds);
    });
  }, [nodes, viewport]);
};
```

**3. Debounced Updates:**
```typescript
// Prevent excessive re-renders during drag operations
const debouncedUpdateLayout = useCallback(
  debounce((nodeId: string, position: Position) => {
    updateLayout(nodeId, convertPositionToLayout(position), currentViewport);
  }, 100),
  [updateLayout, currentViewport]
);
```

### 8.2. Memory Management

**1. Cleanup Effects:**
```typescript
useEffect(() => {
  return () => {
    // Cleanup Tiptap editors
    editorInstances.forEach(editor => editor.destroy());
    // Clear canvas event listeners
    canvasElement.removeEventListener('wheel', handleWheel);
  };
}, []);
```

**2. Image Optimization:**
```typescript
// Automatic WebP conversion and lazy loading
const optimizeImage = async (file: File) => {
  const { data, error } = await supabase.functions.invoke('optimize-image', {
    body: { file: await fileToBase64(file) }
  });
  
  if (error) throw error;
  
  return {
    thumbnail: data.thumbnailUrl,    // 150x150
    medium: data.mediumUrl,          // 600x400
    large: data.largeUrl,            // 1200x800
    original: data.originalUrl       // WebP format
  };
};
```

### 8.3. Bundle Optimization

**Code Splitting:**
```typescript
// Dynamic imports for sub-apps
const DiagramEditor = lazy(() => import('./subapps/DiagramEditor'));
const TableEditor = lazy(() => import('./subapps/TableEditor'));

// Route-level splitting
const EditorPage = lazy(() => import('../pages/EditorPage'));
```

---

## 9. Security & Validation

### 9.1. Input Validation

```typescript
// File: src/utils/validation.ts
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

// Server-side validation in Edge Function
export const validateEditorInput = (input: unknown) => {
  const schema = z.object({
    reviewId: z.string().uuid(),
    structured_content: StructuredContentV2Schema,
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
  });
  
  return schema.parse(input);
};
```

### 9.2. Image Upload Security

```typescript
// File: supabase/functions/upload-editor-image/index.ts
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateImageUpload = (file: { type: string; size: number }) => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only images are allowed.');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
};
```

---

## 10. Development Tools & Debugging

### 10.1. Redux DevTools Integration

```typescript
// File: src/store/editorStore.ts
const editorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'editor-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
```

### 10.2. Error Boundaries

```typescript
// File: src/components/editor/EditorErrorBoundary.tsx
export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Editor Error:', error, errorInfo);
    
    // Report to error monitoring service
    reportError(error, {
      component: 'VisualCompositionEngine',
      ...errorInfo
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Editor Error</h2>
          <p className="text-gray-600 mb-4">
            Something went wrong with the editor. Please refresh the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Editor
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## 11. Testing Strategy

### 11.1. Unit Testing

```typescript
// File: src/components/editor/__tests__/editorStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '../store/editorStore';

describe('Editor Store', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });
  
  it('should add node correctly', () => {
    const { result } = renderHook(() => useEditorStore());
    
    act(() => {
      result.current.addNode({
        type: 'textBlock',
        data: { htmlContent: 'Test content' }
      });
    });
    
    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].type).toBe('textBlock');
    expect(result.current.isDirty).toBe(true);
  });
  
  it('should validate structured content', () => {
    const validContent = {
      version: '2.0.0',
      nodes: [],
      layouts: {
        desktop: { gridSettings: { columns: 12 }, items: [] },
        mobile: { gridSettings: { columns: 4 }, items: [] }
      }
    };
    
    expect(() => validateStructuredContent(validContent)).not.toThrow();
  });
});
```

### 11.2. Integration Testing

```typescript
// File: src/components/editor/__tests__/EditorIntegration.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorWorkspace } from '../EditorWorkspace';

describe('Editor Integration', () => {
  it('should create new block when dragged from palette', async () => {
    render(<EditorWorkspace reviewId="test-id" />);
    
    const textBlock = screen.getByText('Text');
    const canvas = screen.getByTestId('editor-canvas');
    
    // Simulate drag and drop
    fireEvent.dragStart(textBlock);
    fireEvent.dragOver(canvas);
    fireEvent.drop(canvas);
    
    expect(await screen.findByTestId('text-block-node')).toBeInTheDocument();
  });
});
```

---

## 12. Implementation Checklist

### 12.1. Phase 1: Foundation
- [ ] Install React Flow and dnd-kit dependencies
- [ ] Create editor store with Zustand
- [ ] Set up basic three-panel layout
- [ ] Implement drag-drop from palette to canvas

### 12.2. Phase 2: Core Blocks
- [ ] Implement TextBlockNode with Tiptap
- [ ] Implement HeadingBlockNode
- [ ] Implement ImageBlockNode with upload
- [ ] Add QuoteBlock and SeparatorBlock

### 12.3. Phase 3: Advanced Blocks
- [ ] Implement TableBlock with sub-app editor
- [ ] Implement DiagramBlock with medical templates
- [ ] Implement PollBlock with real-time features
- [ ] Add EVIDENS specialized blocks

### 12.4. Phase 4: Integration
- [ ] Connect to Reviews database
- [ ] Implement auto-save functionality
- [ ] Add viewport switching (desktop/mobile)
- [ ] Performance optimization and testing

---

**Next Steps:** Proceed to IMPLEMENTATION_MASTER_PLAN.md for complete project planning and execution strategy.