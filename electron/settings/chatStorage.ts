import { randomUUID } from 'node:crypto';
import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ChatHistoryItem } from 'node-llama-cpp';

export interface SavedChat {
    id: string;
    title: string;
    messages: ChatHistoryItem[];
    model?: string;
    createdAt: string;
    updatedAt: string;
}

class ChatStorage {
    private chatsDirectoryPath: string;
    private isInitialized = false;

    constructor() {
        // Set up chats directory path in app data directory
        const userDataPath = app.getPath('userData');
        this.chatsDirectoryPath = path.join(userDataPath, 'chats');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Ensure chats directory exists
            await fs.mkdir(this.chatsDirectoryPath, { recursive: true });
            this.isInitialized = true;
            console.log('Chat storage initialized at:', this.chatsDirectoryPath);
        } catch (error) {
            console.error('Failed to initialize chat storage:', error);
            throw error;
        }
    }

    async saveChat(chat: Omit<SavedChat, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SavedChat> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const now = new Date().toISOString();
            const savedChat: SavedChat = {
                id: chat.id || randomUUID(),
                title: chat.title,
                messages: chat.messages,
                model: chat.model,
                createdAt: chat.id ? (await this.getChatById(chat.id))?.createdAt || now : now,
                updatedAt: now,
            };

            const chatPath = path.join(this.chatsDirectoryPath, `${savedChat.id}.json`);
            await fs.writeFile(chatPath, JSON.stringify(savedChat, null, 2), 'utf8');

            console.log('Chat saved:', savedChat.id, savedChat.title);
            return savedChat;
        } catch (error) {
            console.error('Failed to save chat:', error);
            throw error;
        }
    }

    async getChatById(id: string): Promise<SavedChat | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const chatPath = path.join(this.chatsDirectoryPath, `${id}.json`);
            const content = await fs.readFile(chatPath, 'utf8');
            return JSON.parse(content) as SavedChat;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null; // Chat not found
            }
            console.error('Failed to load chat:', error);
            throw error;
        }
    }

    async getAllChats(): Promise<SavedChat[]> {
        console.log('ChatStorage: getAllChats called, initialized:', this.isInitialized);
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log('ChatStorage: Reading directory:', this.chatsDirectoryPath);
            const files = await fs.readdir(this.chatsDirectoryPath);
            console.log('ChatStorage: Found files:', files);
            const chatFiles = files.filter((file) => file.endsWith('.json'));
            console.log('ChatStorage: JSON files:', chatFiles);

            const chats: SavedChat[] = [];
            for (const file of chatFiles) {
                try {
                    const chatPath = path.join(this.chatsDirectoryPath, file);
                    const content = await fs.readFile(chatPath, 'utf8');
                    const chat = JSON.parse(content) as SavedChat;
                    chats.push(chat);
                } catch (error) {
                    console.error(`ChatStorage: Failed to load chat file ${file}:`, error);
                    // Continue with other files
                }
            }

            // Sort by updatedAt descending (most recent first)
            const sortedChats = chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            console.log('ChatStorage: Returning chats:', sortedChats.length);
            return sortedChats;
        } catch (error) {
            console.error('ChatStorage: Failed to load chats:', error);
            return [];
        }
    }

    async deleteChat(id: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const chatPath = path.join(this.chatsDirectoryPath, `${id}.json`);
            await fs.unlink(chatPath);
            console.log('Chat deleted:', id);
            return true;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return true; // Already deleted
            }
            console.error('Failed to delete chat:', error);
            return false;
        }
    }

    async updateChatTitle(id: string, title: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const chat = await this.getChatById(id);
            if (!chat) return false;

            chat.title = title;
            chat.updatedAt = new Date().toISOString();

            const chatPath = path.join(this.chatsDirectoryPath, `${id}.json`);
            await fs.writeFile(chatPath, JSON.stringify(chat, null, 2), 'utf8');

            console.log('Chat title updated:', id, title);
            return true;
        } catch (error) {
            console.error('Failed to update chat title:', error);
            return false;
        }
    }

    // Helper method to generate chat title from first message
    generateChatTitle(messages: ChatHistoryItem[]): string {
        const firstUserMessage = messages.find((msg) => msg.type === 'user');
        if (firstUserMessage && firstUserMessage.text) {
            // Take first 50 characters and add ellipsis if longer
            const title = firstUserMessage.text.trim();
            return title.length > 50 ? title.substring(0, 47) + '...' : title;
        }
        return 'New Chat';
    }
}

// Export singleton instance
export const chatStorage = new ChatStorage();
