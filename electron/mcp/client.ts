import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { defineChatSessionFunction } from 'node-llama-cpp';
import { modelFunctions } from '../llm/modelFunctions.js';
import { getMcpConfig } from '../settings/mcp.ts';

interface Channel {
    client: Client;
}

const channels: Channel[] = [];
const mcpFunctions: Record<string, any> = {
    ...modelFunctions,
};

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
                    arguments: params,
                });

                console.log(`MCP tool response for ${tool.name}:`, toolResult);
                // if (toolResult && Array.isArray(toolResult.content)) {
                // 	return toolResult.content
                // 		.filter((item) => item.type === 'text')
                // 		.map((item) => item.text)
                // 		.join('');
                // }

                return toolResult.content;
            },
        });
    }
}

export async function loadMcpTools() {
    await connect();
    console.log('Available MCP functions:', Object.keys(mcpFunctions).join(', '));
    return mcpFunctions;
}

async function connect() {
    const config = await getMcpConfig();
    console.log('MCP Config:', config);

    // clear existing channels
    for (const channel of channels) {
        await channel.client.close();
    }
    channels.length = 0; // Clear the channels array

    // clear mcpFunctions but preserve modelFunctions
    Object.keys(mcpFunctions).forEach((key) => {
        if (!(key in modelFunctions)) {
            delete mcpFunctions[key];
        }
    });

    if (!config?.servers) {
        return;
    }

    for (const [name, connection] of Object.entries(config?.servers ?? {})) {
        if (!connection) {
            console.warn(`No connection configuration found for server: ${name}`);
            continue;
        }

        if (connection.disabled) {
            console.warn(`Skipping disabled MCP server: ${name} (${connection.type})`);
            continue;
        }

        if (connection.type === 'stdio') {
            const transport = new StdioClientTransport({
                command: connection.command ?? '',
                args: connection.args ?? undefined,
                env: connection.env ?? undefined,
            });

            const client = new Client({
                name: name,
                version: '1.0.0',
            });

            console.log(`Connecting to MCP server: ${name}...`);
            console.log('Arguments:', connect);
            console.log('Environment variables:', connection.env);

            try {
                await client.connect(transport, {
                    timeout: 60000,
                    maxTotalTimeout: 60000,
                    resetTimeoutOnProgress: true,
                });
                console.log(`Connected to MCP server: ${name}`);

                const channel: Channel = {
                    client,
                    // connection
                };
                channels.push(channel);

                await registerTools(client);
            } catch (error) {
                console.error(`Failed to connect to MCP server ${name}:`, error);
                // throw new Error(`Failed to connect to MCP server ${name}`);
            }
        } else if (connection.type === 'sse' || connection.type === 'http') {
            // Handle streamable HTTP connections here
            // This part is not implemented in this example
            throw new Error('Streamable HTTP transport is not implemented in this example');
        }
    }
}
