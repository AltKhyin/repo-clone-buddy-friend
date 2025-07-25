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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableData } from './TableExtension';
import { tableComponentRegistry, TableComponentMethods } from './tableCommands';

interface TableComponentProps extends NodeViewProps {
  // Inherited from NodeViewProps: node, updateAttributes, deleteNode, selected
}

interface CellPosition {
  row: number;
  col: number;
}

export const TableComponent: React.FC<TableComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Extract table data from node attributes using useMemo to prevent re-renders
  const tableData: TableData = useMemo(
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
    [node.attrs.headers, node.attrs.rows, node.attrs.styling, node.attrs.settings]
  );

  // Initialize default table if empty
  useEffect(() => {
    if (!isInitialized && (!tableData.rows.length || !tableData.headers.length)) {
      const defaultHeaders = ['Column 1', 'Column 2', 'Column 3'];
      const defaultRows = [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ];

      updateAttributes({
        headers: defaultHeaders,
        rows: defaultRows,
        styling: tableData.styling,
        settings: tableData.settings,
      });
      setIsInitialized(true);
    }
  }, [isInitialized, tableData, updateAttributes]);

  // Update table data helper
  const updateTableData = useCallback(
    (updates: Partial<TableData>) => {
      updateAttributes({
        ...node.attrs,
        ...updates,
      });
    },
    [node.attrs, updateAttributes]
  );

  // Cell editing handlers
  const startEditing = useCallback(
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
    [tableData]
  );

  const finishEditing = useCallback(() => {
    if (!editingCell) return;

    const { row, col } = editingCell;

    if (row === -1) {
      // Update header
      const newHeaders = [...tableData.headers];
      newHeaders[col] = editValue;
      updateTableData({ headers: newHeaders });
    } else {
      // Update cell
      const newRows = [...tableData.rows];
      if (!newRows[row]) newRows[row] = [];
      newRows[row][col] = editValue;
      updateTableData({ rows: newRows });
    }

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, tableData, updateTableData]);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Table structure modification
  const addColumn = useCallback(() => {
    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map(row => [...row, '']);
    updateTableData({ headers: newHeaders, rows: newRows });
  }, [tableData, updateTableData]);

  const removeColumn = useCallback(
    (colIndex: number) => {
      if (tableData.headers.length <= 1) return; // Prevent removing last column

      const newHeaders = tableData.headers.filter((_, i) => i !== colIndex);
      const newRows = tableData.rows.map(row => row.filter((_, i) => i !== colIndex));
      updateTableData({ headers: newHeaders, rows: newRows });
    },
    [tableData, updateTableData]
  );

  const addRow = useCallback(() => {
    const newRow = Array(tableData.headers.length).fill('');
    const newRows = [...tableData.rows, newRow];
    updateTableData({ rows: newRows });
  }, [tableData, updateTableData]);

  const removeRow = useCallback(
    (rowIndex: number) => {
      if (tableData.rows.length <= 1) return; // Prevent removing last row

      const newRows = tableData.rows.filter((_, i) => i !== rowIndex);
      updateTableData({ rows: newRows });
    },
    [tableData, updateTableData]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
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
    [editingCell, finishEditing, cancelEditing, startEditing, tableData]
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

  const isActiveCellPosition = (row: number, col: number) => {
    return activeCell?.row === row && activeCell?.col === col;
  };

  const isEditingCellPosition = (row: number, col: number) => {
    return editingCell?.row === row && editingCell?.col === col;
  };

  // Get current cell position for command integration
  const getCurrentCellPosition = useCallback((): { row: number; col: number } | null => {
    return activeCell;
  }, [activeCell]);

  // Create component methods object for command integration
  const componentMethods: TableComponentMethods = useMemo(
    () => ({
      addColumn,
      removeColumn,
      addRow,
      removeRow,
      updateTableData,
      getCurrentCellPosition,
    }),
    [addColumn, removeColumn, addRow, removeRow, updateTableData, getCurrentCellPosition]
  );

  // Register component with command registry
  useEffect(() => {
    const tableId = node.attrs.tableId;
    if (tableId) {
      tableComponentRegistry.register(tableId, componentMethods);

      return () => {
        tableComponentRegistry.unregister(tableId);
      };
    }
  }, [node.attrs.tableId, componentMethods]);

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
};
