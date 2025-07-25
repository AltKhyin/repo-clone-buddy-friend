// ABOUTME: Floating toolbar for table operations and styling controls

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus,
  Minus,
  MoreVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid,
  Download,
  Upload,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { TableData } from './TableExtension';

interface TableToolbarProps {
  tableData: TableData;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onAddColumn: () => void;
  onRemoveColumn: (index: number) => void;
  onDeleteTable: () => void;
  onUpdateStyling: (styling: Partial<TableData['styling']>) => void;
  onUpdateSettings: (settings: Partial<TableData['settings']>) => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  onSortColumn: (columnIndex: number, direction: 'asc' | 'desc') => void;
  activeCell?: { row: number; col: number } | null;
  className?: string;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  tableData,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onDeleteTable,
  onUpdateStyling,
  onUpdateSettings,
  onExportCSV,
  onImportCSV,
  onSortColumn,
  activeCell,
  className = '',
}) => {
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      onImportCSV(file);
    }
  };

  return (
    <TooltipProvider>
      <div
        className={`flex items-center gap-2 p-2 bg-white border rounded-lg shadow-lg ${className}`}
      >
        {/* Structure Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onAddRow} className="h-8 px-2">
                <Plus size={12} className="mr-1" />
                Row
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add row</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onAddColumn} className="h-8 px-2">
                <Plus size={12} className="mr-1" />
                Col
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add column</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Active Cell Controls */}
        {activeCell && (
          <>
            <div className="flex items-center gap-1">
              {activeCell.row >= 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveRow(activeCell.row)}
                      disabled={tableData.rows.length <= 1}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      <Minus size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove this row</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveColumn(activeCell.col)}
                    disabled={tableData.headers.length <= 1}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Minus size={12} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove this column</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Alignment Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={tableData.styling.textAlign === 'left' ? 'default' : 'outline'}
                onClick={() => onUpdateStyling({ textAlign: 'left' })}
                className="h-8 w-8 p-0"
              >
                <AlignLeft size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={tableData.styling.textAlign === 'center' ? 'default' : 'outline'}
                onClick={() => onUpdateStyling({ textAlign: 'center' })}
                className="h-8 w-8 p-0"
              >
                <AlignCenter size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={tableData.styling.textAlign === 'right' ? 'default' : 'outline'}
                onClick={() => onUpdateStyling({ textAlign: 'right' })}
                className="h-8 w-8 p-0"
              >
                <AlignRight size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align right</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Sorting Controls */}
        {activeCell && activeCell.row === -1 && (
          <>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSortColumn(activeCell.col, 'asc')}
                    className="h-8 w-8 p-0"
                  >
                    <SortAsc size={12} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sort ascending</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSortColumn(activeCell.col, 'desc')}
                    className="h-8 w-8 p-0"
                  >
                    <SortDesc size={12} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sort descending</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Style & Settings Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Palette size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuLabel>Table Style</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuCheckboxItem
              checked={tableData.styling.striped}
              onCheckedChange={checked => onUpdateStyling({ striped: checked })}
            >
              Striped rows
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={tableData.styling.compact}
              onCheckedChange={checked => onUpdateStyling({ compact: checked })}
            >
              Compact layout
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={tableData.settings.showHeaders}
              onCheckedChange={checked => onUpdateSettings({ showHeaders: checked })}
            >
              Show headers
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onUpdateStyling({ borderStyle: 'none' })}>
              No borders
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onUpdateStyling({ borderStyle: 'solid' })}>
              Solid borders
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onUpdateStyling({ borderStyle: 'dashed' })}>
              Dashed borders
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Import/Export Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <MoreVertical size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Table Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onExportCSV}>
              <Download size={12} className="mr-2" />
              Export as CSV
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <label className="flex items-center cursor-pointer">
                <Upload size={12} className="mr-2" />
                Import CSV
                <input type="file" accept=".csv" onChange={handleFileImport} className="hidden" />
              </label>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <Settings size={12} className="mr-2" />
              Table Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onDeleteTable} className="text-destructive">
              <Trash2 size={12} className="mr-2" />
              Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};
