import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';

export interface LogEntry {
    timestamp: string;
    level: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    stack?: string;
}

class Logger {
    private logFilePath: string;
    private originalConsole: {
        log: typeof console.log;
        info: typeof console.info;
        warn: typeof console.warn;
        error: typeof console.error;
        debug: typeof console.debug;
    };
    private isInitialized = false;

    constructor() {
        // Store original console methods
        this.originalConsole = {
            log: console.log.bind(console),
            info: console.info.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            debug: console.debug.bind(console),
        };

        // Set up log file path in app data directory
        const userDataPath = app.getPath('userData');
        this.logFilePath = path.join(userDataPath, 'logs', 'app.log');
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Ensure logs directory exists
            await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });

            // Check if log file exists and rotate if it's too large (> 10MB)
            try {
                const stats = await fs.stat(this.logFilePath);
                if (stats.size > 10 * 1024 * 1024) {
                    // Rotate log file
                    const rotatedPath = this.logFilePath.replace('.log', '-' + Date.now() + '.log');
                    await fs.rename(this.logFilePath, rotatedPath);
                }
            } catch {
                // File doesn't exist, which is fine
            }

            // Override console methods
            this.overrideConsole();
            this.isInitialized = true;

            // Log initialization
            await this.writeLog({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Logger initialized',
            });
        } catch (error) {
            this.originalConsole.error('Failed to initialize logger:', error);
        }
    }

    private overrideConsole(): void {
        console.log = (...args: unknown[]) => {
            this.originalConsole.log(...args);
            this.writeLog({
                timestamp: new Date().toISOString(),
                level: 'log',
                message: args.map((arg) => this.formatArgument(arg)).join(' '),
            });
        };

        console.info = (...args: unknown[]) => {
            this.originalConsole.info(...args);
            this.writeLog({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: args.map((arg) => this.formatArgument(arg)).join(' '),
            });
        };

        console.warn = (...args: unknown[]) => {
            this.originalConsole.warn(...args);
            this.writeLog({
                timestamp: new Date().toISOString(),
                level: 'warn',
                message: args.map((arg) => this.formatArgument(arg)).join(' '),
            });
        };

        console.error = (...args: unknown[]) => {
            this.originalConsole.error(...args);
            const errorEntry: LogEntry = {
                timestamp: new Date().toISOString(),
                level: 'error',
                message: args.map((arg) => this.formatArgument(arg)).join(' '),
            };

            // Capture stack trace if first argument is an Error
            if (args[0] instanceof Error && args[0].stack) {
                errorEntry.stack = args[0].stack;
            }

            this.writeLog(errorEntry);
        };

        console.debug = (...args: unknown[]) => {
            this.originalConsole.debug(...args);
            this.writeLog({
                timestamp: new Date().toISOString(),
                level: 'debug',
                message: args.map((arg) => this.formatArgument(arg)).join(' '),
            });
        };
    }

    private formatArgument(arg: unknown): string {
        if (typeof arg === 'string') {
            return arg;
        }
        if (arg instanceof Error) {
            return arg.message;
        }
        try {
            return JSON.stringify(arg, null, 2);
        } catch {
            return String(arg);
        }
    }

    private async writeLog(entry: LogEntry): Promise<void> {
        try {
            const logLine = JSON.stringify(entry) + '\n';
            await fs.appendFile(this.logFilePath, logLine, 'utf8');
        } catch (error) {
            // Use original console to avoid infinite loop
            this.originalConsole.error('Failed to write to log file:', error);
        }
    }

    async getLogs(limit?: number): Promise<LogEntry[]> {
        try {
            const content = await fs.readFile(this.logFilePath, 'utf8');
            const lines = content
                .trim()
                .split('\n')
                .filter((line) => line.length > 0);

            const entries: LogEntry[] = [];
            for (const line of lines) {
                try {
                    const entry = JSON.parse(line) as LogEntry;
                    entries.push(entry);
                } catch {
                    // Skip malformed lines
                }
            }

            // Return most recent entries first
            entries.reverse();

            if (limit && limit > 0) {
                return entries.slice(0, limit);
            }

            return entries;
        } catch (error) {
            this.originalConsole.error('Failed to read log file:', error);
            return [];
        }
    }

    async clearLogs(): Promise<void> {
        try {
            await fs.writeFile(this.logFilePath, '', 'utf8');
            await this.writeLog({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Logs cleared',
            });
        } catch (error) {
            this.originalConsole.error('Failed to clear log file:', error);
        }
    }

    getLogFilePath(): string {
        return this.logFilePath;
    }

    restoreConsole(): void {
        if (!this.isInitialized) return;

        console.log = this.originalConsole.log;
        console.info = this.originalConsole.info;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
        console.debug = this.originalConsole.debug;

        this.isInitialized = false;
    }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const getLogs = (limit?: number) => logger.getLogs(limit);
export const clearLogs = () => logger.clearLogs();
export const getLogFilePath = () => logger.getLogFilePath();
export const initializeLogger = () => logger.initialize();
