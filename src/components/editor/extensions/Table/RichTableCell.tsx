// ABOUTME: Rich table cell component with full typography support using embedded TipTap editor

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { 
  TableCellEditorOptions,
  extractPlainTextFromRichContent,
  convertPlainTextToRichContent,
  isValidRichContent,
  EMPTY_RICH_CELL_CONTENT
} from './tableEditorConfig';
import { optimizeForDisplay } from './utils/richContentRenderer';
import { performanceOptimizedTableCellManager } from './performance/PerformanceOptimizedTableCellManager';
import { createTypographyCommands } from '../../shared/typography-commands';
import { tableSelectionCoordinator } from './selection/TableSelectionCoordinator';

interface RichTableCellProps {
  /** Cell content (rich HTML or plain text) */
  content: string;
  /** Whether this is a header cell */
  isHeader?: boolean;
  /** Cell position for navigation and identification */
  position: {
    row: number;
    col: number;
  };
  /** Table styling configuration */
  styling: {
    cellPadding: number;
    fontSize: number;
    fontWeight: number;
    textAlign: 'left' | 'center' | 'right';
    borderColor: string;
    headerBackgroundColor?: string;
  };
  /** Whether the cell is currently selected/focused */
  isSelected?: boolean;
  /** Whether the entire table is selected */
  isTableSelected?: boolean;
  /** Callback when content changes */
  onContentChange: (content: string) => void;
  /** Callback when cell gains focus */
  onFocus?: () => void;
  /** Callback when cell loses focus */
  onBlur?: () => void;
  /** Callback for keyboard navigation */
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'enter' | 'tab') => void;
  /** Unique identifier for this cell */
  cellId: string;
}

