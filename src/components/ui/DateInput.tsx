// ABOUTME: Brazilian date input component with right-aligned calendar icon and dd/mm/yyyy format
import * as React from "react"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateInputProps extends Omit<React.ComponentProps<"input">, 'type'> {
  placeholder?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, placeholder = "Data de Nascimento", onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    React.useEffect(() => {
      if (props.value) {
        setHasValue(String(props.value).length > 0);
      }
    }, [props.value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      onBlur?.(e);
    };

    const shouldShowPlaceholder = !isFocused && !hasValue;

    return (
      <div className="relative">
        <input
          type="date"
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "pr-10", // Make room for calendar icon on right
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
          // Remove the placeholder from the input itself since we handle it with overlay
          placeholder=""
          style={{
            ...props.style,
            // Hide the default browser placeholder when focused
            colorScheme: 'light',
          }}
        />
        
        {/* Custom placeholder that only shows when not focused and no value */}
        {shouldShowPlaceholder && (
          <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
            <span className="text-gray-500 text-sm">
              {placeholder}
            </span>
          </div>
        )}
        
        {/* Right-aligned calendar icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        
        {/* Styles to improve Brazilian date format handling */}
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator {
            opacity: 0;
            position: absolute;
            right: 0;
            width: 40px;
            height: 100%;
            cursor: pointer;
            z-index: 10;
          }
          
          input[type="date"] {
            position: relative;
          }
          
          /* Improve date format display */
          input[type="date"]::-webkit-datetime-edit-text {
            padding: 0 1px;
          }
          
          input[type="date"]::-webkit-datetime-edit-day-field:focus,
          input[type="date"]::-webkit-datetime-edit-month-field:focus,
          input[type="date"]::-webkit-datetime-edit-year-field:focus {
            background-color: #e3f2fd;
            outline: none;
          }
          
          /* Better Brazilian locale support */
          input[type="date"]:lang(pt-BR) {
            text-align: left;
          }
        `}</style>
      </div>
    );
  }
)
DateInput.displayName = "DateInput"

export { DateInput }