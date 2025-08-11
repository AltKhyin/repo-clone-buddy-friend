// ABOUTME: Enhanced 4-slider padding editor with viewport-independent controls and true zero padding support

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Link, 
  Unlink,
  Info,
  Monitor,
  Smartphone
} from 'lucide-react';
import { 
  validatePaddingValue, 
  getViewportPadding, 
  setViewportPadding,
  type Viewport,
  type ViewportPadding
} from '@/types/editor';

interface PaddingData {
  // Individual padding (legacy)
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  
  // Viewport-specific padding (enhanced)
  desktopPadding?: ViewportPadding;
  mobilePadding?: ViewportPadding;
  
  // Legacy symmetric padding
  paddingX?: number;
  paddingY?: number;
}

interface VisualPaddingEditorProps {
  data: PaddingData;
  onChange: (updates: PaddingData) => void;
  className?: string;
}

export function VisualPaddingEditor({ data, onChange, className }: VisualPaddingEditorProps) {
  const [linkMode, setLinkMode] = useState<'none' | 'all' | 'vertical' | 'horizontal'>('none');
  const [currentViewport, setCurrentViewport] = useState<Viewport>('desktop');

  // Get current padding values for the selected viewport using enhanced schema
  const currentPadding = getViewportPadding(data, currentViewport, { top: 16, right: 16, bottom: 16, left: 16 });
  const paddingTop = currentPadding.top ?? 16;
  const paddingRight = currentPadding.right ?? 16;
  const paddingBottom = currentPadding.bottom ?? 16;
  const paddingLeft = currentPadding.left ?? 16;

  // Handle padding value changes with linking logic and validation for viewport-specific padding
  const handlePaddingChange = useCallback((side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const validatedValue = validatePaddingValue(value);
    const currentPadding = getViewportPadding(data, currentViewport);
    let newPadding: ViewportPadding = { ...currentPadding };

    switch (linkMode) {
      case 'all':
        // Link all sides
        newPadding = {
          top: validatedValue,
          right: validatedValue,
          bottom: validatedValue,
          left: validatedValue,
        };
        break;
      case 'vertical':
        if (side === 'top' || side === 'bottom') {
          // Link top/bottom
          newPadding.top = validatedValue;
          newPadding.bottom = validatedValue;
        } else {
          // Only update the specific side
          newPadding[side] = validatedValue;
        }
        break;
      case 'horizontal':
        if (side === 'left' || side === 'right') {
          // Link left/right
          newPadding.left = validatedValue;
          newPadding.right = validatedValue;
        } else {
          // Only update the specific side
          newPadding[side] = validatedValue;
        }
        break;
      default:
        // No linking - update only the specific side
        newPadding[side] = validatedValue;
        break;
    }

    // Update the block data with the new viewport-specific padding
    const updates = setViewportPadding(data, currentViewport, newPadding);
    onChange(updates);
  }, [onChange, linkMode, currentViewport, data]);


  // Check for zero padding (true edge-to-edge content)
  const allValuesAreZero = paddingTop === 0 && paddingRight === 0 && paddingBottom === 0 && paddingLeft === 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with viewport selector and visual feedback */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Padding
            </Label>
            {allValuesAreZero && (
              <div className="flex items-center gap-1">
                <Info size={12} className="text-blue-500" />
                <span className="text-xs text-blue-600">True zero padding</span>
              </div>
            )}
          </div>
          
          {/* Viewport selector */}
          <div className="flex items-center rounded-md border border-input bg-background p-1">
            <Button
              variant={currentViewport === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewport('desktop')}
              className="h-6 px-2 text-xs gap-1"
            >
              <Monitor size={10} />
              Desktop
            </Button>
            <Button
              variant={currentViewport === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewport('mobile')}
              className="h-6 px-2 text-xs gap-1"
            >
              <Smartphone size={10} />
              Mobile
            </Button>
          </div>
        </div>
        
        {/* Link controls */}
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            {currentViewport === 'desktop' ? 'Desktop Padding' : 'Mobile Padding'}
          </Label>
          <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLinkMode(linkMode === 'all' ? 'none' : 'all')}
            className={cn('h-6 w-6 p-0', linkMode === 'all' && 'bg-blue-100 text-blue-600')}
            title="Link all sides"
          >
            <Link size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLinkMode(linkMode === 'vertical' ? 'none' : 'vertical')}
            className={cn('h-6 w-6 p-0', linkMode === 'vertical' && 'bg-green-100 text-green-600')}
            title="Link top/bottom"
          >
            <div className="flex flex-col items-center">
              <div className="w-2 h-0.5 bg-current mb-0.5"></div>
              <div className="w-2 h-0.5 bg-current"></div>
            </div>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLinkMode(linkMode === 'horizontal' ? 'none' : 'horizontal')}
            className={cn('h-6 w-6 p-0', linkMode === 'horizontal' && 'bg-orange-100 text-orange-600')}
            title="Link left/right"
          >
            <div className="flex items-center">
              <div className="w-0.5 h-2 bg-current mr-0.5"></div>
              <div className="w-0.5 h-2 bg-current"></div>
            </div>
          </Button>
          {linkMode !== 'none' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkMode('none')}
              className="h-6 w-6 p-0"
              title="Unlink all"
            >
              <Unlink size={12} />
            </Button>
          )}
          </div>
        </div>
      </div>

      {/* Link mode indicator */}
      {linkMode !== 'none' && (
        <div className="text-xs text-muted-foreground text-center py-1 px-2 bg-muted/30 rounded">
          {linkMode === 'all' && 'All sides linked'}
          {linkMode === 'vertical' && 'Top/Bottom linked'}
          {linkMode === 'horizontal' && 'Left/Right linked'}
        </div>
      )}

      {/* Four sliders */}
      <div className="space-y-3">
        {/* Top */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Top
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={paddingTop}
                onChange={(e) => handlePaddingChange('top', Number(e.target.value))}
                className={cn(
                  "w-16 h-7 text-xs text-right",
                  paddingTop === 0 && "border-blue-300 bg-blue-50 text-blue-700"
                )}
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            value={[paddingTop]}
            onValueChange={([value]) => handlePaddingChange('top', value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Right */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Right
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={paddingRight}
                onChange={(e) => handlePaddingChange('right', Number(e.target.value))}
                className={cn(
                  "w-16 h-7 text-xs text-right",
                  paddingRight === 0 && "border-blue-300 bg-blue-50 text-blue-700"
                )}
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            value={[paddingRight]}
            onValueChange={([value]) => handlePaddingChange('right', value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Bottom */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Bottom
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={paddingBottom}
                onChange={(e) => handlePaddingChange('bottom', Number(e.target.value))}
                className={cn(
                  "w-16 h-7 text-xs text-right",
                  paddingBottom === 0 && "border-blue-300 bg-blue-50 text-blue-700"
                )}
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            value={[paddingBottom]}
            onValueChange={([value]) => handlePaddingChange('bottom', value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Left */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Left
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={paddingLeft}
                onChange={(e) => handlePaddingChange('left', Number(e.target.value))}
                className={cn(
                  "w-16 h-7 text-xs text-right",
                  paddingLeft === 0 && "border-blue-300 bg-blue-50 text-blue-700"
                )}
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <Slider
            value={[paddingLeft]}
            onValueChange={([value]) => handlePaddingChange('left', value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Enhanced information about true zero padding */}
      {allValuesAreZero && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <div className="font-medium mb-1">True Zero Padding Active:</div>
              <div className="text-blue-600 space-y-1">
                <div>• Content touches block edges directly</div>
                <div>• Creates seamless layouts between adjacent blocks</div>
                <div>• Perfect for edge-to-edge content presentation</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}