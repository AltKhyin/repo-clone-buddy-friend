/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
        minForks: 1,
      },
    },
    testTimeout: 5000,
    hookTimeout: 1000,
    teardownTimeout: 1000,
    reporter: 'verbose',
    include: ['src/test-ultra-simple.test.ts'],
    typecheck: { enabled: false },
    coverage: { enabled: false },
  },
});
