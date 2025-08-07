# BASIC TABLE ARCHITECTURE DESIGN
## Reddit-inspired simple table system to replace complex implementation

### DESIGN PRINCIPLES

#### Simplicity First
- **90% complexity reduction** from current system
- **Plain text only** - no rich content or formatting
- **Essential operations only** - Reddit's proven approach
- **No multi-cell selection** - standard browser cell selection
- **No complex theming** - use standard border/padding

#### Data Structure Simplification
```typescript
// BEFORE: Complex TableData with rich content, styling, settings (50+ properties)
interface TableData {
  headers: (string | RichCellData)[];
  rowHeaders: (string | RichCellData)[];
  rows: (string | RichCellData)[][];
  isRichContent?: boolean;
  headerLayout: HeaderLayout;
  styling: { /* 15+ styling properties */ };
  settings: { /* 8+ behavior settings */ };
}

// AFTER: Simple BasicTableData (3 properties)
interface BasicTableData {
  headers: string[];
  rows: string[][];
  id?: string; // For editor node identification
}
```

### COMPONENT ARCHITECTURE

#### 1. BasicTableExtension (TipTap Extension)
**File**: `src/components/editor/extensions/BasicTable/BasicTableExtension.ts`

```typescript
export const BasicTableExtension = Node.create<BasicTableOptions>({
  name: 'basicTable',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      tableData: {
        default: { headers: ['Column 1', 'Column 2'], rows: [['', '']] },
        parseHTML: element => JSON.parse(element.getAttribute('data-table') || '{}'),
        renderHTML: attributes => ({ 'data-table': JSON.stringify(attributes.tableData) })
      }
    }
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="basic-table"]' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'basic-table' }), 0]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(BasicTableComponent)
  },
  
  addCommands() {
    return {
      insertBasicTable: (options) => ({ commands }) => {
        return commands.insertContent({
          type: 'basicTable',
          attrs: { tableData: options || { headers: ['Column 1'], rows: [['']] } }
        })
      }
    }
  }
})
```

#### 2. BasicTableComponent (React Component)
**File**: `src/components/editor/extensions/BasicTable/BasicTableComponent.tsx`

**Key Features**:
- **Reddit's exact HTML structure** with proper CSS classes
- **Single-click editing** via contentEditable on cells
- **Right-click context menu** for table operations
- **No complex state management** - direct DOM updates
- **No typography controls** - plain text only

```typescript
interface BasicTableComponentProps {
  node: Node;
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
}

export const BasicTableComponent: React.FC<BasicTableComponentProps> = ({
  node,
  updateAttributes,
  selected
}) => {
  const { tableData }: { tableData: BasicTableData } = node.attrs;
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });

  // Simple cell update handler
  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const isHeader = rowIndex === -1;
    const newData = { ...tableData };
    
    if (isHeader) {
      newData.headers[colIndex] = value;
    } else {
      newData.rows[rowIndex][colIndex] = value;
    }
    
    updateAttributes({ tableData: newData });
  };

  // Reddit-style HTML structure
  return (
    <div className={cn("relative", selected && "ring-2 ring-primary")}>
      <table className="table-fixed border-collapse">
        {/* Headers */}
        <thead>
          <tr>
            {tableData.headers.map((header, colIndex) => (
              <th 
                key={colIndex}
                className="px-sm py-xs leading-5 border border-solid border-neutral-border relative"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateCell(-1, colIndex, e.currentTarget.textContent || '')}
                onContextMenu={(e) => handleContextMenu(e, -1, colIndex)}
              >
                <p className="first:mt-0 last:mb-0">{header}</p>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Body */}
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className="px-sm py-xs leading-5 border border-solid border-neutral-border relative"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateCell(rowIndex, colIndex, e.currentTarget.textContent || '')}
                  onContextMenu={(e) => handleContextMenu(e, rowIndex, colIndex)}
                >
                  <p className="first:mt-0 last:mb-0">{cell}</p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Context Menu */}
      {showContextMenu && (
        <TableContextMenu
          position={contextMenuPosition}
          selectedCell={selectedCell}
          tableData={tableData}
          onAction={handleTableAction}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
};
```

