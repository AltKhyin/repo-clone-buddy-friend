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
    css: true,
    // OPTIMIZED: Reduced timeouts for faster execution
    testTimeout: 10000, // 10 second timeout per test (was 30s)
    hookTimeout: 5000, // 5 second timeout for hooks (was 10s)
    teardownTimeout: 3000, // 3 second teardown timeout (was 10s)
    // OPTIMIZED: Use threads for better performance than forks
    pool: 'threads', // Better performance than forks for I/O bound tests
    poolOptions: {
      threads: {
        maxThreads: 4, // Limit concurrent threads
        minThreads: 2, // Minimum threads for consistent performance
      },
    },
    // PERFORMANCE: Enable test categorization
    typecheck: {
      enabled: false, // Disable typecheck in tests for speed
    },
    // PERFORMANCE: Optimize slow test detection
    slowTestThreshold: 5000, // Flag tests taking longer than 5s
    // PERFORMANCE: Test filtering and execution optimization
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.claude/**',
      'supabase/**',
      '**/test-utils/**',
      '**/*.integration.test.{ts,tsx}', // Run integration tests separately
    ],
    // PERFORMANCE: Faster reporter for development
    reporter: process.env.CI ? 'verbose' : 'basic',
    coverage: {
      provider: 'v8',
      // OPTIMIZED: Faster coverage reporting
      reporter: process.env.CI ? ['text', 'json', 'html'] : ['text'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        'dist/',
        '.claude/',
        'supabase/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
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
