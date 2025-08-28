import { randomUUID } from 'node:crypto';
import { app } from 'electron';
import path from 'node:path';
import Database from 'better-sqlite3';
import { ChatHistoryItem } from 'node-llama-cpp';

export interface SavedChat {
    id: string;
    title: string;
    messages: ChatHistoryItem[];
    model?: string;
    createdAt: string;
    updatedAt: string;
}

class ChatStorageSqlite {
    private database: Database.Database | null = null;
    private isInitialized = false;
    private databasePath: string;

    constructor() {
        // Set up database path in app data directory
        const userDataPath = app.getPath('userData');
        this.databasePath = path.join(userDataPath, 'data.db');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Initialize SQLite database
            this.database = new Database(this.databasePath);

            // Enable WAL mode for better performance and concurrency
            this.database.pragma('journal_mode = WAL');

            // Create chats table if it doesn't exist
            this.database.exec(`
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    messages TEXT NOT NULL, -- JSON string of ChatHistoryItem[]
                    model TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                
                -- Create index on updated_at for efficient sorting
                CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
            `);

            this.isInitialized = true;
            console.log('SQLite chat storage initialized at:', this.databasePath);
        } catch (error) {
            console.error('Failed to initialize SQLite chat storage:', error);
            throw error;
        }
    }

    async saveChat(chat: Omit<SavedChat, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SavedChat> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.database) {
            throw new Error('Database not initialized');
        }

        try {
            const now = new Date().toISOString();
            const chatId = chat.id || randomUUID();

            // Check if chat already exists to preserve createdAt
            let createdAt = now;
            if (chat.id) {
                const existingChat = this.getChatByIdSync(chat.id);
                if (existingChat) {
                    createdAt = existingChat.createdAt;
                }
            }

            const savedChat: SavedChat = {
                id: chatId,
                title: chat.title,
                messages: chat.messages,
                model: chat.model,
                createdAt,
                updatedAt: now,
            };

            // Prepare SQL statement for insert or replace
            const stmt = this.database.prepare(`
                INSERT OR REPLACE INTO chats (id, title, messages, model, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                savedChat.id,
                savedChat.title,
                JSON.stringify(savedChat.messages),
                savedChat.model || null,
                savedChat.createdAt,
                savedChat.updatedAt
            );

            console.log('Chat saved to SQLite:', savedChat.id, savedChat.title);
            return savedChat;
        } catch (error) {
            console.error('Failed to save chat to SQLite:', error);
            throw error;
        }
    }

    private getChatByIdSync(id: string): SavedChat | null {
        if (!this.database) return null;

        try {
            const stmt = this.database.prepare('SELECT * FROM chats WHERE id = ?');
            const row = stmt.get(id) as any;

            if (!row) return null;

            return {
                id: row.id,
                title: row.title,
                messages: JSON.parse(row.messages),
                model: row.model,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        } catch (error) {
            console.error('Failed to load chat from SQLite:', error);
            return null;
        }
    }

    async getChatById(id: string): Promise<SavedChat | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.getChatByIdSync(id);
    }

    async getAllChats(): Promise<SavedChat[]> {
        console.log('ChatStorageSqlite: getAllChats called, initialized:', this.isInitialized);
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.database) {
            console.error('ChatStorageSqlite: Database not initialized');
            return [];
        }

        try {
            console.log('ChatStorageSqlite: Querying database for all chats');
            const stmt = this.database.prepare('SELECT * FROM chats ORDER BY updated_at DESC');
            const rows = stmt.all() as any[];

            console.log('ChatStorageSqlite: Found rows:', rows.length);

            const chats: SavedChat[] = rows.map((row) => ({
                id: row.id,
                title: row.title,
                messages: JSON.parse(row.messages),
                model: row.model,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));

            console.log('ChatStorageSqlite: Returning chats:', chats.length);
            return chats;
        } catch (error) {
            console.error('ChatStorageSqlite: Failed to load chats:', error);
            return [];
        }
    }

    async deleteChat(id: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.database) {
            return false;
        }

        try {
            const stmt = this.database.prepare('DELETE FROM chats WHERE id = ?');
            const result = stmt.run(id);

            const success = result.changes > 0;
            if (success) {
                console.log('Chat deleted from SQLite:', id);
            }
            return success;
        } catch (error) {
            console.error('Failed to delete chat from SQLite:', error);
            return false;
        }
    }

    async updateChatTitle(id: string, title: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.database) {
            return false;
        }

        try {
            const now = new Date().toISOString();
            const stmt = this.database.prepare('UPDATE chats SET title = ?, updated_at = ? WHERE id = ?');
            const result = stmt.run(title, now, id);

            const success = result.changes > 0;
            if (success) {
                console.log('Chat title updated in SQLite:', id, title);
            }
            return success;
        } catch (error) {
            console.error('Failed to update chat title in SQLite:', error);
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

    // Migration method to import existing JSON files
    async migrateFromJsonFiles(jsonChatsDirectory: string): Promise<number> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.database) {
            throw new Error('Database not initialized');
        }

        try {
            const fs = await import('node:fs/promises');

            // Check if the directory exists
            try {
                await fs.access(jsonChatsDirectory);
            } catch {
                console.log('No existing JSON chats directory found, skipping migration');
                return 0;
            }

            const files = await fs.readdir(jsonChatsDirectory);
            const chatFiles = files.filter((file) => file.endsWith('.json'));

            let migratedCount = 0;

            for (const file of chatFiles) {
                try {
                    const chatPath = path.join(jsonChatsDirectory, file);
                    const content = await fs.readFile(chatPath, 'utf8');
                    const chat = JSON.parse(content) as SavedChat;

                    // Save to SQLite
                    await this.saveChat({
                        id: chat.id,
                        title: chat.title,
                        messages: chat.messages,
                        model: chat.model,
                    });

                    migratedCount++;
                    console.log(`Migrated chat: ${chat.id} - ${chat.title}`);
                } catch (error) {
                    console.error(`Failed to migrate chat file ${file}:`, error);
                }
            }

            console.log(`Migration completed: ${migratedCount} chats migrated from JSON files`);
            return migratedCount;
        } catch (error) {
            console.error('Failed to migrate from JSON files:', error);
            throw error;
        }
    }

    // Cleanup method for graceful shutdown
    close(): void {
        if (this.database) {
            this.database.close();
            this.database = null;
            this.isInitialized = false;
            console.log('SQLite chat storage closed');
        }
    }
}

// Export singleton instance
export const chatStorageSqlite = new ChatStorageSqlite();