#### 3. TableContextMenu (Context Menu)
**File**: `src/components/editor/extensions/BasicTable/TableContextMenu.tsx`

**Operations** (matching Reddit exactly):
- Insert row above/below
- Insert column before/after  
- Delete row/column
- Align left/center/right (via CSS text-align)
- Delete table

```typescript
interface TableContextMenuProps {
  position: { x: number; y: number };
  selectedCell: { row: number; col: number };
  tableData: BasicTableData;
  onAction: (action: TableAction) => void;
  onClose: () => void;
}

export const TableContextMenu: React.FC<TableContextMenuProps> = ({
  position,
  selectedCell,
  tableData,
  onAction,
  onClose
}) => {
  const menuItems = [
    { action: 'insertRowAbove', label: 'Insert row above', icon: <Plus /> },
    { action: 'insertRowBelow', label: 'Insert row below', icon: <Plus /> },
    { type: 'separator' },
    { action: 'insertColumnBefore', label: 'Insert column before', icon: <Plus /> },
    { action: 'insertColumnAfter', label: 'Insert column after', icon: <Plus /> },
    { type: 'separator' },
    { action: 'alignLeft', label: 'Align left', icon: <AlignLeft /> },
    { action: 'alignCenter', label: 'Align center', icon: <AlignCenter /> },
    { action: 'alignRight', label: 'Align right', icon: <AlignRight /> },
    { type: 'separator' },
    { action: 'deleteRow', label: 'Delete row', icon: <Trash />, danger: true },
    { action: 'deleteColumn', label: 'Delete column', icon: <Trash />, danger: true },
    { type: 'separator' },
    { action: 'deleteTable', label: 'Delete table', icon: <Trash />, danger: true }
  ];

  return (
    <Portal>
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
      >
        <ul 
          className="absolute bg-white border shadow-lg rounded-md py-1 min-w-48"
          style={{ left: position.x, top: position.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.map((item, index) => (
            item.type === 'separator' ? (
              <hr key={index} className="my-1 border-gray-200" />
            ) : (
              <li key={index}>
                <button
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100",
                    item.danger && "text-red-600 hover:bg-red-50"
                  )}
                  onClick={() => {
                    onAction(item.action as TableAction);
                    onClose();
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            )
          ))}
        </ul>
      </div>
    </Portal>
  );
};
```

### TABLE OPERATIONS (Simple Array Manipulation)

#### Row Operations
```typescript
// Insert row above
const insertRowAbove = (data: BasicTableData, rowIndex: number): BasicTableData => ({
  ...data,
  rows: [
    ...data.rows.slice(0, rowIndex),
    new Array(data.headers.length).fill(''),
    ...data.rows.slice(rowIndex)
  ]
});

// Delete row  
const deleteRow = (data: BasicTableData, rowIndex: number): BasicTableData => ({
  ...data,
  rows: data.rows.filter((_, index) => index !== rowIndex)
});
```

#### Column Operations
```typescript
// Insert column before
const insertColumnBefore = (data: BasicTableData, colIndex: number): BasicTableData => ({
  headers: [
    ...data.headers.slice(0, colIndex),
    `Column ${colIndex + 1}`,
    ...data.headers.slice(colIndex)
  ],
  rows: data.rows.map(row => [
    ...row.slice(0, colIndex),
    '',
    ...row.slice(colIndex)
  ])
});

// Delete column
const deleteColumn = (data: BasicTableData, colIndex: number): BasicTableData => ({
  headers: data.headers.filter((_, index) => index !== colIndex),
  rows: data.rows.map(row => row.filter((_, index) => index !== colIndex))
});
```

### EDITOR INTEGRATION

#### Toolbar Integration
**File**: Update existing toolbar components

```typescript
// Add to toolbar
<Button
  variant="outline"
  size="sm"
  onClick={() => editor.chain().focus().insertBasicTable().run()}
  className="flex items-center gap-2"
>
  <Table className="h-4 w-4" />
  Table
</Button>
```

