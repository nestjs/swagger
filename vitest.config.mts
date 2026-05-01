import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './test',
    environment: 'node',
    testTimeout: 30000,
    include: ['**/*.spec.ts'],
  },
});
