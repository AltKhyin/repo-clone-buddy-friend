# EVIDENS Editor Architecture - TipTap Implementation

> **⚠️ CRITICAL NOTE**: This document replaces all previous editor documentation that incorrectly described a React Flow-based "Visual Composition Engine". EVIDENS uses a **TipTap-based rich text editor** with WYSIWYG canvas functionality.

## **Architecture Overview**

EVIDENS implements a sophisticated rich text editing system built on **TipTap v2.26.1** with a custom WYSIWYG canvas for visual block composition. The editor combines rich text capabilities with spatial block positioning.

### **Core Technology Stack**

```json
{
  "@tiptap/react": "^2.26.1",
  "@tiptap/starter-kit": "^2.26.1", 
  "@tiptap/extension-table": "^2.26.1",
  "@dnd-kit/core": "^6.3.1"
}
```

## **System Architecture**

### **1. Main Components**

```
EVIDENS Editor
├── TipTap Rich Text Engine (Core)
├── WYSIWYG Canvas System
├── Unified Block Architecture  
├── Extension System
└── Performance Layer
```

#### **A. TipTap Rich Text Engine** (`/src/hooks/useRichTextEditor.ts`)
- **Purpose**: Core text editing functionality
- **Features**: Rich formatting, extensions, commands
- **Implementation**: Custom TipTap configuration with EVIDENS-specific extensions

#### **B. WYSIWYG Canvas System** (`/src/components/editor/WYSIWYGCanvas.tsx`)
- **Purpose**: Visual block positioning with constrained 2D canvas
- **Dimensions**: 800px width, 12-column grid system
- **Zoom**: 0.5x - 2.0x range for precision editing

#### **C. Unified Block Architecture** 
- **Rich Block Nodes**: `/src/components/editor/Nodes/RichBlockNode.tsx`
- **Block Wrapper**: `/src/components/editor/shared/UnifiedBlockWrapper.tsx`
- **Purpose**: Spatial positioning of rich content blocks

## **2. TipTap Extensions System**

### **Core Extensions**

| Extension | File | Purpose |
|-----------|------|---------|
| **Table** | `/src/components/editor/extensions/Table/` | Interactive tables with rich cell editing |
| **Typography** | `/src/components/editor/shared/typography-*.ts` | Font family, size, color, styling |
| **Rich Blocks** | `/src/components/editor/Nodes/` | Spatial block positioning |
| **Media** | `/src/components/editor/shared/mediaConstants.ts` | Image and video embedding |

### **Advanced Table System** (3,109 lines of code)

**Location**: `/src/components/editor/extensions/Table/`

**Key Components**:
- `SimpleTableComponent.tsx` (771 lines) - Main table orchestrator
- `RichTableCell.tsx` (325 lines) - Individual cell management
- `PerformanceOptimizedTableCellManager.ts` (557 lines) - Memory management

**Features**:
- Rich content support in cells **and headers** (Typography commands work on all cell types)
- Performance optimization with editor pooling
- Comprehensive table navigation
- Cell formatting and styling
- High z-index layering (`z-[2000]`) ensures table menus appear above block selection indicators

## **3. State Management Architecture**

### **Editor State** (`/src/store/editorStore.ts`)
```typescript
interface EditorState {
  blocks: BlockData[];
  selectedBlocks: string[];
  canvasConfig: CanvasConfig;
  editorMode: 'edit' | 'preview';
}
```

### **Selection System** (`/src/hooks/useSelectionCoordination.ts`)
- **Purpose**: Unified selection across TipTap and canvas
- **Features**: Multi-block selection, keyboard navigation
- **Testing**: Comprehensive test coverage in `__tests__/`

## **4. Performance Architecture**

### **Memory Management**
- **Editor Instance Pooling**: Reuses TipTap instances for performance
- **Lazy Loading**: Components load on demand
- **Optimized Rendering**: Memoized components and hooks

### **Testing Coverage**
- **Total Tests**: 100+ test files
- **Editor Tests**: 57/57 passing
- **Coverage Areas**: Selection, typography, tables, performance

## **5. Typography System**

### **Typography Engine** (`/src/components/editor/shared/typography-*.ts`)
- **Typography Commands**: 21,786 lines of sophisticated typography control
- **Font Management**: Custom font family, size, color systems
- **Theme Integration**: Dark/light mode typography support

### **Color System** (`/src/hooks/useColorTokens.ts`)
- **Design Tokens**: Consistent color management
- **Theme Integration**: Automatic color adaptation
- **Accessibility**: WCAG-compliant color contrasts

