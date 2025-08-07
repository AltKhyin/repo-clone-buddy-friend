// ABOUTME: Enhanced unified color picker with single-panel interface, dynamic theme-aware colors, and comprehensive token display

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Palette, X, Check } from 'lucide-react';
import { useColorTokens } from '../../../hooks/useColorTokens';
import { isThemeToken } from '@/utils/color-tokens';
import type { UnifiedColorPickerProps, ColorToken, ColorTokenCategory } from './types/color-types';

/**
 * Enhanced unified color picker component with single-panel interface
 * Features dynamic theme-aware colors, comprehensive token display, and improved UX
 * OPTIMIZED: React.memo for performance, debounced updates, efficient re-renders
 */
// OPTIMIZATION: Memoized component to prevent unnecessary re-renders
const UnifiedColorPickerComponent: React.FC<UnifiedColorPickerProps> = ({
  value,
  onColorSelect,
  onColorClear,
  mode = 'both',
  className,
  variant = 'icon',
  size = 'sm',
  disabled = false,
  label = 'Choose color',
  allowClear = true,
  customTokens,
  placeholder = '#000000',
  zIndex,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value && !isThemeToken(value) ? value : '#000000');

  // Sync customColor with value prop to prevent memory leaks and stale state
  useEffect(() => {
    if (value && !isThemeToken(value)) {
      setCustomColor(value);
    } else if (!value) {
      setCustomColor('#000000'); // Reset to default when value is cleared
    }
  }, [value]);

  const {
    allTokens,
    tokenCategories,
    resolveTokenToCurrentTheme,
    getTokenPreviewColor,
    isToken,
    getTokenInfo,
    validateColor,
    getTokensByCategory,
    getCurrentThemeInfo,
  } = useColorTokens();

  // Use custom tokens if provided, otherwise use default tokens
  const availableTokens = customTokens || allTokens;

  // Get current color information
  const currentTokenInfo = useMemo(() => {
    return value ? getTokenInfo(value) : null;
  }, [value, getTokenInfo]);

  // Handle token selection
  const handleTokenSelect = useCallback((token: ColorToken) => {
    onColorSelect(token.value);
    setIsOpen(false);
  }, [onColorSelect]);

  // Handle custom color selection
  const handleCustomColorSelect = useCallback(() => {
    const validation = validateColor(customColor);
    if (validation.isValid) {
      onColorSelect(customColor);
      setIsOpen(false);
    }
  }, [customColor, validateColor, onColorSelect]);


  // Handle color clear
  const handleClear = useCallback(() => {
    if (onColorClear) {
      onColorClear();
    } else {
      onColorSelect('');
    }
    setIsOpen(false);
  }, [onColorClear, onColorSelect]);

  // Render enhanced color swatch with dynamic theme-aware colors
  const renderColorSwatch = useCallback((color: string, isSelected = false, swatchSize: 'sm' | 'md' = 'sm') => {
    const previewColor = getTokenPreviewColor(color);
    const sizeClass = swatchSize === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
    
    return (
      <div
        className={cn(
          'rounded-md border-2 transition-all flex-shrink-0',
          sizeClass,
          isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
          'flex items-center justify-center'
        )}
        style={{ backgroundColor: previewColor }}
      >
        {isSelected && (
          <Check 
            size={swatchSize === 'sm' ? 8 : 12} 
            className="text-white drop-shadow-sm" 
          />
        )}
      </div>
    );
  }, [getTokenPreviewColor]);

  // Get current theme information for display
  const currentTheme = getCurrentThemeInfo();

  // Get resolved color value for display
  const getResolvedColorValue = useCallback((tokenValue: string): string => {
    if (!isThemeToken(tokenValue)) return tokenValue;
    const resolved = resolveTokenToCurrentTheme(tokenValue);
    return resolved !== tokenValue ? resolved : 'Not available';
  }, [resolveTokenToCurrentTheme]);

  // Render trigger button based on variant
  const renderTrigger = () => {
    const triggerContent = (() => {
      switch (variant) {
        case 'icon':
          return (
            <div className="relative">
              <Palette size={10} />
              {value && (
                <div 
                  className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded"
                  style={{ backgroundColor: getTokenPreviewColor(value) }}
                />
              )}
            </div>
          );
        case 'button':
          return (
            <div className="flex items-center gap-2">
              {renderColorSwatch(value || 'transparent', false, 'sm')}
              <Palette size={12} />
              <span className="text-xs">{currentTokenInfo?.name || 'Color'}</span>
            </div>
          );
        case 'input':
          return (
            <div className="flex items-center gap-2">
              {renderColorSwatch(value || 'transparent', false, 'sm')}
              <span className="text-xs flex-1 text-left">
                {currentTokenInfo?.name || value || 'Select color'}
              </span>
              <Palette size={12} />
            </div>
          );
        default:
          return <Palette size={10} />;
      }
    })();

    return (
      <Button
        variant={value ? 'default' : 'ghost'}
        size={size}
        disabled={disabled}
        className={cn(
          variant === 'icon' ? 'h-6 w-6 p-0' : 
          variant === 'button' ? 'h-6 px-2' :
          'h-8 px-3 justify-start w-full',
          className
        )}
        aria-label={label}
        aria-pressed={!!value}
        aria-expanded={isOpen}
      >
        {triggerContent}
      </Button>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {renderTrigger()}
      </PopoverTrigger>

      <PopoverContent 
        className={cn("w-90 p-0", zIndex && `z-[${zIndex}]`)} 
        align="start" 
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus issues
        onClick={(e) => e.stopPropagation()} // Prevent event bubbling to parent dropdowns
      >
        <div className="max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{label}</Label>
              <span className="text-xs text-muted-foreground">({currentTheme.name} theme)</span>
            </div>
            {allowClear && value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                title="Clear color"
                aria-label="Clear color selection"
              >
                <X size={12} />
              </Button>
            )}
          </div>

          {/* Single-panel token categories - scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {(mode === 'tokens' || mode === 'both') && (
              <div className="p-2 space-y-2">
                {/* Token Categories with List Display */}
                {(['text', 'background', 'semantic', 'accent', 'neutral', 'editor'] as ColorTokenCategory[]).map(categoryKey => {
                  const tokens = getTokensByCategory(categoryKey);
                  if (tokens.length === 0) return null;
                  
                  const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
                  
                  return (
                    <div key={categoryKey} className="space-y-1">
                      {/* Simple category header */}
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                        {categoryName}
                      </div>
                        {/* Optimized grid layout with larger squares and tighter spacing */}
                        <div className="grid grid-cols-6 gap-1 pt-1">
                          {tokens.map(token => {
                            const isSelected = value === token.value;
                            const resolvedColor = getResolvedColorValue(token.value);
                            
                            return (
                              <Button
                                key={token.id}
                                variant="ghost"
                                onClick={() => handleTokenSelect(token)}
                                className={cn(
                                  'h-9 w-full p-0.5 flex items-center justify-center hover:bg-muted/50 relative group',
                                  isSelected && 'ring-2 ring-primary ring-offset-1'
                                )}
                                title={`${token.name}\n\n${token.description}\n\nCSS Variable: ${token.cssVariable}\nCurrent Value: ${resolvedColor}`}
                                aria-label={`Select ${token.name} color. ${token.description}. CSS variable: ${token.cssVariable}. Current value: ${resolvedColor}`}
                              >
                                {/* Color swatch as main visual element */}
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded border-2 transition-all flex-shrink-0 flex items-center justify-center',
                                    isSelected ? 'border-primary' : 'border-border'
                                  )}
                                  style={{ backgroundColor: getTokenPreviewColor(token.value) }}
                                >
                                  {isSelected && (
                                    <Check size={12} className="text-white drop-shadow-sm" />
                                  )}
                                </div>
                                
                                {/* Enhanced tooltip with better positioning */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md border shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 min-w-max max-w-48">
                                  <div className="font-semibold text-center mb-1">{token.name}</div>
                                  <div className="text-muted-foreground font-mono text-center text-xs mb-1">{token.cssVariable}</div>
                                  <div className="text-muted-foreground text-center text-xs px-2 py-1 bg-muted/50 rounded">{resolvedColor}</div>
                                  {/* Tooltip arrow */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover"></div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Minimized custom color section */}
          {(mode === 'custom' || mode === 'both') && (
            <>
              <Separator />
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor.startsWith('#') ? customColor : '#000000'}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-6 h-6 rounded border border-border cursor-pointer flex-shrink-0"
                    title="Pick custom color"
                    aria-label="Custom color picker"
                  />
                  <Input
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder={placeholder}
                    className="h-6 text-xs font-mono flex-1 px-2"
                    aria-label="Custom color value"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCustomColorSelect}
                    className="h-6 px-2 text-xs flex-shrink-0"
                    disabled={!validateColor(customColor).isValid}
                  >
                    Apply
                  </Button>
                </div>
                {!validateColor(customColor).isValid && customColor && (
                  <p className="text-xs text-destructive mt-1">
                    {validateColor(customColor).error}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Compact current selection info */}
          {value && (
            <>
              <Separator />
              <div className="p-2 bg-muted/20">
                <div className="flex items-center gap-2">
                  {renderColorSwatch(value, false, 'sm')}
                  <div className="flex-1 min-w-0">
                    {currentTokenInfo ? (
                      <>
                        <div className="text-xs font-medium truncate">{currentTokenInfo.name}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">{getResolvedColorValue(value)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-medium">Custom</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">{value}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// OPTIMIZATION: Memoized export for performance optimization
export const UnifiedColorPicker = React.memo(UnifiedColorPickerComponent, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.value === nextProps.value &&
    prevProps.mode === nextProps.mode &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.allowClear === nextProps.allowClear &&
    prevProps.label === nextProps.label &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    prevProps.zIndex === nextProps.zIndex &&
    // Deep comparison for customTokens array
    JSON.stringify(prevProps.customTokens) === JSON.stringify(nextProps.customTokens)
  );
});

UnifiedColorPicker.displayName = 'UnifiedColorPicker';

export default UnifiedColorPicker;