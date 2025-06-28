// ABOUTME: Main editor canvas component with grid layout and drag-and-drop functionality

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditorStore } from '@/store/editorStore';
import { NodeObject } from '@/types/editor';

function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg width="100%" height="100%" className="text-muted-foreground/20">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function CanvasNode({ node }: { node: NodeObject }) {
  const { selectedNodeId, selectNode } = useEditorStore();
  const isSelected = selectedNodeId === node.id;

  const handleClick = () => {
    selectNode(node.id);
  };

  const renderNodeContent = () => {
    switch (node.type) {
      case 'textBlock':
        return (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: node.data.htmlContent || '<p>Text block</p>' }}
          />
        );
      case 'headingBlock':
        const HeadingTag = `h${node.data.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            className="font-semibold m-0"
            dangerouslySetInnerHTML={{ __html: node.data.htmlContent || 'Heading' }}
          />
        );
      case 'imageBlock':
        return (
          <div className="text-center">
            {node.data.src ? (
              <img 
                src={node.data.src} 
                alt={node.data.alt} 
                className="max-w-full h-auto"
              />
            ) : (
              <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded p-8">
                <p className="text-muted-foreground">Image placeholder</p>
              </div>
            )}
            {node.data.caption && (
              <p className="text-sm text-muted-foreground mt-2">{node.data.caption}</p>
            )}
          </div>
        );
      case 'tableBlock':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr>
                  {node.data.headers.map((header, i) => (
                    <th key={i} className="border border-border p-2 bg-muted font-medium text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {node.data.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-border p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'keyTakeawayBlock':
        return (
          <div className={`p-4 rounded-lg border-l-4 ${
            node.data.theme === 'info' ? 'bg-blue-50 border-blue-400 dark:bg-blue-950' :
            node.data.theme === 'success' ? 'bg-green-50 border-green-400 dark:bg-green-950' :
            node.data.theme === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-950' :
            'bg-red-50 border-red-400 dark:bg-red-950'
          }`}>
            <p className="font-medium">{node.data.content}</p>
          </div>
        );
      case 'separatorBlock':
        return (
          <hr className={`border-0 ${
            node.data.style === 'solid' ? 'border-solid' :
            node.data.style === 'dashed' ? 'border-dashed' :
            'border-dotted'
          } border-t-${node.data.thickness || 1} border-muted-foreground/30`} />
        );
      default:
        return (
          <div className="p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded">
            <p className="text-muted-foreground text-center">
              {node.type} block
            </p>
          </div>
        );
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-2 rounded-lg cursor-pointer transition-all
        ${isSelected 
          ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' 
          : 'hover:bg-accent/50'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
          Selected
        </div>
      )}
      
      {renderNodeContent()}
    </div>
  );
}

export function EditorCanvas() {
  const { nodes, addNode, currentViewport } = useEditorStore();
  const { isOver, setNodeRef } = useDroppable({
    id: 'editor-canvas'
  });

  return (
    <div className="flex-1 bg-background relative overflow-auto">
      <GridOverlay />
      
      <div 
        ref={setNodeRef}
        className={`
          min-h-full p-8 relative
          ${isOver ? 'bg-accent/20' : ''}
        `}
      >
        {/* Viewport indicator */}
        <div className="absolute top-4 right-4 text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
          {currentViewport} view
        </div>

        {/* Canvas content */}
        <div className="max-w-4xl mx-auto space-y-4">
          {nodes.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Empty Canvas
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag blocks from the palette to start creating your review
              </p>
            </div>
          ) : (
            nodes.map((node) => (
              <CanvasNode key={node.id} node={node} />
            ))
          )}
        </div>

        {/* Drop zone indicator */}
        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 rounded-lg flex items-center justify-center">
            <p className="text-primary font-medium">Drop block here</p>
          </div>
        )}
      </div>
    </div>
  );
}