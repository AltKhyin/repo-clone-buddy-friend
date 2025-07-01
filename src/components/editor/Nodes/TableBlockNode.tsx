// ABOUTME: React Flow node component for TableBlock with spreadsheet-like editing capabilities

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { TableBlockData } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import {
  Table,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnifiedNodeResizer } from '../components/UnifiedNodeResizer';
import {
  useUnifiedBlockStyling,
  getSelectionIndicatorProps,
  getThemeAwarePlaceholderClasses,
} from '../utils/blockStyling';
import {
  ThemedBlockWrapper,
  useThemedStyles,
  useThemedColors,
} from '@/components/editor/theme/ThemeIntegration';

interface TableBlockNodeData extends TableBlockData {
  // Additional display properties
  paddingX?: number;
  paddingY?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

export const TableBlockNode: React.FC<NodeProps<TableBlockNodeData>> = ({ id, data, selected }) => {
  const { updateNode, canvasTheme } = useEditorStore();
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    column: number;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Get theme-aware styles and colors
  const themedStyles = useThemedStyles('tableBlock');
  const themedColors = useThemedColors();

  // Get unified styling
  const { selectionClasses, borderStyles } = useUnifiedBlockStyling('tableBlock', selected, {
    borderWidth: data.borderWidth,
    borderColor: data.borderColor,
  });

  // Apply styling with theme awareness
  const paddingX = data.paddingX ?? 16;
  const paddingY = data.paddingY ?? 16;
  const backgroundColor = data.backgroundColor ?? 'transparent';
  const borderRadius = data.borderRadius ?? 8;

  const handleTableClick = () => {
    // Focus the node when table is clicked
    updateNode(id, {});
  };

  const updateTableData = (updates: Partial<TableBlockData>) => {
    updateNode(id, {
      data: { ...data, ...updates },
    });
  };

  // Utility function to ensure all rows have the same number of columns
  const normalizeTableGrid = (headers: string[], rows: string[][]) => {
    const targetColumnCount = headers.length;

    // Ensure all rows have exactly the same number of columns as headers
    const normalizedRows = rows.map(row => {
      const normalizedRow = [...row];

      // If row has fewer columns than headers, pad with empty strings
      while (normalizedRow.length < targetColumnCount) {
        normalizedRow.push('');
      }

      // If row has more columns than headers, truncate
      if (normalizedRow.length > targetColumnCount) {
        normalizedRow.splice(targetColumnCount);
      }

      return normalizedRow;
    });

    return normalizedRows;
  };

  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    if (rowIndex === -1) {
      // Editing header
      const newHeaders = [...data.headers];
      newHeaders[colIndex] = value;
      // Ensure all rows match the header count after header edit
      const normalizedRows = normalizeTableGrid(newHeaders, data.rows);
      updateTableData({ headers: newHeaders, rows: normalizedRows });
    } else {
      // Editing data cell
      const newRows = [...data.rows];

      // Ensure the row exists and has enough columns
      while (newRows.length <= rowIndex) {
        newRows.push(new Array(data.headers.length).fill(''));
      }
      while (newRows[rowIndex].length <= colIndex) {
        newRows[rowIndex].push('');
      }

      newRows[rowIndex][colIndex] = value;
      // Normalize to ensure grid consistency
      const normalizedRows = normalizeTableGrid(data.headers, newRows);
      updateTableData({ rows: normalizedRows });
    }
  };

  const addRow = () => {
    const newRow = new Array(data.headers.length).fill('');
    const normalizedRows = normalizeTableGrid(data.headers, [...data.rows, newRow]);
    updateTableData({ rows: normalizedRows });
  };

  const removeRow = (index: number) => {
    if (data.rows.length > 1) {
      const newRows = data.rows.filter((_, i) => i !== index);
      updateTableData({ rows: newRows });
    }
  };

  const addColumn = () => {
    const newHeaders = [...data.headers, `Column ${data.headers.length + 1}`];
    // Normalize all existing rows to ensure they have the right number of columns
    const normalizedRows = normalizeTableGrid(newHeaders, data.rows);
    updateTableData({ headers: newHeaders, rows: normalizedRows });
  };

