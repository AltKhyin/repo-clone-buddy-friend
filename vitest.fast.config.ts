/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup-minimal.ts'], // Use minimal setup
    css: false, // Disable CSS processing for speed
    testTimeout: 3000, // 3 second timeout for fast tests
    hookTimeout: 1000, // 1 second hook timeout
    teardownTimeout: 1000, // 1 second teardown
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 2, // Limit threads for simple tests
        minThreads: 1,
      },
    },
    typecheck: {
      enabled: false, // Disable typecheck for speed
    },
    slowTestThreshold: 1000, // Flag tests taking longer than 1s
    include: ['src/**/*.simple.test.{ts,tsx}'], // Only simple tests
    exclude: ['node_modules/**', 'dist/**', '.claude/**', 'supabase/**', '**/test-utils/**'],
    reporter: 'basic',
    coverage: {
      enabled: false, // Disable coverage for speed
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages': path.resolve(__dirname, './packages'),
    },
  },
});
