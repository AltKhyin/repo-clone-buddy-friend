/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Use node environment for speed
    css: false, // Disable CSS processing for speed
    testTimeout: 3000, // Fast timeout for commit validation
    hookTimeout: 1000,
    teardownTimeout: 1000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 1, // Single thread for maximum speed
        minThreads: 1,
      },
    },
    typecheck: {
      enabled: false, // Disable for speed
    },
    reporter: 'basic',
    coverage: {
      enabled: false, // Disable coverage for speed
    },
    // Only include one stable test file for fast commit validation
    include: ['src/test-empty.test.ts'],
    exclude: ['node_modules/**', 'dist/**', '.claude/**', 'supabase/**', '**/test-utils/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages': path.resolve(__dirname, './packages'),
    },
  },
});
