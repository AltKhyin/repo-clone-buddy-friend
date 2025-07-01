// ABOUTME: Intelligent viewport conversion system for automatic desktop-to-mobile layout optimization

import { NodeObject, LayoutItem, Viewport, Layouts } from '@/types/editor';

/**
 * Mobile optimization rules for different block types
 */
interface BlockMobileRules {
  // Layout rules
  forceFullWidth?: boolean;           // Force to span full mobile width
  stackVertically?: boolean;          // Force vertical stacking on mobile
  preferredMobileColumns?: number;    // Preferred column span (1-4)
  minimumTouchTarget?: number;        // Minimum touch target size (44px)
  
  // Content adaptations
  scaleFont?: number;                 // Font size multiplier for mobile
  adjustSpacing?: 'compact' | 'normal' | 'loose';
  mobileSpecificStyles?: Record<string, any>;
  
  // Positioning rules
  preferredPosition?: 'top' | 'center' | 'bottom';
  stackingPriority?: number;          // Lower = higher priority (appears first)
}

/**
 * Mobile optimization rules by block type
 */
const MOBILE_OPTIMIZATION_RULES: Record<string, BlockMobileRules> = {
  // Text content - prioritize readability
  textBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    scaleFont: 1.1,               // Slightly larger on mobile for readability
    adjustSpacing: 'normal',
    stackingPriority: 3,
  },
  
  // Headings - maintain hierarchy but adapt size  
  headingBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    scaleFont: 0.9,               // Slightly smaller to fit mobile screens
    adjustSpacing: 'compact',
    stackingPriority: 1,          // Headers first
  },
  
  // Images - responsive with aspect ratio preservation
  imageBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    adjustSpacing: 'normal',
    stackingPriority: 2,
    mobileSpecificStyles: {
      objectFit: 'contain',       // Ensure images fit well
      maxHeight: '300px',         // Prevent excessive height on mobile
    },
  },
  
  // Tables - critical mobile optimization needed
  tableBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    adjustSpacing: 'compact',
    stackingPriority: 4,
    mobileSpecificStyles: {
      fontSize: '14px',           // Smaller font for table data
      responsive: 'scroll',       // Enable horizontal scroll if needed
    },
  },
  
  // Polls - touch-friendly
  pollBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    minimumTouchTarget: 44,       // Ensure touch targets are large enough
    adjustSpacing: 'normal',
    stackingPriority: 5,
  },
  
  // Key takeaways - prominent on mobile
  keyTakeawayBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    adjustSpacing: 'loose',       // More padding for emphasis
    stackingPriority: 1,          // High priority for visibility
    mobileSpecificStyles: {
      padding: '20px',
      borderRadius: '12px',
    },
  },
  
  // References - compact but readable
  referenceBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    scaleFont: 0.9,
    adjustSpacing: 'compact',
    stackingPriority: 6,          // Lower priority, often at bottom
  },
  
  // Video embeds - responsive
  videoEmbedBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    adjustSpacing: 'normal',
    stackingPriority: 2,
    mobileSpecificStyles: {
      aspectRatio: '16/9',        // Maintain video aspect ratio
    },
  },
  
  // Separators - subtle on mobile
  separatorBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    adjustSpacing: 'compact',
    stackingPriority: 7,
    mobileSpecificStyles: {
      height: '1px',              // Thinner on mobile
      margin: '16px 0',
    },
  },
  
  // Quotes - readable and prominent
  quoteBlock: {
    forceFullWidth: true,
    stackVertically: true,
    preferredMobileColumns: 4,
    scaleFont: 1.0,
    adjustSpacing: 'loose',
    stackingPriority: 2,
    mobileSpecificStyles: {
      fontStyle: 'italic',
      borderLeft: '4px solid #3b82f6',
      paddingLeft: '16px',
    },
  },
};

/**
 * Intelligent viewport conversion that optimizes layouts for mobile
 */
