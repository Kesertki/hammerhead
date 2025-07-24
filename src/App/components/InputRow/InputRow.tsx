import classNames from 'classnames';
import { ArrowUp, CircleStop } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import type { TranscriptionResult, VoiceSettings } from '@/types';
import { VoiceInput } from '../VoiceInput';

import './InputRow.css';

export function InputRow({
	disabled = false,
	stopGeneration,
	sendPrompt,
	onPromptInput,
	autocompleteInputDraft,
	autocompleteCompletion,
	generatingResult,
	autoSubmitVoice = true,
	voiceSettings = { model: 'tiny', language: '' }
}: InputRowProps) {
	const [inputText, setInputText] = useState<string>('');
	const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const autocompleteRef = useRef<HTMLDivElement>(null);
	const autocompleteCurrentTextRef = useRef<HTMLDivElement>(null);

	const autocompleteText = useMemo(() => {
		const fullText =
			(autocompleteInputDraft ?? '') + (autocompleteCompletion ?? '');
		if (fullText.startsWith(inputText))
			return fullText.slice(inputText.length);

		return '';
	}, [inputText, autocompleteInputDraft, autocompleteCompletion]);

	const setInputValue = useCallback((value: string) => {
		if (inputRef.current != null) inputRef.current.value = value;

		if (autocompleteCurrentTextRef.current != null)
			autocompleteCurrentTextRef.current.innerText = value;

		setInputText(value);
	}, []);

	const resizeInput = useCallback(() => {
		if (inputRef.current == null) return;

		inputRef.current.style.height = '';
		inputRef.current.style.height = inputRef.current.scrollHeight + 'px';

		if (autocompleteRef.current != null) {
			autocompleteRef.current.scrollTop = inputRef.current.scrollTop;
		}
	}, []);

	const submitPrompt = useCallback(() => {
		if (generatingResult || inputRef.current == null || isVoiceActive)
			return;

		const message = inputRef.current.value;
		if (message.length === 0) return;

		setInputValue('');
		resizeInput();
		onPromptInput?.('');
		sendPrompt(message);
	}, [
		setInputValue,
		generatingResult,
		resizeInput,
		sendPrompt,
		onPromptInput,
		isVoiceActive
	]);

	const handleVoiceTranscriptionComplete = useCallback(
		(result: TranscriptionResult) => {
			if (result.text && inputRef.current) {
				// Add transcription text to the current input
				const currentValue = inputRef.current.value;
				const newValue = currentValue
					? `${currentValue} ${result.text}`
					: result.text;
				setInputValue(newValue);
				resizeInput();
				onPromptInput?.(newValue);

				// Focus the input after transcription
				inputRef.current.focus();

				// Auto-submit if enabled and not disabled/generating
				// Also check that we have meaningful text to submit
				if (
					autoSubmitVoice &&
					!disabled &&
					!generatingResult &&
					result.text &&
					result.text.trim().length > 0
				) {
					// Use a small delay to ensure the input is updated
					setTimeout(() => {
						submitPrompt();
					}, 100);
				}
			}
			setIsVoiceActive(false);
		},
		[
			setInputValue,
			resizeInput,
			onPromptInput,
			autoSubmitVoice,
			disabled,
			generatingResult,
			submitPrompt
		]
	);

	const handleVoiceTranscriptionError = useCallback((error: Error) => {
		console.error('Voice transcription error:', error);
		setIsVoiceActive(false);
	}, []);

	const handleVoiceStateChange = useCallback((isActive: boolean) => {
		setIsVoiceActive(isActive);
	}, []);

	const onInput = useCallback(() => {
		setInputText(inputRef.current?.value ?? '');
		resizeInput();

		if (
			autocompleteCurrentTextRef.current != null &&
			inputRef.current != null
		)
			autocompleteCurrentTextRef.current.innerText =
				inputRef.current?.value;

		if (inputRef.current != null && onPromptInput != null)
			onPromptInput(inputRef.current?.value);
	}, [resizeInput, onPromptInput]);

	const onInputKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				submitPrompt();
			} else if (
				event.key === 'Tab' &&
				!event.shiftKey &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.altKey
			) {
				event.preventDefault();
				if (inputRef.current != null && autocompleteText !== '') {
					const newlineIndex = autocompleteText.indexOf('\n');
					const textToAccept =
						newlineIndex <= 0
							? autocompleteText
							: autocompleteText.slice(0, newlineIndex);

					setInputValue(inputRef.current.value + textToAccept);
					inputRef.current.scrollTop = inputRef.current.scrollHeight;
					onPromptInput?.(inputRef.current.value);
				}

				resizeInput();
			}
		},
		[
			submitPrompt,
			setInputValue,
			onPromptInput,
			resizeInput,
			autocompleteText
		]
	);

	const previewAutocompleteText = useMemo(() => {
		const lines = autocompleteText.split('\n');
		if (lines.length <= 1 || lines[1]!.trim() === '') return lines[0]!;

		return autocompleteText;
	}, [autocompleteText]);

	return (
		<div className="w-full p-3 md:p-4 bg-white">
			<div
				className={classNames(
					'flex flex-row items-end justify-between w-full rounded-lg border border-gray-300 shadow-lg p-3 bg-white z-10 sticky bottom-4',
					disabled && 'opacity-50'
				)}
			>
				<div className="inputContainer flex-1">
					<textarea
						ref={inputRef}
						onInput={onInput}
						onKeyDownCapture={onInputKeyDown}
						className="input w-full border-none resize-none outline-none bg-transparent"
						autoComplete="off"
						spellCheck
						disabled={disabled}
						onScroll={resizeInput}
						placeholder={autocompleteText === '' ? 'Message' : ''}
					/>
					<div className="autocomplete" ref={autocompleteRef}>
						<div
							className={classNames(
								'content',
								autocompleteText === '' && 'hide'
							)}
						>
							<div
								className="currentText"
								ref={autocompleteCurrentTextRef}
							/>
							<div className="completion">
								{previewAutocompleteText}
							</div>
							<div className="pressTab">Tab</div>
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="icon"
						className={`transition duration-200 ${
							generatingResult
								? 'bg-black text-white hover:bg-black hover:text-white'
								: 'text-gray-300'
						}`}
						disabled={
							disabled ||
							stopGeneration == null ||
							!generatingResult
						}
						onClick={stopGeneration}
						style={{
							visibility: generatingResult ? 'visible' : 'hidden'
						}}
					>
						<CircleStop />
					</Button>

					{/* Voice Input Component */}
					<VoiceInput
						onTranscriptionComplete={
							handleVoiceTranscriptionComplete
						}
						onTranscriptionError={handleVoiceTranscriptionError}
						onStateChange={handleVoiceStateChange}
						disabled={disabled || generatingResult}
						language={voiceSettings.language}
						model={voiceSettings.model}
					/>

					<Button
						variant="outline"
						size="icon"
						className={`transition duration-200 ${
							inputText.trim() === '' ||
							disabled ||
							generatingResult ||
							isVoiceActive
								? 'text-gray-300'
								: 'bg-black text-white hover:bg-black hover:text-white'
						}`}
						disabled={
							disabled ||
							inputText === '' ||
							generatingResult ||
							isVoiceActive
						}
						onClick={submitPrompt}
					>
						<ArrowUp size={24} />
					</Button>
				</div>
			</div>
		</div>
	);
}

type InputRowProps = {
	disabled?: boolean;
	stopGeneration?(): void;
	sendPrompt(prompt: string): void;
	onPromptInput?(currentText: string): void;
	autocompleteInputDraft?: string;
	autocompleteCompletion?: string;
	generatingResult: boolean;
	autoSubmitVoice?: boolean;
	voiceSettings?: VoiceSettings;
};
