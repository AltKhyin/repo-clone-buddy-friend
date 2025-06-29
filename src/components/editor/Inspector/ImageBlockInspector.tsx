// ABOUTME: Inspector panel for ImageBlock with comprehensive customization controls

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useEditorStore } from '@/store/editorStore'
import { 
  ImageIcon, 
  Palette, 
  Maximize2,
  ExternalLink,
  Upload,
  RefreshCw
} from 'lucide-react'

interface ImageBlockInspectorProps {
  nodeId: string
}

export const ImageBlockInspector: React.FC<ImageBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore()
  
  const node = nodes.find(n => n.id === nodeId)
  if (!node || node.type !== 'imageBlock') return null

  const data = node.data

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates }
    })
  }

  // Common image sizes for quick selection
  const imageSizes = [
    { label: 'Auto', width: undefined, height: undefined },
    { label: 'Small (300px)', width: 300, height: undefined },
    { label: 'Medium (500px)', width: 500, height: undefined },
    { label: 'Large (700px)', width: 700, height: undefined },
    { label: 'Square 300x300', width: 300, height: 300 },
    { label: 'Square 400x400', width: 400, height: 400 },
    { label: 'Landscape 16:9', width: 600, height: 338 },
    { label: 'Portrait 3:4', width: 450, height: 600 },
  ]

  const handleImageUrlChange = (url: string) => {
    updateNodeData({ src: url })
  }

  const handleSizePreset = (preset: typeof imageSizes[0]) => {
    updateNodeData({ 
      width: preset.width, 
      height: preset.height 
    })
  }

  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url)
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
    } catch {
      return false
    }
  }

  const isValidUrl = data.src ? validateImageUrl(data.src) : true

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon size={16} />
        <h3 className="font-medium">Image Block</h3>
      </div>

      <Separator />

      {/* Image Source Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Upload size={14} />
          Image Source
        </h4>

        {/* Image URL */}
        <div className="space-y-2">
          <Label htmlFor="image-url" className="text-xs">Image URL</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-url"
              type="url"
              value={data.src || ''}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`flex-1 h-8 text-xs ${!isValidUrl ? 'border-red-400' : ''}`}
            />
            {data.src && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(data.src, '_blank')}
                className="h-8 px-2"
                title="Open image in new tab"
              >
                <ExternalLink size={14} />
              </Button>
            )}
          </div>
          {!isValidUrl && data.src && (
            <p className="text-xs text-red-500">
              Please enter a valid image URL (.jpg, .png, .gif, .webp, .svg)
            </p>
          )}
        </div>

        {/* Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="image-alt" className="text-xs">Alt Text (Accessibility)</Label>
          <Input
            id="image-alt"
            value={data.alt || ''}
            onChange={(e) => updateNodeData({ alt: e.target.value })}
            placeholder="Describe the image for screen readers..."
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Describes the image content for screen readers and SEO
          </p>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="image-caption" className="text-xs">Caption (Optional)</Label>
          <Textarea
            id="image-caption"
            value={data.caption || ''}
            onChange={(e) => updateNodeData({ caption: e.target.value })}
            placeholder="Optional caption displayed below the image..."
            className="text-xs min-h-[60px]"
          />
        </div>
      </div>

      <Separator />

      {/* Size & Dimensions Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Maximize2 size={14} />
          Size & Dimensions
        </h4>

        {/* Size Presets */}
        <div className="space-y-2">
          <Label className="text-xs">Size Presets</Label>
          <Select 
            value={imageSizes.find(size => size.width === data.width && size.height === data.height)?.label || 'Custom'}
            onValueChange={(value) => {
              const preset = imageSizes.find(size => size.label === value)
              if (preset) {
                handleSizePreset(preset)
              }
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageSizes.map((size) => (
                <SelectItem key={size.label} value={size.label}>
                  {size.label}
                </SelectItem>
              ))}
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Width */}
        <div className="space-y-2">
          <Label htmlFor="image-width" className="text-xs">Width</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-width"
              type="number"
              value={data.width || ''}
              onChange={(e) => updateNodeData({ width: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Auto"
              className="flex-1 h-8 text-xs"
              min={50}
              max={1200}
            />
            <span className="text-xs text-muted-foreground">px</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ width: undefined })}
              className="h-8 px-2 text-xs"
            >
              Auto
            </Button>
          </div>
        </div>

        {/* Custom Height */}
        <div className="space-y-2">
          <Label htmlFor="image-height" className="text-xs">Height</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-height"
              type="number"
              value={data.height || ''}
              onChange={(e) => updateNodeData({ height: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Auto"
              className="flex-1 h-8 text-xs"
              min={50}
              max={800}
            />
            <span className="text-xs text-muted-foreground">px</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ height: undefined })}
              className="h-8 px-2 text-xs"
            >
              Auto
            </Button>
          </div>
        </div>

        {/* Aspect Ratio Lock */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Lock Aspect Ratio</Label>
          <Switch
            checked={!data.height || !data.width}
            onCheckedChange={(checked) => {
              if (checked) {
                updateNodeData({ height: undefined })
              }
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Spacing & Style Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Palette size={14} />
          Spacing & Style
        </h4>

        {/* Horizontal Padding */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Horizontal Padding</div>
          <div className="flex items-center gap-2">
            <Slider
              id="image-padding-x"
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
              id="image-padding-y"
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

        {/* Border Radius */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Border Radius</div>
          <div className="flex items-center gap-2">
            <Slider
              id="image-border-radius"
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

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="image-bg-color" className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-bg-color"
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

        {/* Border Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="image-border-toggle" className="text-xs">Enable Border</Label>
            <Switch
              id="image-border-toggle"
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
                  id="image-border-width"
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
              <Label htmlFor="image-border-color" className="text-xs">Border Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-border-color"
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

      {/* WebP Optimization Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <RefreshCw size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
              WebP Optimization
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Images are automatically optimized to WebP format when supported, with fallback to original format.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}