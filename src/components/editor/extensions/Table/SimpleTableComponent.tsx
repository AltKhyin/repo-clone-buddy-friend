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
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UnifiedColorPicker } from '../../shared/UnifiedColorPicker';
import { Plus, Minus, MoreVertical, Trash2, Settings, Palette, Grid, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableData, HeaderLayout } from './TableExtension';
import { tableComponentRegistry, TableComponentMethods } from './tableCommands';
import { RichTableCell, RichTableCellRef } from './RichTableCell';
import { useColorTokens } from '@/hooks/useColorTokens';
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
import { 
  migrateTableData,
  ensureTableDataIntegrity,
  generateRowHeaders,
  updateHeaderLayout
} from './tableMigration';

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
  // Theme-aware color management
  const { resolveColor, isDarkMode } = useColorTokens();

  // Rich cell state management
  const [focusedCell, setFocusedCell] = useState<FocusedCell | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
  const cellRefs = useRef<Map<string, React.RefObject<RichTableCellRef>>>(new Map());

  // Extract and migrate table data from TipTap node
  const rawTableData = {
    headers: node.attrs.headers || ['Column 1', 'Column 2', 'Column 3'],
    rowHeaders: node.attrs.rowHeaders || [],
    headerLayout: node.attrs.headerLayout || 'column-only',
    rows: node.attrs.rows || [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    styling: {
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      gridLineColor: '#e2e8f0',
      backgroundColor: 'transparent',
      headerBackgroundColor: '#f8fafc',
      alternatingRowColor: '#f8fafc',
      enableAlternatingRows: false,
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

  // Migrate and ensure table data integrity
  const migratedData = migrateTableData(rawTableData);
  const tableData: TableData = sanitizeTableData(ensureRichTableData(ensureTableDataIntegrity(migratedData)));

  // Theme-aware color calculation for subtle alternating rows
  const getThemeAwareAlternatingColor = useCallback(() => {
    // Use theme tokens for subtle alternating colors instead of hardcoded values
    if (isDarkMode) {
      // In dark mode, use a very subtle lighter variation of the background
      return 'hsl(var(--muted) / 0.3)'; // Subtle light accent
    } else {
      // In light mode, use a very subtle darker variation of the background  
      return 'hsl(var(--muted) / 0.5)'; // Subtle dark accent
    }
  }, [isDarkMode]);

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
      const newRowHeaders = tableData.rowHeaders.filter((_, i) => i !== rowIndex);

      updateAttributes({
        ...node.attrs,
        rows: newRows,
        rowHeaders: newRowHeaders,
        isRichContent: true,
      });
    },
    [tableData, updateAttributes, node.attrs]
  );

  // Update header layout
  const updateHeaderLayoutHandler = useCallback((newLayout: HeaderLayout) => {
    const updates = updateHeaderLayout(tableData, newLayout);
    
    updateAttributes({
      ...node.attrs,
      ...updates,
    });
  }, [tableData, updateAttributes, node.attrs]);

  // Update table styling
  const updateStyling = useCallback((styleUpdates: Partial<TableData['styling']>) => {
    updateAttributes({
      ...node.attrs,
      styling: {
        ...tableData.styling,
        ...styleUpdates,
      },
    });
  }, [tableData.styling, updateAttributes, node.attrs]);

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
        'group relative transition-all duration-200',
        // Removed rounded-md and ring-offset to reduce visual spacing
        selected && 'ring-1 ring-primary shadow-sm'
      )}
    >
      {/* Enhanced floating controls (shown when selected) */}
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
          
          {/* Header Layout Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                <Table2 className="h-3 w-3 mr-1" />
                Layout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Header Layout</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => updateHeaderLayoutHandler('column-only')}>
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-2 rounded-full bg-primary" 
                       style={{ opacity: tableData.headerLayout === 'column-only' ? 1 : 0.3 }} />
                  Column Headers Only
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateHeaderLayoutHandler('row-only')}>
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-2 rounded-full bg-primary" 
                       style={{ opacity: tableData.headerLayout === 'row-only' ? 1 : 0.3 }} />
                  Row Headers Only
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateHeaderLayoutHandler('both')}>
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-2 rounded-full bg-primary" 
                       style={{ opacity: tableData.headerLayout === 'both' ? 1 : 0.3 }} />
                  Both Headers
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateHeaderLayoutHandler('none')}>
                <div className="flex items-center">
                  <div className="w-2 h-2 mr-2 rounded-full bg-primary" 
                       style={{ opacity: tableData.headerLayout === 'none' ? 1 : 0.3 }} />
                  No Headers
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Styling Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                <Palette className="h-3 w-3 mr-1" />
                Style
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Table Styling</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Background Color */}
              <div className="p-2 space-y-2">
                <Label className="text-xs">Background Color</Label>
                <UnifiedColorPicker
                  value={tableData.styling.backgroundColor}
                  onColorSelect={(color) => updateStyling({ backgroundColor: color })}
                  mode="both"
                  variant="input"
                  size="sm"
                  label="Background"
                  allowClear={true}
                  placeholder="transparent"
                />
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Grid Line Color */}
              <div className="p-2 space-y-2">
                <Label className="text-xs">Grid Line Color</Label>
                <UnifiedColorPicker
                  value={tableData.styling.gridLineColor}
                  onColorSelect={(color) => updateStyling({ gridLineColor: color })}
                  mode="both"
                  variant="input"
                  size="sm"
                  label="Grid Lines"
                  allowClear={false}
                  placeholder="#e2e8f0"
                />
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Header Background Color */}
              <div className="p-2 space-y-2">
                <Label className="text-xs">Header Background</Label>
                <UnifiedColorPicker
                  value={tableData.styling.headerBackgroundColor}
                  onColorSelect={(color) => updateStyling({ headerBackgroundColor: color })}
                  mode="both"
                  variant="input"
                  size="sm"
                  label="Headers"
                  allowClear={false}
                  placeholder="#f8fafc"
                />
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Alternating Rows */}
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Alternating Rows</Label>
                  <Switch
                    checked={tableData.styling.enableAlternatingRows}
                    onCheckedChange={(checked) => updateStyling({ enableAlternatingRows: checked })}
                  />
                </div>
                {tableData.styling.enableAlternatingRows && (
                  <UnifiedColorPicker
                    value={tableData.styling.alternatingRowColor}
                    onColorSelect={(color) => updateStyling({ alternatingRowColor: color })}
                    mode="both"
                    variant="input"
                    size="sm"
                    label="Alternating Color"
                    allowClear={false}
                    placeholder="#f8fafc"
                  />
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Enhanced Table with Header Layout Support */}
      <div className="overflow-x-auto relative m-0 p-0">
        <table
          className="w-full border-collapse m-0 p-0"
          style={{
            backgroundColor: tableData.styling.backgroundColor,
            border: `${tableData.styling.borderWidth}px ${tableData.styling.borderStyle} ${tableData.styling.gridLineColor}`,
            margin: 0,
            padding: 0,
          }}
        >
          {/* Column Headers */}
          {(tableData.headerLayout === 'column-only' || tableData.headerLayout === 'both') && (
            <thead>
              <tr>
                {/* Empty cell for row header column if both headers are shown */}
                {(tableData.headerLayout === 'both') && (
                  <th
                    style={{
                      padding: `${tableData.styling.cellPadding}px`,
                      border: `1px solid ${tableData.styling.gridLineColor}`,
                      backgroundColor: tableData.styling.headerBackgroundColor,
                      textAlign: tableData.styling.textAlign,
                      fontSize: `${tableData.styling.fontSize}px`,
                      fontWeight: tableData.styling.fontWeight,
                    }}
                  />
                )}
                {tableData.headers.map((header, colIndex) => 
                  renderRichCell(header, -1, colIndex, true)
                )}
              </tr>
            </thead>
          )}

          {/* Rows */}
          <tbody>
            {tableData.rows.map((row, rowIndex) => {
              const isAlternatingRow = tableData.styling.enableAlternatingRows && rowIndex % 2 === 1;
              const rowBackgroundColor = isAlternatingRow ? getThemeAwareAlternatingColor() : 'transparent';
              
              return (
                <tr key={rowIndex} className="group/row" style={{ backgroundColor: rowBackgroundColor }}>
                  {/* Row Header - Now interactive like column headers */}
                  {(tableData.headerLayout === 'row-only' || tableData.headerLayout === 'both') && 
                    renderRichCell(
                      tableData.rowHeaders[rowIndex] || `Row ${rowIndex + 1}`, 
                      rowIndex, 
                      -1, // Special column index for row headers
                      true // isHeader = true for proper styling and behavior
                    )
                  }
                  
                  {/* Data Cells */}
                  {row.map((cell, colIndex) => (
                    renderRichCell(cell, rowIndex, colIndex, false)
                  ))}

                  {/* Row controls moved outside table structure - overlaid on hover */}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Row controls overlay - positioned outside table structure */}
        {selected && (
          <div className="absolute right-0 top-0 h-full pointer-events-none z-10">
            {tableData.rows.map((_, rowIndex) => {
              // Calculate approximate row position based on header and row height
              const headerOffset = (tableData.headerLayout === 'column-only' || tableData.headerLayout === 'both') ? 1 : 0;
              const rowHeight = 40; // Approximate row height
              const topOffset = (headerOffset + rowIndex) * rowHeight;
              
              return (
                <div
                  key={`row-controls-${rowIndex}`}
                  className="absolute right-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
                  style={{ top: `${topOffset + 8}px` }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 bg-white shadow-sm">
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
              );
            })}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
});

SimpleTableComponent.displayName = 'SimpleTableComponent';
