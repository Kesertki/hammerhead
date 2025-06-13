export interface Connection {
	name: string;
	transport: 'stdio' | 'streamable http';
	command: string;
	args: string;
	env: string;
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
			getMCPServers: () => Promise<Connection[]>;
			setMCPServers: (servers: Connection[]) => Promise<void>;
			getSystemPrompts: () => Promise<SystemPromptConfig>;
			setSystemPrompts: (prompts: SystemPromptConfig) => Promise<void>;
		};
	}
}
