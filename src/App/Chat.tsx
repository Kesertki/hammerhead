import { Download, Search } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useExternalState } from '../hooks/useExternalState.ts';
import { electronLlmRpc } from '../rpc/llmRpc.ts';
import { llmState } from '../state/llmState.ts';
import { ChatHistory } from './components/ChatHistory/ChatHistory.tsx';
import { InputRow } from './components/InputRow/InputRow.tsx';

import './Chat.css';

export function Chat() {
	const state = useExternalState(llmState);
	const { generatingResult } = state.chatSession;

	// Create a ref for the chat container
	const chatHistoryRef = useRef<HTMLDivElement>(null);

	// Function to scroll to the bottom of the chat
	const scrollToBottom = useCallback(() => {
		if (chatHistoryRef.current) {
			const container = chatHistoryRef.current;
			container.scrollTop = container.scrollHeight;
		}
	}, []);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		if (state.chatSession.simplifiedChat.length > 0) {
			// Small delay to ensure content is rendered
			setTimeout(scrollToBottom, 50);
		}
	}, [state.chatSession.simplifiedChat.length, scrollToBottom]);

	// Scroll to bottom when a message is being generated
	useEffect(() => {
		let intervalId: number | undefined;

		if (generatingResult) {
			// During generation, check scroll position frequently
			intervalId = window.setInterval(scrollToBottom, 100);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [generatingResult, scrollToBottom]);

	// Initial scroll when component mounts
	useEffect(() => {
		setTimeout(scrollToBottom, 100);
	}, [scrollToBottom]);

	const stopActivePrompt = useCallback(() => {
		void electronLlmRpc.stopActivePrompt();
	}, []);

	const sendPrompt = useCallback(
		(prompt: string) => {
			if (generatingResult) return;

			scrollToBottom();
			void electronLlmRpc.prompt(prompt);
		},
		[generatingResult, scrollToBottom]
	);

	const onPromptInput = useCallback((currentText: string) => {
		void electronLlmRpc.setDraftPrompt(currentText);
	}, []);

	const error =
		state.llama.error ??
		state.model.error ??
		state.context.error ??
		state.contextSequence.error;
	const loading =
		state.selectedModelFilePath != null &&
		error == null &&
		(!state.model.loaded ||
			!state.llama.loaded ||
			!state.context.loaded ||
			!state.contextSequence.loaded ||
			!state.chatSession.loaded);
	const showMessage =
		state.selectedModelFilePath == null ||
		error != null ||
		state.chatSession.simplifiedChat.length === 0;

	return (
		<div id="app-container">
			<div className="app">
				{showMessage && (
					<div className="message">
						{error != null && <div className="error">{String(error)}</div>}
						{loading && <div className="loading">Loading...</div>}
						{(state.selectedModelFilePath == null ||
							state.llama.error != null) && (
							<div className="loadModel">
								<div className="hint">
									Click the button above to load a model
								</div>
								<div className="actions">
									<div className="title">DeepSeek R1 Distill Qwen model</div>
									<div className="links">
										<a
											target="_blank"
											href="https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B.Q4_K_M.gguf"
										>
											<Download />
											<div className="text">Get 7B</div>
										</a>
										<div className="separator" />
										<a
											target="_blank"
											href="https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-14B.Q4_K_M.gguf"
										>
											<Download />
											<div className="text">Get 14B</div>
										</a>
										<div className="separator" />
										<a
											target="_blank"
											href="https://huggingface.co/mradermacher/DeepSeek-R1-Distill-Qwen-32B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-32B.Q4_K_M.gguf"
										>
											<Download />
											<div className="text">Get 32B</div>
										</a>
									</div>

									<div className="separator"></div>
									<div className="title">Other models</div>
									<div className="links">
										<a
											target="_blank"
											href="https://huggingface.co/mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf"
										>
											<Download />
											<div className="text">Get Llama 3.1 8B</div>
										</a>
										<div className="separator" />
										<a
											target="_blank"
											href="https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf"
										>
											<Download />
											<div className="text">Get Gemma 2 2B</div>
										</a>
									</div>

									<div className="separator"></div>
									<a
										className="browseLink"
										target="_blank"
										href="https://huggingface.co/models?pipeline_tag=text-generation&library=gguf&sort=trending"
									>
										<Search />
										<div className="text">Find more models</div>
									</a>
								</div>
							</div>
						)}
						{!loading &&
							state.selectedModelFilePath != null &&
							error == null &&
							state.chatSession.simplifiedChat.length === 0 && (
								<div className="typeMessage">
									Type a message to start the conversation
								</div>
							)}
					</div>
				)}
				{!showMessage && (
					<ChatHistory
						className="chatHistory"
						simplifiedChat={state.chatSession.simplifiedChat}
						generatingResult={generatingResult}
						ref={chatHistoryRef}
					/>
				)}
				<InputRow
					disabled={!state.model.loaded || !state.contextSequence.loaded}
					stopGeneration={generatingResult ? stopActivePrompt : undefined}
					onPromptInput={onPromptInput}
					sendPrompt={sendPrompt}
					generatingResult={generatingResult}
					autocompleteInputDraft={state.chatSession.draftPrompt.prompt}
					autocompleteCompletion={state.chatSession.draftPrompt.completion}
				/>
			</div>
		</div>
	);
}
