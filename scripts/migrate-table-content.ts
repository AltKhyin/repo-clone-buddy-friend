#!/usr/bin/env tsx
// ABOUTME: CLI script for migrating customTable content to BasicTable format

import { auditDatabaseForCustomTables, batchMigrateReviews } from '../src/utils/tableContentAudit';

/**
 * Command line interface for table content migration
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'audit';

  console.log('🔧 EVIDENS Table Migration Utility');
  console.log('=====================================');

  try {
    switch (command) {
      case 'audit':
        await runAudit();
        break;
      
      case 'migrate':
        const dryRun = args.includes('--dry-run');
        await runMigration(dryRun);
        break;
      
      case 'help':
        showHelp();
        break;
      
      default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Run database audit to identify customTable content
 */
async function runAudit() {
  console.log('🔍 Starting database audit for customTable content...\n');

  const auditResult = await auditDatabaseForCustomTables();

  if (!auditResult.success) {
    console.error('❌ Audit failed:', auditResult.error);
    return;
  }

  const { audit, reviewResults } = auditResult;

  // Display audit summary
  console.log('📊 AUDIT SUMMARY');
  console.log('================');
  console.log(`Total Reviews: ${audit.totalReviews}`);
  console.log(`Reviews with customTable: ${audit.reviewsWithCustomTables}`);
  console.log(`Total customTable nodes: ${audit.totalCustomTables}`);
  console.log(`Estimated migration time: ${audit.estimatedMigrationTime} minutes`);
  
  if (audit.reviewsWithCustomTables === 0) {
    console.log('\n✅ No customTable content found. Database is clean!');
    return;
  }

  // Display affected reviews
  console.log('\n📝 AFFECTED REVIEWS');
  console.log('==================');
  reviewResults.forEach(review => {
    console.log(`• ${review.reviewId} - "${review.title}"`);
    console.log(`  Tables: ${review.customTableCount}, Size: ${(review.contentSize / 1024).toFixed(1)}KB`);
    console.log(`  Last updated: ${new Date(review.lastUpdated).toLocaleString()}`);
  });

  // Show sample content structure
  if (audit.sampleProblematicContent) {
    console.log('\n🔍 SAMPLE PROBLEMATIC CONTENT STRUCTURE');
    console.log('======================================');
    const sample = JSON.stringify(audit.sampleProblematicContent, null, 2);
    console.log(sample.substring(0, 500) + (sample.length > 500 ? '...' : ''));
  }

  console.log('\n💡 NEXT STEPS');
  console.log('=============');
  console.log('1. Review the affected content above');
  console.log('2. Run migration with: npm run migrate-tables migrate --dry-run');
  console.log('3. If dry run looks good: npm run migrate-tables migrate');
  
  console.log('\n⚠️  IMPORTANT: Always backup your database before running migrations!');
}

/**
 * Run the actual migration process
 */
async function runMigration(dryRun: boolean = false) {
  console.log(`🚀 Starting ${dryRun ? 'DRY RUN' : 'LIVE'} migration...\n`);

  if (!dryRun) {
    console.log('⚠️  WARNING: This will modify database content!');
    console.log('⚠️  Ensure you have a database backup before proceeding.');
    console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // First, run audit to get affected reviews
  const auditResult = await auditDatabaseForCustomTables();
  
  if (!auditResult.success) {
    console.error('❌ Pre-migration audit failed:', auditResult.error);
    return;
  }

  const { audit } = auditResult;
  
  if (audit.reviewsWithCustomTables === 0) {
    console.log('✅ No customTable content found. Nothing to migrate!');
    return;
  }

  console.log(`📊 Migration Plan: ${audit.reviewsWithCustomTables} reviews, ${audit.totalCustomTables} tables`);

  if (dryRun) {
    console.log('\n🧪 DRY RUN MODE - No actual changes will be made');
    console.log('This would migrate the following content:');
    audit.affectedReviewIds.forEach((id, index) => {
      console.log(`${index + 1}. Review ${id}`);
    });
    console.log(`\nEstimated completion time: ${audit.estimatedMigrationTime} minutes`);
    console.log('✅ Dry run completed. Run without --dry-run to execute migration.');
    return;
  }

  // Execute real migration
  console.log('\n🔄 Executing migration...');
  
  const migrationResult = await batchMigrateReviews(
    audit.affectedReviewIds,
    {
      maxConcurrent: 2, // Conservative concurrency
      progressCallback: (completed, total, current) => {
        const percentage = Math.round((completed / total) * 100);
        console.log(`[${percentage}%] Processing review ${current} (${completed}/${total})`);
      }
    }
  );

  // Display results
  console.log('\n📈 MIGRATION RESULTS');
  console.log('===================');
  console.log(`Total processed: ${migrationResult.summary.totalProcessed}`);
  console.log(`Successful: ${migrationResult.summary.successfulMigrations}`);
  console.log(`Failed: ${migrationResult.summary.failedMigrations}`);
  console.log(`Tables converted: ${migrationResult.summary.totalTablesConverted}`);
  console.log(`Average complexity reduction: ${migrationResult.summary.averageComplexityReduction}%`);
  console.log(`Total time: ${(migrationResult.summary.totalTimeElapsed / 1000).toFixed(1)}s`);

  // Show any failures
  const failures = migrationResult.results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS');
    console.log('===================');
    failures.forEach(failure => {
      console.log(`• Review ${failure.reviewId}: ${failure.error}`);
    });
  }

  if (migrationResult.success) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('All customTable content has been converted to BasicTable format.');
    console.log('The TipTap schema errors should now be resolved.');
  } else {
    console.log('\n⚠️  Migration completed with some failures.');
    console.log('Check the failed migrations above and resolve manually if needed.');
  }

  console.log('\n💡 Next steps:');
  console.log('1. Test table functionality in the application');
  console.log('2. Monitor for any remaining TipTap errors');
  console.log('3. Run audit again to verify completion: npm run migrate-tables audit');
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
📖 USAGE
========
npm run migrate-tables <command> [options]

🔧 COMMANDS
===========
audit         - Scan database for customTable content that needs migration
migrate       - Execute migration from customTable to BasicTable
migrate --dry-run - Preview migration without making changes
help          - Show this help message

📋 EXAMPLES
===========
npm run migrate-tables audit                 # Check what needs migration
npm run migrate-tables migrate --dry-run     # Preview migration
npm run migrate-tables migrate               # Execute migration

⚠️  SAFETY NOTES
================
• Always backup your database before running migrations
• Use --dry-run first to preview changes
• Monitor application logs after migration
• Failed migrations can be rolled back (backups are created automatically)

🔗 RELATED COMMANDS
==================
npm test        # Run tests to verify BasicTable functionality
npm run build   # Ensure application builds without TipTap errors
npm run dev     # Test application with migrated content
`);
}

// Execute main function
if (require.main === module) {
  main();
}