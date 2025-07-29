import { HardDriveUpload, Loader2Icon, Trash, Unplug } from 'lucide-react';
import React, { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from '@/App/components/app-sidebar';
import { NavActions } from '@/App/components/nav-actions.tsx';
import { Button } from '@/components/ui/button.tsx';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useExternalState } from '@/hooks/useExternalState.ts';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';
import { llmState } from '@/state/llmState.ts';

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const state = useExternalState(llmState);
    const modelName = state.model?.name || 'No model loaded';

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

    const openSelectModelFileDialog = useCallback(async () => {
        await electronLlmRpc.selectModelFileAndLoad(true);
    }, []);

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
                                <SidebarTrigger className="-ml-1" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle sidebar</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {isOnChatRoute && (
                        <>
                            <div className="text-sm font-semibold">
                                {loading ? (
                                    'Loading...'
                                ) : isOnChatRoute ? (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="cursor-pointer"
                                        onClick={() => {
                                            openSelectModelFileDialog();
                                        }}
                                    >
                                        {modelName}
                                    </Button>
                                ) : (
                                    <span>{modelName}</span>
                                )}
                            </div>

                            {!loading && (
                                <>
                                    {isModelLoaded && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 ml-auto"
                                                    onClick={async () => {
                                                        await electronLlmRpc.unloadModel(true);
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
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={openSelectModelFileDialog}
                                            >
                                                <HardDriveUpload />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Load a model file</p>
                                        </TooltipContent>
                                    </Tooltip>
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
                                            className="h-7 w-7"
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
                </header>
                <div className="flex-1 h-full overflow-hidden flex flex-col">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
