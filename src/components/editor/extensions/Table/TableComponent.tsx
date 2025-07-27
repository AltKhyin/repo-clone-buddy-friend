// ABOUTME: Rebuilt TableComponent with unified selection system - eliminates performance crisis

import React, { useState, useCallback, useRef } from 'react';
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
import { Table, Plus, Minus, MoreVertical, Trash2, Settings, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableData } from './TableExtension';
import { useSelectionCoordination } from '@/hooks/useSelectionCoordination';
import { useToast } from '@/hooks/use-toast';

interface TableComponentProps extends NodeViewProps {
  // Inherited from NodeViewProps: node, updateAttributes, deleteNode, selected
}

const TABLE_LIMITS = {
  MIN_ROWS: 1,
  MAX_ROWS: 50,
  MIN_COLUMNS: 1,
  MAX_COLUMNS: 20,
};

export const TableComponent: React.FC<TableComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { toast } = useToast();
  const cellInputRef = useRef<HTMLInputElement>(null);

  // Generate unique table ID for coordination
  const tableId = node.attrs.tableId || `table-${Date.now()}`;

  // Unified selection coordination
  const { isActive, handleTableCellClick, isTableCellSelected, activeContentType } =
    useSelectionCoordination({
      blockId: `table-block-${tableId}`,
      componentType: 'table',
      enableContentSelection: true,
    });

  // Simple local state for editing
  const [editValue, setEditValue] = useState('');

  // Extract table data directly from TipTap node
  const tableData: TableData = {
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
  };

  // Initialize default table if empty
  React.useEffect(() => {
    if (!tableData.headers.length || !tableData.rows.length) {
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
        tableId,
      });
    }
  }, [node.attrs, updateAttributes, tableId, tableData.headers.length, tableData.rows.length]);

  // Safe update helper
  const updateTableData = useCallback(
    (updates: Partial<TableData>) => {
      try {
        updateAttributes({
          ...node.attrs,
          ...updates,
        });
      } catch (error) {
        toast({
          title: 'Update Failed',
          description: 'Failed to update table. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [node.attrs, updateAttributes, toast]
  );

  // Cell editing handlers
  const startEditingCell = useCallback(
    (row: number, col: number) => {
      const cellValue = row === -1 ? tableData.headers[col] : tableData.rows[row]?.[col];
      setEditValue(cellValue || '');

      // Coordinate with unified selection system
      handleTableCellClick(tableId, { row, col }, true);

      // Focus input after state update
      setTimeout(() => cellInputRef.current?.focus(), 0);
    },
    [tableData.headers, tableData.rows, handleTableCellClick, tableId]
  );

  const finishEditingCell = useCallback(
    (row: number, col: number) => {
      if (row === -1) {
        // Update header
        const newHeaders = [...tableData.headers];
        newHeaders[col] = editValue.trim();
        updateTableData({ headers: newHeaders });
      } else {
        // Update cell
        const newRows = [...tableData.rows];
        if (!newRows[row]) newRows[row] = [];
        newRows[row][col] = editValue.trim();
        updateTableData({ rows: newRows });
      }

      setEditValue('');
      handleTableCellClick(tableId, { row, col }, false); // Exit editing mode
    },
    [editValue, tableData.headers, tableData.rows, updateTableData, handleTableCellClick, tableId]
  );

  // Table structure modifications
  const addColumn = useCallback(() => {
    if (tableData.headers.length >= TABLE_LIMITS.MAX_COLUMNS) {
      toast({
        title: 'Cannot Add Column',
        description: `Maximum ${TABLE_LIMITS.MAX_COLUMNS} columns allowed`,
        variant: 'destructive',
      });
      return;
    }

    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map(row => [...row, '']);
    updateTableData({ headers: newHeaders, rows: newRows });
  }, [tableData.headers, tableData.rows, updateTableData, toast]);

  const removeColumn = useCallback(
    (colIndex: number) => {
      if (tableData.headers.length <= TABLE_LIMITS.MIN_COLUMNS) {
        toast({
          title: 'Cannot Remove Column',
          description: `Table must have at least ${TABLE_LIMITS.MIN_COLUMNS} column`,
          variant: 'destructive',
        });
        return;
      }

      const newHeaders = tableData.headers.filter((_, i) => i !== colIndex);
      const newRows = tableData.rows.map(row => row.filter((_, i) => i !== colIndex));
      updateTableData({ headers: newHeaders, rows: newRows });
    },
    [tableData.headers, tableData.rows, updateTableData, toast]
  );

  const addRow = useCallback(() => {
    if (tableData.rows.length >= TABLE_LIMITS.MAX_ROWS) {
      toast({
        title: 'Cannot Add Row',
        description: `Maximum ${TABLE_LIMITS.MAX_ROWS} rows allowed`,
        variant: 'destructive',
      });
      return;
    }

    const newRow = Array(tableData.headers.length).fill('');
    updateTableData({ rows: [...tableData.rows, newRow] });
  }, [tableData.headers.length, tableData.rows, updateTableData, toast]);

  const removeRow = useCallback(
    (rowIndex: number) => {
      if (tableData.rows.length <= TABLE_LIMITS.MIN_ROWS) {
        toast({
          title: 'Cannot Remove Row',
          description: `Table must have at least ${TABLE_LIMITS.MIN_ROWS} row`,
          variant: 'destructive',
        });
        return;
      }

      const newRows = tableData.rows.filter((_, i) => i !== rowIndex);
      updateTableData({ rows: newRows });
    },
    [tableData.rows, updateTableData, toast]
  );

  // Cell styling
  const getCellStyle = (isHeader = false) => ({
    padding: `${tableData.styling.cellPadding}px`,
    border: `${tableData.styling.borderWidth}px ${tableData.styling.borderStyle} ${tableData.styling.borderColor}`,
    backgroundColor: isHeader
      ? tableData.styling.headerBackgroundColor
      : tableData.styling.backgroundColor,
    textAlign: tableData.styling.textAlign,
    fontSize: `${tableData.styling.fontSize}px`,
    fontWeight: isHeader ? 600 : tableData.styling.fontWeight,
  });

  return (
    <NodeViewWrapper className="table-wrapper">
      <div
        className={cn(
          'relative border rounded-lg overflow-hidden',
          isActive ? 'ring-2 ring-blue-500 ring-offset-2' : '',
          'bg-white'
        )}
      >
        {/* Table Header with Controls */}
        {isActive && (
          <div className="flex items-center justify-between p-2 bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Grid size={12} />
                Table
              </Badge>
              <span className="text-xs text-muted-foreground">
                {tableData.rows.length} × {tableData.headers.length}
              </span>
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
                  {tableData.headers.map((header, colIndex) => {
                    const isSelected = isTableCellSelected(tableId, { row: -1, col: colIndex });
                    const isEditing = isSelected && activeContentType === 'table_cell';

                    return (
                      <th
                        key={`header-${colIndex}`}
                        className={cn('relative group cursor-pointer', isSelected && 'bg-blue-50')}
                        style={getCellStyle(true)}
                        onClick={() => {
                          if (isEditing) return;
                          handleTableCellClick(tableId, { row: -1, col: colIndex }, false);
                        }}
                        onDoubleClick={() => startEditingCell(-1, colIndex)}
                      >
                        {isEditing ? (
                          <Input
                            ref={cellInputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => finishEditingCell(-1, colIndex)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                finishEditingCell(-1, colIndex);
                              } else if (e.key === 'Escape') {
                                setEditValue('');
                                handleTableCellClick(tableId, { row: -1, col: colIndex }, false);
                              }
                            }}
                            className="border-0 p-0 m-0 bg-transparent focus:ring-0"
                          />
                        ) : (
                          <span>{header}</span>
                        )}

                        {/* Column controls */}
                        {isActive && isSelected && (
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
                    );
                  })}
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
                  {row.map((cell, colIndex) => {
                    const isSelected = isTableCellSelected(tableId, {
                      row: rowIndex,
                      col: colIndex,
                    });
                    const isEditing = isSelected && activeContentType === 'table_cell';

                    return (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={cn('relative group cursor-pointer', isSelected && 'bg-blue-50')}
                        style={getCellStyle(false)}
                        onClick={() => {
                          if (isEditing) return;
                          handleTableCellClick(tableId, { row: rowIndex, col: colIndex }, false);
                        }}
                        onDoubleClick={() => startEditingCell(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <Input
                            ref={cellInputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => finishEditingCell(rowIndex, colIndex)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                finishEditingCell(rowIndex, colIndex);
                              } else if (e.key === 'Escape') {
                                setEditValue('');
                                handleTableCellClick(
                                  tableId,
                                  { row: rowIndex, col: colIndex },
                                  false
                                );
                              }
                            }}
                            className="border-0 p-0 m-0 bg-transparent focus:ring-0"
                          />
                        ) : (
                          <span>{cell || ''}</span>
                        )}

                        {/* Row controls */}
                        {isActive && isSelected && colIndex === 0 && (
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
                    );
                  })}
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
        {isActive && (
          <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Table Selected
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
