// ABOUTME: Position data validation and sanitization system for eliminating phantom position entries

import { BlockPosition, NodeObject } from '@/types/editor';

interface CanvasConfig {
  width: number;
  minHeight: number;
  gridColumns: number;
}

interface ValidationReport {
  isValid: boolean;
  totalPositions: number;
  validCount: number;
  phantomPositions: string[];
  invalidBounds: string[];
  validPositions: string[];
}

interface ContentBounds {
  bottomEdge: number;
  rightEdge: number;
  contentHeight: number;
  contentWidth: number;
}

export class PositionDataValidator {
  
  /**
   * Detects phantom positions that don't correspond to existing nodes
   */
  detectPhantomPositions(
    positions: Record<string, BlockPosition>, 
    nodes: NodeObject[]
  ): string[] {
    const nodeIds = new Set(nodes.map(node => node.id));
    const phantomIds: string[] = [];
    
    for (const positionId of Object.keys(positions)) {
      if (!nodeIds.has(positionId)) {
        phantomIds.push(positionId);
      }
    }
    
    return phantomIds;
  }

  /**
   * Validates position bounds and coordinates for basic validity only
   */
  validatePositionBounds(
    positions: Record<string, BlockPosition>, 
    canvasConfig: CanvasConfig
  ): string[] {
    const invalidPositionIds: string[] = [];
    
    for (const [positionId, position] of Object.entries(positions)) {
      const issues: string[] = [];
      
      // Only check for obviously invalid data - no arbitrary limits
      // Check for negative coordinates
      if (position.x < 0 || position.y < 0) {
        issues.push('negative coordinates');
      }
      
      // Check for invalid dimensions
      if (position.width <= 0 || position.height <= 0) {
        issues.push('invalid dimensions');
      }
      
      // Check if position extends beyond canvas width
      if (position.x + position.width > canvasConfig.width) {
        issues.push('extends beyond canvas width');
      }
      
      // NOTE: Removed Y coordinate limits - reviews can be very long
      
      if (issues.length > 0) {
        invalidPositionIds.push(positionId);
      }
    }
    
    return invalidPositionIds;
  }

  /**
   * Sanitizes positions by removing phantom entries and invalid bounds
   */
  sanitizePositions(
    positions: Record<string, BlockPosition>, 
    nodes: NodeObject[], 
    canvasConfig: CanvasConfig
  ): Record<string, BlockPosition> {
    // First, remove phantom positions
    const phantomIds = this.detectPhantomPositions(positions, nodes);
    const withoutPhantoms = Object.fromEntries(
      Object.entries(positions).filter(([id]) => !phantomIds.includes(id))
    );
    
    // Then, remove positions with invalid bounds
    const invalidBoundIds = this.validatePositionBounds(withoutPhantoms, canvasConfig);
    const sanitized = Object.fromEntries(
      Object.entries(withoutPhantoms).filter(([id]) => !invalidBoundIds.includes(id))
    );
    
    return sanitized;
  }

  /**
   * Comprehensive position integrity validation with detailed report
   */
  validatePositionIntegrity(
    positions: Record<string, BlockPosition>, 
    nodes: NodeObject[], 
    canvasConfig: CanvasConfig
  ): ValidationReport {
    const phantomPositions = this.detectPhantomPositions(positions, nodes);
    const invalidBounds = this.validatePositionBounds(positions, canvasConfig);
    
    const allInvalidIds = new Set([...phantomPositions, ...invalidBounds]);
    const validPositions = Object.keys(positions).filter(id => !allInvalidIds.has(id));
    
    return {
      isValid: phantomPositions.length === 0 && invalidBounds.length === 0,
      totalPositions: Object.keys(positions).length,
      validCount: validPositions.length,
      phantomPositions,
      invalidBounds,
      validPositions
    };
  }

  /**
   * Calculate content bounds from position data
   */
  calculateContentBounds(positions: Record<string, BlockPosition>): ContentBounds {
    const positionsArray = Object.values(positions);
    
    if (positionsArray.length === 0) {
      return {
        bottomEdge: 0,
        rightEdge: 0,
        contentHeight: 0,
        contentWidth: 0
      };
    }
    
    const bottomEdge = Math.max(...positionsArray.map(pos => pos.y + pos.height));
    const rightEdge = Math.max(...positionsArray.map(pos => pos.x + pos.width));
    
    return {
      bottomEdge,
      rightEdge,
      contentHeight: bottomEdge,
      contentWidth: rightEdge
    };
  }

  /**
   * Calculate optimal canvas height from position data (assumes positions are already validated)
   */
  calculateOptimalHeight(
    positions: Record<string, BlockPosition>, 
    nodes: NodeObject[], 
    canvasConfig: CanvasConfig,
    bottomMargin: number = 60
  ): number {
    const bounds = this.calculateContentBounds(positions);
    
    if (bounds.bottomEdge === 0) {
      return canvasConfig.minHeight;
    }
    
    return Math.max(canvasConfig.minHeight, bounds.bottomEdge + bottomMargin);
  }

  /**
   * Generate detailed sanitization report for debugging
   */
  generateSanitizationReport(
    originalPositions: Record<string, BlockPosition>,
    nodes: NodeObject[], 
    canvasConfig: CanvasConfig
  ) {
    const originalReport = this.validatePositionIntegrity(originalPositions, nodes, canvasConfig);
    const sanitizedPositions = this.sanitizePositions(originalPositions, nodes, canvasConfig);
    const sanitizedReport = this.validatePositionIntegrity(sanitizedPositions, nodes, canvasConfig);
    
    const originalBounds = this.calculateContentBounds(originalPositions);
    const sanitizedBounds = this.calculateContentBounds(sanitizedPositions);
    
    return {
      original: {
        ...originalReport,
        contentBounds: originalBounds,
        calculatedHeight: this.calculateOptimalHeight(originalPositions, nodes, canvasConfig)
      },
      sanitized: {
        ...sanitizedReport,
        contentBounds: sanitizedBounds,
        calculatedHeight: this.calculateOptimalHeight(sanitizedPositions, nodes, canvasConfig)
      },
      improvement: {
        positionsRemoved: originalReport.totalPositions - sanitizedReport.totalPositions,
        heightReduction: this.calculateOptimalHeight(originalPositions, nodes, canvasConfig) - 
                        this.calculateOptimalHeight(sanitizedPositions, nodes, canvasConfig),
        phantomsEliminated: originalReport.phantomPositions.length,
        invalidBoundsFixed: originalReport.invalidBounds.length
      }
    };
  }
}