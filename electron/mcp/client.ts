import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { defineChatSessionFunction } from 'node-llama-cpp';
import { modelFunctions } from '../llm/modelFunctions.js';
import { getMcpServers } from '../settings/mcp.ts';
import { MCPConnection } from './types';

interface Channel {
	client: Client;
	connection: MCPConnection;
}

const channels: Channel[] = [];
const mcpFunctions: Record<string, any> = {
	...modelFunctions
};

function parseArgs(args: string): string[] {
	return args
		.split(' ')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

// function parseEnv(env: string): Record<string, string> {
// 	return env
// 		.split('\n')
// 		.map((line) => line.trim())
// 		.filter((line) => line.includes('='))
// 		.reduce(
// 			(acc, line) => {
// 				const [key, ...rest] = line.split('=');
// 				if (!key || rest.length === 0) {
// 					return acc; // Skip invalid lines
// 				}
// 				acc[key.trim()] = rest.join('=').trim();
// 				return acc;
// 			},
// 			{} as Record<string, string>
// 		);
// }

async function registerTools(client: Client) {
	const { tools } = await client.listTools();
	// console.log('Available tools:', JSON.stringify(tools, null, 2));

	for (const tool of tools) {
		mcpFunctions[tool.name] = defineChatSessionFunction({
			description: tool.description,
			params: (tool.inputSchema as any) || undefined,
			handler: async (params: any) => {
				console.log(`Calling MCP tool: ${tool.name} with params:`, params);
				const toolResult = await client.callTool({
					name: tool.name,
					arguments: params
				});

				console.log(`MCP tool response for ${tool.name}:`, toolResult);
				// if (toolResult && Array.isArray(toolResult.content)) {
				// 	return toolResult.content
				// 		.filter((item) => item.type === 'text')
				// 		.map((item) => item.text)
				// 		.join('');
				// }

				return toolResult.content;
			}
		});
	}
}

export async function loadMcpTools() {
	await connect();
	console.log('Available MCP functions:', Object.keys(mcpFunctions).join(', '));
	return mcpFunctions;
}

async function connect() {
	const connections = await getMcpServers();
	console.log('Connections:', connections);

	// clear existing channels
	for (const channel of channels) {
		await channel.client.close();
	}
	channels.length = 0; // Clear the channels array

	// clear mcpFunctions
	Object.keys(mcpFunctions).forEach((key) => {
		delete mcpFunctions[key];
	});

	for (const connection of connections) {
		if (connection.transport === 'stdio') {
			const transport = new StdioClientTransport({
				command: connection.command,
				args: parseArgs(connection.args)
				// env: parseEnv(connection.env)
			});

			const client = new Client({
				name: connection.name,
				version: '1.0.0'
			});

			console.log(`Connecting to MCP server: ${connection.name}...`);
			try {
				await client.connect(transport, {
					timeout: 60000,
					maxTotalTimeout: 60000,
					resetTimeoutOnProgress: true
				});
				console.log(`Connected to MCP server: ${connection.name}`);

				const channel: Channel = {
					client,
					connection
				};
				channels.push(channel);

				await registerTools(client);
			} catch (error) {
				console.error(
					`Failed to connect to MCP server ${connection.name}:`,
					error
				);
				// throw new Error(`Failed to connect to MCP server ${connection.name}`);
			}
		} else if (connection.transport === 'streamable http') {
			// Handle streamable HTTP connections here
			// This part is not implemented in this example
			throw new Error(
				'Streamable HTTP transport is not implemented in this example'
			);
		}
	}
}
