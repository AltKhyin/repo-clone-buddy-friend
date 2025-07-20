// ABOUTME: Migration utility to convert existing heading blocks to unified text blocks

import { NodeObject } from '@/types/editor';

/**
 * Migrates a heading block to the unified text block format
 * @param headingBlock - The heading block to migrate
 * @returns The migrated text block
 */
export function migrateHeadingBlockToTextBlock(headingBlock: NodeObject): NodeObject {
  if (headingBlock.type !== 'headingBlock') {
    throw new Error('Cannot migrate non-heading block');
  }

  // Extract heading level from the old format
  const oldData = headingBlock.data as any;
  const headingLevel = oldData.level || 1;

  // Create the unified text block data
  const unifiedData = {
    // Core content
    htmlContent: oldData.htmlContent || `<h${headingLevel}>Your heading here</h${headingLevel}>`,

    // Unified text/heading functionality
    headingLevel: headingLevel as 1 | 2 | 3 | 4,

    // Typography properties (preserve existing values)
    fontSize: oldData.fontSize,
    textAlign: oldData.textAlign || 'left',
    color: oldData.color,
    lineHeight: oldData.lineHeight,
    fontFamily: oldData.fontFamily,
    fontWeight: oldData.fontWeight,
    letterSpacing: oldData.letterSpacing,
    textTransform: oldData.textTransform || 'none',
    textDecoration: oldData.textDecoration || 'none',

    // Background and borders (preserve existing values)
    backgroundColor: oldData.backgroundColor || 'transparent',
    paddingX: oldData.paddingX || 0,
    paddingY: oldData.paddingY || 0,
    borderRadius: oldData.borderRadius || 0,
    borderWidth: oldData.borderWidth || 0,
    borderColor: oldData.borderColor || 'transparent',
  };

  // Return the migrated text block
  return {
    id: headingBlock.id,
    type: 'textBlock',
    data: unifiedData,
    position: headingBlock.position,
    metadata: {
      ...headingBlock.metadata,
      migratedFrom: 'headingBlock',
      migratedAt: new Date().toISOString(),
    },
  };
}

/**
 * Migrates all heading blocks in an array of nodes to unified text blocks
 * @param nodes - Array of nodes to migrate
 * @returns Array of nodes with heading blocks migrated to text blocks
 */
export function migrateAllHeadingBlocks(nodes: NodeObject[]): NodeObject[] {
  return nodes.map(node => {
    if (node.type === 'headingBlock') {
      console.log(`[Migration] Converting heading block ${node.id} to text block`);
      return migrateHeadingBlockToTextBlock(node);
    }
    return node;
  });
}

/**
 * Checks if a node is a legacy heading block that needs migration
 * @param node - The node to check
 * @returns True if the node is a legacy heading block
 */
export function isLegacyHeadingBlock(node: NodeObject): boolean {
  return node.type === 'headingBlock';
}

/**
 * Checks if a node is a migrated heading block (text block with headingLevel)
 * @param node - The node to check
 * @returns True if the node is a migrated heading block
 */
export function isMigratedHeadingBlock(node: NodeObject): boolean {
  return (
    node.type === 'textBlock' && node.data && typeof (node.data as any).headingLevel === 'number'
  );
}

/**
 * Gets migration statistics for a set of nodes
 * @param nodes - Array of nodes to analyze
 * @returns Migration statistics
 */
export function getMigrationStats(nodes: NodeObject[]): {
  totalNodes: number;
  legacyHeadingBlocks: number;
  migratedHeadingBlocks: number;
  regularTextBlocks: number;
  otherBlocks: number;
} {
  const stats = {
    totalNodes: nodes.length,
    legacyHeadingBlocks: 0,
    migratedHeadingBlocks: 0,
    regularTextBlocks: 0,
    otherBlocks: 0,
  };

  nodes.forEach(node => {
    if (isLegacyHeadingBlock(node)) {
      stats.legacyHeadingBlocks++;
    } else if (isMigratedHeadingBlock(node)) {
      stats.migratedHeadingBlocks++;
    } else if (node.type === 'textBlock') {
      stats.regularTextBlocks++;
    } else {
      stats.otherBlocks++;
    }
  });

  return stats;
}

/**
 * Validates that a migrated heading block has the correct structure
 * @param migratedNode - The migrated node to validate
 * @returns True if the migration is valid
 */
export function validateMigratedHeadingBlock(migratedNode: NodeObject): boolean {
  if (migratedNode.type !== 'textBlock') {
    return false;
  }

  const data = migratedNode.data as any;

  // Check that headingLevel is present and valid
  if (!data.headingLevel || ![1, 2, 3, 4].includes(data.headingLevel)) {
    return false;
  }

  // Check that required properties are present
  if (!data.htmlContent || typeof data.htmlContent !== 'string') {
    return false;
  }

  // Check that metadata indicates this was migrated
  if (!migratedNode.metadata?.migratedFrom) {
    return false;
  }

  return true;
}

/**
 * Batch migrate nodes with progress tracking
 * @param nodes - Array of nodes to migrate
 * @param onProgress - Progress callback (optional)
 * @returns Promise of migrated nodes
 */
export async function batchMigrateHeadingBlocks(
  nodes: NodeObject[],
  onProgress?: (progress: number, total: number) => void
): Promise<NodeObject[]> {
  const total = nodes.length;
  const migrated: NodeObject[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (isLegacyHeadingBlock(node)) {
      migrated.push(migrateHeadingBlockToTextBlock(node));
    } else {
      migrated.push(node);
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }

    // Yield control to prevent blocking UI
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return migrated;
}

/**
 * Rollback a migrated heading block to its original format (if needed)
 * @param migratedNode - The migrated text block to rollback
 * @returns The original heading block format
 */
export function rollbackMigratedHeadingBlock(migratedNode: NodeObject): NodeObject {
  if (!validateMigratedHeadingBlock(migratedNode)) {
    throw new Error('Cannot rollback non-migrated heading block');
  }

  const data = migratedNode.data as any;

  // Create the original heading block data
  const originalData = {
    htmlContent: data.htmlContent,
    level: data.headingLevel,
    textAlign: data.textAlign,
    color: data.color,
    fontFamily: data.fontFamily,
    fontWeight: data.fontWeight,
    fontSize: data.fontSize,
    lineHeight: data.lineHeight,
    letterSpacing: data.letterSpacing,
    textTransform: data.textTransform,
    textDecoration: data.textDecoration,
    backgroundColor: data.backgroundColor,
    paddingX: data.paddingX,
    paddingY: data.paddingY,
    borderRadius: data.borderRadius,
    borderWidth: data.borderWidth,
    borderColor: data.borderColor,
  };

  return {
    id: migratedNode.id,
    type: 'headingBlock',
    data: originalData,
    position: migratedNode.position,
    metadata: {
      ...migratedNode.metadata,
      rolledBackFrom: 'textBlock',
      rolledBackAt: new Date().toISOString(),
    },
  };
}
