// ABOUTME: Inspector panel for TableBlock with comprehensive table management controls and command integration

import React, { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import { TableData } from '../extensions/Table/TableExtension';
import { tableComponentRegistry } from '../extensions/Table/tableCommands';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Plus,
  Minus,
  Table,
  Grid,
  Download,
  Upload,
  RotateCcw,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackgroundControls, SpacingControls, BorderControls } from './shared/UnifiedControls';
import { FONT_FAMILIES, FONT_WEIGHTS } from '../shared/typography-system';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TableBlockInspectorProps {
  nodeId: string;
}

export function TableBlockInspector({ nodeId }: TableBlockInspectorProps) {
  const { nodes, updateNode } = useEditorStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const node = nodes.find(n => n.id === nodeId);
  const data = node?.type === 'tableBlock' ? (node.data as TableData) : {};

  const updateData = useCallback(
    (updates: Partial<TableData>) => {
      if (node) {
        updateNode(nodeId, {
          data: { ...data, ...updates },
        });
      }
    },
    [updateNode, nodeId, data, node]
  );

  // Get table component methods from registry
  const getTableComponent = useCallback(() => {
    const tableId = data.tableId || nodeId;
    return tableComponentRegistry.get(tableId);
  }, [data.tableId, nodeId]);

  // Table structure operations
  const handleAddColumn = useCallback(() => {
    const component = getTableComponent();
    if (component) {
      component.addColumn();
      toast({
        title: 'Column Added',
        description: 'New column added to the table',
        duration: 2000,
      });
    }
  }, [getTableComponent, toast]);

  const handleRemoveColumn = useCallback(() => {
    const component = getTableComponent();
    if (component) {
      const currentPos = component.getCurrentCellPosition();
      if (currentPos) {
        component.removeColumn(currentPos.col);
        toast({
          title: 'Column Removed',
          description: 'Column removed from the table',
          duration: 2000,
        });
      }
    }
  }, [getTableComponent, toast]);

  const handleAddRow = useCallback(() => {
    const component = getTableComponent();
    if (component) {
      component.addRow();
      toast({
        title: 'Row Added',
        description: 'New row added to the table',
        duration: 2000,
      });
    }
  }, [getTableComponent, toast]);

  const handleRemoveRow = useCallback(() => {
    const component = getTableComponent();
    if (component) {
      const currentPos = component.getCurrentCellPosition();
      if (currentPos) {
        component.removeRow(currentPos.row);
        toast({
          title: 'Row Removed',
          description: 'Row removed from the table',
          duration: 2000,
        });
      }
    }
  }, [getTableComponent, toast]);

  // CSV Export/Import operations
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const headers = data.headers || [];
      const rows = data.rows || [];

      // Create CSV content
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table-${nodeId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'CSV Exported',
        description: 'Table data exported as CSV file',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export table data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [data.headers, data.rows, nodeId, toast]);

  const handleImportCSV = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length === 0) {
            throw new Error('Empty file');
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

          const component = getTableComponent();
          if (component) {
            component.updateTableData({ headers, rows });
            toast({
              title: 'CSV Imported',
              description: `Imported ${rows.length} rows and ${headers.length} columns`,
              duration: 2000,
            });
          }
        } catch (error) {
          toast({
            title: 'Import Failed',
            description: 'Failed to parse CSV file',
            variant: 'destructive',
          });
        } finally {
          setIsImporting(false);
          // Clear the input
          event.target.value = '';
        }
      };

      reader.readAsText(file);
    },
    [getTableComponent, toast]
  );

  // Reset table data
  const handleResetTable = useCallback(() => {
    const component = getTableComponent();
    if (component) {
      component.updateTableData({
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
      });
      toast({
        title: 'Table Reset',
        description: 'Table has been reset to default state',
        duration: 2000,
      });
    }
  }, [getTableComponent, toast]);

  if (!node || node.type !== 'tableBlock') return null;

  const tableStats = {
    rows: data.rows?.length || 0,
    columns: data.headers?.length || 0,
    cells: (data.rows?.length || 0) * (data.headers?.length || 0),
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Table Configuration</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <Table size={12} />
            {tableStats.rows} × {tableStats.columns}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure your table structure, styling, and data management
        </p>
      </div>

      <Separator />

      {/* Table Structure Controls */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Table Structure</h4>

        <div className="grid grid-cols-2 gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddColumn}
            className="flex items-center gap-2"
          >
            <Plus size={14} />
            Add Column
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoveColumn}
            className="flex items-center gap-2"
          >
            <Minus size={14} />
            Remove Column
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAddRow}
            className="flex items-center gap-2"
          >
            <Plus size={14} />
            Add Row
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoveRow}
            className="flex items-center gap-2"
          >
            <Minus size={14} />
            Remove Row
          </Button>
        </div>

        {/* Table Statistics */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rows:</span>
              <span className="font-medium">{tableStats.rows}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Columns:</span>
              <span className="font-medium">{tableStats.columns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Cells:</span>
              <span className="font-medium">{tableStats.cells}</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Data Management */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Data Management</h4>

        <div className="space-y-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="w-full flex items-center gap-2"
          >
            <Download size={14} />
            {isExporting ? 'Exporting...' : 'Export as CSV'}
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={isImporting}
              className="w-full flex items-center gap-2"
            >
              <Upload size={14} />
              {isImporting ? 'Importing...' : 'Import CSV'}
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResetTable}
            className="w-full flex items-center gap-2 text-orange-600 hover:text-orange-700"
          >
            <RotateCcw size={14} />
            Reset Table
          </Button>
        </div>
      </div>

      <Separator />

      {/* Table Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Table Settings</h4>

        <div className="space-y-4">
          {/* Show Headers Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-headers" className="text-sm">
              Show Headers
            </Label>
            <Switch
              id="show-headers"
              checked={data.settings?.showHeaders !== false}
              onCheckedChange={checked =>
                updateData({
                  settings: { ...data.settings, showHeaders: checked },
                })
              }
            />
          </div>

          {/* Resizable Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="resizable" className="text-sm">
              Resizable Columns
            </Label>
            <Switch
              id="resizable"
              checked={data.settings?.resizable !== false}
              onCheckedChange={checked =>
                updateData({
                  settings: { ...data.settings, resizable: checked },
                })
              }
            />
          </div>

          {/* Striped Rows Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="striped" className="text-sm">
              Striped Rows
            </Label>
            <Switch
              id="striped"
              checked={data.styling?.striped === true}
              onCheckedChange={checked =>
                updateData({
                  styling: { ...data.styling, striped: checked },
                })
              }
            />
          </div>

          {/* Compact Mode Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="compact" className="text-sm">
              Compact Mode
            </Label>
            <Switch
              id="compact"
              checked={data.styling?.compact === true}
              onCheckedChange={checked =>
                updateData({
                  styling: { ...data.styling, compact: checked },
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Styling Controls */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Table Styling</h4>

        <div className="space-y-4">
          {/* Text Alignment */}
          <div className="space-y-2">
            <Label className="text-sm">Text Alignment</Label>
            <div className="grid grid-cols-3 gap-1">
              <Button
                size="sm"
                variant={data.styling?.textAlign === 'left' ? 'default' : 'outline'}
                onClick={() =>
                  updateData({
                    styling: { ...data.styling, textAlign: 'left' },
                  })
                }
                className="flex items-center justify-center"
              >
                <AlignLeft size={14} />
              </Button>
              <Button
                size="sm"
                variant={data.styling?.textAlign === 'center' ? 'default' : 'outline'}
                onClick={() =>
                  updateData({
                    styling: { ...data.styling, textAlign: 'center' },
                  })
                }
                className="flex items-center justify-center"
              >
                <AlignCenter size={14} />
              </Button>
              <Button
                size="sm"
                variant={data.styling?.textAlign === 'right' ? 'default' : 'outline'}
                onClick={() =>
                  updateData({
                    styling: { ...data.styling, textAlign: 'right' },
                  })
                }
                className="flex items-center justify-center"
              >
                <AlignRight size={14} />
              </Button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-sm">Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[data.styling?.fontSize || 14]}
                onValueChange={([value]) =>
                  updateData({
                    styling: { ...data.styling, fontSize: value },
                  })
                }
                min={10}
                max={24}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {data.styling?.fontSize || 14}px
              </span>
            </div>
          </div>

          {/* Cell Padding */}
          <div className="space-y-2">
            <Label className="text-sm">Cell Padding</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[data.styling?.cellPadding || 12]}
                onValueChange={([value]) =>
                  updateData({
                    styling: { ...data.styling, cellPadding: value },
                  })
                }
                min={4}
                max={24}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {data.styling?.cellPadding || 12}px
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Border Controls */}
      <BorderControls data={data} onChange={updates => updateData(updates)} compact={false} />

      {/* Background Controls */}
      <BackgroundControls
        data={data}
        onChange={updates => updateData(updates)}
        enableImage={false}
        compact={false}
        colorKey="backgroundColor"
        defaultColor="transparent"
      />
    </div>
  );
}
