import Store from 'electron-store';
import { MCPConnection } from '../mcp/types.ts';
import { SystemPromptConfig } from '../settings/prompts.ts';

export const store = new Store<{
	mcpServers: MCPConnection[];
	systemPrompts: SystemPromptConfig;
}>();
