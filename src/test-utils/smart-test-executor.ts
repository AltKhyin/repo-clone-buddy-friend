// ABOUTME: Smart test execution strategy with categorization and parallel processing

import { vi } from 'vitest';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Test categories based on execution characteristics
 */
export interface TestCategory {
  name: string;
  pattern: string[];
  timeout: number;
  maxConcurrency: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Test execution results
 */
export interface TestExecutionResult {
  category: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  files: string[];
  failures: Array<{ file: string; test: string; error: string }>;
}

/**
 * Smart test categorization system
 */
export class SmartTestExecutor {
  private categories: Map<string, TestCategory> = new Map();
  private testFiles: string[] = [];
  private results: TestExecutionResult[] = [];

  constructor() {
    this.initializeCategories();
  }

  /**
   * Initialize test categories with execution strategies
   */
  private initializeCategories() {
    const categories: TestCategory[] = [
      {
        name: 'ultra-fast',
        pattern: ['**/*.fast.test.{ts,tsx}', '**/components/ui/*.test.{ts,tsx}'],
        timeout: 3000,
        maxConcurrency: 8,
        priority: 'critical',
        description: 'Ultra-fast unit tests for basic functionality',
      },
      {
        name: 'fast-unit',
        pattern: ['**/components/**/*.test.{ts,tsx}', '**/hooks/*.test.{ts,tsx}'],
        timeout: 5000,
        maxConcurrency: 6,
        priority: 'high',
        description: 'Fast unit tests for components and hooks',
      },
      {
        name: 'integration',
        pattern: ['**/*.integration.test.{ts,tsx}', '**/pages/*.test.{ts,tsx}'],
        timeout: 10000,
        maxConcurrency: 4,
        priority: 'medium',
        description: 'Integration tests for features and pages',
      },
      {
        name: 'slow-legacy',
        pattern: ['**/editor/InspectorPanel.test.tsx', '**/admin/*.test.tsx'],
        timeout: 15000,
        maxConcurrency: 2,
        priority: 'low',
        description: 'Legacy slow tests requiring refactoring',
      },
      {
        name: 'e2e',
        pattern: ['**/*.e2e.test.{ts,tsx}', '**/playwright/**/*.test.{ts,tsx}'],
        timeout: 30000,
        maxConcurrency: 1,
        priority: 'low',
        description: 'End-to-end tests for complete workflows',
      },
    ];

    categories.forEach(category => {
      this.categories.set(category.name, category);
    });
  }

  /**
   * Categorize test files based on patterns
   */
  async categorizeTests(rootDir: string): Promise<Map<string, string[]>> {
    const categorizedTests = new Map<string, string[]>();

    // Initialize all categories
    this.categories.forEach((_, name) => {
      categorizedTests.set(name, []);
    });

    // Find all test files
    const testFiles = await this.findTestFiles(rootDir);

    // Categorize each test file
    for (const testFile of testFiles) {
      const category = this.categorizeTestFile(testFile);
      const files = categorizedTests.get(category) || [];
      files.push(testFile);
      categorizedTests.set(category, files);
    }

    return categorizedTests;
  }

  /**
   * Find all test files in the project
   */
  private async findTestFiles(rootDir: string): Promise<string[]> {
    const testFiles: string[] = [];

    const findFiles = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await findFiles(fullPath);
          } else if (entry.isFile() && this.isTestFile(entry.name)) {
            testFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    await findFiles(rootDir);
    return testFiles;
  }

