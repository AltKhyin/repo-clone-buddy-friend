# Command Bridge Migration Guide

This guide shows how to migrate existing TipTap extensions to use the centralized command-component bridge system.

## Overview

The command bridge system solves the fundamental disconnect between TipTap commands and React components by providing:

- **Centralized registry** for component references
- **Type-safe command creation** with error handling
- **Consistent patterns** across all extensions
- **Comprehensive testing utilities**

## Migration Steps

### 1. Define Component Methods Interface

```typescript
// Before: No standardized interface
export interface TableComponentMethods {
  addColumn: () => void;
  removeColumn: (colIndex: number) => void;
  // ... other methods
}

// After: Extends base ComponentMethods
import { ComponentMethods } from '../shared/commandBridge';

export interface TableComponentMethods extends ComponentMethods {
  addColumn: () => void;
  removeColumn: (colIndex: number) => void;
  updateTableData: (updates: Partial<TableData>) => void;
  getCurrentCellPosition: () => { row: number; col: number } | null;
}
```

### 2. Create Extension-Specific Registry

```typescript
// Before: Custom registry implementation
class TableComponentRegistry {
  private components = new Map<string, TableComponentMethods>();
  // ... custom implementation
}

// After: Use centralized ComponentRegistry
import { ComponentRegistry, ExtensionBridgeConfig } from '../shared/commandBridge';

const config: ExtensionBridgeConfig = {
  nodeTypeName: 'customTable',
  idAttributeName: 'tableId',
};

export const tableComponentRegistry = new ComponentRegistry<TableComponentMethods>(config);
```

### 3. Create Commands Using Bridge System

```typescript
// Before: Manual command implementation
export const createTableCommands = () => ({
  addColumnAfter: (): Command => ({ state, dispatch, tr }) => {
    const tableNode = findCurrentTableNode(state);
    if (!tableNode) return false;
    const component = tableComponentRegistry.getCurrentComponent(tableNode);
    if (!component) return false;
    try {
      component.addColumn();
      if (dispatch && tr) {
        dispatch(tr.setMeta('forceUpdate', true));
      }
      return true;
    } catch (error) {
      console.error('Failed to add column:', error);
      return false;
    }
  },
  // ... more manual implementations
});

// After: Use centralized bridge system
import { createBridgedCommands } from '../shared/commandBridge';

export const tableCommands = createBridgedCommands(tableComponentRegistry, {
  addColumnAfter: {
    methodName: 'addColumn',
    errorMessage: 'Failed to add column',
  },
  deleteColumn: {
    methodName: 'removeColumn',
    errorMessage: 'Failed to delete column',
  },
  updateTableData: {
    methodName: 'updateTableData',
    errorMessage: 'Failed to update table data',
  },
});
```

### 4. Update React Component Integration

```typescript
// Before: Manual registry management
export const TableComponent: React.FC<TableComponentProps> = ({ node, updateAttributes }) => {
  // ... component logic

  useEffect(() => {
    const tableId = node.attrs.tableId;
    if (tableId) {
      tableComponentRegistry.register(tableId, componentMethods);
      return () => {
        tableComponentRegistry.unregister(tableId);
      };
    }
  }, [node.attrs.tableId, componentMethods]);
};

// After: Same pattern, but using standardized registry
import { tableComponentRegistry } from './tableCommands';

export const TableComponent: React.FC<TableComponentProps> = ({ node, updateAttributes }) => {
  // ... component logic

  const componentMethods: TableComponentMethods = useMemo(() => ({
    addColumn,
    removeColumn,
    updateTableData,
    getCurrentCellPosition,
  }), [addColumn, removeColumn, updateTableData, getCurrentCellPosition]);

  // Standard registry integration pattern
  useEffect(() => {
    const tableId = node.attrs.tableId;
    if (tableId) {
      tableComponentRegistry.register(tableId, componentMethods);
      return () => {
        tableComponentRegistry.unregister(tableId);
      };
    }
  }, [node.attrs.tableId, componentMethods]);
};
```

### 5. Update Extension Command Integration

```typescript
// In your TipTap extension file
import { tableCommands } from './tableCommands';

export const TableExtension = Node.create<TableOptions>({
  // ... extension config

  addCommands() {
    return {
      insertTable: (options = {}) => ({ commands }) => {
        // ... insertion logic
      },

      // Use bridged commands
      addColumnAfter: tableCommands.addColumnAfter,
      deleteColumn: tableCommands.deleteColumn,
      updateTableData: tableCommands.updateTableData,
    };
  },
});
```

## Testing with Bridge System

### 1. Component Registry Tests

```typescript
import { tableComponentRegistry } from '../tableCommands';

describe('TableCommands Integration', () => {
  let mockComponent: TableComponentMethods;

  beforeEach(() => {
    tableComponentRegistry.clear();
    mockComponent = {
      addColumn: vi.fn(),
      removeColumn: vi.fn(),
      updateTableData: vi.fn(),
      getCurrentCellPosition: vi.fn(() => ({ row: 0, col: 0 })),
    };
    tableComponentRegistry.register('test-table-1', mockComponent);
  });

  it('should register and retrieve components correctly', () => {
    const retrieved = tableComponentRegistry.get('test-table-1');
    expect(retrieved).toBe(mockComponent);
  });
});
```

### 2. Command Execution Tests

```typescript
it('should call addColumn when addColumnAfter command is executed', () => {
  const result = tableCommands.addColumnAfter()({
    state: mockState,
    dispatch: mockDispatch,
    tr: mockTr,
  });

  expect(result).toBe(true);
  expect(mockComponent.addColumn).toHaveBeenCalled();
  expect(mockDispatch).toHaveBeenCalledWith(mockTr);
});
```

## Benefits of Migration

### Before Migration
- ❌ Duplicate registry implementations
- ❌ Inconsistent error handling
- ❌ Manual command creation boilerplate
- ❌ No standardized testing patterns

### After Migration
- ✅ Centralized, reusable registry system
- ✅ Consistent error handling and logging
- ✅ Declarative command creation
- ✅ Standardized testing utilities
- ✅ Type safety across all extensions
- ✅ Debug utilities for troubleshooting

## Debug Utilities

Use the built-in debug utilities for troubleshooting:

```typescript
import { debugCommandBridge } from '../shared/commandBridge';

// Log all registered components
debugCommandBridge.logRegisteredComponents(tableComponentRegistry);

// Test if a component is registered
debugCommandBridge.testComponentRegistration(tableComponentRegistry, 'table-1');

// Validate component has required methods
debugCommandBridge.validateComponentMethods(componentInstance, ['addColumn', 'removeColumn']);
```

## Advanced Usage

### Custom Command Logic

For commands that need custom logic beyond simple method calls:

```typescript
import { createBridgedCommand } from '../shared/commandBridge';

export const customTableCommand = createBridgedCommand(
  tableComponentRegistry,
  'customMethod',
  'Failed to execute custom command'
);

// Or create entirely custom command while still using the registry
export const complexTableCommand = (): Command => ({ state, dispatch, tr }) => {
  const node = findNodeOfType(state, 'customTable');
  if (!node) return false;
  
  const component = tableComponentRegistry.getCurrentComponent(node);
  if (!component) return false;
  
  // Custom logic here
  const cellPos = component.getCurrentCellPosition();
  if (cellPos && cellPos.col > 0) {
    component.removeColumn(cellPos.col);
  } else {
    component.addColumn();
  }
  
  if (dispatch && tr) {
    dispatch(tr.setMeta('forceUpdate', true));
  }
  
  return true;
};
```

This migration approach ensures consistency, maintainability, and reliability across all TipTap extensions in the codebase.