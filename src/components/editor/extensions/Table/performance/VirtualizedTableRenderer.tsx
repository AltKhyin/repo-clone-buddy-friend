// ABOUTME: Virtualized table renderer for high-performance rendering of large tables

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { RichTableCell, RichTableCellRef } from '../RichTableCell';
import { TableData } from '../TableExtension';
import { getCellContentAsRich, getCellContentAsString } from '../tableDataMigration';

interface VirtualizedTableProps {
  tableData: TableData;
  onCellChange: (row: number, col: number, content: string) => void;
  onHeaderChange: (col: number, content: string) => void;
  onCellFocus: (row: number, col: number) => void;
  onCellBlur: () => void;
  onCellNavigation: (row: number, col: number, direction: string) => void;
  getCellRef: (row: number, col: number) => React.RefObject<RichTableCellRef>;
  selected: boolean;
  focusedCell: { row: number; col: number } | null;
  selectedCells: { row: number; col: number }[];
  tableId: string;
}

interface CellData {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
}

interface CellRendererProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    tableData: TableData;
    tableId: string;
    onCellChange: (row: number, col: number, content: string) => void;
    onHeaderChange: (col: number, content: string) => void;
    onCellFocus: (row: number, col: number) => void;
    onCellBlur: () => void;
    onCellNavigation: (row: number, col: number, direction: string) => void;
    getCellRef: (row: number, col: number) => React.RefObject<RichTableCellRef>;
    selected: boolean;
    focusedCell: { row: number; col: number } | null;
    selectedCells: { row: number; col: number }[];
  };
}

/**
 * Cell renderer for virtualized table
 */
const CellRenderer: React.FC<CellRendererProps> = React.memo(({ 
  columnIndex, 
  rowIndex, 
  style,
  data 
}) => {
  const {
    tableData,
    tableId,
    onCellChange,
    onHeaderChange,
    onCellFocus,
    onCellBlur,
    onCellNavigation,
    getCellRef,
    selected,
    focusedCell,
    selectedCells
  } = data;

  // Adjust row index for headers (-1 = header row)
  const actualRowIndex = rowIndex - 1;
  const isHeader = actualRowIndex === -1;
  
  // Get cell data
  const cellData = isHeader 
    ? tableData.headers[columnIndex]
    : tableData.rows[actualRowIndex]?.[columnIndex];

  if (!cellData && !isHeader) return null;

  const cellId = `${tableId}-${actualRowIndex}-${columnIndex}`;
  const cellRef = getCellRef(actualRowIndex, columnIndex);
  const isSelected = selectedCells.some(
    cell => cell.row === actualRowIndex && cell.col === columnIndex
  );
  const isFocused = focusedCell?.row === actualRowIndex && focusedCell?.col === columnIndex;

  // Get appropriate content format
  const cellContent = isHeader 
    ? getCellContentAsString(cellData)
    : getCellContentAsRich(cellData);

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <RichTableCell
        ref={cellRef}
        content={cellContent}
        isHeader={isHeader}
        position={{ row: actualRowIndex, col: columnIndex }}
        styling={tableData.styling}
        isSelected={isSelected}
        isTableSelected={selected}
        cellId={cellId}
        onContentChange={(newContent) => {
          if (isHeader) {
            onHeaderChange(columnIndex, newContent);
          } else {
            onCellChange(actualRowIndex, columnIndex, newContent);
          }
        }}
        onFocus={() => onCellFocus(actualRowIndex, columnIndex)}
        onBlur={onCellBlur}
        onNavigate={(direction) => onCellNavigation(actualRowIndex, columnIndex, direction)}
      />
    </div>
  );
});

CellRenderer.displayName = 'VirtualizedTableCellRenderer';

/**
 * Performance thresholds for virtualization
 */
const VIRTUALIZATION_THRESHOLDS = {
  MIN_ROWS: 20,
  MIN_COLS: 10,
  CELL_HEIGHT: 40,
  CELL_WIDTH: 150,
  OVERSCAN_COUNT: 5,
};

/**
 * Virtualized table renderer for high-performance large table handling
 */
