// ABOUTME: Unified slider control with input field, quick value buttons, and customizable constraints

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  quickValues?: number[];
  compact?: boolean;
  className?: string;
  disabled?: boolean;
  description?: string;
  // Visual customization
  showSlider?: boolean;
  showInput?: boolean;
  showQuickValues?: boolean;
  inputWidth?: string;
}

export function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  icon: Icon,
  quickValues,
  compact = false,
  className,
  disabled = false,
  description,
  showSlider = true,
  showInput = true,
  showQuickValues = true,
  inputWidth = 'w-16',
}: SliderControlProps) {
  // Generate default quick values if not provided
  const defaultQuickValues =
    quickValues ||
    [min, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max].filter(
      (val, index, arr) => arr.indexOf(val) === index
    ); // Remove duplicates

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  const handleQuickValueClick = (quickValue: number) => {
    onChange(quickValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Input Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={compact ? 12 : 14} className="text-muted-foreground" />}
          <div>
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{label}</Label>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>

        {showInput && (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={value}
              onChange={handleInputChange}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className={cn(
                inputWidth,
                'text-right font-mono',
                compact ? 'h-6 text-xs' : 'h-8 text-sm'
              )}
            />
            {unit && <span className="text-xs text-muted-foreground w-6">{unit}</span>}
          </div>
        )}
      </div>

      {/* Slider */}
      {showSlider && (
        <div className="px-2">
          <Slider
            value={[value]}
            onValueChange={([newValue]) => onChange(newValue)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-full"
          />
        </div>
      )}

      {/* Quick Value Buttons */}
      {showQuickValues && defaultQuickValues.length > 0 && (
        <div className="flex gap-1">
          {defaultQuickValues.map(quickValue => (
            <Button
              key={quickValue}
              variant={value === quickValue ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickValueClick(quickValue)}
              disabled={disabled}
              className={cn('flex-1 text-xs', compact ? 'h-6 px-1' : 'h-7 px-2')}
            >
              {quickValue}
              {unit}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// Specialized slider controls for common use cases
export const PaddingSlider = (props: Omit<SliderControlProps, 'max' | 'unit' | 'quickValues'>) => (
  <SliderControl {...props} max={80} unit="px" quickValues={[0, 8, 16, 24, 32]} />
);

export const MarginSlider = (props: Omit<SliderControlProps, 'max' | 'unit' | 'quickValues'>) => (
  <SliderControl {...props} max={80} unit="px" quickValues={[0, 4, 8, 16, 24]} />
);

export const BorderWidthSlider = (
  props: Omit<SliderControlProps, 'max' | 'unit' | 'quickValues'>
) => <SliderControl {...props} max={8} unit="px" quickValues={[0, 1, 2, 4, 6]} />;

export const BorderRadiusSlider = (
  props: Omit<SliderControlProps, 'max' | 'unit' | 'quickValues'>
) => <SliderControl {...props} max={32} unit="px" quickValues={[0, 4, 8, 12, 16, 24]} />;

export const FontSizeSlider = (
  props: Omit<SliderControlProps, 'min' | 'max' | 'unit' | 'quickValues'>
) => <SliderControl {...props} min={8} max={72} unit="px" quickValues={[12, 14, 16, 18, 24, 32]} />;

export const LineHeightSlider = (
  props: Omit<SliderControlProps, 'min' | 'max' | 'step' | 'quickValues'>
) => <SliderControl {...props} min={0.8} max={3} step={0.1} quickValues={[1, 1.2, 1.4, 1.6, 2]} />;

export const OpacitySlider = (
  props: Omit<SliderControlProps, 'min' | 'max' | 'step' | 'unit' | 'quickValues'>
) => (
  <SliderControl
    {...props}
    min={0}
    max={1}
    step={0.1}
    unit=""
    quickValues={[0, 0.25, 0.5, 0.75, 1]}
  />
);
