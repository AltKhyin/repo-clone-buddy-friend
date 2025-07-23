// ABOUTME: Modern TableBlock with UnifiedBlockWrapper and rich text editing capabilities

import React, { memo, useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import { UnifiedBlockWrapper } from '@/components/editor/shared/UnifiedBlockWrapper';
import { EditorContent } from '@tiptap/react';
import { TableBlockData } from '@/types/editor';

interface TableBlockNodeProps {
  id: string;
  data: TableBlockData;
  selected: boolean;
  // Position props for unified wrapper
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  // Interaction callbacks
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
}

interface TableCell {
  id: string;
  htmlContent: string;
}

export const TableBlockNode = memo<TableBlockNodeProps>(
  ({ id, data, selected, width = 600, height = 400, x = 0, y = 0, onSelect, onMove }) => {
    const { updateNode } = useEditorStore();
    const { colors, theme } = useEditorTheme();
    
    // ALL HOOKS MUST BE AT THE TOP - No conditional hooks allowed
    
    // OPTIMIZATION: Use refs for editor storage to prevent unnecessary re-renders
    const cellEditorsRef = useRef<Map<string, any>>(new Map());
    const [cellEditors, setCellEditors] = useState<Map<string, any>>(new Map());
    const [focusedCellId, setFocusedCellId] = useState<string | null>(null);
    
    // Enhanced UX state - memoize initial states to prevent recreation
    const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);
    const [selectedCells, setSelectedCells] = useState<Set<string>>(() => new Set());
    const [isTableHovered, setIsTableHovered] = useState(false);
    
    // Copy/paste state - memoize initial state
    const [copiedCells, setCopiedCells] = useState<Map<string, string>>(() => new Map());
    
    // Initialize default table if empty
    const initializeDefaultTable = useCallback(() => {
      if ((!data?.htmlHeaders || data.htmlHeaders.length === 0) && 
          (!data?.htmlRows || data.htmlRows.length === 0)) {
        const defaultHeaders = ['<p>Column 1</p>', '<p>Column 2</p>'];
        const defaultRows = [['<p></p>', '<p></p>']];
        
        updateNode(id, {
          data: { 
            ...data, 
            htmlHeaders: defaultHeaders, 
            htmlRows: defaultRows 
          },
        });
      }
    }, [id, data, updateNode]);

    // Normalize table structure to ensure data integrity
    const normalizeTableData = useCallback(() => {
      const headers = data?.htmlHeaders || [];
      const rows = data?.htmlRows || [];
      
      // Ensure all rows have the same number of columns as headers
      const normalizedRows = rows.map(row => {
        const normalizedRow = [...(row || [])];
        
        // Pad row if it has fewer columns than headers
        while (normalizedRow.length < headers.length) {
          normalizedRow.push('<p></p>');
        }
        
        // Trim row if it has more columns than headers
        if (normalizedRow.length > headers.length) {
          normalizedRow.splice(headers.length);
        }
        
        return normalizedRow;
      });
      
      // If there are headers but no rows, create a default row
      if (headers.length > 0 && normalizedRows.length === 0) {
        normalizedRows.push(Array(headers.length).fill('<p></p>'));
      }
      
      return { headers, rows: normalizedRows };
    }, [data?.htmlHeaders, data?.htmlRows]);

    // Create cell data structure from raw data - FIXED: Remove normalizeTableData dependency
    const tableStructure = useMemo(() => {
      // OPTIMIZATION: Inline normalization to prevent dependency issues
      const headers = data?.htmlHeaders || [];
      const rows = data?.htmlRows || [];
      
      // Ensure all rows have the same number of columns as headers
      const normalizedRows = rows.map(row => {
        const normalizedRow = [...(row || [])];
        
        // Pad row if it has fewer columns than headers
        while (normalizedRow.length < headers.length) {
          normalizedRow.push('<p></p>');
        }
        
        // Trim row if it has more columns than headers
        if (normalizedRow.length > headers.length) {
          normalizedRow.splice(headers.length);
        }
        
        return normalizedRow;
      });
      
      // If there are headers but no rows, create a default row
      if (headers.length > 0 && normalizedRows.length === 0) {
        normalizedRows.push(Array(headers.length).fill('<p></p>'));
      }
      
      // Ensure we have arrays to work with
      const safeHeaders = Array.isArray(headers) ? headers : [];
      const safeRows = Array.isArray(normalizedRows) ? normalizedRows : [];
      
      const headerCells: TableCell[] = safeHeaders.map((header, index) => ({
        id: `${id}-header-${index}`,
        htmlContent: header || '<p>Header</p>',
      }));

      const rowCells: TableCell[][] = safeRows.map((row, rowIndex) =>
        Array.isArray(row) ? row.map((cell, colIndex) => ({
          id: `${id}-cell-${rowIndex}-${colIndex}`,
          htmlContent: cell || '<p></p>',
        })) : []
      );

      return { headers: headerCells, rows: rowCells };
    }, [id, data?.htmlHeaders, data?.htmlRows]); // REMOVED normalizeTableData dependency

    // Table structure management functions
    const addRow = useCallback(() => {
      const columnsCount = (data?.htmlHeaders || []).length;
      const newRow = Array(columnsCount).fill('<p></p>');
      const newRows = [...(data?.htmlRows || []), newRow];
      
      updateNode(id, {
        data: { ...data, htmlRows: newRows },
      });
    }, [id, data, updateNode]);

    const removeRow = useCallback((rowIndex: number) => {
      const currentRows = data?.htmlRows || [];
      if (currentRows.length <= 1) return; // Keep at least one row
      
      const newRows = currentRows.filter((_, index) => index !== rowIndex);
      updateNode(id, {
        data: { ...data, htmlRows: newRows },
      });
    }, [id, data, updateNode]);

    const addColumn = useCallback(() => {
      const newHeaders = [...(data?.htmlHeaders || []), '<p>New Column</p>'];
      const newRows = (data?.htmlRows || []).map(row => [...(row || []), '<p></p>']);
      
      updateNode(id, {
        data: { ...data, htmlHeaders: newHeaders, htmlRows: newRows },
      });
    }, [id, data, updateNode]);

    const removeColumn = useCallback((colIndex: number) => {
      const currentHeaders = data?.htmlHeaders || [];
      if (currentHeaders.length <= 1) return; // Keep at least one column
      
      const newHeaders = currentHeaders.filter((_, index) => index !== colIndex);
      const newRows = (data?.htmlRows || []).map(row => 
        (row || []).filter((_, index) => index !== colIndex)
      );
      
      updateNode(id, {
        data: { ...data, htmlHeaders: newHeaders, htmlRows: newRows },
      });
    }, [id, data, updateNode]);

    // Handle content updates from any cell - FIXED: Use ref to prevent flickering
    const dataRef = useRef(data);
    dataRef.current = data; // Keep ref updated
    
    const handleCellUpdate = useCallback(
      (cellId: string, htmlContent: string) => {
        // Parse cell ID to determine position
        const parts = cellId.split('-');
        
        if (parts.length >= 4) {
          const isHeader = parts[2] === 'header';
          const currentData = dataRef.current; // Use ref to avoid dependency
          
          if (isHeader) {
            const headerIndex = parseInt(parts[3]);
            const currentHeaders = currentData?.htmlHeaders || [];
            
            // OPTIMIZATION: Only update if content actually changed
            if (currentHeaders[headerIndex] === htmlContent) {
              return; // No change, skip update
            }
            
            const newHeaders = [...currentHeaders];
            newHeaders[headerIndex] = htmlContent;
            
            updateNode(id, {
              data: { ...currentData, htmlHeaders: newHeaders },
            });
          } else {
            const rowIndex = parseInt(parts[3]);
            const colIndex = parseInt(parts[4]);
            const currentRows = currentData?.htmlRows || [];
            
            // OPTIMIZATION: Only update if content actually changed
            if (currentRows[rowIndex]?.[colIndex] === htmlContent) {
              return; // No change, skip update
            }
            
            const newRows = [...currentRows];
            
            // Ensure row exists
            if (!newRows[rowIndex]) {
              newRows[rowIndex] = [];
            }
            
            // Ensure cell exists
            while (newRows[rowIndex].length <= colIndex) {
              newRows[rowIndex].push('<p></p>');
            }
            
            newRows[rowIndex][colIndex] = htmlContent;
            
            updateNode(id, {
              data: { ...currentData, htmlRows: newRows },
            });
          }
        }
      },
      [id, updateNode] // REMOVED data dependency to prevent editor recreation
    );

    // Keyboard navigation
    const handleCellKeyDown = useCallback((e: React.KeyboardEvent, cellId: string) => {
      const parts = cellId.split('-');
      if (parts.length < 4) return;

      // CRITICAL FIX: Add null safety guards for tableStructure
      if (!tableStructure || !tableStructure.headers || !tableStructure.rows) {
        console.warn('[TableBlock] tableStructure not ready, skipping keyboard navigation');
        return;
      }

      const isHeader = parts[2] === 'header';
      let rowIndex = -1;
      let colIndex = parseInt(parts[3]);
      
      if (!isHeader && parts.length >= 5) {
        rowIndex = parseInt(parts[3]);
        colIndex = parseInt(parts[4]);
      }

      // FIXED: Safe access with fallback values
      const totalCols = tableStructure.headers?.length || 0;
      const totalRows = tableStructure.rows?.length || 0;

      // Additional safety check
      if (totalCols === 0 || totalRows === 0) {
        console.warn('[TableBlock] Invalid table dimensions, skipping navigation');
        return;
      }

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          // Move to next cell, or create new row if at end
          if (isHeader) {
            if (e.shiftKey) {
              if (colIndex > 0) {
                const prevHeaderId = `${id}-header-${colIndex - 1}`;
                const prevEditor = cellEditors.get(prevHeaderId);
                prevEditor?.commands.focus();
              }
            } else {
              if (colIndex < totalCols - 1) {
                const nextHeaderId = `${id}-header-${colIndex + 1}`;
                const nextEditor = cellEditors.get(nextHeaderId);
                nextEditor?.commands.focus();
              } else if (totalRows > 0) {
                const firstCellId = `${id}-cell-0-0`;
                const firstCellEditor = cellEditors.get(firstCellId);
                firstCellEditor?.commands.focus();
              }
            }
          } else {
            if (e.shiftKey) {
              // Move to previous cell
              if (colIndex > 0) {
                const prevCellId = `${id}-cell-${rowIndex}-${colIndex - 1}`;
                const prevEditor = cellEditors.get(prevCellId);
                prevEditor?.commands.focus();
              } else if (rowIndex > 0) {
                const prevRowLastCellId = `${id}-cell-${rowIndex - 1}-${totalCols - 1}`;
                const prevEditor = cellEditors.get(prevRowLastCellId);
                prevEditor?.commands.focus();
              }
            } else {
              // Move to next cell
              if (colIndex < totalCols - 1) {
                const nextCellId = `${id}-cell-${rowIndex}-${colIndex + 1}`;
                const nextEditor = cellEditors.get(nextCellId);
                nextEditor?.commands.focus();
              } else if (rowIndex < totalRows - 1) {
                const nextRowFirstCellId = `${id}-cell-${rowIndex + 1}-0`;
                const nextEditor = cellEditors.get(nextRowFirstCellId);
                nextEditor?.commands.focus();
              } else {
                // At last cell, create new row and focus first cell of new row
                addRow();
                setTimeout(() => {
                  const newRowFirstCellId = `${id}-cell-${totalRows}-0`;
                  const newEditor = cellEditors.get(newRowFirstCellId);
                  newEditor?.commands.focus();
                }, 100);
              }
            }
          }
          break;
        
        case 'Enter':
          if (!e.shiftKey && !isHeader) {
            e.preventDefault();
            // Add new row and focus same column in new row
            addRow();
            setTimeout(() => {
              const newCellId = `${id}-cell-${totalRows}-${colIndex}`;
              const newEditor = cellEditors.get(newCellId);
              newEditor?.commands.focus();
            }, 100);
          }
          break;
      }
    }, [cellEditors, tableStructure, addRow, id]);

    // Cell Editor Component - Optimized for performance
    const CellEditor = memo<{
      cell: TableCell;
      isHeader?: boolean;
      rowIndex?: number;
      colIndex?: number;
      onFocus: () => void;
      onBlur: () => void;
    }>(({ cell, isHeader = false, rowIndex, colIndex, onFocus, onBlur }) => {
      // ANTI-FLICKER: Optimized field config to prevent height variations
      const fieldConfig = useMemo(() => ({
        fieldType: 'simple-text' as const, // ANTI-FLICKER: Simple text prevents height oscillation
        enableFormatting: isHeader, // Headers can have formatting, cells stay simple
        enableBlocks: false, // Keep blocks disabled in table cells for simplicity
        enableHeadings: false, // Keep headings disabled to prevent height variations
        showInToolbar: false, // Disable toolbar integration for cells
      }), [isHeader]);

      // OPTIMIZATION 2: Create stable onUpdate callback to prevent editor re-creation
      const stableOnUpdate = useCallback((nodeId: string, content: string) => {
        // Use a more immediate debounce for table cells (200ms instead of 1000ms)
        handleCellUpdate(nodeId, content);
      }, [handleCellUpdate]);

      const editorInstance = useTiptapEditor({
        nodeId: cell.id,
        initialContent: cell.htmlContent,
        placeholder: isHeader ? 'Header text...' : 'Cell content...',
        onUpdate: stableOnUpdate,
        editable: true,
        fieldConfig,
        debounceMs: 300, // Faster updates for table cells (300ms vs 1000ms default)
      });

      // OPTIMIZATION 3: Memoize focus/blur handlers to prevent unnecessary re-renders
      const handleFocus = useCallback(() => {
        setFocusedCellId(cell.id);
        setSelectedCells(new Set([cell.id])); // Auto-select focused cell
        onFocus();
      }, [cell.id, onFocus]);

      const handleBlur = useCallback(() => {
        setFocusedCellId(null);
        onBlur();
      }, [onBlur]);

      const handleCellClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleCellSelect(cell.id, e.ctrlKey || e.metaKey);
      }, [cell.id, handleCellSelect]);

      // OPTIMIZATION 4: Use ref for editor storage and batch updates to prevent cascading re-renders
      const editorRef = useRef(editorInstance.editor);
      const editorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      
      useEffect(() => {
        // Only update if editor instance actually changed and batch updates
        if (editorInstance.editor && editorInstance.editor !== editorRef.current) {
          editorRef.current = editorInstance.editor;
          
          // OPTIMIZATION 5: Batch editor map updates to prevent multiple state updates
          if (editorUpdateTimeoutRef.current) {
            clearTimeout(editorUpdateTimeoutRef.current);
          }
          
          editorUpdateTimeoutRef.current = setTimeout(() => {
            setCellEditors(prev => {
              const newMap = new Map(prev);
              if (editorInstance.editor) {
                newMap.set(cell.id, editorInstance.editor);
              }
              return newMap;
            });
          }, 0); // Batch on next tick
        }
        
        return () => {
          // Cleanup timeout and remove editor
          if (editorUpdateTimeoutRef.current) {
            clearTimeout(editorUpdateTimeoutRef.current);
          }
          setCellEditors(prev => {
            const newMap = new Map(prev);
            newMap.delete(cell.id);
            return newMap;
          });
        };
      }, [cell.id]); // Removed editorInstance.editor from dependencies to prevent loops

      // ANTI-FLICKER: Stable cell styles to prevent height oscillation
      const cellStyles: React.CSSProperties = {
        fontSize: data?.fontSize ? `${data.fontSize}px` : isHeader ? '16px' : '14px',
        fontFamily: data?.fontFamily || 'inherit',
        fontWeight: data?.fontWeight || (isHeader ? 600 : 400),
        textAlign: (data?.textAlign as any) || 'left',
        color: data?.color || colors.block.text,
        lineHeight: data?.lineHeight || 1.5, // FIXED: Stable line height
        letterSpacing: data?.letterSpacing ? `${data.letterSpacing}px` : '0px',
        textTransform: (data?.textTransform as any) || 'none',
        textDecoration: data?.textDecoration || 'none',
        padding: '12px', // FIXED: Uniform padding for stability
        height: isHeader ? '48px' : '44px', // FIXED: Fixed height to prevent oscillation
        width: '100%',
        cursor: 'text',
        overflow: 'hidden', // ANTI-FLICKER: Prevent content from affecting height
        display: 'flex', // ANTI-FLICKER: Flex for consistent layout
        alignItems: 'center', // ANTI-FLICKER: Center content vertically
        boxSizing: 'border-box', // ANTI-FLICKER: Include padding in height calculation
      };

      // Enhanced visual states
      const isFocused = focusedCellId === cell.id;
      const isHovered = hoveredCellId === cell.id;
      const isSelected = selectedCells.has(cell.id);

      // Calculate border classes for clean single borders
      const isFirstColumn = colIndex === 0;
      const isFirstRow = isHeader || rowIndex === 0;
      
      const borderClasses = `
        border-r border-b border-gray-200 dark:border-gray-700
        ${isFirstColumn ? 'border-l' : ''}
        ${isFirstRow ? 'border-t' : ''}
      `;

      return (
        <div
          className={`
            ${borderClasses}
            transition-colors duration-150 ease-in-out
            ${isFocused ? 'ring-2 ring-blue-400 ring-opacity-50 border-blue-300' : ''}
            ${isSelected && !isFocused ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : ''}
            ${isHovered && !isFocused && !isSelected ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
            ${isTableHovered ? 'hover:shadow-sm' : ''}
          `}
          style={{
            backgroundColor: isHeader 
              ? data?.headerStyle?.backgroundColor || colors.semantic?.table?.headerBackground || '#f8f9fa'
              : isSelected && !isFocused 
                ? undefined // Let CSS handle selected state
                : 'transparent',
          }}
          onClick={handleCellClick}
          onMouseEnter={() => handleCellMouseEnter(cell.id)}
          onMouseLeave={handleCellMouseLeave}
        >
          <EditorContent
            editor={editorInstance.editor}
            className="cell-editor focus:outline-none flex-1 min-w-0"
            style={{
              fontSize: cellStyles.fontSize,
              fontFamily: cellStyles.fontFamily,
              fontWeight: cellStyles.fontWeight,
              textAlign: cellStyles.textAlign,
              color: cellStyles.color,
              lineHeight: cellStyles.lineHeight,
              letterSpacing: cellStyles.letterSpacing,
              textTransform: cellStyles.textTransform,
              textDecoration: cellStyles.textDecoration,
              cursor: 'text',
              // ANTI-FLICKER: No height properties to prevent oscillation
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal', // FIXED: Allow normal text wrapping for editing
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => handleCellKeyDown(e, cell.id)}
          />
          
          {/* Cell position indicator for debugging/development */}
          {process.env.NODE_ENV === 'development' && isHovered && (
            <div className="absolute -top-5 -left-1 text-xs text-muted-foreground bg-background px-1 rounded">
              {isHeader ? `H${colIndex}` : `R${rowIndex}C${colIndex}`}
            </div>
          )}
        </div>
      );
    }, (prevProps, nextProps) => {
      // OPTIMIZATION: Custom memo comparison to prevent unnecessary re-renders
      return (
        prevProps.cell.id === nextProps.cell.id &&
        prevProps.cell.htmlContent === nextProps.cell.htmlContent &&
        prevProps.isHeader === nextProps.isHeader &&
        prevProps.rowIndex === nextProps.rowIndex &&
        prevProps.colIndex === nextProps.colIndex
        // Note: onFocus/onBlur callbacks are excluded from comparison
        // as they're expected to be stable
      );
    });

    CellEditor.displayName = 'CellEditor';

    // Enhanced cell interaction handlers
    const handleCellMouseEnter = useCallback((cellId: string) => {
      setHoveredCellId(cellId);
    }, []);

    const handleCellMouseLeave = useCallback(() => {
      setHoveredCellId(null);
    }, []);

    const handleTableMouseEnter = useCallback(() => {
      setIsTableHovered(true);
    }, []);

    const handleTableMouseLeave = useCallback(() => {
      setIsTableHovered(false);
      setHoveredCellId(null);
    }, []);

    // Handle table container click
    const handleTableClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      // Clear cell selections when clicking outside cells
      if (e.target === e.currentTarget) {
        setSelectedCells(new Set());
        setFocusedCellId(null);
      }
    }, []);

    // Enhanced cell selection handlers
    const handleCellSelect = useCallback((cellId: string, multiSelect = false) => {
      // SAFETY: Ensure tableStructure is ready before cell selection
      if (!tableStructure || !tableStructure.headers || !tableStructure.rows) {
        return;
      }
      
      setSelectedCells(prev => {
        const newSet = new Set(multiSelect ? prev : []);
        if (newSet.has(cellId)) {
          newSet.delete(cellId);
        } else {
          newSet.add(cellId);
        }
        return newSet;
      });
    }, [tableStructure]);

    // Copy/paste functionality
    const handleCopySelectedCells = useCallback(() => {
      // SAFETY: Ensure tableStructure and data are ready
      if (!tableStructure || !data || selectedCells.size === 0) {
        return;
      }
      
      const cellsData = new Map();
      selectedCells.forEach(cellId => {
        const parts = cellId.split('-');
        if (parts.length >= 4) {
          const isHeader = parts[2] === 'header';
          if (isHeader) {
            const headerIndex = parseInt(parts[3]);
            cellsData.set(cellId, data.htmlHeaders?.[headerIndex] || '<p></p>');
          } else {
            const rowIndex = parseInt(parts[3]);
            const colIndex = parseInt(parts[4]);
            cellsData.set(cellId, data.htmlRows?.[rowIndex]?.[colIndex] || '<p></p>');
          }
        }
      });
      setCopiedCells(cellsData);
      
      // Also copy to system clipboard
      const textContent = Array.from(cellsData.values())
        .map(html => html.replace(/<[^>]+>/g, ''))
        .join('\t');
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textContent).catch(console.error);
      }
    }, [selectedCells, data?.htmlHeaders, data?.htmlRows, tableStructure]);

    const handlePasteToSelectedCells = useCallback(() => {
      // SAFETY: Ensure we have valid data before pasting
      if (copiedCells.size === 0 || !tableStructure || selectedCells.size === 0) return;
      
      const copiedValues = Array.from(copiedCells.values());
      const selectedArray = Array.from(selectedCells);
      
      selectedArray.forEach((cellId, index) => {
        const content = copiedValues[index % copiedValues.length];
        handleCellUpdate(cellId, content);
      });
    }, [copiedCells, selectedCells, handleCellUpdate, tableStructure]);

    // Enhanced keyboard shortcuts
    const handleTableKeyDown = useCallback((e: React.KeyboardEvent) => {
      // SAFETY: Ensure tableStructure is ready and we have selections
      if (selectedCells.size === 0 || !tableStructure) return;
      
      switch (e.key) {
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleCopySelectedCells();
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePasteToSelectedCells();
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          selectedCells.forEach(cellId => {
            handleCellUpdate(cellId, '<p></p>');
          });
          break;
      }
    }, [selectedCells, handleCopySelectedCells, handlePasteToSelectedCells, handleCellUpdate, tableStructure]);

    // Data validation flags - memoized to prevent infinite re-renders
    const hasValidData = useMemo(() => data && typeof data === 'object', [data]);
    const hasValidStructure = useMemo(() => 
      hasValidData && data.htmlHeaders && data.htmlRows && Array.isArray(data.htmlHeaders) && Array.isArray(data.htmlRows)
    , [hasValidData, data.htmlHeaders, data.htmlRows]);
    
    // Handle data initialization - stable dependencies
    useEffect(() => {
      if (hasValidData && !hasValidStructure) {
        console.warn('[TableBlock] Missing or invalid htmlHeaders/htmlRows, initializing with defaults');
        
        // Initialize with safe defaults if missing
        const safeData = {
          ...data,
          htmlHeaders: data.htmlHeaders && Array.isArray(data.htmlHeaders) ? data.htmlHeaders : ['<p>Column 1</p>', '<p>Column 2</p>'],
          htmlRows: data.htmlRows && Array.isArray(data.htmlRows) ? data.htmlRows : [['<p></p>', '<p></p>']]
        };
        
        // Update the node with safe data
        updateNode(id, { data: safeData });
      }
    }, [hasValidData, hasValidStructure, id, updateNode]); // Removed 'data' to prevent loop
    
    // CONDITIONAL RENDERING - After ALL hooks
    if (!hasValidData) {
      return (
        <div className="p-4 border-2 border-dashed border-red-300 bg-red-50 rounded-lg">
          <p className="text-red-600 text-sm">TableBlock: Invalid data structure</p>
        </div>
      );
    }
    
    if (!hasValidStructure) {
      return (
        <div className="p-4 border-2 border-dashed border-yellow-300 bg-yellow-50 rounded-lg">
          <p className="text-yellow-600 text-sm">TableBlock: Initializing table structure...</p>
        </div>
      );
    }

    // Calculate dynamic styles for the table container
    const dynamicStyles: React.CSSProperties = {
      padding: `${data?.paddingY || 0}px ${data?.paddingX || 0}px`,
      backgroundColor: data?.backgroundColor || 'transparent',
      borderRadius: data?.borderRadius ? `${data.borderRadius}px` : '8px',
      borderWidth: data?.borderWidth || 0,
      borderColor: data?.borderColor || 'transparent',
      borderStyle: 'solid',
      overflow: 'hidden',
    };

    // Content styles for UnifiedBlockWrapper
    const contentStyles = {
      backgroundColor: dynamicStyles.backgroundColor,
      borderRadius: dynamicStyles.borderRadius,
      borderWidth: `${dynamicStyles.borderWidth}px`,
      borderColor: dynamicStyles.borderColor,
      borderStyle: 'solid',
      padding: `${data?.paddingY || 0}px ${data?.paddingX || 0}px`,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      minHeight: '100%',
      overflow: 'auto',
    };

    return (
      <UnifiedBlockWrapper
        id={id}
        width={width}
        height={height}
        x={x}
        y={y}
        selected={selected}
        blockType="tableBlock"
        contentStyles={contentStyles}
        minDimensions={{ width: 300, height: 200 }}
        maxDimensions={{ width: 1200, height: 800 }}
        onSelect={onSelect}
        onMove={onMove}
      >
        <div
          data-node-id={id}
          data-block-id={id}
          className="w-full h-full"
          style={{ position: 'relative' }}
          onClick={handleTableClick}
          onMouseEnter={handleTableMouseEnter}
          onMouseLeave={handleTableMouseLeave}
          onKeyDown={handleTableKeyDown}
          tabIndex={0}
        >
          {/* Table Action Toolbar - appears on hover */}
          {isTableHovered && selected && tableStructure?.headers?.length > 0 && (
            <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none z-10">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border px-2 py-1 flex gap-1 pointer-events-auto">
                <button
                  onClick={addColumn}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Add Column"
                >
                  ➕ Col
                </button>
                <button
                  onClick={addRow}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Add Row"
                >
                  ➕ Row
                </button>
                {(tableStructure?.headers?.length || 0) > 1 && (
                  <button
                    onClick={() => removeColumn((tableStructure?.headers?.length || 1) - 1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Remove Last Column"
                  >
                    ➖ Col
                  </button>
                )}
                {(tableStructure?.rows?.length || 0) > 1 && (
                  <button
                    onClick={() => removeRow((tableStructure?.rows?.length || 1) - 1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Remove Last Row"
                  >
                    ➖ Row
                  </button>
                )}
                {selectedCells.size > 0 && (
                  <>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    <button
                      onClick={handleCopySelectedCells}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Selected Cells (Ctrl+C)"
                    >
                      📋
                    </button>
                    {copiedCells.size > 0 && (
                      <button
                        onClick={handlePasteToSelectedCells}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="Paste to Selected Cells (Ctrl+V)"
                      >
                        📄
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Table Structure */}
          {tableStructure?.headers?.length > 0 ? (
            <div className="table-container w-full h-full overflow-auto relative">
              <table 
                className="w-full border-separate border-spacing-0 min-w-max" 
                style={{ 
                  tableLayout: 'fixed',
                  height: 'auto', // ANTI-FLICKER: Let table determine its own height
                  borderCollapse: 'separate', // ANTI-FLICKER: Ensure separate borders
                }}
              >
                {/* Headers */}
                <thead>
                  <tr style={{ height: '48px' }}>
{tableStructure.headers?.map((headerCell, index) => (
<th key={headerCell.id} className="min-w-[140px] max-w-[300px] w-auto" style={{ height: '48px' }}>
<CellEditor
cell={headerCell}
isHeader={true}
rowIndex={-1}
colIndex={index}
onFocus={() => {}}
onBlur={() => {}}
/>
</th>
))}
</tr>
                </thead>
                {/* Rows */}
                <tbody>
                  {tableStructure.rows?.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} style={{ height: '44px' }}> {/* ANTI-FLICKER: Fixed row height */}
                      {row.map((cell, colIndex) => (
                        <td key={cell.id} className="min-w-[140px] max-w-[300px] w-auto" style={{ height: '44px' }}>
                          <CellEditor
                            cell={cell}
                            isHeader={false}
                            rowIndex={rowIndex}
                            colIndex={colIndex}
                            onFocus={() => {}}
                            onBlur={() => {}}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State */
            <div 
              className="flex flex-col items-center justify-center h-full text-center"
              style={{ 
                color: colors.block.textSecondary,
                minHeight: '200px' 
              }}
            >
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Create Your Table</h3>
              <p className="text-sm mb-4 max-w-xs">
                Click the button below to create a basic 2x1 table to get started
              </p>
              <button
                onClick={initializeDefaultTable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Table
              </button>
            </div>
          )}

          {/* Focus indicator for the entire table */}
          {selected && (
            <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-30 rounded-lg" />
          )}

          {/* Selection indicator */}
          {selectedCells.size > 0 && (
            <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''} selected
              {copiedCells.size > 0 && (
                <span className="ml-2 text-blue-600">• {copiedCells.size} copied</span>
              )}
            </div>
          )}
        </div>
      </UnifiedBlockWrapper>
    );
  }
);

TableBlockNode.displayName = 'TableBlockNode';