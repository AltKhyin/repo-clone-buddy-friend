// ABOUTME: React component for rendering interactive tables in TipTap editor with inline editing

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  Plus,
  Minus,
  MoreVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Settings,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableData } from './TableExtension';
import { tableComponentRegistry, TableComponentMethods } from './tableCommands';
import { safeUpdateTableData, TABLE_LIMITS, ValidationResult } from '../../shared/validation';
import { TableErrorBoundary, useErrorReporting, useSafeAsync } from '../../shared/ErrorBoundary';
import {
  usePerformanceMonitor,
  useMemoryMonitor,
  useOptimizedCallback,
  useOptimizedMemo,
} from '../../shared/performance';
import {
  useRenderAnalysis,
  useRenderWasteDetection,
  createShallowPropsComparison,
} from '../../shared/renderAnalysis';
import { useToast } from '@/hooks/use-toast';

interface TableComponentProps extends NodeViewProps {
  // Inherited from NodeViewProps: node, updateAttributes, deleteNode, selected
}

interface CellPosition {
  row: number;
  col: number;
}

// Create optimized props comparison for React.memo
const tablePropsComparison = createShallowPropsComparison<TableComponentProps>(
  'TableComponent',
  []
);

const TableComponentInner: React.FC<TableComponentProps> = React.memo(
  ({ node, updateAttributes, deleteNode, selected }) => {
    const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
    const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationResult | null>(null);
    const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    // Performance monitoring hooks
    const { renderCount, getMetrics } = usePerformanceMonitor('TableComponent');
    const { getCurrentMemory } = useMemoryMonitor('TableComponent');
    const { trackStateChange, getAnalytics } = useRenderAnalysis('TableComponent');
    const { getWastedRenderCount } = useRenderWasteDetection('TableComponent', {
      node: node.attrs,
      selected,
    });

    // Error handling hooks
    const { reportError } = useErrorReporting();
    const { safeAsync } = useSafeAsync();
    const { toast } = useToast();

    // Extract table data directly from TipTap node attributes (single source of truth)
    const tableData: TableData = useOptimizedMemo(
      () => ({
        headers: node.attrs.headers || [],
        rows: node.attrs.rows || [],
        styling: {
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          backgroundColor: 'transparent',
          headerBackgroundColor: '#f8fafc',
          cellPadding: 12,
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 400,
          striped: false,
          compact: false,
          ...node.attrs.styling,
        },
        settings: {
          sortable: false,
          resizable: true,
          showHeaders: true,
          minRows: 1,
          maxRows: 50,
          ...node.attrs.settings,
        },
      }),
      [node.attrs.headers, node.attrs.rows, node.attrs.styling, node.attrs.settings],
      'TableComponent.tableData'
    );

    // Initialize default table if empty (simplified)
    useEffect(() => {
      if (!isInitialized && (!node.attrs.headers?.length || !node.attrs.rows?.length)) {
        const defaultHeaders = ['Column 1', 'Column 2', 'Column 3'];
        const defaultRows = [
          ['', '', ''],
          ['', '', ''],
          ['', '', ''],
        ];

        updateAttributes({
          ...node.attrs,
          headers: defaultHeaders,
          rows: defaultRows,
        });
        setIsInitialized(true);
        trackStateChange('isInitialized');
      } else if (!isInitialized) {
        setIsInitialized(true);
        trackStateChange('isInitialized');
      }
    }, [isInitialized, node.attrs, updateAttributes, trackStateChange]);

    // Safe update helper with validation
    const updateTableData = useOptimizedCallback(
      (updates: Partial<TableData>) => {
        try {
          const { data, validation } = safeUpdateTableData(node.attrs, updates);

          // Update validation state
          setValidationErrors(validation);

          // Show validation warnings if any
          if (validation.warnings.length > 0) {
            toast({
              title: 'Table Update Warning',
              description: validation.warnings[0],
              variant: 'default',
              duration: 3000,
            });
          }

          // Show validation errors if any
          if (validation.errors.length > 0) {
            toast({
              title: 'Table Update Error',
              description: validation.errors[0],
              variant: 'destructive',
              duration: 5000,
            });
          }

          // Always update with sanitized data
          updateAttributes(data);
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          reportError(errorObj, 'TableComponent.updateTableData');

          toast({
            title: 'Update Failed',
            description: 'Failed to update table. Please try again.',
            variant: 'destructive',
          });
        }
      },
      [node.attrs, updateAttributes, reportError, toast],
      'TableComponent.updateTableData'
    );

    // Simplified cell editing handlers
    const startEditing = useOptimizedCallback(
      (row: number, col: number) => {
        setEditingCell({ row, col });

        if (row === -1) {
          // Editing header
          setEditValue(tableData.headers[col] || '');
        } else {
          // Editing cell
          setEditValue(tableData.rows[row]?.[col] || '');
        }
      },
      [tableData.headers, tableData.rows],
      'TableComponent.startEditing'
    );

    const finishEditing = useOptimizedCallback(
      () => {
        if (!editingCell) return;

        const { row, col } = editingCell;

        if (row === -1) {
          // Update header directly
          const newHeaders = [...tableData.headers];
          newHeaders[col] = editValue;
          updateTableData({ headers: newHeaders });
        } else {
          // Update cell directly
          const newRows = [...tableData.rows];
          if (!newRows[row]) newRows[row] = [];
          newRows[row][col] = editValue;
          updateTableData({ rows: newRows });
        }

        setEditingCell(null);
        setEditValue('');
      },
      [editingCell, editValue, tableData.headers, tableData.rows, updateTableData],
      'TableComponent.finishEditing'
    );

    const cancelEditing = useOptimizedCallback(
      () => {
        setEditingCell(null);
        setEditValue('');
      },
      [],
      'TableComponent.cancelEditing'
    );

    // Simplified table structure modification with validation
    const addColumn = useCallback(async () => {
      if (tableData.headers.length >= TABLE_LIMITS.MAX_COLUMNS) {
        toast({
          title: 'Cannot Add Column',
          description: `Maximum ${TABLE_LIMITS.MAX_COLUMNS} columns allowed`,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await safeAsync(async () => {
        const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
        const newRows = tableData.rows.map(row => [...row, '']);
        updateTableData({ headers: newHeaders, rows: newRows });
      }, 'addColumn');

      if (!error) {
        toast({
          title: 'Column Added',
          description: 'New column added successfully',
          duration: 2000,
        });
      }
    }, [tableData.headers, tableData.rows, updateTableData, safeAsync, toast]);

    const removeColumn = useCallback(
      async (colIndex: number) => {
        if (tableData.headers.length <= TABLE_LIMITS.MIN_COLUMNS) {
          toast({
            title: 'Cannot Remove Column',
            description: `Table must have at least ${TABLE_LIMITS.MIN_COLUMNS} column`,
            variant: 'destructive',
          });
          return;
        }

        const { error } = await safeAsync(async () => {
          const newHeaders = tableData.headers.filter((_, i) => i !== colIndex);
          const newRows = tableData.rows.map(row => row.filter((_, i) => i !== colIndex));
          updateTableData({ headers: newHeaders, rows: newRows });
        }, 'removeColumn');

        if (!error) {
          toast({
            title: 'Column Removed',
            description: 'Column removed successfully',
            duration: 2000,
          });
        }
      },
      [tableData.headers, tableData.rows, updateTableData, safeAsync, toast]
    );

    const addRow = useCallback(async () => {
      if (tableData.rows.length >= TABLE_LIMITS.MAX_ROWS) {
        toast({
          title: 'Cannot Add Row',
          description: `Maximum ${TABLE_LIMITS.MAX_ROWS} rows allowed`,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await safeAsync(async () => {
        const newRow = Array(tableData.headers.length).fill('');
        const newRows = [...tableData.rows, newRow];
        updateTableData({ rows: newRows });
      }, 'addRow');

      if (!error) {
        toast({
          title: 'Row Added',
          description: 'New row added successfully',
          duration: 2000,
        });
      }
    }, [tableData.headers.length, tableData.rows, updateTableData, safeAsync, toast]);

    const removeRow = useCallback(
      async (rowIndex: number) => {
        if (tableData.rows.length <= TABLE_LIMITS.MIN_ROWS) {
          toast({
            title: 'Cannot Remove Row',
            description: `Table must have at least ${TABLE_LIMITS.MIN_ROWS} row`,
            variant: 'destructive',
          });
          return;
        }

        const { error } = await safeAsync(async () => {
          const newRows = tableData.rows.filter((_, i) => i !== rowIndex);
          updateTableData({ rows: newRows });
        }, 'removeRow');

        if (!error) {
          toast({
            title: 'Row Removed',
            description: 'Row removed successfully',
            duration: 2000,
          });
        }
      },
      [tableData.rows, updateTableData, safeAsync, toast]
    );

    // Simplified keyboard navigation (memory optimized)
    const handleKeyDown = useOptimizedCallback(
      (e: React.KeyboardEvent, row: number, col: number) => {
        if (editingCell) {
          if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            finishEditing();

            if (e.key === 'Tab') {
              // Move to next cell
              const nextCol = col + 1;
              const nextRow = nextCol >= tableData.headers.length ? row + 1 : row;
              const finalCol = nextCol >= tableData.headers.length ? 0 : nextCol;

              if (nextRow < tableData.rows.length) {
                setActiveCell({ row: nextRow, col: finalCol });
              }
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing();
          }
          return;
        }

        // Navigation when not editing
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            startEditing(row, col);
            break;
          case 'Tab':
            e.preventDefault();
            const nextCol = col + 1;
            const nextRow = nextCol >= tableData.headers.length ? row + 1 : row;
            const finalCol = nextCol >= tableData.headers.length ? 0 : nextCol;

            if (nextRow < tableData.rows.length) {
              setActiveCell({ row: nextRow, col: finalCol });
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (row > 0) setActiveCell({ row: row - 1, col });
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (row < tableData.rows.length - 1) setActiveCell({ row: row + 1, col });
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (col > 0) setActiveCell({ row, col: col - 1 });
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (col < tableData.headers.length - 1) setActiveCell({ row, col: col + 1 });
            break;
        }
      },
      [
        editingCell,
        finishEditing,
        cancelEditing,
        startEditing,
        tableData.headers.length,
        tableData.rows.length,
      ],
      'TableComponent.handleKeyDown'
    );

    // Cell styling (memoized to prevent object recreation)
    const getCellStyle = useOptimizedCallback(
      (isHeader = false) => ({
        padding: `${tableData.styling.cellPadding}px`,
        border: `${tableData.styling.borderWidth}px ${tableData.styling.borderStyle} ${tableData.styling.borderColor}`,
        backgroundColor: isHeader
          ? tableData.styling.headerBackgroundColor
          : tableData.styling.backgroundColor,
        textAlign: tableData.styling.textAlign,
        fontSize: `${tableData.styling.fontSize}px`,
        fontWeight: isHeader ? 600 : tableData.styling.fontWeight,
      }),
      [tableData.styling],
      'TableComponent.getCellStyle'
    );

    // Memoized position checkers to prevent unnecessary re-renders
    const isActiveCellPosition = useOptimizedCallback(
      (row: number, col: number) => {
        return activeCell?.row === row && activeCell?.col === col;
      },
      [activeCell],
      'TableComponent.isActiveCellPosition'
    );

    const isEditingCellPosition = useOptimizedCallback(
      (row: number, col: number) => {
        return editingCell?.row === row && editingCell?.col === col;
      },
      [editingCell],
      'TableComponent.isEditingCellPosition'
    );

    // Simplified current cell position getter
    const getCurrentCellPosition = useCallback((): { row: number; col: number } | null => {
      return activeCell;
    }, [activeCell]);

    // Create component methods object for command integration
    const componentMethods: TableComponentMethods = useOptimizedMemo(
      () => ({
        addColumn,
        removeColumn,
        addRow,
        removeRow,
        updateTableData,
        getCurrentCellPosition,
      }),
      [addColumn, removeColumn, addRow, removeRow, updateTableData, getCurrentCellPosition],
      'TableComponent.componentMethods'
    );

    // Register component with command registry (memory-optimized cleanup)
    useEffect(() => {
      const tableId = node.attrs.tableId;
      if (tableId) {
        tableComponentRegistry.register(tableId, componentMethods);

        return () => {
          // Cleanup: Remove component from registry
          tableComponentRegistry.unregister(tableId);

          // Clear any cached cell references
          cellRefs.current.clear();

          // Reset local state to prevent memory leaks
          setActiveCell(null);
          setEditingCell(null);
          setEditValue('');
          setValidationErrors(null);
        };
      }
    }, [node.attrs.tableId, componentMethods]);

    // Memory leak prevention: Clear references on component unmount
    useEffect(() => {
      return () => {
        // Clear cell references map
        cellRefs.current.clear();

        // Report final memory usage and render analytics for debugging
        if (process.env.NODE_ENV === 'development') {
          const metrics = getMetrics();
          const memory = getCurrentMemory();
          const analytics = getAnalytics();
          const wastedRenders = getWastedRenderCount();

          console.log(
            `TableComponent cleanup - Renders: ${metrics?.renderCount}, Memory: ${memory.toFixed(2)}MB, Wasted: ${wastedRenders}`
          );
          if (analytics && analytics.averageRenderTime > 10) {
            console.warn(
              `⚠️ TableComponent had slow renders: ${analytics.averageRenderTime.toFixed(2)}ms avg`
            );
          }
        }
      };
    }, [getMetrics, getCurrentMemory, getAnalytics, getWastedRenderCount]);

    // No state synchronization needed - TipTap node.attrs is single source of truth

    return (
      <NodeViewWrapper className="table-wrapper">
        <div
          className={cn(
            'relative border rounded-lg overflow-hidden',
            selected ? 'ring-2 ring-blue-500 ring-offset-2' : '',
            'bg-white'
          )}
        >
          {/* Table Header with Controls */}
          {selected && (
            <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Grid size={12} />
                  Table
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {tableData.rows.length} × {tableData.headers.length}
                </span>
                {validationErrors?.errors.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {validationErrors.errors.length} error
                    {validationErrors.errors.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {validationErrors?.warnings.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {validationErrors.warnings.length} warning
                    {validationErrors.warnings.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addRow}
                  className="h-7 px-2"
                  title="Add row"
                >
                  <Plus size={12} className="mr-1" />
                  Row
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={addColumn}
                  className="h-7 px-2"
                  title="Add column"
                >
                  <Plus size={12} className="mr-1" />
                  Column
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                      <MoreVertical size={12} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Settings size={12} className="mr-2" />
                      Table Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={deleteNode} className="text-destructive">
                      <Trash2 size={12} className="mr-2" />
                      Delete Table
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Table Content */}
          <div className="overflow-auto max-h-96">
            <table className="w-full border-collapse">
              {/* Headers */}
              {tableData.settings.showHeaders && (
                <thead>
                  <tr>
                    {tableData.headers.map((header, colIndex) => (
                      <th
                        key={`header-${colIndex}`}
                        className={cn(
                          'relative group cursor-pointer',
                          isActiveCellPosition(-1, colIndex) && 'bg-blue-50'
                        )}
                        style={getCellStyle(true)}
                        onClick={() => setActiveCell({ row: -1, col: colIndex })}
                        onDoubleClick={() => startEditing(-1, colIndex)}
                        onKeyDown={e => handleKeyDown(e, -1, colIndex)}
                        tabIndex={0}
                      >
                        {isEditingCellPosition(-1, colIndex) ? (
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                            onKeyDown={e => handleKeyDown(e, -1, colIndex)}
                            className="border-0 p-0 m-0 bg-transparent focus:ring-0"
                            autoFocus
                          />
                        ) : (
                          <span>{header}</span>
                        )}

                        {/* Column controls */}
                        {selected && isActiveCellPosition(-1, colIndex) && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1 bg-white border rounded shadow-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={e => {
                                  e.stopPropagation();
                                  removeColumn(colIndex);
                                }}
                                className="h-6 w-6 p-0 text-red-500"
                                title="Remove column"
                              >
                                <Minus size={10} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}

              {/* Body */}
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr
                    key={`row-${rowIndex}`}
                    className={cn(tableData.styling.striped && rowIndex % 2 === 1 && 'bg-muted/30')}
                  >
                    {row.map((cell, colIndex) => (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={cn(
                          'relative group cursor-pointer',
                          isActiveCellPosition(rowIndex, colIndex) && 'bg-blue-50'
                        )}
                        style={getCellStyle(false)}
                        onClick={() => setActiveCell({ row: rowIndex, col: colIndex })}
                        onDoubleClick={() => startEditing(rowIndex, colIndex)}
                        onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
                        tabIndex={0}
                      >
                        {isEditingCellPosition(rowIndex, colIndex) ? (
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                            onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
                            className="border-0 p-0 m-0 bg-transparent focus:ring-0"
                            autoFocus
                          />
                        ) : (
                          <span>{cell || ''}</span>
                        )}

                        {/* Row controls */}
                        {selected && isActiveCellPosition(rowIndex, colIndex) && colIndex === 0 && (
                          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col gap-1 bg-white border rounded shadow-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={e => {
                                  e.stopPropagation();
                                  removeRow(rowIndex);
                                }}
                                className="h-6 w-6 p-0 text-red-500"
                                title="Remove row"
                              >
                                <Minus size={10} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {tableData.rows.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Grid size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click to start editing this table</p>
            </div>
          )}

          {/* Selection Indicator */}
          {selected && (
            <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
              Table Selected
            </div>
          )}
        </div>
      </NodeViewWrapper>
    );
  },
  tablePropsComparison
);

TableComponentInner.displayName = 'TableComponentInner';

// Export wrapped in error boundary
export const TableComponent: React.FC<TableComponentProps> = props => (
  <TableErrorBoundary>
    <TableComponentInner {...props} />
  </TableErrorBoundary>
);
