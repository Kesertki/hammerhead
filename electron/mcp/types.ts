export interface McpConfig {
    inputs?: Array<{
        type: string;
        id: string;
        description: string;
        password?: boolean;
    }>;
    servers: {
        [key: string]: {
            disabled?: boolean;
            type?: 'stdio' | 'sse';
            command?: string;
            args?: string[];
            env?: { [key: string]: string };
            cwd?: string;
            url?: string;
            headers?: { [key: string]: string };
        };
    };
}
