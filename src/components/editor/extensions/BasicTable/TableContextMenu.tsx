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
  onAction,
  onClose
}) => {
  const { colors } = useEditorTheme();
  const { row, col } = selectedCell;
  const isHeaderRow = row === -1;

  // Simple cursor-based positioning with basic viewport boundary checking
  const getCursorBasedPosition = () => {
    const menuWidth = 192; // min-w-48 = 12rem = 192px
    const menuHeight = 300; // estimated max height
    const padding = 8;

    let x = position.x;
    let y = position.y;

    // Prevent horizontal overflow
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Prevent vertical overflow
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  };

  const menuPosition = getCursorBasedPosition();

  // Typography options with theme defaults
  const fontFamilyOptions = [
    { label: 'Default', value: undefined },
    { label: 'Sans Serif', value: 'system-ui, sans-serif' },
    { label: 'Serif', value: 'Georgia, serif' },
    { label: 'Monospace', value: 'Monaco, monospace' }
  ];

  const fontSizeOptions = [
    { label: 'Small', value: '14px' },
    { label: 'Normal', value: '16px' },
    { label: 'Large', value: '18px' },
    { label: 'Extra Large', value: '20px' }
  ];

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
    { type: 'typography-section' }, // Special typography section
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
          left: menuPosition.x, 
          top: menuPosition.y,
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

          if (item.type === 'typography-section') {
            return (
              <div key={index} className="px-3 py-2">
                {/* Font Family Dropdown */}
                <div className="mb-2">
                  <label 
                    htmlFor="table-font-family"
                    className="text-xs font-medium mb-1 block"
                    style={{ color: colors.block.textSecondary }}
                  >
                    Font Family
                  </label>
                  <select
                    id="table-font-family"
                    className="w-full px-2 py-1 text-sm border rounded"
                    style={{
                      backgroundColor: colors.block.background,
                      borderColor: colors.block.border,
                      color: colors.block.text
                    }}
                    value={tableData.fontFamily || ''}
                    onChange={(e) => {
                      const value = e.target.value || undefined;
                      onAction('setFontFamily', { ...selectedCell, value });
                      onClose();
                    }}
                  >
                    {fontFamilyOptions.map((option) => (
                      <option key={option.value || 'default'} value={option.value || ''}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size Dropdown */}
                <div>
                  <label 
                    htmlFor="table-font-size"
                    className="text-xs font-medium mb-1 block"
                    style={{ color: colors.block.textSecondary }}
                  >
                    Text Size
                  </label>
                  <select
                    id="table-font-size"
                    className="w-full px-2 py-1 text-sm border rounded"
                    style={{
                      backgroundColor: colors.block.background,
                      borderColor: colors.block.border,
                      color: colors.block.text
                    }}
                    value={tableData.fontSize || '16px'}
                    onChange={(e) => {
                      const value = e.target.value;
                      onAction('setFontSize', { ...selectedCell, value });
                      onClose();
                    }}
                  >
                    {fontSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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