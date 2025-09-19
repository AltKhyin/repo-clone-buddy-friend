// ABOUTME: Dialog for mobile layout generation with spacing multiplier settings and enhanced algorithm options

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, Settings } from 'lucide-react';

interface MobileGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (options: MobileGenerationOptions) => void;
}

export interface MobileGenerationOptions {
  spacingMultiplier: number;
  heightMultiplier: number;
  useEnhancedAlgorithm: boolean;
}

export function MobileGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
}: MobileGenerationDialogProps) {
  const [spacingMultiplier, setSpacingMultiplier] = useState([1.0]);
  const [heightMultiplier, setHeightMultiplier] = useState([1.1]); // Default to 10% taller
  const [useEnhancedAlgorithm, setUseEnhancedAlgorithm] = useState(true);

  const handleGenerate = () => {
    onGenerate({
      spacingMultiplier: spacingMultiplier[0],
      heightMultiplier: heightMultiplier[0],
      useEnhancedAlgorithm,
    });
    onOpenChange(false);
  };

  const getSpacingDescription = (multiplier: number) => {
    if (multiplier < 0.8) return 'Very Tight';
    if (multiplier < 1.0) return 'Tight';
    if (multiplier === 1.0) return 'Default';
    if (multiplier <= 1.5) return 'Relaxed';
    if (multiplier <= 2.0) return 'Spacious';
    return 'Very Spacious';
  };

  const getHeightDescription = (multiplier: number) => {
    if (multiplier < 0.9) return 'Compact';
    if (multiplier < 1.0) return 'Reduced';
    if (multiplier <= 1.1) return 'Optimized';
    if (multiplier <= 1.3) return 'Comfortable';
    if (multiplier <= 1.5) return 'Spacious';
    return 'Extra Tall';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw size={18} />
            Generate Mobile Layout
          </DialogTitle>
          <DialogDescription>
            Convert your desktop layout to mobile with intelligent spacing and positioning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Algorithm Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Algorithm</Label>
              <Badge variant={useEnhancedAlgorithm ? 'default' : 'secondary'}>
                {useEnhancedAlgorithm ? 'Enhanced' : 'Legacy'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant={useEnhancedAlgorithm ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseEnhancedAlgorithm(true)}
                className="flex-1 flex items-center gap-1"
              >
                <Zap size={14} />
                Enhanced
              </Button>
              <Button
                variant={!useEnhancedAlgorithm ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseEnhancedAlgorithm(false)}
                className="flex-1 flex items-center gap-1"
              >
                <Settings size={14} />
                Legacy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {useEnhancedAlgorithm
                ? 'Uses text-aware height calculations, content analysis, and intelligent spacing to prevent overflow'
                : 'Uses fixed 20px spacing with preserved heights (may cause text overflow)'
              }
            </p>
          </div>

          <Separator />

          {/* Spacing Multiplier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Spacing Multiplier</Label>
              <Badge variant="outline">
                {spacingMultiplier[0].toFixed(1)}x - {getSpacingDescription(spacingMultiplier[0])}
              </Badge>
            </div>

            <div className="space-y-2">
              <Slider
                value={spacingMultiplier}
                onValueChange={setSpacingMultiplier}
                min={0.5}
                max={3.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x (Tight)</span>
                <span>3.0x (Spacious)</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Multiplies {useEnhancedAlgorithm ? 'intelligent spacing values' : 'fixed 20px spacing'} by this factor.
              Use higher values for poorly optimized content that needs more breathing room.
            </p>
          </div>

          <Separator />

          {/* Height Multiplier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Height Multiplier</Label>
              <Badge variant="outline">
                {heightMultiplier[0].toFixed(1)}x - {getHeightDescription(heightMultiplier[0])}
              </Badge>
            </div>

            <div className="space-y-2">
              <Slider
                value={heightMultiplier}
                onValueChange={setHeightMultiplier}
                min={0.8}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.8x (Compact)</span>
                <span>2.0x (Extra Tall)</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {useEnhancedAlgorithm ?
                'Multiplies text-aware height calculations by this factor. Default 1.1x adds 10% for overflow prevention.' :
                'Multiplies preserved desktop heights by this factor.'
              }
            </p>
          </div>

          {/* Preview Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Preview</div>
            <div className="text-sm">
              Algorithm: <span className="font-medium">{useEnhancedAlgorithm ? 'Enhanced' : 'Legacy'}</span>
            </div>
            <div className="text-sm">
              Base spacing: <span className="font-medium">
                {useEnhancedAlgorithm ? '30-60px (content-aware)' : '20px (fixed)'}
              </span>
            </div>
            <div className="text-sm">
              Text reflow: <span className="font-medium">
                {useEnhancedAlgorithm ? 'Calculated based on width change' : 'Not adjusted'}
              </span>
            </div>
            <div className="text-sm">
              Final spacing: <span className="font-medium">
                {useEnhancedAlgorithm
                  ? `${Math.round(30 * spacingMultiplier[0])}-${Math.round(60 * spacingMultiplier[0])}px`
                  : `${Math.round(20 * spacingMultiplier[0])}px`
                }
              </span>
            </div>
            <div className="text-sm">
              Height calculation: <span className="font-medium">
                {useEnhancedAlgorithm
                  ? `Text-aware × ${heightMultiplier[0].toFixed(1)}x (+10% base)`
                  : `Desktop height × ${heightMultiplier[0].toFixed(1)}x`
                }
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="flex items-center gap-1">
            <RefreshCw size={14} />
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}