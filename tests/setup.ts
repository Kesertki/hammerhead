import '@testing-library/jest-dom';
import { vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n for tests
i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
        escapeValue: false,
    },
    resources: {
        en: {
            translation: {
                // Add common translation keys used in tests
                toggle_sidebar: 'Toggle sidebar',
                unload_model: 'Unload model',
                clear_chat_history: 'Clear chat history',
                'model_selector.no_model_loaded': 'No model loaded',
                'welcome.title': 'Welcome to Hammerhead',
                'welcome.choose_a_model': 'Choose a model to get started',
            },
        },
    },
});

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
