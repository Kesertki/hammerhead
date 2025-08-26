import { test } from 'vitest';
import Database from 'better-sqlite3';
import type { SavedChat } from '../settings/chatStorage.ts';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Mock electron app.getPath for testing
const mockUserDataPath = path.join(os.tmpdir(), `hammerhead-test-${Date.now()}`);

// Create a test-specific instance
class TestChatStorageSqlite {
    private database: Database.Database | null = null;
    private isInitialized = false;
    private databasePath: string;

    constructor(testPath: string) {
        this.databasePath = path.join(testPath, 'chats.db');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        // Ensure directory exists
        await fs.mkdir(path.dirname(this.databasePath), { recursive: true });

        this.database = new Database(this.databasePath);
        this.database.pragma('journal_mode = WAL');
        
        this.database.exec(`
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                messages TEXT NOT NULL,
                model TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
        `);

        this.isInitialized = true;
    }

    async saveChat(chat: Omit<SavedChat, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SavedChat> {
        if (!this.isInitialized) await this.initialize();
        if (!this.database) throw new Error('Database not initialized');

        const now = new Date().toISOString();
        const chatId = chat.id || randomUUID();

        let createdAt = now;
        if (chat.id) {
            const existing = this.getChatByIdSync(chat.id);
            if (existing) createdAt = existing.createdAt;
        }

        const savedChat: SavedChat = {
            id: chatId,
            title: chat.title,
            messages: chat.messages,
            model: chat.model,
            createdAt,
            updatedAt: now,
        };

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

        return savedChat;
    }

    private getChatByIdSync(id: string): SavedChat | null {
        if (!this.database) return null;

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
    }

    async getChatById(id: string): Promise<SavedChat | null> {
        if (!this.isInitialized) await this.initialize();
        return this.getChatByIdSync(id);
    }

    async getAllChats(): Promise<SavedChat[]> {
        if (!this.isInitialized) await this.initialize();
        if (!this.database) return [];

        const stmt = this.database.prepare('SELECT * FROM chats ORDER BY updated_at DESC');
        const rows = stmt.all() as any[];

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            messages: JSON.parse(row.messages),
            model: row.model,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }

    async deleteChat(id: string): Promise<boolean> {
        if (!this.isInitialized) await this.initialize();
        if (!this.database) return false;

        const stmt = this.database.prepare('DELETE FROM chats WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    close(): void {
        if (this.database) {
            this.database.close();
            this.database = null;
            this.isInitialized = false;
        }
    }
}

test('SQLite chat storage basic operations', async () => {
    const testStorage = new TestChatStorageSqlite(mockUserDataPath);
    
    try {
        await testStorage.initialize();

        // Test saving a chat
        const testMessages = [
            { type: 'system', text: 'You are a helpful assistant.' },
            { type: 'user', text: 'Hello, how are you?' },
            { type: 'model', text: 'I\'m doing well, thank you for asking!' }
        ] as any[];

        const savedChat = await testStorage.saveChat({
            title: 'Test Chat',
            messages: testMessages,
            model: 'test-model'
        });

        console.log('Saved chat:', savedChat);

        // Test getting chat by ID
        const retrievedChat = await testStorage.getChatById(savedChat.id);
        console.log('Retrieved chat:', retrievedChat);

        // Test getting all chats
        const allChats = await testStorage.getAllChats();
        console.log('All chats:', allChats.length);

        // Test updating chat (save with same ID)
        const updatedChat = await testStorage.saveChat({
            id: savedChat.id,
            title: 'Updated Test Chat',
            messages: [...testMessages, { type: 'user', text: 'Another message' }],
            model: 'test-model'
        });

        console.log('Updated chat:', updatedChat);

        // Test deletion
        const deleted = await testStorage.deleteChat(savedChat.id);
        console.log('Chat deleted:', deleted);

        const afterDelete = await testStorage.getAllChats();
        console.log('Chats after delete:', afterDelete.length);

    } finally {
        testStorage.close();
        
        // Clean up test directory
        try {
            await fs.rm(mockUserDataPath, { recursive: true, force: true });
        } catch (e) {
            console.warn('Failed to clean up test directory:', e);
        }
    }
});
