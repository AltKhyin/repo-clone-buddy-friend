// ABOUTME: Context-aware typography controls that adapt based on block type and provide intelligent defaults

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  Type,
  Hash
} from 'lucide-react';

interface TypographyControlsProps {
  blockType: 'text' | 'heading' | 'quote' | 'reference';
  data: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  compact?: boolean;
  className?: string;
}

// Typography presets based on block type
const TYPOGRAPHY_PRESETS = {
  text: {
    fontSizes: [
      { label: 'Small', value: '0.875rem' },
      { label: 'Normal', value: '1rem' },
      { label: 'Medium', value: '1.125rem' },
      { label: 'Large', value: '1.25rem' },
    ],
    lineHeights: [1.4, 1.5, 1.6, 1.75],
    fontWeights: [
      { label: 'Normal', value: 400 },
      { label: 'Medium', value: 500 },
      { label: 'Semi Bold', value: 600 },
      { label: 'Bold', value: 700 },
    ]
  },
  heading: {
    fontSizes: [
      { label: 'H4', value: '1.25rem' },
      { label: 'H3', value: '1.5rem' },
      { label: 'H2', value: '1.875rem' },
      { label: 'H1', value: '2.25rem' },
    ],
    lineHeights: [1.1, 1.2, 1.3, 1.4],
    fontWeights: [
      { label: 'Medium', value: 500 },
      { label: 'Semi Bold', value: 600 },
      { label: 'Bold', value: 700 },
      { label: 'Extra Bold', value: 800 },
    ]
  },
  quote: {
    fontSizes: [
      { label: 'Normal', value: '1rem' },
      { label: 'Medium', value: '1.125rem' },
      { label: 'Large', value: '1.25rem' },
      { label: 'Extra Large', value: '1.375rem' },
    ],
    lineHeights: [1.5, 1.6, 1.75, 1.9],
    fontWeights: [
      { label: 'Normal', value: 400 },
      { label: 'Medium', value: 500 },
      { label: 'Semi Bold', value: 600 },
    ]
  },
  reference: {
    fontSizes: [
      { label: 'Small', value: '0.875rem' },
      { label: 'Normal', value: '1rem' },
      { label: 'Medium', value: '1.125rem' },
    ],
    lineHeights: [1.4, 1.5, 1.6],
    fontWeights: [
      { label: 'Normal', value: 400 },
      { label: 'Medium', value: 500 },
    ]
  }
};

