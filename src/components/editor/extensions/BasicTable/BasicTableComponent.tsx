// ABOUTME: Simple table component matching Reddit's structure with contentEditable cells

import React, { useState, useCallback, useRef } from 'react';
import { Node } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { BasicTableData, CellPosition, TableAction } from './types';
import { executeTableOperation, validateTableData } from './tableOperations';
import { TableContextMenu } from './TableContextMenu';
import { useSelectionActions } from '@/store/selectionStore';

interface BasicTableComponentProps {
  node: Node;
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
  editor?: any; // TipTap editor instance
  deleteNode?: () => void;
}

/**
 * Basic Table Component - Reddit-inspired simple table
 * Features:
 * - ContentEditable cells for direct editing
 * - Right-click context menu 
 * - Simple array-based data structure
 * - No rich content or complex formatting
 * - Essential operations only
 */
export const BasicTableComponent: React.FC<BasicTableComponentProps> = ({
  node,
  updateAttributes,
  selected,
  editor,
  deleteNode
}) => {
  const { tableData }: { tableData: BasicTableData } = node.attrs;
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedCell, setSelectedCell] = useState<CellPosition>({ row: -1, col: -1 });
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Selection integration with unified selection system
  const { dispatch } = useSelectionActions();

  // Validate table data
  const validation = validateTableData(tableData);
  if (!validation.isValid) {
    console.error('[BasicTable] Invalid table data:', validation.error);
    return (
      <div className="border border-red-300 bg-red-50 p-4 rounded">
        <p className="text-red-600 text-sm">Invalid table data: {validation.error}</p>
      </div>
    );
  }

  /**
   * Update cell content (header or data cell)
   */
  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    const isHeader = rowIndex === -1;
    const newData = { ...tableData };
    
    if (isHeader) {
      newData.headers[colIndex] = value.trim();
    } else {
      if (!newData.rows[rowIndex]) {
        console.error('[BasicTable] Invalid row index:', rowIndex);
        return;
      }
      newData.rows[rowIndex][colIndex] = value.trim();
    }
    
    updateAttributes({ tableData: newData });
  }, [tableData, updateAttributes]);

  /**
   * Handle context menu display
   */
  const handleContextMenu = useCallback((
    event: React.MouseEvent, 
    rowIndex: number, 
    colIndex: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSelectedCell({ row: rowIndex, col: colIndex });
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  }, []);

  /**
   * Handle table operations from context menu
   */
  const handleTableAction = useCallback((action: TableAction, position: CellPosition) => {
    if (action === 'deleteTable') {
      if (deleteNode) {
        deleteNode();
      } else if (editor) {
        // Fallback: try to delete via editor commands
        editor.commands.deleteSelection();
      }
      return;
    }

    const result = executeTableOperation(tableData, action, position);
    
    if (result.success && result.data) {
      updateAttributes({ tableData: result.data });
    } else {
      console.error('[BasicTable] Operation failed:', result.error);
    }
    
    setShowContextMenu(false);
  }, [tableData, updateAttributes, deleteNode, editor]);

  /**
   * Close context menu when clicking outside
   */
  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  /**
   * Handle cell focus - integrate with selection system
   */
  const handleCellFocus = useCallback((
    event: React.FocusEvent<HTMLTableCellElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    // Update local selected cell state
    setSelectedCell({ row: rowIndex, col: colIndex });
    
    // Integrate with unified selection system for table cell selections
    if (editor) {
      dispatch({
        type: 'SELECT_TABLE_CELL',
        cell: {
          editor: editor, // Pass editor instance for typography controls
          position: { row: rowIndex, col: colIndex },
          cellElement: event.currentTarget,
          tableId: tableData.id,
        }
      });
    }
  }, [dispatch, editor, tableData.id]);

  /**
   * Handle cell blur - update content and clear selection if needed
   */
  const handleCellBlur = useCallback((
    event: React.FocusEvent<HTMLTableCellElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const newContent = event.currentTarget.textContent || '';
    updateCell(rowIndex, colIndex, newContent);
    
    // Clear selection if no other table cell will be focused
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isStillInTable = activeElement && 
        (activeElement.closest('table') === tableRef.current);
      
      if (!isStillInTable) {
        dispatch({ type: 'CLEAR_SELECTION' });
      }
    }, 10); // Small delay to check if focus moved to another table cell
  }, [updateCell, dispatch]);

  /**
   * Handle key navigation in cells
   */
  const handleKeyDown = useCallback((
    event: React.KeyboardEvent<HTMLTableCellElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    // Simple navigation - let browser handle most of it
    if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
  }, []);

  // Render table with Reddit's exact structure wrapped in NodeViewWrapper
  return (
    <NodeViewWrapper className="basic-table-node-wrapper">
      <div 
        className={cn(
          "relative not-prose", // Prevent prose styling from interfering
          selected && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent editor selection conflicts
      >
        <table 
          ref={tableRef}
          className="table-fixed border-collapse w-full bg-transparent"
          data-type="basic-table"
        >
          {/* Header row */}
          <thead>
            <tr>
              {tableData.headers.map((header, colIndex) => (
                <th
                  key={`header-${colIndex}`}
                  className="px-sm py-xs leading-5 border border-solid border-neutral-border relative bg-transparent"
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={(e) => handleCellFocus(e, -1, colIndex)}
                  onBlur={(e) => handleCellBlur(e, -1, colIndex)}
                  onKeyDown={(e) => handleKeyDown(e, -1, colIndex)}
                  onContextMenu={(e) => handleContextMenu(e, -1, colIndex)}
                  data-row="-1"
                  data-col={colIndex}
                >
                  <p className="first:mt-0 last:mb-0 min-h-[1em]">
                    {header || <span className="text-gray-400">Header {colIndex + 1}</span>}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body rows */}
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="px-sm py-xs leading-5 border border-solid border-neutral-border relative bg-transparent"
                    contentEditable
                    suppressContentEditableWarning
                    onFocus={(e) => handleCellFocus(e, rowIndex, colIndex)}
                    onBlur={(e) => handleCellBlur(e, rowIndex, colIndex)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    onContextMenu={(e) => handleContextMenu(e, rowIndex, colIndex)}
                    data-row={rowIndex}
                    data-col={colIndex}
                  >
                    <p className="first:mt-0 last:mb-0 min-h-[1em]">
                      {cell || <span className="text-gray-400">&nbsp;</span>}
                    </p>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <TableContextMenu
          position={contextMenuPosition}
          selectedCell={selectedCell}
          tableData={tableData}
          onAction={handleTableAction}
          onClose={handleCloseContextMenu}
        />
      )}
    </NodeViewWrapper>
  );
};

export default BasicTableComponent;