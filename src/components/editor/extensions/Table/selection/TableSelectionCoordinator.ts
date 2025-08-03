// ABOUTME: Advanced selection coordination system for table cells and main editor integration

import { Editor } from '@tiptap/core';
import { tableComponentRegistry, TableComponentMethods } from '../tableCommands';
import { createTypographyCommands } from '../../../shared/typography-commands';

/**
 * Selection state for coordinated table cell management
 */
export interface TableSelectionState {
  /** Whether a table cell is currently selected */
  hasTableCellSelection: boolean;
  /** Active table information */
  activeTable?: {
    tableId: string;
    component: TableComponentMethods;
  };
  /** Currently focused cell */
  focusedCell?: {
    position: { row: number; col: number };
    editor: Editor | null;
    isHeader: boolean;
    element: HTMLElement | null;
    cellId?: string; // NEW: For debugging and identification
  };
  /** Multiple selected cells (for range operations) */
  selectedCells: Array<{
    position: { row: number; col: number };
    editor: Editor | null;
    element: HTMLElement | null;
  }>;
  /** Selection context for coordinated operations */
  selectionContext: {
    canApplyTypography: boolean;
    canNavigate: boolean;
    canEdit: boolean;
    activeTypographyCommands: ReturnType<typeof createTypographyCommands> | null;
  };
}

/**
 * Events emitted by the selection coordinator
 */
export interface TableSelectionEvents {
  /** When table cell selection changes */
  'cellSelection': (state: TableSelectionState) => void;
  /** When cell focus changes */
  'cellFocus': (cellInfo: { tableId: string; position: { row: number; col: number }; editor: Editor | null }) => void;
  /** When cell blur occurs */
  'cellBlur': (cellInfo: { tableId: string; position: { row: number; col: number } }) => void;
  /** When selection context changes (affects toolbar state) */
  'contextChange': (context: TableSelectionState['selectionContext']) => void;
  /** When cross-cell navigation occurs */
  'cellNavigation': (from: { row: number; col: number }, to: { row: number; col: number }, direction: string) => void;
}

/**
 * Advanced selection coordinator for table cells and main editor
 */
export class TableSelectionCoordinator {
  private currentState: TableSelectionState;
  private eventListeners: Map<keyof TableSelectionEvents, Array<(...args: any[]) => void>>;
  private keyboardHandler: ((event: KeyboardEvent) => boolean) | null = null;
  private mutationObserver: MutationObserver | null = null;
  
  // ENHANCED: Context-aware selection locking system
  private selectionLock: boolean = false;
  private lockReason: string | null = null;
  private activeTableId: string | null = null;
  private cellInteractionActive: boolean = false; // NEW: Track if user is actively interacting with cell

  // 🎯 PHASE 1: Selection timing harmonization with normal text
  private clearSelectionTimeout: NodeJS.Timeout | null = null;
  private readonly SELECTION_CLEAR_DELAY = 300; // Match useTextSelection timing

  // 🎯 PHASE 1: Toolbar interaction preservation
  private toolbarInteractionActive: boolean = false;
  private toolbarInteractionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.currentState = {
      hasTableCellSelection: false,
      selectedCells: [],
      selectionContext: {
        canApplyTypography: false,
        canNavigate: false,
        canEdit: false,
        activeTypographyCommands: null,
      },
    };