export const VirtualizedTableRenderer: React.FC<VirtualizedTableProps> = ({
  tableData,
  onCellChange,
  onHeaderChange,
  onCellFocus,
  onCellBlur,
  onCellNavigation,
  getCellRef,
  selected,
  focusedCell,
  selectedCells,
  tableId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width || 800,
          height: Math.min(rect.height || 600, 600) // Max height for virtualization
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate grid dimensions
  const rowCount = (tableData.settings.showHeaders ? 1 : 0) + tableData.rows.length;
  const columnCount = tableData.headers.length;

  // Check if virtualization is beneficial
  const shouldVirtualize = useMemo(() => {
    return (
      rowCount >= VIRTUALIZATION_THRESHOLDS.MIN_ROWS ||
      columnCount >= VIRTUALIZATION_THRESHOLDS.MIN_COLS ||
      (rowCount * columnCount) > 100 // Total cell threshold
    );
  }, [rowCount, columnCount]);

  // Grid item data for react-window
  const itemData = useMemo(() => ({
    tableData,
    tableId,
    onCellChange,
    onHeaderChange,
    onCellFocus,
    onCellBlur,
    onCellNavigation,
    getCellRef,
    selected,
    focusedCell,
    selectedCells,
  }), [
    tableData,
    tableId,
    onCellChange,
    onHeaderChange,
    onCellFocus,
    onCellBlur,
    onCellNavigation,
    getCellRef,
    selected,
    focusedCell,
    selectedCells,
  ]);

  // Render non-virtualized table for smaller tables
  if (!shouldVirtualize) {
    return (
      <div ref={containerRef} className="w-full">
        <table className="w-full border-collapse">
          {/* Headers */}
          {tableData.settings.showHeaders && (
            <thead>
              <tr>
                {tableData.headers.map((header, colIndex) => {
                  const cellId = `${tableId}--1-${colIndex}`;
                  const cellRef = getCellRef(-1, colIndex);
                  const isSelected = selectedCells.some(
                    cell => cell.row === -1 && cell.col === colIndex
                  );
                  const isFocused = focusedCell?.row === -1 && focusedCell?.col === colIndex;

                  return (
                    <RichTableCell
                      key={cellId}
                      ref={cellRef}
                      content={getCellContentAsString(header)}
                      isHeader={true}
                      position={{ row: -1, col: colIndex }}
                      styling={tableData.styling}
                      isSelected={isSelected}
                      isTableSelected={selected}
                      cellId={cellId}
                      onContentChange={(newContent) => onHeaderChange(colIndex, newContent)}
                      onFocus={() => onCellFocus(-1, colIndex)}
                      onBlur={onCellBlur}
                      onNavigate={(direction) => onCellNavigation(-1, colIndex, direction)}
                    />
                  );
                })}
              </tr>
            </thead>
          )}

          {/* Rows */}
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  const cellId = `${tableId}-${rowIndex}-${colIndex}`;
                  const cellRef = getCellRef(rowIndex, colIndex);
                  const isSelected = selectedCells.some(
                    cellPos => cellPos.row === rowIndex && cellPos.col === colIndex
                  );
                  const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;

                  return (
                    <RichTableCell
                      key={cellId}
                      ref={cellRef}
                      content={getCellContentAsRich(cell)}
                      isHeader={false}
                      position={{ row: rowIndex, col: colIndex }}
                      styling={tableData.styling}
                      isSelected={isSelected}
                      isTableSelected={selected}
                      cellId={cellId}
                      onContentChange={(newContent) => onCellChange(rowIndex, colIndex, newContent)}
                      onFocus={() => onCellFocus(rowIndex, colIndex)}
                      onBlur={onCellBlur}
                      onNavigate={(direction) => onCellNavigation(rowIndex, colIndex, direction)}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Render virtualized table for large tables
  return (
    <div ref={containerRef} className="w-full h-full">
      <div className="text-sm text-muted-foreground mb-2">
        Virtualized Table ({rowCount} rows × {columnCount} columns)
      </div>
      
      <Grid
        columnCount={columnCount}
        columnWidth={VIRTUALIZATION_THRESHOLDS.CELL_WIDTH}
        height={containerSize.height}
        width={containerSize.width}
        rowCount={rowCount}
        rowHeight={VIRTUALIZATION_THRESHOLDS.CELL_HEIGHT}
        itemData={itemData}
        overscanCount={VIRTUALIZATION_THRESHOLDS.OVERSCAN_COUNT}
        style={{
          border: `${tableData.styling.borderWidth}px ${tableData.styling.borderStyle} ${tableData.styling.borderColor}`,
          backgroundColor: tableData.styling.backgroundColor,
        }}
      >
        {CellRenderer}
      </Grid>
      
      <div className="text-xs text-muted-foreground mt-2">
        Performance: Virtual scrolling enabled for optimal rendering
      </div>
    </div>
  );
};

export default VirtualizedTableRenderer;