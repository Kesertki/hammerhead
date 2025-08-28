/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        getMCPConfig: () => Promise<import('./types').McpConfig>;
        setMCPConfig: (config: import('./types').McpConfig) => Promise<void>;
        getSystemPrompts: () => Promise<import('./types').SystemPromptConfig>;
        setSystemPrompts: (prompts: import('./types').SystemPromptConfig) => Promise<void>;
        getVoiceSettings: () => Promise<import('./types').VoiceSettings>;
        setVoiceSettings: (settings: import('./types').VoiceSettings) => Promise<void>;
        getGeneralSettings: () => Promise<import('./types').GeneralSettings>;
        setGeneralSettings: (settings: import('./types').GeneralSettings) => Promise<void>;
        openExternal: (url: string) => Promise<void>;
        getLogs: (limit?: number) => Promise<import('./types').LogEntry[]>;
        clearLogs: () => Promise<void>;
        getLogFilePath: () => Promise<string>;
        onNavigateToRoute: (callback: (route: string) => void) => void;

        // MCP tool consent handling
        requestMcpToolConsent: (toolName: string, args: any) => Promise<boolean>;
        onShowMcpConsentDialog: (callback: (data: { toolName: string; args: any; requestId: string }) => void) => void;
        respondMcpToolConsent: (response: { requestId: string; approved: boolean }) => void;
    };
}
