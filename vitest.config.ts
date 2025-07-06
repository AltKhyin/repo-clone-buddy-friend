/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],

    // STRATEGIC: Fast feedback for critical tests only
    testTimeout: 5000, // 5 second timeout - tests should be fast

    // SIMPLE: Basic test file patterns
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'supabase/**'],

    // STRATEGIC: Coverage focused on quality, not quantity
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        'dist/',
        'supabase/',
        '**/*.test.{ts,tsx}',
      ],
      thresholds: {
        global: {
          statements: 70, // Strategic coverage, not exhaustive
          branches: 70,
          functions: 70,
          lines: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages': path.resolve(__dirname, './packages'),
    },
  },
});
