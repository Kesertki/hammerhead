import { MCPConnection } from '../mcp/types.ts';
import { store } from '../settings/store';
import { eventBus } from '../utils/eventBus.ts';

export async function getMcpServers(): Promise<MCPConnection[]> {
	return store.get('mcpServers', []);
}

export async function setMcpServers(servers: MCPConnection[]) {
	store.set('mcpServers', servers);
	eventBus.emit('mcp-servers-changed', servers);
}

// New JSON config functions for Monaco Editor
export async function getMcpConfig(): Promise<any> {
	return store.get('mcpConfig', null);
}

export async function setMcpConfig(config: any) {
	store.set('mcpConfig', config);
	eventBus.emit('mcp-config-changed', config);
}
