// ABOUTME: Color picker dropdown for text highlights with preset color palette and custom color option

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Highlighter, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Highlight color palette with accessibility-friendly colors
export const HIGHLIGHT_COLORS = [
  // Traditional highlights
  { 
    name: 'Yellow', 
    value: '#ffeb3b', 
    className: 'bg-yellow-200 hover:bg-yellow-300',
    description: 'Classic yellow highlight'
  },
  { 
    name: 'Orange', 
    value: '#ffcc80', 
    className: 'bg-orange-200 hover:bg-orange-300',
    description: 'Orange highlight'
  },
  { 
    name: 'Green', 
    value: '#c8e6c9', 
    className: 'bg-green-200 hover:bg-green-300',
    description: 'Green highlight'
  },
  
  // Modern highlights
  { 
    name: 'Blue', 
    value: '#bbdefb', 
    className: 'bg-blue-200 hover:bg-blue-300',
    description: 'Blue highlight'
  },
  { 
    name: 'Purple', 
    value: '#e1bee7', 
    className: 'bg-purple-200 hover:bg-purple-300',
    description: 'Purple highlight'
  },
  { 
    name: 'Pink', 
    value: '#f8bbd9', 
    className: 'bg-pink-200 hover:bg-pink-300',
    description: 'Pink highlight'
  },
  
  // Neutral highlights
  { 
    name: 'Gray', 
    value: '#e0e0e0', 
    className: 'bg-gray-200 hover:bg-gray-300',
    description: 'Gray highlight'
  },
  { 
    name: 'Light Blue', 
    value: '#e3f2fd', 
    className: 'bg-sky-100 hover:bg-sky-200',
    description: 'Light blue highlight'
  },
] as const;

export interface HighlightColorPickerProps {
  /** Current selected color */
  value?: string;
  /** Callback when color is selected */
  onColorSelect: (color: string) => void;
  /** Callback when highlight is removed */
  onRemoveHighlight: () => void;
  /** Whether highlighting is currently active */
  isActive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show as icon button or full button */
  variant?: 'icon' | 'button';
  /** Button size */
  size?: 'sm' | 'default';
}

export const HighlightColorPicker: React.FC<HighlightColorPickerProps> = ({
  value = '#ffeb3b',
  onColorSelect,
  onRemoveHighlight,
  isActive = false,
  className,
  variant = 'icon',
  size = 'sm',
}) => {
  const [customColor, setCustomColor] = useState('#ffeb3b');
  const [isOpen, setIsOpen] = useState(false);

  // Find current color in palette
  const currentColor = HIGHLIGHT_COLORS.find(color => color.value === value);

  const handlePresetColorSelect = (colorValue: string) => {
    onColorSelect(colorValue);
    setIsOpen(false);
  };

  const handleCustomColorSelect = () => {
    onColorSelect(customColor);
    setIsOpen(false);
  };

  const handleRemoveHighlight = () => {
    onRemoveHighlight();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'ghost'}
          size={size}
          className={cn(
            variant === 'icon' ? 'h-6 w-6 p-0' : 'h-6 px-2',
            className
          )}
          title="Highlight color"
          aria-label="Choose highlight color"
          aria-pressed={isActive}
        >
          {variant === 'icon' ? (
            <div className="relative">
              <Highlighter size={10} />
              {/* Color indicator */}
              {isActive && (
                <div 
                  className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded"
                  style={{ backgroundColor: value }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Highlighter size={12} />
              <span className="text-xs">Highlight</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56 p-2" align="start">
        <DropdownMenuLabel className="flex items-center gap-1 text-xs">
          <Palette size={12} />
          Highlight Colors
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Preset Colors Grid */}
        <div className="grid grid-cols-4 gap-1 mb-3">
          {HIGHLIGHT_COLORS.map((color) => (
            <Button
              key={color.value}
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0 rounded border-2 transition-all',
                color.className,
                value === color.value 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-transparent hover:border-primary/50'
              )}
              onClick={() => handlePresetColorSelect(color.value)}
              title={color.description}
              aria-label={`Select ${color.name} highlight`}
            >
              <span className="sr-only">{color.name}</span>
            </Button>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Custom Color Section */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Custom Color:</label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-8 h-6 p-0 border-0 bg-transparent cursor-pointer"
              title="Custom highlight color"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCustomColorSelect}
              className="h-6 px-2 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Remove Highlight */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveHighlight}
          className="w-full h-6 text-xs text-muted-foreground hover:text-destructive"
        >
          <X size={12} className="mr-1" />
          Remove Highlight
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HighlightColorPicker;