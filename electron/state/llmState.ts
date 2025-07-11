import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { State, withLock } from 'lifecycle-utils';
import {
	ChatHistoryItem,
	type ChatModelSegmentType,
	getLlama,
	isChatModelResponseSegment,
	Llama,
	LlamaChatSession,
	LlamaChatSessionPromptCompletionEngine,
	LlamaContext,
	LlamaContextSequence,
	LlamaModel
} from 'node-llama-cpp';
import { SystemPrompt } from '@/types.ts';
import packageJson from '../../package.json';
import {
	generateQueryEmbeddings,
	isChromaConnected,
	retrieveRelevantInformation
} from '../embeddings/chroma.ts';
import { loadMcpTools } from '../mcp/client.ts';
import { getSelectedPrompt } from '../settings/prompts.ts';
import { eventBus } from '../utils/eventBus.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const originalUserMessages = new Map<string, string>();

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
		loaded: false
	},
	model: {
		loaded: false
	},
	context: {
		loaded: false
	},
	contextSequence: {
		loaded: false
	},
	chatSession: {
		loaded: false,
		generatingResult: false,
		simplifiedChat: [],
		draftPrompt: {
			prompt: '',
			completion: ''
		}
	}
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
		draftPrompt: {
			prompt: string;
			completion: string;
		};
	};
};

export type SimplifiedChatItem =
	| SimplifiedUserChatItem
	| SimplifiedModelChatItem;
export type SimplifiedUserChatItem = {
	type: 'user';
	message: string;
};
export type SimplifiedModelChatItem = {
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
};

let llama: Llama | null = null;
let model: LlamaModel | null = null;
let context: LlamaContext | null = null;
let contextSequence: LlamaContextSequence | null = null;

let chatSession: LlamaChatSession | null = null;
let chatSessionCompletionEngine: LlamaChatSessionPromptCompletionEngine | null =
	null;
let promptAbortController: AbortController | null = null;
let inProgressResponse: SimplifiedModelChatItem['message'] = [];

