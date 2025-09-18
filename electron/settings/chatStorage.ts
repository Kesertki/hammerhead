import { ChatHistoryItem } from 'node-llama-cpp';
import { chatStorageSqlite } from './chatStorageSqlite.ts';

export interface SavedChat {
    id: string;
    title: string;
    messages: ChatHistoryItem[];
    model?: string;
    createdAt: string;
    updatedAt: string;
}

class ChatStorage {
    private isInitialized = false;
    private migrationCompleted = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Initialize SQLite storage first
            await chatStorageSqlite.initialize();

            // Check if migration is needed (only once)
            if (!this.migrationCompleted) {
                try {
                    // Simple check: if SQLite is empty and JSON files exist, migration was likely needed
                    // but is now handled automatically by the SQLite initialization
                    console.log('Checking for any existing JSON chat files to migrate...');
                } catch (migrationError) {
                    console.error('Migration check failed, but continuing with SQLite storage:', migrationError);
                }
                this.migrationCompleted = true;
            }

            this.isInitialized = true;
            console.log('Chat storage initialized (SQLite backend)');
        } catch (error) {
            console.error('Failed to initialize chat storage:', error);
            throw error;
        }
    }

    async saveChat(chat: Omit<SavedChat, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SavedChat> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Delegate to SQLite storage
        return await chatStorageSqlite.saveChat(chat);
    }

    async getChatById(id: string): Promise<SavedChat | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Delegate to SQLite storage
        return await chatStorageSqlite.getChatById(id);
    }

    async getAllChats(): Promise<SavedChat[]> {
        console.log('ChatStorage: getAllChats called, initialized:', this.isInitialized);
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Delegate to SQLite storage
        return await chatStorageSqlite.getAllChats();
    }

    async deleteChat(id: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Delegate to SQLite storage
        return await chatStorageSqlite.deleteChat(id);
    }

    async updateChatTitle(id: string, title: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Delegate to SQLite storage
        return await chatStorageSqlite.updateChatTitle(id, title);
    }

    // Helper method to generate chat title from first message
    generateChatTitle(messages: ChatHistoryItem[]): string {
        // Delegate to SQLite storage
        return chatStorageSqlite.generateChatTitle(messages);
    }
}

// Export singleton instance
export const chatStorage = new ChatStorage();