export class IntelligentViewportConverter {
  /**
   * Convert desktop layout to mobile with intelligent optimizations
   */
  static convertToMobile(
    nodes: NodeObject[],
    currentLayouts: Layouts
  ): { layouts: Layouts; nodeUpdates: Record<string, Partial<NodeObject>> } {
    const desktopLayout = currentLayouts.desktop;
    const nodeUpdates: Record<string, Partial<NodeObject>> = {};
    
    // Step 1: Group and prioritize nodes for mobile stacking
    const prioritizedNodes = this.prioritizeNodesForMobile(nodes, desktopLayout);
    
    // Step 2: Generate mobile layout with intelligent positioning
    const mobileLayoutItems = this.generateMobileLayout(prioritizedNodes, desktopLayout);
    
    // Step 3: Generate content adaptations for mobile
    nodes.forEach(node => {
      const adaptations = this.generateContentAdaptations(node);
      if (Object.keys(adaptations).length > 0) {
        nodeUpdates[node.id] = adaptations;
      }
    });
    
    const optimizedLayouts: Layouts = {
      ...currentLayouts,
      mobile: {
        gridSettings: { columns: 4 },
        items: mobileLayoutItems,
      },
    };
    
    return { layouts: optimizedLayouts, nodeUpdates };
  }
  
  /**
   * Convert mobile layout to desktop with intelligent expansion
   */
  static convertToDesktop(
    nodes: NodeObject[],
    currentLayouts: Layouts
  ): { layouts: Layouts; nodeUpdates: Record<string, Partial<NodeObject>> } {
    const mobileLayout = currentLayouts.mobile;
    const nodeUpdates: Record<string, Partial<NodeObject>> = {};
    
    // Step 1: Analyze content groupings and relationships
    const groupedNodes = this.analyzeContentRelationships(nodes, mobileLayout);
    
    // Step 2: Generate desktop layout with multi-column arrangements
    const desktopLayoutItems = this.generateDesktopLayout(groupedNodes, mobileLayout);
    
    // Step 3: Generate content adaptations for desktop
    nodes.forEach(node => {
      const adaptations = this.generateDesktopContentAdaptations(node);
      if (Object.keys(adaptations).length > 0) {
        nodeUpdates[node.id] = adaptations;
      }
    });
    
    const optimizedLayouts: Layouts = {
      ...currentLayouts,
      desktop: {
        gridSettings: { columns: 12 },
        items: desktopLayoutItems,
      },
    };
    
    return { layouts: optimizedLayouts, nodeUpdates };
  }
  
  /**
   * Prioritize nodes for mobile stacking based on content type and importance
   */
  private static prioritizeNodesForMobile(
    nodes: NodeObject[],
    desktopLayout: any
  ): Array<{ node: NodeObject; layoutItem: LayoutItem | null; priority: number }> {
    return nodes
      .map(node => {
        const layoutItem = desktopLayout.items.find((item: any) => item.nodeId === node.id) || null;
        const rules = MOBILE_OPTIMIZATION_RULES[node.type] || {};
        const priority = rules.stackingPriority || 5;
        
        return { node, layoutItem, priority };
      })
      .sort((a, b) => {
        // Primary sort: by priority
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        
        // Secondary sort: by original desktop Y position
        const aY = a.layoutItem?.y || 0;
        const bY = b.layoutItem?.y || 0;
        return aY - bY;
      });
  }
  
  /**
   * Generate mobile layout with intelligent positioning
   */
  private static generateMobileLayout(
    prioritizedNodes: Array<{ node: NodeObject; layoutItem: LayoutItem | null; priority: number }>,
    desktopLayout: any
  ): LayoutItem[] {
    const mobileItems: LayoutItem[] = [];
    let currentY = 0;
    const MOBILE_ROW_HEIGHT = 20; // Base row height in grid units
    const MOBILE_SPACING = 2;     // Spacing between elements
    
    prioritizedNodes.forEach(({ node, layoutItem }) => {
      const rules = MOBILE_OPTIMIZATION_RULES[node.type] || {};
      
      // Determine mobile dimensions
      const mobileWidth = rules.preferredMobileColumns || 4; // Full width by default
      const mobileHeight = this.calculateMobileHeight(node, layoutItem, rules);
      
      // Position at current Y with proper spacing
      const mobileLayoutItem: LayoutItem = {
        nodeId: node.id,
        x: 0,                    // Always start at left edge on mobile
        y: currentY,
        w: mobileWidth,
        h: mobileHeight,
      };
      
      mobileItems.push(mobileLayoutItem);
      
      // Update Y position for next element
      currentY += mobileHeight + MOBILE_SPACING;
    });
    
    return mobileItems;
  }
  
