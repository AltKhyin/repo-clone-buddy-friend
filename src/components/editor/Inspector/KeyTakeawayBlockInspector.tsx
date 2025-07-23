// ABOUTME: Inspector panel for KeyTakeawayBlock with advanced theme customization and icon selection

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { KeyTakeawayBlockData } from '@/types/editor';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Star,
  Zap,
  Target,
  Palette,
  RotateCcw,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyTakeawayBlockInspectorProps {
  nodeId: string;
}

// Icon options for selection
const ICON_OPTIONS = [
  { value: 'lightbulb', label: 'Light Bulb', icon: Lightbulb },
  { value: 'check', label: 'Check Circle', icon: CheckCircle },
  { value: 'warning', label: 'Warning', icon: AlertTriangle },
  { value: 'error', label: 'Error', icon: XCircle },
  { value: 'info', label: 'Info', icon: Info },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'zap', label: 'Lightning', icon: Zap },
  { value: 'target', label: 'Target', icon: Target },
] as const;

// Theme options with enhanced descriptions
const THEME_OPTIONS = [
  {
    value: 'info',
    label: 'Information',
    description: 'Blue theme for informational messages',
    color: 'bg-blue-500',
  },
  {
    value: 'success',
    label: 'Success',
    description: 'Green theme for positive messages',
    color: 'bg-green-500',
  },
  {
    value: 'warning',
    label: 'Warning',
    description: 'Yellow theme for cautionary messages',
    color: 'bg-yellow-500',
  },
  {
    value: 'error',
    label: 'Error',
    description: 'Red theme for critical messages',
    color: 'bg-red-500',
  },
] as const;

