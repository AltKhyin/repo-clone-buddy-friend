// ABOUTME: Type definitions for unified resize system

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export interface ResizeHandlers {
  isResizing: boolean;
  startResize: (handle: ResizeHandle, event: React.MouseEvent) => void;
  updateResize: (event: MouseEvent) => void;
  endResize: () => void;
}

export interface SimpleResizeOptions {
  nodeId: string;
  onUpdate: (position: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }) => void;
}

export interface SimpleResizeHandlesProps {
  width: number;
  height: number;
  x: number;
  y: number;
  resizeHandlers: ResizeHandlers;
  isActive: boolean;
  onHandleHover?: (handle: ResizeHandle | null) => void;
  opacity?: number;
}