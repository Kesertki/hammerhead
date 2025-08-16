import Editor, { loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import mcpSchema from '../../schemas/mcp-config.schema.json';
import { eventBus } from '@/utils/eventBus.ts';

// Set up Monaco environment for Electron before loader config
(self as any).MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: string, _label: string) {
        // All workers should use the main worker file
        return './monaco-editor/vs/base/worker/workerMain.js';
    },
};

// Configure Monaco Editor to use local files
loader.config({
    paths: { vs: './monaco-editor/vs' },
});

const defaultMcpConfig = `{
  "mcpServers": {}
}`;

interface McpConfig {
    inputs?: Array<{
        type: string;
        id: string;
        description: string;
        password?: boolean;
    }>;
    mcpServers: {
        [key: string]: {
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

export default function McpServersConfig() {
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof Monaco | null>(null);
    const [currentConfig, setCurrentConfig] = useState<string>(defaultMcpConfig);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Monaco.editor.IMarker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserEditing, setIsUserEditing] = useState(false);
    const [isProgrammaticChange, setIsProgrammaticChange] = useState(false);

    useEffect(() => {
        // Call loadConfig once on mount
        (async () => {
            try {
                setIsLoading(true);
                setIsUserEditing(false);
                setIsProgrammaticChange(true);
                const config = await window.electronAPI.getMCPConfig();
                if (config) {
                    const configString = JSON.stringify(config, null, 2);
                    setCurrentConfig(configString);
                    setHasUnsavedChanges(false);
                }
            } catch (error) {
                console.error('Error loading MCP config:', error);
                toast.error('Failed to load MCP configuration');
            } finally {
                setIsLoading(false);
                setTimeout(() => setIsProgrammaticChange(false), 100);
            }
        })();
    }, []);

    // Send state updates to the layout via event bus
    useEffect(() => {
        eventBus.emit('mcp:stateUpdate', {
            hasUnsavedChanges,
            validationErrors: validationErrors.length,
        });
    }, [hasUnsavedChanges, validationErrors]);

    // Update editor when currentConfig changes (after loading) - but not during user editing
    useEffect(() => {
        if (editorRef.current && !isLoading && !isUserEditing) {
            editorRef.current.setValue(currentConfig);
        }
    }, [currentConfig, isLoading, isUserEditing]);

    const loadConfig = useCallback(async () => {
        try {
            setIsLoading(true);
            setIsUserEditing(false);
            setIsProgrammaticChange(true); // Flag that we're making programmatic changes
            // Load the existing MCP config from Electron store
            const config = await window.electronAPI.getMCPConfig();
            if (config) {
                const configString = JSON.stringify(config, null, 2);
                setCurrentConfig(configString);
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            console.error('Error loading MCP config:', error);
            toast.error('Failed to load MCP configuration');
        } finally {
            setIsLoading(false);
            // Reset the flag after a brief delay to allow editor to update
            setTimeout(() => setIsProgrammaticChange(false), 100);
        }
    }, []);

    const saveConfig = useCallback(async () => {
        try {
            // Validate JSON syntax first
            let parsedConfig: McpConfig;

            try {
                parsedConfig = JSON.parse(currentConfig);
            } catch {
                toast.error('Invalid JSON syntax. Please fix the syntax errors before saving.');
                return;
            }

            // Check if there are schema validation errors
            if (validationErrors.length > 0) {
                const errorMessages = validationErrors.map((error) => error.message).join(', ');
                toast.error(`Schema validation errors: ${errorMessages}`);
                return;
            }

            // Save to Electron store
            await window.electronAPI.setMCPConfig(parsedConfig);
            setHasUnsavedChanges(false);
            toast.success('MCP configuration saved successfully');
        } catch (error) {
            console.error('Error saving MCP config:', error);
            toast.error('Failed to save MCP configuration');
        }
    }, [currentConfig, validationErrors]);

    const resetConfig = useCallback(() => {
        setIsUserEditing(false);
        setIsProgrammaticChange(true);
        setCurrentConfig(defaultMcpConfig);
        setHasUnsavedChanges(true);
        if (editorRef.current) {
            editorRef.current.setValue(defaultMcpConfig);
        }
        setTimeout(() => setIsProgrammaticChange(false), 100);
    }, []);

    const formatConfig = useCallback(() => {
        try {
            const parsed = JSON.parse(currentConfig);
            const formatted = JSON.stringify(parsed, null, 2);

            // Only update if the content actually changed
            if (formatted !== currentConfig) {
                setIsUserEditing(false);
                setIsProgrammaticChange(true);
                setCurrentConfig(formatted);
                if (editorRef.current) {
                    editorRef.current.setValue(formatted);
                }
                setTimeout(() => setIsProgrammaticChange(false), 100);
            }
        } catch {
            toast.error('Cannot format invalid JSON');
        }
    }, [currentConfig]);

    // Listen for action events from the layout
    useEffect(() => {
        const unsubscribe = eventBus.on<string>('mcp:action', (action) => {
            switch (action) {
                case 'save':
                    saveConfig();
                    break;
                case 'reload':
                    loadConfig();
                    break;
                case 'format':
                    formatConfig();
                    break;
                case 'reset':
                    resetConfig();
                    break;
            }
        });

        return unsubscribe;
    }, [saveConfig, loadConfig, formatConfig, resetConfig]);

    function handleEditorChange(value: string | undefined, _event: Monaco.editor.IModelContentChangedEvent) {
        // Ignore changes that are programmatic (loading, formatting, etc.)
        if (isProgrammaticChange || value === undefined) {
            return;
        }

        setIsUserEditing(true);
        setCurrentConfig(value);
        setHasUnsavedChanges(true);
    }

    function handleEditorDidMount(editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) {
        console.log('onMount: the editor instance:', editor);
        console.log('onMount: the monaco instance:', monaco);
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Add keyboard shortcut for save (Cmd+S / Ctrl+S)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // Trigger save action via event bus (same as clicking the save button)
            eventBus.emit('mcp:action', 'save');
        });

        // Set the current config value only if loading is complete
        if (!isLoading) {
            editor.setValue(currentConfig);
        }
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
                    schema: mcpSchema,
                },
            ],
        });
    }

    function handleEditorValidation(markers: Monaco.editor.IMarker[]) {
        setValidationErrors(markers);
        // Optional: log validation errors
        // markers.forEach(marker => console.log('Validation error:', marker.message));
    }

    return (
        <div className="h-full flex flex-col">
            {/* Monaco Editor */}
            <div className="flex-1 m-4 min-h-0">
                <Editor
                    height="100%"
                    width="100%"
                    defaultLanguage="json"
                    value={currentConfig}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    beforeMount={handleEditorWillMount}
                    onValidate={handleEditorValidation}
                    options={{
                        automaticLayout: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        formatOnType: true,
                        // theme: 'vs-dark' // Optional: dark theme
                    }}
                />
            </div>
        </div>
    );
}
