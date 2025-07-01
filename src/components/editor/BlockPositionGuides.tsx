// ABOUTME: Visual guides showing other block positions when dragging for better placement

import React from 'react';

interface BlockPositionGuidesProps {
  isDragging: boolean;
  draggedNodeId: string | null;
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    width?: number;
    height?: number;
    style?: React.CSSProperties;
  }>;
}

export const BlockPositionGuides: React.FC<BlockPositionGuidesProps> = ({
  isDragging,
  draggedNodeId,
  nodes,
}) => {
  if (!isDragging || !draggedNodeId) return null;

  // Filter out the dragged node to show only other blocks
  const otherNodes = nodes.filter(
    node => node.id !== draggedNodeId && node.id !== 'preview-boundary-node'
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {otherNodes.map(node => {
        const width = node.width || parseInt(node.style?.width as string) || 400;
        const height = node.height || parseInt(node.style?.height as string) || 100;

        return (
          <div
            key={`guide-${node.id}`}
            className="absolute border-2 border-dashed border-blue-300 bg-blue-50 bg-opacity-20 rounded-md"
            style={{
              left: node.position.x,
              top: node.position.y,
              width: width,
              height: height,
              transition: 'opacity 0.2s ease',
            }}
          >
            {/* Corner markers for better visual reference */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>

            {/* Optional: Block type indicator */}
            <div className="absolute -top-6 left-0 text-xs text-blue-600 bg-white px-1 rounded border border-blue-200">
              Block
            </div>
          </div>
        );
      })}
    </div>
  );
};