  /**
   * Check if a file is a test file
   */
  private isTestFile(filename: string): boolean {
    const testPatterns = [
      /\.test\.(ts|tsx|js|jsx)$/,
      /\.spec\.(ts|tsx|js|jsx)$/,
      /\.e2e\.(ts|tsx|js|jsx)$/,
    ];

    return testPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Categorize a single test file
   */
  private categorizeTestFile(filePath: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check against each category pattern
    for (const [categoryName, category] of this.categories) {
      for (const pattern of category.pattern) {
        const regexPattern = this.globToRegex(pattern);
        if (regexPattern.test(normalizedPath)) {
          return categoryName;
        }
      }
    }

    // Default to fast-unit for unmatched files
    return 'fast-unit';
  }

  /**
   * Convert glob pattern to regex
   */
  private globToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/\*\*/g, '___DOUBLESTAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___DOUBLESTAR___/g, '.*')
      .replace(/\?/g, '[^/]');

    return new RegExp(escaped);
  }

  /**
   * Execute tests for a specific category
   */
  async executeCategory(categoryName: string, files: string[]): Promise<TestExecutionResult> {
    const category = this.categories.get(categoryName);
    if (!category) {
      throw new Error(`Unknown category: ${categoryName}`);
    }

    console.log(`\n🏃 Running ${categoryName} tests (${files.length} files)`);
    console.log(`⚙️  Timeout: ${category.timeout}ms, Concurrency: ${category.maxConcurrency}`);

    const startTime = Date.now();

    try {
      const result = await this.runVitestCommand(files, category);
      const duration = Date.now() - startTime;

      const executionResult: TestExecutionResult = {
        category: categoryName,
        passed: result.passed || 0,
        failed: result.failed || 0,
        skipped: result.skipped || 0,
        duration,
        files,
        failures: result.failures || [],
      };

      this.results.push(executionResult);

      console.log(`✅ ${categoryName} completed in ${duration}ms`);
      console.log(
        `   Passed: ${result.passed}, Failed: ${result.failed}, Skipped: ${result.skipped}`
      );

      return executionResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const executionResult: TestExecutionResult = {
        category: categoryName,
        passed: 0,
        failed: files.length,
        skipped: 0,
        duration,
        files,
        failures: [{ file: 'unknown', test: 'unknown', error: String(error) }],
      };

      this.results.push(executionResult);
      console.log(`❌ ${categoryName} failed after ${duration}ms: ${error}`);

      return executionResult;
    }
  }

  /**
   * Run vitest command for specific files
   */
  private async runVitestCommand(files: string[], category: TestCategory): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = [
        'run',
        '--reporter=json',
        `--testTimeout=${category.timeout}`,
        `--poolOptions.threads.maxThreads=${category.maxConcurrency}`,
        ...files,
      ];

      const child = spawn('npx', ['vitest', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });

      child.on('close', code => {
        try {
          // Parse vitest JSON output
          const lines = stdout.split('\n').filter(line => line.trim());
          const jsonLine = lines.find(line => line.startsWith('{'));

          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            resolve(result);
          } else {
            // Fallback parsing from stderr/stdout
            resolve({
              passed: code === 0 ? files.length : 0,
              failed: code === 0 ? 0 : files.length,
              skipped: 0,
              failures: code === 0 ? [] : [{ file: 'parse-error', test: 'unknown', error: stderr }],
            });
          }
        } catch (error) {
          reject(new Error(`Failed to parse test results: ${error}`));
        }
      });

      child.on('error', error => {
        reject(error);
      });

