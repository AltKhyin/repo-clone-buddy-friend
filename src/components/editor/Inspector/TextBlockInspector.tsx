// ABOUTME: Inspector panel for TextBlock with comprehensive customization controls

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { useEditorStore } from '@/store/editorStore'
import { SafeSwitch } from '../SafeSwitch'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, Type } from 'lucide-react'

interface TextBlockInspectorProps {
  nodeId: string
  compact?: boolean
}

export const TextBlockInspector: React.FC<TextBlockInspectorProps> = ({ nodeId, compact = false }) => {
  const { nodes, updateNode } = useEditorStore()
  
  const node = nodes.find(n => n.id === nodeId)
  if (!node || node.type !== 'textBlock') return null

  const data = node.data

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates }
    })
  }

  // Compact mode for toolbar
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Font Size */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={data.fontSize || 16}
            onChange={(e) => updateNodeData({ fontSize: parseInt(e.target.value) || 16 })}
            className="w-16 h-7 text-xs"
            min={12}
            max={72}
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>

        {/* Text Alignment */}
        <div className="flex gap-1">
          {[
            { value: 'left', icon: AlignLeft },
            { value: 'center', icon: AlignCenter },
            { value: 'right', icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={data.textAlign === value ? "default" : "outline"}
              onClick={() => updateNodeData({ textAlign: value as any })}
              className="h-7 w-7 p-0"
            >
              <Icon size={12} />
            </Button>
          ))}
        </div>

        {/* Font Family */}
        <Select value={data.fontFamily || 'inherit'} onValueChange={(value) => updateNodeData({ fontFamily: value })}>
          <SelectTrigger className="w-24 h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">Default</SelectItem>
            <SelectItem value="serif">Serif</SelectItem>
            <SelectItem value="sans-serif">Sans</SelectItem>
            <SelectItem value="monospace">Mono</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Type size={16} />
        <h3 className="font-medium">Text Block</h3>
      </div>

      <Separator />

      {/* Typography Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Type size={14} />
          Typography
        </h4>

        {/* Font Size */}
        <div className="space-y-2">
          <Label htmlFor="text-font-size" className="text-xs">Font Size</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="text-font-size"
              min={12}
              max={72}
              step={1}
              value={[data.fontSize || 16]}
              onValueChange={([value]) => updateNodeData({ fontSize: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.fontSize || 16}
              onChange={(e) => updateNodeData({ fontSize: parseInt(e.target.value) || 16 })}
              className="w-16 h-8 text-xs"
              min={12}
              max={72}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-xs">Text Alignment</Label>
          <div className="flex gap-1">
            {[
              { value: 'left', icon: AlignLeft },
              { value: 'center', icon: AlignCenter },
              { value: 'right', icon: AlignRight },
              { value: 'justify', icon: AlignJustify },
            ].map(({ value, icon: Icon }) => (
              <Button
                key={value}
                size="sm"
                variant={data.textAlign === value ? "default" : "outline"}
                onClick={() => updateNodeData({ textAlign: value as any })}
                className="h-8 w-8 p-0"
              >
                <Icon size={14} />
              </Button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label htmlFor="text-font-family" className="text-xs">Font Family</Label>
          <Select value={data.fontFamily || 'inherit'} onValueChange={(value) => updateNodeData({ fontFamily: value })}>
            <SelectTrigger id="text-font-family" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Default</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="sans-serif">Sans Serif</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
              <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
              <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Weight */}
        <div className="space-y-2">
          <Label className="text-xs">Font Weight</Label>
          <Select value={String(data.fontWeight || 400)} onValueChange={(value) => updateNodeData({ fontWeight: parseInt(value) })}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">Light (300)</SelectItem>
              <SelectItem value="400">Regular (400)</SelectItem>
              <SelectItem value="500">Medium (500)</SelectItem>
              <SelectItem value="600">Semi Bold (600)</SelectItem>
              <SelectItem value="700">Bold (700)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Height */}
        <div className="space-y-2">
          <Label htmlFor="text-line-height" className="text-xs">Line Height</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="text-line-height"
              min={1}
              max={3}
              step={0.1}
              value={[data.lineHeight || 1.6]}
              onValueChange={([value]) => updateNodeData({ lineHeight: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.lineHeight || 1.6}
              onChange={(e) => updateNodeData({ lineHeight: parseFloat(e.target.value) || 1.6 })}
              className="w-16 h-8 text-xs"
              min={1}
              max={3}
              step={0.1}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Colors Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Palette size={14} />
          Colors
        </h4>

        {/* Text Color */}
        <div className="space-y-2">
          <Label htmlFor="text-color" className="text-xs">Text Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="text-color"
              type="color"
              value={data.color || '#000000'}
              onChange={(e) => updateNodeData({ color: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.color || '#000000'}
              onChange={(e) => updateNodeData({ color: e.target.value })}
              placeholder="#000000"
              className="flex-1 h-8 text-xs"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="text-bg-color" className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="text-bg-color"
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
      </div>

      <Separator />

      {/* Spacing & Borders Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Spacing & Borders</h4>

        {/* Horizontal Padding */}
        <div className="space-y-2">
          <Label htmlFor="text-padding-x" className="text-xs">Horizontal Padding</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="text-padding-x"
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
          <Label htmlFor="text-padding-y" className="text-xs">Vertical Padding</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="text-padding-y"
              min={0}
              max={48}
              step={4}
              value={[data.paddingY || 12]}
              onValueChange={([value]) => updateNodeData({ paddingY: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.paddingY || 12}
              onChange={(e) => updateNodeData({ paddingY: parseInt(e.target.value) || 12 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={48}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <Label htmlFor="text-border-radius" className="text-xs">Border Radius</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="text-border-radius"
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
            <Label htmlFor="text-border-toggle" className="text-xs">Enable Border</Label>
            <SafeSwitch
              id="text-border-toggle"
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
              <Label htmlFor="text-border-width" className="text-xs">Border Width</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="text-border-width"
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
              <Label htmlFor="text-border-color" className="text-xs">Border Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="text-border-color"
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