const FONT_FAMILIES = [
  { label: 'System Default', value: 'inherit' },
  { label: 'Sans Serif', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', value: 'Menlo, Monaco, "Courier New", monospace' },
];

const TEXT_ALIGNMENTS = [
  { icon: AlignLeft, value: 'left', label: 'Align Left' },
  { icon: AlignCenter, value: 'center', label: 'Align Center' },
  { icon: AlignRight, value: 'right', label: 'Align Right' },
  { icon: AlignJustify, value: 'justify', label: 'Justify' },
];

export function TypographyControls({
  blockType,
  data,
  onChange,
  compact = false,
  className
}: TypographyControlsProps) {
  const presets = TYPOGRAPHY_PRESETS[blockType];
  
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const renderFontSizeControl = () => (
    <div className="space-y-2">
      <Label className={cn(
        'flex items-center gap-2 font-medium',
        compact ? 'text-xs' : 'text-sm'
      )}>
        <Type size={compact ? 12 : 14} />
        Font Size
      </Label>
      
      <div className="grid grid-cols-2 gap-1">
        {presets.fontSizes.map((size) => (
          <Button
            key={size.value}
            variant={data.fontSize === size.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange('fontSize', size.value)}
            className={cn(
              'text-xs justify-start',
              compact ? 'h-6 px-2' : 'h-7 px-3'
            )}
          >
            {size.label}
          </Button>
        ))}
      </div>
      
      {/* Custom font size input */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={data.fontSize || ''}
          onChange={(e) => handleChange('fontSize', e.target.value)}
          placeholder="Custom size"
          className={cn(
            'font-mono',
            compact ? 'h-6 text-xs' : 'h-8 text-sm'
          )}
        />
      </div>
    </div>
  );

  const renderFontWeightControl = () => (
    <div className="space-y-2">
      <Label className={cn(
        'flex items-center gap-2 font-medium',
        compact ? 'text-xs' : 'text-sm'
      )}>
        <Bold size={compact ? 12 : 14} />
        Font Weight
      </Label>
      
      <Select
        value={data.fontWeight?.toString() || '400'}
        onValueChange={(value) => handleChange('fontWeight', Number(value))}
      >
        <SelectTrigger className={compact ? 'h-6' : 'h-8'}>
          <SelectValue placeholder="Select weight" />
        </SelectTrigger>
        <SelectContent>
          {presets.fontWeights.map((weight) => (
            <SelectItem key={weight.value} value={weight.value.toString()}>
              <span style={{ fontWeight: weight.value }}>
                {weight.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderLineHeightControl = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className={cn(
          'font-medium',
          compact ? 'text-xs' : 'text-sm'
        )}>
          Line Height
        </Label>
        <span className="text-xs text-muted-foreground font-mono">
          {data.lineHeight || 1.5}
        </span>
      </div>
      
      <Slider
        value={[data.lineHeight || 1.5]}
        onValueChange={([value]) => handleChange('lineHeight', value)}
        min={1.0}
        max={2.5}
        step={0.1}
        className="w-full"
      />
      
      <div className="grid grid-cols-4 gap-1">
        {presets.lineHeights.map((height) => (
          <Button
            key={height}
            variant={data.lineHeight === height ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange('lineHeight', height)}
            className={cn(
              'text-xs',
              compact ? 'h-6 px-1' : 'h-7 px-2'
            )}
          >
            {height}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderTextAlignmentControl = () => (
    <div className="space-y-2">
      <Label className={cn(
        'font-medium',
        compact ? 'text-xs' : 'text-sm'
      )}>
        Text Alignment
      </Label>
      
      <div className="grid grid-cols-4 gap-1">
        {TEXT_ALIGNMENTS.map((alignment) => (
          <Button
            key={alignment.value}
            variant={data.textAlign === alignment.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange('textAlign', alignment.value)}
            className={cn(
              'justify-center',
              compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'
            )}
            title={alignment.label}
          >
            <alignment.icon size={compact ? 12 : 14} />
          </Button>
        ))}
      </div>
    </div>
  );

  const renderFontFamilyControl = () => (
    <div className="space-y-2">
      <Label className={cn(
        'font-medium',
        compact ? 'text-xs' : 'text-sm'
      )}>
        Font Family
      </Label>
      
      <Select
        value={data.fontFamily || 'inherit'}
        onValueChange={(value) => handleChange('fontFamily', value)}
      >
        <SelectTrigger className={compact ? 'h-6' : 'h-8'}>
          <SelectValue placeholder="Select font family" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              <span style={{ fontFamily: font.value }}>
                {font.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Typography preview component
  const renderPreview = () => {
    if (compact) return null;

    const previewStyle = {
      fontSize: data.fontSize || '1rem',
      fontWeight: data.fontWeight || 400,
      lineHeight: data.lineHeight || 1.5,
      textAlign: data.textAlign || 'left',
      fontFamily: data.fontFamily || 'inherit',
    } as React.CSSProperties;

    const sampleText = {
      text: 'This is sample text content showing how your typography settings will appear in the block.',
      heading: 'Sample Heading Text',
      quote: '"This is a sample quote showing how your typography settings will appear."',
      reference: 'Author, A. A. (2024). Sample reference title. Journal Name.'
    };

    return (
      <div className="p-3 bg-muted/30 rounded-lg">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
          Preview
        </Label>
        <div 
          style={previewStyle}
          className="text-foreground"
        >
          {sampleText[blockType]}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {renderFontSizeControl()}
      {renderFontWeightControl()}
      {renderLineHeightControl()}
      {renderTextAlignmentControl()}
      {renderFontFamilyControl()}
      {renderPreview()}
    </div>
  );
}