      // Kill if it takes too long
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Category ${category.name} timed out`));
      }, category.timeout * 2);
    });
  }

  /**
   * Execute tests in optimal order
   */
  async executeOptimal(
    rootDir: string,
    options: {
      skipSlow?: boolean;
      fastOnly?: boolean;
      category?: string;
    } = {}
  ): Promise<TestExecutionResult[]> {
    console.log('🎯 Smart Test Executor - Analyzing test files...');

    const categorizedTests = await this.categorizeTests(rootDir);

    console.log('\n📊 Test Distribution:');
    categorizedTests.forEach((files, category) => {
      console.log(`   ${category}: ${files.length} files`);
    });

    // Determine execution order based on priority
    const executionOrder = Array.from(this.categories.entries())
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
      })
      .map(([name]) => name);

    // Apply filters
    let categoriesToRun = executionOrder;

    if (options.category) {
      categoriesToRun = [options.category];
    } else if (options.fastOnly) {
      categoriesToRun = ['ultra-fast', 'fast-unit'];
    } else if (options.skipSlow) {
      categoriesToRun = categoriesToRun.filter(name => !['slow-legacy', 'e2e'].includes(name));
    }

    console.log(`\n🚀 Executing categories: ${categoriesToRun.join(', ')}`);

    // Execute each category
    const results: TestExecutionResult[] = [];

    for (const categoryName of categoriesToRun) {
      const files = categorizedTests.get(categoryName) || [];

      if (files.length === 0) {
        console.log(`⏭️  Skipping ${categoryName} (no files)`);
        continue;
      }

      try {
        const result = await this.executeCategory(categoryName, files);
        results.push(result);

        // Stop on critical failures
        if (result.failed > 0 && this.categories.get(categoryName)?.priority === 'critical') {
          console.log(`🛑 Stopping execution due to critical failures in ${categoryName}`);
          break;
        }
      } catch (error) {
        console.error(`💥 Failed to execute category ${categoryName}:`, error);
      }
    }

    // Print summary
    this.printExecutionSummary(results);

    return results;
  }

  /**
   * Print execution summary
   */
  private printExecutionSummary(results: TestExecutionResult[]) {
    console.log('\n📋 EXECUTION SUMMARY');
    console.log('====================');

    const totals = results.reduce(
      (acc, result) => ({
        passed: acc.passed + result.passed,
        failed: acc.failed + result.failed,
        skipped: acc.skipped + result.skipped,
        duration: acc.duration + result.duration,
        files: acc.files + result.files.length,
      }),
      { passed: 0, failed: 0, skipped: 0, duration: 0, files: 0 }
    );

    console.log(`Total Files: ${totals.files}`);
    console.log(`Total Duration: ${totals.duration}ms (${(totals.duration / 1000).toFixed(1)}s)`);
    console.log(`Passed: ${totals.passed}`);
    console.log(`Failed: ${totals.failed}`);
    console.log(`Skipped: ${totals.skipped}`);

    if (totals.failed > 0) {
      console.log('\n❌ FAILURES:');
      results.forEach(result => {
        if (result.failed > 0) {
          console.log(`   ${result.category}: ${result.failed} failures`);
          result.failures.forEach(failure => {
            console.log(`     - ${failure.file}: ${failure.test}`);
          });
        }
      });
    }

    const avgDuration = totals.duration / totals.files;
    const performance =
      avgDuration < 100
        ? 'excellent'
        : avgDuration < 500
          ? 'good'
          : avgDuration < 1000
            ? 'fair'
            : 'poor';

    console.log(`\n⚡ Performance: ${performance} (${avgDuration.toFixed(0)}ms average)`);
  }

  /**
   * Get execution results
   */
  getResults(): TestExecutionResult[] {
    return [...this.results];
  }

  /**
   * Clear results
   */
  clearResults() {
    this.results = [];
  }
}

/**
 * CLI interface for smart test execution
 */
export const runSmartTests = async (
  options: {
    rootDir?: string;
    fastOnly?: boolean;
    skipSlow?: boolean;
    category?: string;
  } = {}
) => {
  const executor = new SmartTestExecutor();
  const rootDir = options.rootDir || process.cwd();

  try {
    const results = await executor.executeOptimal(rootDir, options);

    // Exit with appropriate code
    const hasFailures = results.some(result => result.failed > 0);
    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error('💥 Smart test execution failed:', error);
    process.exit(1);
  }
};

// Export for CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: any = {};

  if (args.includes('--fast-only')) options.fastOnly = true;
  if (args.includes('--skip-slow')) options.skipSlow = true;

  const categoryIndex = args.indexOf('--category');
  if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    options.category = args[categoryIndex + 1];
  }

  runSmartTests(options);
}
