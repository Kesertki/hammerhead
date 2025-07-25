import { HardDriveUpload, Loader2Icon, Trash } from 'lucide-react';
import React, { useCallback } from 'react';
import { AppSidebar } from '@/App/components/app-sidebar';
import { NavActions } from '@/App/components/nav-actions.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger
} from '@/components/ui/sidebar';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '@/components/ui/tooltip.tsx';
import { useExternalState } from '@/hooks/useExternalState.ts';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';
import { llmState } from '@/state/llmState.ts';

export default function Layout({ children }: { children: React.ReactNode }) {
	const state = useExternalState(llmState);
	const modelName = state.model?.name || 'No model loaded';

	const loading =
		state.selectedModelFilePath != null &&
		// error == null &&
		(!state.model.loaded ||
			!state.llama.loaded ||
			!state.context.loaded ||
			!state.contextSequence.loaded ||
			!state.chatSession.loaded);

	const isEmptyChat =
		state.selectedModelFilePath == null ||
		state.chatSession.simplifiedChat.length === 0;

	const openSelectModelFileDialog = useCallback(async () => {
		await electronLlmRpc.selectModelFileAndLoad();
	}, []);

	const resetChatHistory = useCallback(() => {
		void electronLlmRpc.stopActivePrompt();
		void electronLlmRpc.resetChatHistory();
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

					<div className="text-sm font-semibold">
						{loading ? 'Loading...' : modelName}
					</div>

					{!loading && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={openSelectModelFileDialog}
						>
							<HardDriveUpload />
						</Button>
					)}
					{loading && (
						<div className="ml-auto">
							<Loader2Icon className="animate-spin" />
						</div>
					)}

					{/* Clear chat history button */}
					{!isEmptyChat && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={resetChatHistory}
						>
							<Trash />
						</Button>
					)}

					{/* <div>
						{state.model?.loadProgress !== undefined
							? state.model.loadProgress * 100
							: ''}
					</div> */}
					{/*<div className="ml-auto px-3">*/}
					<NavActions />
					{/*</div>*/}
				</header>
				<div className="flex-1 h-full overflow-hidden">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
