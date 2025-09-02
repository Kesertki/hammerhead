import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExternalState } from '../hooks/useExternalState.ts';
import { useChatStore, initializeChatStore } from '@/stores/chatStore.ts';
import { useTranslation } from 'react-i18next';
import { electronLlmRpc } from '../rpc/llmRpc.ts';
import { electronChatRpc } from '../rpc/chatRpc.ts';
import { llmState } from '../state/llmState.ts';
import type { VoiceSettings } from '../types';
import { DEFAULT_VOICE_SETTINGS } from '../types';
import { eventBus } from '../utils/eventBus.ts';
import { ChatHistory } from './components/ChatHistory/ChatHistory.tsx';
import { InputRow } from './components/InputRow/InputRow.tsx';
import { Welcome } from './components/Welcome';

import './Chat.css';

export function Chat() {
    const { t } = useTranslation();
    const state = useExternalState(llmState);
    const { generatingResult } = state.chatSession;
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();

    // Initialize store and get state with stable references
    initializeChatStore();
    const saveCurrentChat = useCallback(() => {
        return useChatStore.getState().saveCurrentChat();
    }, []);
    const updateCurrentChat = useCallback((chatId?: string) => {
        return useChatStore.getState().updateCurrentChat(chatId);
    }, []);

    // Create a ref for the chat container
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const userScrollTimeoutRef = useRef<number | undefined>(undefined);
    const lastScrollHeightRef = useRef<number>(0);
    const wasAtBottomRef = useRef<boolean>(true);
    const [selectedChatMessages, setSelectedChatMessages] = useState<any[]>([]);

    // Voice settings state
    const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

    // Track if we're in the middle of loading a chat to prevent auto-save during navigation
    const [isNavigating, setIsNavigating] = useState(false);
    const [lastAutoSaveMessageLength, setLastAutoSaveMessageLength] = useState(0);
    const [hasUserInteraction, setHasUserInteraction] = useState(false);
    const [preserveUserInteraction, setPreserveUserInteraction] = useState(false);
    const previousChatIdRef = useRef<string | undefined>(undefined);

    // Auto-save effect - save chat automatically when there are both user and model messages
    // Simple auto-save effect that doesn't cause infinite loops
    useEffect(() => {
        const chatMessages = state.chatSession.simplifiedChat;
        const messageLength = chatMessages.length;

        // Check if we're switching between chats (navigation)
        const isChangingChat = previousChatIdRef.current !== chatId;
        if (isChangingChat) {
            console.log('Chat: Detected chat navigation, setting navigation flag');
            setIsNavigating(true);
            setLastAutoSaveMessageLength(0); // Reset the last auto-save count

            // Only reset user interaction flag if we're not preserving it (not auto-navigation)
            if (!preserveUserInteraction) {
                setHasUserInteraction(false); // Reset user interaction flag
            } else {
                console.log('Chat: Preserving user interaction flag during auto-navigation');
                setPreserveUserInteraction(false); // Reset the preserve flag
            }

            previousChatIdRef.current = chatId;

            // Clear navigation flag after a delay to allow chat loading to complete
            setTimeout(() => {
                console.log('Chat: Clearing navigation flag');
                setIsNavigating(false);
                // Set the baseline message count after navigation completes
                setLastAutoSaveMessageLength(state.chatSession.simplifiedChat.length);
            }, 2000);

            return; // Don't auto-save during navigation
        }

        console.log('Chat: Auto-save effect triggered:', {
            chatId,
            generatingResult,
            isNavigating,
            hasUserInteraction,
            messageLength,
            lastAutoSaveMessageLength,
            'has userMessage': chatMessages.some((msg) => msg.type === 'user'),
            'has modelMessage': chatMessages.some((msg) => msg.type === 'model'),
        });

        // Don't auto-save during navigation, generation, or if no user interaction
        if (isNavigating || generatingResult || !hasUserInteraction) {
            console.log('Chat: Skipping auto-save - navigation, generation, or no user interaction');
            return;
        }

        // Only auto-save if the message count has actually increased since the last auto-save
        // This prevents auto-saving when just loading existing chats
        if (messageLength >= 2 && messageLength > lastAutoSaveMessageLength) {
            const userMessage = chatMessages.find((msg) => msg.type === 'user');
            const modelMessage = chatMessages.find((msg) => msg.type === 'model');

            if (userMessage && modelMessage) {
                console.log('Chat: Conditions met for auto-save/update, setting timeout...');
                // Debounced save/update to avoid too frequent calls
                const timeoutId = setTimeout(async () => {
                    if (!chatId) {
                        // New chat - save it
                        console.log('Chat: Auto-saving new chat...');
                        // Preserve user interaction flag for auto-navigation after save
                        setPreserveUserInteraction(true);
                        const savedChat = await saveCurrentChat();
                        if (savedChat) {
                            console.log('Chat: Auto-save successful, navigating to:', `/chats/${savedChat.id}`);
                            navigate(`/chats/${savedChat.id}`);
                        }
                    } else {
                        // Existing chat - update it
                        console.log('Chat: Auto-updating existing chat...');
                        const updatedChat = await updateCurrentChat(chatId);
                        if (updatedChat) {
                            console.log('Chat: Auto-update successful:', updatedChat.id);
                        }
                    }

                    // Update the last auto-save message count and reset user interaction flag
                    setLastAutoSaveMessageLength(messageLength);
                    setHasUserInteraction(false);
                }, 1500);

                return () => {
                    console.log('Chat: Cleaning up auto-save timeout');
                    clearTimeout(timeoutId);
                };
            } else {
                console.log('Chat: Missing user or model message, not auto-saving');
            }
        } else {
            console.log('Chat: Auto-save conditions not met - no new messages since last save');
        }

        // Default return for all other cases
        return undefined;
    }, [
        chatId,
        generatingResult,
        isNavigating,
        hasUserInteraction,
        state.chatSession.simplifiedChat.length,
        lastAutoSaveMessageLength,
        navigate,
    ]);

    // Load chat when component mounts with chatId
    useEffect(() => {
        if (chatId) {
            console.log('Chat: Component mounted with chatId:', chatId, 'loading chat...');
            const loadChatOnMount = async () => {
                try {
                    const success = await electronChatRpc.loadChat(chatId);
                    console.log('Chat: Loaded chat on mount, success:', success);
                } catch (error) {
                    console.error('Chat: Failed to load chat on mount:', error);
                }
            };
            loadChatOnMount();
        } else {
            console.log('Chat: Component mounted without chatId, starting new chat');
        }
    }, [chatId]);

    // Load chat messages directly when chat is selected but model not loaded
    useEffect(() => {
        console.log('Chat: loadSelectedChatMessages effect triggered with:', {
            chatId,
            'state.model.loaded': state.model.loaded,
            'state.chatSession.simplifiedChat.length': state.chatSession.simplifiedChat.length,
            'selectedChatMessages.length': selectedChatMessages.length,
        });

        const loadSelectedChatMessages = async () => {
            console.log('Chat: loadSelectedChatMessages check:', {
                chatId,
                modelLoaded: state.model.loaded,
                simplifiedChatLength: state.chatSession.simplifiedChat.length,
                selectedChatMessagesLength: selectedChatMessages.length,
            });

            if (chatId && !state.model.loaded && state.chatSession.simplifiedChat.length === 0) {
                console.log('Chat: Loading messages for selected chat without model:', chatId);
                try {
                    // Get chat from storage directly
                    const chat = await electronChatRpc.getChatById(chatId);
                    if (chat && chat.messages) {
                        console.log('Chat: Loaded', chat.messages.length, 'messages from storage');
                        console.log('Chat: All raw messages from storage:', JSON.stringify(chat.messages, null, 2));

                        // Use messages directly - they're already in the correct LLM state format!
                        // Just need to convert them to SimplifiedModelChatItem format for ChatHistory component
                        const simplifiedMessages: any[] = chat.messages
                            .filter((msg: any) => msg.type !== 'system') // Filter out system messages
                            .map((msg: any, index: number) => {
                                if (msg.type === 'user') {
                                    return {
                                        id: `user-${index}`,
                                        type: 'user',
                                        message: msg.text || msg.message || '',
                                    };
                                } else if (msg.type === 'model') {
                                    // Model messages use 'response' property which is an array
                                    // We need to convert this to 'message' array format expected by ChatHistory
                                    let messageArray = [];

                                    if (msg.response && Array.isArray(msg.response)) {
                                        // Convert response array to message segments
                                        messageArray = msg.response
                                            .filter((item: any) => item !== '') // Filter out empty strings
                                            .map((item: any) => {
                                                if (typeof item === 'string') {
                                                    // Plain text becomes a text segment
                                                    return {
                                                        type: 'segment',
                                                        segmentType: 'text',
                                                        text: item,
                                                    };
                                                } else if (item && item.type === 'segment') {
                                                    // Already a segment, use as-is
                                                    return item;
                                                }
                                                return null;
                                            })
                                            .filter(Boolean);
                                    } else if (msg.message && Array.isArray(msg.message)) {
                                        // Fallback: already has message array
                                        messageArray = msg.message;
                                    }

                                    return {
                                        id: `model-${index}`,
                                        type: 'model',
                                        message: messageArray,
                                        performanceStats: msg.performanceStats,
                                    };
                                }
                                return null;
                            })
                            .filter(Boolean);

                        console.log('Chat: Simplified messages:', simplifiedMessages);
                        console.log('Chat: Message count after filtering:', simplifiedMessages.length);
                        setSelectedChatMessages(simplifiedMessages);
                    } else {
                        console.log('Chat: No chat found or no messages');
                    }
                } catch (error) {
                    console.error('Chat: Failed to load selected chat messages:', error);
                }
            } else if (state.model.loaded && selectedChatMessages.length > 0) {
                // Model loaded and we had preview messages - clear them since LLM state should now handle display
                console.log('Chat: Model loaded, clearing preview messages');
                setSelectedChatMessages([]);
            } else {
                console.log('Chat: No action needed for loadSelectedChatMessages');
            }
        };

        loadSelectedChatMessages();
    }, [chatId, state.model.loaded, state.chatSession.simplifiedChat.length]);

    // Debug effect for model loading - wait for complete LLM state to be ready
    useEffect(() => {
        // Check if everything is fully loaded
        const isFullyLoaded =
            state.model.loaded &&
            state.llama.loaded &&
            state.context.loaded &&
            state.contextSequence.loaded &&
            state.chatSession.loaded;

        console.log('Chat: LLM state loading effect triggered:', {
            modelLoaded: state.model.loaded,
            llamaLoaded: state.llama.loaded,
            contextLoaded: state.context.loaded,
            contextSequenceLoaded: state.contextSequence.loaded,
            chatSessionLoaded: state.chatSession.loaded,
            isFullyLoaded,
            chatId,
        });

        // If everything just loaded and we have a current chat, reload it
        if (isFullyLoaded && chatId) {
            console.log('Chat: LLM fully loaded with current chat ID, reloading chat:', chatId);
            // Small delay to ensure everything is settled
            setTimeout(async () => {
                try {
                    const success = await electronChatRpc.loadChat(chatId);
                    console.log('Chat: Reloaded chat after LLM fully loaded, success:', success);
                } catch (error) {
                    console.error('Chat: Failed to reload chat after LLM loading:', error);
                }
            }, 100);
        }
    }, [
        state.model.loaded,
        state.llama.loaded,
        state.context.loaded,
        state.contextSequence.loaded,
        state.chatSession.loaded,
        chatId,
    ]);

    // Load voice settings on component mount
    useEffect(() => {
        loadVoiceSettings();
    }, []);

    // Listen for regeneration events to mark user interaction
    useEffect(() => {
        const unsubscribe = eventBus.on('message-regenerated', () => {
            console.log('Chat: Message regeneration detected, marking user interaction');
            setHasUserInteraction(true);
        });

        return unsubscribe;
    }, []);

    const loadVoiceSettings = async () => {
        try {
            console.log('Chat: Loading voice settings...');
            const settings = await window.electronAPI.getVoiceSettings();
            if (settings) {
                setVoiceSettings(settings);
            }
        } catch (error) {
            console.error('Chat: Error loading voice settings:', error);
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
                        clientHeight: currentClientHeight,
                    } = container;
                    const backAtBottom = currentScrollHeight - currentScrollTop - currentClientHeight < 10;

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
        if (state.chatSession.simplifiedChat.length > 0 && !generatingResult && !isUserScrolling) {
            setTimeout(scrollToBottom, 50);
        }
    }, [state.chatSession.simplifiedChat.length, generatingResult, isUserScrolling, scrollToBottom]);

    // Initial scroll on mount
    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [scrollToBottom]);

    const stopActivePrompt = useCallback(() => {
        void electronLlmRpc.stopActivePrompt();
    }, []);

    const sendPrompt = useCallback(
        (prompt: string, opts?: { withTools: boolean }) => {
            if (generatingResult) return;

            console.log('Chat: User sending prompt, marking user interaction');
            setHasUserInteraction(true); // Mark that user has interacted
            scrollToBottom();
            void electronLlmRpc.prompt(prompt, opts);
        },
        [generatingResult, scrollToBottom, setHasUserInteraction]
    );

    const error = state.llama.error ?? state.model.error ?? state.context.error ?? state.contextSequence.error;
    const loading =
        state.selectedModelFilePath != null &&
        error == null &&
        (!state.model.loaded ||
            !state.llama.loaded ||
            !state.context.loaded ||
            !state.contextSequence.loaded ||
            !state.chatSession.loaded);

    // Show welcome/message screen only when:
    // 1. No model selected AND no chat selected AND no messages, OR
    // 2. There's an error
    const showMessage =
        (state.selectedModelFilePath == null && chatId == null && state.chatSession.simplifiedChat.length === 0) ||
        error != null;

    return (
        <div id="app-container">
            <div className="app">
                {showMessage && (
                    <div className="message">
                        {error != null && <div className="error">{String(error)}</div>}
                        {loading && <div className="loading">{t('loading')}</div>}
                        {(state.selectedModelFilePath == null || state.llama.error != null) && <Welcome />}
                        {!loading &&
                            state.selectedModelFilePath != null &&
                            error == null &&
                            state.chatSession.simplifiedChat.length === 0 && (
                                <div className="typeMessage">Type a message to start the conversation</div>
                            )}
                    </div>
                )}
                {!showMessage && (
                    <>
                        <ChatHistory
                            className="mb-8"
                            simplifiedChat={
                                state.chatSession.simplifiedChat.length > 0
                                    ? state.chatSession.simplifiedChat
                                    : selectedChatMessages
                            }
                            generatingResult={generatingResult}
                            ref={chatHistoryRef}
                        />
                        {chatId && !state.model.loaded && selectedChatMessages.length > 0 && (
                            <div className="text-center text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 mb-4">
                                ⚠️ {t('msg.model_not_loaded')}
                            </div>
                        )}
                    </>
                )}
                <InputRow
                    disabled={!state.model.loaded || !state.contextSequence.loaded}
                    stopGeneration={generatingResult ? stopActivePrompt : undefined}
                    sendPrompt={sendPrompt}
                    generatingResult={generatingResult}
                    voiceSettings={voiceSettings}
                />
                {state.model.loaded && state.chatSession.sessionTokenStats && (
                    <span className="text-xs text-muted-foreground mt-2">
                        {state.chatSession.sessionTokenStats?.totalInputTokens} {t('tokens.input_tokens')},{' '}
                        {state.chatSession.sessionTokenStats?.totalOutputTokens} {t('tokens.output_tokens')},{' '}
                        {state.chatSession.sessionTokenStats?.totalTokens} {t('tokens.total_tokens')}
                    </span>
                )}
            </div>
        </div>
    );
}
