// ABOUTME: Inspector panel for KeyTakeawayBlock with advanced theme customization and icon selection

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { KeyTakeawayBlockData } from '@/types/editor';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  RotateCcw
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
    color: 'bg-blue-500' 
  },
  { 
    value: 'success', 
    label: 'Success', 
    description: 'Green theme for positive messages',
    color: 'bg-green-500' 
  },
  { 
    value: 'warning', 
    label: 'Warning', 
    description: 'Yellow theme for cautionary messages',
    color: 'bg-yellow-500' 
  },
  { 
    value: 'error', 
    label: 'Error', 
    description: 'Red theme for critical messages',
    color: 'bg-red-500' 
  },
] as const;

// Predefined background colors
const BACKGROUND_COLORS = [
  { label: 'Default (Theme)', value: '' },
  { label: 'White', value: '#ffffff' },
  { label: 'Light Gray', value: '#f8fafc' },
  { label: 'Light Blue', value: '#eff6ff' },
  { label: 'Light Green', value: '#f0fdf4' },
  { label: 'Light Yellow', value: '#fefce8' },
  { label: 'Light Red', value: '#fef2f2' },
  { label: 'Light Purple', value: '#faf5ff' },
  { label: 'Light Orange', value: '#fff7ed' },
] as const;

export function KeyTakeawayBlockInspector({ nodeId }: KeyTakeawayBlockInspectorProps) {
  const { nodes, updateNode } = useEditorStore();
  const [customColor, setCustomColor] = React.useState('');
  
  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'keyTakeawayBlock') return null;
  
  const data = node.data as KeyTakeawayBlockData;
  
  const updateData = (updates: Partial<KeyTakeawayBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates }
    });
  };
  
  // Reset to theme defaults
  const handleResetToTheme = () => {
    updateData({ backgroundColor: undefined });
    setCustomColor('');
  };
  
  // Apply custom background color
  const handleCustomColorApply = () => {
    if (customColor) {
      updateData({ backgroundColor: customColor });
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Key Takeaway Settings</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              data.theme === 'info' && 'bg-blue-500',
              data.theme === 'success' && 'bg-green-500',
              data.theme === 'warning' && 'bg-yellow-500',
              data.theme === 'error' && 'bg-red-500'
            )} />
            {data.theme}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize the appearance and content of your key takeaway message
        </p>
      </div>

      <Separator />

      {/* Content */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Content</h4>
        
        <div className="space-y-2">
          <Label htmlFor="content">Message *</Label>
          <Textarea
            id="content"
            value={data.content || ''}
            onChange={(e) => updateData({ content: e.target.value })}
            placeholder="Enter your key takeaway message..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Keep it concise and impactful for maximum reader engagement
          </p>
        </div>
      </div>

      <Separator />

      {/* Theme Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Theme & Style</h4>
        
        <div className="space-y-2">
          <Label>Message Theme</Label>
          <div className="grid grid-cols-1 gap-2">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.value}
                onClick={() => updateData({ theme: theme.value })}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                  'hover:bg-accent/50',
                  data.theme === theme.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                )}
              >
                <div className={cn('w-4 h-4 rounded-full', theme.color)} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{theme.label}</div>
                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                </div>
                {data.theme === theme.value && (
                  <CheckCircle size={16} className="text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Icon Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Icon Selection</h4>
        
        <div className="space-y-2">
          <Label>Choose Icon</Label>
          <div className="grid grid-cols-2 gap-2">
            {ICON_OPTIONS.map((iconOption) => {
              const IconComponent = iconOption.icon;
              return (
                <button
                  key={iconOption.value}
                  onClick={() => updateData({ icon: iconOption.value })}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border text-left transition-all',
                    'hover:bg-accent/50',
                    data.icon === iconOption.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  )}
                >
                  <IconComponent size={16} />
                  <span className="text-sm">{iconOption.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Separator />

      {/* Background Customization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Background Color</h4>
          {data.backgroundColor && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetToTheme}
              className="h-7 px-2"
            >
              <RotateCcw size={12} className="mr-1" />
              Reset
            </Button>
          )}
        </div>
        
        {/* Predefined Colors */}
        <div className="space-y-2">
          <Label>Quick Colors</Label>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUND_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateData({ backgroundColor: color.value || undefined })}
                className={cn(
                  'flex items-center gap-2 p-2 rounded border text-left text-xs transition-all',
                  'hover:bg-accent/50',
                  (data.backgroundColor === color.value || (!data.backgroundColor && !color.value))
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                )}
                style={color.value ? { backgroundColor: color.value } : {}}
              >
                {color.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Color Input */}
        <div className="space-y-2">
          <Label htmlFor="customColor">Custom Color</Label>
          <div className="flex gap-2">
            <Input
              id="customColor"
              type="color"
              value={customColor || data.backgroundColor || '#ffffff'}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-20 h-10 p-1 border-2"
            />
            <Input
              value={customColor || data.backgroundColor || ''}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCustomColorApply}
              disabled={!customColor}
              className="px-3"
            >
              Apply
            </Button>
          </div>
        </div>
        
        {/* Current Background Display */}
        {data.backgroundColor && (
          <div className="p-3 rounded border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: data.backgroundColor }}
              />
              <span>Current: {data.backgroundColor}</span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Preview */}
      <div className="space-y-2">
        <Label>Live Preview</Label>
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground mb-2">
            Preview of your key takeaway:
          </div>
          <div 
            className={cn(
              'p-3 rounded border-l-4 text-sm',
              data.theme === 'info' && 'border-blue-400 bg-blue-50 text-blue-900',
              data.theme === 'success' && 'border-green-400 bg-green-50 text-green-900',
              data.theme === 'warning' && 'border-yellow-400 bg-yellow-50 text-yellow-900',
              data.theme === 'error' && 'border-red-400 bg-red-50 text-red-900'
            )}
            style={data.backgroundColor ? { backgroundColor: data.backgroundColor } : {}}
          >
            {data.content || 'Your key takeaway message will appear here...'}
          </div>
        </div>
      </div>
    </div>
  );
}