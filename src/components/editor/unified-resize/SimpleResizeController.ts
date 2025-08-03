// ABOUTME: Simple, unrestricted resize controller without constraints or performance optimizations

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export interface MousePosition {
  x: number;
  y: number;
}

export interface SimpleResizeOptions {
  nodeId: string;
  onUpdate: (nodeId: string, position: { x?: number; y?: number; width?: number; height?: number }) => void;
}

/**
 * Simple resize controller that provides unrestricted block resizing
 * - No size constraints or content-aware minimums
 * - No performance optimization systems or batching
 * - Direct, immediate DOM updates
 * - No operation locking or conflict prevention
 */
export class SimpleResizeController {
  private nodeId: string;
  private isResizing = false;
  private currentHandle: ResizeHandle | null = null;
  private startMousePosition: MousePosition = { x: 0, y: 0 };
  private startDimensions = { x: 0, y: 0, width: 0, height: 0 };
  private onUpdate: (nodeId: string, position: any) => void;

  constructor(nodeId: string, options: SimpleResizeOptions) {
    this.nodeId = nodeId;
    this.onUpdate = options.onUpdate;
  }

  /**
   * Start resize operation - simple and direct
   */
  startResize(handle: ResizeHandle, mousePosition: MousePosition, currentDimensions: any): boolean {
    if (this.isResizing) {
      return false;
    }

    this.isResizing = true;
    this.currentHandle = handle;
    this.startMousePosition = { ...mousePosition };
    this.startDimensions = { ...currentDimensions };
    
    return true;
  }

  /**
   * Update resize operation - no constraints, no batching, immediate updates
   */
  updateResize(mousePosition: MousePosition): void {
    if (!this.validateState()) {
      return;
    }

    // Calculate mouse movement delta
    const deltaX = mousePosition.x - this.startMousePosition.x;
    const deltaY = mousePosition.y - this.startMousePosition.y;

    // Calculate new dimensions based on handle and mouse movement
    const newDimensions = this.calculateNewDimensions(this.currentHandle, deltaX, deltaY);
    
    // Direct update - no constraints, no batching, no performance optimization
    this.onUpdate(this.nodeId, newDimensions);
  }

  /**
   * End resize operation
   */
  endResize(): void {
    this.isResizing = false;
    this.currentHandle = null;
  }

  /**
   * Calculate new dimensions based on handle type and mouse movement
   * No constraints applied - user has complete freedom
   */
  private calculateNewDimensions(handle: ResizeHandle, deltaX: number, deltaY: number) {
    let { x, y, width, height } = this.startDimensions;

    switch (handle) {
      case 'se': // Southeast - grow both dimensions from bottom-right
        width += deltaX;
        height += deltaY;
        break;
      case 'sw': // Southwest - grow height, adjust width from left
        width -= deltaX;
        height += deltaY;
        x += deltaX;
        break;
      case 'ne': // Northeast - grow width, adjust height from top
        width += deltaX;
        height -= deltaY;
        y += deltaY;
        break;
      case 'nw': // Northwest - adjust both from top-left
        width -= deltaX;
        height -= deltaY;
        x += deltaX;
        y += deltaY;
        break;
      case 'n': // North - adjust height from top
        height -= deltaY;
        y += deltaY;
        break;
      case 's': // South - grow height from bottom
        height += deltaY;
        break;
      case 'e': // East - grow width from right
        width += deltaX;
        break;
      case 'w': // West - adjust width from left
        width -= deltaX;
        x += deltaX;
        break;
    }

    // Return new dimensions without any constraint checking
    // User requested complete freedom to resize blocks
    return { x, y, width, height };
  }

  /**
   * Validate controller state for resize operations
   */
  private validateState(): boolean {
    return this.isResizing && this.currentHandle !== null;
  }

  /**
   * Check if currently resizing - simple state check
   */
  isCurrentlyResizing(): boolean {
    return this.isResizing;
  }

  /**
   * Simple cleanup - no complex resource management needed
   */
  destroy(): void {
    this.isResizing = false;
    this.currentHandle = null;
  }
}