// ABOUTME: BasicTable module exports - simple table system replacing complex TableExtension

// Core extension and component
export { BasicTableExtension } from './BasicTableExtension';
export { BasicTableComponent } from './BasicTableComponent';
export { TableContextMenu } from './TableContextMenu';

// Table operations
export * from './tableOperations';

// Migration utilities
export * from './migration';

// Type definitions
export type {
  BasicTableData,
  BasicTableOptions,
  TableAction,
  TableMenuItem,
  CellPosition,
  TableContextMenuProps,
  TableValidationResult,
  TableOperationResult
} from './types';

// Constants
export { DEFAULT_TABLE_DATA } from './types';

// Default export is the extension
export { BasicTableExtension as default } from './BasicTableExtension';