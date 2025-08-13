import { contextBridge, ipcRenderer } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args;
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args;
        return ipcRenderer.off(channel, ...omit);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args;
        return ipcRenderer.send(channel, ...omit);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args;
        return ipcRenderer.invoke(channel, ...omit);
    },

    // You can expose other APIs you need here
    // ...
});

contextBridge.exposeInMainWorld('electronAPI', {
    getMCPConfig: () => ipcRenderer.invoke('get-mcp-config'),
    setMCPConfig: (config: any) => ipcRenderer.invoke('set-mcp-config', config),
    getSystemPrompts: () => ipcRenderer.invoke('get-system-prompts'),
    setSystemPrompts: (prompts: any) => ipcRenderer.invoke('set-system-prompts', prompts),
    getVoiceSettings: () => ipcRenderer.invoke('get-voice-settings'),
    setVoiceSettings: (settings: import('../src/types').VoiceSettings) =>
        ipcRenderer.invoke('set-voice-settings', settings),
    getGeneralSettings: () => ipcRenderer.invoke('get-general-settings'),
    setGeneralSettings: (settings: import('../src/types').GeneralSettings) =>
        ipcRenderer.invoke('set-general-settings', settings),
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

    // Log-related functions
    getLogs: (limit?: number) => ipcRenderer.invoke('get-logs', limit),
    clearLogs: () => ipcRenderer.invoke('clear-logs'),
    getLogFilePath: () => ipcRenderer.invoke('get-log-file-path'),

    // Navigation handler for menu items
    onNavigateToRoute: (callback: (route: string) => void) => {
        ipcRenderer.on('navigate-to-route', (_event, route) => callback(route));
    },
});
