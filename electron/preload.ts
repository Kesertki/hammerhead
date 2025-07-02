import { contextBridge, ipcRenderer } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
	on(...args: Parameters<typeof ipcRenderer.on>) {
		const [channel, listener] = args;
		return ipcRenderer.on(channel, (event, ...args) =>
			listener(event, ...args)
		);
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
	}

	// You can expose other APIs you need here
	// ...
});

contextBridge.exposeInMainWorld('electronAPI', {
	getMCPServers: () => ipcRenderer.invoke('get-mcp-servers'),
	setMCPServers: (servers: any[]) =>
		ipcRenderer.invoke('set-mcp-servers', servers),
	getMCPConfig: () => ipcRenderer.invoke('get-mcp-config'),
	setMCPConfig: (config: any) => ipcRenderer.invoke('set-mcp-config', config),
	getSystemPrompts: () => ipcRenderer.invoke('get-system-prompts'),
	setSystemPrompts: (prompts: any) =>
		ipcRenderer.invoke('set-system-prompts', prompts),
	openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
});
