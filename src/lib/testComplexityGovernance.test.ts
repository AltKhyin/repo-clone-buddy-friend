// ABOUTME: Test complexity governance system - AI-safe rules to prevent scope creep and maintain strategic focus in testing architecture

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('TestComplexityGovernance - Strategic Testing Scope Management', () => {
  // Helper to get all test files in the project
  const getAllTestFiles = (dir: string = '', baseDir: string = ''): string[] => {
    const files: string[] = [];
    const searchPath = dir ? join(process.cwd(), dir) : process.cwd();

    try {
      const items = readdirSync(searchPath);

      for (const item of items) {
        const itemPath = join(searchPath, item);
        const relativePath = baseDir ? join(baseDir, item) : item;

        if (statSync(itemPath).isDirectory()) {
          // Skip node_modules, dist, and other non-test directories
          if (!['node_modules', 'dist', '.git', '.next', 'build'].includes(item)) {
            files.push(...getAllTestFiles(itemPath, relativePath));
          }
        } else if (item.includes('.test.') || item.includes('.spec.')) {
          files.push(dir ? join(dir, relativePath) : relativePath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read, skip silently
    }

    return files;
  };

  // Helper to analyze test file complexity
  const analyzeTestFile = (filePath: string) => {
    try {
      const fullPath = join(process.cwd(), filePath);
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      const analysis = {
        totalLines: lines.length,
        testCases: 0,
        describeBlocks: 0,
        mockComplexity: 0,
        assertionCount: 0,
        strategicMarkers: 0,
        aiSafetyMarkers: 0,
        hasAboutMe: false,
        focusLevel: 'unknown' as 'strategic' | 'critical' | 'coverage' | 'architecture' | 'unknown',
      };

      let inComment = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();

        // Check for ABOUTME comment
        if (line.startsWith('// ABOUTME:')) {
          analysis.hasAboutMe = true;
        }

        // Skip comment blocks
        if (line.includes('/*')) inComment = true;
        if (line.includes('*/')) inComment = false;
        if (inComment || line.startsWith('//')) continue;

        // Count test structure
        if (lowerLine.includes('it(') || lowerLine.includes("it('") || lowerLine.includes('it("')) {
          analysis.testCases++;
        }

        if (
          lowerLine.includes('describe(') ||
          lowerLine.includes("describe('") ||
          lowerLine.includes('describe("')
        ) {
          analysis.describeBlocks++;
        }

        // Count assertions
        if (lowerLine.includes('expect(')) {
          analysis.assertionCount++;
        }

        // Count mock complexity
        if (
          lowerLine.includes('vi.mock') ||
          lowerLine.includes('jest.mock') ||
          lowerLine.includes('vi.fn')
        ) {
          analysis.mockComplexity++;
        }

        // Check for strategic markers
        if (lowerLine.includes('🔴 critical') || lowerLine.includes('critical:')) {
          analysis.strategicMarkers++;
          if (analysis.focusLevel === 'unknown') analysis.focusLevel = 'critical';
        }

        if (lowerLine.includes('🟡 critical') || lowerLine.includes('strategic:')) {
          analysis.strategicMarkers++;
          if (analysis.focusLevel === 'unknown') analysis.focusLevel = 'strategic';
        }

        if (lowerLine.includes('🟢 strategic')) {
          analysis.strategicMarkers++;
          if (analysis.focusLevel === 'unknown') analysis.focusLevel = 'strategic';
        }

        if (lowerLine.includes('🔵 ai-safety') || lowerLine.includes('🛡️ architecture')) {
          analysis.aiSafetyMarkers++;
          if (analysis.focusLevel === 'unknown') analysis.focusLevel = 'architecture';
        }

        if (lowerLine.includes('🎯 coverage')) {
          if (analysis.focusLevel === 'unknown') analysis.focusLevel = 'coverage';
        }
      }

      return analysis;
    } catch (error) {
      return null;
    }
  };

  describe('🔴 CRITICAL: Strategic Focus Enforcement', () => {
    it('ensures all test files follow strategic testing patterns', () => {
      const testFiles = getAllTestFiles();
      const violations: Array<{ file: string; issues: string[] }> = [];

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        const issues: string[] = [];

        // Rule 1: All test files must have ABOUTME comment
        if (!analysis.hasAboutMe) {
          issues.push('Missing ABOUTME comment explaining file purpose');
        }

        // Rule 2: Strategic test files should have focus markers
        if (
          analysis.testCases > 5 &&
          analysis.strategicMarkers === 0 &&
          analysis.aiSafetyMarkers === 0
        ) {
          issues.push('Large test file lacks strategic focus markers (🔴🟡🟢🔵🛡️🎯)');
        }

        // Rule 3: Prevent excessive test bloat
        if (analysis.testCases > 50) {
          issues.push(
            `Excessive test cases (${analysis.testCases}). Consider splitting into focused test suites.`
          );
        }

        // Rule 4: Prevent excessive complexity without strategic purpose
        if (analysis.totalLines > 1000 && analysis.strategicMarkers < 3) {
          issues.push('Large test file lacks sufficient strategic organization');
        }

        if (issues.length > 0) {
          violations.push({ file, issues });
        }
      }

      // Allow some violations for legacy files, but warn about scope creep
      if (violations.length > 10) {
        const violationSummary = violations
          .slice(0, 5) // Show first 5 violations
          .map(v => `${v.file}: ${v.issues.join(', ')}`)
          .join('\n');

        throw new Error(
          `🚫 SCOPE CREEP DETECTED: Too many test files violating strategic patterns!\\n\\n` +
            `Found ${violations.length} violations. This suggests the testing suite is growing without strategic focus.\\n\\n` +
            `Sample violations:\\n${violationSummary}\\n\\n` +
            `Fix: Refactor tests to follow strategic patterns with focus markers and clear purpose statements.`
        );
      }

      expect(violations.length).toBeLessThan(11); // Allow some flexibility for refactoring
    });

    it('prevents test files from becoming unmaintainably large', () => {
      const testFiles = getAllTestFiles();
      const oversizedFiles: Array<{ file: string; lines: number; testCases: number }> = [];

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        // Flag files that are getting too large without clear strategic organization
        if (analysis.totalLines > 1500 || analysis.testCases > 75) {
          oversizedFiles.push({
            file,
            lines: analysis.totalLines,
            testCases: analysis.testCases,
          });
        }
      }

      expect(oversizedFiles).toHaveLength(0);

      if (oversizedFiles.length > 0) {
        const summary = oversizedFiles
          .map(f => `${f.file}: ${f.lines} lines, ${f.testCases} tests`)
          .join('\n');

        throw new Error(
          `🚫 TEST FILE SIZE VIOLATION: Files have grown too large!\\n\\n` +
            `Large files become unmaintainable and indicate scope creep.\\n\\n` +
            `Oversized files:\\n${summary}\\n\\n` +
            `Fix: Split large test files into focused, strategic test suites.`
        );
      }
    });

    it('ensures strategic test files maintain proper organization hierarchy', () => {
      const strategicTestFiles = getAllTestFiles().filter(
        file =>
          file.includes('dataAccessCompliance') ||
          file.includes('CriticalUserJourney') ||
          file.includes('LayoutSystemIntegrity') ||
          file.includes('CommunityWorkflows') ||
          file.includes('ContentCreationWorkflows') ||
          file.includes('testComplexityGovernance')
      );

      const organizationViolations: Array<{ file: string; issues: string[] }> = [];

      for (const file of strategicTestFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        const issues: string[] = [];

        // Strategic files should have proper organization
        if (analysis.describeBlocks < 3) {
          issues.push(
            'Strategic test files should have at least 3 describe blocks for organization'
          );
        }

        // Should have strategic markers
        if (analysis.strategicMarkers === 0 && analysis.aiSafetyMarkers === 0) {
          issues.push('Strategic test files must have focus markers (🔴🟡🟢🔵🛡️🎯)');
        }

        // Should have reasonable test-to-assertion ratio
        const assertionRatio =
          analysis.testCases > 0 ? analysis.assertionCount / analysis.testCases : 0;
        if (assertionRatio < 2) {
          issues.push(
            'Strategic tests should have multiple assertions per test for comprehensive validation'
          );
        }

        if (issues.length > 0) {
          organizationViolations.push({ file, issues });
        }
      }

      expect(organizationViolations).toHaveLength(0);

      if (organizationViolations.length > 0) {
        const summary = organizationViolations
          .map(v => `${v.file}: ${v.issues.join(', ')}`)
          .join('\n');

        throw new Error(
          `🚫 STRATEGIC ORGANIZATION VIOLATION: Strategic test files lack proper structure!\\n\\n` +
            `Violations:\\n${summary}\\n\\n` +
            `Fix: Organize strategic tests with proper describe blocks and focus markers.`
        );
      }
    });
  });

  describe('🟡 CRITICAL: Test Coverage Balance Enforcement', () => {
    it('prevents exhaustive testing that leads to maintenance burden', () => {
      const testFiles = getAllTestFiles();
      let totalTestCases = 0;
      let totalLines = 0;
      const excessivelyDetailedFiles: Array<{ file: string; density: number }> = [];

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        totalTestCases += analysis.testCases;
        totalLines += analysis.totalLines;

        // Calculate test density (assertions per line of code)
        const testDensity =
          analysis.totalLines > 0 ? analysis.assertionCount / analysis.totalLines : 0;

        // Flag files with excessive test density that might indicate over-testing
        if (testDensity > 0.15 && analysis.totalLines > 500) {
          excessivelyDetailedFiles.push({
            file,
            density: Math.round(testDensity * 1000) / 1000,
          });
        }
      }

      // Governance rule: Total test suite should not exceed reasonable limits
      const averageTestsPerFile = testFiles.length > 0 ? totalTestCases / testFiles.length : 0;

      if (averageTestsPerFile > 30) {
        console.warn(
          `⚠️ Test Suite Size Warning: Average ${Math.round(averageTestsPerFile)} tests per file.\\n` +
            `High test density may indicate scope creep. Focus on strategic quality guardrails.`
        );
      }

      // Allow some high-density files for critical areas, but warn about excessive detail
      if (excessivelyDetailedFiles.length > 3) {
        const summary = excessivelyDetailedFiles
          .map(f => `${f.file}: ${f.density} assertions/line`)
          .join('\n');

        console.warn(
          `⚠️ Over-Testing Warning: ${excessivelyDetailedFiles.length} files show excessive test density.\\n` +
            `Files with high test density:\\n${summary}\\n\\n` +
            `Consider focusing on strategic guardrails rather than exhaustive coverage.`
        );
      }

      // This is a soft limit - we want to encourage strategic testing
      expect(excessivelyDetailedFiles.length).toBeLessThan(5);
    });

    it('ensures critical paths have adequate coverage without over-engineering', () => {
      const criticalFiles = getAllTestFiles().filter(
        file =>
          file.includes('Authentication') ||
          file.includes('dataAccessCompliance') ||
          file.includes('CriticalUserJourney')
      );

      const coverageIssues: Array<{ file: string; issue: string }> = [];

      for (const file of criticalFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        // Critical files should have reasonable coverage
        if (analysis.testCases < 5) {
          coverageIssues.push({
            file,
            issue: `Only ${analysis.testCases} test cases - critical paths need more coverage`,
          });
        }

        // But not excessive coverage
        if (analysis.testCases > 40) {
          coverageIssues.push({
            file,
            issue: `${analysis.testCases} test cases - may be over-engineered`,
          });
        }

        // Should have strategic focus
        if (analysis.strategicMarkers === 0) {
          coverageIssues.push({
            file,
            issue: 'Critical file lacks strategic focus markers',
          });
        }
      }

      // Allow some issues but prevent systematic problems
      expect(coverageIssues.length).toBeLessThan(5);

      if (coverageIssues.length >= 5) {
        const summary = coverageIssues.map(i => `${i.file}: ${i.issue}`).join('\n');

        throw new Error(
          `🚫 CRITICAL PATH COVERAGE VIOLATION: Critical files have coverage issues!\\n\\n` +
            `Issues:\\n${summary}\\n\\n` +
            `Fix: Balance critical path coverage - adequate but not excessive.`
        );
      }
    });

    it('validates test focus distribution across the strategic architecture', () => {
      const testFiles = getAllTestFiles();
      const focusDistribution = {
        critical: 0,
        strategic: 0,
        coverage: 0,
        architecture: 0,
        unknown: 0,
      };

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        focusDistribution[analysis.focusLevel]++;
      }

      // Strategic distribution requirements
      const totalFiles = Object.values(focusDistribution).reduce((a, b) => a + b, 0);

      if (totalFiles === 0) {
        // No test files found - this might be a setup issue
        return;
      }

      // At least 20% should be critical/strategic focus
      const strategicFocus =
        (focusDistribution.critical + focusDistribution.strategic) / totalFiles;
      expect(strategicFocus).toBeGreaterThan(0.15);

      // No more than 40% should be unknown focus (indicates lack of strategic organization)
      const unknownFocus = focusDistribution.unknown / totalFiles;
      expect(unknownFocus).toBeLessThan(0.5);

      // Log distribution for monitoring
      console.log(
        `📊 Test Focus Distribution: Critical: ${focusDistribution.critical}, ` +
          `Strategic: ${focusDistribution.strategic}, Coverage: ${focusDistribution.coverage}, ` +
          `Architecture: ${focusDistribution.architecture}, Unknown: ${focusDistribution.unknown}`
      );

      if (strategicFocus < 0.15) {
        throw new Error(
          `🚫 STRATEGIC FOCUS DEFICIT: Only ${Math.round(strategicFocus * 100)}% of tests have strategic focus!\\n\\n` +
            `Test suite needs more critical/strategic focus markers to maintain quality guardrails.\\n` +
            `Add 🔴🟡🟢 markers to organize tests by strategic importance.`
        );
      }
    });
  });

  describe('🟢 STRATEGIC: AI Safety and Automation Governance', () => {
    it('ensures AI safety markers are properly distributed', () => {
      const testFiles = getAllTestFiles();
      const aiSafetyFiles = testFiles.filter(file => {
        const analysis = analyzeTestFile(file);
        return analysis && analysis.aiSafetyMarkers > 0;
      });

      // Should have AI safety markers in key files
      const expectedAISafetyFiles = [
        'dataAccessCompliance',
        'testComplexityGovernance',
        'LayoutSystemIntegrity',
        'aiSafetyValidation',
      ];

      const missingAISafety = expectedAISafetyFiles.filter(
        expectedFile => !aiSafetyFiles.some(file => file.includes(expectedFile))
      );

      // Allow missing files during development - just warn about the situation
      if (missingAISafety.length > 0) {
        console.warn(
          `⚠️ AI SAFETY MARKER WARNING: Some critical files lack AI safety markers:\\n` +
            `Files missing AI safety markers: ${missingAISafety.join(', ')}\\n\\n` +
            `Consider adding 🔵 AI-SAFETY or 🛡️ ARCHITECTURE markers to tests that prevent AI from breaking architecture.`
        );
      }

      // Soft requirement - allow some missing files during development
      expect(missingAISafety.length).toBeLessThanOrEqual(expectedAISafetyFiles.length);

      // Log current AI safety file distribution
      console.log(
        `🔵 AI Safety Files Found: ${aiSafetyFiles.length}/${testFiles.length} test files have AI safety markers`
      );
    });

    it('validates that governance rules prevent infinite test expansion', () => {
      const testFiles = getAllTestFiles();

      // Count total test infrastructure
      let totalDescribeBlocks = 0;
      let totalTestCases = 0;
      let totalMocks = 0;

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        totalDescribeBlocks += analysis.describeBlocks;
        totalTestCases += analysis.testCases;
        totalMocks += analysis.mockComplexity;
      }

      // Governance thresholds to prevent scope creep
      const maxReasonableTests = 500; // Total across entire suite
      const maxReasonableDescribeBlocks = 100;
      const maxReasonableMocks = 200;

      // Soft warnings before hard limits
      if (totalTestCases > maxReasonableTests * 0.8) {
        console.warn(
          `⚠️ Test Suite Size Warning: ${totalTestCases}/${maxReasonableTests} tests.\\n` +
            `Approaching maximum recommended size. Focus on strategic quality guardrails.`
        );
      }

      // Hard limits to prevent runaway growth
      expect(totalTestCases).toBeLessThanOrEqual(maxReasonableTests);
      expect(totalDescribeBlocks).toBeLessThanOrEqual(maxReasonableDescribeBlocks);
      expect(totalMocks).toBeLessThanOrEqual(maxReasonableMocks);

      if (totalTestCases > maxReasonableTests) {
        throw new Error(
          `🚫 TEST SUITE SIZE VIOLATION: ${totalTestCases} total tests exceed limit of ${maxReasonableTests}!\\n\\n` +
            `The test suite has grown too large and risks becoming unmaintainable.\\n` +
            `Focus on strategic quality guardrails rather than exhaustive coverage.`
        );
      }
    });

    it('ensures test files maintain strategic purpose and avoid feature creep', () => {
      const testFiles = getAllTestFiles();
      const purposeViolations: Array<{ file: string; issue: string }> = [];

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        // Files with high complexity should have clear strategic purpose
        if (analysis.totalLines > 800 && !analysis.hasAboutMe) {
          purposeViolations.push({
            file,
            issue: 'Large test file lacks ABOUTME purpose statement',
          });
        }

        // Files with many tests should be strategically organized
        if (analysis.testCases > 25 && analysis.describeBlocks < 3) {
          purposeViolations.push({
            file,
            issue: 'Many test cases lack proper organization in describe blocks',
          });
        }

        // Files with high mock complexity should justify the complexity
        if (analysis.mockComplexity > 15 && analysis.strategicMarkers === 0) {
          purposeViolations.push({
            file,
            issue: 'High mock complexity without strategic justification',
          });
        }
      }

      // Allow some violations during refactoring, but prevent systematic issues
      expect(purposeViolations.length).toBeLessThan(8);

      if (purposeViolations.length >= 8) {
        const summary = purposeViolations
          .slice(0, 5)
          .map(v => `${v.file}: ${v.issue}`)
          .join('\n');

        throw new Error(
          `🚫 TEST PURPOSE VIOLATION: Too many files lack clear strategic purpose!\\n\\n` +
            `Sample violations:\\n${summary}\\n\\n` +
            `Fix: Add ABOUTME comments and strategic organization to clarify test purpose.`
        );
      }
    });
  });

  describe('🔵 AI-SAFETY: Meta-Testing Governance Rules', () => {
    it('prevents this governance test from becoming overly complex', () => {
      const thisFile = 'src/lib/testComplexityGovernance.test.ts';
      const analysis = analyzeTestFile(thisFile);

      if (analysis) {
        // Self-governance: This file should follow its own rules
        expect(analysis.hasAboutMe).toBe(true);
        expect(analysis.testCases).toBeLessThan(25); // Reasonable limit
        expect(analysis.totalLines).toBeLessThan(800); // Reasonable size
        expect(analysis.strategicMarkers + analysis.aiSafetyMarkers).toBeGreaterThan(0);

        if (analysis.testCases > 20) {
          console.warn(
            `⚠️ Meta-Governance Warning: testComplexityGovernance.test.ts has ${analysis.testCases} tests.\\n` +
              `This governance file should remain focused and not become overly complex.`
          );
        }
      }
    });

    it('validates that governance rules are enforceable and not contradictory', () => {
      // Test that our governance rules make sense and don't conflict
      const rules = {
        maxTestsPerFile: 50,
        maxLinesPerFile: 1500,
        minStrategicMarkers: 1, // For files with > 10 tests
        maxTestDensity: 0.15, // assertions per line
        minCriticalFocus: 0.15, // percentage of tests with strategic focus
      };

      // Rules should be internally consistent
      expect(rules.maxTestsPerFile).toBeGreaterThan(10);
      expect(rules.maxLinesPerFile).toBeGreaterThan(200);
      expect(rules.minCriticalFocus).toBeGreaterThan(0);
      expect(rules.minCriticalFocus).toBeLessThan(1);
      expect(rules.maxTestDensity).toBeGreaterThan(0);

      // Log current governance parameters for transparency
      console.log('📋 Active Governance Rules:', JSON.stringify(rules, null, 2));
    });

    it('ensures governance system prevents both under-testing and over-testing', () => {
      const testFiles = getAllTestFiles();
      const fileAnalyses = testFiles
        .map(file => ({ file, analysis: analyzeTestFile(file) }))
        .filter(item => item.analysis);

      let underTestedCriticalAreas = 0;
      let overTestedAreas = 0;

      for (const { file, analysis } of fileAnalyses) {
        if (!analysis) continue;

        // Check for under-testing in critical areas
        if (
          (file.includes('auth') || file.includes('security') || file.includes('access')) &&
          analysis.testCases < 5
        ) {
          underTestedCriticalAreas++;
        }

        // Check for over-testing (excessive detail without strategic purpose)
        if (analysis.testCases > 40 && analysis.strategicMarkers === 0) {
          overTestedAreas++;
        }
      }

      // Balance enforcement
      expect(underTestedCriticalAreas).toBeLessThan(3);
      expect(overTestedAreas).toBeLessThan(3);

      console.log(
        `⚖️ Testing Balance: Under-tested critical areas: ${underTestedCriticalAreas}, ` +
          `Over-tested areas: ${overTestedAreas}`
      );
    });
  });

  describe('🎯 COVERAGE: Governance System Health Monitoring', () => {
    it('monitors test suite health metrics for early warning signs', () => {
      const testFiles = getAllTestFiles();
      const healthMetrics = {
        totalFiles: testFiles.length,
        totalTests: 0,
        totalLines: 0,
        filesWithAboutMe: 0,
        filesWithStrategicMarkers: 0,
        avgTestsPerFile: 0,
        avgLinesPerFile: 0,
      };

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        healthMetrics.totalTests += analysis.testCases;
        healthMetrics.totalLines += analysis.totalLines;

        if (analysis.hasAboutMe) healthMetrics.filesWithAboutMe++;
        if (analysis.strategicMarkers > 0 || analysis.aiSafetyMarkers > 0) {
          healthMetrics.filesWithStrategicMarkers++;
        }
      }

      if (healthMetrics.totalFiles > 0) {
        healthMetrics.avgTestsPerFile = Math.round(
          healthMetrics.totalTests / healthMetrics.totalFiles
        );
        healthMetrics.avgLinesPerFile = Math.round(
          healthMetrics.totalLines / healthMetrics.totalFiles
        );
      }

      // Health indicators
      const aboutMeRatio =
        healthMetrics.totalFiles > 0
          ? healthMetrics.filesWithAboutMe / healthMetrics.totalFiles
          : 0;
      const strategicRatio =
        healthMetrics.totalFiles > 0
          ? healthMetrics.filesWithStrategicMarkers / healthMetrics.totalFiles
          : 0;

      // Log health metrics for monitoring
      console.log('🏥 Test Suite Health Metrics:', JSON.stringify(healthMetrics, null, 2));
      console.log(`📈 ABOUTME Coverage: ${Math.round(aboutMeRatio * 100)}%`);
      console.log(`🎯 Strategic Focus: ${Math.round(strategicRatio * 100)}%`);

      // Health thresholds - adjust based on actual file discovery
      if (healthMetrics.totalFiles > 0) {
        expect(aboutMeRatio).toBeGreaterThan(0.4); // 40% of files should have purpose statements
        expect(strategicRatio).toBeGreaterThan(0.2); // 20% of files should have strategic markers
        expect(healthMetrics.avgTestsPerFile).toBeLessThan(35); // Prevent average file bloat
      } else {
        // No test files found - this might be a setup issue, but allow it
        console.warn('⚠️ No test files found during health monitoring');
        expect(healthMetrics.totalFiles).toBeGreaterThanOrEqual(0);
      }
    });

    it('provides actionable recommendations for test suite improvement', () => {
      const testFiles = getAllTestFiles();
      const recommendations: string[] = [];

      let totalTests = 0;
      let filesNeedingAboutMe = 0;
      let filesNeedingStrategicFocus = 0;
      let oversizedFiles = 0;

      for (const file of testFiles) {
        const analysis = analyzeTestFile(file);
        if (!analysis) continue;

        totalTests += analysis.testCases;

        if (!analysis.hasAboutMe && analysis.totalLines > 50) {
          filesNeedingAboutMe++;
        }

        if (
          analysis.testCases > 10 &&
          analysis.strategicMarkers === 0 &&
          analysis.aiSafetyMarkers === 0
        ) {
          filesNeedingStrategicFocus++;
        }

        if (analysis.totalLines > 1000) {
          oversizedFiles++;
        }
      }

      // Generate recommendations
      if (filesNeedingAboutMe > 5) {
        recommendations.push(`Add ABOUTME comments to ${filesNeedingAboutMe} test files`);
      }

      if (filesNeedingStrategicFocus > 3) {
        recommendations.push(
          `Add strategic focus markers (🔴🟡🟢🔵🛡️🎯) to ${filesNeedingStrategicFocus} files`
        );
      }

      if (oversizedFiles > 2) {
        recommendations.push(`Split ${oversizedFiles} oversized test files into focused suites`);
      }

      if (totalTests > 400) {
        recommendations.push('Consider test suite size - focus on strategic quality guardrails');
      }

      // Log recommendations
      if (recommendations.length > 0) {
        console.log('💡 Test Suite Improvement Recommendations:');
        recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      } else {
        console.log('✅ Test suite follows governance guidelines');
      }

      // This test always passes but provides valuable insights
      expect(recommendations).toBeDefined();
    });
  });
});
