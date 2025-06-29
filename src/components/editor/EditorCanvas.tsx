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
  NodeChange,
  Handle,
  Position,
  NodeResizer,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDroppable } from '@dnd-kit/core';
import { debounce } from 'lodash-es';
import { useEditorStore } from '@/store/editorStore';
import { NodeObject } from '@/types/editor';
import { CanvasHelpers } from './CanvasHelpers';
import { TextBlockNode } from './Nodes/TextBlockNode';
import { HeadingBlockNode } from './Nodes/HeadingBlockNode';
import { ImageBlockNode } from './Nodes/ImageBlockNode';
import { VideoEmbedBlockNode } from './Nodes/VideoEmbedBlockNode';

// Custom React Flow node components with Tiptap integration
function CustomTextBlockNode({ data, selected }: { data: { nodeObject: NodeObject }, selected?: boolean }) {
  const { selectedNodeId } = useEditorStore();
  const { nodeObject } = data;
  const isSelected = selected || selectedNodeId === nodeObject.id;

  return (
    <TextBlockNode
      id={nodeObject.id}
      data={nodeObject.data}
      selected={isSelected}
    />
  );
}

function CustomHeadingBlockNode({ data, selected }: { data: { nodeObject: NodeObject }, selected?: boolean }) {
  const { selectedNodeId } = useEditorStore();
  const { nodeObject } = data;
  const isSelected = selected || selectedNodeId === nodeObject.id;

  return (
    <HeadingBlockNode
      id={nodeObject.id}
      data={nodeObject.data}
      selected={isSelected}
    />
  );
}

function CustomImageBlockNode({ data, selected }: { data: { nodeObject: NodeObject }, selected?: boolean }) {
  const { selectedNodeId } = useEditorStore();
  const { nodeObject } = data;
  const isSelected = selected || selectedNodeId === nodeObject.id;

  return (
    <ImageBlockNode
      id={nodeObject.id}
      data={nodeObject.data}
      selected={isSelected}
    />
  );
}

function CustomVideoEmbedBlockNode({ data, selected }: { data: { nodeObject: NodeObject }, selected?: boolean }) {
  const { selectedNodeId } = useEditorStore();
  const { nodeObject } = data;
  const isSelected = selected || selectedNodeId === nodeObject.id;

  return (
    <VideoEmbedBlockNode
      id={nodeObject.id}
      data={nodeObject.data}
      selected={isSelected}
    />
  );
}

// Legacy block renderer for other block types (to be updated in future phases)
function CustomBlockNode({ data, selected }: { data: { nodeObject: NodeObject }, selected?: boolean }) {
  const { selectedNodeId, selectNode } = useEditorStore();
  const { nodeObject } = data;
  const isSelected = selected || selectedNodeId === nodeObject.id;

  const handleClick = useCallback(() => {
    selectNode(nodeObject.id);
  }, [nodeObject.id, selectNode]);

  const renderNodeContent = () => {
    switch (nodeObject.type) {
      case 'textBlock':
      case 'headingBlock':
      case 'imageBlock':
      case 'videoEmbedBlock':
        // These are now handled by dedicated components above
        return null;
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
    <>
      {/* Node Resizer for React Flow */}
      <NodeResizer 
        isVisible={isSelected}
        minWidth={constraints.minWidth}
        minHeight={constraints.minHeight}
        maxWidth={constraints.maxWidth}
        maxHeight={constraints.maxHeight}
        handleStyle={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
        }}
      />
      
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
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-8 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Selected
          </div>
        )}
        
        <div className="w-full h-full overflow-hidden">
          {renderNodeContent()}
        </div>
      </div>
    </>
  );
}

// Define node types for React Flow with Tiptap-enabled components
const nodeTypes: NodeTypes = {
  textBlock: CustomTextBlockNode,
  headingBlock: CustomHeadingBlockNode,
  imageBlock: CustomImageBlockNode,
  videoEmbedBlock: CustomVideoEmbedBlockNode,
  customBlock: CustomBlockNode, // Legacy fallback for other block types
};

