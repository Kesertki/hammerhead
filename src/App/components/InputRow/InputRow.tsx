import classNames from 'classnames';
import { ArrowUp, CircleStop, Blocks } from 'lucide-react';
import { useCallback, useRef, useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TranscriptionResult, VoiceSettings } from '@/types';
import { DEFAULT_VOICE_SETTINGS } from '@/types';
import { useTranslation } from 'react-i18next';
import { Toggle } from '@/components/ui/toggle';
import { VoiceInput } from '../VoiceInput';

import './InputRow.css';

export function InputRow({
    disabled = false,
    stopGeneration,
    sendPrompt,
    generatingResult,
    autoSubmitVoice = true,
    voiceSettings = DEFAULT_VOICE_SETTINGS,
}: InputRowProps) {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState<string>('');
    const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const setInputValue = useCallback((value: string) => {
        if (inputRef.current != null) inputRef.current.value = value;

        setInputText(value);
    }, []);

    const resizeInput = useCallback(() => {
        if (inputRef.current == null) return;

        inputRef.current.style.height = '';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }, []);

    const submitPrompt = useCallback(() => {
        if (generatingResult || inputRef.current == null || isVoiceActive) return;

        const message = inputRef.current.value;
        if (message.length === 0) return;

        setInputValue('');
        resizeInput();
        sendPrompt(message);
    }, [setInputValue, generatingResult, resizeInput, sendPrompt, isVoiceActive]);

    const handleVoiceTranscriptionComplete = useCallback(
        (result: TranscriptionResult) => {
            if (result.text && inputRef.current) {
                // Add transcription text to the current input
                const currentValue = inputRef.current.value;
                const newValue = currentValue ? `${currentValue} ${result.text}` : result.text;
                setInputValue(newValue);
                resizeInput();

                // Focus the input after transcription
                inputRef.current.focus();

                // Auto-submit if enabled and not disabled/generating
                // Also check that we have meaningful text to submit
                if (autoSubmitVoice && !disabled && !generatingResult && result.text && result.text.trim().length > 0) {
                    // Use a small delay to ensure the input is updated
                    setTimeout(() => {
                        submitPrompt();
                    }, 100);
                }
            }
            setIsVoiceActive(false);
        },
        [setInputValue, resizeInput, autoSubmitVoice, disabled, generatingResult, submitPrompt]
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
    }, [resizeInput]);

    const onInputKeyDown = useCallback(
        (event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitPrompt();
            } else if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                resizeInput();
            }
        },
        [submitPrompt, setInputValue, resizeInput]
    );

    return (
        <div className="w-full p-3 md:p-4 bg-white">
            <div
                className={classNames(
                    'flex flex-row items-end justify-between w-full rounded-lg border border-gray-300 shadow-lg p-3 bg-white z-10 sticky bottom-4',
                    disabled && 'opacity-50'
                )}
            >
                <div className="inputContainer flex-1 text-left">
                    <textarea
                        ref={inputRef}
                        onInput={onInput}
                        onKeyDownCapture={onInputKeyDown}
                        className="input w-full border-none resize-none outline-none bg-transparent"
                        autoComplete="off"
                        spellCheck
                        disabled={disabled}
                        onScroll={resizeInput}
                        placeholder={t('message')}
                    />
                    <Tooltip>
                        <TooltipTrigger>
                            <Toggle disabled={disabled || generatingResult} className="cursor-pointer">
                                <Blocks />
                                {t('chat.tools')}
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{t('chat.tools_description')}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className={`transition duration-200 ${
                            generatingResult ? 'bg-black text-white hover:bg-black hover:text-white' : 'text-gray-300'
                        }`}
                        disabled={disabled || stopGeneration == null || !generatingResult}
                        onClick={stopGeneration}
                        style={{
                            visibility: generatingResult ? 'visible' : 'hidden',
                        }}
                    >
                        <CircleStop />
                    </Button>

                    {/* Voice Input Component - only show if enabled */}
                    {voiceSettings.enabled && (
                        <VoiceInput
                            onTranscriptionComplete={handleVoiceTranscriptionComplete}
                            onTranscriptionError={handleVoiceTranscriptionError}
                            onStateChange={handleVoiceStateChange}
                            disabled={disabled || generatingResult}
                            language={voiceSettings.language}
                            model={voiceSettings.model}
                        />
                    )}

                    <Button
                        variant="outline"
                        size="icon"
                        className={`transition duration-200 ${
                            inputText.trim() === '' || disabled || generatingResult || isVoiceActive
                                ? 'text-gray-300'
                                : 'bg-black text-white hover:bg-black hover:text-white'
                        }`}
                        disabled={disabled || inputText === '' || generatingResult || isVoiceActive}
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
    generatingResult: boolean;
    autoSubmitVoice?: boolean;
    voiceSettings?: VoiceSettings;
};
