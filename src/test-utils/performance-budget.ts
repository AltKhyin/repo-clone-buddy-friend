// ABOUTME: Performance budget utilities for monitoring test execution time and detecting bottlenecks

import { vi } from 'vitest';

/**
 * Performance budget thresholds for different test categories
 */
export const PERFORMANCE_BUDGETS = {
  unit: {
    fast: 100, // Unit tests should complete in <100ms
    acceptable: 500, // Acceptable limit for unit tests
    slow: 1000, // Flag as slow if >1s
  },
  integration: {
    fast: 500, // Integration tests <500ms
    acceptable: 2000, // Acceptable limit for integration tests
    slow: 5000, // Flag as slow if >5s
  },
  e2e: {
    fast: 2000, // E2E tests <2s
    acceptable: 10000, // Acceptable limit for E2E tests
    slow: 30000, // Flag as slow if >30s
  },
} as const;

/**
 * Test performance monitoring wrapper
 */
export class TestPerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private testName: string = '';
  private category: keyof typeof PERFORMANCE_BUDGETS = 'unit';

  constructor(testName: string, category: keyof typeof PERFORMANCE_BUDGETS = 'unit') {
    this.testName = testName;
    this.category = category;
  }

  start() {
    this.startTime = performance.now();
  }

  end() {
    this.endTime = performance.now();
    return this.getDuration();
  }

  getDuration() {
    return this.endTime - this.startTime;
  }

  getPerformanceGrade() {
    const duration = this.getDuration();
    const budget = PERFORMANCE_BUDGETS[this.category];

    if (duration <= budget.fast) return 'excellent';
    if (duration <= budget.acceptable) return 'good';
    if (duration <= budget.slow) return 'poor';
    return 'critical';
  }

  isWithinBudget() {
    const duration = this.getDuration();
    return duration <= PERFORMANCE_BUDGETS[this.category].acceptable;
  }

  getReport() {
    const duration = this.getDuration();
    const budget = PERFORMANCE_BUDGETS[this.category];
    const grade = this.getPerformanceGrade();

    return {
      testName: this.testName,
      category: this.category,
      duration: Math.round(duration),
      budget: budget.acceptable,
      grade,
      isWithinBudget: this.isWithinBudget(),
      details: {
        fast: duration <= budget.fast,
        acceptable: duration <= budget.acceptable,
        slow: duration > budget.slow,
      },
    };
  }
}

/**
 * Performance monitoring decorator for test functions
 */
export const withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  testFn: T,
  testName: string,
  category: keyof typeof PERFORMANCE_BUDGETS = 'unit'
): T => {
  return ((...args: any[]) => {
    const monitor = new TestPerformanceMonitor(testName, category);
    monitor.start();

    const result = testFn(...args);

    // Handle both sync and async test functions
    if (result instanceof Promise) {
      return result.finally(() => {
        monitor.end();
        const report = monitor.getReport();
        logPerformanceReport(report);
      });
    } else {
      monitor.end();
      const report = monitor.getReport();
      logPerformanceReport(report);
      return result;
    }
  }) as T;
};

/**
 * Log performance report to console with appropriate severity
 */
const logPerformanceReport = (report: ReturnType<TestPerformanceMonitor['getReport']>) => {
  const { testName, duration, grade, isWithinBudget } = report;

  if (!isWithinBudget) {
    console.warn(`⚠️ SLOW TEST: ${testName} took ${duration}ms (grade: ${grade})`);
  } else if (grade === 'excellent') {
    console.log(`✅ FAST: ${testName} (${duration}ms)`);
  }
};

/**
 * Custom matcher for performance budget validation
 */
