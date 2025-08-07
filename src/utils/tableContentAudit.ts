// ABOUTME: Database audit and migration system for customTable content

import { supabase } from '@/integrations/supabase/client';
import { 
  detectCustomTableNodes, 
  migrateCustomTableToBasic, 
  validateMigration,
  type MigrationResult 
} from '@/components/editor/extensions/BasicTable/contentMigration';

/**
 * Audit result for a single review
 */
export interface ReviewAuditResult {
  reviewId: string;
  title: string;
  hasCustomTables: boolean;
  customTableCount: number;
  contentSize: number;
  migrationRequired: boolean;
  lastUpdated: string;
}

/**
 * Comprehensive audit summary
 */
export interface AuditSummary {
  totalReviews: number;
  reviewsWithCustomTables: number;
  totalCustomTables: number;
  estimatedMigrationTime: number; // in minutes
  affectedReviewIds: string[];
  sampleProblematicContent?: any;
}

/**
 * Migration execution result
 */
export interface MigrationExecutionResult {
  reviewId: string;
  success: boolean;
  migrationResult: MigrationResult;
  backupCreated: boolean;
  timeElapsed: number;
  error?: string;
}

/**
 * Scans the database for reviews containing customTable nodes
 */
export async function auditDatabaseForCustomTables(): Promise<{
  success: boolean;
  audit: AuditSummary;
  reviewResults: ReviewAuditResult[];
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    console.log('[TableAudit] 🔍 Starting comprehensive database audit for customTable nodes...');

    // Fetch all reviews with their content
    const { data: reviews, error: fetchError } = await supabase
      .from('reviews')
      .select('id, title, content, updated_at')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch reviews: ${fetchError.message}`);
    }

    if (!reviews || reviews.length === 0) {
      return {
        success: true,
        audit: {
          totalReviews: 0,
          reviewsWithCustomTables: 0,
          totalCustomTables: 0,
          estimatedMigrationTime: 0,
          affectedReviewIds: [],
        },
        reviewResults: [],
      };
    }

    // Audit each review
    const reviewResults: ReviewAuditResult[] = [];
    let totalCustomTables = 0;
    let sampleProblematicContent = null;

    for (const review of reviews) {
      const content = review.content;
      const hasCustomTables = detectCustomTableNodes(content);
      
      let customTableCount = 0;
      if (hasCustomTables) {
        customTableCount = countCustomTablesInContent(content);
        totalCustomTables += customTableCount;
        
        // Capture first problematic content as sample
        if (!sampleProblematicContent) {
          sampleProblematicContent = content;
        }
      }

      reviewResults.push({
        reviewId: review.id,
        title: review.title || 'Untitled Review',
        hasCustomTables,
        customTableCount,
        contentSize: JSON.stringify(content || {}).length,
        migrationRequired: hasCustomTables,
        lastUpdated: review.updated_at,
      });
    }

    const reviewsWithCustomTables = reviewResults.filter(r => r.hasCustomTables).length;
    const affectedReviewIds = reviewResults
      .filter(r => r.hasCustomTables)
      .map(r => r.reviewId);

    // Estimate migration time (roughly 100ms per table + overhead)
    const estimatedMigrationTime = Math.ceil(
      (totalCustomTables * 0.1 + reviewsWithCustomTables * 0.5) / 60
    );

    const audit: AuditSummary = {
      totalReviews: reviews.length,
      reviewsWithCustomTables,
      totalCustomTables,
      estimatedMigrationTime,
      affectedReviewIds,
      sampleProblematicContent,
    };

    const endTime = Date.now();
    console.log(`[TableAudit] ✅ Audit completed in ${endTime - startTime}ms`, {
      totalReviews: audit.totalReviews,
      affectedReviews: audit.reviewsWithCustomTables,
      totalTables: audit.totalCustomTables,
      estimatedTime: `${audit.estimatedMigrationTime}min`,
    });

    return {
      success: true,
      audit,
      reviewResults: reviewResults.filter(r => r.hasCustomTables), // Only return problematic reviews
    };

  } catch (error) {
    console.error('[TableAudit] ❌ Audit failed:', error);
    return {
      success: false,
      audit: {
        totalReviews: 0,
        reviewsWithCustomTables: 0,
        totalCustomTables: 0,
        estimatedMigrationTime: 0,
        affectedReviewIds: [],
      },
      reviewResults: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Creates a backup of review content before migration
 */
async function createContentBackup(reviewId: string, content: any): Promise<boolean> {
  try {
    const backupData = {
      review_id: reviewId,
      backup_content: content,
      backup_type: 'pre_table_migration',
      created_at: new Date().toISOString(),
    };

    // Store in a separate backups table (create if needed)
    const { error } = await supabase
      .from('content_backups')
      .insert(backupData);

    if (error) {
      console.warn(`[TableAudit] ⚠️ Backup creation failed for review ${reviewId}:`, error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`[TableAudit] ⚠️ Backup error for review ${reviewId}:`, error);
    return false;
  }
}

/**
 * Migrates a single review's content from customTable to BasicTable
 */
export async function migrateReviewContent(reviewId: string): Promise<MigrationExecutionResult> {
  const startTime = Date.now();

  try {
    // Fetch current content
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('content')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      throw new Error(`Failed to fetch review ${reviewId}: ${fetchError?.message || 'Not found'}`);
    }

    const originalContent = review.content;
    
    // Check if migration is needed
    if (!detectCustomTableNodes(originalContent)) {
      return {
        reviewId,
        success: true,
        migrationResult: {
          success: true,
          originalNodeCount: 0,
          migratedNodeCount: 0,
          errors: [],
          complexityReduction: 0,
          migratedContent: originalContent,
        },
        backupCreated: false,
        timeElapsed: Date.now() - startTime,
      };
    }

    // Create backup
    const backupCreated = await createContentBackup(reviewId, originalContent);

    // Perform migration
    const migrationResult = migrateCustomTableToBasic(originalContent);

    if (!migrationResult.success) {
      return {
        reviewId,
        success: false,
        migrationResult,
        backupCreated,
        timeElapsed: Date.now() - startTime,
        error: `Migration failed: ${migrationResult.errors.join(', ')}`,
      };
    }

    // Validate migration
    const validation = validateMigration(originalContent, migrationResult.migratedContent);
    if (!validation.isValid) {
      return {
        reviewId,
        success: false,
        migrationResult,
        backupCreated,
        timeElapsed: Date.now() - startTime,
        error: `Validation failed: ${validation.issues.join(', ')}`,
      };
    }

    // Update database with migrated content
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ 
        content: migrationResult.migratedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (updateError) {
      throw new Error(`Failed to update review ${reviewId}: ${updateError.message}`);
    }

    const endTime = Date.now();
    console.log(`[TableAudit] ✅ Migration successful for review ${reviewId}`, {
      tablesConverted: migrationResult.migratedNodeCount,
      complexityReduction: `${migrationResult.complexityReduction}%`,
      timeElapsed: `${endTime - startTime}ms`,
    });

    return {
      reviewId,
      success: true,
      migrationResult,
      backupCreated,
      timeElapsed: endTime - startTime,
    };

  } catch (error) {
    return {
      reviewId,
      success: false,
      migrationResult: {
        success: false,
        originalNodeCount: 0,
        migratedNodeCount: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        complexityReduction: 0,
      },
      backupCreated: false,
      timeElapsed: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Batch migration for multiple reviews with progress monitoring
 */
export async function batchMigrateReviews(
  reviewIds: string[],
  options: {
    maxConcurrent?: number;
    progressCallback?: (completed: number, total: number, current: string) => void;
  } = {}
): Promise<{
  success: boolean;
  results: MigrationExecutionResult[];
  summary: {
    totalProcessed: number;
    successfulMigrations: number;
    failedMigrations: number;
    totalTablesConverted: number;
    totalTimeElapsed: number;
    averageComplexityReduction: number;
  };
}> {
  const { maxConcurrent = 3, progressCallback } = options;
  const startTime = Date.now();
  const results: MigrationExecutionResult[] = [];

  console.log(`[TableAudit] 🚀 Starting batch migration for ${reviewIds.length} reviews...`);

  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < reviewIds.length; i += maxConcurrent) {
    const batch = reviewIds.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (reviewId) => {
      if (progressCallback) {
        progressCallback(results.length, reviewIds.length, reviewId);
      }
      return migrateReviewContent(reviewId);
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to be respectful to the database
    if (i + maxConcurrent < reviewIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Calculate summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalTablesConverted = successful.reduce((acc, r) => acc + r.migrationResult.migratedNodeCount, 0);
  const totalTimeElapsed = Date.now() - startTime;
  const averageComplexityReduction = successful.length > 0
    ? Math.round(successful.reduce((acc, r) => acc + r.migrationResult.complexityReduction, 0) / successful.length)
    : 0;

  const summary = {
    totalProcessed: results.length,
    successfulMigrations: successful.length,
    failedMigrations: failed.length,
    totalTablesConverted,
    totalTimeElapsed,
    averageComplexityReduction,
  };

  console.log(`[TableAudit] ✅ Batch migration completed in ${totalTimeElapsed}ms`, summary);

  return {
    success: failed.length === 0,
    results,
    summary,
  };
}

/**
 * Utility function to count customTable nodes in content
 */
function countCustomTablesInContent(content: any): number {
  if (!content || typeof content !== 'object') {
    return 0;
  }

  let count = 0;

  if (content.type === 'customTable') {
    count++;
  }

  if (content.content && Array.isArray(content.content)) {
    count += content.content.reduce((acc: number, child: any) => 
      acc + countCustomTablesInContent(child), 0);
  }

  return count;
}

/**
 * Rollback migration for a specific review (restore from backup)
 */
export async function rollbackMigration(reviewId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Find the most recent backup
    const { data: backup, error: backupError } = await supabase
      .from('content_backups')
      .select('backup_content')
      .eq('review_id', reviewId)
      .eq('backup_type', 'pre_table_migration')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (backupError || !backup) {
      throw new Error(`No backup found for review ${reviewId}`);
    }

    // Restore original content
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ 
        content: backup.backup_content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (updateError) {
      throw new Error(`Failed to rollback review ${reviewId}: ${updateError.message}`);
    }

    console.log(`[TableAudit] ✅ Rollback successful for review ${reviewId}`);
    return { success: true };

  } catch (error) {
    console.error(`[TableAudit] ❌ Rollback failed for review ${reviewId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}