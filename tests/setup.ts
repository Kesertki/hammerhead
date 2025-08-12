import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(process, 'versions', {
    value: {
        ...process.versions,
        electron: '29.0.0', // use any version string you expect
    },
});

// Mock the Electron preload bridge
globalThis.window ??= globalThis as unknown as Window & typeof globalThis;

// Mock ipcRenderer
Object.defineProperty(window, 'ipcRenderer', {
    value: {
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        removeListener: vi.fn(),
    },
});

// Mock electronAPI
Object.defineProperty(window, 'electronAPI', {
    value: {
        getMCPConfig: vi.fn().mockResolvedValue({}),
        setMCPConfig: vi.fn().mockResolvedValue(undefined),
        getSystemPrompts: vi.fn().mockResolvedValue({}),
        setSystemPrompts: vi.fn().mockResolvedValue(undefined),
        getVoiceSettings: vi.fn().mockResolvedValue({ model: 'test-model', language: 'en' }),
        setVoiceSettings: vi.fn().mockResolvedValue(undefined),
        getGeneralSettings: vi.fn().mockResolvedValue({ language: 'en' }),
        setGeneralSettings: vi.fn().mockResolvedValue(undefined),
        openExternal: vi.fn().mockResolvedValue(undefined),
        getLogs: vi.fn().mockResolvedValue([]),
        clearLogs: vi.fn().mockResolvedValue(undefined),
        getLogFilePath: vi.fn().mockResolvedValue('/test/path'),
        onNavigateToRoute: vi.fn(),
    },
});
