import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './e2e',
    environment: 'node',
    include: ['**/*.e2e-spec.ts'],
  },
});
