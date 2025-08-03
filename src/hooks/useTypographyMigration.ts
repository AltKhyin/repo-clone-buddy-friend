// ABOUTME: Hook for managing typography migration from block-level to selection-based formatting

import { useState, useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import {
  createTypographyMigration,
  type BlockTypographyData,
  type MigrationResult,
  batchMigrateBlocks,
} from '@/components/editor/shared/typography-migration';

export interface MigrationState {
  isProcessing: boolean;
  currentBlockId: string | null;
  progress: number;
  totalBlocks: number;
  completedBlocks: number;
  results: Array<{ blockId: string; result: MigrationResult }>;
  errors: string[];
}

export function useTypographyMigration() {
  const { nodes, getEditor, updateNode } = useEditorStore();
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isProcessing: false,
    currentBlockId: null,
    progress: 0,
    totalBlocks: 0,
    completedBlocks: 0,
    results: [],
    errors: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Migrate typography for a single block
   */
  const migrateSingleBlock = useCallback(
    async (blockId: string, blockData: BlockTypographyData): Promise<MigrationResult> => {
      const editor = getEditor(blockId);
      if (!editor) {
        throw new Error(`Editor not found for block ${blockId}`);
      }

      const migration = createTypographyMigration(editor);
      return migration.migrateBlockTypographyToMarks(blockData);
    },
    [getEditor]
  );

  /**
   * Preview migration for a single block
   */
  const previewSingleBlock = useCallback(
    (blockId: string, blockData: BlockTypographyData) => {
      const editor = getEditor(blockId);
      if (!editor) {
        throw new Error(`Editor not found for block ${blockId}`);
      }

      const migration = createTypographyMigration(editor);
      return migration.previewMigration(blockData);
    },
    [getEditor]
  );

  /**
   * Migrate all blocks with typography data
   */
  const migrateAllBlocks = useCallback(
    async (onProgress?: (current: number, total: number, blockId: string) => void) => {
      // Find all blocks with typography data
      const blocksToMigrate = nodes.filter(node => {
        const hasTypographyData = node.data && (
          node.data.fontFamily ||
          node.data.fontSize ||
          node.data.fontWeight ||
          node.data.color ||
          node.data.backgroundColor ||
          node.data.textTransform ||
          node.data.letterSpacing ||
          node.data.lineHeight ||
          node.data.textAlign
        );
        return hasTypographyData;
      });

      if (blocksToMigrate.length === 0) {
        return {
          success: true,
          message: 'No blocks with typography data found',
          results: [],
        };
      }

      setMigrationState(prev => ({
        ...prev,
        isProcessing: true,
        totalBlocks: blocksToMigrate.length,
        completedBlocks: 0,
        progress: 0,
        results: [],
        errors: [],
      }));

      try {
        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        const migrationBlocks = blocksToMigrate.map(node => {
          const editor = getEditor(node.id);
          if (!editor) {
            throw new Error(`Editor not found for block ${node.id}`);
          }

          return {
            editor,
            data: node.data as BlockTypographyData,
            blockId: node.id,
          };
        });

        const results = batchMigrateBlocks(
          migrationBlocks,
          (current, total, blockId) => {
            const progress = Math.round((current / total) * 100);
            
            setMigrationState(prev => ({
              ...prev,
              currentBlockId: blockId,
              progress,
              completedBlocks: current,
            }));

            onProgress?.(current, total, blockId);

            // Check for abort signal
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('Migration cancelled by user');
            }
          }
        );

        // Update migration state with results
        setMigrationState(prev => ({
          ...prev,
          isProcessing: false,
          results,
          currentBlockId: null,
        }));

        // Update block data to reflect successful migrations
        results.forEach(({ blockId, result }) => {
          if (result.success && result.migratedProperties.length > 0) {
            // Clear migrated properties from block data
            const clearedData = { ...nodes.find(n => n.id === blockId)?.data };
            result.migratedProperties.forEach(prop => {
              delete clearedData[prop as keyof typeof clearedData];
            });
            
            updateNode(blockId, { data: clearedData });
          }
        });

        return {
          success: true,
          message: `Successfully processed ${results.length} blocks`,
          results,
        };

      } catch (error) {
        setMigrationState(prev => ({
          ...prev,
          isProcessing: false,
          errors: [...prev.errors, String(error)],
        }));

        return {
          success: false,
          message: `Migration failed: ${error}`,
          results: [],
        };
      }
    },
    [nodes, getEditor, updateNode]
  );

  /**
   * Cancel ongoing migration
   */
  const cancelMigration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setMigrationState(prev => ({
      ...prev,
      isProcessing: false,
      currentBlockId: null,
    }));
  }, []);

  /**
   * Reset migration state
   */
  const resetMigrationState = useCallback(() => {
    setMigrationState({
      isProcessing: false,
      currentBlockId: null,
      progress: 0,
      totalBlocks: 0,
      completedBlocks: 0,
      results: [],
      errors: [],
    });
  }, []);

  /**
   * Get migration statistics
   */
  const getMigrationStats = useCallback(() => {
    const totalMigrated = migrationState.results.reduce(
      (sum, { result }) => sum + result.appliedMarksCount,
      0
    );

    const successfulBlocks = migrationState.results.filter(
      ({ result }) => result.success
    ).length;

    const failedBlocks = migrationState.results.filter(
      ({ result }) => !result.success
    ).length;

    return {
      totalBlocks: migrationState.totalBlocks,
      completedBlocks: migrationState.completedBlocks,
      successfulBlocks,
      failedBlocks,
      totalMigrated,
      isComplete: migrationState.completedBlocks === migrationState.totalBlocks && !migrationState.isProcessing,
    };
  }, [migrationState]);

  /**
   * Check if any blocks need migration
   */
  const getBlocksNeedingMigration = useCallback(() => {
    return nodes.filter(node => {
      const hasTypographyData = node.data && (
        node.data.fontFamily ||
        node.data.fontSize ||
        node.data.fontWeight ||
        node.data.color ||
        node.data.backgroundColor ||
        node.data.textTransform ||
        node.data.letterSpacing ||
        node.data.lineHeight ||
        node.data.textAlign
      );
      return hasTypographyData;
    });
  }, [nodes]);

  return {
    // State
    migrationState,
    migrationStats: getMigrationStats(),
    blocksNeedingMigration: getBlocksNeedingMigration(),

    // Actions
    migrateSingleBlock,
    previewSingleBlock,
    migrateAllBlocks,
    cancelMigration,
    resetMigrationState,

    // Utilities
    hasPendingMigrations: getBlocksNeedingMigration().length > 0,
    isProcessing: migrationState.isProcessing,
  };
}