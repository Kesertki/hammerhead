import { summarizationService } from '../services/summarizationService.ts';
import { createElectronSideBirpc } from '../utils/createElectronSideBirpc.ts';
import { BrowserWindow } from 'electron';
import type { ChatHistoryItem } from 'node-llama-cpp';

export class ElectronSummarizationRpc {
    private window: BrowserWindow;

    public readonly rendererSummarizationRpc: ReturnType<
        typeof createElectronSideBirpc<Record<string, never>, typeof this.functions>
    >;

    public readonly functions = {
        /**
         * Generate a chat title from the given text
         */
        generateTitleFromText: async (text: string): Promise<string> => {
            console.log('ElectronSummarizationRpc: generateTitleFromText called');
            try {
                return await summarizationService.summarizeForTitle(text);
            } catch (error) {
                console.error('ElectronSummarizationRpc: Failed to generate title from text:', error);
                return 'New Chat';
            }
        },

        /**
         * Generate a chat title from chat history messages
         */
        generateTitleFromMessages: async (messages: ChatHistoryItem[]): Promise<string> => {
            console.log('ElectronSummarizationRpc: generateTitleFromMessages called with', messages.length, 'messages');
            try {
                return await summarizationService.generateChatTitle(messages);
            } catch (error) {
                console.error('ElectronSummarizationRpc: Failed to generate title from messages:', error);
                return 'New Chat';
            }
        },

        /**
         * Get the current status of the summarization service
         */
        getServiceStatus: async (): Promise<{ initialized: boolean; initializing: boolean; failed: boolean }> => {
            return summarizationService.getStatus();
        },

        /**
         * Check if the summarization service is ready
         */
        isServiceReady: async (): Promise<boolean> => {
            return summarizationService.isReady();
        },
    };

    constructor(window: BrowserWindow) {
        this.window = window;
        this.rendererSummarizationRpc = createElectronSideBirpc<Record<string, never>, typeof this.functions>(
            'summarizationRpc',
            'summarizationRpc',
            window,
            this.functions
        );
    }

    /**
     * Dispose of the RPC and clean up resources
     */
    dispose(): void {
        // The RPC will be disposed automatically when the window closes
    }
}

export type ElectronSummarizationFunctions = typeof ElectronSummarizationRpc.prototype.functions;

export function registerSummarizationRpc(window: BrowserWindow): ElectronSummarizationRpc {
    return new ElectronSummarizationRpc(window);
}

export type RendererSummarizationRpc = Awaited<ElectronSummarizationRpc['rendererSummarizationRpc']>['renderer'];
