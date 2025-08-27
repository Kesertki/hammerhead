import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SavedChat } from '@/electron/settings/chatStorage.ts';
import { electronChatRpc } from '@/rpc/chatRpc.ts';

interface ChatState {
    chats: SavedChat[];
    loading: boolean;

    // Actions
    loadChats: () => Promise<void>;
    createNewChat: () => Promise<void>;
    saveCurrentChat: (title?: string) => Promise<SavedChat | null>;
    updateCurrentChat: (chatId?: string) => Promise<SavedChat | null>;
    deleteChat: (chatId: string) => Promise<boolean>;
    updateChatTitle: (chatId: string, title: string) => Promise<boolean>;

    // Internal state actions (for IPC events)
    addChat: (chat: SavedChat) => void;
    updateChat: (chat: SavedChat) => void;
    removeChat: (chatId: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
    subscribeWithSelector((set, get) => ({
        chats: [],
        loading: false,

        loadChats: async () => {
            try {
                set({ loading: true });
                const allChats = await electronChatRpc.getAllChats();
                set({ chats: allChats });
            } catch (error) {
                console.error('chatStore: Failed to load chats:', error);
            } finally {
                set({ loading: false });
            }
        },

        createNewChat: async () => {
            try {
                await electronChatRpc.createNewChat();
            } catch (error) {
                console.error('chatStore: Failed to create new chat:', error);
                console.error('chatStore: Error details:', {
                    name: (error as any)?.name,
                    message: (error as any)?.message,
                    stack: (error as any)?.stack,
                    fullError: error,
                });
            }
        },

        saveCurrentChat: async (title?: string) => {
            try {
                const savedChat = await electronChatRpc.saveCurrentChat(title);
                if (savedChat) {
                    // Note: No need to update state here, the IPC event will handle it
                    return savedChat;
                }
            } catch (error) {
                console.error('chatStore: Failed to save current chat:', error);
            }
            return null;
        },

        updateCurrentChat: async (chatId?: string) => {
            try {
                const updatedChat = await electronChatRpc.updateCurrentChatIfExists(chatId);
                if (updatedChat) {
                    // Note: No need to update state here, the IPC event will handle it
                    return updatedChat;
                }
            } catch (error) {
                console.error('chatStore: Failed to update current chat:', error);
            }
            return null;
        },

        deleteChat: async (chatId: string) => {
            try {
                const success = await electronChatRpc.deleteChat(chatId);
                if (success) {
                    // Note: No need to update state here, the IPC event will handle it
                    return true;
                }
            } catch (error) {
                console.error('chatStore: Failed to delete chat:', error);
            }
            return false;
        },

        updateChatTitle: async (chatId: string, title: string) => {
            try {
                const success = await electronChatRpc.updateChatTitle(chatId, title);
                if (success) {
                    // Note: For now we reload all chats since we don't have a title update IPC event
                    await get().loadChats();
                    return true;
                }
            } catch (error) {
                console.error('chatStore: Failed to update chat title:', error);
            }
            return false;
        },

        // Internal state actions for IPC events
        addChat: (chat: SavedChat) => {
            set((state) => {
                const existingIndex = state.chats.findIndex((c) => c.id === chat.id);
                if (existingIndex >= 0) {
                    // Update existing chat
                    const newChats = [...state.chats];
                    newChats[existingIndex] = chat;
                    return { chats: newChats };
                } else {
                    // Add new chat at the beginning
                    return { chats: [chat, ...state.chats] };
                }
            });
        },

        updateChat: (chat: SavedChat) => {
            set((state) => ({
                chats: state.chats.map((c) => (c.id === chat.id ? chat : c)),
            }));
        },

        removeChat: (chatId: string) => {
            set((state) => ({
                chats: state.chats.filter((c) => c.id !== chatId),
            }));
        },

        setLoading: (loading: boolean) => {
            set({ loading });
        },
    }))
);

// IPC event listeners setup
let ipcListenersSetup = false;

export const setupChatIpcListeners = () => {
    if (ipcListenersSetup) {
        console.log('chatStore: IPC listeners already set up, skipping');
        return;
    }

    const handleChatSaved = (_event: any, chat: SavedChat) => {
        useChatStore.getState().addChat(chat);
    };

    const handleChatUpdated = (_event: any, chat: SavedChat) => {
        useChatStore.getState().updateChat(chat);
    };

    const handleChatDeleted = (_event: any, chatId: string) => {
        useChatStore.getState().removeChat(chatId);
    };

    // Add IPC listeners
    window.ipcRenderer?.on('chat-saved', handleChatSaved);
    window.ipcRenderer?.on('chat-updated', handleChatUpdated);
    window.ipcRenderer?.on('chat-deleted', handleChatDeleted);

    ipcListenersSetup = true;

    // Return cleanup function
    return () => {
        window.ipcRenderer?.off('chat-saved', handleChatSaved);
        window.ipcRenderer?.off('chat-updated', handleChatUpdated);
        window.ipcRenderer?.off('chat-deleted', handleChatDeleted);
        ipcListenersSetup = false;
    };
};

// Auto-setup IPC listeners and load chats when store is first accessed
let storeInitialized = false;

export const initializeChatStore = () => {
    if (storeInitialized) return;

    console.log('chatStore: Initializing chat store');
    setupChatIpcListeners();
    useChatStore.getState().loadChats();
    storeInitialized = true;
};
