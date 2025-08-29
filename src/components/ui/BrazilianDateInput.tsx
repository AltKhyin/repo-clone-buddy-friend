// ABOUTME: Brazilian date input with proper dd/mm/yyyy formatting and locale handling
import * as React from "react"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrazilianDateInputProps extends Omit<React.ComponentProps<"input">, 'type' | 'value' | 'onChange'> {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const BrazilianDateInput = React.forwardRef<HTMLInputElement, BrazilianDateInputProps>(
  ({ className, placeholder = "Data de Nascimento", value = "", onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState("");
    const [internalValue, setInternalValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Convert ISO date (yyyy-mm-dd) to Brazilian display format (dd/mm/yyyy)
    const formatDateForDisplay = (isoDate: string): string => {
      if (!isoDate) return "";
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    };

    // Convert Brazilian format (dd/mm/yyyy) to ISO format (yyyy-mm-dd)
    const formatDateForISO = (brazilianDate: string): string => {
      if (!brazilianDate || brazilianDate.length !== 10) return "";
      const [day, month, year] = brazilianDate.split('/');
      if (!day || !month || !year) return "";
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    // Mask input to dd/mm/yyyy format
    const applyDateMask = (input: string): string => {
      // Remove all non-digits
      const digits = input.replace(/\D/g, '');
      
      // Apply mask progressively
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    };

    React.useEffect(() => {
      // Initialize display value from prop value (ISO format)
      if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const formatted = formatDateForDisplay(value);
        setDisplayValue(formatted);
        setInternalValue(value);
      } else if (value) {
        setDisplayValue(value);
        setInternalValue(formatDateForISO(value));
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const maskedValue = applyDateMask(inputValue);
      
      setDisplayValue(maskedValue);
      
      // Convert to ISO format and call onChange if valid
      if (maskedValue.length === 10) {
        const isoDate = formatDateForISO(maskedValue);
        if (isoDate) {
          setInternalValue(isoDate);
          onChange?.(isoDate);
        }
      } else {
        onChange?.(maskedValue); // Pass partial value for validation
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const shouldShowPlaceholder = !isFocused && !displayValue;

    return (
      <div className="relative">
        <input
          type="text"
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          value={displayValue}
          onChange={handleInputChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "pr-10", // Make room for calendar icon on right
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? "dd/mm/aaaa" : ""}
          maxLength={10}
          {...props}
        />
        
        {/* Custom placeholder that only shows when not focused and no value */}
        {shouldShowPlaceholder && (
          <div 
            className="absolute inset-0 flex items-center px-3 cursor-text z-10"
            onClick={() => {
              // Focus the main text input when placeholder is clicked
              inputRef.current?.focus();
            }}
          >
            <span className="text-gray-500 text-base">
              {placeholder}
            </span>
          </div>
        )}
        
        {/* Right-aligned calendar icon - clicks focus main input */}
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-20"
          onClick={() => {
            // Focus the main text input when calendar icon is clicked
            inputRef.current?.focus();
          }}
        >
          <Calendar className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
        </div>
      </div>
    );
  }
)
BrazilianDateInput.displayName = "BrazilianDateInput"

export { BrazilianDateInput }