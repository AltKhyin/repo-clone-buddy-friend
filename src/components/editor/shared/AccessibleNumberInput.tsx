// ABOUTME: Accessible number input component with custom increment/decrement controls for better UX

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccessibleNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  'aria-label'?: string;
  title?: string;
  suffix?: string; // e.g., "px", "%", "em"
  precision?: number; // decimal places
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
}

/**
 * Enhanced number input with accessible increment/decrement controls
 * Addresses UX issues where default browser arrows hide number values
 */
export const AccessibleNumberInput: React.FC<AccessibleNumberInputProps> = ({
  value,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
  className,
  placeholder,
  'aria-label': ariaLabel,
  title,
  suffix,
  precision = step < 1 ? 1 : 0,
  onMouseDown,
  onMouseUp,
}) => {
  const [inputValue, setInputValue] = useState(value.toFixed(precision));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const incrementIntervalRef = useRef<NodeJS.Timeout>();
  const decrementIntervalRef = useRef<NodeJS.Timeout>();

  // Update input value when prop changes (unless user is actively editing)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toFixed(precision));
    }
  }, [value, precision, isEditing]);

  // Precision-safe number rounding helper
  const roundToPrecision = useCallback((num: number): number => {
    if (precision === 0) return Math.round(num);
    const multiplier = Math.pow(10, precision);
    return Math.round(num * multiplier) / multiplier;
  }, [precision]);

  // Parse and validate input value
  const parseValue = useCallback((str: string): number => {
    const parsed = parseFloat(str);
    if (isNaN(parsed)) return value; // Return current value if invalid
    
    // Apply constraints with precision-safe rounding
    const constrained = Math.min(max, Math.max(min, parsed));
    return roundToPrecision(constrained);
  }, [value, min, max, roundToPrecision]);

  // Handle input changes with live validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only update parent if value is valid and different
    const parsed = parseValue(newValue);
    if (!isNaN(parsed) && parsed !== value) {
      onChange(parsed);
    }
  }, [parseValue, onChange, value]);

  // Handle input focus (start editing mode)
  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle input blur (end editing mode, validate final value)
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    
    const finalValue = parseValue(inputValue); // Already precision-safe
    
    // Ensure final value is properly formatted and within bounds
    setInputValue(finalValue.toFixed(precision));
    
    if (finalValue !== value) {
      onChange(finalValue);
    }
  }, [inputValue, parseValue, precision, onChange, value]);

  // Handle Enter key (commit value and blur)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    }
  }, []);

  // Increment value
  const increment = useCallback(() => {
    const newValue = roundToPrecision(Math.min(max, value + step));
    onChange(newValue);
  }, [value, step, max, onChange, roundToPrecision]);

  // Decrement value
  const decrement = useCallback(() => {
    const newValue = roundToPrecision(Math.max(min, value - step));
    onChange(newValue);
  }, [value, step, min, onChange, roundToPrecision]);

  // Handle increment button interactions with repeat
  const startIncrementing = useCallback(() => {
    increment();
    incrementIntervalRef.current = setInterval(increment, 100);
  }, [increment]);

  const stopIncrementing = useCallback(() => {
    if (incrementIntervalRef.current) {
      clearInterval(incrementIntervalRef.current);
      incrementIntervalRef.current = undefined;
    }
  }, []);

  // Handle decrement button interactions with repeat
  const startDecrementing = useCallback(() => {
    decrement();
    decrementIntervalRef.current = setInterval(decrement, 100);
  }, [decrement]);

  const stopDecrementing = useCallback(() => {
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = undefined;
    }
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      stopIncrementing();
      stopDecrementing();
    };
  }, [stopIncrementing, stopDecrementing]);

  return (
    <div className={cn("flex items-center border rounded-md bg-background", className)}>
      {/* Decrement Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || value <= min}
        className="h-full w-6 px-0 py-0 border-0 rounded-none hover:bg-muted"
        onMouseDown={(e) => {
          e.preventDefault();
          onMouseDown?.(e);
          startDecrementing();
        }}
        onMouseUp={(e) => {
          stopDecrementing();
          onMouseUp?.(e);
        }}
        onMouseLeave={stopDecrementing}
        aria-label={`Decrease ${ariaLabel || 'value'}`}
        title={`Decrease ${title || 'value'}`}
      >
        <ChevronDown className="h-3 w-3" />
      </Button>

      {/* Number Input */}
      <Input
        ref={inputRef}
        type="text" // Use text to avoid browser number controls
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        title={title}
        className="h-6 border-0 text-xs text-center flex-1 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 min-w-0"
        style={{ 
          appearance: 'textfield', // Remove number input styling
          MozAppearance: 'textfield', // Firefox
        }}
      />
      
      {/* Suffix Label */}
      {suffix && (
        <span className="text-xs text-muted-foreground px-1 pointer-events-none">
          {suffix}
        </span>
      )}

      {/* Increment Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || value >= max}
        className="h-full w-6 px-0 py-0 border-0 rounded-none hover:bg-muted"
        onMouseDown={(e) => {
          e.preventDefault();
          onMouseDown?.(e);
          startIncrementing();
        }}
        onMouseUp={(e) => {
          stopIncrementing();
          onMouseUp?.(e);
        }}
        onMouseLeave={stopIncrementing}
        aria-label={`Increase ${ariaLabel || 'value'}`}
        title={`Increase ${title || 'value'}`}
      >
        <ChevronUp className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default AccessibleNumberInput;