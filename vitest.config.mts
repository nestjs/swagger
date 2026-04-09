import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './test',
    environment: 'node',
    include: ['**/*.spec.ts'],
  },
});