export function KeyTakeawayBlockInspector({ nodeId }: KeyTakeawayBlockInspectorProps) {
  const { nodes, updateNode } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'keyTakeawayBlock') return null;

  const data = node.data as KeyTakeawayBlockData;

  const updateData = (updates: Partial<KeyTakeawayBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Helper functions to convert between HTML and plain text for inspector editing
  const htmlToText = (html: string): string => {
    if (!html || html === '<p></p>' || html === '<p><br></p>') return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p><p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  const textToHtml = (text: string): string => {
    if (!text || text.trim() === '') return '<p></p>';
    return `<p>${text.replace(/\n/g, '<br>')}</p>`;
  };

  // Get text value for inspector editing
  const contentText = htmlToText(data.htmlContent || '');

  // Handle content updates with HTML conversion
  const handleContentUpdate = (text: string) => {
    const htmlContent = textToHtml(text);
    updateData({ htmlContent });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb size={16} />
        <h3 className="font-medium">Key Takeaway Block</h3>
      </div>

      <Separator />

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Message</Label>
        <Textarea
          id="content"
          value={contentText}
          onChange={e => handleContentUpdate(e.target.value)}
          placeholder="Enter your key takeaway message..."
          rows={3}
          className="resize-none"
        />
      </div>

      <Separator />

      {/* Theme Selection */}
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map(theme => (
            <button
              key={theme.value}
              onClick={() => updateData({ theme: theme.value })}
              className={cn(
                'flex items-center gap-2 p-2 rounded border text-left transition-all',
                'hover:bg-accent/50',
                data.theme === theme.value ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className={cn('w-3 h-3 rounded-full', theme.color)} />
              <span className="text-sm">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Icon Selection */}
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="grid grid-cols-2 gap-2">
          {ICON_OPTIONS.map(iconOption => {
            const IconComponent = iconOption.icon;
            return (
              <button
                key={iconOption.value}
                onClick={() => updateData({ icon: iconOption.value })}
                className={cn(
                  'flex items-center gap-2 p-2 rounded border text-left transition-all',
                  'hover:bg-accent/50',
                  data.icon === iconOption.value ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <IconComponent size={14} />
                <span className="text-sm">{iconOption.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Accent Color */}
      <div className="space-y-2">
        <Label>Accent Color</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={data.borderColor || '#3b82f6'}
            onChange={e => updateData({ borderColor: e.target.value })}
            className="w-12 h-8 p-1 border rounded"
          />
          <Input
            type="text"
            value={data.borderColor || '#3b82f6'}
            onChange={e => updateData({ borderColor: e.target.value })}
            placeholder="#3b82f6"
            className="flex-1 h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateData({ borderColor: '#3b82f6' })}
            className="h-8 px-2 text-xs"
          >
            Reset
          </Button>
        </div>
      </div>

      <Separator />

      {/* Background Color with Transparency */}
      <div className="space-y-2">
        <Label>Background Color</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={data.backgroundColor || '#ffffff'}
            onChange={e => updateData({ backgroundColor: e.target.value })}
            className="w-12 h-8 p-1 border rounded"
          />
          <Input
            type="text"
            value={data.backgroundColor || 'transparent'}
            onChange={e => updateData({ backgroundColor: e.target.value })}
            placeholder="transparent or rgba(255,255,255,0.5)"
            className="flex-1 h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateData({ backgroundColor: 'transparent' })}
            className="h-8 px-2 text-xs"
          >
            Clear
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Supports transparency: use rgba() or hex with alpha
        </p>
      </div>

      <Separator />

      {/* Typography Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type size={16} />
          <h4 className="font-medium">Typography</h4>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Font Size</Label>
            <span className="text-sm text-muted-foreground">{data.fontSize || 16}px</span>
          </div>
          <Slider
            value={[data.fontSize || 16]}
            onValueChange={([value]) => updateData({ fontSize: value })}
            min={12}
            max={48}
            step={1}
            className="w-full"
          />
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label>Text Alignment</Label>
          <Select
            value={data.textAlign || 'left'}
            onValueChange={(value: 'left' | 'center' | 'right' | 'justify') =>
              updateData({ textAlign: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="justify">Justify</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Color */}
        <div className="space-y-2">
          <Label>Text Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={data.color || '#1f2937'}
              onChange={e => updateData({ color: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.color || '#1f2937'}
              onChange={e => updateData({ color: e.target.value })}
              placeholder="#1f2937"
              className="flex-1 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateData({ color: '#1f2937' })}
              className="h-8 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select
            value={data.fontFamily || 'inherit'}
            onValueChange={(value: string) => updateData({ fontFamily: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">System Default</SelectItem>
              <SelectItem value="ui-serif, Georgia, Cambria, serif">Serif</SelectItem>
              <SelectItem value="ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif">Sans Serif</SelectItem>
              <SelectItem value="ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace">Monospace</SelectItem>
              <SelectItem value="cursive">Cursive</SelectItem>
              <SelectItem value="fantasy">Fantasy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Weight */}
        <div className="space-y-2">
          <Label>Font Weight</Label>
          <Select
            value={data.fontWeight?.toString() || '400'}
            onValueChange={(value: string) => updateData({ fontWeight: parseInt(value) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">Light (300)</SelectItem>
              <SelectItem value="400">Normal (400)</SelectItem>
              <SelectItem value="500">Medium (500)</SelectItem>
              <SelectItem value="600">Semi Bold (600)</SelectItem>
              <SelectItem value="700">Bold (700)</SelectItem>
              <SelectItem value="800">Extra Bold (800)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Line Height</Label>
            <span className="text-sm text-muted-foreground">{data.lineHeight || 1.5}</span>
          </div>
          <Slider
            value={[data.lineHeight || 1.5]}
            onValueChange={([value]) => updateData({ lineHeight: value })}
            min={1.0}
            max={3.0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Letter Spacing</Label>
            <span className="text-sm text-muted-foreground">{data.letterSpacing || 0}px</span>
          </div>
          <Slider
            value={[data.letterSpacing || 0]}
            onValueChange={([value]) => updateData({ letterSpacing: value })}
            min={-2}
            max={5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Text Transform */}
        <div className="space-y-2">
          <Label>Text Transform</Label>
          <Select
            value={data.textTransform || 'none'}
            onValueChange={(value: 'none' | 'uppercase' | 'lowercase' | 'capitalize') =>
              updateData({ textTransform: value })
            }
          >
            <SelectTrigger className="w-full">
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
          <Label>Text Decoration</Label>
          <Select
            value={data.textDecoration || 'none'}
            onValueChange={(value: 'none' | 'underline' | 'overline' | 'line-through') =>
              updateData({ textDecoration: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="underline">Underline</SelectItem>
              <SelectItem value="overline">Overline</SelectItem>
              <SelectItem value="line-through">Strike Through</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Style */}
        <div className="space-y-2">
          <Label>Font Style</Label>
          <Select
            value={data.fontStyle || 'normal'}
            onValueChange={(value: 'normal' | 'italic' | 'oblique') =>
              updateData({ fontStyle: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="italic">Italic</SelectItem>
              <SelectItem value="oblique">Oblique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
