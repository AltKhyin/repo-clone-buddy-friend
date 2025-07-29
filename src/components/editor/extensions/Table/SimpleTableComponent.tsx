// ABOUTME: Simplified Reddit-style table component using TipTap best practices - no complex selection system

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, Minus, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableData } from './TableExtension';
import { tableComponentRegistry, TableComponentMethods } from './tableCommands';

interface SimpleTableComponentProps extends NodeViewProps {
  // Inherited: node, updateAttributes, deleteNode, selected
}

interface CellPosition {
  row: number;
  col: number;
}

const TABLE_LIMITS = {
  MIN_ROWS: 1,
  MAX_ROWS: 50,
  MIN_COLUMNS: 1,
  MAX_COLUMNS: 20,
};

export const SimpleTableComponent: React.FC<SimpleTableComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  // Simple local editing state - no complex coordination needed
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract table data from TipTap node
  const tableData: TableData = {
    headers: node.attrs.headers || ['Column 1', 'Column 2', 'Column 3'],
    rows: node.attrs.rows || [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
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

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Extract table ID for registry
  const tableId = node.attrs.tableId || `table-${Date.now()}`;

  // Start editing a cell (Reddit-style single-click)
  const handleCellClick = useCallback((row: number, col: number, currentValue: string) => {
    setEditingCell({ row, col });
    setEditValue(currentValue);
  }, []);

  // Save cell edit
  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return;

    const { row, col } = editingCell;

    if (row === -1) {
      // Editing header
      const newHeaders = [...tableData.headers];
      newHeaders[col] = editValue;
      updateAttributes({
        ...node.attrs,
        headers: newHeaders,
      });
    } else {
      // Editing regular cell
      const newRows = [...tableData.rows];
      newRows[row] = [...newRows[row]];
      newRows[row][col] = editValue;
      updateAttributes({
        ...node.attrs,
        rows: newRows,
      });
    }

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, tableData, updateAttributes, node.attrs]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Enhanced keyboard shortcuts (Reddit-style navigation)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit();
        // TODO: Navigate to next cell (Reddit-style)
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSaveEdit();
        // TODO: Navigate to next cell with Tab
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  // Add column
  const addColumn = useCallback(() => {
    if (tableData.headers.length >= TABLE_LIMITS.MAX_COLUMNS) return;

    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map(row => [...row, '']);

    updateAttributes({
      ...node.attrs,
      headers: newHeaders,
      rows: newRows,
    });
  }, [tableData, updateAttributes, node.attrs]);

  // Remove column
  const removeColumn = useCallback(
    (colIndex: number) => {
      if (tableData.headers.length <= TABLE_LIMITS.MIN_COLUMNS) return;

      const newHeaders = tableData.headers.filter((_, i) => i !== colIndex);
      const newRows = tableData.rows.map(row => row.filter((_, i) => i !== colIndex));

      updateAttributes({
        ...node.attrs,
        headers: newHeaders,
        rows: newRows,
      });
    },
    [tableData, updateAttributes, node.attrs]
  );

  // Add row
  const addRow = useCallback(() => {
    if (tableData.rows.length >= TABLE_LIMITS.MAX_ROWS) return;

    const newRow = Array(tableData.headers.length).fill('');
    const newRows = [...tableData.rows, newRow];

    updateAttributes({
      ...node.attrs,
      rows: newRows,
    });
  }, [tableData, updateAttributes, node.attrs]);

  // Remove row
  const removeRow = useCallback(
    (rowIndex: number) => {
      if (tableData.rows.length <= TABLE_LIMITS.MIN_ROWS) return;

      const newRows = tableData.rows.filter((_, i) => i !== rowIndex);

      updateAttributes({
        ...node.attrs,
        rows: newRows,
      });
    },
    [tableData, updateAttributes, node.attrs]
  );

  // Register component with command system on mount and unregister on unmount
  useEffect(() => {
    const componentMethods: TableComponentMethods = {
      addColumn: () => addColumn(),
      removeColumn: (colIndex: number) => removeColumn(colIndex),
      addRow: () => addRow(),
      removeRow: (rowIndex: number) => removeRow(rowIndex),
      updateTableData: updates => {
        updateAttributes({
          ...node.attrs,
          ...updates,
        });
      },
      getCurrentCellPosition: () => editingCell,
    };

    tableComponentRegistry.register(tableId, componentMethods);

    return () => {
      tableComponentRegistry.unregister(tableId);
    };
  }, [
    tableId,
    addColumn,
    removeColumn,
    addRow,
    removeRow,
    updateAttributes,
    node.attrs,
    editingCell,
  ]);

  // Render cell content (either input or display)
  const renderCell = (content: string, row: number, col: number, isHeader = false) => {
    const isEditing = editingCell?.row === row && editingCell?.col === col;

    if (isEditing) {
      return (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveEdit}
          className="border-0 shadow-none p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-primary"
          style={{
            fontSize: `${tableData.styling.fontSize}px`,
            fontWeight: isHeader ? 600 : tableData.styling.fontWeight,
            textAlign: tableData.styling.textAlign,
            minWidth: '60px', // Ensure minimum editing width
          }}
          placeholder={isHeader ? 'Header name' : 'Enter text'}
        />
      );
    }

    return (
      <div
        className="cursor-pointer min-h-[1.5rem] w-full hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
        onClick={() => handleCellClick(row, col, content)}
        style={{
          fontSize: `${tableData.styling.fontSize}px`,
          fontWeight: isHeader ? 600 : tableData.styling.fontWeight,
          textAlign: tableData.styling.textAlign,
        }}
      >
        {content || (
          <span className="text-muted-foreground italic text-sm">
            {isHeader ? 'Header' : 'Empty'}
          </span>
        )}
      </div>
    );
  };

  return (
    <NodeViewWrapper
      className={cn(
        'group relative rounded-md transition-all duration-200',
        selected && 'ring-2 ring-primary ring-offset-2 shadow-lg'
      )}
    >
      {/* Reddit-style floating controls (shown when selected) */}
      {selected && (
        <div className="absolute -top-10 left-0 flex items-center gap-1 z-10 bg-background/95 backdrop-blur-sm border rounded-md px-2 py-1 shadow-md">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={addRow}
            disabled={tableData.rows.length >= TABLE_LIMITS.MAX_ROWS}
          >
            <Plus className="h-3 w-3 mr-1" />
            Row
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={addColumn}
            disabled={tableData.headers.length >= TABLE_LIMITS.MAX_COLUMNS}
          >
            <Plus className="h-3 w-3 mr-1" />
            Col
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={deleteNode}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Simple Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{
            backgroundColor: tableData.styling.backgroundColor,
            border: `${tableData.styling.borderWidth}px ${tableData.styling.borderStyle} ${tableData.styling.borderColor}`,
          }}
        >
          {/* Headers */}
          {tableData.settings.showHeaders && (
            <thead>
              <tr>
                {tableData.headers.map((header, colIndex) => (
                  <th
                    key={colIndex}
                    className="relative group/cell"
                    style={{
                      padding: `${tableData.styling.cellPadding}px`,
                      border: `1px solid ${tableData.styling.borderColor}`,
                      backgroundColor: tableData.styling.headerBackgroundColor,
                    }}
                  >
                    {renderCell(header, -1, colIndex, true)}

                    {/* Column controls (on hover) */}
                    {selected && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-5 w-5 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={addColumn}>
                              <Plus className="h-3 w-3 mr-2" />
                              Add Column
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => removeColumn(colIndex)}
                              disabled={tableData.headers.length <= TABLE_LIMITS.MIN_COLUMNS}
                              className="text-destructive"
                            >
                              <Minus className="h-3 w-3 mr-2" />
                              Remove Column
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Rows */}
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row">
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="relative group/cell"
                    style={{
                      padding: `${tableData.styling.cellPadding}px`,
                      border: `1px solid ${tableData.styling.borderColor}`,
                      backgroundColor:
                        tableData.styling.striped && rowIndex % 2 === 1 ? '#f9fafb' : 'transparent',
                    }}
                  >
                    {renderCell(cell, rowIndex, colIndex)}
                  </td>
                ))}

                {/* Row controls (on hover) */}
                {selected && (
                  <td className="w-8 border-none">
                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-5 w-5 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={addRow}>
                            <Plus className="h-3 w-3 mr-2" />
                            Add Row
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => removeRow(rowIndex)}
                            disabled={tableData.rows.length <= TABLE_LIMITS.MIN_ROWS}
                            className="text-destructive"
                          >
                            <Minus className="h-3 w-3 mr-2" />
                            Remove Row
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NodeViewWrapper>
  );
};
