# TABLE SYSTEM DEPENDENCY ANALYSIS
## Comprehensive mapping for complete table system replacement

### CORE TABLE FILES TO BE REMOVED (37 total)

#### Main Table Components (8 files)
- `src/components/editor/extensions/Table/TableExtension.ts` - Main TipTap extension
- `src/components/editor/extensions/Table/ReadOnlyTableWrapper.tsx` - Display wrapper
- `src/components/editor/extensions/Table/ReadOnlyTableDisplay.tsx` - Read-only renderer
- `src/components/editor/extensions/Table/SimpleTableComponent.tsx` - Basic table component
- `src/components/editor/extensions/Table/RichTableCell.tsx` - Rich content cell editor
- `src/components/editor/extensions/Table/TableEditorWindow.tsx` - Complex editor modal (1800+ lines)
- `src/components/editor/extensions/Table/TableEditorModal.tsx` - Modal wrapper
- `src/components/editor/extensions/Table/index.ts` - Export index

#### Table Utilities & Commands (7 files)
- `src/components/editor/extensions/Table/tableCommands.ts` - Command system
- `src/components/editor/extensions/Table/tableUtils.ts` - Utility functions
- `src/components/editor/extensions/Table/tableDataMigration.ts` - Data migration
- `src/components/editor/extensions/Table/tableMigration.ts` - Legacy migration
- `src/components/editor/extensions/Table/tableEditorConfig.ts` - Configuration
- `src/components/editor/extensions/Table/TableTypographyCommands.ts` - Typography integration
- `src/components/editor/extensions/Table/utils/richContentRenderer.ts` - Content rendering

#### Performance System (4 files)
- `src/components/editor/extensions/Table/performance/PerformanceOptimizedTableCellManager.ts`
- `src/components/editor/extensions/Table/performance/CellEditSession.ts`
- `src/components/editor/extensions/Table/performance/VirtualizedTableRenderer.tsx`
- `src/components/editor/extensions/Table/performance/README.md`

#### Test Files (18 files)
- `src/components/editor/extensions/Table/__tests__/ReadOnlyTableDisplay.test.tsx`
- `src/components/editor/extensions/Table/__tests__/RichTableCell.display-formatting.test.tsx`
- `src/components/editor/extensions/Table/__tests__/RichTableCell.test.tsx`
- `src/components/editor/extensions/Table/__tests__/SimpleTableComponent.test.tsx`
- `src/components/editor/extensions/Table/__tests__/TableEditorModal.test.tsx`
- `src/components/editor/extensions/Table/__tests__/TableFunctionality.test.ts`
- `src/components/editor/extensions/Table/__tests__/DataMigration.test.ts`
- `src/components/editor/extensions/Table/__tests__/color-picker-zindex-integration.test.tsx`
- `src/components/editor/extensions/Table/__tests__/edit-session-integration.test.tsx`
- `src/components/editor/extensions/Table/__tests__/header-typography-integration.test.tsx`
- `src/components/editor/extensions/Table/__tests__/performance.optimization.test.tsx`
- `src/components/editor/extensions/Table/__tests__/table-cell-issues-reproduction.test.tsx`
- `src/components/editor/extensions/Table/__tests__/table-cell-persistence.test.tsx`
- `src/components/editor/extensions/Table/__tests__/table-state-persistence.test.tsx`
- `src/components/editor/extensions/Table/__tests__/table-zindex-layering.test.tsx`
- `src/components/editor/extensions/Table/__tests__/tableCommands.test.ts`
- `src/components/editor/extensions/Table/__tests__/tableDataModel.test.ts`
- `src/components/editor/extensions/Table/__tests__/tableUIEnhancements.test.tsx`

### EXTERNAL FILES WITH TABLE DEPENDENCIES

#### Editor Integration Points
- `src/hooks/useRichTextEditor.ts` - Imports TableExtension
- `src/hooks/useTiptapEditor.ts` - Imports TableExtension
- `src/components/editor/Inspector/TableBlockInspector.tsx` - Uses TableData type

#### Selection System Files
- `src/store/selectionStore.ts` - Multi-cell selection logic, table coordination
- `src/types/selection.ts` - Table selection types (CellPosition, TableSelectionInfo, CellSelectionInfo, MultiCellSelectionInfo)
- `src/hooks/useUnifiedSelection.ts` - Table selection integration

#### Validation & Shared Logic
- `src/components/editor/shared/validation.ts` - TableData validation functions

#### Test Files Outside Table Directory
- `src/components/editor/Inspector/__tests__/InspectorCommandIntegration.test.tsx`
- Multiple editor integration tests referencing table functionality

### TABLE-RELATED TYPES TO REMOVE

#### Core Types (from TableExtension.ts)
- `TableData` interface - Complex data structure with rich content
- `RichCellData` interface - Rich HTML cell content
- `HeaderLayout` type - Complex header configurations  
- `LegacyTableData` interface - Backward compatibility
- `TableOptions` interface - Extension options

#### Selection Types (from selection.ts)
- `CellPosition` interface
- `TableSelectionInfo` interface
- `CellSelectionInfo` interface
- `MultiCellSelectionInfo` interface - Complex multi-cell selection

### SELECTION SYSTEM SIMPLIFICATIONS NEEDED

#### Remove from selectionStore.ts
- Multi-cell selection state management (~300 lines)
- Table cell typography aggregation logic
- Complex selection coordination with table performance manager
- Table-specific selection actions and reducers

#### Remove from types/selection.ts
- All table and cell selection interfaces
- Multi-cell selection types
- Complex selection coordination types

### COMPLEXITY METRICS

#### Lines of Code to Remove
- TableEditorWindow.tsx: ~1,800 lines
- RichTableCell.tsx: ~500+ lines  
- Selection store table logic: ~300 lines
- Total estimated: **5,000+ lines removed**

#### Files to Remove
- Core table files: 37 files
- External dependencies: ~10 files
- **Total: 47+ files removed**

### INTEGRATION POINTS TO UPDATE

#### Editor Configuration
- Remove TableExtension from editor extensions list
- Update toolbar table insertion logic
- Remove table-specific keyboard shortcuts

#### Typography System
- Remove table-specific typography commands
- Clean multi-cell typography application logic
- Simplify toolbar table integration

#### Data Migration Strategy
- Convert complex TableData to simple `{headers: string[], rows: string[][]}` 
- Strip all rich content and formatting
- Preserve only plain text content

### REDDIT-INSPIRED REPLACEMENT STRUCTURE

#### Simple Data Model
```typescript
interface BasicTableData {
  headers: string[];
  rows: string[][];
}
```

#### HTML Structure
```html
<table class="table-fixed">
  <thead>
    <tr>
      <th class="px-sm py-xs leading-5 border border-solid border-neutral-border relative">
        <p class="first:mt-0 last:mb-0">Header</p>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="px-sm py-xs leading-5 border border-solid border-neutral-border relative">
        <p class="first:mt-0 last:mb-0">Cell Content</p>
      </td>
    </tr>
  </tbody>
</table>
```

#### Context Menu Operations
- Insert row above/below
- Insert column before/after
- Delete row/column  
- Align left/center/right
- Delete table

---

**ANALYSIS COMPLETE**: Ready to proceed with M1.2 Architecture Design