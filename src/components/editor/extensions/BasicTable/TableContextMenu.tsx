// ABOUTME: Context menu for basic table operations with Reddit-style menu items

import React from 'react';
import { cn } from '@/lib/utils';
import { useEditorTheme } from '@/hooks/useEditorTheme';
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
  tableElement,
  onAction,
  onClose
}) => {
  const { colors } = useEditorTheme();
  const { row, col } = selectedCell;
  const isHeaderRow = row === -1;

  // Calculate intelligent positioning
  const getOptimalPosition = () => {
    if (!tableElement) {
      return position; // Fallback to cursor position
    }

    const tableRect = tableElement.getBoundingClientRect();
    const menuWidth = 192; // min-w-48 = 12rem = 192px
    const menuHeight = 300; // estimated max height
    const padding = 8;

    // Try to position menu to the right of the table
    let x = tableRect.right + padding;
    let y = position.y;

    // If menu would overflow right edge of viewport, position to left of table
    if (x + menuWidth > window.innerWidth) {
      x = tableRect.left - menuWidth - padding;
    }

    // If still overflowing left edge, use original cursor position but adjust
    if (x < 0) {
      x = Math.min(position.x, window.innerWidth - menuWidth - padding);
    }

    // Ensure menu doesn't overflow vertically
    if (y + menuHeight > window.innerHeight) {
      y = Math.max(padding, window.innerHeight - menuHeight - padding);
    }

    // Keep menu within table's vertical bounds if possible
    y = Math.max(tableRect.top, Math.min(y, tableRect.bottom - 100));

    return { x, y };
  };

  const optimalPosition = getOptimalPosition();

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
        className="absolute shadow-lg rounded-md py-1 min-w-48 pointer-events-auto"
        style={{ 
          left: optimalPosition.x, 
          top: optimalPosition.y,
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: colors.block.background,
          border: `1px solid ${colors.block.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <hr 
                key={index} 
                className="my-1" 
                style={{ borderColor: colors.block.border }} 
              />
            );
          }

          if (!item.enabled) {
            return null;
          }

          return (
            <button
              key={index}
              className="flex items-center w-full px-3 py-2 text-sm text-left transition-colors"
              style={{
                color: item.danger ? colors.interactive.error : colors.block.text,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.danger 
                  ? colors.interactive.error + '10' // 10% opacity
                  : colors.block.backgroundSecondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
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