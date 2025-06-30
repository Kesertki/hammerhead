import { Download, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
	const [isUserScrolling, setIsUserScrolling] = useState(false);
	const userScrollTimeoutRef = useRef<number | undefined>(undefined);

	// Simple function to scroll to bottom
	const scrollToBottom = useCallback(() => {
		if (isUserScrolling || !chatHistoryRef.current) return;

		const container = chatHistoryRef.current;
		container.scrollTop = container.scrollHeight;
	}, [isUserScrolling]);

	// Track user scrolling behavior with timeout
	useEffect(() => {
		const container = chatHistoryRef.current;
		if (!container) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

			if (!isAtBottom) {
				// User is scrolling up - immediately disable auto-scroll
				setIsUserScrolling(true);

				// Clear any existing timeout
				if (userScrollTimeoutRef.current) {
					clearTimeout(userScrollTimeoutRef.current);
				}

				// Set a timeout to check if user has stopped scrolling
				userScrollTimeoutRef.current = window.setTimeout(() => {
					// After user stops scrolling, check if they're at bottom
					const {
						scrollTop: newScrollTop,
						scrollHeight: newScrollHeight,
						clientHeight: newClientHeight
					} = container;
					const stillAtBottom =
						newScrollHeight - newScrollTop - newClientHeight < 10;
					if (stillAtBottom) {
						setIsUserScrolling(false);
					}
				}, 500); // Wait 500ms after user stops scrolling
			}
		};

		container.addEventListener('scroll', handleScroll);

		return () => {
			container.removeEventListener('scroll', handleScroll);
			if (userScrollTimeoutRef.current) {
				clearTimeout(userScrollTimeoutRef.current);
			}
		};
	}, []);

	// Auto-scroll during generation
	useEffect(() => {
		if (!generatingResult || isUserScrolling) return;

		const intervalId = setInterval(() => {
			scrollToBottom();
		}, 100);

		return () => clearInterval(intervalId);
	}, [generatingResult, isUserScrolling, scrollToBottom]);

	// Auto-scroll on new messages (when not generating)
	useEffect(() => {
		if (
			state.chatSession.simplifiedChat.length > 0 &&
			!generatingResult &&
			!isUserScrolling
		) {
			setTimeout(scrollToBottom, 50);
		}
	}, [
		state.chatSession.simplifiedChat.length,
		generatingResult,
		isUserScrolling,
		scrollToBottom
	]);

	// Initial scroll on mount
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