  const removeColumn = (index: number) => {
    if (data.headers.length > 1) {
      const newHeaders = data.headers.filter((_, i) => i !== index);
      // Remove the column from all rows and normalize to ensure consistency
      const rowsWithColumnRemoved = data.rows.map(row => row.filter((_, i) => i !== index));
      const normalizedRows = normalizeTableGrid(newHeaders, rowsWithColumnRemoved);
      updateTableData({ headers: newHeaders, rows: normalizedRows });
    }
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < data.rows.length) {
      const newRows = [...data.rows];
      [newRows[index], newRows[newIndex]] = [newRows[newIndex], newRows[index]];
      updateTableData({ rows: newRows });
    }
  };

  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < data.headers.length) {
      const newHeaders = [...data.headers];
      [newHeaders[index], newHeaders[newIndex]] = [newHeaders[newIndex], newHeaders[index]];

      const swappedRows = data.rows.map(row => {
        const newRow = [...row];
        // Ensure the row has enough columns before swapping
        while (newRow.length < data.headers.length) {
          newRow.push('');
        }
        [newRow[index], newRow[newIndex]] = [newRow[newIndex] || '', newRow[index] || ''];
        return newRow;
      });

      // Normalize to ensure all rows have consistent column count
      const normalizedRows = normalizeTableGrid(newHeaders, swappedRows);
      updateTableData({ headers: newHeaders, rows: normalizedRows });
    }
  };

  const sortTable = (columnIndex: number) => {
    if (!data.sortable) return;

    const direction =
      sortConfig?.column === columnIndex && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ column: columnIndex, direction });

    const sortedRows = [...data.rows].sort((a, b) => {
      const aVal = a[columnIndex] || '';
      const bVal = b[columnIndex] || '';

      // Try to sort as numbers if possible
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Sort as strings
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    updateTableData({ rows: sortedRows });
  };

  const getCellBackgroundColor = (rowIndex: number) => {
    if (data.alternatingRowColors && rowIndex % 2 === 1) {
      return canvasTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50';
    }
    return '';
  };

  const getHeaderBackgroundColor = () => {
    const headerStyle = data.headerStyle;
    if (headerStyle?.backgroundColor) {
      return headerStyle.backgroundColor;
    }
    return canvasTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  };

  const getHeaderTextColor = () => {
    const headerStyle = data.headerStyle;
    if (headerStyle?.textColor) {
      return { color: headerStyle.textColor };
    }
    return {};
  };

  // Dynamic styles with unified border styling
  const dynamicStyles = {
    padding: `${paddingY}px ${paddingX}px`,
    backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
    ...borderStyles,
    borderRadius: `${borderRadius}px`,
    minWidth: '400px',
    maxWidth: '1000px',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties;

  const selectionIndicatorProps = getSelectionIndicatorProps('tableBlock');

  return (
    <>
      {/* Unified Node Resizer */}
      <UnifiedNodeResizer isVisible={selected} nodeType="tableBlock" />

      <ThemedBlockWrapper
        blockType="tableBlock"
        className={`relative cursor-pointer ${selectionClasses}`}
        style={{
          ...dynamicStyles,
          borderRadius: themedStyles.borderRadius || `${borderRadius}px`,
          backgroundColor: themedStyles.backgroundColor || dynamicStyles.backgroundColor,
          padding: themedStyles.padding || `${paddingY}px ${paddingX}px`,
        }}
        onClick={handleTableClick}
      >
        {/* Unified Selection indicator */}
        {selected && <div {...selectionIndicatorProps} />}
        {/* Connection handles */}
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />

        <div className="relative">
          {data.headers.length > 0 ? (
            <>
              {/* Table Actions (show on hover/selection) */}
              {selected && (
                <div className="absolute -top-12 left-0 flex items-center gap-2 bg-white dark:bg-gray-800 border rounded-lg p-2 shadow-lg z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addRow}
                    className="h-7 px-2 text-xs"
                    title="Add row"
                  >
                    <Plus size={12} className="mr-1" />
                    Row
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addColumn}
                    className="h-7 px-2 text-xs"
                    title="Add column"
                  >
                    <Plus size={12} className="mr-1" />
                    Column
                  </Button>
                </div>
              )}

              {/* Responsive Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  {/* Table Header */}
                  <thead>
                    <tr>
                      {data.headers.map((header, colIndex) => (
                        <th
                          key={colIndex}
                          className={`
                          relative border border-gray-300 dark:border-gray-600 p-3 text-left font-medium text-sm group
                          ${getHeaderBackgroundColor()}
                          ${data.sortable ? 'cursor-pointer hover:bg-opacity-80' : ''}
                        `}
                          style={getHeaderTextColor()}
                          onClick={() => data.sortable && sortTable(colIndex)}
                        >
                          {/* Column Controls (show on hover) */}
                          {selected && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border rounded p-1 shadow-lg">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={e => {
                                    e.stopPropagation();
                                    moveColumn(colIndex, 'left');
                                  }}
                                  disabled={colIndex === 0}
                                  className="h-6 w-6 p-0"
                                  title="Move left"
                                >
                                  <ChevronLeft size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={e => {
                                    e.stopPropagation();
                                    removeColumn(colIndex);
                                  }}
                                  disabled={data.headers.length <= 1}
                                  className="h-6 w-6 p-0 text-red-500"
                                  title="Remove column"
                                >
                                  <Minus size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={e => {
                                    e.stopPropagation();
                                    moveColumn(colIndex, 'right');
                                  }}
                                  disabled={colIndex === data.headers.length - 1}
                                  className="h-6 w-6 p-0"
                                  title="Move right"
                                >
                                  <ChevronRight size={12} />
                                </Button>
                              </div>
                            </div>
                          )}

                          {editingCell?.row === -1 && editingCell?.col === colIndex ? (
                            <Input
                              value={header}
                              onChange={e => handleCellEdit(-1, colIndex, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="text-sm border-0 p-0 bg-transparent"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="flex items-center justify-between cursor-text"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingCell({ row: -1, col: colIndex });
                              }}
                            >
                              <span>{header}</span>
                              {data.sortable && sortConfig?.column === colIndex && (
                                <span className="ml-2">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {data.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={`group ${getCellBackgroundColor(rowIndex)}`}>
                        {row.map((cell, colIndex) => (
                          <td
                            key={colIndex}
                            className={`
                            relative border border-gray-300 dark:border-gray-600 p-3 text-sm
                            ${canvasTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}
                          `}
                          >
                            {/* Row Controls (show on first column hover) */}
                            {selected && colIndex === 0 && (
                              <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 border rounded p-1 shadow-lg">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveRow(rowIndex, 'up')}
                                    disabled={rowIndex === 0}
                                    className="h-6 w-6 p-0"
                                    title="Move up"
                                  >
                                    <ChevronUp size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeRow(rowIndex)}
                                    disabled={data.rows.length <= 1}
                                    className="h-6 w-6 p-0 text-red-500"
                                    title="Remove row"
                                  >
                                    <Minus size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveRow(rowIndex, 'down')}
                                    disabled={rowIndex === data.rows.length - 1}
                                    className="h-6 w-6 p-0"
                                    title="Move down"
                                  >
                                    <ChevronDown size={12} />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                              <Input
                                value={cell}
                                onChange={e => handleCellEdit(rowIndex, colIndex, e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="text-sm border-0 p-0 bg-transparent"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-text min-h-[20px]"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingCell({ row: rowIndex, col: colIndex });
                                }}
                              >
                                {cell || (
                                  <span className={getThemeAwarePlaceholderClasses(canvasTheme)}>
                                    Click to edit
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Enhanced Empty State with Quick Start */
            <div
              className={`
              flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all hover:border-blue-300
              ${
                canvasTheme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100'
              }
            `}
              style={{
                minHeight: '200px',
                borderRadius: `${borderRadius}px`,
              }}
            >
              <Table size={48} className="mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">
                Create Your Table
              </h3>
              <p className="text-sm text-center mb-4 max-w-xs">
                Build data tables with sorting, editing, and customization features
              </p>

              {/* Quick Start Actions */}
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <Button
                  size="sm"
                  onClick={() => {
                    const defaultHeaders = ['Name', 'Value', 'Notes'];
                    const defaultRows = [
                      ['Item 1', '100', 'First row'],
                      ['Item 2', '200', 'Second row'],
                      ['Item 3', '300', 'Third row'],
                    ];
                    updateTableData({ headers: defaultHeaders, rows: defaultRows });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus size={14} className="mr-2" />
                  Start with Sample Data
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const emptyHeaders = ['Column 1', 'Column 2', 'Column 3'];
                    const emptyRows = [
                      ['', '', ''],
                      ['', '', ''],
                    ];
                    updateTableData({ headers: emptyHeaders, rows: emptyRows });
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Table size={14} className="mr-2" />
                  Create Empty Table (3x2)
                </Button>

                <div className="text-xs text-center text-muted-foreground mt-2">
                  💡 <strong>Pro tip:</strong> Click cells to edit, hover rows/columns for controls
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accessibility Label for Screen Readers */}
        <span className="sr-only">
          Table with {data.headers.length} columns and {data.rows.length} rows
        </span>
      </ThemedBlockWrapper>
    </>
  );
};
