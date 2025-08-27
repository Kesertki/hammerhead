import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
// import { fileURLToPath } from 'node:url';
import { State, withLock } from 'lifecycle-utils';
import {
    ChatHistoryItem,
    type ChatModelSegmentType,
    getLlama,
    isChatModelResponseSegment,
    Llama,
    LlamaChatSession,
    LlamaContext,
    LlamaContextSequence,
    LlamaModel,
} from 'node-llama-cpp';
import { SystemPrompt } from '@/types.ts';
import packageJson from '../../package.json';
import { loadMcpTools } from '../mcp/client.ts';
import { getSelectedPrompt } from '../settings/prompts.ts';
import { eventBus } from '../utils/eventBus.ts';
import { systemFunctions } from '../llm/modelFunctions.ts';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Track stable IDs for messages based on their position in chat history
const messageIdCache = new Map<string, string>();

// Track token usage per message
const messageTokenStats = new Map<string, TokenStats>();
const messagePerformanceStats = new Map<
    string,
    {
        tokensPerSecond: number;
        outputTokensPerSecond: number;
        timeElapsed: number;
    }
>();

// Helper function for logging token usage with analytics
function logTokenUsage(
    label: string,
    tokenState: { usedInputTokens: number; usedOutputTokens: number },
    tokenDiff?: { usedInputTokens: number; usedOutputTokens: number },
    timeElapsed?: number
) {
    console.log(
        `[Token Usage] ${label} - Input: ${tokenState.usedInputTokens}, Output: ${tokenState.usedOutputTokens}, Total: ${tokenState.usedInputTokens + tokenState.usedOutputTokens}`
    );

    if (tokenDiff) {
        const total = tokenDiff.usedInputTokens + tokenDiff.usedOutputTokens;
        console.log(
            `[Token Usage] ${label} Diff - Input: ${tokenDiff.usedInputTokens}, Output: ${tokenDiff.usedOutputTokens}, Total: ${total}`
        );

        if (timeElapsed && timeElapsed > 0) {
            const tokensPerSecond = ((total / timeElapsed) * 1000).toFixed(2);
            const outputTokensPerSecond = ((tokenDiff.usedOutputTokens / timeElapsed) * 1000).toFixed(2);
            console.log(
                `[Token Usage] Performance - ${tokensPerSecond} tokens/sec (${outputTokensPerSecond} output tokens/sec)`
            );
        }
    }
}

// Helper function to log session token statistics
function logSessionTokenStats() {
    if (contextSequence?.tokenMeter) {
        const tokenState = contextSequence.tokenMeter.getState();
        console.log(
            `[Token Usage] Session Total - Input: ${tokenState.usedInputTokens}, Output: ${tokenState.usedOutputTokens}, Total: ${tokenState.usedInputTokens + tokenState.usedOutputTokens}`
        );
        console.log(
            '[Token Usage] Note: Token counts are tracked at context sequence level and persist across chat session resets'
        );
    }
}

// Helper function to get session token statistics
function getSessionTokenStats(): SessionTokenStats | undefined {
    if (!contextSequence?.tokenMeter) return undefined;

    const tokenState = contextSequence.tokenMeter.getState();
    const messageCount = chatSession?.getChatHistory().filter((msg) => msg.type !== 'system').length || 0;

    return {
        totalInputTokens: tokenState.usedInputTokens,
        totalOutputTokens: tokenState.usedOutputTokens,
        totalTokens: tokenState.usedInputTokens + tokenState.usedOutputTokens,
        messageCount,
    };
}

// Initialize MCP connections and load tools
let mcpFunctions = await loadMcpTools();

function getCurrentSystemPrompt() {
    return (
        getSelectedPrompt()?.prompt ??
        `You are a helpful, respectful and honest assistant. Always answer as helpfully as possible.\n" +
            "If a question does not make any sense, or is not factually coherent, explain why instead of answering something incorrectly. " +
            "If you don't know the answer to a question, don't share false information.`
    );
}

