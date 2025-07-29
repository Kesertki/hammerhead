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
    servers: {
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

export interface VoiceSettings {
    model: string;
    language: string;
}

declare global {
    interface Window {
        electronAPI: {
            getMCPConfig: () => Promise<McpConfig>;
            setMCPConfig: (config: McpConfig) => Promise<void>;
            getSystemPrompts: () => Promise<SystemPromptConfig>;
            setSystemPrompts: (prompts: SystemPromptConfig) => Promise<void>;
            getVoiceSettings: () => Promise<VoiceSettings>;
            setVoiceSettings: (settings: VoiceSettings) => Promise<void>;
            openExternal: (url: string) => Promise<void>;
            getLogs: (limit?: number) => Promise<LogEntry[]>;
            clearLogs: () => Promise<void>;
            getLogFilePath: () => Promise<string>;
            onNavigateToRoute: (callback: (route: string) => void) => void;
        };
    }
}
