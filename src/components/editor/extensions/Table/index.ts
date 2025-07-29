// ABOUTME: Reddit-style table extension exports - simplified architecture using TipTap best practices

export { TableExtension } from './TableExtension';
export { SimpleTableComponent } from './SimpleTableComponent';
// REMOVED: TableToolbar - integrated into SimpleTableComponent
export * from './tableUtils';
export type { TableData, TableOptions } from './TableExtension';
