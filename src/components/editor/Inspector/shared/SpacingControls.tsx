// ABOUTME: Reusable spacing and dimension controls with visual feedback and constraint handling

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Move, ArrowLeftRight, ArrowUpDown, Square } from 'lucide-react';

interface SpacingField {
  key: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface SpacingControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  fields?: SpacingField[];
  compact?: boolean;
  className?: string;
}

// Default spacing fields
const DEFAULT_SPACING_FIELDS: SpacingField[] = [
  { 
    key: 'paddingX', 
    label: 'Horizontal Padding', 
    icon: ArrowLeftRight,
    min: 0, 
    max: 64, 
    step: 2, 
    unit: 'px' 
  },
  { 
    key: 'paddingY', 
    label: 'Vertical Padding', 
    icon: ArrowUpDown,
    min: 0, 
    max: 64, 
    step: 2, 
    unit: 'px' 
  },
  { 
    key: 'borderRadius', 
    label: 'Corner Radius', 
    icon: Square,
    min: 0, 
    max: 32, 
    step: 1, 
    unit: 'px' 
  },
];

// Spacing presets for quick selection
const SPACING_PRESETS = [
  { name: 'None', values: { paddingX: 0, paddingY: 0 } },
  { name: 'Tight', values: { paddingX: 8, paddingY: 6 } },
  { name: 'Normal', values: { paddingX: 16, paddingY: 12 } },
  { name: 'Loose', values: { paddingX: 24, paddingY: 18 } },
  { name: 'Extra Loose', values: { paddingX: 32, paddingY: 24 } },
];

export function SpacingControls({
  data,
  onChange,
  fields = DEFAULT_SPACING_FIELDS,
  compact = false,
  className
}: SpacingControlsProps) {
  
  const handleFieldChange = (fieldKey: string, value: number) => {
    onChange({ [fieldKey]: value });
  };

  const handlePresetApply = (preset: typeof SPACING_PRESETS[0]) => {
    // Only apply values that exist in current fields
    const updates: Record<string, number> = {};
    fields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(preset.values, field.key)) {
        updates[field.key] = preset.values[field.key as keyof typeof preset.values];
      }
    });
    onChange(updates);
  };

  const renderFieldControl = (field: SpacingField) => {
    const value = data[field.key] || 0;
    const { min = 0, max = 100, step = 1, unit = 'px' } = field;

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {field.icon && (
              <field.icon 
                size={compact ? 12 : 14} 
                className="text-muted-foreground" 
              />
            )}
            <Label className={cn(
              'font-medium',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {field.label}
            </Label>
          </div>
          
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
              min={min}
              max={max}
              step={step}
              className={cn(
                'w-16 text-right font-mono',
                compact ? 'h-6 text-xs' : 'h-8 text-sm'
              )}
            />
            <span className="text-xs text-muted-foreground w-6">
              {unit}
            </span>
          </div>
        </div>

        {/* Slider for visual adjustment */}
        <div className="px-2">
          <Slider
            value={[value]}
            onValueChange={([newValue]) => handleFieldChange(field.key, newValue)}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
        </div>

        {/* Quick value buttons */}
        <div className="flex gap-1">
          {[0, max / 4, max / 2, (max * 3) / 4, max].map((quickValue) => (
            <Button
              key={quickValue}
              variant={value === quickValue ? "default" : "outline"}
              size="sm"
              onClick={() => handleFieldChange(field.key, quickValue)}
              className={cn(
                'flex-1 text-xs',
                compact ? 'h-6 px-1' : 'h-7 px-2'
              )}
            >
              {quickValue}{unit}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Spacing Presets */}
      {fields.some(f => ['paddingX', 'paddingY'].includes(f.key)) && (
        <div className="space-y-2">
          <Label className={cn(
            'font-medium text-muted-foreground uppercase tracking-wide',
            compact ? 'text-xs' : 'text-xs'
          )}>
            Presets
          </Label>
          <div className="grid grid-cols-2 gap-1">
            {SPACING_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetApply(preset)}
                className={cn(
                  'justify-start text-xs',
                  compact ? 'h-6 px-2' : 'h-7 px-3'
                )}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Individual Field Controls */}
      <div className={cn(
        'space-y-4',
        compact && 'space-y-3'
      )}>
        {fields.map(renderFieldControl)}
      </div>

      {/* Visual Spacing Preview */}
      {!compact && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Preview
          </Label>
          <div 
            className="bg-primary/10 border-2 border-dashed border-primary/30 rounded flex items-center justify-center"
            style={{
              paddingLeft: `${data.paddingX || 0}px`,
              paddingRight: `${data.paddingX || 0}px`,
              paddingTop: `${data.paddingY || 0}px`,
              paddingBottom: `${data.paddingY || 0}px`,
              borderRadius: `${data.borderRadius || 0}px`,
              minHeight: '40px'
            }}
          >
            <div className="bg-primary/20 px-2 py-1 rounded text-xs text-primary font-medium">
              Content Area
            </div>
          </div>
        </div>
      )}
    </div>
  );
}