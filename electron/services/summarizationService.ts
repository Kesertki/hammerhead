import { join } from 'node:path';
import { ChatHistoryItem } from 'node-llama-cpp';

export interface SummarizationOptions {
    maxLength?: number;
    minLength?: number;
    doSample?: boolean;
}

class SummarizationService {
    private summarizer: any = null;
    private isInitialized = false;
    private isInitializing = false;
    private initializationFailed = false;

    private async initialize(): Promise<void> {
        if (this.isInitialized || this.isInitializing || this.initializationFailed) {
            // Wait for ongoing initialization
            while (this.isInitializing) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return;
        }

        this.isInitializing = true;

        try {
            console.log('Initializing summarization service...');

            // Temporarily skip AI initialization during development due to bundling issues
            if (process.env.NODE_ENV === 'development') {
                console.log('Skipping AI model loading in development mode - using fallback titles');
                this.initializationFailed = true;
                return;
            }

            // Try to import the transformer library
            const { pipeline } = await import('@xenova/transformers');

            // Determine the model cache path
            let cacheDir: string | undefined;

            if (process.env.NODE_ENV === 'production') {
                // In production, use the bundled model cache
                cacheDir = join(process.resourcesPath, 'model-cache');
            } else {
                // In development, use the node_modules cache
                cacheDir = join(process.cwd(), 'node_modules/.cache');
            }

            this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6', {
                cache_dir: cacheDir,
                quantized: true,
            });

            this.isInitialized = true;
            console.log('Summarization service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize summarization service:', error);
            console.log('Summarization service will use fallback title generation');
            this.initializationFailed = true;
            // Don't throw error, just mark as failed and use fallback
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Summarize text and generate a short title suitable for chat naming
     */
    async summarizeForTitle(text: string, options: SummarizationOptions = {}): Promise<string> {
        if (!this.isInitialized && !this.initializationFailed) {
            await this.initialize();
        }

        if (!text || text.trim().length === 0 || this.initializationFailed || !this.summarizer) {
            return this.generateFallbackTitle(text);
        }

        try {
            // For chat titles, we want short, concise summaries
            const defaultOptions = {
                max_length: 15, // Very short for titles
                min_length: 3,
                do_sample: false, // Deterministic output
                ...options,
            };

            const result = await this.summarizer(text, defaultOptions);
            let summary = result[0]?.summary_text || 'New Chat';

            // Clean up the summary for use as a title
            summary = this.cleanSummaryForTitle(summary);

            return summary || 'New Chat';
        } catch (error) {
            console.error('Error generating summary:', error);
            return this.generateFallbackTitle(text);
        }
    }

    /**
     * Generate a chat title from chat history messages
     */
    async generateChatTitle(messages: ChatHistoryItem[]): Promise<string> {
        // Find the first meaningful user message
        const userMessage = messages.find(
            (msg) => msg.type === 'user' && (msg as any).text && (msg as any).text.trim().length > 0
        );

        if (!userMessage || !(userMessage as any).text) {
            return 'New Chat';
        }

        // Extract the main text content (user messages always have string text)
        let textToSummarize = ((userMessage as any).text as string).trim();

        // If the message is very short, use it directly as title (with some cleanup)
        if (textToSummarize.length <= 50) {
            return this.cleanSummaryForTitle(textToSummarize);
        }

        // For longer messages, truncate to reasonable length for summarization
        if (textToSummarize.length > 500) {
            textToSummarize = textToSummarize.substring(0, 500) + '...';
        }

        return await this.summarizeForTitle(textToSummarize);
    }

    /**
     * Generate a simple fallback title when AI summarization isn't available
     */
    private generateFallbackTitle(text?: string): string {
        if (!text || text.trim().length === 0) {
            return 'New Chat';
        }

        // Simple fallback: take first 50 characters
        const cleaned = text.trim();
        if (cleaned.length <= 50) {
            return this.cleanSummaryForTitle(cleaned);
        }

        return this.cleanSummaryForTitle(cleaned.substring(0, 47) + '...');
    }

    /**
     * Clean and format summary text for use as a chat title
     */
    private cleanSummaryForTitle(text: string): string {
        if (!text) return 'New Chat';

        let cleaned = text.trim();

        // Remove common summarization artifacts
        cleaned = cleaned.replace(/^(summary|summary:|the user|user|question|ask|asking|discuss|discussion):\s*/i, '');
        cleaned = cleaned.replace(/\.$/, ''); // Remove trailing period
        cleaned = cleaned.replace(/^\w+ing\s+/i, ''); // Remove "asking", "discussing", etc.

        // Capitalize first letter
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }

        // Ensure reasonable length for a title (max 60 chars)
        if (cleaned.length > 60) {
            cleaned = cleaned.substring(0, 57) + '...';
        }

        // Fallback if cleaning resulted in empty string
        return cleaned || 'New Chat';
    }

    /**
     * Check if the service is ready to use
     */
    isReady(): boolean {
        return this.isInitialized && !this.isInitializing && !this.initializationFailed;
    }

    /**
     * Get service status
     */
    getStatus(): { initialized: boolean; initializing: boolean; failed: boolean } {
        return {
            initialized: this.isInitialized,
            initializing: this.isInitializing,
            failed: this.initializationFailed,
        };
    }

    /**
     * Dispose of the service and free resources
     */
    dispose(): void {
        this.summarizer = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.initializationFailed = false;
    }
}

// Export singleton instance
export const summarizationService = new SummarizationService();