  /**
   * Calculate appropriate height for mobile based on content and rules
   */
  private static calculateMobileHeight(
    node: NodeObject,
    layoutItem: LayoutItem | null,
    rules: BlockMobileRules
  ): number {
    const baseHeight = layoutItem?.h || 4;
    
    // Block-specific height adjustments for mobile
    switch (node.type) {
      case 'headingBlock':
        return Math.max(2, baseHeight * 0.7); // Headings can be more compact
      
      case 'textBlock':
        return Math.max(3, baseHeight * 1.2); // Text needs more line height on mobile
      
      case 'imageBlock':
        return Math.max(6, baseHeight);        // Images need adequate space
      
      case 'tableBlock':
        return Math.max(8, baseHeight * 1.5);  // Tables need more space on mobile
      
      case 'keyTakeawayBlock':
        return Math.max(4, baseHeight * 1.3);  // Takeaways need emphasis space
      
      case 'separatorBlock':
        return 1;                              // Separators are minimal
      
      default:
        return Math.max(3, baseHeight);
    }
  }
  
  /**
   * Generate content adaptations for mobile viewing
   */
  private static generateContentAdaptations(node: NodeObject): Partial<NodeObject> {
    const rules = MOBILE_OPTIMIZATION_RULES[node.type] || {};
    const adaptations: any = {};
    
    // Apply mobile-specific styles
    if (rules.mobileSpecificStyles) {
      adaptations.data = {
        ...node.data,
        mobileStyles: rules.mobileSpecificStyles,
      };
    }
    
    // Apply font scaling
    if (rules.scaleFont && node.data.fontSize) {
      adaptations.data = {
        ...adaptations.data,
        mobileFontSize: Math.round(node.data.fontSize * rules.scaleFont),
      };
    }
    
    // Apply spacing adjustments
    if (rules.adjustSpacing) {
      const spacingMap = {
        compact: { paddingX: 12, paddingY: 8 },
        normal: { paddingX: 16, paddingY: 12 },
        loose: { paddingX: 20, paddingY: 16 },
      };
      
      adaptations.data = {
        ...adaptations.data,
        mobileSpacing: spacingMap[rules.adjustSpacing],
      };
    }
    
    return adaptations;
  }
  
  /**
   * Analyze content relationships for desktop layout optimization
   */
  private static analyzeContentRelationships(
    nodes: NodeObject[],
    mobileLayout: any
  ): Array<{ nodes: NodeObject[]; canGroup: boolean }> {
    // For now, implement basic grouping logic
    // Future: Implement sophisticated content relationship analysis
    
    const sortedNodes = nodes
      .map(node => {
        const layoutItem = mobileLayout.items.find((item: any) => item.nodeId === node.id);
        return { node, y: layoutItem?.y || 0 };
      })
      .sort((a, b) => a.y - b.y);
    
    // Group consecutive compatible elements
    const groups: Array<{ nodes: NodeObject[]; canGroup: boolean }> = [];
    let currentGroup: NodeObject[] = [];
    
    sortedNodes.forEach(({ node }) => {
      const canGroupWithPrevious = this.canGroupOnDesktop(
        currentGroup[currentGroup.length - 1],
        node
      );
      
      if (currentGroup.length === 0 || canGroupWithPrevious) {
        currentGroup.push(node);
      } else {
        // Start new group
        groups.push({ nodes: [...currentGroup], canGroup: currentGroup.length > 1 });
        currentGroup = [node];
      }
    });
    
    // Add final group
    if (currentGroup.length > 0) {
      groups.push({ nodes: currentGroup, canGroup: currentGroup.length > 1 });
    }
    
    return groups;
  }
  