eventBus.on('selected-prompt-changed', (prompt: SystemPrompt) => {
	console.log('Selected prompt changed', prompt);
	// If a chat session exists, update its system prompt
	if (chatSession) {
		const history = chatSession.getChatHistory();

		// Find system message and update it
		const systemMessageIndex = history.findIndex(
			(msg) => msg.type === 'system'
		);
		if (systemMessageIndex !== -1) {
			history[systemMessageIndex] = {
				type: 'system',
				text: prompt.prompt || getCurrentSystemPrompt()
			};

			chatSession.setChatHistory(history);

			// Update UI if needed
			llmState.state = {
				...llmState.state,
				chatSession: {
					...llmState.state.chatSession,
					simplifiedChat: getSimplifiedChatHistory(false)
				}
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
		await withLock(llmFunctions, 'llama', async () => {
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
					llama: { loaded: false }
				};

				llama = await getLlama();
				llmState.state = {
					...llmState.state,
					llama: { loaded: true }
				};

				llama.onDispose.createListener(() => {
					llmState.state = {
						...llmState.state,
						llama: { loaded: false }
					};
				});
			} catch (err) {
				console.error('Failed to load llama', err);
				llmState.state = {
					...llmState.state,
					llama: {
						loaded: false,
						error: String(err)
					}
				};
			}
		});
	},
	async loadModel(modelPath: string) {
		await withLock(llmFunctions, 'model', async () => {
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
						loadProgress: 0
					}
				};

				model = await llama.loadModel({
					modelPath,
					onLoadProgress(loadProgress: number) {
						// console.log('loadProgress', loadProgress);
						llmState.state = {
							...llmState.state,
							model: {
								...llmState.state.model,
								loadProgress
							}
						};
					}
				});
				llmState.state = {
					...llmState.state,
					model: {
						loaded: true,
						loadProgress: 1,
						name: path.basename(modelPath)
					}
				};

				model.onDispose.createListener(() => {
					llmState.state = {
						...llmState.state,
						model: { loaded: false }
					};
				});
			} catch (err) {
				console.error('Failed to load model', err);
				llmState.state = {
					...llmState.state,
					model: {
						loaded: false,
						error: String(err)
					}
				};
			}
		});
	},
	async createContext() {
		await withLock(llmFunctions, 'context', async () => {
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
					context: { loaded: false }
				};

				context = await model.createContext();
				llmState.state = {
					...llmState.state,
					context: { loaded: true }
				};

				context.onDispose.createListener(() => {
					llmState.state = {
						...llmState.state,
						context: { loaded: false }
					};
				});
			} catch (err) {
				console.error('Failed to create context', err);
				llmState.state = {
					...llmState.state,
					context: {
						loaded: false,
						error: String(err)
					}
				};
			}
		});
	},
	async createContextSequence() {
		await withLock(llmFunctions, 'contextSequence', async () => {
			if (context == null) throw new Error('Context not loaded');

			try {
				llmState.state = {
					...llmState.state,
					contextSequence: { loaded: false }
				};

				contextSequence = context.getSequence();
				llmState.state = {
					...llmState.state,
					contextSequence: { loaded: true }
				};

				contextSequence.onDispose.createListener(() => {
					llmState.state = {
						...llmState.state,
						contextSequence: { loaded: false }
					};
				});
			} catch (err) {
				console.error('Failed to get context sequence', err);
				llmState.state = {
					...llmState.state,
					contextSequence: {
						loaded: false,
						error: String(err)
					}
				};
			}
		});
	},
	chatSession: {
		async exportChatSession(outputPath: string): Promise<boolean> {
			return await withLock(llmFunctions, 'chatSession', async () => {
				const messages = chatSession?.getChatHistory();
				if (messages && messages.length > 0) {
					const outputContent = JSON.stringify(
						{
							version: '1.0',
							model: llmState.state.model.name,
							created_at: new Date().toISOString(),
							messages
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
			return await withLock(llmFunctions, 'chatSession', async () => {
				try {
					const content = await fs.readFile(inputPath, 'utf8');
					const data = JSON.parse(content);
					if (
						data &&
						data.version === '1.0' &&
						Array.isArray(data.messages)
					) {
						llmFunctions.chatSession.resetChatHistory(
							true,
							data.messages
						);
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
			await withLock(llmFunctions, 'chatSession', async () => {
				if (contextSequence == null)
					throw new Error('Context sequence not loaded');

				if (chatSession != null) {
					try {
						chatSession.dispose();
						chatSession = null;
						chatSessionCompletionEngine = null;
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
							draftPrompt: llmState.state.chatSession.draftPrompt
						}
					};

					llmFunctions.chatSession.resetChatHistory(false);

					try {
						await chatSession?.preloadPrompt('', {
							signal: promptAbortController?.signal
						});
					} catch {
						// do nothing
					}
					chatSessionCompletionEngine?.complete(
						llmState.state.chatSession.draftPrompt.prompt
					);

					llmState.state = {
						...llmState.state,
						chatSession: {
							...llmState.state.chatSession,
							loaded: true
						}
					};
				} catch (err) {
					console.error('Failed to create chat session', err);
					llmState.state = {
						...llmState.state,
						chatSession: {
							loaded: false,
							generatingResult: false,
							simplifiedChat: [],
							draftPrompt: llmState.state.chatSession.draftPrompt
						}
					};
				}
			});
		},
		async prompt(message: string) {
			await withLock(llmFunctions, 'chatSession', async () => {
				if (chatSession == null)
					throw new Error('Chat session not loaded');
				// Store original message before augmentation
				const originalMessage = message.trim();

				llmState.state = {
					...llmState.state,
					chatSession: {
						...llmState.state.chatSession,
						generatingResult: true,
						draftPrompt: {
							prompt: '',
							completion: ''
						}
					}
				};
				promptAbortController = new AbortController();

				llmState.state = {
					...llmState.state,
					chatSession: {
						...llmState.state.chatSession,
						simplifiedChat: getSimplifiedChatHistory(true, message)
					}
				};

				const abortSignal = promptAbortController.signal;
				try {
					let finalQuery = originalMessage;

					try {
						// const isChromaConnected = await checkChromaConnection();
						if (isChromaConnected) {
							const queryEmbeddings =
								await generateQueryEmbeddings(message);
							const relevantInformation =
								await retrieveRelevantInformation(
									queryEmbeddings
								);

							// Only augment if we actually have relevant information
							if (
								Array.isArray(relevantInformation) &&
								relevantInformation.length > 0
							) {
								const formattedContext = relevantInformation
									.map(
										(doc, i) => `Document ${i + 1}: ${doc}`
									)
									.join('\n\n');

								finalQuery = `Context Information:\n${formattedContext}\n\nUser Query: ${message}\n\nPlease answer based on the context provided above.`;
								console.log('Augmented Prompt:', finalQuery);

								// Store mapping between augmented and original message
								originalUserMessages.set(
									finalQuery,
									originalMessage
								);
							} else {
								// No augmentation needed - use original message
								finalQuery = originalMessage;
							}
						} else {
							console.warn(
								'Chroma not connected, using original message'
							);
						}
					} catch (err) {
						console.error(
							'Failed to generate query embeddings',
							err
						);
						finalQuery = originalMessage; // Fallback to original message
					}

					await chatSession.prompt(finalQuery, {
						signal: abortSignal,
						stopOnAbortSignal: true,
						functions: mcpFunctions,
						onResponseChunk(chunk) {
							inProgressResponse =
								squashMessageIntoModelChatMessages(
									inProgressResponse,
									chunk.type == null ||
										chunk.segmentType == null
										? {
												type: 'text',
												text: chunk.text
											}
										: {
												type: 'segment',
												segmentType: chunk.segmentType,
												text: chunk.text,
												startTime:
													chunk.segmentStartTime?.toISOString(),
												endTime:
													chunk.segmentEndTime?.toISOString()
											}
								);

							llmState.state = {
								...llmState.state,
								chatSession: {
									...llmState.state.chatSession,
									simplifiedChat: getSimplifiedChatHistory(
										true,
										message
									)
								}
							};
						}
					});
				} catch (err) {
					if (err !== abortSignal.reason) throw err;

					// if the prompt was aborted before the generation even started, we ignore the error
				}

				llmState.state = {
					...llmState.state,
					chatSession: {
						...llmState.state.chatSession,
						generatingResult: false,
						simplifiedChat: getSimplifiedChatHistory(false),
						draftPrompt: {
							...llmState.state.chatSession.draftPrompt,
							completion:
								chatSessionCompletionEngine?.complete(
									llmState.state.chatSession.draftPrompt
										.prompt
								) ?? ''
						}
					}
				};
				inProgressResponse = [];
			});
		},
		stopActivePrompt() {
			promptAbortController?.abort();
		},
		resetChatHistory(
			markAsLoaded: boolean = true,
			messages?: ChatHistoryItem[]
		) {
			if (contextSequence == null) return;

			chatSession?.dispose();
			chatSession = new LlamaChatSession({
				contextSequence,
				autoDisposeSequence: false
			});

			chatSession.setChatHistory(
				messages ?? [
					{
						type: 'system',
						text: getCurrentSystemPrompt()
					}
				]
			);

			chatSessionCompletionEngine =
				chatSession.createPromptCompletionEngine({
					onGeneration(prompt, completion) {
						if (
							llmState.state.chatSession.draftPrompt.prompt ===
							prompt
						) {
							llmState.state = {
								...llmState.state,
								chatSession: {
									...llmState.state.chatSession,
									draftPrompt: {
										prompt,
										completion
									}
								}
							};
						}
					}
				});

			llmState.state = {
				...llmState.state,
				chatSession: {
					loaded: markAsLoaded
						? true
						: llmState.state.chatSession.loaded,
					generatingResult: false,
					simplifiedChat: getSimplifiedChatHistory(false),
					draftPrompt: {
						prompt: llmState.state.chatSession.draftPrompt.prompt,
						completion:
							chatSessionCompletionEngine.complete(
								llmState.state.chatSession.draftPrompt.prompt
							) ?? ''
					}
				}
			};

			chatSession.onDispose.createListener(() => {
				chatSessionCompletionEngine = null;
				promptAbortController = null;
				llmState.state = {
					...llmState.state,
					chatSession: {
						loaded: false,
						generatingResult: false,
						simplifiedChat: [],
						draftPrompt: llmState.state.chatSession.draftPrompt
					}
				};
			});
		},
		setDraftPrompt(prompt: string) {
			if (chatSessionCompletionEngine == null) return;

			llmState.state = {
				...llmState.state,
				chatSession: {
					...llmState.state.chatSession,
					draftPrompt: {
						prompt: prompt,
						completion:
							chatSessionCompletionEngine.complete(prompt) ?? ''
					}
				}
			};
		}
	}
} as const;

function getSimplifiedChatHistory(
	generatingResult: boolean,
	currentPrompt?: string
) {
	if (chatSession == null) return [];

	const chatHistory: SimplifiedChatItem[] = chatSession
		.getChatHistory()
		.flatMap((item): SimplifiedChatItem[] => {
			if (item.type === 'system') return [];
			if (item.type === 'user') {
				// return [{ type: 'user', message: item.text }];
				// Use original message if available, otherwise use the augmented one
				const originalMessage =
					originalUserMessages.get(item.text) || item.text;
				return [{ type: 'user', message: originalMessage }];
			}
			if (item.type === 'model')
				return [
					{
						type: 'model',
						message: item.response
							.filter(
								(item) =>
									typeof item === 'string' ||
									isChatModelResponseSegment(item)
							)
							.map(
								(
									item
								):
									| SimplifiedModelChatItem['message'][number]
									| null => {
									if (typeof item === 'string')
										return {
											type: 'text',
											text: item
										};
									if (isChatModelResponseSegment(item))
										return {
											type: 'segment',
											segmentType: item.segmentType,
											text: item.text,
											startTime: item.startTime,
											endTime: item.endTime
										};

									void (item satisfies never); // ensure all item types are handled
									return null;
								}
							)
							.filter((item) => item != null)

							// squash adjacent response items of the same type
							.reduce(
								(res, item) => {
									return squashMessageIntoModelChatMessages(
										res,
										item
									);
								},
								[] as SimplifiedModelChatItem['message']
							)
					}
				];

			void (item satisfies never); // ensure all item types are handled
			return [];
		});

	if (generatingResult && currentPrompt != null) {
		chatHistory.push({
			type: 'user',
			message: currentPrompt
		});

		if (inProgressResponse.length > 0)
			chatHistory.push({
				type: 'model',
				message: inProgressResponse
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

	if (
		lastExistingModelMessage == null ||
		lastExistingModelMessage.type !== message.type
	) {
		// avoid pushing empty text messages
		if (message.type !== 'text' || message.text !== '')
			newModelChatMessages.push(message);

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
