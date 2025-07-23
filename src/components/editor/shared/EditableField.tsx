// ABOUTME: Unified editable field component that eliminates edit/display toggle duplication across all block types

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface EditableFieldProps {
  /** Current value of the field */
  value: string;
  /** Callback when value changes */
  onUpdate: (value: string) => void;
  /** Placeholder text when editing */
  placeholder?: string;
  /** CSS classes for styling */
  className?: string;
  /** Style object for custom styling */
  style?: React.CSSProperties;
  /** Field type - input for single line, textarea for multi-line */
  type?: 'input' | 'textarea';
  /** Number of rows for textarea */
  rows?: number;
  /** Auto-resize textarea to fit content */
  autoResize?: boolean;
  /** Text to display when field is empty and not selected */
  emptyText?: string;
  /** Whether to show the empty text even when not selected */
  alwaysShowEmptyText?: boolean;
  /** Block ID for text selection integration */
  blockId?: string;
  /** Whether the parent block is selected */
  blockSelected?: boolean;
  /** Additional click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Whether the field should be editable */
  editable?: boolean;
}

export const EditableField = React.memo<EditableFieldProps>(
  ({
    value,
    onUpdate,
    placeholder = 'Click to edit...',
    className = '',
    style = {},
    type = 'input',
    rows = 1,
    autoResize = false,
    emptyText,
    alwaysShowEmptyText = false,
    blockId,
    blockSelected = false,
    onClick,
    editable = true,
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const [isSelecting, setIsSelecting] = useState(false);
    const [preservedSelection, setPreservedSelection] = useState<Range | null>(null);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const displayRef = useRef<HTMLElement>(null);

    // Sync local value with external value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Auto-focus when entering edit mode
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        // Select all text for easy replacement
        if (inputRef.current instanceof HTMLInputElement) {
          inputRef.current.select();
        } else {
          // For textarea, set cursor at end
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }
    }, [isEditing]);

    // Cleanup effect for event listeners
    useEffect(() => {
      return () => {
        // Clean up any pending event listeners
        const cleanupMouseUp = () => {
          document.removeEventListener('mouseup', cleanupMouseUp);
        };
        document.removeEventListener('mouseup', cleanupMouseUp);
      };
    }, []);

    // Intelligent mouse interaction handling
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!editable) return;

      setIsSelecting(true);
      
      // Save current selection before any potential mode change
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        setPreservedSelection(selection.getRangeAt(0).cloneRange());
      }

      // Allow natural text selection behavior
      e.stopPropagation();
      
      const startTime = Date.now();
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMouseUp = (upEvent: MouseEvent) => {
        const duration = Date.now() - startTime;
        const distanceX = Math.abs(upEvent.clientX - startX);
        const distanceY = Math.abs(upEvent.clientY - startY);
        const hasDragged = distanceX > 4 || distanceY > 4; // Slightly more forgiving
        
        const selection = window.getSelection();
        const hasSelectedText = selection && selection.toString().trim().length > 0;

        // Priority 1: If user selected text, don't enter edit mode
        if (hasSelectedText || hasDragged) {
          setIsSelecting(false);
          document.removeEventListener('mouseup', handleMouseUp);
          return;
        }

        // Priority 2: Quick click on empty field enters edit mode immediately
        const isEmpty = !value || value.trim() === '';
        if (isEmpty && duration < 250 && !hasDragged) {
          setIsEditing(true);
        }
        
        // Priority 3: Longer click on content with no selection may indicate edit intent
        else if (!isEmpty && duration > 400 && duration < 1000 && !hasDragged) {
          // Longer press on existing content - could be edit intent
          setIsEditing(true);
        }
        
        setIsSelecting(false);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mouseup', handleMouseUp);
      onClick?.(e);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      if (!editable) return;
      
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    };

    const handleStartEdit = () => {
      if (!editable) return;
      setIsEditing(true);
    };

    const handleFinishEdit = () => {
      setIsEditing(false);
      if (localValue !== value) {
        onUpdate(localValue);
      }
      
      // Restore selection if we had one
      if (preservedSelection && displayRef.current) {
        setTimeout(() => {
          try {
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(preservedSelection);
            }
          } catch (error) {
            // Selection restoration failed, ignore
            console.debug('Selection restoration failed:', error);
          }
          setPreservedSelection(null);
        }, 10);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isEditing) {
        if (e.key === 'Escape') {
          // Cancel editing - revert to original value
          setLocalValue(value);
          setIsEditing(false);
        } else if (e.key === 'Enter' && type === 'input') {
          // Save on Enter for single-line inputs
          handleFinishEdit();
        }
        // For textarea, allow Enter to create new lines
      } else {
        // Keyboard shortcuts for entering edit mode
        if ((e.key === 'F2' || (e.key === 'Enter' && !e.shiftKey)) && editable) {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }
      }
    };

    // Enhanced keyboard event handler for display mode
    const handleDisplayKeyDown = (e: React.KeyboardEvent) => {
      handleKeyDown(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
    };

    // Determine what text to display
    const isEmpty = !value || value.trim() === '';
    const shouldShowEmptyText = isEmpty && (alwaysShowEmptyText || blockSelected);
    const displayText = shouldShowEmptyText ? emptyText || placeholder : value;

    // Common input props
    const inputProps = {
      ref: inputRef as any,
      value: localValue,
      onChange: handleChange,
      onBlur: handleFinishEdit,
      onKeyDown: handleKeyDown,
      placeholder,
      className: cn(
        'border-0 p-0 bg-transparent resize-none focus:outline-none focus:ring-0',
        'min-h-[1.5rem]', // Ensure minimum height for clickability
        className
      ),
      style,
      autoFocus: true,
    };

    if (isEditing) {
      if (type === 'textarea') {
        return (
          <Textarea
            {...inputProps}
            rows={autoResize ? undefined : rows}
            className={cn(inputProps.className, autoResize && 'resize-none overflow-hidden')}
            onInput={
              autoResize
                ? e => {
                    // Auto-resize textarea to fit content
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }
                : undefined
            }
          />
        );
      } else {
        return <Input {...inputProps} />;
      }
    }

    // Always-selectable display mode
    const ElementType = type === 'textarea' ? 'p' : 'span';
    
    // Enhanced visual feedback for interaction states
    const getInteractionStyles = () => {
      if (!editable) return 'cursor-default select-none';
      
      if (isSelecting) {
        return 'cursor-text select-text bg-blue-50/30 dark:bg-blue-950/20';
      }
      
      if (shouldShowEmptyText) {
        return 'cursor-pointer hover:bg-muted/40 hover:border-dashed hover:border-border border border-transparent rounded-sm px-2 py-1 -mx-2 -my-1';
      }
      
      return 'cursor-text select-text hover:bg-muted/20 rounded-sm px-1 py-0.5 -mx-1 -my-0.5';
    };
    
    return (
      <ElementType
        ref={displayRef as any}
        className={cn(
          'min-h-[1.5rem] whitespace-pre-wrap transition-all duration-200',
          // Base styling
          'outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-50',
          // Dynamic interaction feedback
          getInteractionStyles(),
          // State-specific styling
          shouldShowEmptyText && 'opacity-60 italic',
          // Accessibility
          'focus-visible:outline-none',
          className
        )}
        style={{
          ...style,
          // Ensure text is always selectable when editable
          userSelect: editable ? 'text' : 'none',
          WebkitUserSelect: editable ? 'text' : 'none',
          MozUserSelect: editable ? 'text' : 'none',
          msUserSelect: editable ? 'text' : 'none',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleDisplayKeyDown}
        tabIndex={editable ? 0 : -1}
        role="textbox"
        aria-readonly={!isEditing}
        aria-multiline={type === 'textarea'}
        aria-label={shouldShowEmptyText ? `${placeholder} - Double-click to edit` : undefined}
        data-text-selectable={editable ? 'true' : undefined}
        data-block-id={blockId}
        data-interaction-state={isSelecting ? 'selecting' : shouldShowEmptyText ? 'empty' : 'content'}
        suppressContentEditableWarning={true}
      >
        {displayText}
      </ElementType>
    );
  }
);

EditableField.displayName = 'EditableField';
