import { HardDriveUpload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useExternalState } from '../hooks/useExternalState.ts';
import { electronLlmRpc } from '../rpc/llmRpc.ts';
import { llmState } from '../state/llmState.ts';
import type { VoiceSettings } from '../types';
import { ChatHistory } from './components/ChatHistory/ChatHistory.tsx';
import { InputRow } from './components/InputRow/InputRow.tsx';

import './Chat.css';

export function ModelPicker() {
	return (
		<div className="loadModel">
			<div className="hint">
				Click the <HardDriveUpload className="inline-block" /> button
				above to load a model
			</div>
		</div>
	);
}

export function Chat() {
	const state = useExternalState(llmState);
	const { generatingResult } = state.chatSession;

	// Create a ref for the chat container
	const chatHistoryRef = useRef<HTMLDivElement>(null);
	const [isUserScrolling, setIsUserScrolling] = useState(false);
	const userScrollTimeoutRef = useRef<number | undefined>(undefined);
	const lastScrollHeightRef = useRef<number>(0);
	const wasAtBottomRef = useRef<boolean>(true);

	// Voice settings state
	const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
		model: 'tiny',
		language: ''
	});

	// Load voice settings on component mount
	useEffect(() => {
		loadVoiceSettings();
	}, []);

	const loadVoiceSettings = async () => {
		try {
			console.log('Loading voice settings...');
			const settings = await window.electronAPI.getVoiceSettings();
			if (settings) {
				setVoiceSettings(settings);
			}
		} catch (error) {
			console.error('Error loading voice settings:', error);
			// Use default settings if loading fails
		}
	};
	const scrollLockTimeoutRef = useRef<number | undefined>(undefined);

	// Simple function to scroll to bottom
	const scrollToBottom = useCallback(() => {
		if (isUserScrolling || !chatHistoryRef.current) return;

		const container = chatHistoryRef.current;
		container.scrollTop = container.scrollHeight;
		lastScrollHeightRef.current = container.scrollHeight;
		wasAtBottomRef.current = true;
	}, [isUserScrolling]);

	// Track user scrolling behavior
	useEffect(() => {
		const container = chatHistoryRef.current;
		if (!container) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

			// Check if scroll height changed (content was added)
			const contentChanged = scrollHeight !== lastScrollHeightRef.current;
			lastScrollHeightRef.current = scrollHeight;

			if (contentChanged && wasAtBottomRef.current && generatingResult) {
				// Content was added while we were at bottom during generation
				// This is not user scrolling, just content expansion
				wasAtBottomRef.current = isAtBottom;
				return;
			}

			// If user scrolled up from bottom position
			if (wasAtBottomRef.current && !isAtBottom && !contentChanged) {
				// Clear any existing timeout
				if (userScrollTimeoutRef.current) {
					clearTimeout(userScrollTimeoutRef.current);
				}
				if (scrollLockTimeoutRef.current) {
					clearTimeout(scrollLockTimeoutRef.current);
				}

				setIsUserScrolling(true);
				wasAtBottomRef.current = false;

				// Set a lock timeout to prevent immediate re-enabling
				scrollLockTimeoutRef.current = window.setTimeout(() => {
					// Check if user is back at bottom after the delay
					const {
						scrollTop: currentScrollTop,
						scrollHeight: currentScrollHeight,
						clientHeight: currentClientHeight
					} = container;
					const backAtBottom =
						currentScrollHeight -
							currentScrollTop -
							currentClientHeight <
						10;

					if (backAtBottom) {
						setIsUserScrolling(false);
						wasAtBottomRef.current = true;
					}
				}, 1500); // 1.5 second delay
			} else if (!wasAtBottomRef.current && isAtBottom) {
				// User scrolled back to bottom
				if (userScrollTimeoutRef.current) {
					clearTimeout(userScrollTimeoutRef.current);
				}
				if (scrollLockTimeoutRef.current) {
					clearTimeout(scrollLockTimeoutRef.current);
				}

				setIsUserScrolling(false);
				wasAtBottomRef.current = true;
			}
		};

		container.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			container.removeEventListener('scroll', handleScroll);
			if (userScrollTimeoutRef.current) {
				clearTimeout(userScrollTimeoutRef.current);
			}
			if (scrollLockTimeoutRef.current) {
				clearTimeout(scrollLockTimeoutRef.current);
			}
		};
	}, [generatingResult]);

	// Auto-scroll during generation
	useEffect(() => {
		if (!generatingResult || isUserScrolling) return;

		const intervalId = setInterval(() => {
			scrollToBottom();
		}, 150); // Slightly reduced frequency

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
		(state.selectedModelFilePath == null &&
			state.chatSession.simplifiedChat.length === 0) ||
		error != null;

	return (
		<div id="app-container">
			<div className="app">
				{showMessage && (
					<div className="message">
						{error != null && (
							<div className="error">{String(error)}</div>
						)}
						{loading && <div className="loading">Loading...</div>}
						{(state.selectedModelFilePath == null ||
							state.llama.error != null) && <ModelPicker />}
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
						className="mb-8"
						simplifiedChat={state.chatSession.simplifiedChat}
						generatingResult={generatingResult}
						ref={chatHistoryRef}
					/>
				)}
				<InputRow
					disabled={
						!state.model.loaded || !state.contextSequence.loaded
					}
					stopGeneration={
						generatingResult ? stopActivePrompt : undefined
					}
					sendPrompt={sendPrompt}
					generatingResult={generatingResult}
					voiceSettings={voiceSettings}
				/>
				{state.chatSession.sessionTokenStats && (
					<span className="text-xs text-muted-foreground mt-2">
						{state.chatSession.sessionTokenStats?.totalInputTokens}{' '}
						input tokens,{' '}
						{state.chatSession.sessionTokenStats?.totalOutputTokens}{' '}
						output tokens,{' '}
						{state.chatSession.sessionTokenStats?.totalTokens} total
						tokens
					</span>
				)}
			</div>
		</div>
	);
}
