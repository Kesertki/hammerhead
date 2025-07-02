import Editor from '@monaco-editor/react';
import { useRef } from 'react';

export default function McpServersConfig() {
	const editorRef = useRef(null);
	const monacoRef = useRef(null);

	function handleEditorChange(value, event) {
		// here is the current value
	}

	function handleEditorDidMount(editor, monaco) {
		console.log('onMount: the editor instance:', editor);
		console.log('onMount: the monaco instance:', monaco);
		editorRef.current = editor;
		monacoRef.current = monaco;
	}

	function handleEditorWillMount(monaco) {
		console.log('beforeMount: the monaco instance:', monaco);
		// here is the monaco instance
		// do something before editor is mounted
		// monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
	}

	function handleEditorValidation(markers) {
		// model markers
		// markers.forEach(marker => console.log('onValidate:', marker.message));
	}

	return (
		<div className="w-full h-full">
			<Editor
				height="90vh"
				width="100%"
				defaultLanguage="json"
				defaultValue='{ "servers": {} }'
				onChange={handleEditorChange}
				onMount={handleEditorDidMount}
				beforeMount={handleEditorWillMount}
				onValidate={handleEditorValidation}
			/>
		</div>
	);
}