export const llmState = new State<LlmState>({
    appVersion: packageJson.version,
    llama: {
        loaded: false,
    },
    model: {
        loaded: false,
    },
    context: {
        loaded: false,
    },
    contextSequence: {
        loaded: false,
    },
    chatSession: {
        loaded: false,
        generatingResult: false,
        simplifiedChat: [],
        sessionTokenStats: undefined,
    },
});

export type LlmState = {
    appVersion?: string;
    llama: {
        loaded: boolean;
        error?: string;
    };
    selectedModelFilePath?: string;
    model: {
        loaded: boolean;
        loadProgress?: number;
        name?: string;
        error?: string;
    };
    context: {
        loaded: boolean;
        error?: string;
    };
    contextSequence: {
        loaded: boolean;
        error?: string;
    };
    chatSession: {
        loaded: boolean;
        generatingResult: boolean;
        simplifiedChat: SimplifiedChatItem[];
        sessionTokenStats?: SessionTokenStats;
    };
    preservedChatHistory?: ChatHistoryItem[];
};

export type TokenStats = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
};

export type SessionTokenStats = {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    messageCount: number;
};

export type SimplifiedChatItem = SimplifiedUserChatItem | SimplifiedModelChatItem;
export type SimplifiedUserChatItem = {
    id: string;
    type: 'user';
    message: string;
    tokenStats?: TokenStats;
};
export type SimplifiedModelChatItem = {
    id: string;
    type: 'model';
    message: Array<
        | {
              type: 'text';
              text: string;
          }
        | {
              type: 'segment';
              segmentType: ChatModelSegmentType;
              text: string;
              startTime?: string;
              endTime?: string;
          }
    >;
    tokenStats?: TokenStats;
    performanceStats?: {
        tokensPerSecond: number;
        outputTokensPerSecond: number;
        timeElapsed: number;
    };
};

let llama: Llama | null = null;
let model: LlamaModel | null = null;
let context: LlamaContext | null = null;
let contextSequence: LlamaContextSequence | null = null;

let chatSession: LlamaChatSession | null = null;
let promptAbortController: AbortController | null = null;
let inProgressResponse: SimplifiedModelChatItem['message'] = [];

eventBus.on('selected-prompt-changed', (prompt: SystemPrompt) => {
    console.log('Selected prompt changed', prompt);
    // If a chat session exists, update its system prompt
    if (chatSession) {
        const history = chatSession.getChatHistory();

        // Find system message and update it
        const systemMessageIndex = history.findIndex((msg) => msg.type === 'system');
        if (systemMessageIndex !== -1) {
            history[systemMessageIndex] = {
                type: 'system',
                text: prompt.prompt || getCurrentSystemPrompt(),
            };

            chatSession.setChatHistory(history);

            // Update UI if needed
            llmState.state = {
                ...llmState.state,
                chatSession: {
                    ...llmState.state.chatSession,
                    simplifiedChat: getSimplifiedChatHistory(false),
                },
            };
        }
    }
});

eventBus.on('mcp-config-changed', async () => {
    try {
        console.log('MCP servers changed, reloading tools');
        mcpFunctions = await loadMcpTools();
    } catch (err) {
        console.error('Failed to reload MCP tools', err);
    }
});

