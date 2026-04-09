import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './test',
    environment: 'node',
    include: ['**/*.spec.ts'],
  },
  plugins: [swc.vite({ tsconfigFile: './tsconfig.json' })],
});
