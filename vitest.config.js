// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'html'，'json-summary'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