export const llmFunctions = {
    async loadLlama() {
        await withLock([llmFunctions, 'llama'], async () => {
            if (llama != null) {
                try {
                    await llama.dispose();
                    llama = null;
                } catch (err) {
                    console.error('Failed to dispose llama', err);
                }
            }

            try {
                llmState.state = {
                    ...llmState.state,
                    llama: { loaded: false },
                };

                llama = await getLlama();
                llmState.state = {
                    ...llmState.state,
                    llama: { loaded: true },
                };

                llama.onDispose.createListener(() => {
                    llmState.state = {
                        ...llmState.state,
                        llama: { loaded: false },
                    };
                });
            } catch (err) {
                console.error('Failed to load llama', err);
                llmState.state = {
                    ...llmState.state,
                    llama: {
                        loaded: false,
                        error: String(err),
                    },
                };
            }
        });
    },
    async loadModel(modelPath: string) {
        await withLock([llmFunctions, 'model'], async () => {
            if (llama == null) throw new Error('Llama not loaded');

            if (model != null) {
                try {
                    await model.dispose();
                    model = null;
                } catch (err) {
                    console.error('Failed to dispose model', err);
                }
            }

            try {
                llmState.state = {
                    ...llmState.state,
                    model: {
                        loaded: false,
                        loadProgress: 0,
                    },
                };

                console.log('Loading model from path:', modelPath);
                console.log('Flash attention enabled:', true);

                model = await llama.loadModel({
                    defaultContextFlashAttention: true,
                    modelPath,
                    onLoadProgress(loadProgress: number) {
                        // console.log('loadProgress', loadProgress);
                        llmState.state = {
                            ...llmState.state,
                            model: {
                                ...llmState.state.model,
                                loadProgress,
                            },
                        };
                    },
                });
                llmState.state = {
                    ...llmState.state,
                    model: {
                        loaded: true,
                        loadProgress: 1,
                        name: path.basename(modelPath),
                    },
                };

                model.onDispose.createListener(() => {
                    llmState.state = {
                        ...llmState.state,
                        model: { loaded: false },
                    };
                });
            } catch (err) {
                console.error('Failed to load model', err);
                llmState.state = {
                    ...llmState.state,
                    model: {
                        loaded: false,
                        error: String(err),
                    },
                };
            }
        });
    },
    async unloadModel(preserveChat: boolean = false) {
        await withLock([llmFunctions, 'model'], async () => {
            if (model == null) return;

            try {
                // Store current simplified chat and raw chat history if preserving
                const currentSimplifiedChat = preserveChat ? llmState.state.chatSession.simplifiedChat : [];
                const currentSessionTokenStats = preserveChat
                    ? llmState.state.chatSession.sessionTokenStats
                    : undefined;
                const currentChatHistory = preserveChat && chatSession ? chatSession.getChatHistory() : undefined;

                // Dispose of dependent resources first
                if (chatSession != null) {
                    chatSession.dispose();
                    chatSession = null;
                }
                if (contextSequence != null) {
                    contextSequence.dispose();
                    contextSequence = null;
                }
                if (context != null) {
                    await context.dispose();
                    context = null;
                }

                // Finally dispose the model
                await model.dispose();
                model = null;

                // Reset all related state (but preserve chat UI if requested)
                llmState.state = {
                    ...llmState.state,
                    selectedModelFilePath: undefined,
                    model: { loaded: false },
                    context: { loaded: false },
                    contextSequence: { loaded: false },
                    chatSession: {
                        loaded: false,
                        generatingResult: false,
                        simplifiedChat: currentSimplifiedChat,
                        sessionTokenStats: currentSessionTokenStats,
                    },
                    preservedChatHistory: currentChatHistory,
                };
            } catch (err) {
                console.error('Failed to unload model', err);
            }
        });
    },
    async createContext() {
        await withLock([llmFunctions, 'context'], async () => {
            if (model == null) throw new Error('Model not loaded');

            if (context != null) {
                try {
                    await context.dispose();
                    context = null;
                } catch (err) {
                    console.error('Failed to dispose context', err);
                }
            }

            try {
                llmState.state = {
                    ...llmState.state,
                    context: { loaded: false },
                };

                context = await model.createContext();
                llmState.state = {
                    ...llmState.state,
                    context: { loaded: true },
                };

                context.onDispose.createListener(() => {
                    llmState.state = {
                        ...llmState.state,
                        context: { loaded: false },
                    };
                });
            } catch (err) {
                console.error('Failed to create context', err);
                llmState.state = {
                    ...llmState.state,
                    context: {
                        loaded: false,
                        error: String(err),
                    },
                };
            }
        });
    },
    async createContextSequence() {
        await withLock([llmFunctions, 'contextSequence'], async () => {
            if (context == null) throw new Error('Context not loaded');

            try {
                llmState.state = {
                    ...llmState.state,
                    contextSequence: { loaded: false },
                };

                contextSequence = context.getSequence();
                llmState.state = {
                    ...llmState.state,
                    contextSequence: { loaded: true },
                };

                contextSequence.onDispose.createListener(() => {
                    llmState.state = {
                        ...llmState.state,
                        contextSequence: { loaded: false },
                    };
                });
            } catch (err) {
                console.error('Failed to get context sequence', err);
                llmState.state = {
                    ...llmState.state,
                    contextSequence: {
                        loaded: false,
                        error: String(err),
                    },
                };
            }
        });
    },
    chatSession: {
        async exportChatSession(outputPath: string): Promise<boolean> {
            return await withLock([llmFunctions, 'chatSession'], async () => {
                const messages = chatSession?.getChatHistory();
                if (messages && messages.length > 0) {
                    const outputContent = JSON.stringify(
                        {
                            version: '1.0',
                            model: llmState.state.model.name,
                            created_at: new Date().toISOString(),
                            messages,
                        },
                        null,
                        2
                    );

                    try {
                        await fs.writeFile(outputPath, outputContent, 'utf8');
                        return true;
                    } catch (err) {
                        console.error('Failed to save chat session', err);
                        // throw new Error(`Failed to save chat session: ${err}`);
                        return false;
                    }
                }
                console.warn('No chat messages to save');
                return false;
            });
        },
        async importChatSession(inputPath: string): Promise<boolean> {
            return await withLock([llmFunctions, 'chatSession'], async () => {
                try {
                    const content = await fs.readFile(inputPath, 'utf8');
                    const data = JSON.parse(content);
                    if (data && data.version === '1.0' && Array.isArray(data.messages)) {
                        llmFunctions.chatSession.resetChatHistory(true, data.messages);
                        return true;
                    }
                    console.error('Invalid chat session format');
                    return false;
                } catch (err) {
                    console.error('Failed to import chat session', err);
                    return false;
                }
            });
        },
        async createChatSession() {
            await withLock([llmFunctions, 'chatSession'], async () => {
                if (contextSequence == null) throw new Error('Context sequence not loaded');

                if (chatSession != null) {
                    try {
                        chatSession.dispose();
                        chatSession = null;
                        // chatSessionCompletionEngine = null;
                    } catch (err) {
                        console.error('Failed to dispose chat session', err);
                    }
                }

                try {
                    llmState.state = {
                        ...llmState.state,
                        chatSession: {
                            loaded: false,
                            generatingResult: false,
                            simplifiedChat: [],
                            sessionTokenStats: undefined,
                            // draftPrompt: llmState.state.chatSession.draftPrompt
                        },
                    };

                    llmFunctions.chatSession.resetChatHistory(false);

                    try {
                        await chatSession?.preloadPrompt('', {
                            signal: promptAbortController?.signal,
                        });
                    } catch {
                        // do nothing
                    }

                    llmState.state = {
                        ...llmState.state,
                        chatSession: {
                            ...llmState.state.chatSession,
                            loaded: true,
                            sessionTokenStats: getSessionTokenStats(),
                        },
                    };
                } catch (err) {
                    console.error('Failed to create chat session', err);
                    llmState.state = {
                        ...llmState.state,
                        chatSession: {
                            loaded: false,
                            generatingResult: false,
                            simplifiedChat: [],
                            sessionTokenStats: undefined,
                        },
                    };
                }
            });
        },
        async prompt(message: string, opts?: { withTools?: boolean }) {
            await withLock([llmFunctions, 'chatSession'], async () => {
                if (chatSession == null) throw new Error('Chat session not loaded');
                if (contextSequence == null) throw new Error('Context sequence not loaded');

                console.log('Prompting LLM with message:', message, 'and options:', opts);

                let promptMessage = message.trim();

                // Capture initial token meter state and start timing
                const initialTokenState = contextSequence.tokenMeter.getState();
                const startTime = Date.now();
                logTokenUsage('Before prompt', initialTokenState);

                llmState.state = {
                    ...llmState.state,
                    chatSession: {
                        ...llmState.state.chatSession,
                        generatingResult: true,
                        sessionTokenStats: getSessionTokenStats(),
                    },
                };
                promptAbortController = new AbortController();

                llmState.state = {
                    ...llmState.state,
                    chatSession: {
                        ...llmState.state.chatSession,
                        simplifiedChat: getSimplifiedChatHistory(true, message),
                        sessionTokenStats: getSessionTokenStats(),
                    },
                };

                const abortSignal = promptAbortController.signal;
                try {
                    await chatSession.prompt(promptMessage, {
                        signal: abortSignal,
                        stopOnAbortSignal: true,
                        functions: opts?.withTools ? mcpFunctions : systemFunctions,
                        onResponseChunk(chunk) {
                            inProgressResponse = squashMessageIntoModelChatMessages(
                                inProgressResponse,
                                chunk.type == null || chunk.segmentType == null
                                    ? {
                                          type: 'text',
                                          text: chunk.text,
                                      }
                                    : {
                                          type: 'segment',
                                          segmentType: chunk.segmentType,
                                          text: chunk.text,
                                          startTime: chunk.segmentStartTime?.toISOString(),
                                          endTime: chunk.segmentEndTime?.toISOString(),
                                      }
                            );

                            llmState.state = {
                                ...llmState.state,
                                chatSession: {
                                    ...llmState.state.chatSession,
                                    simplifiedChat: getSimplifiedChatHistory(true, message),
                                    sessionTokenStats: getSessionTokenStats(),
                                },
                            };
                        },
                    });
                } catch (err) {
                    if (err !== abortSignal.reason) throw err;

                    // if the prompt was aborted before the generation even started, we ignore the error
                }

                // Calculate token usage and timing using TokenMeter diff API
                const endTime = Date.now();
                const timeElapsed = endTime - startTime;
                const finalTokenState = contextSequence.tokenMeter.getState();
                const tokenDiff = contextSequence.tokenMeter.diff(initialTokenState);

                logTokenUsage('After prompt', finalTokenState, tokenDiff, timeElapsed);

                // Store token stats for this message pair using original message as key
                if (tokenDiff) {
                    const messageKey = `${promptMessage}-${endTime}`;
                    messageTokenStats.set(messageKey, {
                        inputTokens: tokenDiff.usedInputTokens,
                        outputTokens: tokenDiff.usedOutputTokens,
                        totalTokens: tokenDiff.usedInputTokens + tokenDiff.usedOutputTokens,
                    });

                    if (timeElapsed > 0) {
                        const total = tokenDiff.usedInputTokens + tokenDiff.usedOutputTokens;
                        messagePerformanceStats.set(messageKey, {
                            tokensPerSecond: (total / timeElapsed) * 1000,
                            outputTokensPerSecond: (tokenDiff.usedOutputTokens / timeElapsed) * 1000,
                            timeElapsed,
                        });
                    }
                }

                llmState.state = {
                    ...llmState.state,
                    chatSession: {
                        ...llmState.state.chatSession,
                        generatingResult: false,
                        simplifiedChat: getSimplifiedChatHistory(false),
                        sessionTokenStats: getSessionTokenStats(),
                    },
                };
                inProgressResponse = [];
            });
        },
        stopActivePrompt() {
            promptAbortController?.abort();
        },
        clearChat() {
            // Log session token stats before clearing
            console.log('[Token Usage] Clearing chat session');
            logSessionTokenStats();

            // Clear token tracking maps and ID cache
            messageTokenStats.clear();
            messagePerformanceStats.clear();
            messageIdCache.clear();

            // Clear chat state regardless of whether a model is loaded
            llmState.state = {
                ...llmState.state,
                chatSession: {
                    ...llmState.state.chatSession,
                    simplifiedChat: [],
                    sessionTokenStats: getSessionTokenStats(),
                },
                preservedChatHistory: undefined,
            };

            // If there's an active chat session, reset it too
            if (contextSequence != null && chatSession != null) {
                // Don't log session stats again since we just did above
                llmFunctions.chatSession.resetChatHistory(true, undefined, false);
            }
        },
        resetChatHistory(markAsLoaded: boolean = true, messages?: ChatHistoryItem[], logStats: boolean = true) {
            if (contextSequence == null) return;

            // Log session token stats before resetting if this isn't a fresh session
            if (chatSession != null && logStats) {
                console.log('[Token Usage] Resetting chat session');
                logSessionTokenStats();
            }

            chatSession?.dispose();
            chatSession = new LlamaChatSession({
                contextSequence,
                autoDisposeSequence: false,
            });

            // Use provided messages, or preserved chat history, or default system prompt
            const chatMessages = messages ||
                llmState.state.preservedChatHistory || [
                    {
                        type: 'system',
                        text: getCurrentSystemPrompt(),
                    },
                ];

            chatSession.setChatHistory(chatMessages);

            llmState.state = {
                ...llmState.state,
                chatSession: {
                    loaded: markAsLoaded ? true : llmState.state.chatSession.loaded,
                    generatingResult: false,
                    simplifiedChat: getSimplifiedChatHistory(false),
                    sessionTokenStats: getSessionTokenStats(),
                },
                // Clear preserved chat history after using it
                preservedChatHistory: undefined,
            };

            chatSession.onDispose.createListener(() => {
                promptAbortController = null;
                llmState.state = {
                    ...llmState.state,
                    chatSession: {
                        loaded: false,
                        generatingResult: false,
                        simplifiedChat: [],
                        sessionTokenStats: undefined,
                    },
                };
            });

            // Log initial state of new session with better context
            if (logStats && contextSequence?.tokenMeter) {
                const sessionType = messages ? 'imported' : 'reset';
                console.log(`[Token Usage] Chat session ${sessionType} - context sequence tokens preserved`);
                logTokenUsage(`Session ${sessionType}`, contextSequence.tokenMeter.getState());
            }
        },
        deleteMessage(messageToDelete: SimplifiedUserChatItem) {
            if (chatSession == null) return;

            const currentHistory = chatSession.getChatHistory();
            const simplifiedHistory = getSimplifiedChatHistory(false);

            console.log(`Deleting message with ID: ${messageToDelete.id}, Text: ${messageToDelete.message}`);
            console.log(
                'Current simplified history:',
                simplifiedHistory.map((msg) => ({
                    id: msg.id,
                    type: msg.type,
                    message: msg.type === 'user' ? msg.message : 'model',
                }))
            );

            // Find the index of the user message to delete using the unique ID
            const messageIndex = simplifiedHistory.findIndex((msg) => {
                return msg.type === 'user' && msg.id === messageToDelete.id;
            });

            console.log(`Message index found: ${messageIndex}`);
            if (messageIndex === -1) {
                console.log('Message not found in simplified history');
                return;
            }

            // Count non-system messages before the target message to find the actual index
            let actualIndex = 0;
            let simplifiedIndex = 0;

            for (let i = 0; i < currentHistory.length; i++) {
                const historyItem = currentHistory[i];
                if (!historyItem || historyItem.type === 'system') continue;

                if (simplifiedIndex === messageIndex) {
                    actualIndex = i;
                    break;
                }
                simplifiedIndex++;
            }

            console.log(`Actual index in chat history: ${actualIndex}`);
            console.log(`Original history length: ${currentHistory.length}`);

            // Remove the message and all subsequent messages
            const newHistory = currentHistory.slice(0, actualIndex);
            console.log(`New history length: ${newHistory.length}`);

            // Clear ID cache entries for deleted messages
            // Since we're deleting from actualIndex onwards, clear cache for those positions
            for (let i = actualIndex; i < currentHistory.length; i++) {
                const item = currentHistory[i];
                if (item?.type === 'user') {
                    messageIdCache.delete(`user-${i}-${item.text}`);
                } else if (item?.type === 'model') {
                    messageIdCache.delete(`model-${i}`);
                }
            }

            chatSession.setChatHistory(newHistory);

            // Update the state
            llmState.state = {
                ...llmState.state,
                chatSession: {
                    ...llmState.state.chatSession,
                    simplifiedChat: getSimplifiedChatHistory(false),
                    sessionTokenStats: getSessionTokenStats(),
                },
            };

            console.log('State updated, new simplified chat length:', getSimplifiedChatHistory(false).length);
        },
        async regenerateMessage(modelMessageToRegenerate: SimplifiedModelChatItem) {
            if (chatSession == null) return;

            const currentHistory = chatSession.getChatHistory();
            const simplifiedHistory = getSimplifiedChatHistory(false);

            console.log(`Regenerating model message with ID: ${modelMessageToRegenerate.id}`);

            // Find the index of the model message to regenerate
            const modelMessageIndex = simplifiedHistory.findIndex((msg) => {
                return msg.type === 'model' && msg.id === modelMessageToRegenerate.id;
            });

            if (modelMessageIndex === -1) {
                console.log('Model message not found in simplified history');
                return;
            }

            // Find the corresponding user message (should be right before the model message)
            let userMessageIndex = -1;
            for (let i = modelMessageIndex - 1; i >= 0; i--) {
                const historyItem = simplifiedHistory[i];
                if (historyItem && historyItem.type === 'user') {
                    userMessageIndex = i;
                    break;
                }
            }

            if (userMessageIndex === -1) {
                console.log('No user message found before the model message');
                return;
            }

            const userMessage = simplifiedHistory[userMessageIndex] as SimplifiedUserChatItem;
            console.log(`Found user message: ${userMessage.message}`);

            // Find the actual index in the chat history for the user message
            let actualUserIndex = 0;
            let simplifiedIndex = 0;

            for (let i = 0; i < currentHistory.length; i++) {
                const historyItem = currentHistory[i];
                if (!historyItem || historyItem.type === 'system') continue;

                if (simplifiedIndex === userMessageIndex) {
                    actualUserIndex = i;
                    break;
                }
                simplifiedIndex++;
            }

            console.log(`Actual user message index in chat history: ${actualUserIndex}`);

            // Remove everything after the user message (including the model response and any subsequent messages)
            const newHistory = currentHistory.slice(0, actualUserIndex + 1);
            console.log(`New history length after truncation: ${newHistory.length}`);

            // Clear ID cache entries for deleted messages
            for (let i = actualUserIndex + 1; i < currentHistory.length; i++) {
                const item = currentHistory[i];
                if (item?.type === 'user') {
                    messageIdCache.delete(`user-${i}-${item.text}`);
                } else if (item?.type === 'model') {
                    messageIdCache.delete(`model-${i}`);
                }
            }

            // Set the truncated history
            chatSession.setChatHistory(newHistory);

            // Update the state to reflect the truncated chat
            llmState.state = {
                ...llmState.state,
                chatSession: {
                    ...llmState.state.chatSession,
                    simplifiedChat: getSimplifiedChatHistory(false),
                    sessionTokenStats: getSessionTokenStats(),
                },
            };

            // Now regenerate the response by calling prompt with empty string
            // The user message is already in the history, so prompt('') will generate a response
            console.log(`Regenerating response for existing conversation context`);
            await llmFunctions.chatSession.prompt('');
        },
    },
} as const;

