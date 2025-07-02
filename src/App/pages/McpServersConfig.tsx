import Editor, { loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useRef } from 'react';
import mcpSchema from '../../schemas/mcp-config.schema.json';

// Set up Monaco environment for Electron before loader config
(self as any).MonacoEnvironment = {
	getWorkerUrl: function (moduleId: string, label: string) {
		// All workers should use the main worker file
		return './monaco-editor/vs/base/worker/workerMain.js';
	}
};

// Configure Monaco Editor to use local files
loader.config({
	paths: { vs: './monaco-editor/vs' }
});

const defaultMcpConfig = `{
  "servers": {
    
  }
}`;

export default function McpServersConfig() {
	const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof Monaco | null>(null);

	function handleEditorChange(
		value: string | undefined,
		event: Monaco.editor.IModelContentChangedEvent
	) {
		// here is the current value
	}

	function handleEditorDidMount(
		editor: Monaco.editor.IStandaloneCodeEditor,
		monaco: typeof Monaco
	) {
		console.log('onMount: the editor instance:', editor);
		console.log('onMount: the monaco instance:', monaco);
		editorRef.current = editor;
		monacoRef.current = monaco;
	}

	function handleEditorWillMount(monaco: typeof Monaco) {
		console.log('beforeMount: the monaco instance:', monaco);

		// Configure JSON language features for MCP server configurations
		monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			allowComments: true,
			schemaValidation: 'error',
			schemas: [
				{
					uri: 'http://mcp-schema.local/config.json',
					fileMatch: ['*'],
					schema: mcpSchema
				}
			]
		});
	}

	function handleEditorValidation(markers: Monaco.editor.IMarker[]) {
		// model markers
		// markers.forEach(marker => console.log('onValidate:', marker.message));
	}

	return (
		<div className="w-full h-full">
			<Editor
				height="90vh"
				width="100%"
				defaultLanguage="json"
				defaultValue={defaultMcpConfig}
				onChange={handleEditorChange}
				onMount={handleEditorDidMount}
				beforeMount={handleEditorWillMount}
				onValidate={handleEditorValidation}
				options={{
					// Additional options for better offline experience
					automaticLayout: true,
					minimap: { enabled: false },
					scrollBeyondLastLine: false,
					wordWrap: 'on',
					formatOnPaste: true,
					formatOnType: true
				}}
			/>
		</div>
	);
}
