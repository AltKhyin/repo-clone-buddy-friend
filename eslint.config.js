import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': 'off',

      // TECH DEBT: The following rules are temporarily disabled to unblock testing framework deployment
      // These MUST be re-enabled and violations fixed systematically. Each disabled rule represents
      // technical debt that should be tracked in GitHub Issues and resolved in upcoming sprints.
      // See "Technical Debt (Consolidated Registry)" section in docs/README-BÍBLIA.md for tracking and remediation timeline.
      '@typescript-eslint/no-explicit-any': 'off', // TODO: Replace `any` with proper types (64+ violations)
      '@typescript-eslint/no-require-imports': 'off', // TODO: Convert to ES6 imports (2 violations)
      '@typescript-eslint/no-empty-object-type': 'off', // TODO: Define proper interface members (2 violations)
      'no-case-declarations': 'off', // TODO: Add block scoping to switch cases (16+ violations)
      'no-useless-escape': 'off', // TODO: Fix regex escape sequences (2 violations)
    },
  }
);