export function EditorCanvas() {
  const { 
    nodes: editorNodes, 
    currentViewport, 
    layouts,
    updateLayout,
    addNode,
    canvasTheme,
    showGrid,
    showRulers,
    showGuidelines
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
    const nodesToInit: Array<{ nodeId: string; layoutItem: any }> = [];

    const nodes = editorNodes.map((editorNode, index) => {
      // Find layout position for this node
      const layoutItem = currentLayout.items.find(item => item.nodeId === editorNode.id);
      
      // Default positioning if no layout exists yet
      const defaultX = 50 + (index % 2) * 420; // Alternate columns
      const defaultY = 50 + Math.floor(index / 2) * 150; // Stack rows
      const defaultWidth = Math.min(400, columnWidth * 6); // 6 columns default
      const defaultHeight = 100;

      if (layoutItem) {
        // Convert grid coordinates to pixel coordinates
        const x = layoutItem.x * (columnWidth / 2); // Half-column precision
        const y = layoutItem.y * 20; // 20px grid
        const width = layoutItem.w * (columnWidth / 2);
        const height = layoutItem.h * 20;

        return {
          id: editorNode.id,
          type: editorNode.type === 'textBlock' || editorNode.type === 'headingBlock' ? editorNode.type : 'customBlock',
          position: { x, y },
          data: { nodeObject: editorNode },
          width: width,
          height: height,
          style: {
            width: `${width}px`, 
            height: `${height}px`
          },
        };
      } else {
        // Queue layout update for after render
        nodesToInit.push({
          nodeId: editorNode.id,
          layoutItem: {
            nodeId: editorNode.id,
            x: Math.floor(defaultX / (columnWidth / 2)),
            y: Math.floor(defaultY / 20),
            w: Math.floor(defaultWidth / (columnWidth / 2)),
            h: Math.floor(defaultHeight / 20),
          }
        });

        return {
          id: editorNode.id,
          type: editorNode.type === 'textBlock' || editorNode.type === 'headingBlock' ? editorNode.type : 'customBlock',
          position: { x: defaultX, y: defaultY },
          data: { nodeObject: editorNode },
          width: defaultWidth,
          height: defaultHeight,
          style: {
            width: `${defaultWidth}px`, 
            height: `${defaultHeight}px`
          },
        };
      }
    });

    // Update layouts after render to avoid setState during render
    if (nodesToInit.length > 0) {
      setTimeout(() => {
        nodesToInit.forEach(({ nodeId, layoutItem }) => {
          updateLayout(nodeId, layoutItem, currentViewport);
        });
      }, 0);
    }

    return nodes;
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
    // First apply the changes to React Flow
    onNodesChange(changes);
    
    // Then update our layout store for persistent changes only
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        // Only update layout when drag is complete
        const gridColumns = layouts[currentViewport].gridSettings.columns;
        const columnWidth = 800 / gridColumns;
        
        // Find node dimensions from the current React Flow state
        const node = nodes.find(n => n.id === change.id);
        const width = node?.width || 400;
        const height = node?.height || 100;
        
        const newLayoutItem = {
          nodeId: change.id,
          x: Math.max(0, Math.round(change.position.x / (columnWidth / 2))),
          y: Math.max(0, Math.round(change.position.y / 20)),
          w: Math.max(1, Math.round(width / (columnWidth / 2))),
          h: Math.max(1, Math.round(height / 20)),
        };
        
        debouncedLayoutUpdate(change.id, newLayoutItem, currentViewport);
      }
      
      if (change.type === 'dimensions' && change.dimensions && change.resizing === false) {
        // Only update when resize is complete
        const node = nodes.find(n => n.id === change.id);
        if (node) {
          const gridColumns = layouts[currentViewport].gridSettings.columns;
          const columnWidth = 800 / gridColumns;
          
          const newLayoutItem = {
            nodeId: change.id,
            x: Math.max(0, Math.round(node.position.x / (columnWidth / 2))),
            y: Math.max(0, Math.round(node.position.y / 20)),
            w: Math.max(1, Math.round(change.dimensions.width / (columnWidth / 2))),
            h: Math.max(1, Math.round(change.dimensions.height / 20)),
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
      gridGap: columnWidth,
      rowHeight: 80,
    };
  };

  const gridConfig = getGridConfig();

  return (
    <div 
      className={`flex-1 relative ${
        canvasTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'
      }`} 
      style={{ height: '100%' }}
    >
      {/* Enhanced viewport indicator with grid info */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-sm">
          <div className="text-xs font-medium text-foreground capitalize">
            {currentViewport} View
          </div>
          <div className="text-xs text-muted-foreground">
            {layouts[currentViewport].gridSettings.columns} columns • {gridConfig.gridGap}px grid
          </div>
        </div>
      </div>

      {/* Drop zone overlay */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 rounded-lg flex items-center justify-center z-20 pointer-events-none">
          <p className="text-primary font-medium">Drop block here</p>
        </div>
      )}

      {/* React Flow Canvas */}
      <div ref={setNodeRef} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
        <ReactFlowProvider>
          <ReactFlowWithHelpers 
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            gridConfig={gridConfig}
            editorNodes={editorNodes}
            canvasTheme={canvasTheme}
            showGrid={showGrid}
            showRulers={showRulers}
            showGuidelines={showGuidelines}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

// Inner component that has access to React Flow's context
interface ReactFlowWithHelpersProps {
  nodes: any[];
  edges: any[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  nodeTypes: NodeTypes;
  gridConfig: any;
  editorNodes: NodeObject[];
  canvasTheme: 'light' | 'dark';
  showGrid: boolean;
  showRulers: boolean;
  showGuidelines: boolean;
}

function ReactFlowWithHelpers({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  gridConfig,
  editorNodes,
  canvasTheme,
  showGrid,
  showRulers,
  showGuidelines
}: ReactFlowWithHelpersProps) {
  const { getViewport } = useReactFlow();
  const viewport = getViewport();

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView={false}
        className={canvasTheme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50'}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        onNodeClick={(_, node) => {
          const editorStore = useEditorStore.getState();
          editorStore.selectNode(node.id);
        }}
      >
        <Controls 
          showZoom 
          showFitView 
          showInteractive
          position="bottom-right"
        />
        
        {/* Grid background with column guides */}
        {showGrid && (
          <>
            <Background 
              variant={BackgroundVariant.Lines} 
              gap={gridConfig.gridGap} 
              size={1} 
              className={canvasTheme === 'dark' ? 'opacity-20' : 'opacity-30'}
              color={canvasTheme === 'dark' ? '#3b82f6' : '#6b7280'}
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={gridConfig.gridGap / 2} 
              size={1} 
              className={canvasTheme === 'dark' ? 'opacity-10' : 'opacity-20'}
              color={canvasTheme === 'dark' ? '#3b82f6' : '#6b7280'}
              offset={1}
            />
          </>
        )}
        
        {/* Empty state */}
        {editorNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <h3 className={`text-lg font-medium mb-2 ${
                canvasTheme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                Empty Canvas
              </h3>
              <p className={`text-sm ${
                canvasTheme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
              }`}>
                Drag blocks from the palette to start creating your review
              </p>
            </div>
          </div>
        )}
      </ReactFlow>
      
      {/* Visual Layout Helpers Overlay */}
      {(showRulers || showGuidelines) && (
        <CanvasHelpers 
          width={window.innerWidth || 1200}
          height={window.innerHeight || 800}
          zoom={viewport.zoom}
          offset={{ x: viewport.x, y: viewport.y }}
        />
      )}
    </>
  );
}