export const RichTableCell = React.memo(React.forwardRef<RichTableCellRef, RichTableCellProps>(({
  content,
  isHeader = false,
  position,
  styling,
  isSelected = false,
  isTableSelected = false,
  onContentChange,
  onFocus,
  onBlur,
  onNavigate,
  cellId,
}, ref) => {
  const editorRef = useRef<Editor | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);


  // Ensure content is in rich format
  const richContent = useMemo(() => {
    if (!content) return EMPTY_RICH_CELL_CONTENT;
    
    // If content looks like plain text, convert it
    if (!isValidRichContent(content)) {
      return convertPlainTextToRichContent(content);
    }
    
    return content;
  }, [content]);

  // Create editor instance using performance-optimized manager
  useEffect(() => {
    const editorOptions: TableCellEditorOptions = {
      content: richContent,
      isHeader,
      position,
      onUpdate: (newContent: string) => {
        // Only update if content actually changed to prevent infinite loops
        if (newContent !== richContent) {
          onContentChange(newContent);
        }
      },
      onFocus: () => {
        setIsFocused(true);
        setIsEditing(true);
        onFocus?.();
      },
      onBlur: () => {
        setIsFocused(false);
        setIsEditing(false);
        onBlur?.();
      },
      onNavigate: onNavigate,
    };

    const editor = performanceOptimizedTableCellManager.getEditor(cellId, editorOptions);
    editorRef.current = editor;

    // Update content if it changed externally (debounced for performance)
    if (editor && editor.getHTML() !== richContent) {
      // Use requestAnimationFrame to avoid blocking the main thread
      requestAnimationFrame(() => {
        editor.commands.setContent(richContent);
      });
    }

    return () => {
      // Performance optimization: don't immediately destroy editor
      // Let the manager handle cleanup based on usage patterns
      editorRef.current = null;
    };
  }, [cellId, richContent, isHeader, position, onContentChange, onFocus, onBlur, onNavigate]);

  // Handle click to focus with selection coordination
  const handleCellClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (editorRef.current && !isFocused) {
      setIsEditing(true);
      setIsFocused(true);
      
      // Coordinate with table selection system
      // Fix: Extract table ID by removing last two segments (row and col)
      const parts = cellId.split('-');
      const tableId = parts.slice(0, -2).join('-');
      
      // CRITICAL FIX: Pass the editor instance to the coordinator
      tableSelectionCoordinator.focusCell(tableId, position, {
        scrollIntoView: false, // We handle this manually
        selectContent: false,
        clearPreviousSelection: true,
        // NEW: Pass the editor and element for proper coordination
        editor: editorRef.current,
        cellElement: e.currentTarget as HTMLElement,
        cellId: cellId
      });
      
      onFocus?.();
      editorRef.current.commands.focus();
    }
  }, [isFocused, onFocus, cellId, position]);

  // Handle keyboard shortcuts with enhanced coordination
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!editorRef.current) return;

    // Let the table selection coordinator handle navigation first
    const tableId = cellId.split('-').slice(0, -2).join('-');
    
    // Table navigation shortcuts - coordinate with selection system
    if (e.key === 'Tab') {
      e.preventDefault();
      const handled = tableSelectionCoordinator.navigateCell(e.shiftKey ? 'left' : 'tab');
      if (!handled) {
        onNavigate?.(e.shiftKey ? 'left' : 'right');
      }
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      const handled = tableSelectionCoordinator.navigateCell('enter');
      if (!handled) {
        onNavigate?.('down');
      }
    } else if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      const handled = tableSelectionCoordinator.navigateCell('up');
      if (!handled) {
        onNavigate?.('up');
      }
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      const handled = tableSelectionCoordinator.navigateCell('down');
      if (!handled) {
        onNavigate?.('down');
      }
    } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      const handled = tableSelectionCoordinator.navigateCell('left');
      if (!handled) {
        onNavigate?.('left');
      }
    } else if (e.key === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      const handled = tableSelectionCoordinator.navigateCell('right');
      if (!handled) {
        onNavigate?.('right');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      tableSelectionCoordinator.clearSelection();
    }
  }, [onNavigate, cellId]);

  // Get typography commands for this cell's editor
  const typographyCommands = useMemo(() => {
    return editorRef.current ? createTypographyCommands(editorRef.current) : null;
  }, [editorRef.current]);

  // Provide access to typography commands for external toolbar usage
  React.useImperativeHandle(
    ref,
    () => ({
      getTypographyCommands: () => typographyCommands,
      getEditor: () => editorRef.current,
      focus: () => editorRef.current?.commands.focus(),
      blur: () => editorRef.current?.commands.blur(),
    }),
    [typographyCommands]
  );

  // Cell styling
  const cellStyle = useMemo(() => ({
    padding: `${styling.cellPadding}px`,
    fontSize: `${styling.fontSize}px`,
    fontWeight: isHeader ? 600 : styling.fontWeight,
    textAlign: styling.textAlign,
    border: `1px solid ${styling.borderColor}`,
    backgroundColor: isHeader ? styling.headerBackgroundColor : 'transparent',
    position: 'relative' as const,
  }), [styling, isHeader]);

  // Display content when not editing (preserving rich formatting)
  const displayContent = useMemo(() => {
    if (isEditing || isFocused) return null;
    
    // Optimize rich content for display (preserving formatting)
    const optimizedContent = optimizeForDisplay(richContent);
    
    if (optimizedContent.isEmpty) {
      return (
        <span className="text-muted-foreground italic text-sm">
          {isHeader ? 'Header' : 'Empty'}
        </span>
      );
    }
    
    // Return rich HTML content with proper classes
    return (
      <div 
        className={cn('rich-content-display', ...optimizedContent.classes)}
        dangerouslySetInnerHTML={{ __html: optimizedContent.html }}
      />
    );
  }, [richContent, isEditing, isFocused, isHeader]);

  const TagName = isHeader ? 'th' : 'td';

  const shouldShowEditor = (isEditing || isFocused) && editorRef.current;

  return (
    <TagName
      className={cn(
        'table-cell-container group/cell relative transition-all duration-150',
        isFocused && 'ring-2 ring-primary ring-inset',
        isSelected && 'bg-muted/30',
        isTableSelected && 'ring-1 ring-primary/30',
        'hover:bg-muted/20',
      )}
      style={cellStyle}
      onClick={(e) => {
        handleCellClick(e);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="gridcell"
      aria-selected={isSelected}
      data-testid={`table-cell-${position.row}-${position.col}`}
    >
      {/* Rich content editor */}
      {shouldShowEditor ? (
        <div className="rich-cell-editor min-h-[1.2rem] w-full">
          <EditorContent
            editor={editorRef.current}
            className={cn(
              'prose prose-sm max-w-none',
              'focus-within:outline-none',
              '[&_.ProseMirror]:outline-none',
              '[&_.ProseMirror]:min-h-[1.2rem]',
              '[&_.ProseMirror]:p-0',
              '[&_.ProseMirror]:m-0',
              '[&_.ProseMirror]:leading-relaxed',
            )}
          />
        </div>
      ) : (
        /* Display mode for better performance */
        <div 
          className="cell-display-content min-h-[1.2rem] w-full cursor-text"
          style={{
            fontSize: `${styling.fontSize}px`,
            fontWeight: isHeader ? 600 : styling.fontWeight,
            textAlign: styling.textAlign,
          }}
        >
          {displayContent}
        </div>
      )}

      {/* Selection indicator */}
      {isFocused && (
        <div className="absolute inset-0 pointer-events-none ring-2 ring-primary ring-inset rounded-sm" />
      )}

      {/* Typography indicator for selected cells */}
      {isSelected && typographyCommands && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-60" />
      )}
    </TagName>
  );
}));

RichTableCell.displayName = 'RichTableCell';

// Utility type for external access to cell methods
export interface RichTableCellRef {
  getTypographyCommands: () => ReturnType<typeof createTypographyCommands> | null;
  getEditor: () => Editor | null;
  focus: () => void;
  blur: () => void;
}