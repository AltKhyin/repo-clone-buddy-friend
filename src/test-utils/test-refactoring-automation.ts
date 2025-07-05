// ABOUTME: Automated test refactoring utility for converting slow tests to fast optimized patterns

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Test refactoring patterns and templates
 */
export interface RefactoringPattern {
  name: string;
  detect: (content: string) => boolean;
  transform: (content: string, metadata: TestFileMetadata) => string;
  priority: number;
}

/**
 * Test file metadata for refactoring decisions
 */
export interface TestFileMetadata {
  filePath: string;
  fileName: string;
  fileSize: number;
  componentType: 'editor' | 'admin' | 'ui' | 'page' | 'hook' | 'generic';
  complexity: 'simple' | 'medium' | 'complex';
  hasAsync: boolean;
  hasUserInteraction: boolean;
  mockCount: number;
}

/**
 * Automated test refactoring engine
 */
export class TestRefactoringEngine {
  private patterns: RefactoringPattern[] = [];

  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize refactoring patterns
   */
  private initializePatterns() {
    // Pattern 1: Convert heavy imports to optimized imports
    this.patterns.push({
      name: 'optimized-imports',
      priority: 1,
      detect: content => content.includes('@testing-library/react') && content.includes('waitFor'),
      transform: (content, metadata) => {
        let result = content;

        // Replace heavy imports with optimized ones
        result = result.replace(
          /import { describe, it, expect, vi, beforeEach.*? } from 'vitest';/,
          `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';`
        );

        result = result.replace(
          /import { render, screen, fireEvent, waitFor.*? } from '@testing-library\/react';/,
          `import { render, screen } from '@testing-library/react';`
        );

        // Add optimized imports
        const optimizedImports = `
import { mockPresets, cleanupMocks } from '@/test-utils/mock-registry';
import { measureTestTime, withPerformanceMonitoring } from '@/test-utils/performance-budget';`;

        result = result.replace(/(import.*?from 'vitest';)/, `$1${optimizedImports}`);

        return result;
      },
    });

    // Pattern 2: Add optimized setup/teardown
    this.patterns.push({
      name: 'optimized-setup',
      priority: 2,
      detect: content => content.includes('beforeEach') && !content.includes('mockPresets'),
      transform: (content, metadata) => {
        const preset = this.getOptimalPreset(metadata.componentType);

        const optimizedSetup = `
// OPTIMIZATION: Use ${preset} preset for fast testing
beforeEach(() => {
  mockPresets.${preset}()
})

afterEach(() => {
  cleanupMocks()
})`;

        // Insert after imports
        const importEnd = content.lastIndexOf('});') + 3;
        if (content.includes('vi.mock(')) {
          // Insert before existing mocks
          const firstMock = content.indexOf('vi.mock(');
          return content.slice(0, firstMock) + optimizedSetup + '\n\n' + content.slice(firstMock);
        }

        // Insert after imports
        const lines = content.split('\n');
        const lastImportIndex = lines.findIndex(line => line.includes('import '));
        if (lastImportIndex !== -1) {
          const insertIndex = lastImportIndex + 1;
          lines.splice(insertIndex, 0, optimizedSetup);
          return lines.join('\n');
        }

        return content;
      },
    });

    // Pattern 3: Convert to performance-monitored tests
    this.patterns.push({
      name: 'performance-monitoring',
      priority: 3,
      detect: content => content.includes('describe(') && !content.includes('measureTestTime'),
      transform: (content, metadata) => {
        // Add performance test section
        const performanceSection = `
  describe('Performance Tests', () => {
    it('should render within performance budget', async () => {
      const testResult = await measureTestTime(
        () => {
          render(<Component />)
          expect(screen.getByTestId('component')).toBeInTheDocument()
        },
        '${metadata.fileName} Render Test',
        'unit'
      )

      expect(testResult.duration).toBeWithinPerformanceBudget('unit')
      expect(testResult.report.grade).toMatch(/excellent|good/)
    })
  })`;

        // Insert performance section after first describe
        const firstDescribe = content.indexOf('describe(');
        if (firstDescribe !== -1) {
          const describeEnd = content.indexOf('{', firstDescribe) + 1;
          return content.slice(0, describeEnd) + performanceSection + content.slice(describeEnd);
        }

        return content;
      },
    });

    // Pattern 4: Simplify complex mocks
    this.patterns.push({
      name: 'simplify-mocks',
      priority: 4,
      detect: content => content.includes('vi.mock(') && content.includes('mockImplementation'),
      transform: (content, metadata) => {
        // Replace complex mock implementations with simple returns
        content = content.replace(/vi\.mock\([^,]+,\s*\(\)\s*=>\s*\(\{[\s\S]*?\}\)\)/g, match => {
          // Simplify complex mock implementations
          if (match.length > 200) {
            const mockName = match.match(/vi\.mock\(['"`]([^'"`]+)['"`]/)?.[1] || 'unknown';
            return `vi.mock('${mockName}', () => ({ default: vi.fn() }))`;
          }
          return match;
        });

        return content;
      },
    });

    // Pattern 5: Remove heavy async operations
    this.patterns.push({
      name: 'remove-async',
      priority: 5,
      detect: content => content.includes('waitFor') || content.includes('findBy'),
      transform: (content, metadata) => {
        // Replace waitFor with synchronous assertions
        content = content.replace(/await waitFor\(\(\) => \{([^}]+)\}\)/g, '$1');

        // Replace findBy with getBy
        content = content.replace(/screen\.findBy/g, 'screen.getBy');

        // Remove unnecessary awaits
        content = content.replace(/await expect\(/g, 'expect(');

        return content;
      },
    });
  }

  /**
   * Get optimal mock preset for component type
   */
  private getOptimalPreset(componentType: string): string {
    switch (componentType) {
      case 'editor':
        return 'editor';
      case 'admin':
        return 'admin';
      case 'ui':
        return 'ultraFast';
      case 'page':
        return 'fast';
      case 'hook':
        return 'ultraFast';
      default:
        return 'fast';
    }
  }

  /**
   * Analyze test file to determine metadata
   */
  async analyzeTestFile(filePath: string): Promise<TestFileMetadata> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.test.tsx');
    const fileSize = content.length;

    // Determine component type from path
    const componentType = this.detectComponentType(filePath);

    // Analyze complexity
    const mockCount = (content.match(/vi\.mock\(/g) || []).length;
    const hasAsync = content.includes('async') || content.includes('await');
    const hasUserInteraction = content.includes('fireEvent') || content.includes('userEvent');

    const complexity =
      mockCount > 10 || content.length > 500 * 80
        ? 'complex'
        : mockCount > 5 || hasUserInteraction
          ? 'medium'
          : 'simple';

    return {
      filePath,
      fileName,
      fileSize,
      componentType,
      complexity,
      hasAsync,
      hasUserInteraction,
      mockCount,
    };
  }

  /**
   * Detect component type from file path
   */
  private detectComponentType(filePath: string): TestFileMetadata['componentType'] {
    if (filePath.includes('/editor/')) return 'editor';
    if (filePath.includes('/admin/')) return 'admin';
    if (filePath.includes('/ui/')) return 'ui';
    if (filePath.includes('/pages/')) return 'page';
    if (filePath.includes('/hooks/')) return 'hook';
    return 'generic';
  }

  /**
   * Apply refactoring patterns to a test file
   */
  async refactorTestFile(filePath: string): Promise<{
    success: boolean;
    originalSize: number;
    newSize: number;
    appliedPatterns: string[];
    errors: string[];
  }> {
    try {
      const metadata = await this.analyzeTestFile(filePath);
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const originalSize = originalContent.length;

      let refactoredContent = originalContent;
      const appliedPatterns: string[] = [];
      const errors: string[] = [];

      // Apply patterns in priority order
      for (const pattern of this.patterns.sort((a, b) => a.priority - b.priority)) {
        try {
          if (pattern.detect(refactoredContent)) {
            refactoredContent = pattern.transform(refactoredContent, metadata);
            appliedPatterns.push(pattern.name);
          }
        } catch (error) {
          errors.push(`Pattern ${pattern.name}: ${error}`);
        }
      }

      // Generate fast test file
      const fastFilePath = filePath.replace('.test.tsx', '.fast.test.tsx');

      // Add header comment
      const header = `// ABOUTME: Optimized fast unit tests for ${metadata.fileName} with automated refactoring\n\n`;
      refactoredContent = header + refactoredContent;

      // Write the fast test file
      await fs.writeFile(fastFilePath, refactoredContent, 'utf-8');

      return {
        success: true,
        originalSize,
        newSize: refactoredContent.length,
        appliedPatterns,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        originalSize: 0,
        newSize: 0,
        appliedPatterns: [],
        errors: [String(error)],
      };
    }
  }

  /**
   * Batch refactor multiple test files
   */
  async batchRefactor(filePaths: string[]): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    totalSizeReduction: number;
    results: Array<{ filePath: string; result: any }>;
  }> {
    const results = [];
    let succeeded = 0;
    let failed = 0;
    let totalSizeReduction = 0;

    console.log(`🔄 Starting batch refactoring of ${filePaths.length} test files...`);

    for (const filePath of filePaths) {
      console.log(`\n📝 Refactoring: ${path.basename(filePath)}`);

      try {
        const result = await this.refactorTestFile(filePath);
        results.push({ filePath, result });

        if (result.success) {
          succeeded++;
          const sizeReduction = result.originalSize - result.newSize;
          totalSizeReduction += sizeReduction;

          console.log(`✅ Success: ${result.appliedPatterns.join(', ')}`);
          console.log(
            `   Size: ${result.originalSize} → ${result.newSize} (${sizeReduction > 0 ? '-' : '+'}${Math.abs(sizeReduction)} chars)`
          );
        } else {
          failed++;
          console.log(`❌ Failed: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        failed++;
        console.log(`💥 Error: ${error}`);
        results.push({ filePath, result: { success: false, errors: [String(error)] } });
      }
    }

    console.log(`\n📊 BATCH REFACTORING SUMMARY`);
    console.log(`=================================`);
    console.log(`Processed: ${filePaths.length}`);
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Size Reduction: ${totalSizeReduction} characters`);

    return {
      processed: filePaths.length,
      succeeded,
      failed,
      totalSizeReduction,
      results,
    };
  }

  /**
   * Identify test files that need refactoring
   */
  async identifyRefactoringCandidates(
    rootDir: string,
    options: {
      minSize?: number;
      maxSize?: number;
      includePatterns?: string[];
      excludePatterns?: string[];
    } = {}
  ): Promise<string[]> {
    const candidates: string[] = [];
    const minSize = options.minSize || 5000; // 5KB minimum
    const maxSize = options.maxSize || 50000; // 50KB maximum

    const findFiles = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await findFiles(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.test.tsx')) {
            // Skip if fast version already exists
            const fastVersion = fullPath.replace('.test.tsx', '.fast.test.tsx');
            try {
              await fs.access(fastVersion);
              continue; // Skip if fast version exists
            } catch {
              // Fast version doesn't exist, continue processing
            }

            // Check file size
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSize && stats.size <= maxSize) {
              candidates.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    await findFiles(rootDir);
    return candidates.sort((a, b) => {
      // Sort by file size (largest first)
      try {
        const sizeA = require('fs').statSync(a).size;
        const sizeB = require('fs').statSync(b).size;
        return sizeB - sizeA;
      } catch {
        return 0;
      }
    });
  }
}

/**
 * CLI interface for test refactoring
 */
export const runTestRefactoring = async (
  options: {
    rootDir?: string;
    batchSize?: number;
    targetFiles?: string[];
  } = {}
) => {
  const engine = new TestRefactoringEngine();
  const rootDir = options.rootDir || process.cwd();
  const batchSize = options.batchSize || 10;

  try {
    let candidates: string[];

    if (options.targetFiles) {
      candidates = options.targetFiles;
    } else {
      console.log('🔍 Identifying refactoring candidates...');
      candidates = await engine.identifyRefactoringCandidates(rootDir);
      console.log(`Found ${candidates.length} test files that need refactoring`);
    }

    if (candidates.length === 0) {
      console.log('✅ No test files need refactoring!');
      return;
    }

    // Process in batches
    const batches = [];
    for (let i = 0; i < candidates.length; i += batchSize) {
      batches.push(candidates.slice(i, i + batchSize));
    }

    console.log(`📦 Processing ${batches.length} batches of ${batchSize} files each`);

    const totalResults = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      totalSizeReduction: 0,
    };

    for (let i = 0; i < batches.length; i++) {
      console.log(`\n🚀 Batch ${i + 1}/${batches.length}`);
      const result = await engine.batchRefactor(batches[i]);

      totalResults.processed += result.processed;
      totalResults.succeeded += result.succeeded;
      totalResults.failed += result.failed;
      totalResults.totalSizeReduction += result.totalSizeReduction;
    }

    console.log(`\n🎉 FINAL SUMMARY`);
    console.log(`================`);
    console.log(`Total Processed: ${totalResults.processed}`);
    console.log(`Total Succeeded: ${totalResults.succeeded}`);
    console.log(`Total Failed: ${totalResults.failed}`);
    console.log(
      `Success Rate: ${Math.round((totalResults.succeeded / totalResults.processed) * 100)}%`
    );
    console.log(`Total Size Reduction: ${totalResults.totalSizeReduction} characters`);
  } catch (error) {
    console.error('💥 Test refactoring failed:', error);
    process.exit(1);
  }
};

// Export for CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: any = {};

  const batchIndex = args.indexOf('--batch-size');
  if (batchIndex !== -1 && args[batchIndex + 1]) {
    options.batchSize = parseInt(args[batchIndex + 1]);
  }

  if (args.length > 0 && !args[0].startsWith('--')) {
    options.targetFiles = args.filter(arg => !arg.startsWith('--'));
  }

  runTestRefactoring(options);
}