    this.eventListeners = new Map();
    this.setupKeyboardNavigation();
    this.setupDOMObserver();
  }

  /**
   * Register event listener
   */
  on<K extends keyof TableSelectionEvents>(
    event: K,
    listener: TableSelectionEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof TableSelectionEvents>(
    event: K,
    listener: TableSelectionEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit<K extends keyof TableSelectionEvents>(
    event: K,
    ...args: Parameters<TableSelectionEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in table selection event listener (${event}):`, error);
        }
      });
    }
  }

  /**
   * Set focus on a specific table cell (enhanced with backward compatibility)
   */
  focusCell(
    tableId: string,
    position: { row: number; col: number },
    editorOrOptions?: Editor | null | { 
      scrollIntoView?: boolean;
      selectContent?: boolean;
      clearPreviousSelection?: boolean;
      editor?: Editor | null;
      cellElement?: HTMLElement | null;
      cellId?: string;
    },
    isHeader?: boolean
  ): boolean {
    // Handle backward compatibility - if third param is Editor or null, use old signature
    let options: any = {};
    if (editorOrOptions === null || editorOrOptions === undefined || typeof editorOrOptions === 'object' && 'commands' in editorOrOptions) {
      // Old signature: focusCell(tableId, position, editor, isHeader)
      options = {
        editor: editorOrOptions as Editor | null,
        clearPreviousSelection: true
      };
    } else {
      // New signature: focusCell(tableId, position, options)
      options = editorOrOptions || {};
    }
    const component = tableComponentRegistry.get(tableId);
    if (!component) {
      console.warn(`Table component not found: ${tableId}`);
      return false;
    }

    try {
      // Clear previous selection if requested
      if (options.clearPreviousSelection) {
        this.clearSelection();
      }

      // CRITICAL FIX: Use provided editor and element or fallback to lookup
      const cellEditor = options.editor || component.getFocusedCellEditor?.();
      const cellElement = options.cellElement || this.findCellElement(tableId, position);
      

      // Update focused cell state
      const newState: TableSelectionState = {
        ...this.currentState,
        hasTableCellSelection: true,
        activeTable: { tableId, component },
        focusedCell: {
          position,
          editor: cellEditor,
          isHeader: isHeader !== undefined ? isHeader : position.row === -1,
          element: cellElement,
          // NEW: Add cellId for debugging
          cellId: options.cellId,
        },
        selectedCells: [{
          position,
          editor: cellEditor,
          element: cellElement,
        }],
        selectionContext: {
          canApplyTypography: Boolean(cellEditor),
          canNavigate: true,
          canEdit: Boolean(cellEditor),
          activeTypographyCommands: cellEditor ? createTypographyCommands(cellEditor) : null,
        },
      };

      this.updateState(newState);
      this.activeTableId = tableId;

      // 🎯 PHASE 1: Immediately establish cell interaction mode for toolbar compatibility
      this.cellInteractionActive = true;
      this.selectionLock = true;
      this.lockReason = 'table-cell-focused';
      console.log('[TableSelectionCoordinator] Cell focused and locked immediately - ready for toolbar interactions');

      // Focus the cell editor if available
      if (cellEditor) {
        if (options.selectContent) {
          // Select all content in the cell
          cellEditor.commands.selectAll();
        } else {
          // Just focus without selecting
          cellEditor.commands.focus();
        }
      }

      // Scroll into view if requested
      if (options.scrollIntoView && cellElement) {
        cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Emit focus event
      this.emit('cellFocus', { tableId, position, editor: cellEditor });

      return true;
    } catch (error) {
      console.error('Failed to focus table cell:', error);
      return false;
    }
  }

  /**
   * Blur the currently focused cell
   */
  blurCell(): void {
    if (this.currentState.focusedCell) {
      const { position } = this.currentState.focusedCell;
      const tableId = this.currentState.activeTable?.tableId;

      // Blur the editor
      if (this.currentState.focusedCell.editor) {
        this.currentState.focusedCell.editor.commands.blur();
      }

      // Emit blur event
      if (tableId) {
        this.emit('cellBlur', { tableId, position });
      }

      // Update state
      const newState: TableSelectionState = {
        ...this.currentState,
        focusedCell: undefined,
        selectionContext: {
          canApplyTypography: false,
          canNavigate: false,
          canEdit: false,
          activeTypographyCommands: null,
        },
      };

      this.updateState(newState);
    }
  }

  /**
   * Navigate between cells using keyboard
   */
  navigateCell(direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'enter'): boolean {
    if (!this.currentState.focusedCell || !this.currentState.activeTable) {
      return false;
    }

    const { position } = this.currentState.focusedCell;
    const { tableId, component } = this.currentState.activeTable;

    try {
      // Calculate new position based on direction
      const newPosition = { ...position };

      switch (direction) {
        case 'up':
          newPosition.row = Math.max(0, position.row - 1);
          break;
        case 'down':
          newPosition.row = position.row + 1;
          // Need to check max rows from component or table data
          break;
        case 'left':
          newPosition.col = Math.max(0, position.col - 1);
          break;
        case 'right':
        case 'tab':
          newPosition.col = position.col + 1;
          // Need to check max cols from component or table data
          break;
        case 'enter':
          newPosition.row = position.row + 1;
          break;
      }

      // Validate new position (this would need access to table dimensions)
      if (this.isValidCellPosition(tableId, newPosition)) {
        // Emit navigation event
        this.emit('cellNavigation', position, newPosition, direction);

        // Focus the new cell
        return this.focusCell(tableId, newPosition, { clearPreviousSelection: true });
      }

      return false;
    } catch (error) {
      console.error('Failed to navigate table cell:', error);
      return false;
    }
  }

  /**
   * Select multiple cells (for range operations)
   */
  selectCellRange(
    tableId: string,
    startPos: { row: number; col: number },
    endPos: { row: number; col: number }
  ): boolean {
    const component = tableComponentRegistry.get(tableId);
    if (!component) return false;

    try {
      const selectedCells: TableSelectionState['selectedCells'] = [];

      // Calculate the range
      const minRow = Math.min(startPos.row, endPos.row);
      const maxRow = Math.max(startPos.row, endPos.row);
      const minCol = Math.min(startPos.col, endPos.col);
      const maxCol = Math.max(startPos.col, endPos.col);

      // Collect all cells in the range
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const position = { row, col };
          const cellElement = this.findCellElement(tableId, position);
          
          selectedCells.push({
            position,
            editor: null, // Range selections don't focus individual editors
            element: cellElement,
          });
        }
      }

      // Update state
      const newState: TableSelectionState = {
        ...this.currentState,
        hasTableCellSelection: true,
        activeTable: { tableId, component },
        selectedCells,
        selectionContext: {
          canApplyTypography: true, // Can apply to multiple cells
          canNavigate: true,
          canEdit: false, // Can't edit multiple cells at once
          activeTypographyCommands: null, // No single editor for range
        },
      };

      this.updateState(newState);
      return true;
    } catch (error) {
      console.error('Failed to select cell range:', error);
      return false;
    }
  }

  /**
   * Clear all table cell selections (with intelligent persistence)
   * 🎯 PHASE 1: Enhanced with 300ms delay like normal text selections
   */
  clearSelection(force: boolean = false): void {
    // Cancel any pending clear operations
    if (this.clearSelectionTimeout) {
      clearTimeout(this.clearSelectionTimeout);
      this.clearSelectionTimeout = null;
    }

    // INTELLIGENT PERSISTENCE: Only clear if not locked or if forced
    if (!force && this.selectionLock) {
      console.log('[TableSelectionCoordinator] Selection clearing blocked by lock - preserving table cell selection');
      return;
    }

    // 🎯 PHASE 1: Block clearing during toolbar interactions
    if (!force && this.toolbarInteractionActive) {
      console.log('[TableSelectionCoordinator] Selection clearing blocked by toolbar interaction - preserving table cell selection');
      return;
    }

    // 🎯 HARMONIZATION: Add delay like normal text selections (unless forced)
    if (!force && this.currentState.hasTableCellSelection) {
      console.log('[TableSelectionCoordinator] Delayed clearing started - 300ms delay to allow toolbar interactions');
      
      this.clearSelectionTimeout = setTimeout(() => {
        this.performClearSelection();
        this.clearSelectionTimeout = null;
      }, this.SELECTION_CLEAR_DELAY);
      
      return;
    }

    // Immediate clear for forced operations
    this.performClearSelection();
  }

  /**
   * 🎯 PHASE 1: Extracted clear logic for both immediate and delayed clearing
   */
  private performClearSelection(): void {
    if (this.currentState.hasTableCellSelection) {
      console.log('[TableSelectionCoordinator] Performing table cell selection clear');
      
      // Blur any focused cell
      this.blurCell();

      // Reset state
      const newState: TableSelectionState = {
        hasTableCellSelection: false,
        selectedCells: [],
        selectionContext: {
          canApplyTypography: false,
          canNavigate: false,
          canEdit: false,
          activeTypographyCommands: null,
        },
      };

      this.updateState(newState);
      
      // ENHANCED: Clear all enhanced state properties
      this.selectionLock = false;
      this.lockReason = null;
      this.activeTableId = null;
      this.cellInteractionActive = false;
    }
  }

  /**
   * ENHANCED: Lock table cell selection only when actively interacting
   */
  lockSelection(): void {
    // ENHANCED: Only lock if we have both table selection AND active interaction
    if (this.currentState.hasTableCellSelection && this.cellInteractionActive) {
      this.selectionLock = true;
      this.lockReason = 'table-cell-active';
      console.log('[TableSelectionCoordinator] Table cell selection locked');
    } else if (this.currentState.hasTableCellSelection) {
      // Cell is focused but not actively being used - don't lock yet
      console.log('[TableSelectionCoordinator] Table cell focused but not locked - waiting for user interaction');
    }
  }

  /**
   * ENHANCED: Unlock selection and clear interaction state
   */
  unlockSelection(): void {
    this.selectionLock = false;
    this.lockReason = null;
    this.cellInteractionActive = false;
    console.log('[TableSelectionCoordinator] Table cell selection unlocked');
  }

  /**
   * Check if selection is currently locked
   */
  isSelectionLocked(): boolean {
    return this.selectionLock;
  }

  /**
   * Apply typography to currently selected cells
   */
  applyTypographyToSelection(properties: Record<string, any>): boolean {
    if (!this.currentState.hasTableCellSelection) {
      return false;
    }

    try {
      // If we have a single focused cell with editor, use its typography commands
      if (this.currentState.focusedCell?.editor && this.currentState.selectedCells.length === 1) {
        const commands = createTypographyCommands(this.currentState.focusedCell.editor);
        return this.applyTypographyWithCommands(commands, properties);
      }

      // For multiple cells, apply to each cell's editor
      if (this.currentState.selectedCells.length > 1) {
        let successCount = 0;
        
        for (const cell of this.currentState.selectedCells) {
          if (cell.editor) {
            const commands = createTypographyCommands(cell.editor);
            if (this.applyTypographyWithCommands(commands, properties)) {
              successCount++;
            }
          }
        }

        return successCount > 0;
      }

      return false;
    } catch (error) {
      console.error('Failed to apply typography to table cell selection:', error);
      return false;
    }
  }

  /**
   * Get current selection state
   */
  getSelectionState(): Readonly<TableSelectionState> {
    return { ...this.currentState };
  }

  /**
   * Check if a position is valid within the table
   */
  private isValidCellPosition(tableId: string, position: { row: number; col: number }): boolean {
    // This is a simplified check - in practice, we'd need to get table dimensions
    // from the component or table data
    if (position.row < 0 || position.col < 0) return false;
    
    // For testing, we'll assume a reasonable table size
    // In production, this would query the actual table component
    return position.row < 10 && position.col < 10;
  }

  /**
   * Find DOM element for a specific cell
   */
  private findCellElement(tableId: string, position: { row: number; col: number }): HTMLElement | null {
    const cellTestId = `table-cell-${position.row}-${position.col}`;
    return document.querySelector(`[data-testid="${cellTestId}"]`) as HTMLElement;
  }

  /**
   * Apply typography using commands
   */
  private applyTypographyWithCommands(commands: ReturnType<typeof createTypographyCommands>, properties: Record<string, any>): boolean {
    try {
      Object.entries(properties).forEach(([property, value]) => {
        switch (property) {
          case 'fontFamily':
            if (value) commands.setFontFamily(value);
            else commands.unsetProperty('fontFamily');
            break;
          case 'fontSize':
            if (value) commands.setFontSize(value);
            else commands.unsetProperty('fontSize');
            break;
          case 'fontWeight':
            if (value) commands.setFontWeight(value);
            else commands.unsetProperty('fontWeight');
            break;
          case 'textColor':
            if (value) commands.setTextColor(value);
            else commands.unsetProperty('textColor');
            break;
          case 'backgroundColor':
            if (value) commands.setBackgroundColor(value);
            else commands.unsetProperty('backgroundColor');
            break;
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to apply typography commands:', error);
      return false;
    }
  }

  /**
   * Update internal state and emit events
   */
  private updateState(newState: TableSelectionState): void {
    const previousState = this.currentState;
    this.currentState = newState;

    // Emit selection change event
    this.emit('cellSelection', newState);

    // Emit context change if it changed (using structural comparison to avoid circular reference)
    if (this.hasSelectionContextChanged(previousState.selectionContext, newState.selectionContext)) {
      this.emit('contextChange', newState.selectionContext);
    }
  }

  /**
   * Compare selection contexts without circular reference issues
   * Avoids JSON.stringify on objects that may contain Editor instances
   */
  private hasSelectionContextChanged(
    previous: TableSelectionState['selectionContext'],
    current: TableSelectionState['selectionContext']
  ): boolean {
    // Compare primitive fields directly
    if (
      previous.canApplyTypography !== current.canApplyTypography ||
      previous.canNavigate !== current.canNavigate ||
      previous.canEdit !== current.canEdit
    ) {
      return true;
    }

    // Compare activeTypographyCommands existence (avoid comparing the actual object)
    const previousHasCommands = Boolean(previous.activeTypographyCommands);
    const currentHasCommands = Boolean(current.activeTypographyCommands);
    
    return previousHasCommands !== currentHasCommands;
  }

  /**
   * Setup keyboard navigation handlers
   */
  private setupKeyboardNavigation(): void {
    this.keyboardHandler = (event: KeyboardEvent) => {
      if (!this.currentState.hasTableCellSelection || !this.currentState.selectionContext.canNavigate) {
        return false;
      }

      // Handle navigation keys
      if (event.key === 'ArrowUp' && event.ctrlKey) {
        event.preventDefault();
        return this.navigateCell('up');
      } else if (event.key === 'ArrowDown' && event.ctrlKey) {
        event.preventDefault();
        return this.navigateCell('down');
      } else if (event.key === 'ArrowLeft' && event.ctrlKey) {
        event.preventDefault();
        return this.navigateCell('left');
      } else if (event.key === 'ArrowRight' && event.ctrlKey) {
        event.preventDefault();
        return this.navigateCell('right');
      } else if (event.key === 'Tab') {
        event.preventDefault();
        return this.navigateCell('tab');
      } else if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault();
        return this.navigateCell('enter');
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.clearSelection();
        return true;
      }

      return false;
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  /**
   * Setup DOM mutation observer for dynamic table changes
   */
  private setupDOMObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Handle table structure changes that might affect selection
        if (mutation.type === 'childList' && mutation.target instanceof HTMLElement) {
          // Check if any table cells were added or removed
          const hasTableChanges = mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
          
          if (hasTableChanges && this.currentState.hasTableCellSelection) {
            // Validate current selection is still valid
            this.validateCurrentSelection();
          }
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Validate that current selection is still valid after DOM changes
   */
  private validateCurrentSelection(): void {
    if (!this.currentState.hasTableCellSelection) return;

    // Check if focused cell still exists
    if (this.currentState.focusedCell) {
      const { position } = this.currentState.focusedCell;
      const tableId = this.currentState.activeTable?.tableId;
      
      if (tableId) {
        const cellElement = this.findCellElement(tableId, position);
        if (!cellElement) {
          // Cell no longer exists, clear selection
          this.clearSelection();
        }
      }
    }
  }

  // ENHANCED: Context-aware selection management methods

  /**
   * Activate cell interaction (user starts typing/editing)
   */
  activateCellInteraction(tableId: string, position: { row: number; col: number }): void {
    this.cellInteractionActive = true;
    this.activeTableId = tableId;
    this.lockReason = 'table-cell-active';
    this.selectionLock = true;
    console.log('[TableSelectionCoordinator] Cell interaction activated - selection locked');
  }

  /**
   * Handle selection transitioning to non-table content
   */
  handleNonTableSelection(): void {
    if (this.selectionLock) {
      console.log('[TableSelectionCoordinator] Non-table selection detected - unlocking and clearing table selection');
      this.cellInteractionActive = false;
      this.selectionLock = false;
      this.lockReason = null;
      this.activeTableId = null;
      this.clearSelection(true); // Force clear
    }
  }

  /**
   * Determine if selection should be preserved for specific interaction types
   */
  shouldPreserveSelectionForInteraction(interactionType: string): boolean {
    if (!this.selectionLock) return false;
    
    // Table-specific interactions should preserve selection
    if (interactionType.includes('table')) {
      return true;
    }
    
    // Typography interactions on table cells should unlock for text formatting
    if (interactionType.includes('typography')) {
      return false;
    }
    
    // Default: preserve for unknown interactions (conservative approach)
    return true;
  }

  /**
   * Get the reason why selection is locked
   */
  getLockReason(): string | null {
    return this.lockReason;
  }

  /**
   * Get the currently active table ID
   */
  getActiveTableId(): string | null {
    return this.activeTableId;
  }

  /**
   * Check if text selection should be allowed (coordination with text selection system)
   */
  canAllowTextSelection(): boolean {
    // If no table selection or not actively interacting, allow text selection
    return !this.cellInteractionActive;
  }

  // 🎯 PHASE 1: Toolbar interaction preservation methods

  /**
   * Signal that a toolbar interaction is starting
   * This prevents table selection from being cleared during toolbar operations
   */
  startToolbarInteraction(): void {
    // Cancel any pending clear operations
    if (this.clearSelectionTimeout) {
      clearTimeout(this.clearSelectionTimeout);
      this.clearSelectionTimeout = null;
    }

    this.toolbarInteractionActive = true;
    
    // Clear any existing toolbar timeout
    if (this.toolbarInteractionTimeout) {
      clearTimeout(this.toolbarInteractionTimeout);
    }

    console.log('[TableSelectionCoordinator] Toolbar interaction started - preserving table cell selection');
  }

  /**
   * Signal that a toolbar interaction is ending
   * Selection will be preserved for a short time to allow the operation to complete
   */
  endToolbarInteraction(): void {
    if (this.toolbarInteractionTimeout) {
      clearTimeout(this.toolbarInteractionTimeout);
    }

    // Give a brief window for the toolbar operation to complete
    this.toolbarInteractionTimeout = setTimeout(() => {
      this.toolbarInteractionActive = false;
      console.log('[TableSelectionCoordinator] Toolbar interaction ended');
    }, 100); // Short delay to complete toolbar operations
  }

  /**
   * Check if a toolbar interaction is currently active
   */
  isToolbarInteractionActive(): boolean {
    return this.toolbarInteractionActive;
  }

  /**
   * Force preserve selection during critical operations
   * Use this for operations that must not lose table cell selection
   */
  preserveSelectionDuringOperation<T>(operation: () => T): T {
    const wasToolbarActive = this.toolbarInteractionActive;
    this.startToolbarInteraction();
    
    try {
      return operation();
    } finally {
      if (!wasToolbarActive) {
        this.endToolbarInteraction();
      }
    }
  }

  /**
   * Check if coordinator has table cell selection (public accessor)
   */
  hasTableCellSelection(): boolean {
    return this.currentState.hasTableCellSelection;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Remove keyboard handler
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }

    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // 🎯 PHASE 1: Clean up timing-related resources
    if (this.clearSelectionTimeout) {
      clearTimeout(this.clearSelectionTimeout);
      this.clearSelectionTimeout = null;
    }

    if (this.toolbarInteractionTimeout) {
      clearTimeout(this.toolbarInteractionTimeout);
      this.toolbarInteractionTimeout = null;
    }

    // Clear all event listeners
    this.eventListeners.clear();

    // Clear selection
    this.clearSelection(true); // Force clear during cleanup
  }
}

// Global instance for coordinated table cell selection
export const tableSelectionCoordinator = new TableSelectionCoordinator();