## **6. Development Patterns**

### **Hook Patterns**
```typescript
// Primary editor hook
const editor = useRichTextEditor(config);

// Selection coordination
const { selectBlock, clearSelection } = useSelectionCoordination();

// Theme integration  
const { getTypographyStyles } = useEditorTheme();
```

### **Component Patterns**
```typescript
// Rich Block Node
<RichBlockNode 
  blockId={blockId}
  content={content}
  position={position}
/>

// Table Integration
<SimpleTableComponent 
  data={tableData}
  onCellChange={handleCellChange}
/>
```

## **7. Extension Development**

### **Creating Custom Extensions**

1. **Extend TipTap Base**:
```typescript
import { Extension } from '@tiptap/core';

export const CustomExtension = Extension.create({
  name: 'customExtension',
  // Extension implementation
});
```

2. **Register with Editor**:
```typescript
const editor = useEditor({
  extensions: [
    StarterKit,
    CustomExtension,
  ],
});
```

### **Available Extension Points**
- **Commands**: Custom editor commands
- **Marks**: Text formatting marks
- **Nodes**: Block-level content
- **Input Rules**: Automatic formatting

## **8. Performance Optimization**

### **Implemented Optimizations**
- **Editor Instance Pooling**: Reuse TipTap instances
- **Lazy Component Loading**: On-demand component initialization
- **Memoized Renders**: React.memo and useMemo throughout
- **Debounced Updates**: Reduced state update frequency

### **Memory Management**
```typescript
// Performance-optimized table cell manager
export class PerformanceOptimizedTableCellManager {
  private editorPool: Editor[] = [];
  private activeEditors = new Map<string, Editor>();
  
  getEditor(cellId: string): Editor {
    // Pooled editor retrieval
  }
}
```

## **9. Testing Architecture**

### **Test Coverage**
- **Unit Tests**: Component and hook testing
- **Integration Tests**: TipTap and canvas integration
- **Performance Tests**: Memory and render optimization
- **Security Tests**: Input validation and sanitization

### **Key Test Files**
- `/src/hooks/__tests__/` - Hook testing
- `/src/components/editor/__tests__/` - Component testing
- Test governance with comprehensive validation

## **10. Security Implementation**

### **Input Sanitization** (`/src/utils/color-sanitization.ts`)
- **Color Value Validation**: Prevents CSS injection
- **Content Sanitization**: Safe HTML processing
- **XSS Prevention**: React auto-escaping + validation

### **Access Control**
- **Role-based Editing**: Admin/moderator/user permissions
- **Content Validation**: Zod schema validation
- **RLS Integration**: Database-level security

## **Migration Guide**

### **From Previous Documentation**
If you're migrating from documentation that referenced "React Flow" or "Visual Composition Engine":

1. **❌ Ignore React Flow References**: All React Flow documentation is outdated
2. **✅ Use TipTap Patterns**: Follow the TipTap-based architecture above
3. **✅ Refer to Working Code**: The actual implementation is the source of truth

### **Key Differences**
| Old (Documented) | New (Actual) |
|------------------|--------------|
| React Flow canvas | WYSIWYG TipTap canvas |
| Flow nodes | TipTap rich blocks |
| Node-based editing | Rich text editing |
| @xyflow/react | @tiptap/react |

## **Future Development**

### **Planned Enhancements**
- **Performance**: Further optimization of large documents
- **Extensions**: Additional TipTap extensions
- **Collaboration**: Real-time collaborative editing
- **Mobile**: Touch-optimized editing experience

### **Architecture Principles**
1. **TipTap First**: All editor functionality through TipTap
2. **Performance Focus**: Optimize for large documents
3. **Extension-based**: Modular functionality through extensions
4. **Type Safety**: Full TypeScript integration
5. **Test Coverage**: Maintain comprehensive test coverage

---

## **Quick Reference**

### **Key Files**
- **Core Editor**: `/src/hooks/useRichTextEditor.ts`
- **Canvas**: `/src/components/editor/WYSIWYGCanvas.tsx` 
- **Blocks**: `/src/components/editor/Nodes/RichBlockNode.tsx`
- **Tables**: `/src/components/editor/extensions/Table/`
- **State**: `/src/store/editorStore.ts`

### **Key Commands**
```bash
# Run editor tests
npm test -- src/components/editor

# Build with editor
npm run build

# Dev with editor
npm run dev
```

This architecture provides a solid foundation for rich text editing with spatial positioning, comprehensive table support, and excellent performance characteristics.