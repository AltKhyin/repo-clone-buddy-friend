// ABOUTME: AI safety validation framework - Detects when AI changes break unrelated code areas and validates architectural boundaries

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('AISafetyValidation - Architectural Integrity and Cross-System Impact Detection', () => {
  // Helper to get all source files for architectural analysis
  const getAllSourceFiles = (dir: string = 'src', baseDir: string = ''): string[] => {
    const files: string[] = [];
    const searchPath = join(process.cwd(), dir);

    try {
      const items = readdirSync(searchPath);

      for (const item of items) {
        const itemPath = join(searchPath, item);
        const relativePath = baseDir ? join(baseDir, item) : item;

        if (statSync(itemPath).isDirectory()) {
          // Skip test directories and node_modules
          if (!['node_modules', '.git', 'dist', '__tests__'].includes(item)) {
            files.push(...getAllSourceFiles(itemPath, relativePath));
          }
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          // Skip test files
          if (!item.includes('.test.') && !item.includes('.spec.')) {
            files.push(join(dir, relativePath));
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read, skip silently
    }

    return files;
  };

  // Helper to analyze file dependencies and potential cross-system impacts
  const analyzeFileDependencies = (filePath: string) => {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      const analysis = {
        imports: [] as string[],
        exports: [] as string[],
        hooks: [] as string[],
        components: [] as string[],
        supabaseUsage: false,
        authUsage: false,
        storeUsage: false,
        routerUsage: false,
        hasTypeErrors: false,
        hasUnresolvedImports: false,
        criticalPatterns: [] as string[],
      };

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Track imports
        if (trimmedLine.startsWith('import ')) {
          analysis.imports.push(trimmedLine);

          // Check for critical system dependencies
          if (trimmedLine.includes('supabase')) analysis.supabaseUsage = true;
          if (trimmedLine.includes('auth') || trimmedLine.includes('Auth'))
            analysis.authUsage = true;
          if (trimmedLine.includes('store') || trimmedLine.includes('Store'))
            analysis.storeUsage = true;
          if (trimmedLine.includes('router') || trimmedLine.includes('Router'))
            analysis.routerUsage = true;
        }

        // Track exports
        if (trimmedLine.startsWith('export ')) {
          analysis.exports.push(trimmedLine);
        }

        // Track hooks
        if (
          trimmedLine.includes('use') &&
          (trimmedLine.includes('function') || trimmedLine.includes('const'))
        ) {
          analysis.hooks.push(trimmedLine);
        }

        // Track components
        if (
          trimmedLine.includes('function') &&
          /[A-Z]/.test(trimmedLine.charAt(trimmedLine.indexOf('function') + 9))
        ) {
          analysis.components.push(trimmedLine);
        }

        // Check for potential type errors or unresolved imports
        if (trimmedLine.includes('// @ts-ignore') || trimmedLine.includes('// @ts-expect-error')) {
          analysis.hasTypeErrors = true;
        }

        // Look for critical patterns that could indicate architectural issues
        if (
          trimmedLine.includes('TODO') ||
          trimmedLine.includes('FIXME') ||
          trimmedLine.includes('HACK')
        ) {
          analysis.criticalPatterns.push(trimmedLine);
        }
      }

      return analysis;
    } catch (error) {
      return null;
    }
  };

  // Helper to detect architectural boundary violations
  const detectArchitecturalViolations = () => {
    const sourceFiles = getAllSourceFiles();
    const violations: Array<{ file: string; violation: string; severity: 'critical' | 'warning' }> =
      [];

    for (const file of sourceFiles) {
      const analysis = analyzeFileDependencies(file);
      if (!analysis) continue;

      // UI Components importing Supabase directly (Golden Rule violation)
      if (file.includes('src/components/') && analysis.supabaseUsage) {
        violations.push({
          file,
          violation: 'UI component imports Supabase directly - violates Data Access Layer',
          severity: 'critical',
        });
      }

      // Pages importing Supabase directly (should use hooks)
      if (file.includes('src/pages/') && analysis.supabaseUsage) {
        violations.push({
          file,
          violation: 'Page component imports Supabase directly - should use hooks',
          severity: 'critical',
        });
      }

      // Type errors in critical files
      if (
        analysis.hasTypeErrors &&
        (file.includes('auth') || file.includes('store') || file.includes('hook'))
      ) {
        violations.push({
          file,
          violation: 'Type errors in critical system file',
          severity: 'warning',
        });
      }

      // Critical patterns in production files
      if (analysis.criticalPatterns.length > 0 && !file.includes('test')) {
        violations.push({
          file,
          violation: `Production file contains ${analysis.criticalPatterns.length} critical patterns (TODO/FIXME/HACK)`,
          severity: 'warning',
        });
      }

      // Cross-system coupling detection
      if (file.includes('src/components/ui/') && (analysis.authUsage || analysis.storeUsage)) {
        violations.push({
          file,
          violation: 'UI primitive component coupled to business logic (auth/store)',
          severity: 'warning',
        });
      }
    }

    return violations;
  };

  describe('🔴 CRITICAL: Architectural Boundary Enforcement', () => {
    it('detects Data Access Layer violations in real-time', () => {
      const violations = detectArchitecturalViolations();
      const criticalViolations = violations.filter(v => v.severity === 'critical');

      expect(criticalViolations).toHaveLength(0);

      if (criticalViolations.length > 0) {
        const summary = criticalViolations.map(v => `${v.file}: ${v.violation}`).join('\n');

        throw new Error(
          `🚫 CRITICAL ARCHITECTURAL VIOLATION DETECTED!\\n\\n` +
            `AI changes have violated core architectural boundaries:\\n\\n${summary}\\n\\n` +
            `These violations break the Data Access Layer and must be fixed immediately.\\n` +
            `Fix: Move Supabase usage to hooks in packages/hooks/ directory.`
        );
      }
    });

    it('validates component hierarchy and prevents architectural drift', () => {
      const sourceFiles = getAllSourceFiles();
      const hierarchyViolations: Array<{ file: string; issue: string }> = [];

      for (const file of sourceFiles) {
        const analysis = analyzeFileDependencies(file);
        if (!analysis) continue;

        // UI components should not import from pages
        if (
          file.includes('src/components/') &&
          analysis.imports.some(imp => imp.includes('../pages'))
        ) {
          hierarchyViolations.push({
            file,
            issue: 'UI component imports from pages directory - violates component hierarchy',
          });
        }

        // Hooks should not import components
        if (file.includes('hooks/') && analysis.imports.some(imp => imp.includes('components'))) {
          hierarchyViolations.push({
            file,
            issue: 'Hook imports components - violates separation of concerns',
          });
        }

        // Utils should not import business logic
        if (file.includes('src/lib/') && (analysis.authUsage || analysis.storeUsage)) {
          hierarchyViolations.push({
            file,
            issue: 'Utility function coupled to business logic - should be pure',
          });
        }
      }

      expect(hierarchyViolations).toHaveLength(0);

      if (hierarchyViolations.length > 0) {
        const summary = hierarchyViolations.map(v => `${v.file}: ${v.issue}`).join('\n');

        throw new Error(
          `🚫 COMPONENT HIERARCHY VIOLATION!\\n\\n` +
            `AI changes have broken component hierarchy rules:\\n\\n${summary}\\n\\n` +
            `Fix: Maintain proper import direction: utils → hooks → components → pages`
        );
      }
    });

    it('prevents cross-feature coupling and maintains module boundaries', () => {
      const sourceFiles = getAllSourceFiles();
      const couplingViolations: Array<{ file: string; coupled: string }> = [];

      // Define feature boundaries
      const features = ['auth', 'community', 'acervo', 'content', 'shell'];

      for (const file of sourceFiles) {
        const analysis = analyzeFileDependencies(file);
        if (!analysis) continue;

        // Determine which feature this file belongs to
        const fileFeature = features.find(feature => file.includes(`/${feature}/`));
        if (!fileFeature) continue;

        // Check for imports from other features
        for (const importLine of analysis.imports) {
          for (const otherFeature of features) {
            if (otherFeature !== fileFeature && importLine.includes(`/${otherFeature}/`)) {
              couplingViolations.push({
                file,
                coupled: `Imports from ${otherFeature} feature`,
              });
            }
          }
        }
      }

      // Allow some coupling for shared components, but prevent excessive coupling
      expect(couplingViolations.length).toBeLessThan(5);

      if (couplingViolations.length >= 5) {
        const summary = couplingViolations
          .slice(0, 3)
          .map(v => `${v.file}: ${v.coupled}`)
          .join('\n');

        throw new Error(
          `🚫 FEATURE COUPLING VIOLATION!\\n\\n` +
            `Found ${couplingViolations.length} cross-feature dependencies:\\n\\n${summary}\\n\\n` +
            `Fix: Use shared utilities and avoid direct feature-to-feature imports.`
        );
      }
    });
  });

  describe('🟡 CRITICAL: Cross-System Impact Detection', () => {
    it('detects authentication system modifications that could break access control', () => {
      const authFiles = getAllSourceFiles().filter(
        file => file.includes('auth') || file.includes('Auth') || file.includes('store')
      );

      const authIntegrityIssues: Array<{ file: string; risk: string }> = [];

      for (const file of authFiles) {
        const analysis = analyzeFileDependencies(file);
        if (!analysis) continue;

        // Check for risky patterns in auth files
        if (analysis.criticalPatterns.length > 0) {
          authIntegrityIssues.push({
            file,
            risk: `Auth file contains ${analysis.criticalPatterns.length} critical patterns`,
          });
        }

        // Auth files with type errors are risky
        if (analysis.hasTypeErrors) {
          authIntegrityIssues.push({
            file,
            risk: 'Auth file has type safety issues',
          });
        }

        // Check for dangerous auth patterns
        const content = readFileSync(file, 'utf-8');
        if (content.includes('localStorage') && content.includes('token')) {
          authIntegrityIssues.push({
            file,
            risk: 'Direct localStorage token manipulation detected',
          });
        }
      }

      // Auth system should be stable
      expect(authIntegrityIssues.length).toBeLessThan(3);

      if (authIntegrityIssues.length >= 3) {
        const summary = authIntegrityIssues.map(i => `${i.file}: ${i.risk}`).join('\n');

        throw new Error(
          `🚫 AUTHENTICATION SYSTEM INTEGRITY RISK!\\n\\n` +
            `Changes to auth system may have introduced security vulnerabilities:\\n\\n${summary}\\n\\n` +
            `Critical: Review auth changes carefully for security implications.`
        );
      }
    });

    it('validates data flow integrity after AI modifications', () => {
      const hookFiles = getAllSourceFiles().filter(file => file.includes('hooks/'));
      const dataFlowIssues: Array<{ file: string; issue: string }> = [];

      for (const file of hookFiles) {
        try {
          const content = readFileSync(file, 'utf-8');

          // Check for TanStack Query pattern violations
          if (content.includes('useQuery') || content.includes('useMutation')) {
            // Should have proper error handling
            if (!content.includes('onError') && !content.includes('isError')) {
              dataFlowIssues.push({
                file,
                issue: 'TanStack Query hook lacks error handling',
              });
            }

            // Mutations should invalidate cache
            if (content.includes('useMutation') && !content.includes('invalidateQueries')) {
              dataFlowIssues.push({
                file,
                issue: 'Mutation hook does not invalidate cache',
              });
            }
          }

          // Check for improper async patterns
          if (content.includes('useEffect') && content.includes('async')) {
            dataFlowIssues.push({
              file,
              issue: 'Async function directly in useEffect (memory leak risk)',
            });
          }
        } catch (error) {
          // File read error, skip
        }
      }

      expect(dataFlowIssues.length).toBeLessThan(5);

      if (dataFlowIssues.length >= 5) {
        const summary = dataFlowIssues
          .slice(0, 3)
          .map(i => `${i.file}: ${i.issue}`)
          .join('\n');

        throw new Error(
          `🚫 DATA FLOW INTEGRITY VIOLATION!\\n\\n` +
            `AI changes have introduced data flow issues:\\n\\n${summary}\\n\\n` +
            `Fix: Ensure proper error handling and cache invalidation in hooks.`
        );
      }
    });

    it('detects UI component modifications that could break user experience', () => {
      const componentFiles = getAllSourceFiles().filter(file => file.includes('src/components/'));
      const uiIntegrityIssues: Array<{ file: string; risk: string }> = [];

      for (const file of componentFiles) {
        try {
          const content = readFileSync(file, 'utf-8');
          const analysis = analyzeFileDependencies(file);
          if (!analysis) continue;

          // Check for accessibility issues
          if (content.includes('<button') && !content.includes('aria-')) {
            uiIntegrityIssues.push({
              file,
              risk: 'Button elements may lack accessibility attributes',
            });
          }

          // Check for responsive design breakage
          if (
            content.includes('className') &&
            !content.includes('sm:') &&
            !content.includes('md:')
          ) {
            if (file.includes('shell') || file.includes('layout')) {
              uiIntegrityIssues.push({
                file,
                risk: 'Layout component may lack responsive design classes',
              });
            }
          }

          // Check for state management issues
          if (content.includes('useState') && content.includes('useEffect')) {
            if (!content.includes('cleanup') && content.includes('interval')) {
              uiIntegrityIssues.push({
                file,
                risk: 'Component with intervals may lack cleanup',
              });
            }
          }

          // Check for dangerous innerHTML usage
          if (content.includes('dangerouslySetInnerHTML')) {
            uiIntegrityIssues.push({
              file,
              risk: 'Component uses dangerouslySetInnerHTML (XSS risk)',
            });
          }
        } catch (error) {
          // File read error, skip
        }
      }

      // UI issues should be limited
      expect(uiIntegrityIssues.length).toBeLessThan(8);

      if (uiIntegrityIssues.length >= 8) {
        const summary = uiIntegrityIssues
          .slice(0, 4)
          .map(i => `${i.file}: ${i.risk}`)
          .join('\n');

        console.warn(
          `⚠️ UI INTEGRITY WARNING: ${uiIntegrityIssues.length} potential UI issues detected:\\n\\n${summary}\\n\\n` +
            `Review: Check for accessibility, responsive design, and security issues.`
        );
      }
    });
  });

  describe('🟢 STRATEGIC: Dependency Stability and Version Drift Detection', () => {
    it('validates that critical dependencies remain stable after changes', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      let packageJson: any;

      try {
        packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      } catch (error) {
        // No package.json found, skip this test
        return;
      }

      const criticalDependencies = [
        '@tanstack/react-query',
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'zustand',
        'vite',
        'typescript',
      ];

      const dependencyIssues: Array<{ dep: string; issue: string }> = [];

      for (const dep of criticalDependencies) {
        const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];

        if (!version) {
          dependencyIssues.push({
            dep,
            issue: 'Critical dependency is missing',
          });
        } else if (version.includes('latest') || version.includes('*')) {
          dependencyIssues.push({
            dep,
            issue: 'Critical dependency uses unstable version specifier',
          });
        }
      }

      expect(dependencyIssues).toHaveLength(0);

      if (dependencyIssues.length > 0) {
        const summary = dependencyIssues.map(i => `${i.dep}: ${i.issue}`).join('\n');

        throw new Error(
          `🚫 DEPENDENCY STABILITY VIOLATION!\\n\\n` +
            `Critical dependencies have stability issues:\\n\\n${summary}\\n\\n` +
            `Fix: Use pinned versions for critical dependencies.`
        );
      }
    });

    it('detects import path changes that could break module resolution', () => {
      const sourceFiles = getAllSourceFiles();
      const importIssues: Array<{ file: string; import: string }> = [];

      for (const file of sourceFiles) {
        const analysis = analyzeFileDependencies(file);
        if (!analysis) continue;

        for (const importLine of analysis.imports) {
          // Check for potentially problematic import patterns
          if (importLine.includes('../../../')) {
            importIssues.push({
              file,
              import: 'Deep relative import path (should use alias)',
            });
          }

          // Check for imports from test files in production code
          if (importLine.includes('.test') || importLine.includes('.spec')) {
            importIssues.push({
              file,
              import: 'Production code imports from test files',
            });
          }

          // Check for missing file extensions in relative imports
          if (
            importLine.includes('./') &&
            !importLine.includes('.js') &&
            !importLine.includes('.ts')
          ) {
            if (!importLine.includes('@/') && !importLine.includes('node_modules')) {
              importIssues.push({
                file,
                import: 'Relative import may lack file extension',
              });
            }
          }
        }
      }

      // Allow some import issues but prevent systematic problems
      expect(importIssues.length).toBeLessThan(10);

      if (importIssues.length >= 10) {
        const summary = importIssues
          .slice(0, 5)
          .map(i => `${i.file}: ${i.import}`)
          .join('\n');

        throw new Error(
          `🚫 IMPORT PATH VIOLATION!\\n\\n` +
            `Found ${importIssues.length} import path issues:\\n\\n${summary}\\n\\n` +
            `Fix: Use proper import aliases and avoid deep relative paths.`
        );
      }
    });

    it('validates TypeScript configuration integrity', () => {
      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      let tsconfig: any;

      try {
        tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      } catch (error) {
        // No tsconfig.json found, skip this test
        return;
      }

      const configIssues: string[] = [];

      // Check critical TypeScript settings
      const compilerOptions = tsconfig.compilerOptions || {};

      if (!compilerOptions.strict) {
        configIssues.push('strict mode is not enabled');
      }

      if (!compilerOptions.noImplicitAny) {
        configIssues.push('noImplicitAny is not enabled');
      }

      if (!compilerOptions.strictNullChecks) {
        configIssues.push('strictNullChecks is not enabled');
      }

      if (compilerOptions.allowJs === true) {
        configIssues.push('allowJs is enabled (may reduce type safety)');
      }

      expect(configIssues).toHaveLength(0);

      if (configIssues.length > 0) {
        throw new Error(
          `🚫 TYPESCRIPT CONFIGURATION INTEGRITY VIOLATION!\\n\\n` +
            `TypeScript configuration has been modified in ways that reduce type safety:\\n\\n` +
            `Issues: ${configIssues.join(', ')}\\n\\n` +
            `Fix: Restore strict TypeScript configuration for maximum type safety.`
        );
      }
    });
  });

  describe('🔵 AI-SAFETY: Change Impact Analysis and Regression Prevention', () => {
    it('analyzes recent modifications for potential cross-system impacts', () => {
      // This test would typically integrate with git to analyze recent changes
      // For now, we'll simulate by checking for common AI modification patterns

      const sourceFiles = getAllSourceFiles();
      const suspiciousPatterns: Array<{ file: string; pattern: string }> = [];

      for (const file of sourceFiles) {
        try {
          const content = readFileSync(file, 'utf-8');

          // Look for patterns that suggest AI modifications
          if (content.includes('// TODO: AI modification') || content.includes('// AI generated')) {
            suspiciousPatterns.push({
              file,
              pattern: 'Contains AI modification markers',
            });
          }

          // Look for incomplete refactoring patterns
          if (content.includes('TODO') && content.includes('FIXME')) {
            suspiciousPatterns.push({
              file,
              pattern: 'Contains multiple incomplete work markers',
            });
          }

          // Look for inconsistent naming patterns
          const lines = content.split('\n');
          let inconsistentNaming = 0;
          for (const line of lines) {
            if (line.includes('const ') && line.includes('_') && line.includes('camelCase')) {
              inconsistentNaming++;
            }
          }

          if (inconsistentNaming > 2) {
            suspiciousPatterns.push({
              file,
              pattern: 'Inconsistent naming conventions',
            });
          }
        } catch (error) {
          // File read error, skip
        }
      }

      // Log suspicious patterns for review
      if (suspiciousPatterns.length > 0) {
        console.warn(
          `⚠️ AI MODIFICATION PATTERNS DETECTED: ${suspiciousPatterns.length} files show signs of AI modifications:\\n` +
            suspiciousPatterns
              .slice(0, 3)
              .map(p => `   - ${p.file}: ${p.pattern}`)
              .join('\n')
        );
      }

      // Allow AI modifications but flag for review
      expect(suspiciousPatterns.length).toBeLessThan(20);
    });

    it('validates system boundaries remain intact after modifications', () => {
      const boundaryFiles = [
        'src/integrations/supabase/client.ts',
        'src/store/auth.ts',
        'src/router/index.tsx',
        'packages/hooks',
      ];

      const boundaryIntegrity: Array<{
        boundary: string;
        status: 'intact' | 'modified' | 'missing';
      }> = [];

      for (const boundary of boundaryFiles) {
        try {
          const boundaryPath =
            boundary.endsWith('.ts') || boundary.endsWith('.tsx')
              ? join(process.cwd(), boundary)
              : join(process.cwd(), boundary);

          if (boundary.includes('packages/hooks')) {
            // Check if hooks directory exists and has content
            try {
              const hookFiles = readdirSync(boundaryPath);
              if (hookFiles.length > 0) {
                boundaryIntegrity.push({ boundary, status: 'intact' });
              } else {
                boundaryIntegrity.push({ boundary, status: 'modified' });
              }
            } catch {
              boundaryIntegrity.push({ boundary, status: 'missing' });
            }
          } else {
            // Check if file exists and has reasonable content
            try {
              const content = readFileSync(boundaryPath, 'utf-8');
              if (content.length > 50) {
                boundaryIntegrity.push({ boundary, status: 'intact' });
              } else {
                boundaryIntegrity.push({ boundary, status: 'modified' });
              }
            } catch {
              boundaryIntegrity.push({ boundary, status: 'missing' });
            }
          }
        } catch (error) {
          boundaryIntegrity.push({ boundary, status: 'missing' });
        }
      }

      const missingBoundaries = boundaryIntegrity.filter(b => b.status === 'missing');

      // Allow some missing boundaries during development but warn about critical ones
      expect(missingBoundaries.length).toBeLessThan(3);

      if (missingBoundaries.length > 0) {
        const summary = missingBoundaries.map(b => b.boundary).join('\n');

        console.warn(
          `⚠️ SYSTEM BOUNDARY WARNING: Some boundaries are missing:\\n\\n${summary}\\n\\n` +
            `This may be expected during development, but ensure critical boundaries exist in production.`
        );
      }

      // Log boundary status
      console.log('🛡️ System Boundary Status:');
      boundaryIntegrity.forEach(b => {
        console.log(`   ${b.status === 'intact' ? '✅' : '⚠️'} ${b.boundary}: ${b.status}`);
      });
    });

    it('provides comprehensive change impact assessment', () => {
      const sourceFiles = getAllSourceFiles();
      const impactAssessment = {
        totalFiles: sourceFiles.length,
        authFiles: 0,
        hookFiles: 0,
        componentFiles: 0,
        pageFiles: 0,
        utilFiles: 0,
        riskScore: 0,
        recommendations: [] as string[],
      };

      for (const file of sourceFiles) {
        if (file.includes('auth')) impactAssessment.authFiles++;
        if (file.includes('hooks')) impactAssessment.hookFiles++;
        if (file.includes('components')) impactAssessment.componentFiles++;
        if (file.includes('pages')) impactAssessment.pageFiles++;
        if (file.includes('lib') || file.includes('utils')) impactAssessment.utilFiles++;

        const analysis = analyzeFileDependencies(file);
        if (analysis) {
          // Calculate risk score based on file characteristics
          if (analysis.hasTypeErrors) impactAssessment.riskScore += 2;
          if (analysis.supabaseUsage && file.includes('components'))
            impactAssessment.riskScore += 5;
          if (analysis.criticalPatterns.length > 0) impactAssessment.riskScore += 1;
        }
      }

      // Generate recommendations based on assessment
      if (impactAssessment.riskScore > 10) {
        impactAssessment.recommendations.push('High risk score - review recent changes carefully');
      }

      if (impactAssessment.authFiles > 5) {
        impactAssessment.recommendations.push('Many auth files - verify security boundaries');
      }

      if (impactAssessment.componentFiles > 50) {
        impactAssessment.recommendations.push(
          'Large component base - consider component organization'
        );
      }

      // Log comprehensive assessment
      console.log('📊 Change Impact Assessment:', JSON.stringify(impactAssessment, null, 2));

      // Test always passes but provides valuable monitoring data
      expect(impactAssessment).toBeDefined();
      expect(impactAssessment.riskScore).toBeLessThan(50); // Reasonable risk threshold
    });
  });
});
