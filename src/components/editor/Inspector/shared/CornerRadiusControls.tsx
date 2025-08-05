// ABOUTME: Standalone corner radius controls for independent border radius management

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Square } from 'lucide-react';

interface CornerRadiusControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  compact?: boolean;
  className?: string;
  // Control the radius property
  radiusKey?: string;
  // Default values
  defaultRadius?: number;
  // Constraints
  maxRadius?: number;
  // Labels
  label?: string;
}

export function CornerRadiusControls({
  data,
  onChange,
  compact = false,
  className,
  radiusKey = 'borderRadius',
  defaultRadius = 0,
  maxRadius = 32,
  label = 'Corner Radius',
}: CornerRadiusControlsProps) {
  const borderRadius = data[radiusKey] || defaultRadius;

  const handleRadiusChange = (radius: number) => {
    onChange({ [radiusKey]: radius });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Corner Radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Square size={compact ? 12 : 14} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{label}</Label>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={borderRadius}
              onChange={e => handleRadiusChange(Number(e.target.value))}
              min={0}
              max={maxRadius}
              className={cn('w-16 text-right font-mono', compact ? 'h-6 text-xs' : 'h-8 text-sm')}
            />
            <span className="text-xs text-muted-foreground w-6">px</span>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="px-2">
          <Slider
            value={[borderRadius]}
            onValueChange={([value]) => handleRadiusChange(value)}
            min={0}
            max={maxRadius}
            step={1}
            className="w-full"
          />
        </div>

        {/* Quick radius buttons */}
        <div className="flex gap-1">
          {[0, 4, 8, 12, 16, 24]
            .filter(val => val <= maxRadius)
            .map(radius => (
              <Button
                key={radius}
                variant={borderRadius === radius ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRadiusChange(radius)}
                className={cn('flex-1 text-xs', compact ? 'h-6 px-1' : 'h-7 px-2')}
              >
                {radius}px
              </Button>
            ))}
        </div>
      </div>

    </div>
  );
}
