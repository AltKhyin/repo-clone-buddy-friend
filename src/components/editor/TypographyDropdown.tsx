// ABOUTME: Non-displacing typography controls dropdown for compact toolbar integration

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Type } from 'lucide-react';
import {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  TEXT_TRANSFORMS,
  TEXT_DECORATIONS,
} from './shared/typography-system';

interface TypographyDropdownProps {
  selectedNode: any;
  onFontFamily: (fontFamily: string) => void;
  onFontSize: (fontSize: number) => void;
  onFontWeight: (fontWeight: number) => void;
  onLineHeight: (lineHeight: number) => void;
  onTextTransform: (textTransform: string) => void;
  onTextColor: (color: string) => void;
  onTextDecoration: (decoration: string) => void;
  onLetterSpacing: (spacing: number) => void;
  disabled?: boolean;
}

export function TypographyDropdown({
  selectedNode,
  onFontFamily,
  onFontSize,
  onFontWeight,
  onLineHeight,
  onTextTransform,
  onTextColor,
  onTextDecoration,
  onLetterSpacing,
  disabled = false,
}: TypographyDropdownProps) {
  const [open, setOpen] = React.useState(false);

  if (!selectedNode) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-1 h-6 px-2"
          title="Typography controls (click for options)"
        >
          <Type size={10} />
          <span className="hidden lg:inline text-xs">Type</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" side="bottom" sideOffset={4}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Type size={14} />
            <h3 className="font-semibold text-sm">Typography</h3>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Font Family</Label>
            <Select value={selectedNode.data.fontFamily || 'inherit'} onValueChange={onFontFamily}>
              <SelectTrigger className="w-full h-8 text-sm">
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

          {/* Font Size & Line Height Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Font Size</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={selectedNode.data.fontSize || 16}
                  onChange={e => onFontSize(parseInt(e.target.value) || 16)}
                  className="h-8 text-sm flex-1"
                  min={8}
                  max={128}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Line Height</Label>
              <Input
                type="number"
                value={selectedNode.data.lineHeight || 1.4}
                onChange={e => onLineHeight(parseFloat(e.target.value) || 1.4)}
                className="h-8 text-sm"
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>
          </div>

          {/* Font Weight */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Font Weight</Label>
            <Select
              value={(selectedNode.data.fontWeight || 400).toString()}
              onValueChange={value => onFontWeight(parseInt(value))}
            >
              <SelectTrigger className="w-full h-8 text-sm">
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

          {/* Text Transform & Text Decoration Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Text Transform</Label>
              <Select
                value={selectedNode.data.textTransform || 'none'}
                onValueChange={onTextTransform}
              >
                <SelectTrigger className="w-full h-8 text-sm">
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

            <div className="space-y-2">
              <Label className="text-xs font-medium">Text Decoration</Label>
              <Select
                value={selectedNode.data.textDecoration || 'none'}
                onValueChange={onTextDecoration}
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_DECORATIONS.map(decoration => (
                    <SelectItem key={decoration.value} value={decoration.value}>
                      <div className="flex items-center gap-2">
                        <decoration.icon size={12} />
                        {decoration.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Letter Spacing & Color Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Letter Spacing</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={selectedNode.data.letterSpacing || 0}
                  onChange={e => onLetterSpacing(parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm flex-1"
                  min={-2}
                  max={4}
                  step={0.1}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Text Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedNode.data.color || '#000000'}
                  onChange={e => onTextColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                  title="Text color"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTextColor('')}
                  className="h-8 px-2 text-xs flex-1"
                  title="Reset to default"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
