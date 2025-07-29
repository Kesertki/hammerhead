import { AudioStorageService } from './audioStorageService';

export class AudioDebugUtils {
    /**
     * Test audio storage functionality
     */
    static async testAudioStorage(): Promise<void> {
        try {
            console.log('=== Audio Storage Debug Test ===');

            // Get storage path
            const storagePath = await AudioStorageService.getStoragePath();
            console.log('Storage path:', storagePath);

            // Get current storage size
            const storageSize = await AudioStorageService.getStorageSize();
            console.log('Current storage size:', storageSize, 'bytes');

            // List existing files
            const existingFiles = await AudioStorageService.getAllAudioFiles();
            console.log('Existing audio files:', existingFiles.length);
            existingFiles.forEach((file, index) => {
                console.log(`  ${index + 1}. ${file.filename} (${file.size} bytes, ${file.duration}s)`);
            });

            console.log('=== Audio Storage Test Complete ===');
        } catch (error) {
            console.error('Audio storage test failed:', error);
        }
    }

    /**
     * Create a test audio blob for testing
     */
    static createTestAudioBlob(): Blob {
        // Create a simple test audio blob (silent audio)
        const sampleRate = 44100;
        const duration = 1; // 1 second
        const frameCount = sampleRate * duration;

        const arrayBuffer = new ArrayBuffer(frameCount * 2);
        const view = new Int16Array(arrayBuffer);

        // Fill with silence (zeros)
        for (let i = 0; i < frameCount; i++) {
            view[i] = 0;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Test saving a sample audio file
     */
    static async testSaveAudio(): Promise<string | null> {
        try {
            console.log('=== Testing Audio Save ===');

            const testBlob = this.createTestAudioBlob();
            console.log('Created test blob:', testBlob.size, 'bytes, type:', testBlob.type);

            const metadata = await AudioStorageService.saveAudio(testBlob, 1.0);

            if (metadata) {
                console.log('Test audio saved successfully:', metadata);
                return metadata.fullPath;
            }

            console.error('Failed to save test audio');
            return null;
        } catch (error) {
            console.error('Test save failed:', error);
            return null;
        }
    }
}

// Make it available globally for debugging in dev tools
if (typeof window !== 'undefined') {
    (window as Window & { AudioDebugUtils?: typeof AudioDebugUtils }).AudioDebugUtils = AudioDebugUtils;
}
