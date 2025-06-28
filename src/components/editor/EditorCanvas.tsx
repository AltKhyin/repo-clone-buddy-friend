// ABOUTME: React Flow 2D canvas component with drag-and-drop positioning and resizing

import React, { useCallback, useMemo, useRef } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Controls, 
  Background, 
  BackgroundVariant,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  NodeTypes,
  Connection,
  NodeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDroppable } from '@dnd-kit/core';
import { debounce } from 'lodash-es';
import { useEditorStore } from '@/store/editorStore';
import { NodeObject } from '@/types/editor';

// Custom React Flow node component that wraps our existing block rendering logic
function CustomBlockNode({ data }: { data: { nodeObject: NodeObject } }) {
  const { selectedNodeId, selectNode } = useEditorStore();
  const { nodeObject } = data;
  const isSelected = selectedNodeId === nodeObject.id;

  const handleClick = useCallback(() => {
    selectNode(nodeObject.id);
  }, [nodeObject.id, selectNode]);

  const renderNodeContent = () => {
    switch (nodeObject.type) {
      case 'textBlock':
        return (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: nodeObject.data.htmlContent || '<p>Text block</p>' }}
          />
        );
      case 'headingBlock':
        const HeadingTag = `h${nodeObject.data.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            className="font-semibold m-0"
            dangerouslySetInnerHTML={{ __html: nodeObject.data.htmlContent || 'Heading' }}
          />
        );
      case 'imageBlock':
        return (
          <div className="text-center">
            {nodeObject.data.src ? (
              <img 
                src={nodeObject.data.src} 
                alt={nodeObject.data.alt} 
                className="max-w-full h-auto"
              />
            ) : (
              <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded p-8">
                <p className="text-muted-foreground">Image placeholder</p>
              </div>
            )}
            {nodeObject.data.caption && (
              <p className="text-sm text-muted-foreground mt-2">{nodeObject.data.caption}</p>
            )}
          </div>
        );
      case 'tableBlock':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr>
                  {nodeObject.data.headers.map((header, i) => (
                    <th key={i} className="border border-border p-2 bg-muted font-medium text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodeObject.data.rows.map((row, i) => (
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
            nodeObject.data.theme === 'info' ? 'bg-blue-50 border-blue-400 dark:bg-blue-950' :
            nodeObject.data.theme === 'success' ? 'bg-green-50 border-green-400 dark:bg-green-950' :
            nodeObject.data.theme === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-950' :
            'bg-red-50 border-red-400 dark:bg-red-950'
          }`}>
            <p className="font-medium">{nodeObject.data.content}</p>
          </div>
        );
      case 'separatorBlock':
        return (
          <hr className={`border-0 ${
            nodeObject.data.style === 'solid' ? 'border-solid' :
            nodeObject.data.style === 'dashed' ? 'border-dashed' :
            'border-dotted'
          } border-t-${nodeObject.data.thickness || 1} border-muted-foreground/30`} />
        );
      default:
        return (
          <div className="p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded">
            <p className="text-muted-foreground text-center">
              {nodeObject.type} block
            </p>
          </div>
        );
    }
  };

  // Calculate optimal sizing constraints based on block type
  const getSizeConstraints = () => {
    switch (nodeObject.type) {
      case 'imageBlock':
        return { minWidth: 200, minHeight: 150, maxWidth: 600, maxHeight: 400 };
      case 'tableBlock':
        return { minWidth: 300, minHeight: 120, maxWidth: 800, maxHeight: 500 };
      case 'textBlock':
        return { minWidth: 200, minHeight: 80, maxWidth: 600, maxHeight: 400 };
      case 'headingBlock':
        return { minWidth: 150, minHeight: 50, maxWidth: 500, maxHeight: 100 };
      case 'keyTakeawayBlock':
        return { minWidth: 250, minHeight: 80, maxWidth: 500, maxHeight: 200 };
      case 'separatorBlock':
        return { minWidth: 100, minHeight: 20, maxWidth: 600, maxHeight: 40 };
      default:
        return { minWidth: 200, minHeight: 60, maxWidth: 600, maxHeight: 300 };
    }
  };

  const constraints = getSizeConstraints();

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all bg-background border
        ${isSelected 
          ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary' 
          : 'hover:bg-accent/50 border-border'
        }
        w-full h-full overflow-hidden
      `}
      style={{
        minWidth: `${constraints.minWidth}px`,
        minHeight: `${constraints.minHeight}px`,
        maxWidth: `${constraints.maxWidth}px`,
        maxHeight: `${constraints.maxHeight}px`,
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-8 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
          Selected
        </div>
      )}
      
      {/* Resize handles indicator */}
      {isSelected && (
        <div className="absolute bottom-1 right-1 w-3 h-3 bg-primary/50 cursor-se-resize pointer-events-none">
          <div className="w-full h-full bg-primary/30 border border-primary/50"></div>
        </div>
      )}
      
      <div className="w-full h-full overflow-hidden">
        {renderNodeContent()}
      </div>
    </div>
  );
}

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  customBlock: CustomBlockNode,
};

export function EditorCanvas() {
  const { 
    nodes: editorNodes, 
    currentViewport, 
    layouts,
    updateLayout,
    addNode 
  } = useEditorStore();
  
  const { isOver, setNodeRef } = useDroppable({
    id: 'editor-canvas'
  });

  // Convert our editor nodes to React Flow nodes
  const reactFlowNodes = useMemo(() => {
    const currentLayout = layouts[currentViewport];
    const gridColumns = currentLayout.gridSettings.columns;
    const gridWidth = 800; // Base grid width
    const columnWidth = gridWidth / gridColumns;

    return editorNodes.map((editorNode) => {
      // Find layout position for this node
      const layoutItem = currentLayout.items.find(item => item.nodeId === editorNode.id);
      
      // Default positioning if no layout exists yet
      const defaultX = 50;
      const defaultY = 50 + (editorNodes.indexOf(editorNode) * 120);
      const defaultWidth = Math.min(400, columnWidth * 6); // 6 columns default
      const defaultHeight = 100;

      if (layoutItem) {
        // Convert grid coordinates to pixel coordinates
        const x = layoutItem.x * columnWidth;
        const y = layoutItem.y * 80; // 80px row height
        const width = layoutItem.w * columnWidth;
        const height = layoutItem.h * 80;

        return {
          id: editorNode.id,
          type: 'customBlock',
          position: { x, y },
          data: { nodeObject: editorNode },
          style: { 
            width: `${width}px`, 
            height: `${height}px`,
            minWidth: '200px',
            minHeight: '60px'
          },
          resizable: true,
          draggable: true,
        };
      } else {
        // Create default layout item
        const newLayoutItem = {
          nodeId: editorNode.id,
          x: Math.floor(defaultX / columnWidth),
          y: Math.floor(defaultY / 80),
          w: Math.floor(defaultWidth / columnWidth),
          h: Math.floor(defaultHeight / 80),
        };
        
        // Update layout in store
        updateLayout(editorNode.id, newLayoutItem, currentViewport);

        return {
          id: editorNode.id,
          type: 'customBlock',
          position: { x: defaultX, y: defaultY },
          data: { nodeObject: editorNode },
          style: { 
            width: `${defaultWidth}px`, 
            height: `${defaultHeight}px`,
            minWidth: '200px',
            minHeight: '60px',
            maxWidth: '800px'
          },
          resizable: true,
          draggable: true,
        };
      }
    });
  }, [editorNodes, layouts, currentViewport, updateLayout]);

  // React Flow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update React Flow nodes when editor nodes change or viewport switches
  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  // Force React Flow refresh when viewport changes to ensure proper layout adaptation
  React.useEffect(() => {
    // Small delay to ensure the layout calculations are complete
    const timer = setTimeout(() => {
      setNodes(reactFlowNodes);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentViewport, reactFlowNodes, setNodes]);

  // Debounced layout update to improve performance
  const debouncedLayoutUpdate = useRef(
    debounce((nodeId: string, layoutItem: any, viewport: string) => {
      updateLayout(nodeId, layoutItem, viewport);
    }, 200)
  ).current;

  // Handle node position/size changes with improved layout sync
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    
    // Update layout in store when nodes are moved or resized
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && !change.dragging) {
        // Only update when drag is complete
        const node = nodes.find(n => n.id === change.id);
        if (node) {
          const gridColumns = layouts[currentViewport].gridSettings.columns;
          const columnWidth = 800 / gridColumns;
          
          const newLayoutItem = {
            nodeId: change.id,
            x: Math.max(0, Math.floor(change.position.x / (columnWidth / 2))), // Allow half-column precision
            y: Math.max(0, Math.floor(change.position.y / 20)), // 20px precision for Y
            w: node.style?.width ? Math.max(1, Math.floor(parseInt(node.style.width as string) / (columnWidth / 2))) : 12,
            h: node.style?.height ? Math.max(1, Math.floor(parseInt(node.style.height as string) / 20)) : 4,
          };
          
          debouncedLayoutUpdate(change.id, newLayoutItem, currentViewport);
        }
      }
      
      if (change.type === 'dimensions' && change.dimensions) {
        const gridColumns = layouts[currentViewport].gridSettings.columns;
        const columnWidth = 800 / gridColumns;
        const node = nodes.find(n => n.id === change.id);
        
        if (node) {
          const newLayoutItem = {
            nodeId: change.id,
            x: node.position.x ? Math.max(0, Math.floor(node.position.x / (columnWidth / 2))) : 0,
            y: node.position.y ? Math.max(0, Math.floor(node.position.y / 20)) : 0,
            w: Math.max(1, Math.floor(change.dimensions.width / (columnWidth / 2))),
            h: Math.max(1, Math.floor(change.dimensions.height / 20)),
          };
          
          debouncedLayoutUpdate(change.id, newLayoutItem, currentViewport);
        }
      }
    });
  }, [nodes, layouts, currentViewport, debouncedLayoutUpdate, onNodesChange]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Calculate grid settings based on viewport
  const getGridConfig = () => {
    const currentLayout = layouts[currentViewport];
    const gridColumns = currentLayout.gridSettings.columns;
    const gridWidth = 800;
    const columnWidth = gridWidth / gridColumns;
    
    return {
      snapGrid: [columnWidth / 2, 20] as [number, number], // Snap to half-column increments
      gridGap: columnWidth,
      rowHeight: 80,
    };
  };

  const gridConfig = getGridConfig();

  return (
    <div className="flex-1 bg-background relative">
      {/* Enhanced viewport indicator with grid info */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-sm">
          <div className="text-xs font-medium text-foreground capitalize">
            {currentViewport} View
          </div>
          <div className="text-xs text-muted-foreground">
            {layouts[currentViewport].gridSettings.columns} columns • {gridConfig.snapGrid[0]}px grid
          </div>
        </div>
      </div>

      {/* Drop zone overlay */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 rounded-lg flex items-center justify-center z-20">
          <p className="text-primary font-medium">Drop block here</p>
        </div>
      )}

      {/* React Flow Canvas */}
      <div ref={setNodeRef} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={gridConfig.snapGrid}
          className="bg-background"
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls 
            showZoom 
            showFitView 
            showInteractive
            position="bottom-right"
          />
          
          {/* Grid background with column guides */}
          <Background 
            variant={BackgroundVariant.Lines} 
            gap={gridConfig.gridGap} 
            size={1} 
            className="opacity-20"
            color="#3b82f6"
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={gridConfig.snapGrid[0]} 
            size={1} 
            className="opacity-10"
            offset={1}
          />
          
          {/* Empty state */}
          {editorNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Empty Canvas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag blocks from the palette to start creating your review
                </p>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}