import { McpConfig } from '../mcp/types.ts';
import { store } from '../settings/store';
import { eventBus } from '../utils/eventBus.ts';

export async function getMcpConfig(): Promise<McpConfig | null> {
	try {
		return store.get('mcpConfig');
	} catch {
		return null;
	}
}

export async function setMcpConfig(config: any) {
	store.set('mcpConfig', config);
	eventBus.emit('mcp-config-changed', config);
}
