// ABOUTME: Unified NodeResizer component with consistent styling and constraints for all block types

import React from 'react';
import { NodeResizer } from '@xyflow/react';
import { getNodeConstraints, getResizeHandleStyles } from '../utils/blockStyling';
import { useEditorStore } from '@/store/editorStore';

interface UnifiedNodeResizerProps {
  isVisible: boolean;
  nodeType: string;
  customConstraints?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

export function UnifiedNodeResizer({ 
  isVisible, 
  nodeType, 
  customConstraints 
}: UnifiedNodeResizerProps) {
  const { canvasTheme } = useEditorStore();
  
  // Get standard constraints and merge with custom ones
  const standardConstraints = getNodeConstraints(nodeType);
  const constraints = { ...standardConstraints, ...customConstraints };
  
  // Get theme-aware handle styles
  const handleStyles = getResizeHandleStyles(canvasTheme);
  
  return (
    <NodeResizer 
      isVisible={isVisible}
      minWidth={constraints.minWidth}
      minHeight={constraints.minHeight}
      maxWidth={constraints.maxWidth}
      maxHeight={constraints.maxHeight}
      handleStyle={handleStyles}
    />
  );
}