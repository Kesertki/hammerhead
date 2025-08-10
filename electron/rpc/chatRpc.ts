import type { SavedChat } from '../settings/chatStorage.ts';
import { chatStorage } from '../settings/chatStorage.ts';
import { llmState, llmFunctions } from '../state/llmState.ts';
import { createElectronSideBirpc } from '../utils/createElectronSideBirpc.ts';
import { BrowserWindow } from 'electron';

export class ElectronChatRpc {
    private window: BrowserWindow;

    public readonly rendererChatRpc: ReturnType<
        typeof createElectronSideBirpc<Record<string, never>, typeof this.functions>
    >;

    public readonly functions = {
        saveCurrentChat: async (title?: string): Promise<SavedChat | null> => {
            console.log('ElectronChatRpc: saveCurrentChat called with title:', title);
            try {
                const currentChat = llmState.state.chatSession;
                if (!currentChat.loaded || currentChat.simplifiedChat.length === 0) {
                    console.warn('ElectronChatRpc: No active chat to save');
                    return null;
                }

                // Export the current chat session to get messages in the proper format
                const path = await import('node:path');
                const os = await import('node:os');
                const tmpPath = path.join(os.tmpdir(), `tmp_chat_${Date.now()}.json`);
                const exported = await llmFunctions.chatSession.exportChatSession(tmpPath);

                if (!exported) {
                    console.error('Failed to export current chat session');
                    return null;
                }

                // Read and parse the exported data
                const fs = await import('node:fs/promises');
                const content = await fs.readFile(tmpPath, 'utf8');
                const chatData = JSON.parse(content);

                // Clean up temp file
                await fs.unlink(tmpPath).catch(() => {});

                const chatTitle = title || chatStorage.generateChatTitle(chatData.messages);
                const model = llmState.state.model.name;

                const savedChat = await chatStorage.saveChat({
                    title: chatTitle,
                    messages: chatData.messages,
                    model,
                });

                console.log('Current chat saved:', savedChat.id, savedChat.title);

                // Emit event to notify renderer process
                console.log('ElectronChatRpc: Sending chat-saved IPC event:', savedChat);
                this.window.webContents.send('chat-saved', savedChat);

                return savedChat;
            } catch (error) {
                console.error('Failed to save current chat:', error);
                return null;
            }
        },

        updateCurrentChatIfExists: async (chatId?: string): Promise<SavedChat | null> => {
            if (!chatId) return null;

            try {
                const currentChat = llmState.state.chatSession;
                if (!currentChat.loaded) return null;

                // Export the current chat session to get messages in the proper format
                const path = await import('node:path');
                const os = await import('node:os');
                const tmpPath = path.join(os.tmpdir(), `tmp_chat_${Date.now()}.json`);
                const exported = await llmFunctions.chatSession.exportChatSession(tmpPath);

                if (!exported) return null;

                // Read and parse the exported data
                const fs = await import('node:fs/promises');
                const content = await fs.readFile(tmpPath, 'utf8');
                const chatData = JSON.parse(content);

                // Clean up temp file
                await fs.unlink(tmpPath).catch(() => {});

                // Get existing chat to preserve title and creation date
                const existingChat = await chatStorage.getChatById(chatId);
                if (!existingChat) return null;

                const model = llmState.state.model.name;

                const savedChat = await chatStorage.saveChat({
                    id: chatId,
                    title: existingChat.title,
                    messages: chatData.messages,
                    model,
                });

                console.log('Current chat updated:', savedChat.id, savedChat.title);

                // Emit event to notify renderer process
                this.window.webContents.send('chat-updated', savedChat);

                return savedChat;
            } catch (error) {
                console.error('Failed to update current chat:', error);
                return null;
            }
        },

        loadChat: async (chatId: string): Promise<boolean> => {
            try {
                console.log('ElectronChatRpc: loadChat called for chatId:', chatId);
                const chat = await chatStorage.getChatById(chatId);
                if (!chat) {
                    console.error('Chat not found:', chatId);
                    return false;
                }

                console.log(
                    'ElectronChatRpc: Chat found, attempting to load messages. Chat has',
                    chat.messages.length,
                    'messages'
                );
                console.log('ElectronChatRpc: Current model loaded state:', llmState.state.model.loaded);
                console.log('ElectronChatRpc: Current llama loaded state:', llmState.state.llama.loaded);

                // Import the chat messages into current session - only if model is loaded
                try {
                    if (llmState.state.model.loaded && llmState.state.llama.loaded) {
                        console.log('ElectronChatRpc: Model and llama ready, attempting to import chat');
                        console.log('ElectronChatRpc: Chat session loaded:', llmState.state.chatSession.loaded);

                        // If chat session isn't loaded yet, try to create it first
                        if (!llmState.state.chatSession.loaded) {
                            console.log('ElectronChatRpc: Chat session not loaded, creating it first');
                            try {
                                await llmFunctions.chatSession.createChatSession();
                                console.log(
                                    'ElectronChatRpc: Chat session created, loaded:',
                                    llmState.state.chatSession.loaded
                                );
                            } catch (sessionError) {
                                console.error('ElectronChatRpc: Failed to create chat session:', sessionError);
                                return true; // Still return success to update UI state
                            }
                        }

                        // Now try to import the chat
                        if (llmState.state.chatSession.loaded) {
                            llmFunctions.chatSession.resetChatHistory(true, chat.messages);
                            console.log(
                                'ElectronChatRpc: Chat imported successfully, simplified chat length:',
                                llmState.state.chatSession.simplifiedChat.length
                            );
                        } else {
                            console.log('ElectronChatRpc: Chat session still not loaded after creation attempt');
                        }
                    } else {
                        console.log('ElectronChatRpc: System not ready for import, skipping resetChatHistory');
                        console.log('ElectronChatRpc: State check:', {
                            'model.loaded': llmState.state.model.loaded,
                            'llama.loaded': llmState.state.llama.loaded,
                            'chatSession.loaded': llmState.state.chatSession.loaded,
                        });
                        // Don't try to import when system isn't ready
                        // Let the UI handle preview via selectedChatMessages
                    }
                } catch (resetError) {
                    console.error('ElectronChatRpc: Failed to import chat:', resetError);
                    // Even if reset fails, we should still return success so the UI updates currentChatId
                    // The messages might not load, but at least the user know which chat they selected
                }

                console.log('Chat loaded:', chatId, chat.title);
                return true;
            } catch (error) {
                console.error('Failed to load chat:', error);
                return false;
            }
        },

        getAllChats: async (): Promise<SavedChat[]> => {
            console.log('ElectronChatRpc: getAllChats called');
            try {
                const result = await chatStorage.getAllChats();
                console.log('ElectronChatRpc: getAllChats result:', result);
                return result;
            } catch (error) {
                console.error('ElectronChatRpc: Failed to get all chats:', error);
                return [];
            }
        },

        getChatById: async (chatId: string): Promise<SavedChat | null> => {
            console.log('ElectronChatRpc: getChatById called for:', chatId);
            try {
                const result = await chatStorage.getChatById(chatId);
                console.log('ElectronChatRpc: getChatById result:', result ? 'found' : 'not found');
                return result;
            } catch (error) {
                console.error('ElectronChatRpc: Failed to get chat by id:', error);
                return null;
            }
        },

        deleteChat: async (chatId: string): Promise<boolean> => {
            try {
                const success = await chatStorage.deleteChat(chatId);
                if (success) {
                    // Emit event to notify renderer process
                    this.window.webContents.send('chat-deleted', chatId);
                }
                return success;
            } catch (error) {
                console.error('Failed to delete chat:', error);
                return false;
            }
        },

        updateChatTitle: async (chatId: string, title: string): Promise<boolean> => {
            try {
                return await chatStorage.updateChatTitle(chatId, title);
            } catch (error) {
                console.error('Failed to update chat title:', error);
                return false;
            }
        },

        createNewChat: async (): Promise<void> => {
            console.log('ElectronChatRpc: createNewChat called');
            try {
                // Clear the current chat session
                console.log('ElectronChatRpc: Calling llmFunctions.chatSession.clearChat');
                llmFunctions.chatSession.clearChat();
                console.log('ElectronChatRpc: New chat created (session cleared)');
            } catch (error) {
                console.error('ElectronChatRpc: Failed to create new chat:', error);
                throw error;
            }
        },
    } as const;

    public constructor(window: BrowserWindow) {
        this.window = window;
        this.rendererChatRpc = createElectronSideBirpc<Record<string, never>, typeof this.functions>(
            'chatRpc',
            'chatRpc',
            window,
            this.functions
        );
    }
}

export type ElectronChatFunctions = typeof ElectronChatRpc.prototype.functions;

export function registerChatRpc(window: BrowserWindow): ElectronChatRpc {
    return new ElectronChatRpc(window);
}
