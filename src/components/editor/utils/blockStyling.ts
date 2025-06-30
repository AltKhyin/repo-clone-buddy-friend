// ABOUTME: Unified styling utilities for block nodes - selection, borders, and resize handles

import { useEditorStore } from '@/store/editorStore';

export interface BlockBorderData {
  borderWidth?: number;
  borderColor?: string;
}

export interface NodeConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Gets unified selection classes with theme awareness
 */
export const getSelectionClasses = (selected: boolean, canvasTheme: 'light' | 'dark') => {
  if (!selected) {
    return 'hover:shadow-md transition-all duration-200';
  }
  
  const ringOffset = canvasTheme === 'dark' ? 'ring-offset-gray-900' : 'ring-offset-white';
  return `ring-2 ring-primary ring-offset-2 shadow-lg transition-all duration-200 ${ringOffset}`;
};

/**
 * Gets unified border styles that respect border controls
 */
export const getBorderStyles = (borderData: BlockBorderData, canvasTheme: 'light' | 'dark') => {
  const borderWidth = borderData.borderWidth || 0;
  const borderColor = borderData.borderColor || (canvasTheme === 'dark' ? '#374151' : '#e5e7eb');
  
  return {
    borderWidth: borderWidth > 0 ? `${borderWidth}px` : '0px',
    borderColor: borderWidth > 0 ? borderColor : 'transparent',
    borderStyle: borderWidth > 0 ? 'solid' : 'none',
  } as React.CSSProperties;
};

/**
 * Gets unified NodeResizer handle styles with theme awareness
 */
export const getResizeHandleStyles = (canvasTheme: 'light' | 'dark') => {
  return {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6', // Primary blue
    border: `2px solid ${canvasTheme === 'dark' ? '#1f2937' : '#ffffff'}`,
    boxShadow: canvasTheme === 'dark' 
      ? '0 2px 8px rgba(0,0,0,0.3)' 
      : '0 2px 4px rgba(0,0,0,0.1)',
  };
};

/**
 * Gets standard node constraints by block type
 */
export const getNodeConstraints = (nodeType: string): NodeConstraints => {
  switch (nodeType) {
    case 'textBlock':
      return { minWidth: 200, minHeight: 80, maxWidth: 800, maxHeight: 600 };
    case 'headingBlock':
      return { minWidth: 150, minHeight: 50, maxWidth: 600, maxHeight: 150 };
    case 'imageBlock':
      return { minWidth: 200, minHeight: 150, maxWidth: 800, maxHeight: 600 };
    case 'videoEmbedBlock':
      return { minWidth: 300, minHeight: 200, maxWidth: 800, maxHeight: 600 };
    case 'tableBlock':
      return { minWidth: 300, minHeight: 120, maxWidth: 1000, maxHeight: 800 };
    case 'pollBlock':
      return { minWidth: 250, minHeight: 150, maxWidth: 600, maxHeight: 500 };
    case 'keyTakeawayBlock':
      return { minWidth: 250, minHeight: 80, maxWidth: 600, maxHeight: 300 };
    case 'separatorBlock':
      return { minWidth: 100, minHeight: 20, maxWidth: 800, maxHeight: 40 };
    default:
      return { minWidth: 200, minHeight: 60, maxWidth: 600, maxHeight: 400 };
  }
};

/**
 * Custom hook to get all unified styling for a block node
 */
export const useUnifiedBlockStyling = (
  nodeType: string,
  selected: boolean,
  borderData: BlockBorderData
) => {
  const { canvasTheme } = useEditorStore();
  
  return {
    selectionClasses: getSelectionClasses(selected, canvasTheme),
    borderStyles: getBorderStyles(borderData, canvasTheme),
    resizeHandleStyles: getResizeHandleStyles(canvasTheme),
    nodeConstraints: getNodeConstraints(nodeType),
  };
};

/**
 * Gets theme-aware default text colors for block content
 */
export const getThemeAwareTextColor = (canvasTheme: 'light' | 'dark', customColor?: string) => {
  if (customColor && customColor !== 'inherit') {
    return customColor;
  }
  
  // Return CSS-compatible color values for default text
  return canvasTheme === 'dark' ? '#f3f4f6' : '#111827'; // gray-100 : gray-900
};

/**
 * Gets theme-aware background color for block content
 */
export const getThemeAwareBackgroundColor = (canvasTheme: 'light' | 'dark', customBackground?: string) => {
  if (customBackground && customBackground !== 'transparent') {
    return customBackground;
  }
  
  // Return transparent by default, letting the canvas theme show through
  return 'transparent';
};

/**
 * Gets theme-aware placeholder text classes
 */
export const getThemeAwarePlaceholderClasses = (canvasTheme: 'light' | 'dark') => {
  return canvasTheme === 'dark' ? 'text-gray-500 italic' : 'text-gray-400 italic';
};

/**
 * Gets theme-aware muted text classes for secondary content
 */
export const getThemeAwareMutedTextClasses = (canvasTheme: 'light' | 'dark') => {
  return canvasTheme === 'dark' ? 'text-gray-400' : 'text-gray-600';
};

/**
 * Gets selection indicator component props
 */
export const getSelectionIndicatorProps = (nodeType: string) => {
  return {
    className: "absolute -top-8 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10",
    children: `${nodeType.replace('Block', '')} selected`
  };
};