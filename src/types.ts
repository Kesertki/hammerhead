import { DEFAULT_WHISPER_IMAGE, DEFAULT_WHISPER_MODEL, DEFAULT_WHISPER_LANGUAGE } from '../globals';

export interface Connection {
    name: string;
    transport: 'stdio' | 'streamable http';
    command: string;
    args: string;
    env: string;
}

export interface McpConfig {
    inputs?: Array<{
        type: string;
        id: string;
        description: string;
        password?: boolean;
    }>;
    mcpServers: {
        [key: string]: {
            type?: 'stdio' | 'sse';
            command?: string;
            args?: string[];
            env?: { [key: string]: string };
            cwd?: string;
            url?: string;
            headers?: { [key: string]: string };
        };
    };
}

export interface SystemPromptConfig {
    selectedPromptId: string;
    prompts: SystemPrompt[];
}

export interface SystemPrompt {
    id: string;
    name: string;
    description: string;
    prompt: string;
}

export interface LogEntry {
    timestamp: string;
    level: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    stack?: string;
}

export interface AudioMetadata {
    id: string;
    filename: string;
    fullPath: string;
    size: number;
    duration: number;
    mimeType: string;
    createdAt: string;
}

export interface TranscriptionResult {
    text: string;
    confidence?: number;
    language?: string;
    duration?: number;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
        confidence?: number;
    }>;
}

export interface GeneralSettings {
    language: string;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
    language: 'en',
};

export interface VoiceSettings {
    enabled: boolean;
    dockerImage: string;
    model: string;
    language: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
    enabled: false, // Default to disabled
    dockerImage: DEFAULT_WHISPER_IMAGE,
    model: DEFAULT_WHISPER_MODEL,
    language: DEFAULT_WHISPER_LANGUAGE,
};

declare global {
    interface Window {
        electronAPI: {
            getMCPConfig: () => Promise<McpConfig>;
            setMCPConfig: (config: McpConfig) => Promise<void>;
            getSystemPrompts: () => Promise<SystemPromptConfig>;
            setSystemPrompts: (prompts: SystemPromptConfig) => Promise<void>;
            getVoiceSettings: () => Promise<VoiceSettings>;
            setVoiceSettings: (settings: VoiceSettings) => Promise<void>;
            getGeneralSettings: () => Promise<GeneralSettings>;
            setGeneralSettings: (settings: GeneralSettings) => Promise<void>;
            openExternal: (url: string) => Promise<void>;
            getLogs: (limit?: number) => Promise<LogEntry[]>;
            clearLogs: () => Promise<void>;
            getLogFilePath: () => Promise<string>;
            onNavigateToRoute: (callback: (route: string) => void) => void;
        };
    }
}

export interface ModelDownloadProgress {
    modelId: string;
    title: string;
    downloadUrl: string;
    totalSize: number;
    downloadedSize: number;
    percentage: number;
    status: 'downloading' | 'completed' | 'error' | 'cancelled';
    error?: string;
    filePath?: string;
}

export interface ModelInfo {
    id: string;
    title: string;
    description: string;
    size: number;
    author: string;
    variants: string[];
    filePath: string;
    fileSize: number;
    downloadedAt: string;
    downloadUrl: string;
    modelUrl?: string;
}

export interface ModelMetadata {
    models: Record<string, ModelInfo>;
    lastUpdated: string;
}

// Model types
export interface ModelDownloadProgress {
    modelId: string;
    title: string;
    downloadUrl: string;
    totalSize: number;
    downloadedSize: number;
    percentage: number;
    status: 'downloading' | 'completed' | 'error' | 'cancelled';
    error?: string;
    filePath?: string;
}

export interface ModelInfo {
    id: string;
    title: string;
    description: string;
    size: number;
    author: string;
    variants: string[];
    filePath: string;
    fileSize: number;
    downloadedAt: string;
}
