/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
	interface ProcessEnv {
		/**
		 * The built directory structure
		 *
		 * ```tree
		 * ├─┬─┬ dist
		 * │ │ └── index.html
		 * │ │
		 * │ ├─┬ dist-electron
		 * │ │ ├── index.js
		 * │ │ └── preload.mjs
		 * │
		 * ```
		 */
		APP_ROOT: string;
		/** /dist/ or /public/ */
		VITE_PUBLIC: string;
	}
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
	ipcRenderer: import('electron').IpcRenderer;
	electronAPI: {
		getMCPConfig: () => Promise<import('../src/types').McpConfig>;
		setMCPConfig: (
			config: import('../src/types').McpConfig
		) => Promise<void>;
		getSystemPrompts: () => Promise<
			import('../src/types').SystemPromptConfig
		>;
		setSystemPrompts: (
			prompts: import('../src/types').SystemPromptConfig
		) => Promise<void>;
		openExternal: (url: string) => Promise<void>;
		getLogs: (limit?: number) => Promise<import('../src/types').LogEntry[]>;
		clearLogs: () => Promise<void>;
		getLogFilePath: () => Promise<string>;
		onNavigateToRoute: (callback: (route: string) => void) => void;
	};
}
