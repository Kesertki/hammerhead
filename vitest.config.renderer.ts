import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        environment: 'happy-dom',
        globals: true,
        include: ['src/**/*.test.{ts,tsx}'], // Find all test files in src directory
        setupFiles: './tests/setup.ts', // Optional: for global mocks
    },
});
