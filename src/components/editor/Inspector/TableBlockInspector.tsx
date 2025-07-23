// ABOUTME: Inspector panel for TableBlock with structure management, typography controls, and unified styling

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEditorStore } from '@/store/editorStore';
import { 
  Table, 
  Plus, 
  Minus, 
  RotateCcw,
  Type,
  Palette,
  Move,
  Layers,
  Grid3X3
} from 'lucide-react';
import { TableBlockData } from '@/types/editor';
import { SpacingControls, BorderControls, BackgroundControls } from './shared/UnifiedControls';

interface TableBlockInspectorProps {
  nodeId: string;
}

export const TableBlockInspector: React.FC<TableBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'tableBlock') return null;

  const data = node.data as TableBlockData;
  
  // Safety check for data integrity
  if (!data || typeof data !== 'object') {
    return (
      <div className="p-4 text-center bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700 font-medium">TableBlock Inspector</p>
        <p className="text-red-600 text-sm">Invalid data structure detected</p>
      </div>
    );
  }
  
  // CRITICAL FIX: Additional safety check for required properties
  if (!data.htmlHeaders || !data.htmlRows || !Array.isArray(data.htmlHeaders) || !Array.isArray(data.htmlRows)) {
    return (
      <div className="p-4 text-center bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-700 font-medium">TableBlock Inspector</p>
        <p className="text-yellow-600 text-sm">Table structure initializing...</p>
        <button 
          onClick={() => {
            // Initialize with safe defaults
            updateTableData({
              htmlHeaders: ['<p>Column 1</p>', '<p>Column 2</p>'],
              htmlRows: [['<p></p>', '<p></p>']]
            });
          }}
          className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300"
        >
          Initialize Table
        </button>
      </div>
    );
  }

  const updateTableData = (updates: Partial<TableBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Table structure helpers with safe defaults and additional null checks
  const currentHeaders = Array.isArray(data.htmlHeaders) ? data.htmlHeaders : [];
  const currentRows = Array.isArray(data.htmlRows) ? data.htmlRows : [];
  const rowCount = currentRows.length || 0;
  const colCount = currentHeaders.length || 0;
  
  // SAFETY: Ensure we have minimum viable table structure
  if (colCount === 0 && rowCount === 0) {
    console.warn('[TableBlockInspector] Empty table structure detected');
  }

  // Add/Remove structure functions with safe array handling
  const addColumn = () => {
    const newHeaders = [...currentHeaders, '<p>New Column</p>'];
    const newRows = currentRows.map(row => [...(Array.isArray(row) ? row : []), '<p></p>']);
    updateTableData({ htmlHeaders: newHeaders, htmlRows: newRows });
  };

  const removeColumn = () => {
    if (colCount <= 1) return; // Keep at least one column
    const newHeaders = currentHeaders.slice(0, -1);
    const newRows = currentRows.map(row => (Array.isArray(row) ? row : []).slice(0, -1));
    updateTableData({ htmlHeaders: newHeaders, htmlRows: newRows });
  };

  const addRow = () => {
    const newRow = Array(Math.max(1, colCount)).fill('<p></p>');
    const newRows = [...currentRows, newRow];
    updateTableData({ htmlRows: newRows });
  };

  const removeRow = () => {
    if (rowCount <= 1) return; // Keep at least one row
    const newRows = currentRows.slice(0, -1);
    updateTableData({ htmlRows: newRows });
  };

  const resetTable = () => {
    const defaultHeaders = ['<p>Column 1</p>', '<p>Column 2</p>'];
    const defaultRows = [['<p></p>', '<p></p>']];
    updateTableData({ htmlHeaders: defaultHeaders, htmlRows: defaultRows });
  };

  const initializeTable = () => {
    if (currentHeaders.length === 0) {
      const defaultHeaders = ['<p>Column 1</p>', '<p>Column 2</p>'];
      const defaultRows = [['<p></p>', '<p></p>']];
      updateTableData({ htmlHeaders: defaultHeaders, htmlRows: defaultRows });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Table size={16} />
        <h3 className="font-medium">Table Block</h3>
        <Badge variant="secondary" className="text-xs">
          {colCount}×{rowCount}
        </Badge>
      </div>

      <Separator />

      {/* Table Structure Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Grid3X3 size={14} />
          Table Structure
        </h4>

        {(currentHeaders?.length || 0) === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="p-4 text-center">
              <Table size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                No table created yet
              </p>
              <Button onClick={initializeTable} size="sm" className="w-full">
                <Plus size={14} className="mr-2" />
                Create Table
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Structure Controls */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Columns ({colCount || 0})</Label>
                <div className="flex gap-1">
                  <Button onClick={addColumn} variant="outline" size="sm" className="flex-1">
                    <Plus size={12} />
                  </Button>
                  <Button 
                    onClick={removeColumn} 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    disabled={(colCount || 0) <= 1}
                  >
                    <Minus size={12} />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Rows ({rowCount || 0})</Label>
                <div className="flex gap-1">
                  <Button onClick={addRow} variant="outline" size="sm" className="flex-1">
                    <Plus size={12} />
                  </Button>
                  <Button 
                    onClick={removeRow} 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    disabled={(rowCount || 0) <= 1}
                  >
                    <Minus size={12} />
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              onClick={resetTable} 
              variant="outline" 
              size="sm" 
              className="w-full text-muted-foreground"
            >
              <RotateCcw size={12} className="mr-2" />
              Reset to 2×1 Table
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Typography Note */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Type size={14} />
          Typography
        </h4>
        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
          💡 Typography controls are available in the toolbar when editing cells. 
          Select any cell and use the formatting controls to style text.
        </div>
      </div>

      <Separator />

      {/* Colors & Background Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Palette size={14} />
          Colors & Background
        </h4>
        
        <BackgroundControls
          data={data}
          onChange={updateTableData}
          enableImage={false} // Tables don't typically need background images
          compact={true}
          className="space-y-3"
          colorKey="backgroundColor"
          defaultColor="transparent"
          label="Table Background"
        />
      </div>

      <Separator />

      {/* Spacing & Layout Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Move size={14} />
          Spacing & Layout
        </h4>
        
        <SpacingControls
          data={data}
          onChange={updateTableData}
          compact={true}
          className="space-y-3"
          enablePresets={true}
          enableBorders={false} // Use separate border controls
          showDetailedControls={false}
        />
      </div>

      <Separator />

      {/* Border & Style Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Layers size={14} />
          Border & Style
        </h4>
        
        <BorderControls
          data={data}
          onChange={updateTableData}
          compact={true}
          className="space-y-3"
          enableCornerRadius={true}
          enableBorderStyle={true}
          defaultBorderColor="#e5e7eb"
          defaultBorderWidth={1}
        />
      </div>

      {/* Table Info */}
      <div className="pt-2 border-t bg-muted/20 p-3 rounded-lg">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Table Info</div>
          <div>Size: {colCount || 0} columns × {rowCount || 0} rows</div>
          <div>Total cells: {(colCount || 0) * (rowCount || 0)}</div>
          <div className="text-xs text-muted-foreground/70 mt-2">
            💡 Use Tab to navigate between cells, Enter to add new rows
          </div>
        </div>
      </div>
    </div>
  );
};