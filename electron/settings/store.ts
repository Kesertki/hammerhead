import Store from 'electron-store';
import { McpConfig } from '../mcp/types.ts';
import { SystemPromptConfig } from '../settings/prompts.ts';
import { VoiceSettings } from '../settings/voice.ts';

export const store = new Store<{
	systemPrompts: SystemPromptConfig;
	mcpConfig: McpConfig;
	voiceSettings: VoiceSettings;
}>();
