import Store from 'electron-store';
import { McpConfig } from '../mcp/types.ts';
import { SystemPromptConfig } from '../settings/prompts.ts';

export const store = new Store<{
	systemPrompts: SystemPromptConfig;
	mcpConfig: McpConfig;
}>();
