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
		getMCPServers: () => Promise<any>;
		setMCPServers: (servers: any[]) => Promise<void>;
		getMCPConfig: () => Promise<any>;
		setMCPConfig: (config: any) => Promise<void>;
		getSystemPrompts: () => Promise<any>;
		setSystemPrompts: (prompts: any) => Promise<void>;
		openExternal: (url: string) => Promise<void>;
	};
}