export const performanceMatchers = {
  toBeWithinPerformanceBudget: (
    received: number,
    category: keyof typeof PERFORMANCE_BUDGETS = 'unit'
  ) => {
    const budget = PERFORMANCE_BUDGETS[category];
    const pass = received <= budget.acceptable;

    return {
      message: () =>
        pass
          ? `Expected ${received}ms to exceed ${category} performance budget of ${budget.acceptable}ms`
          : `Expected ${received}ms to be within ${category} performance budget of ${budget.acceptable}ms`,
      pass,
    };
  },

  toBeExcellentPerformance: (
    received: number,
    category: keyof typeof PERFORMANCE_BUDGETS = 'unit'
  ) => {
    const budget = PERFORMANCE_BUDGETS[category];
    const pass = received <= budget.fast;

    return {
      message: () =>
        pass
          ? `Expected ${received}ms to exceed excellent performance threshold of ${budget.fast}ms`
          : `Expected ${received}ms to be within excellent performance threshold of ${budget.fast}ms`,
      pass,
    };
  },
};

/**
 * Helper to measure test execution time
 */
export const measureTestTime = async <T>(
  testFn: () => T | Promise<T>,
  testName: string,
  category: keyof typeof PERFORMANCE_BUDGETS = 'unit'
): Promise<{
  result: T;
  duration: number;
  report: ReturnType<TestPerformanceMonitor['getReport']>;
}> => {
  const monitor = new TestPerformanceMonitor(testName, category);
  monitor.start();

  try {
    const result = await testFn();
    monitor.end();
    const report = monitor.getReport();
    logPerformanceReport(report);

    return { result, duration: monitor.getDuration(), report };
  } catch (error) {
    monitor.end();
    const report = monitor.getReport();
    logPerformanceReport(report);
    throw error;
  }
};

/**
 * Timeout wrapper with performance monitoring
 */
export const withTimeout = <T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  testName: string
): Promise<T> => {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Test "${testName}" timed out after ${timeoutMs}ms - possible infinite loop or hanging operation`
          )
        );
      }, timeoutMs);
    }),
  ]);
};

/**
 * Global performance tracking for test suite
 */
export class TestSuitePerformanceTracker {
  private tests: Array<ReturnType<TestPerformanceMonitor['getReport']>> = [];

  addTest(report: ReturnType<TestPerformanceMonitor['getReport']>) {
    this.tests.push(report);
  }

  getSummary() {
    const total = this.tests.length;
    const totalDuration = this.tests.reduce((sum, test) => sum + test.duration, 0);
    const withinBudget = this.tests.filter(test => test.isWithinBudget).length;
    const slowTests = this.tests.filter(test => !test.isWithinBudget);

    const gradeDistribution = this.tests.reduce(
      (acc, test) => {
        acc[test.grade] = (acc[test.grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      totalDuration: Math.round(totalDuration),
      averageDuration: Math.round(totalDuration / total),
      withinBudget,
      budgetCompliance: Math.round((withinBudget / total) * 100),
      slowTests: slowTests.length,
      gradeDistribution,
      slowestTests: slowTests.sort((a, b) => b.duration - a.duration).slice(0, 10), // Top 10 slowest tests
    };
  }

  printSummary() {
    const summary = this.getSummary();

    console.log('\n📊 TEST SUITE PERFORMANCE SUMMARY');
    console.log('=====================================');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Average Duration: ${summary.averageDuration}ms`);
    console.log(`Budget Compliance: ${summary.budgetCompliance}%`);
    console.log(`Slow Tests: ${summary.slowTests}`);

    if (summary.slowestTests.length > 0) {
      console.log('\n🐌 SLOWEST TESTS:');
      summary.slowestTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.testName}: ${test.duration}ms (${test.grade})`);
      });
    }

    console.log('\n📈 GRADE DISTRIBUTION:');
    Object.entries(summary.gradeDistribution).forEach(([grade, count]) => {
      console.log(`${grade}: ${count} tests`);
    });
  }
}

// Global tracker instance
export const globalTestTracker = new TestSuitePerformanceTracker();

// Extend Vitest matchers
declare global {
  interface CustomMatchers<R = unknown> {
    toBeWithinPerformanceBudget(category?: keyof typeof PERFORMANCE_BUDGETS): R;
    toBeExcellentPerformance(category?: keyof typeof PERFORMANCE_BUDGETS): R;
  }
}
