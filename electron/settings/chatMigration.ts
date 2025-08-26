#!/usr/bin/env node

/**
 * Migration script to convert JSON chat files to SQLite database
 * This script can be run standalone or integrated into the app startup
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { app } from 'electron';
import { chatStorageSqlite } from './chatStorageSqlite.ts';
import type { SavedChat } from './chatStorage.ts';

export class ChatMigration {
    private userDataPath: string;
    private chatsDirectoryPath: string;

    constructor() {
        this.userDataPath = app.getPath('userData');
        this.chatsDirectoryPath = path.join(this.userDataPath, 'chats');
    }

    async migrateJsonToSqlite(): Promise<{
        success: boolean;
        migratedCount: number;
        errors: string[];
        backupPath?: string;
    }> {
        const errors: string[] = [];
        let migratedCount = 0;
        let backupPath: string | undefined;

        try {
            // Initialize SQLite storage
            await chatStorageSqlite.initialize();

            // Check if JSON chats directory exists
            try {
                await fs.access(this.chatsDirectoryPath);
            } catch {
                console.log('No existing JSON chats directory found');
                return { success: true, migratedCount: 0, errors: [] };
            }

            console.log(`Starting migration from ${this.chatsDirectoryPath}`);

            // Read all JSON files
            const files = await fs.readdir(this.chatsDirectoryPath);
            const jsonFiles = files.filter((file) => file.endsWith('.json'));

            if (jsonFiles.length === 0) {
                console.log('No JSON chat files found');
                return { success: true, migratedCount: 0, errors: [] };
            }

            console.log(`Found ${jsonFiles.length} JSON chat files to migrate`);

            // Create backup directory
            backupPath = path.join(this.chatsDirectoryPath, 'json_backup');
            await fs.mkdir(backupPath, { recursive: true });

            // Process each JSON file
            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.chatsDirectoryPath, file);
                    console.log(`Processing ${file}...`);

                    // Read and parse JSON file
                    const content = await fs.readFile(filePath, 'utf8');
                    const chat = JSON.parse(content) as SavedChat;

                    // Validate required fields
                    if (!chat.id || !chat.title || !Array.isArray(chat.messages)) {
                        throw new Error(`Invalid chat data structure in ${file}`);
                    }

                    // Save to SQLite (preserving original timestamps)
                    await chatStorageSqlite.saveChat({
                        id: chat.id,
                        title: chat.title,
                        messages: chat.messages,
                        model: chat.model,
                    });

                    // Move original file to backup
                    const backupFilePath = path.join(backupPath, file);
                    await fs.rename(filePath, backupFilePath);

                    migratedCount++;
                    console.log(`✓ Migrated: ${chat.title} (${chat.id})`);
                } catch (error) {
                    const errorMsg = `Failed to migrate ${file}: ${error instanceof Error ? error.message : String(error)}`;
                    console.error(`✗ ${errorMsg}`);
                    errors.push(errorMsg);
                }
            }

            console.log(`\nMigration completed: ${migratedCount}/${jsonFiles.length} chats migrated`);

            if (errors.length > 0) {
                console.error(`\nErrors encountered during migration:`);
                errors.forEach((error) => console.error(`  - ${error}`));
            }

            // Verify migration by checking SQLite
            const sqliteChats = await chatStorageSqlite.getAllChats();
            console.log(`\nVerification: ${sqliteChats.length} chats found in SQLite database`);

            return {
                success: errors.length < jsonFiles.length, // Success if at least some files migrated
                migratedCount,
                errors,
                backupPath,
            };
        } catch (error) {
            const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            errors.push(errorMsg);

            return {
                success: false,
                migratedCount,
                errors,
                backupPath,
            };
        }
    }

    async rollbackMigration(): Promise<{ success: boolean; restoredCount: number; errors: string[] }> {
        const errors: string[] = [];
        let restoredCount = 0;

        try {
            const backupPath = path.join(this.chatsDirectoryPath, 'json_backup');

            // Check if backup directory exists
            try {
                await fs.access(backupPath);
            } catch {
                const errorMsg = 'No backup directory found - nothing to rollback';
                console.error(errorMsg);
                return { success: false, restoredCount: 0, errors: [errorMsg] };
            }

            console.log(`Rolling back migration from ${backupPath}`);

            // Read backup files
            const backupFiles = await fs.readdir(backupPath);
            const jsonFiles = backupFiles.filter((file) => file.endsWith('.json'));

            if (jsonFiles.length === 0) {
                const errorMsg = 'No JSON backup files found';
                console.error(errorMsg);
                return { success: false, restoredCount: 0, errors: [errorMsg] };
            }

            // Restore each file
            for (const file of jsonFiles) {
                try {
                    const backupFilePath = path.join(backupPath, file);
                    const originalFilePath = path.join(this.chatsDirectoryPath, file);

                    await fs.rename(backupFilePath, originalFilePath);
                    restoredCount++;
                    console.log(`✓ Restored: ${file}`);
                } catch (error) {
                    const errorMsg = `Failed to restore ${file}: ${error instanceof Error ? error.message : String(error)}`;
                    console.error(`✗ ${errorMsg}`);
                    errors.push(errorMsg);
                }
            }

            // Remove backup directory if it's empty
            try {
                const remainingFiles = await fs.readdir(backupPath);
                if (remainingFiles.length === 0) {
                    await fs.rmdir(backupPath);
                    console.log('Removed empty backup directory');
                }
            } catch (error) {
                console.warn('Failed to remove backup directory:', error);
            }

            console.log(`\nRollback completed: ${restoredCount}/${jsonFiles.length} files restored`);

            return {
                success: errors.length === 0,
                restoredCount,
                errors,
            };
        } catch (error) {
            const errorMsg = `Rollback failed: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            errors.push(errorMsg);

            return {
                success: false,
                restoredCount,
                errors,
            };
        }
    }

    async getStorageStats(): Promise<{
        jsonFiles: number;
        sqliteChats: number;
        databaseSize: number;
        backupExists: boolean;
    }> {
        let jsonFiles = 0;
        let sqliteChats = 0;
        let databaseSize = 0;
        let backupExists = false;

        try {
            // Count JSON files
            try {
                const files = await fs.readdir(this.chatsDirectoryPath);
                jsonFiles = files.filter((file) => file.endsWith('.json')).length;
            } catch {
                // Directory doesn't exist
            }

            // Count SQLite chats
            try {
                await chatStorageSqlite.initialize();
                const chats = await chatStorageSqlite.getAllChats();
                sqliteChats = chats.length;
            } catch {
                // SQLite not available
            }

            // Get database size
            try {
                const dbPath = path.join(this.userDataPath, 'chats.db');
                const stats = await fs.stat(dbPath);
                databaseSize = stats.size;
            } catch {
                // Database doesn't exist
            }

            // Check if backup exists
            try {
                await fs.access(path.join(this.chatsDirectoryPath, 'json_backup'));
                backupExists = true;
            } catch {
                // Backup doesn't exist
            }
        } catch (error) {
            console.error('Failed to get storage stats:', error);
        }

        return {
            jsonFiles,
            sqliteChats,
            databaseSize,
            backupExists,
        };
    }
}

// Export singleton instance
export const chatMigration = new ChatMigration();
