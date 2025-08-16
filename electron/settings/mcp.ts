import { McpConfig } from '../mcp/types.ts';
import { store } from '../settings/store';
import { eventBus } from '../utils/eventBus.ts';

export async function getMcpConfig(): Promise<McpConfig | null> {
    try {
        const config = store.get('mcpConfig') as any;
        if (!config) {
            return null;
        }

        // Migration: handle legacy "servers" property
        if (config.servers && !config.mcpServers) {
            const migratedConfig = {
                ...config,
                mcpServers: config.servers,
            };
            delete migratedConfig.servers;

            // Save the migrated config
            store.set('mcpConfig', migratedConfig);
            eventBus.emit('mcp-config-changed', migratedConfig);

            return migratedConfig;
        }

        return config;
    } catch {
        return null;
    }
}

export async function setMcpConfig(config: any) {
    store.set('mcpConfig', config);
    eventBus.emit('mcp-config-changed', config);
}
