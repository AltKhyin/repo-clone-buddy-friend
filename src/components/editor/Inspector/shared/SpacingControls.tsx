// ABOUTME: Reusable spacing and dimension controls with visual feedback and constraint handling

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Move,
  ArrowLeftRight,
  ArrowUpDown,
  Square,
  Link,
  Unlink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface SpacingField {
  key: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  category?: 'padding' | 'margin' | 'border' | 'other';
}

interface SpacingControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  fields?: SpacingField[];
  compact?: boolean;
  className?: string;
  showDetailedControls?: boolean;
  enablePresets?: boolean;
  enableMargins?: boolean;
  enableBorders?: boolean;
}

// Import constants from separate file to avoid Fast Refresh warnings
import {
  PADDING_FIELDS,
  MARGIN_FIELDS,
  BORDER_FIELDS,
  DEFAULT_SPACING_FIELDS,
  SPACING_PRESETS,
} from './spacing-constants';

export function SpacingControls({
  data,
  onChange,
  fields = DEFAULT_SPACING_FIELDS,
  compact = false,
  className,
  showDetailedControls = true,
  enablePresets = true,
  enableMargins = false,
  enableBorders = true,
}: SpacingControlsProps) {
  const [isDetailedControlsOpen, setIsDetailedControlsOpen] = useState(false);
  const [linkedPadding, setLinkedPadding] = useState(false);
  const [linkedMargin, setLinkedMargin] = useState(false);

  const handleFieldChange = (fieldKey: string, value: number) => {
    const updates: Record<string, number> = { [fieldKey]: value };

    // Handle linked padding
    if (linkedPadding && ['paddingX', 'paddingY'].includes(fieldKey)) {
      updates.paddingX = value;
      updates.paddingY = value;
    }

    // Handle linked margin
    if (linkedMargin && ['marginX', 'marginY'].includes(fieldKey)) {
      updates.marginX = value;
      updates.marginY = value;
    }

    onChange(updates);
  };

  const handlePresetApply = (preset: (typeof SPACING_PRESETS)[0]) => {
    // Build combined fields list based on options
    const allFields = [...fields, ...(enableMargins ? MARGIN_FIELDS : [])];

    // Only apply values that exist in current fields
    const updates: Record<string, number> = {};
    allFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(preset.values, field.key)) {
        updates[field.key] = preset.values[field.key as keyof typeof preset.values];
      }
    });
    onChange(updates);
  };

  // Build the final fields array based on options
  const finalFields = [...fields, ...(enableMargins ? MARGIN_FIELDS : [])];

  const paddingFields = finalFields.filter(f => f.category === 'padding');
  const marginFields = finalFields.filter(f => f.category === 'margin');
  const borderFields = finalFields.filter(f => f.category === 'border');
  const otherFields = finalFields.filter(f => !f.category || f.category === 'other');

  const renderFieldControl = (field: SpacingField, isLinked = false) => {
    const value = data[field.key] || 0;
    const { min = 0, max = 100, step = 1, unit = 'px' } = field;

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {field.icon && (
              <field.icon size={compact ? 12 : 14} className="text-muted-foreground" />
            )}
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
              {field.label}
            </Label>
          </div>

          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={value}
              onChange={e => handleFieldChange(field.key, Number(e.target.value))}
              min={min}
              max={max}
              step={step}
              className={cn(
                'w-16 text-right font-mono',
                compact ? 'h-6 text-xs' : 'h-8 text-sm',
                isLinked && 'bg-blue-50 border-blue-200'
              )}
            />
            <span className="text-xs text-muted-foreground w-6">{unit}</span>
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
          {[0, max / 4, max / 2, (max * 3) / 4, max].map(quickValue => (
            <Button
              key={quickValue}
              variant={value === quickValue ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFieldChange(field.key, quickValue)}
              className={cn('flex-1 text-xs', compact ? 'h-6 px-1' : 'h-7 px-2')}
            >
              {quickValue}
              {unit}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Spacing Presets */}
      {enablePresets && finalFields.some(f => ['paddingX', 'paddingY'].includes(f.key)) && (
        <div className="space-y-2">
          <Label
            className={cn(
              'font-medium text-muted-foreground uppercase tracking-wide',
              compact ? 'text-xs' : 'text-xs'
            )}
          >
            Presets
          </Label>
          <div className="grid grid-cols-2 gap-1">
            {SPACING_PRESETS.map(preset => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetApply(preset)}
                className={cn('justify-start text-xs', compact ? 'h-6 px-2' : 'h-7 px-3')}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Padding Controls */}
      {paddingFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Padding
            </Label>
            {paddingFields.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinkedPadding(!linkedPadding)}
                className={cn('h-6 w-6 p-0', linkedPadding && 'bg-blue-100 text-blue-600')}
              >
                {linkedPadding ? <Link size={12} /> : <Unlink size={12} />}
              </Button>
            )}
          </div>
          <div className={cn('space-y-3', compact && 'space-y-2')}>
            {paddingFields.map(field =>
              renderFieldControl(
                field,
                linkedPadding && ['paddingX', 'paddingY'].includes(field.key)
              )
            )}
          </div>
        </div>
      )}

      {/* Margin Controls */}
      {marginFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Margin
            </Label>
            {marginFields.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinkedMargin(!linkedMargin)}
                className={cn('h-6 w-6 p-0', linkedMargin && 'bg-blue-100 text-blue-600')}
              >
                {linkedMargin ? <Link size={12} /> : <Unlink size={12} />}
              </Button>
            )}
          </div>
          <div className={cn('space-y-3', compact && 'space-y-2')}>
            {marginFields.map(field =>
              renderFieldControl(field, linkedMargin && ['marginX', 'marginY'].includes(field.key))
            )}
          </div>
        </div>
      )}

      {/* Border & Other Controls */}
      {(borderFields.length > 0 || otherFields.length > 0) && (
        <div className="space-y-3">
          {enableBorders && borderFields.length > 0 && (
            <>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Border & Radius
              </Label>
              <div className={cn('space-y-3', compact && 'space-y-2')}>
                {borderFields.map(field => renderFieldControl(field))}
              </div>
            </>
          )}
          {otherFields.length > 0 && (
            <div className={cn('space-y-3', compact && 'space-y-2')}>
              {otherFields.map(field => renderFieldControl(field))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Controls */}
      {showDetailedControls && (
        <Collapsible open={isDetailedControlsOpen} onOpenChange={setIsDetailedControlsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
              Detailed Spacing Options
              {isDetailedControlsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
              Future: Individual padding/margin controls, unit selection (px, rem, %), responsive
              breakpoints
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Enhanced Visual Preview */}
      {!compact && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Preview
          </Label>
          <div className="space-y-2">
            {/* Container with margin */}
            <div
              className="bg-red-100 border border-red-200 rounded"
              style={{
                marginLeft: `${data.marginX || 0}px`,
                marginRight: `${data.marginX || 0}px`,
                marginTop: `${data.marginY || 0}px`,
                marginBottom: `${data.marginY || 0}px`,
                padding: '2px',
              }}
            >
              {/* Content with padding */}
              <div
                className="bg-primary/10 border-2 border-dashed border-primary/30 rounded flex items-center justify-center"
                style={{
                  paddingLeft: `${data.paddingX || 0}px`,
                  paddingRight: `${data.paddingX || 0}px`,
                  paddingTop: `${data.paddingY || 0}px`,
                  paddingBottom: `${data.paddingY || 0}px`,
                  borderRadius: `${data.borderRadius || 0}px`,
                  borderWidth: `${data.borderWidth || 0}px`,
                  borderColor: data.borderColor || '#e5e7eb',
                  minHeight: '40px',
                }}
              >
                <div className="bg-primary/20 px-2 py-1 rounded text-xs text-primary font-medium">
                  Content
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span>Margin</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary/10 border-2 border-dashed border-primary/30 rounded"></div>
                <span>Padding</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