function getSimplifiedChatHistory(generatingResult: boolean, currentPrompt?: string) {
    if (chatSession == null) return [];

    const chatHistory: SimplifiedChatItem[] = chatSession
        .getChatHistory()
        .flatMap((item, index): SimplifiedChatItem[] => {
            if (item.type === 'system') return [];
            if (item.type === 'user') {
                // Use original message if available, otherwise use the augmented one
                const originalMessage = item.text;

                // Generate stable ID based on message content and position
                const messageKey = `user-${index}-${originalMessage}`;
                let messageId = messageIdCache.get(messageKey);
                if (!messageId) {
                    messageId = randomUUID();
                    messageIdCache.set(messageKey, messageId);
                }

                // Try to find token stats for this message
                const messageKeys = Array.from(messageTokenStats.keys());
                const matchingKey = messageKeys.find((key) => key.startsWith(originalMessage + '-'));
                const tokenStats = matchingKey ? messageTokenStats.get(matchingKey) : undefined;

                return [
                    {
                        id: messageId,
                        type: 'user',
                        message: originalMessage,
                        tokenStats,
                    },
                ];
            }
            if (item.type === 'model') {
                // Find the corresponding user message to get token stats
                const chatHistoryItems = chatSession?.getChatHistory() || [];
                const previousUserMessage = chatHistoryItems
                    .slice(0, index)
                    .reverse()
                    .find((msg) => msg.type === 'user');

                let tokenStats: TokenStats | undefined;
                let performanceStats:
                    | {
                          tokensPerSecond: number;
                          outputTokensPerSecond: number;
                          timeElapsed: number;
                      }
                    | undefined;

                if (previousUserMessage) {
                    const originalMessage = previousUserMessage.text;
                    const messageKeys = Array.from(messageTokenStats.keys());
                    const matchingKey = messageKeys.find((key) => key.startsWith(originalMessage + '-'));

                    if (matchingKey) {
                        tokenStats = messageTokenStats.get(matchingKey);
                        performanceStats = messagePerformanceStats.get(matchingKey);
                    }
                }

                // Generate stable ID for this model message based on position
                const modelMessageKey = `model-${index}`;
                let modelMessageId = messageIdCache.get(modelMessageKey);
                if (!modelMessageId) {
                    modelMessageId = randomUUID();
                    messageIdCache.set(modelMessageKey, modelMessageId);
                }

                return [
                    {
                        id: modelMessageId,
                        type: 'model',
                        message: item.response
                            .filter((item) => typeof item === 'string' || isChatModelResponseSegment(item))
                            .map((item): SimplifiedModelChatItem['message'][number] | null => {
                                if (typeof item === 'string')
                                    return {
                                        type: 'text',
                                        text: item,
                                    };
                                if (isChatModelResponseSegment(item))
                                    return {
                                        type: 'segment',
                                        segmentType: item.segmentType,
                                        text: item.text,
                                        startTime: item.startTime,
                                        endTime: item.endTime,
                                    };

                                void (item satisfies never); // ensure all item types are handled
                                return null;
                            })
                            .filter((item) => item != null)

                            // squash adjacent response items of the same type
                            .reduce(
                                (res, item) => {
                                    return squashMessageIntoModelChatMessages(res, item);
                                },
                                [] as SimplifiedModelChatItem['message']
                            ),
                        tokenStats,
                        performanceStats,
                    },
                ];
            }

            void (item satisfies never); // ensure all item types are handled
            return [];
        });

    if (generatingResult && currentPrompt != null) {
        chatHistory.push({
            id: 'temp-user-generating',
            type: 'user',
            message: currentPrompt,
        });

        if (inProgressResponse.length > 0)
            chatHistory.push({
                id: 'temp-model-generating',
                type: 'model',
                message: inProgressResponse,
            });
    }

    return chatHistory;
}

/** Squash a new model response message into the existing model response messages array */
function squashMessageIntoModelChatMessages(
    modelChatMessages: SimplifiedModelChatItem['message'],
    message: SimplifiedModelChatItem['message'][number]
): SimplifiedModelChatItem['message'] {
    const newModelChatMessages = structuredClone(modelChatMessages);
    const lastExistingModelMessage = newModelChatMessages.at(-1);

    if (lastExistingModelMessage == null || lastExistingModelMessage.type !== message.type) {
        // avoid pushing empty text messages
        if (message.type !== 'text' || message.text !== '') newModelChatMessages.push(message);

        return newModelChatMessages;
    }

    if (lastExistingModelMessage.type === 'text' && message.type === 'text') {
        lastExistingModelMessage.text += message.text;
        return newModelChatMessages;
    }
    if (
        lastExistingModelMessage.type === 'segment' &&
        message.type === 'segment' &&
        lastExistingModelMessage.segmentType === message.segmentType &&
        lastExistingModelMessage.endTime == null
    ) {
        lastExistingModelMessage.text += message.text;
        lastExistingModelMessage.endTime = message.endTime;
        return newModelChatMessages;
    }

    newModelChatMessages.push(message);
    return newModelChatMessages;
}
