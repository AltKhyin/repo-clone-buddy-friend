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
  category?: 'padding' | 'border' | 'other';
}

interface SpacingControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  fields?: SpacingField[];
  compact?: boolean;
  className?: string;
  showDetailedControls?: boolean;
  enablePresets?: boolean;
  enableBorders?: boolean;
}

// Import constants from separate file to avoid Fast Refresh warnings
import {
  PADDING_FIELDS,
  BORDER_FIELDS,
  DEFAULT_SPACING_FIELDS,
  SPACING_PRESETS,
} from './spacing-constants';

/**
 * @deprecated SpacingControls is being replaced by VisualPaddingEditor
 * Use VisualPaddingEditor for new implementations - provides intuitive visual editing
 * This component remains for backward compatibility during migration
 */
export function SpacingControls({
  data,
  onChange,
  fields = DEFAULT_SPACING_FIELDS,
  compact = false,
  className,
  showDetailedControls = true,
  enablePresets = true,
  enableBorders = true,
}: SpacingControlsProps) {
  console.warn('SpacingControls is deprecated. Please use VisualPaddingEditor for better UX.');
  const [isDetailedControlsOpen, setIsDetailedControlsOpen] = useState(false);
  const [linkedPadding, setLinkedPadding] = useState(false);

  const handleFieldChange = (fieldKey: string, value: number) => {
    const updates: Record<string, number> = { [fieldKey]: value };

    // Handle linked padding for individual 4-side system
    if (linkedPadding && ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].includes(fieldKey)) {
      updates.paddingTop = value;
      updates.paddingRight = value;
      updates.paddingBottom = value;
      updates.paddingLeft = value;
    }

    onChange(updates);
  };

  const handlePresetApply = (preset: (typeof SPACING_PRESETS)[0]) => {
    // Use current fields only
    const allFields = fields;

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
  const finalFields = [...fields];

  const paddingFields = finalFields.filter(f => f.category === 'padding');
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
      {enablePresets && finalFields.some(f => ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].includes(f.key)) && (
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
                linkedPadding && ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].includes(field.key)
              )
            )}
          </div>
        </div>
      )}

      {/* Margin Controls */}

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
              Future: Individual padding controls, unit selection (px, rem, %), responsive
              breakpoints
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

    </div>
  );
}
