// ABOUTME: Context menu for basic table operations with Reddit-style menu items

import React from 'react';
import { cn } from '@/lib/utils';
import { BasicTableData, CellPosition, TableAction, TableContextMenuProps } from './types';

/**
 * Simple Context Menu Component for BasicTable
 * Features:
 * - Insert/delete rows and columns
 * - Text alignment options (left/center/right)
 * - Delete entire table
 * - Context-aware menu items (disable invalid operations)
 * - Clean, accessible design
 */
export const TableContextMenu: React.FC<TableContextMenuProps> = ({
  position,
  selectedCell,
  tableData,
  onAction,
  onClose
}) => {
  const { row, col } = selectedCell;
  const isHeaderRow = row === -1;

  // Menu items based on context
  const menuItems = [
    { action: 'insertRowAbove' as TableAction, label: 'Insert row above', enabled: true },
    { action: 'insertRowBelow' as TableAction, label: 'Insert row below', enabled: true },
    { type: 'separator' },
    { action: 'insertColumnBefore' as TableAction, label: 'Insert column before', enabled: true },
    { action: 'insertColumnAfter' as TableAction, label: 'Insert column after', enabled: true },
    { type: 'separator' },
    { action: 'alignLeft' as TableAction, label: 'Align left', enabled: true },
    { action: 'alignCenter' as TableAction, label: 'Align center', enabled: true },
    { action: 'alignRight' as TableAction, label: 'Align right', enabled: true },
    { type: 'separator' },
    { action: 'deleteRow' as TableAction, label: 'Delete row', enabled: !isHeaderRow && tableData.rows.length > 1, danger: true },
    { action: 'deleteColumn' as TableAction, label: 'Delete column', enabled: tableData.headers.length > 1, danger: true },
    { type: 'separator' },
    { action: 'deleteTable' as TableAction, label: 'Delete table', enabled: true, danger: true }
  ];

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      <div
        className="absolute bg-white border border-gray-200 shadow-lg rounded-md py-1 min-w-48 pointer-events-auto"
        style={{ 
          left: position.x, 
          top: position.y,
          maxHeight: '300px',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return <hr key={index} className="my-1 border-gray-200" />;
          }

          if (!item.enabled) {
            return null;
          }

          return (
            <button
              key={index}
              className={cn(
                "flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors",
                item.danger && "text-red-600 hover:bg-red-50"
              )}
              onClick={() => {
                onAction(item.action!, selectedCell);
                onClose();
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableContextMenu;