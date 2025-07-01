// ABOUTME: Unified typography controls with font family, size, weight, alignment, and text styling options

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SliderControl, FontSizeSlider, LineHeightSlider } from './SliderControl';
import { BackgroundControls } from './BackgroundControls';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  Palette,
} from 'lucide-react';

interface TypographyControlsProps {
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  // Control which sections to show
  showFontFamily?: boolean;
  showFontSize?: boolean;
  showFontWeight?: boolean;
  showLineHeight?: boolean;
  showAlignment?: boolean;
  showColor?: boolean;
  showDecorations?: boolean;
  showTransform?: boolean;
  showLetterSpacing?: boolean;
  // Layout
  compact?: boolean;
  className?: string;
  // Property keys customization
  fontFamilyKey?: string;
  fontSizeKey?: string;
  fontWeightKey?: string;
  lineHeightKey?: string;
  textAlignKey?: string;
  colorKey?: string;
  textDecorationKey?: string;
  textTransformKey?: string;
  letterSpacingKey?: string;
}

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Inherit' },
  { value: 'system-ui', label: 'System' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times' },
  { value: 'Courier New', label: 'Courier' },
  { value: 'monospace', label: 'Monospace' },
];

const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
];

const TEXT_DECORATIONS = [
  { value: 'none', label: 'None', icon: Type },
  { value: 'underline', label: 'Underline', icon: Underline },
  { value: 'line-through', label: 'Strikethrough', icon: Strikethrough },
];

const TEXT_TRANSFORMS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', icon: AlignLeft, label: 'Left' },
  { value: 'center', icon: AlignCenter, label: 'Center' },
  { value: 'right', icon: AlignRight, label: 'Right' },
  { value: 'justify', icon: AlignJustify, label: 'Justify' },
];

export function TypographyControls({
  data,
  onChange,
  showFontFamily = true,
  showFontSize = true,
  showFontWeight = true,
  showLineHeight = true,
  showAlignment = true,
  showColor = true,
  showDecorations = false,
  showTransform = false,
  showLetterSpacing = false,
  compact = false,
  className,
  fontFamilyKey = 'fontFamily',
  fontSizeKey = 'fontSize',
  fontWeightKey = 'fontWeight',
  lineHeightKey = 'lineHeight',
  textAlignKey = 'textAlign',
  colorKey = 'color',
  textDecorationKey = 'textDecoration',
  textTransformKey = 'textTransform',
  letterSpacingKey = 'letterSpacing',
}: TypographyControlsProps) {
  const fontFamily = data[fontFamilyKey] || 'inherit';
  const fontSize = data[fontSizeKey] || 16;
  const fontWeight = data[fontWeightKey] || 400;
  const lineHeight = data[lineHeightKey] || 1.4;
  const textAlign = data[textAlignKey] || 'left';
  const color = data[colorKey] || '#000000';
  const textDecoration = data[textDecorationKey] || 'none';
  const textTransform = data[textTransformKey] || 'none';
  const letterSpacing = data[letterSpacingKey] || 0;

  const updateField = (key: string, value: any) => {
    onChange({ [key]: value });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Font Family */}
      {showFontFamily && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type size={compact ? 12 : 14} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
              Font Family
            </Label>
          </div>
          <Select value={fontFamily} onValueChange={value => updateField(fontFamilyKey, value)}>
            <SelectTrigger className={cn(compact ? 'h-6 text-xs' : 'h-8 text-sm')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map(font => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Font Size */}
      {showFontSize && (
        <FontSizeSlider
          label="Font Size"
          value={fontSize}
          onChange={value => updateField(fontSizeKey, value)}
          compact={compact}
          icon={Type}
        />
      )}

      {/* Font Weight */}
      {showFontWeight && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bold size={compact ? 12 : 14} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
              Font Weight
            </Label>
          </div>
          <Select
            value={fontWeight.toString()}
            onValueChange={value => updateField(fontWeightKey, parseInt(value))}
          >
            <SelectTrigger className={cn(compact ? 'h-6 text-xs' : 'h-8 text-sm')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map(weight => (
                <SelectItem key={weight.value} value={weight.value.toString()}>
                  <span style={{ fontWeight: weight.value }}>{weight.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Line Height */}
      {showLineHeight && (
        <LineHeightSlider
          label="Line Height"
          value={lineHeight}
          onChange={value => updateField(lineHeightKey, value)}
          compact={compact}
        />
      )}

      {/* Text Alignment */}
      {showAlignment && (
        <div className="space-y-2">
          <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
            Text Alignment
          </Label>
          <div className="flex gap-1">
            {ALIGNMENT_OPTIONS.map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                size="sm"
                variant={textAlign === value ? 'default' : 'outline'}
                onClick={() => updateField(textAlignKey, value)}
                className={cn('flex-1', compact ? 'h-6 text-xs' : 'h-8 text-sm')}
                title={label}
              >
                <Icon size={compact ? 12 : 14} />
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Text Color */}
      {showColor && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette size={compact ? 12 : 14} className="text-muted-foreground" />
            <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>Text Color</Label>
          </div>
          <BackgroundControls
            data={{ [colorKey]: color }}
            onChange={updates => onChange(updates)}
            enableImage={false}
            compact={compact}
            colorKey={colorKey}
            defaultColor="#000000"
          />
        </div>
      )}

      {/* Text Decorations */}
      {showDecorations && (
        <div className="space-y-2">
          <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
            Text Decoration
          </Label>
          <div className="flex gap-1">
            {TEXT_DECORATIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                size="sm"
                variant={textDecoration === value ? 'default' : 'outline'}
                onClick={() => updateField(textDecorationKey, value)}
                className={cn('flex-1', compact ? 'h-6 text-xs' : 'h-8 text-sm')}
                title={label}
              >
                <Icon size={compact ? 12 : 14} />
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Text Transform */}
      {showTransform && (
        <div className="space-y-2">
          <Label className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
            Text Transform
          </Label>
          <Select
            value={textTransform}
            onValueChange={value => updateField(textTransformKey, value)}
          >
            <SelectTrigger className={cn(compact ? 'h-6 text-xs' : 'h-8 text-sm')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEXT_TRANSFORMS.map(transform => (
                <SelectItem key={transform.value} value={transform.value}>
                  {transform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Letter Spacing */}
      {showLetterSpacing && (
        <SliderControl
          label="Letter Spacing"
          value={letterSpacing}
          onChange={value => updateField(letterSpacingKey, value)}
          min={-2}
          max={4}
          step={0.1}
          unit="px"
          compact={compact}
          quickValues={[-1, 0, 0.5, 1, 2]}
        />
      )}

      {/* Typography Preview */}
      {!compact && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Typography Preview
          </Label>
          <div
            className="p-3 bg-background border rounded"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              lineHeight,
              textAlign: textAlign as any,
              color,
              textDecoration,
              textTransform: textTransform as any,
              letterSpacing: `${letterSpacing}px`,
            }}
          >
            The quick brown fox jumps over the lazy dog. This is a sample text to preview your
            typography settings.
          </div>
        </div>
      )}
    </div>
  );
}
