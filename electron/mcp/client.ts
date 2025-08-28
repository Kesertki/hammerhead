import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { defineChatSessionFunction } from 'node-llama-cpp';
import { systemFunctions } from '../llm/modelFunctions.js';
import { getMcpConfig } from '../settings/mcp.ts';

interface Channel {
    client: Client;
}

const channels: Channel[] = [];
const mcpFunctions: Record<string, any> = {
    ...systemFunctions,
};

async function registerTools(client: Client) {
    const { tools } = await client.listTools();
    // console.log('Available tools:', JSON.stringify(tools, null, 2));

    for (const tool of tools) {
        mcpFunctions[tool.name] = defineChatSessionFunction({
            description: tool.description,
            params: (tool.inputSchema as any) || undefined,
            handler: async (params: any) => {
                console.log(`MCP tool execution requested: ${tool.name} with params:`, params);

                // Request user consent before executing the tool
                try {
                    const consent = await requestToolConsent(tool.name, params);

                    if (!consent) {
                        console.log(`User denied consent for MCP tool: ${tool.name}`);
                        throw new Error(`User denied permission to execute tool: ${tool.name}`);
                    }

                    console.log(`User approved MCP tool: ${tool.name}, executing...`);
                    const toolResult = await client.callTool({
                        name: tool.name,
                        arguments: params,
                    });

                    console.log(`MCP tool response for ${tool.name}:`, toolResult);
                    return toolResult.content;
                } catch (error) {
                    console.error(`Error executing MCP tool ${tool.name}:`, error);
                    throw error;
                }
            },
        });
    }
}

// Function to request user consent via IPC
async function requestToolConsent(toolName: string, args: any): Promise<boolean> {
    try {
        const { ipcMain, BrowserWindow } = await import('electron');
        const windows = BrowserWindow.getAllWindows();

        if (windows.length === 0) {
            console.warn('No browser windows available for consent dialog');
            return false;
        }

        const mainWindow = windows[0];
        if (!mainWindow) {
            console.warn('Main window is not available for consent dialog');
            return false;
        }

        return new Promise((resolve) => {
            const requestId = Date.now().toString();

            // Send consent request to renderer
            mainWindow.webContents.send('show-mcp-consent-dialog', {
                toolName,
                args,
                requestId,
            });

            // Listen for the response
            const handleResponse = (_event: any, response: { requestId: string; approved: boolean }) => {
                if (response.requestId === requestId) {
                    ipcMain.removeListener('mcp-consent-response', handleResponse);
                    resolve(response.approved);
                }
            };

            ipcMain.on('mcp-consent-response', handleResponse);

            // Set a timeout to avoid hanging indefinitely
            setTimeout(() => {
                ipcMain.removeListener('mcp-consent-response', handleResponse);
                console.warn(`Timeout waiting for consent for tool: ${toolName}`);
                resolve(false);
            }, 60000); // 1 minute timeout
        });
    } catch (error) {
        console.error('Failed to request tool consent:', error);
        // Default to denying consent if there's an error
        return false;
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
        if (!(key in systemFunctions)) {
            delete mcpFunctions[key];
        }
    });

    if (!config?.mcpServers) {
        return;
    }

    for (const [name, connection] of Object.entries(config?.mcpServers ?? {})) {
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
