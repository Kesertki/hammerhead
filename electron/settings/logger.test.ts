import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLogs, getLogFilePath, getLogs, initializeLogger, logger } from './logger';

// Mock electron and fs modules
vi.mock('electron', () => ({
    app: {
        getPath: vi.fn(() => '/mock/app/path'),
    },
}));

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn(),
        mkdir: vi.fn(),
        appendFile: vi.fn(),
        writeFile: vi.fn(),
        readFile: vi.fn(() => Promise.resolve('')),
        unlink: vi.fn(),
        stat: vi.fn(() => Promise.resolve({ size: 1000 })),
        rename: vi.fn(),
    },
}));

vi.mock('node:path', () => ({
    default: {
        join: vi.fn((...paths) => paths.join('/')),
        dirname: vi.fn(() => '/mock/dir'),
    },
}));

describe('Logger', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore console if it was overridden
        logger.restoreConsole();
    });

    it('should export convenience functions', () => {
        expect(typeof getLogs).toBe('function');
        expect(typeof clearLogs).toBe('function');
        expect(typeof getLogFilePath).toBe('function');
        expect(typeof initializeLogger).toBe('function');
    });

    it('should return log file path', () => {
        const logPath = getLogFilePath();
        expect(typeof logPath).toBe('string');
        expect(logPath).toContain('.log');
    });

    it('should handle getting logs', async () => {
        const logs = await getLogs();
        expect(Array.isArray(logs)).toBe(true);
    });

    it('should handle getting logs with limit', async () => {
        const logs = await getLogs(10);
        expect(Array.isArray(logs)).toBe(true);
    });

    it('should handle clearing logs', async () => {
        // Should not throw
        await expect(clearLogs()).resolves.not.toThrow();
    });

    it('should handle initialization', async () => {
        // Should not throw
        await expect(initializeLogger()).resolves.not.toThrow();
    });
});
