// ABOUTME: Unified border controls component for all block inspector panels

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SafeSwitch } from '../SafeSwitch';
import { Palette, X } from 'lucide-react';

interface BorderControlsProps {
  borderWidth?: number;
  borderColor?: string;
  onChange: (updates: { borderWidth?: number; borderColor?: string }) => void;
  compact?: boolean;
}

const PRESET_COLORS = [
  '#e5e7eb', // gray-200
  '#6b7280', // gray-500
  '#374151', // gray-700
  '#000000', // black
  '#ffffff', // white
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
];

export function BorderControls({ 
  borderWidth = 0, 
  borderColor = '#e5e7eb', 
  onChange, 
  compact = false 
}: BorderControlsProps) {
  const hasBorder = borderWidth > 0;

  const handleBorderToggle = (checked: boolean) => {
    onChange({ borderWidth: checked ? 1 : 0 });
  };

  const handleWidthChange = (values: number[]) => {
    onChange({ borderWidth: values[0] });
  };

  const handleColorChange = (color: string) => {
    onChange({ borderColor: color });
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ borderColor: e.target.value });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Border:</Label>
          <SafeSwitch
            checked={hasBorder}
            onCheckedChange={handleBorderToggle}
          />
        </div>

        {hasBorder && (
          <>
            <div className="flex items-center gap-1">
              <Label className="text-xs">Width:</Label>
              <Input
                type="number"
                value={borderWidth}
                onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
                className="w-12 h-6 text-xs"
                min={1}
                max={10}
              />
            </div>

            <div className="flex items-center gap-1">
              <Label className="text-xs">Color:</Label>
              <div className="flex items-center gap-1">
                <div
                  className="w-6 h-6 rounded border cursor-pointer"
                  style={{ backgroundColor: borderColor }}
                  onClick={() => {
                    // Simple color cycling for compact mode
                    const currentIndex = PRESET_COLORS.indexOf(borderColor);
                    const nextIndex = (currentIndex + 1) % PRESET_COLORS.length;
                    handleColorChange(PRESET_COLORS[nextIndex]);
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Border</Label>
        <SafeSwitch
          checked={hasBorder}
          onCheckedChange={handleBorderToggle}
        />
      </div>

      {hasBorder && (
        <>
          <Separator />
          
          {/* Border Width */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Width</Label>
              <span className="text-xs text-muted-foreground">{borderWidth}px</span>
            </div>
            <Slider
              value={[borderWidth]}
              onValueChange={handleWidthChange}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Border Color */}
          <div className="space-y-2">
            <Label className="text-sm">Color</Label>
            
            {/* Color Input */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border-2 border-border cursor-pointer"
                style={{ backgroundColor: borderColor }}
              />
              <Input
                type="text"
                value={borderColor}
                onChange={handleColorInputChange}
                placeholder="#000000"
                className="flex-1 h-8"
              />
            </div>

            {/* Preset Colors */}
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <Button
                  key={color}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 border-2"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                >
                  {borderColor === color && (
                    <div className="w-3 h-3 rounded-full bg-white border border-gray-400" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}