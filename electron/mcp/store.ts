import { store } from '../settings/store';
import { connect } from './client.ts';
import { MCPConnection } from './types.ts';

export async function getMcpServers(): Promise<MCPConnection[]> {
	return store.get('mcpServers', []);
}

export async function setMcpServers(servers: MCPConnection[]) {
	store.set('mcpServers', servers);
	console.log('Reconnecting to MCP servers:', servers);
	await connect();
}