  /**
   * Check if two nodes can be grouped horizontally on desktop
   */
  private static canGroupOnDesktop(prevNode: NodeObject | undefined, currentNode: NodeObject): boolean {
    if (!prevNode) return true;
    
    // Compatible block types that can be side-by-side
    const compatiblePairs = [
      ['textBlock', 'imageBlock'],
      ['headingBlock', 'textBlock'],
      ['imageBlock', 'textBlock'],
      ['keyTakeawayBlock', 'referenceBlock'],
    ];
    
    return compatiblePairs.some(([type1, type2]) =>
      (prevNode.type === type1 && currentNode.type === type2) ||
      (prevNode.type === type2 && currentNode.type === type1)
    );
  }
  
  /**
   * Generate desktop layout with multi-column arrangements
   */
  private static generateDesktopLayout(
    groupedNodes: Array<{ nodes: NodeObject[]; canGroup: boolean }>,
    mobileLayout: any
  ): LayoutItem[] {
    const desktopItems: LayoutItem[] = [];
    let currentY = 0;
    const DESKTOP_SPACING = 2;
    
    groupedNodes.forEach(({ nodes, canGroup }) => {
      if (canGroup && nodes.length > 1) {
        // Arrange horizontally
        const columnsPerNode = Math.floor(12 / nodes.length);
        nodes.forEach((node, index) => {
          const mobileItem = mobileLayout.items.find((item: any) => item.nodeId === node.id);
          const height = mobileItem?.h || 4;
          
          desktopItems.push({
            nodeId: node.id,
            x: index * columnsPerNode,
            y: currentY,
            w: columnsPerNode,
            h: height,
          });
        });
        
        // Use height of tallest element in group
        const maxHeight = Math.max(...nodes.map(node => {
          const mobileItem = mobileLayout.items.find((item: any) => item.nodeId === node.id);
          return mobileItem?.h || 4;
        }));
        
        currentY += maxHeight + DESKTOP_SPACING;
      } else {
        // Single element - use full width or appropriate width
        nodes.forEach(node => {
          const mobileItem = mobileLayout.items.find((item: any) => item.nodeId === node.id);
          const height = mobileItem?.h || 4;
          const width = this.getDesktopWidth(node);
          
          desktopItems.push({
            nodeId: node.id,
            x: 0,
            y: currentY,
            w: width,
            h: height,
          });
          
          currentY += height + DESKTOP_SPACING;
        });
      }
    });
    
    return desktopItems;
  }
  
  /**
   * Determine appropriate desktop width for a block type
   */
  private static getDesktopWidth(node: NodeObject): number {
    switch (node.type) {
      case 'headingBlock':
      case 'textBlock':
        return 8;  // 8/12 columns for readability
      
      case 'imageBlock':
        return 10; // 10/12 columns for visual impact
      
      case 'tableBlock':
        return 12; // Full width for tables
      
      case 'keyTakeawayBlock':
        return 8;  // 8/12 columns for emphasis
      
      case 'separatorBlock':
        return 12; // Full width separators
      
      default:
        return 10; // Default to 10/12 columns
    }
  }
  
  /**
   * Generate content adaptations for desktop viewing
   */
  private static generateDesktopContentAdaptations(node: NodeObject): Partial<NodeObject> {
    const adaptations: any = {};
    
    // Remove mobile-specific styles and restore desktop defaults
    if (node.data.mobileStyles) {
      adaptations.data = {
        ...node.data,
        mobileStyles: undefined,
      };
    }
    
    if (node.data.mobileFontSize) {
      adaptations.data = {
        ...adaptations.data,
        mobileFontSize: undefined,
      };
    }
    
    if (node.data.mobileSpacing) {
      adaptations.data = {
        ...adaptations.data,
        mobileSpacing: undefined,
      };
    }
    
    return adaptations;
  }
}

/**
 * Enhanced viewport switching with intelligent conversion
 */
export function enhancedSwitchViewport(
  currentViewport: Viewport,
  targetViewport: Viewport,
  nodes: NodeObject[],
  layouts: Layouts
): { layouts: Layouts; nodeUpdates: Record<string, Partial<NodeObject>> } {
  if (currentViewport === targetViewport) {
    return { layouts, nodeUpdates: {} };
  }
  
  if (targetViewport === 'mobile') {
    return IntelligentViewportConverter.convertToMobile(nodes, layouts);
  } else {
    return IntelligentViewportConverter.convertToDesktop(nodes, layouts);
  }
}