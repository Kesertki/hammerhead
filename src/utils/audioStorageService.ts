import { electronAudioRpc } from '@/rpc/audioRpc';
import type { AudioMetadata, TranscriptionResult } from '@/types';

export class AudioStorageService {
    /**
     * Save audio blob to storage and return metadata
     */
    static async saveAudio(blob: Blob, duration: number): Promise<AudioMetadata | null> {
        try {
            const arrayBuffer = await blob.arrayBuffer();
            // Convert ArrayBuffer to Uint8Array for reliable IPC transmission
            const uint8Array = new Uint8Array(arrayBuffer);
            const metadata = await electronAudioRpc.saveAudioBlob(uint8Array, duration, blob.type);
            console.log('Audio saved successfully:', metadata);
            return metadata;
        } catch (error) {
            console.error('Failed to save audio:', error);
            return null;
        }
    }

    /**
     * Get all stored audio files
     */
    static async getAllAudioFiles(): Promise<AudioMetadata[]> {
        try {
            return await electronAudioRpc.listAudioFiles();
        } catch (error) {
            console.error('Failed to get audio files:', error);
            return [];
        }
    }

    /**
     * Delete audio file by ID
     */
    static async deleteAudio(id: string): Promise<boolean> {
        try {
            return await electronAudioRpc.deleteAudioFile(id);
        } catch (error) {
            console.error('Failed to delete audio file:', error);
            return false;
        }
    }

    /**
     * Get audio file metadata by ID
     */
    static async getAudio(id: string): Promise<AudioMetadata | null> {
        try {
            return await electronAudioRpc.getAudioFile(id);
        } catch (error) {
            console.error('Failed to get audio file:', error);
            return null;
        }
    }

    /**
     * Clear all audio files
     */
    static async clearAllAudio(): Promise<number> {
        try {
            return await electronAudioRpc.clearAllAudioFiles();
        } catch (error) {
            console.error('Failed to clear audio files:', error);
            return 0;
        }
    }

    /**
     * Get storage directory path
     */
    static async getStoragePath(): Promise<string> {
        try {
            return await electronAudioRpc.getAudioDirectoryPath();
        } catch (error) {
            console.error('Failed to get storage path:', error);
            return '';
        }
    }

    /**
     * Get total storage size
     */
    static async getStorageSize(): Promise<number> {
        try {
            return await electronAudioRpc.getDirectorySize();
        } catch (error) {
            console.error('Failed to get storage size:', error);
            return 0;
        }
    }

    /**
     * Transcribe audio file
     */
    static async transcribeAudio(
        audioFilePath: string,
        model: string = 'tiny',
        language?: string
    ): Promise<TranscriptionResult | null> {
        try {
            console.log(`Transcribing audio: ${audioFilePath}`);
            return await electronAudioRpc.transcribeAudioFile(audioFilePath, model, language);
        } catch (error) {
            console.error('Failed to transcribe audio:', error);
            return null;
        }
    }

    /**
     * Check if transcription is available
     */
    static async checkTranscriptionAvailability(): Promise<boolean> {
        try {
            return await electronAudioRpc.checkTranscriptionAvailability();
        } catch (error) {
            console.error('Failed to check transcription availability:', error);
            return false;
        }
    }

    /**
     * Get available transcription models
     */
    static async getAvailableModels(): Promise<string[]> {
        try {
            return await electronAudioRpc.getAvailableTranscriptionModels();
        } catch (error) {
            console.error('Failed to get available models:', error);
            return [];
        }
    }
}
