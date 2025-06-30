// ABOUTME: Visual drop zone component for drag-and-drop reordering with animated feedback

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus } from 'lucide-react';

interface DropZoneProps {
  id: string;
  position: number;
  isActive: boolean;
  isHovered: boolean;
  type: 'before' | 'after' | 'between';
  className?: string;
  style?: React.CSSProperties;
  onHover: (isHovering: boolean) => void;
  onDrop: () => void;
}

export const DropZone = React.memo(function DropZone({
  id,
  position,
  isActive,
  isHovered,
  type,
  className,
  style,
  onHover,
  onDrop
}: DropZoneProps) {
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    onHover(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    onHover(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
    onHover(false);
  };

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'absolute z-20 transition-all duration-200 ease-out',
        'border-2 border-dashed rounded-lg',
        'flex items-center justify-center',
        'pointer-events-auto',
        isHovered
          ? 'border-primary bg-primary/10 scale-105'
          : 'border-muted-foreground/30 bg-muted/5 hover:border-primary/50',
        className
      )}
      style={style}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-drop-zone={id}
      data-position={position}
    >
      {/* Drop indicator */}
      <div className={cn(
        'flex items-center gap-2 text-sm font-medium transition-all duration-200',
        isHovered
          ? 'text-primary scale-110'
          : 'text-muted-foreground'
      )}>
        {type === 'before' && (
          <>
            <Plus size={16} />
            <span>Drop at beginning</span>
          </>
        )}
        {type === 'between' && (
          <>
            <ChevronDown size={16} />
            <span>Drop between blocks</span>
          </>
        )}
        {type === 'after' && (
          <>
            <Plus size={16} />
            <span>Drop at end</span>
          </>
        )}
      </div>

      {/* Animated pulse effect when hovered */}
      {isHovered && (
        <div className="absolute inset-0 border-2 border-primary rounded-lg animate-pulse opacity-50" />
      )}
    </div>
  );
});

// Drop zone overlay component for the entire canvas
interface DropZoneOverlayProps {
  dropZones: Array<{
    id: string;
    position: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'before' | 'after' | 'between';
  }>;
  isDragging: boolean;
  hoveredZoneId: string | null;
  dropZonePosition: number | null;
  onDropZoneHover: (zoneId: string | null, position: number | null) => void;
  onDrop: (position: number) => void;
}

export const DropZoneOverlay = React.memo(function DropZoneOverlay({
  dropZones,
  isDragging,
  hoveredZoneId,
  dropZonePosition,
  onDropZoneHover,
  onDrop
}: DropZoneOverlayProps) {
  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {dropZones.map((zone) => (
        <DropZone
          key={zone.id}
          id={zone.id}
          position={zone.position}
          isActive={isDragging}
          isHovered={hoveredZoneId === zone.id}
          type={zone.type}
          className="pointer-events-auto"
          style={{
            left: zone.x,
            top: zone.y,
            width: zone.width,
            height: zone.height,
          }}
          onHover={(isHovering) => {
            if (isHovering) {
              onDropZoneHover(zone.id, zone.position);
            } else if (hoveredZoneId === zone.id) {
              onDropZoneHover(null, null);
            }
          }}
          onDrop={() => onDrop(zone.position)}
        />
      ))}
    </div>
  );
});

// Drag preview component that follows the cursor
interface DragPreviewProps {
  isDragging: boolean;
  draggedNode: any;
  position: { x: number; y: number } | null;
}

export const DragPreview = React.memo(function DragPreview({
  isDragging,
  draggedNode,
  position
}: DragPreviewProps) {
  if (!isDragging || !position || !draggedNode) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x - 100, // Offset to center on cursor
        top: position.y - 50,
        transform: 'rotate(5deg)',
      }}
    >
      <div className="bg-background border-2 border-primary rounded-lg shadow-xl p-4 opacity-90 scale-75">
        <div className="text-sm font-medium text-foreground">
          {draggedNode.type.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Moving block...
        </div>
      </div>
    </div>
  );
});