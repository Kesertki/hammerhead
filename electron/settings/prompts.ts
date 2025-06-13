import { eventBus } from '../utils/eventBus.ts';
import { store } from './store.ts';

export interface SystemPromptConfig {
	prompts: SystemPrompt[];
	selectedPromptId: string;
}

export interface SystemPrompt {
	id: string;
	name: string;
	description: string;
	prompt: string;
}

function generateId(): string {
	return Math.random().toString(36).substring(2, 15);
}

function generateDefaultConfig(): SystemPromptConfig {
	const prompts = [
		{
			id: generateId(),
			name: 'Empty Prompt', // Default empty prompt
			description: 'This is an empty system prompt.',
			prompt: ''
		},
		{
			id: generateId(),
			name: 'Default Prompt',
			description: 'This is a default system prompt.',
			prompt: 'You are a helpful assistant.'
		},
		{
			id: generateId(),
			name: 'Advanced Prompt',
			description: 'This is an advanced system prompt.',
			prompt: 'You are an advanced AI assistant with extensive knowledge.'
		}
	];

	return {
		prompts,
		selectedPromptId: prompts[0]!.id // Select the first prompt by default
	};
}

export async function getSystemPrompts(): Promise<SystemPromptConfig> {
	return store.get('systemPrompts', generateDefaultConfig());
}

export async function setSystemPrompts(prompts: SystemPromptConfig) {
	store.set('systemPrompts', prompts);
	console.log('System prompts updated:', prompts);

	// Emit event when prompts change
	eventBus.emit('system-prompts-changed', prompts);

	// If selected prompt changed, emit specific event with the selected prompt
	const selectedPrompt = prompts.prompts.find(
		(p) => p.id === prompts.selectedPromptId
	);
	if (selectedPrompt) {
		eventBus.emit('selected-prompt-changed', selectedPrompt);
	}
}

export function getSelectedPrompt(): SystemPrompt | null {
	const config = store.get('systemPrompts', generateDefaultConfig());
	return config.prompts.find((p) => p.id === config.selectedPromptId) || null;
}
