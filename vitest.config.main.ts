// vitest.config.main.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: './tests/setup.ts',
        include: [
            'electron/tests/**/*.test.{ts,tsx}', // Centralized electron tests
            'electron/**/*.test.{ts,tsx}', // Co-located tests next to files
        ],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/chatStorageSqlite.test.ts', // Skip SQLite tests due to Node.js version conflicts
        ],
    },
});
