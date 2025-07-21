import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';

export interface AudioMetadata {
	id: string;
	filename: string;
	fullPath: string;
	size: number;
	duration: number;
	mimeType: string;
	createdAt: string;
}

class AudioStorage {
	private audioDirectoryPath: string;
	private isInitialized = false;

	constructor() {
		// Set up audio cache directory path in app data directory
		const userDataPath = app.getPath('userData');
		this.audioDirectoryPath = path.join(userDataPath, 'cache', 'audio');
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		try {
			// Ensure audio directory exists
			await fs.mkdir(this.audioDirectoryPath, { recursive: true });
			this.isInitialized = true;
			console.log(
				'Audio storage initialized at:',
				this.audioDirectoryPath
			);
		} catch (error) {
			console.error('Failed to initialize audio storage:', error);
			throw error;
		}
	}

	async saveAudioBlob(
		blob: Buffer,
		duration: number,
		mimeType: string = 'audio/webm'
	): Promise<AudioMetadata> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		try {
			// Generate unique filename
			const id = randomUUID();
			const extension = this.getExtensionFromMimeType(mimeType);
			const filename = `${id}.${extension}`;
			const fullPath = path.join(this.audioDirectoryPath, filename);

			// Write audio data to file
			await fs.writeFile(fullPath, blob);

			// Get file stats
			const stats = await fs.stat(fullPath);

			const metadata: AudioMetadata = {
				id,
				filename,
				fullPath,
				size: stats.size,
				duration,
				mimeType,
				createdAt: new Date().toISOString()
			};

			console.log('Audio file saved:', metadata);
			return metadata;
		} catch (error) {
			console.error('Failed to save audio file:', error);
			throw error;
		}
	}

	async deleteAudioFile(id: string): Promise<boolean> {
		try {
			const files = await this.listAudioFiles();
			const fileToDelete = files.find((file) => file.id === id);

			if (!fileToDelete) {
				console.warn(`Audio file with id ${id} not found`);
				return false;
			}

			await fs.unlink(fileToDelete.fullPath);
			console.log('Audio file deleted:', fileToDelete.filename);
			return true;
		} catch (error) {
			console.error('Failed to delete audio file:', error);
			return false;
		}
	}

	async listAudioFiles(): Promise<AudioMetadata[]> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		try {
			const files = await fs.readdir(this.audioDirectoryPath);
			const audioFiles: AudioMetadata[] = [];

			for (const filename of files) {
				// Skip non-audio files
				if (!this.isAudioFile(filename)) continue;

				const fullPath = path.join(this.audioDirectoryPath, filename);

				try {
					const stats = await fs.stat(fullPath);
					const id = path.parse(filename).name;

					// Try to determine mime type from extension
					const extension = path.extname(filename).slice(1);
					const mimeType = this.getMimeTypeFromExtension(extension);

					audioFiles.push({
						id,
						filename,
						fullPath,
						size: stats.size,
						duration: 0, // Duration not stored in file metadata
						mimeType,
						createdAt: stats.birthtime.toISOString()
					});
				} catch (statError) {
					console.warn(
						`Failed to get stats for ${filename}:`,
						statError
					);
				}
			}

			// Sort by creation date (newest first)
			return audioFiles.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime()
			);
		} catch (error) {
			console.error('Failed to list audio files:', error);
			return [];
		}
	}

	async getAudioFile(id: string): Promise<AudioMetadata | null> {
		const files = await this.listAudioFiles();
		return files.find((file) => file.id === id) || null;
	}

	async clearAllAudioFiles(): Promise<number> {
		try {
			const files = await this.listAudioFiles();
			let deletedCount = 0;

			for (const file of files) {
				try {
					await fs.unlink(file.fullPath);
					deletedCount++;
				} catch (error) {
					console.warn(`Failed to delete ${file.filename}:`, error);
				}
			}

			console.log(`Cleared ${deletedCount} audio files`);
			return deletedCount;
		} catch (error) {
			console.error('Failed to clear audio files:', error);
			return 0;
		}
	}

	private getExtensionFromMimeType(mimeType: string): string {
		const mimeToExt: Record<string, string> = {
			'audio/webm': 'webm',
			'audio/webm;codecs=opus': 'webm',
			'audio/mp4': 'm4a',
			'audio/ogg': 'ogg',
			'audio/ogg;codecs=opus': 'ogg',
			'audio/wav': 'wav',
			'audio/mpeg': 'mp3'
		};

		return mimeToExt[mimeType] || 'webm';
	}

	private getMimeTypeFromExtension(extension: string): string {
		const extToMime: Record<string, string> = {
			webm: 'audio/webm',
			m4a: 'audio/mp4',
			mp4: 'audio/mp4',
			ogg: 'audio/ogg',
			wav: 'audio/wav',
			mp3: 'audio/mpeg'
		};

		return extToMime[extension] || 'audio/webm';
	}

	private isAudioFile(filename: string): boolean {
		const audioExtensions = [
			'.webm',
			'.m4a',
			'.mp4',
			'.ogg',
			'.wav',
			'.mp3'
		];
		const ext = path.extname(filename).toLowerCase();
		return audioExtensions.includes(ext);
	}

	getAudioDirectoryPath(): string {
		return this.audioDirectoryPath;
	}

	async getDirectorySize(): Promise<number> {
		try {
			const files = await this.listAudioFiles();
			return files.reduce((total, file) => total + file.size, 0);
		} catch (error) {
			console.error('Failed to calculate directory size:', error);
			return 0;
		}
	}
}

// Create singleton instance
export const audioStorage = new AudioStorage();

// Export convenience functions
export const saveAudioBlob = (
	blob: Buffer,
	duration: number,
	mimeType?: string
) => audioStorage.saveAudioBlob(blob, duration, mimeType);
export const deleteAudioFile = (id: string) => audioStorage.deleteAudioFile(id);
export const listAudioFiles = () => audioStorage.listAudioFiles();
export const getAudioFile = (id: string) => audioStorage.getAudioFile(id);
export const clearAllAudioFiles = () => audioStorage.clearAllAudioFiles();
export const getAudioDirectoryPath = () => audioStorage.getAudioDirectoryPath();
export const initializeAudioStorage = () => audioStorage.initialize();
