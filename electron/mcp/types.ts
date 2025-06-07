export type MCPConnection = {
	name: string;
	transport: 'stdio' | 'streamable http';
	command: string;
	args: string; // "--flag --foo=bar"
	env: string; // "FOO=bar\nBAR=baz"
};