#### Extension Registration
**Files to update**:
- `src/hooks/useRichTextEditor.ts`
- `src/hooks/useTiptapEditor.ts`

```typescript
// Replace TableExtension with BasicTableExtension
import { BasicTableExtension } from '@/components/editor/extensions/BasicTable';

const extensions = [
  // ... other extensions
  BasicTableExtension.configure({
    HTMLAttributes: {
      class: 'basic-table'
    }
  })
  // Remove TableExtension import and usage
];
```

### DATA MIGRATION STRATEGY

#### Migration Function
**File**: `src/components/editor/extensions/BasicTable/tableMigration.ts`

```typescript
export const migrateTableToBasic = (complexTable: any): BasicTableData => {
  // Extract headers - convert rich content to plain text
  const headers = (complexTable.headers || []).map((header: any) => {
    if (typeof header === 'string') return header;
    if (header.content) return stripHtml(header.content);
    return 'Header';
  });

  // Extract rows - convert all rich content to plain text
  const rows = (complexTable.rows || []).map((row: any[]) => 
    row.map((cell: any) => {
      if (typeof cell === 'string') return cell;
      if (cell.content) return stripHtml(cell.content);
      return '';
    })
  );

  return {
    headers: headers.length > 0 ? headers : ['Column 1'],
    rows: rows.length > 0 ? rows : [['']]
  };
};

// Helper to strip HTML and keep only text
const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};
```

### CSS STYLES

#### Table Styling (matches Reddit exactly)
```css
.basic-table table {
  @apply table-fixed border-collapse;
}

.basic-table th,
.basic-table td {
  @apply px-sm py-xs leading-5 border border-solid border-neutral-border relative;
}

.basic-table th p,
.basic-table td p {
  @apply first:mt-0 last:mb-0;
}

/* Focus states for editing */
.basic-table th:focus,
.basic-table td:focus {
  @apply outline-none ring-2 ring-primary ring-inset;
}
```

### SELECTION SYSTEM INTEGRATION

#### Simplified Selection (Block-level only)
- **Remove multi-cell selection** entirely
- **Remove cell-level selection** coordination
- **Keep basic block selection** for table as a whole
- **Use browser's native cell selection** for editing

```typescript
// Simple block selection only
interface BasicTableSelection {
  type: 'basicTable';
  blockId: string;
  // No cell-level selection complexity
}
```

### TESTING STRATEGY

#### Core Tests Needed
1. **Component Rendering**: Table displays correctly with Reddit structure
2. **Cell Editing**: contentEditable updates work properly  
3. **Context Menu**: All operations function correctly
4. **Row/Column Operations**: Insert/delete operations work
5. **Data Migration**: Complex tables convert to simple format
6. **Editor Integration**: Table insertion and selection work

#### Test Structure
```typescript
describe('BasicTableComponent', () => {
  describe('Rendering', () => {
    it('renders table with Reddit HTML structure')
    it('displays headers and rows correctly')
    it('applies correct CSS classes')
  })
  
  describe('Editing', () => {
    it('allows editing cells via contentEditable')
    it('updates table data on blur')
    it('preserves data structure')
  })
  
  describe('Context Menu', () => {
    it('shows context menu on right click')
    it('performs row operations correctly')
    it('performs column operations correctly')
    it('deletes table when requested')
  })
  
  describe('Migration', () => {
    it('converts complex table to basic format')
    it('preserves text content only')
    it('handles edge cases gracefully')
  })
})
```

### PERFORMANCE BENEFITS

#### Complexity Reduction
- **No rich content editors per cell** (removes 500+ lines)
- **No multi-cell selection coordination** (removes 300+ lines)  
- **No performance optimization system** (removes entire subsystem)
- **No complex typography integration** (removes theme complexity)
- **No virtualization needed** for simple tables

#### Memory Usage
- **90% reduction** in component complexity
- **Simple string arrays** instead of rich objects
- **Native browser editing** instead of TipTap per cell
- **No selection state tracking** beyond basic block selection

---

**ARCHITECTURE DESIGN COMPLETE**: Ready to proceed with M2.1 Implementation