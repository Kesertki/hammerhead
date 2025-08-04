import { Loader2Icon, Search, Trash, Unplug } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from '@/App/components/AppSidebar';
import { NavActions } from '@/App/components/NavActions';
import { Button } from '@/components/ui/button.tsx';
import { ModelSelector } from '@/components/ModelSelector';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useExternalState } from '@/hooks/useExternalState.ts';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';
import { electronModelRpc } from '@/rpc/modelRpc.ts';
import { llmState } from '@/state/llmState.ts';
import type { ModelInfo } from '@/types';

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const state = useExternalState(llmState);
    const modelName = state.model?.name || 'No model loaded';

    // State for downloaded models combobox
    const [downloadedModels, setDownloadedModels] = useState<ModelInfo[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');

    // console.log(state);

    const loading =
        state.selectedModelFilePath != null &&
        // error == null &&
        (!state.model.loaded ||
            !state.llama.loaded ||
            !state.context.loaded ||
            !state.contextSequence.loaded ||
            !state.chatSession.loaded);

    const isModelLoaded = state.selectedModelFilePath != null && !loading && state.model.loaded;

    const isEmptyChat = state.chatSession.simplifiedChat.length === 0;

    // Check if we're on the chat route (assistant page)
    const isOnChatRoute = location.pathname === '/';

    // Check if we're on the models page
    const isOnModelsRoute = location.pathname === '/models';

    // Load downloaded models when component mounts
    useEffect(() => {
        if (isOnChatRoute) {
            loadDownloadedModels();
        }
    }, [isOnChatRoute]);

    // Sync selected model with currently loaded model
    useEffect(() => {
        if (state.selectedModelFilePath && downloadedModels.length > 0) {
            const currentModel = downloadedModels.find((model) => {
                // Check if the current loaded model path ends with the model's relative path
                return state.selectedModelFilePath?.endsWith(model.filePath);
            });
            if (currentModel && selectedModel !== currentModel.id) {
                setSelectedModel(currentModel.id);
            }
        }
    }, [state.selectedModelFilePath, downloadedModels, selectedModel]);

    const loadDownloadedModels = async () => {
        try {
            const models = await electronModelRpc.listDownloadedModels();
            setDownloadedModels(models);
        } catch (error) {
            console.error('Failed to load downloaded models:', error);
        }
    };

    const loadDownloadedModel = async (modelInfo: ModelInfo) => {
        try {
            // Get the absolute path for the model
            const absolutePath = await electronModelRpc.getModelAbsolutePath(modelInfo.id);
            if (!absolutePath) {
                console.error('Could not get absolute path for model:', modelInfo.id);
                return;
            }

            console.log('Loading downloaded model:', modelInfo.title, 'from path:', absolutePath);

            // Load the model using the modified selectModelFileAndLoad method
            await electronLlmRpc.selectModelFileAndLoad(true, absolutePath); // preserve chat, use file path

            setSelectedModel(modelInfo.id);
        } catch (error) {
            console.error('Failed to load downloaded model:', error);
            console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        }
    };

    const openSelectModelFileDialog = useCallback(async () => {
        await electronLlmRpc.selectModelFileAndLoad(true);
        // Refresh downloaded models list after loading
        if (isOnChatRoute) {
            loadDownloadedModels();
        }
    }, [isOnChatRoute]);

    const resetChatHistory = useCallback(() => {
        void electronLlmRpc.stopActivePrompt();
        void electronLlmRpc.clearChat();
    }, []);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col overflow-hidden h-[calc(100vh-20px)]">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SidebarTrigger className="-ml-1 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle sidebar</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {isOnChatRoute && (
                        <>
                            <ModelSelector
                                models={downloadedModels}
                                selectedModelId={selectedModel}
                                fallbackName={modelName}
                                loading={loading}
                                onModelSelect={loadDownloadedModel}
                                onBrowseFiles={openSelectModelFileDialog}
                            />

                            {!loading && (
                                <>
                                    {isModelLoaded && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="cursor-pointer"
                                                    onClick={async () => {
                                                        await electronLlmRpc.unloadModel(true);
                                                        // Reset selected model when unloading
                                                        setSelectedModel('');
                                                    }}
                                                >
                                                    <Unplug />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Unload model</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </>
                            )}

                            {loading && (
                                <div className="ml-auto">
                                    <Loader2Icon className="animate-spin" />
                                </div>
                            )}

                            {/* Clear chat history button */}
                            {!isEmptyChat && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="cursor-pointer"
                                            onClick={resetChatHistory}
                                        >
                                            <Trash />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Clear chat history</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            <NavActions />
                        </>
                    )}

                    {isOnModelsRoute && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="cursor-pointer gap-2" asChild>
                                    <a
                                        target="_blank"
                                        href="https://huggingface.co/models?pipeline_tag=text-generation&library=gguf&sort=trending"
                                        rel="noopener noreferrer"
                                    >
                                        <Search className="h-4 w-4" />
                                        Find more models
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Browse HuggingFace for more GGUF models</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </header>
                <div className="flex-1 h-full overflow-hidden flex flex-col">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
