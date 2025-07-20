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
          value={data.content || ''}
          onChange={e => updateData({ content: e.target.value })}
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
    </div>
  );
}
