// ABOUTME: Inspector panel for HeadingBlock with heading-specific customization controls

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useEditorStore } from '@/store/editorStore'
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4,
  Type
} from 'lucide-react'

interface HeadingBlockInspectorProps {
  nodeId: string
}

export const HeadingBlockInspector: React.FC<HeadingBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore()
  
  const node = nodes.find(n => n.id === nodeId)
  if (!node || node.type !== 'headingBlock') return null

  const data = node.data

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates }
    })
  }

  const headingLevels = [
    { value: 1, icon: Heading1, label: 'H1' },
    { value: 2, icon: Heading2, label: 'H2' },
    { value: 3, icon: Heading3, label: 'H3' },
    { value: 4, icon: Heading4, label: 'H4' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heading1 size={16} />
        <h3 className="font-medium">Heading Block</h3>
      </div>

      <Separator />

      {/* Heading Level Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Heading Level</h4>
        <div className="flex gap-1">
          {headingLevels.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              size="sm"
              variant={data.level === value ? "default" : "outline"}
              onClick={() => updateNodeData({ level: value as 1 | 2 | 3 | 4 })}
              className="h-10 px-3 flex flex-col items-center gap-1"
            >
              <Icon size={14} />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Typography Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Type size={14} />
          Typography
        </h4>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-xs">Text Alignment</Label>
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
                className="h-8 w-8 p-0"
              >
                <Icon size={14} />
              </Button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label htmlFor="heading-font-family" className="text-xs">Font Family</Label>
          <Select value={data.fontFamily || 'inherit'} onValueChange={(value) => updateNodeData({ fontFamily: value })}>
            <SelectTrigger id="heading-font-family" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Default</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="sans-serif">Sans Serif</SelectItem>
              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
              <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
              <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
              <SelectItem value="Merriweather, serif">Merriweather</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Weight */}
        <div className="space-y-2">
          <Label className="text-xs">Font Weight</Label>
          <Select value={String(data.fontWeight || (data.level <= 2 ? 700 : 600))} onValueChange={(value) => updateNodeData({ fontWeight: parseInt(value) })}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="400">Regular (400)</SelectItem>
              <SelectItem value="500">Medium (500)</SelectItem>
              <SelectItem value="600">Semi Bold (600)</SelectItem>
              <SelectItem value="700">Bold (700)</SelectItem>
              <SelectItem value="800">Extra Bold (800)</SelectItem>
              <SelectItem value="900">Black (900)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <Label htmlFor="heading-letter-spacing" className="text-xs">Letter Spacing</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="heading-letter-spacing"
              min={-2}
              max={4}
              step={0.1}
              value={[data.letterSpacing || 0]}
              onValueChange={([value]) => updateNodeData({ letterSpacing: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.letterSpacing || 0}
              onChange={(e) => updateNodeData({ letterSpacing: parseFloat(e.target.value) || 0 })}
              className="w-16 h-8 text-xs"
              min={-2}
              max={4}
              step={0.1}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Text Transform */}
        <div className="space-y-2">
          <Label className="text-xs">Text Transform</Label>
          <Select value={data.textTransform || 'none'} onValueChange={(value) => updateNodeData({ textTransform: value as any })}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
              <SelectItem value="capitalize">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Decoration */}
        <div className="space-y-2">
          <Label className="text-xs">Text Decoration</Label>
          <Select value={data.textDecoration || 'none'} onValueChange={(value) => updateNodeData({ textDecoration: value as any })}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="underline">Underline</SelectItem>
              <SelectItem value="line-through">Line Through</SelectItem>
            </SelectContent>
          </Select>
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
          <Label htmlFor="heading-color" className="text-xs">Text Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="heading-color"
              type="color"
              value={data.color || '#111827'}
              onChange={(e) => updateNodeData({ color: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.color || '#111827'}
              onChange={(e) => updateNodeData({ color: e.target.value })}
              placeholder="#111827"
              className="flex-1 h-8 text-xs"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="heading-bg-color" className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="heading-bg-color"
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
          <Label htmlFor="heading-padding-x" className="text-xs">Horizontal Padding</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="heading-padding-x"
              min={0}
              max={48}
              step={4}
              value={[data.paddingX || 12]}
              onValueChange={([value]) => updateNodeData({ paddingX: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.paddingX || 12}
              onChange={(e) => updateNodeData({ paddingX: parseInt(e.target.value) || 12 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={48}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Vertical Padding */}
        <div className="space-y-2">
          <Label htmlFor="heading-padding-y" className="text-xs">Vertical Padding</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="heading-padding-y"
              min={0}
              max={48}
              step={4}
              value={[data.paddingY || 8]}
              onValueChange={([value]) => updateNodeData({ paddingY: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.paddingY || 8}
              onChange={(e) => updateNodeData({ paddingY: parseInt(e.target.value) || 8 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={48}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <Label htmlFor="heading-border-radius" className="text-xs">Border Radius</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="heading-border-radius"
              min={0}
              max={24}
              step={2}
              value={[data.borderRadius || 6]}
              onValueChange={([value]) => updateNodeData({ borderRadius: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.borderRadius || 6}
              onChange={(e) => updateNodeData({ borderRadius: parseInt(e.target.value) || 6 })}
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
            <Label htmlFor="heading-border-toggle" className="text-xs">Enable Border</Label>
            <Switch
              id="heading-border-toggle"
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
              <Label htmlFor="heading-border-width" className="text-xs">Border Width</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="heading-border-width"
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
              <Label htmlFor="heading-border-color" className="text-xs">Border Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="heading-border-color"
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