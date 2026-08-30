import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['{apps,packages}/*/src/**/*.test.ts', 'apps/web/lib/**/*.test.ts'],
    passWithNoTests: true,
  },
});
