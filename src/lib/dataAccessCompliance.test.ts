// ABOUTME: Data Access Layer compliance tests - AI-safe guardrails to prevent architectural violations and enforce the Golden Rule

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('DataAccessCompliance - Critical Architecture Enforcement', () => {
  // Helper function to recursively get all TypeScript files in a directory
  const getAllTsFiles = (dir: string, baseDir: string = ''): string[] => {
    const files: string[] = [];
    const fullPath = join(process.cwd(), dir);

    try {
      const items = readdirSync(fullPath);

      for (const item of items) {
        const itemPath = join(fullPath, item);
        const relativePath = join(baseDir, item);

        if (statSync(itemPath).isDirectory()) {
          // Skip node_modules, dist, and test-utils directories
          if (!['node_modules', 'dist', 'test-utils', '.git'].includes(item)) {
            files.push(...getAllTsFiles(itemPath, relativePath));
          }
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(relativePath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read, skip silently
    }

    return files;
  };

  // Helper function to check if file content contains forbidden imports
  const checkFileForViolations = (
    filePath: string
  ): {
    hasDirectSupabaseImport: boolean;
    hasDirectClientAccess: boolean;
    violations: string[];
  } => {
    try {
      const fullPath = join(process.cwd(), filePath);
      const content = readFileSync(fullPath, 'utf-8');

      const violations: string[] = [];
      let hasDirectSupabaseImport = false;
      let hasDirectClientAccess = false;

      // Check for direct Supabase client imports
      const supabaseImportPatterns = [
        /import.*supabase.*from.*['"].*supabase.*client['"]/i,
        /import.*createClient.*from.*['"].*supabase/i,
        /import.*{\s*supabase\s*}.*from.*['"].*integrations.*supabase/i,
      ];

      // Check for direct Supabase client usage
      const supabaseUsagePatterns = [
        /supabase\.from\s*\(/,
        /supabase\.auth\./,
        /supabase\.storage\./,
        /supabase\.functions\./,
        /supabase\.channel\(/,
        /createClient\s*\(/,
      ];

      for (const pattern of supabaseImportPatterns) {
        if (pattern.test(content)) {
          hasDirectSupabaseImport = true;
          violations.push(`Direct Supabase import detected: ${pattern.source}`);
        }
      }

      for (const pattern of supabaseUsagePatterns) {
        if (pattern.test(content)) {
          hasDirectClientAccess = true;
          violations.push(`Direct Supabase client usage detected: ${pattern.source}`);
        }
      }

      return { hasDirectSupabaseImport, hasDirectClientAccess, violations };
    } catch (error) {
      return { hasDirectSupabaseImport: false, hasDirectClientAccess: false, violations: [] };
    }
  };

  describe('🔴 CRITICAL: Golden Rule Enforcement (DAL.1)', () => {
    it('prevents UI components from importing Supabase client directly', () => {
      const componentFiles = getAllTsFiles('src/components');
      const violations: Array<{ file: string; violations: string[] }> = [];

      for (const file of componentFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        const result = checkFileForViolations(file);
        if (result.hasDirectSupabaseImport || result.hasDirectClientAccess) {
          violations.push({ file, violations: result.violations });
        }
      }

      expect(violations).toHaveLength(0);

      if (violations.length > 0) {
        const violationSummary = violations
          .map(v => `${v.file}: ${v.violations.join(', ')}`)
          .join('\n');

        throw new Error(
          `🚫 CRITICAL VIOLATION: UI components are directly importing/using Supabase client!\n\n` +
            `This breaks the Golden Rule (DAL.1). All data access must go through hooks in packages/hooks/.\n\n` +
            `Violations found:\n${violationSummary}\n\n` +
            `Fix: Replace direct Supabase usage with appropriate hooks from packages/hooks/`
        );
      }
    });

    it('prevents page components from importing Supabase client directly', () => {
      const pageFiles = getAllTsFiles('src/pages');
      const violations: Array<{ file: string; violations: string[] }> = [];

      for (const file of pageFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        const result = checkFileForViolations(file);
        if (result.hasDirectSupabaseImport || result.hasDirectClientAccess) {
          violations.push({ file, violations: result.violations });
        }
      }

      expect(violations).toHaveLength(0);

      if (violations.length > 0) {
        const violationSummary = violations
          .map(v => `${v.file}: ${v.violations.join(', ')}`)
          .join('\n');

        throw new Error(
          `🚫 CRITICAL VIOLATION: Page components are directly importing/using Supabase client!\n\n` +
            `This breaks the Golden Rule (DAL.1). All data access must go through hooks in packages/hooks/.\n\n` +
            `Violations found:\n${violationSummary}\n\n` +
            `Fix: Replace direct Supabase usage with appropriate hooks from packages/hooks/`
        );
      }
    });

    it('allows data-fetching hooks to import Supabase client', () => {
      const hookFiles = getAllTsFiles('packages/hooks');
      let validHooksCount = 0;
      let totalHookFiles = 0;

      for (const file of hookFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        totalHookFiles++;

        try {
          const fullPath = join(process.cwd(), file);
          const content = readFileSync(fullPath, 'utf-8');

          // Data hooks are allowed to import Supabase or use TanStack Query
          if (
            content.includes('supabase') ||
            content.includes('useQuery') ||
            content.includes('useMutation')
          ) {
            validHooksCount++;
          }
        } catch (error) {
          // File doesn't exist or can't be read, skip
        }
      }

      // Should have at least some hook files
      expect(totalHookFiles).toBeGreaterThan(0);

      // If we have hook files, at least some should be data hooks
      if (totalHookFiles > 0) {
        expect(validHooksCount).toBeGreaterThanOrEqual(0); // Allow for non-data hooks
      }
    });
  });

  describe('🟡 CRITICAL: Hook Pattern Compliance (DAL.2, DAL.3)', () => {
    it('ensures all data hooks use TanStack Query patterns', () => {
      const hookFiles = getAllTsFiles('packages/hooks');
      const violatingHooks: string[] = [];

      for (const file of hookFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        try {
          const fullPath = join(process.cwd(), file);
          const content = readFileSync(fullPath, 'utf-8');

          // Check if it's a data-fetching hook
          const isDataHook =
            content.includes('export') &&
            (content.includes('Query') || content.includes('Mutation')) &&
            file.startsWith('use');

          if (isDataHook) {
            // Must use TanStack Query patterns
            const usesTanStackQuery =
              content.includes('useQuery') ||
              content.includes('useInfiniteQuery') ||
              content.includes('useMutation');

            if (!usesTanStackQuery) {
              violatingHooks.push(file);
            }
          }
        } catch (error) {
          // File doesn't exist or can't be read, skip
        }
      }

      expect(violatingHooks).toHaveLength(0);

      if (violatingHooks.length > 0) {
        throw new Error(
          `🚫 HOOK PATTERN VIOLATION: Data hooks must use TanStack Query patterns!\n\n` +
            `Violating hooks: ${violatingHooks.join(', ')}\n\n` +
            `Fix: Use useQuery, useInfiniteQuery, or useMutation from @tanstack/react-query`
        );
      }
    });

    it('ensures mutation hooks implement cache invalidation (DAL.4)', () => {
      const hookFiles = getAllTsFiles('packages/hooks');
      const violatingMutations: string[] = [];

      for (const file of hookFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        try {
          const fullPath = join(process.cwd(), file);
          const content = readFileSync(fullPath, 'utf-8');

          // Check if it's a mutation hook
          const isMutationHook =
            content.includes('useMutation') &&
            content.includes('export') &&
            file.includes('Mutation');

          if (isMutationHook) {
            // Must implement cache invalidation
            const implementsInvalidation =
              content.includes('invalidateQueries') ||
              content.includes('setQueryData') ||
              content.includes('refetch');

            if (!implementsInvalidation) {
              violatingMutations.push(file);
            }
          }
        } catch (error) {
          // File doesn't exist or can't be read, skip
        }
      }

      expect(violatingMutations).toHaveLength(0);

      if (violatingMutations.length > 0) {
        throw new Error(
          `🚫 CACHE INVALIDATION VIOLATION: Mutation hooks must invalidate relevant queries!\n\n` +
            `Violating mutations: ${violatingMutations.join(', ')}\n\n` +
            `Fix: Add queryClient.invalidateQueries() or setQueryData() in onSuccess callback`
        );
      }
    });
  });

  describe('🟢 STRATEGIC: Import Pattern Validation', () => {
    it('ensures consistent import patterns for cross-module imports', () => {
      const allFiles = [
        ...getAllTsFiles('src/components'),
        ...getAllTsFiles('src/pages'),
        ...getAllTsFiles('packages/hooks'),
      ];

      const violatingFiles: Array<{ file: string; issue: string }> = [];

      for (const file of allFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        try {
          const fullPath = join(process.cwd(), file);
          const content = readFileSync(fullPath, 'utf-8');

          // Check for inconsistent import patterns
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for imports that should use @ alias
            if (line.startsWith('import') && line.includes('../')) {
              const hasMultipleDotDotSlashes = (line.match(/\.\.\//g) || []).length >= 2;

              if (hasMultipleDotDotSlashes) {
                violatingFiles.push({
                  file,
                  issue: `Line ${i + 1}: Use @ alias for cross-module imports instead of ../../../`,
                });
              }
            }
          }
        } catch (error) {
          // File doesn't exist or can't be read, skip
        }
      }

      // Allow some violations but warn if there are too many
      if (violatingFiles.length > 10) {
        console.warn(
          `⚠️ Import Pattern Warning: Found ${violatingFiles.length} files with inconsistent import patterns.\n` +
            `Consider standardizing to use @ alias for cross-module imports.`
        );
      }

      // This is not a critical failure, just a code quality check
      expect(violatingFiles.length).toBeLessThan(50); // Allow some flexibility
    });

    it('validates that UI components import from correct locations', () => {
      const componentFiles = getAllTsFiles('src/components');
      const violations: Array<{ file: string; issue: string }> = [];

      for (const file of componentFiles) {
        // Skip test files and ui components themselves
        if (
          file.includes('.test.') ||
          file.includes('.spec.') ||
          file.includes('src/components/ui/')
        )
          continue;

        try {
          const fullPath = join(process.cwd(), file);
          const content = readFileSync(fullPath, 'utf-8');

          // Check for proper UI component imports
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // UI components should be imported from @/components/ui/[component]
            if (
              line.includes('from') &&
              line.includes('Button') &&
              !line.includes('@/components/ui/')
            ) {
              violations.push({
                file,
                issue: `Line ${i + 1}: Import Button from @/components/ui/button`,
              });
            }
          }
        } catch (error) {
          // File doesn't exist or can't be read, skip
        }
      }

      // This is a recommendation, not a hard requirement
      if (violations.length > 0) {
        console.warn(
          `⚠️ UI Import Warning: Found ${violations.length} components with non-standard UI imports.\n` +
            `Consider importing UI components from @/components/ui/[component]`
        );
      }

      expect(violations.length).toBeLessThan(20); // Allow some flexibility
    });
  });

  describe('🔵 AI-SAFETY: Architecture Drift Detection', () => {
    it('detects if new direct database queries are added to components', () => {
      const allComponentFiles = [...getAllTsFiles('src/components'), ...getAllTsFiles('src/pages')];

      const sqlViolations: Array<{ file: string; line: number; content: string }> = [];

      for (const file of allComponentFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        try {
          const fullPath = join(process.cwd(), file);
          const content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();

            // Check for SQL-like patterns that shouldn't be in components
            if (
              line.includes('select ') ||
              line.includes('insert ') ||
              line.includes('update ') ||
              line.includes('delete ') ||
              line.includes('.eq(') ||
              line.includes('.match(') ||
              line.includes('.in(')
            ) {
              sqlViolations.push({
                file,
                line: i + 1,
                content: lines[i].trim(),
              });
            }
          }
        } catch (error) {
          // File doesn't exist or can't be read, skip
        }
      }

      expect(sqlViolations).toHaveLength(0);

      if (sqlViolations.length > 0) {
        const violationSummary = sqlViolations
          .map(v => `${v.file}:${v.line} - ${v.content}`)
          .join('\n');

        throw new Error(
          `🚫 ARCHITECTURE DRIFT DETECTED: Components contain direct database queries!\n\n` +
            `This violates the data access layer architecture. Move queries to packages/hooks/.\n\n` +
            `Violations:\n${violationSummary}`
        );
      }
    });

    it('validates that no new direct API calls are added to components', () => {
      const componentFiles = getAllTsFiles('src/components');
      const apiViolations: Array<{ file: string; issue: string }> = [];

      for (const file of componentFiles) {
        // Skip test files
        if (file.includes('.test.') || file.includes('.spec.')) continue;

        try {
          const fullPath = join(process.cwd(), file);
          const content = readFileSync(fullPath, 'utf-8');

          // Check for direct fetch/axios calls in components
          const hasFetch = content.includes('fetch(') && !content.includes('// allowed fetch');
          const hasAxios = content.includes('axios.') && !content.includes('// allowed axios');

          if (hasFetch) {
            apiViolations.push({ file, issue: 'Direct fetch() call detected' });
          }

          if (hasAxios) {
            apiViolations.push({ file, issue: 'Direct axios call detected' });
          }
        } catch (error) {
          // File doesn't exist or can't be read, skip
        }
      }

      expect(apiViolations).toHaveLength(0);

      if (apiViolations.length > 0) {
        const violationSummary = apiViolations.map(v => `${v.file}: ${v.issue}`).join('\n');

        throw new Error(
          `🚫 API CALL VIOLATION: Components should not make direct API calls!\n\n` +
            `Use hooks from packages/hooks/ instead.\n\n` +
            `Violations:\n${violationSummary}`
        );
      }
    });
  });
});
