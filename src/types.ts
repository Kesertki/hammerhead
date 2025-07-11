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

declare global {
	interface Window {
		electronAPI: {
			getMCPConfig: () => Promise<any>;
			setMCPConfig: (config: any) => Promise<void>;
			getSystemPrompts: () => Promise<any>;
			setSystemPrompts: (prompts: any) => Promise<void>;
			openExternal: (url: string) => Promise<void>;
		};
	}
}
