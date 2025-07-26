// ABOUTME: Optimized React Flow configuration and performance hooks for editor canvas

import { useMemo, useCallback } from 'react';
import {
  ConnectionMode,
  ConnectionLineType,
  ReactFlowProps,
  DefaultEdgeOptions,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import { useEditorStore } from '@/store/editorStore';

// Import unified Rich Block node component
import { RichBlockNode } from '@/components/editor/Nodes/RichBlockNode';

// Define node types - unified Rich Block architecture
export const nodeTypes: NodeTypes = {
  richBlock: RichBlockNode,
};

// Edge types (can be extended later)
export const edgeTypes: EdgeTypes = {};

// Default edge options for performance
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { strokeWidth: 2, stroke: '#94a3b8' },
};

export function useOptimizedReactFlow() {
  const { canvasTheme } = useEditorStore();

  // Memoize React Flow configuration
  const reactFlowConfig = useMemo<Partial<ReactFlowProps>>(
    () => ({
      nodeTypes,
      edgeTypes,
      defaultEdgeOptions,
      connectionMode: ConnectionMode.Loose,
      connectionLineType: ConnectionLineType.SmoothStep,

      // Performance optimizations
      attributionPosition: 'bottom-left',
      proOptions: { hideAttribution: true },

      // Viewport settings
      fitView: false,
      fitViewOptions: {
        padding: 0.1,
        includeHiddenNodes: false,
        minZoom: 0.5,
        maxZoom: 2,
      },

      // Interaction settings
      nodesDraggable: true,
      nodesConnectable: false,
      elementsSelectable: true,
      selectNodesOnDrag: false,
      panOnDrag: true,
      zoomOnDoubleClick: false,
      zoomOnScroll: true,
      preventScrolling: true,

      // Performance settings
      nodeExtent: [
        [-1000, -1000],
        [1000, 1000],
      ],
      translateExtent: [
        [-2000, -2000],
        [2000, 2000],
      ],

      // Theme-based styling
      style: {
        backgroundColor: canvasTheme === 'dark' ? '#0f172a' : '#f8fafc',
      },
    }),
    [canvasTheme]
  );

  // Optimized selection handler
  const onSelectionChange = useCallback(({ nodes }: { nodes: any[] }) => {
    // Handle multi-selection efficiently
    if (nodes.length === 1) {
      useEditorStore.getState().selectNode(nodes[0].id);
    } else if (nodes.length === 0) {
      useEditorStore.getState().selectNode(null);
    } else {
      // Multi-selection logic can be added here
      useEditorStore.getState().selectNode(nodes[0].id);
    }
  }, []);

  // Optimized node drag handler
  const onNodeDragStop = useCallback((event: any, node: any) => {
    // Update node position efficiently
    const { updateNodePosition } = useEditorStore.getState();
    updateNodePosition(node.id, node.position);
  }, []);

  // Connection handlers (disabled for now)
  const onConnect = useCallback(() => {
    // Connections disabled for blocks
  }, []);

  return {
    reactFlowConfig,
    handlers: {
      onSelectionChange,
      onNodeDragStop,
      onConnect,
    },
  };
}

// Hook for optimizing node data updates
export function useOptimizedNodeUpdates() {
  const updateNode = useEditorStore(state => state.updateNode);

  // Debounced update function for performance
  const debouncedUpdate = useCallback(
    (nodeId: string, updates: any) => {
      // Use a simple debounce mechanism
      const timeoutId = setTimeout(() => {
        updateNode(nodeId, updates);
      }, 100);

      return () => clearTimeout(timeoutId);
    },
    [updateNode]
  );

  return { debouncedUpdate };
}
