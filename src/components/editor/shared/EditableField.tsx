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
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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

    const handleStartEdit = (e: React.MouseEvent) => {
      if (!editable) return;

      e.stopPropagation();
      setIsEditing(true);
      onClick?.(e);
    };

    const handleFinishEdit = () => {
      setIsEditing(false);
      if (localValue !== value) {
        onUpdate(localValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel editing - revert to original value
        setLocalValue(value);
        setIsEditing(false);
      } else if (e.key === 'Enter' && type === 'input') {
        // Save on Enter for single-line inputs
        handleFinishEdit();
      }
      // For textarea, allow Enter to create new lines
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

    // Display mode
    return (
      <div
        className={cn(
          'cursor-text min-h-[1.5rem] whitespace-pre-wrap',
          !editable && 'cursor-default',
          shouldShowEmptyText && 'opacity-60',
          className
        )}
        style={style}
        onClick={handleStartEdit}
        data-text-selectable={editable ? 'true' : undefined}
        data-block-id={blockId}
      >
        {displayText}
      </div>
    );
  }
);

EditableField.displayName = 'EditableField';
