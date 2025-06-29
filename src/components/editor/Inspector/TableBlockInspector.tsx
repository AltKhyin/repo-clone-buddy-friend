// ABOUTME: Inspector panel for TableBlock with comprehensive table structure and styling controls

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { useEditorStore } from '@/store/editorStore'
import { 
  Table, 
  Plus, 
  Minus, 
  Palette, 
  Settings, 
  Rows,
  Columns,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react'

interface TableBlockInspectorProps {
  nodeId: string
}

export const TableBlockInspector: React.FC<TableBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore()
  
  const node = nodes.find(n => n.id === nodeId)
  if (!node || node.type !== 'tableBlock') return null

  const data = node.data

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates }
    })
  }

  const addRow = () => {
    const newRow = new Array(data.headers.length).fill('')
    updateNodeData({ rows: [...data.rows, newRow] })
  }

  const removeRow = () => {
    if (data.rows.length > 1) {
      updateNodeData({ rows: data.rows.slice(0, -1) })
    }
  }

  const addColumn = () => {
    const newHeaders = [...data.headers, `Column ${data.headers.length + 1}`]
    const newRows = data.rows.map(row => [...row, ''])
    updateNodeData({ headers: newHeaders, rows: newRows })
  }

  const removeColumn = () => {
    if (data.headers.length > 1) {
      const newHeaders = data.headers.slice(0, -1)
      const newRows = data.rows.map(row => row.slice(0, -1))
      updateNodeData({ headers: newHeaders, rows: newRows })
    }
  }

  const clearAllData = () => {
    const emptyRows = data.rows.map(row => new Array(row.length).fill(''))
    updateNodeData({ 
      headers: data.headers.map((_, index) => `Column ${index + 1}`),
      rows: emptyRows 
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Table size={16} />
        <h3 className="font-medium">Table Block</h3>
      </div>

      <Separator />

      {/* Table Structure Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Settings size={14} />
          Table Structure
        </h4>

        {/* Current Size Display */}
        <div className="bg-muted/50 rounded p-2 text-xs">
          <div className="flex justify-between items-center">
            <span>Size: {data.headers.length} columns × {data.rows.length} rows</span>
            <span>Total cells: {data.headers.length * data.rows.length}</span>
          </div>
        </div>

        {/* Row Controls */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <Rows size={12} />
            Row Management
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={addRow}
              className="flex-1 h-8 text-xs"
            >
              <Plus size={12} className="mr-1" />
              Add Row
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={removeRow}
              disabled={data.rows.length <= 1}
              className="flex-1 h-8 text-xs"
            >
              <Minus size={12} className="mr-1" />
              Remove Row
            </Button>
          </div>
        </div>

        {/* Column Controls */}
        <div className="space-y-2">
          <div className="text-xs font-medium flex items-center gap-2">
            <Columns size={12} />
            Column Management
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={addColumn}
              className="flex-1 h-8 text-xs"
            >
              <Plus size={12} className="mr-1" />
              Add Column
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={removeColumn}
              disabled={data.headers.length <= 1}
              className="flex-1 h-8 text-xs"
            >
              <Minus size={12} className="mr-1" />
              Remove Column
            </Button>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Data Management</div>
          <Button
            size="sm"
            variant="outline"
            onClick={clearAllData}
            className="w-full h-8 text-xs text-orange-600 hover:text-orange-700"
          >
            <RotateCcw size={12} className="mr-1" />
            Clear All Data
          </Button>
        </div>
      </div>

      <Separator />

      {/* Table Behavior Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ArrowUpDown size={14} />
          Table Behavior
        </h4>

        {/* Sortable Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="table-sortable" className="text-xs">Enable Column Sorting</Label>
            <Switch
              id="table-sortable"
              checked={data.sortable || false}
              onCheckedChange={(checked) => updateNodeData({ sortable: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow users to click column headers to sort data
          </p>
        </div>

        {/* Alternating Row Colors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="table-alternating" className="text-xs">Alternating Row Colors</Label>
            <Switch
              id="table-alternating"
              checked={data.alternatingRowColors || false}
              onCheckedChange={(checked) => updateNodeData({ alternatingRowColors: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Alternate background colors for better readability
          </p>
        </div>
      </div>

      <Separator />

      {/* Header Styling Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Palette size={14} />
          Header Styling
        </h4>

        {/* Header Background Color */}
        <div className="space-y-2">
          <Label htmlFor="header-bg-color" className="text-xs">Header Background</Label>
          <div className="flex items-center gap-2">
            <Input
              id="header-bg-color"
              type="color"
              value={data.headerStyle?.backgroundColor || '#f3f4f6'}
              onChange={(e) => updateNodeData({ 
                headerStyle: { 
                  ...data.headerStyle, 
                  backgroundColor: e.target.value 
                }
              })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.headerStyle?.backgroundColor || '#f3f4f6'}
              onChange={(e) => updateNodeData({ 
                headerStyle: { 
                  ...data.headerStyle, 
                  backgroundColor: e.target.value 
                }
              })}
              placeholder="#f3f4f6"
              className="flex-1 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ 
                headerStyle: { 
                  ...data.headerStyle, 
                  backgroundColor: undefined 
                }
              })}
              className="h-8 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Header Text Color */}
        <div className="space-y-2">
          <Label htmlFor="header-text-color" className="text-xs">Header Text Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="header-text-color"
              type="color"
              value={data.headerStyle?.textColor || '#374151'}
              onChange={(e) => updateNodeData({ 
                headerStyle: { 
                  ...data.headerStyle, 
                  textColor: e.target.value 
                }
              })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.headerStyle?.textColor || '#374151'}
              onChange={(e) => updateNodeData({ 
                headerStyle: { 
                  ...data.headerStyle, 
                  textColor: e.target.value 
                }
              })}
              placeholder="#374151"
              className="flex-1 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ 
                headerStyle: { 
                  ...data.headerStyle, 
                  textColor: undefined 
                }
              })}
              className="h-8 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Spacing & Borders Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Spacing & Borders</h4>

        {/* Horizontal Padding */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Horizontal Padding</div>
          <div className="flex items-center gap-2">
            <Slider
              id="table-padding-x"
              min={0}
              max={48}
              step={4}
              value={[data.paddingX || 16]}
              onValueChange={([value]) => updateNodeData({ paddingX: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.paddingX || 16}
              onChange={(e) => updateNodeData({ paddingX: parseInt(e.target.value) || 16 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={48}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Vertical Padding */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Vertical Padding</div>
          <div className="flex items-center gap-2">
            <Slider
              id="table-padding-y"
              min={0}
              max={48}
              step={4}
              value={[data.paddingY || 16]}
              onValueChange={([value]) => updateNodeData({ paddingY: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.paddingY || 16}
              onChange={(e) => updateNodeData({ paddingY: parseInt(e.target.value) || 16 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={48}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="table-bg-color" className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="table-bg-color"
              type="color"
              value={data.backgroundColor || '#ffffff'}
              onChange={(e) => updateNodeData({ backgroundColor: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.backgroundColor || 'transparent'}
              onChange={(e) => updateNodeData({ backgroundColor: e.target.value })}
              placeholder="transparent"
              className="flex-1 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ backgroundColor: 'transparent' })}
              className="h-8 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Border Radius</div>
          <div className="flex items-center gap-2">
            <Slider
              id="table-border-radius"
              min={0}
              max={24}
              step={2}
              value={[data.borderRadius || 8]}
              onValueChange={([value]) => updateNodeData({ borderRadius: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.borderRadius || 8}
              onChange={(e) => updateNodeData({ borderRadius: parseInt(e.target.value) || 8 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={24}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Border Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="table-border-toggle" className="text-xs">Enable Border</Label>
            <Switch
              id="table-border-toggle"
              checked={(data.borderWidth || 0) > 0}
              onCheckedChange={(checked) => updateNodeData({ borderWidth: checked ? 1 : 0 })}
            />
          </div>
        </div>

        {/* Border Controls - Only show when border is enabled */}
        {(data.borderWidth || 0) > 0 && (
          <>
            {/* Border Width */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Border Width</div>
              <div className="flex items-center gap-2">
                <Slider
                  id="table-border-width"
                  min={1}
                  max={8}
                  step={1}
                  value={[data.borderWidth || 1]}
                  onValueChange={([value]) => updateNodeData({ borderWidth: value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={data.borderWidth || 1}
                  onChange={(e) => updateNodeData({ borderWidth: parseInt(e.target.value) || 1 })}
                  className="w-16 h-8 text-xs"
                  min={1}
                  max={8}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            {/* Border Color */}
            <div className="space-y-2">
              <Label htmlFor="table-border-color" className="text-xs">Border Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="table-border-color"
                  type="color"
                  value={data.borderColor || '#e5e7eb'}
                  onChange={(e) => updateNodeData({ borderColor: e.target.value })}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={data.borderColor || '#e5e7eb'}
                  onChange={(e) => updateNodeData({ borderColor: e.target.value })}
                  placeholder="#e5e7eb"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}