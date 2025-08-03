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
import { RichTableCell, RichTableCellRef } from './RichTableCell';
import { 
  convertPlainTextToRichContent, 
  extractPlainTextFromRichContent,
  isValidRichContent 
} from './tableEditorConfig';
import { 
  ensureRichTableData,
  getCellContentAsRich,
  getCellContentAsString,
  updateCellContent,
  createRichCellData,
  sanitizeTableData 
} from './tableDataMigration';

interface SimpleTableComponentProps extends NodeViewProps {
  // Inherited: node, updateAttributes, deleteNode, selected
}

interface CellPosition {
  row: number;
  col: number;
}

interface FocusedCell {
  row: number;
  col: number;
  cellRef?: React.RefObject<RichTableCellRef>;
}

const TABLE_LIMITS = {
  MIN_ROWS: 1,
  MAX_ROWS: 50,
  MIN_COLUMNS: 1,
  MAX_COLUMNS: 20,
};

export const SimpleTableComponent = React.forwardRef<HTMLDivElement, SimpleTableComponentProps>(({
  node,
  updateAttributes,
  deleteNode,
  selected,
}, ref) => {
  // Rich cell state management
  const [focusedCell, setFocusedCell] = useState<FocusedCell | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
  const cellRefs = useRef<Map<string, React.RefObject<RichTableCellRef>>>(new Map());

  // Extract and migrate table data from TipTap node
  const rawTableData = {
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
    isRichContent: node.attrs.isRichContent,
  };

  // Ensure table data is in rich format and properly sanitized
  const tableData: TableData = sanitizeTableData(ensureRichTableData(rawTableData));

  // Get or create cell ref
  const getCellRef = useCallback((row: number, col: number): React.RefObject<RichTableCellRef> => {
    const cellKey = `${row}-${col}`;
    if (!cellRefs.current.has(cellKey)) {
      cellRefs.current.set(cellKey, React.createRef<RichTableCellRef>());
    }
    return cellRefs.current.get(cellKey)!;
  }, []);

  // Extract table ID for registry
  const tableId = node.attrs.tableId || `table-${Date.now()}`;

  // Handle cell focus
  const handleCellFocus = useCallback((row: number, col: number) => {
    const cellRef = getCellRef(row, col);
    setFocusedCell({ row, col, cellRef });
    setSelectedCells([{ row, col }]);
  }, [getCellRef]);

  // Handle content change for headers
  const handleHeaderChange = useCallback((col: number, newContent: string) => {
    const newHeaders = [...tableData.headers];
    // Convert rich content to plain text for headers (backward compatibility)
    newHeaders[col] = extractPlainTextFromRichContent(newContent);
    updateAttributes({
      ...node.attrs,
      headers: newHeaders,
    });
  }, [tableData.headers, updateAttributes, node.attrs]);

  // Handle content change for regular cells
  const handleCellChange = useCallback((row: number, col: number, newContent: string) => {
    const newRows = [...tableData.rows];
    newRows[row] = [...newRows[row]];
    
    // Update cell with rich content, preserving existing styling
    const currentCell = newRows[row][col];
    newRows[row][col] = updateCellContent(currentCell, newContent);
    
    updateAttributes({
      ...node.attrs,
      rows: newRows,
      isRichContent: true, // Mark as rich content
    });
  }, [tableData.rows, updateAttributes, node.attrs]);

  // Handle cell blur
  const handleCellBlur = useCallback(() => {
    setFocusedCell(null);
    setSelectedCells([]);
  }, []);

  // Handle cell navigation
  const handleCellNavigation = useCallback((row: number, col: number, direction: 'up' | 'down' | 'left' | 'right' | 'enter' | 'tab') => {
    let newRow = row;
    let newCol = col;

    switch (direction) {
      case 'up':
        newRow = Math.max(-1, row - 1); // -1 for headers
        break;
      case 'down':
        newRow = Math.min(tableData.rows.length - 1, row + 1);
        break;
      case 'left':
        newCol = Math.max(0, col - 1);
        break;
      case 'right':
      case 'tab':
        newCol = Math.min(tableData.headers.length - 1, col + 1);
        break;
      case 'enter':
        newRow = Math.min(tableData.rows.length - 1, row + 1);
        break;
    }

    // Focus the new cell
    if (newRow !== row || newCol !== col) {
      const targetCellRef = getCellRef(newRow, newCol);
      targetCellRef.current?.focus();
    }
  }, [tableData.rows.length, tableData.headers.length, getCellRef]);

  // Add column
  const addColumn = useCallback(() => {
    if (tableData.headers.length >= TABLE_LIMITS.MAX_COLUMNS) return;

    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map(row => [...row, createRichCellData('')]);

    updateAttributes({
      ...node.attrs,
      headers: newHeaders,
      rows: newRows,
      isRichContent: true,
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
        isRichContent: true,
      });
    },
    [tableData, updateAttributes, node.attrs]
  );

  // Add row
  const addRow = useCallback(() => {
    if (tableData.rows.length >= TABLE_LIMITS.MAX_ROWS) return;

    const newRow = Array(tableData.headers.length).fill(null).map(() => createRichCellData(''));
    const newRows = [...tableData.rows, newRow];

    updateAttributes({
      ...node.attrs,
      rows: newRows,
      isRichContent: true,
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
        isRichContent: true,
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
      getCurrentCellPosition: () => focusedCell ? { row: focusedCell.row, col: focusedCell.col } : null,
      getFocusedCellEditor: () => focusedCell?.cellRef?.current?.getEditor() || null,
      getFocusedCellTypographyCommands: () => focusedCell?.cellRef?.current?.getTypographyCommands() || null,
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
    focusedCell,
    handleCellNavigation,
  ]);

  // Render rich table cell
  const renderRichCell = (cellData: any, row: number, col: number, isHeader = false) => {
    const cellId = `${tableId}-${row}-${col}`;
    const cellRef = getCellRef(row, col);
    const isSelected = selectedCells.some(cell => cell.row === row && cell.col === col);
    const isFocused = focusedCell?.row === row && focusedCell?.col === col;

    // Get appropriate content format for headers vs cells
    const cellContent = isHeader 
      ? getCellContentAsString(cellData) // Headers remain plain text
      : getCellContentAsRich(cellData);   // Cells use rich content

    return (
      <RichTableCell
        key={cellId}
        ref={cellRef}
        content={cellContent}
        isHeader={isHeader}
        position={{ row, col }}
        styling={tableData.styling}
        isSelected={isSelected}
        isTableSelected={selected}
        cellId={cellId}
        onContentChange={(newContent) => {
          if (isHeader) {
            handleHeaderChange(col, newContent);
          } else {
            handleCellChange(row, col, newContent);
          }
        }}
        onFocus={() => handleCellFocus(row, col)}
        onBlur={handleCellBlur}
        onNavigate={(direction) => handleCellNavigation(row, col, direction)}
      />
    );
  };

  return (
    <NodeViewWrapper
      ref={ref}
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
                {tableData.headers.map((header, colIndex) => 
                  renderRichCell(header, -1, colIndex, true)
                )}
              </tr>
            </thead>
          )}

          {/* Rows */}
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row">
                {row.map((cell, colIndex) => (
                  renderRichCell(cell, rowIndex, colIndex, false)
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
});

SimpleTableComponent.displayName = 'SimpleTableComponent';
