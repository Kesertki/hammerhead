import { BrowserWindow } from 'electron';
import {
	type TranscriptionResult,
	TranscriptionService
} from '../services/transcriptionService.ts';
import type { AudioMetadata } from '../settings/audioStorage.ts';
import { audioStorage } from '../settings/audioStorage.ts';
import { createElectronSideBirpc } from '../utils/createElectronSideBirpc.ts';

// Define the interface for renderer-side functions (if any)
export interface RenderedAudioFunctions {
	// Add any functions that the main process might call on the renderer
}

export class ElectronAudioRpc {
	public readonly rendererAudioRpc: ReturnType<
		typeof createElectronSideBirpc<
			RenderedAudioFunctions,
			typeof this.functions
		>
	>;

	public readonly functions = {
		async saveAudioBlob(
			data: Uint8Array,
			duration: number,
			mimeType: string = 'audio/webm'
		): Promise<AudioMetadata> {
			try {
				const buffer = Buffer.from(data);
				return await audioStorage.saveAudioBlob(
					buffer,
					duration,
					mimeType
				);
			} catch (error) {
				console.error('Failed to save audio blob:', error);
				console.error('Data type received:', typeof data);
				console.error('Data constructor:', data?.constructor?.name);
				console.error(
					'Data instanceof Uint8Array:',
					data instanceof Uint8Array
				);
				throw error;
			}
		},

		async deleteAudioFile(id: string): Promise<boolean> {
			return await audioStorage.deleteAudioFile(id);
		},

		async listAudioFiles(): Promise<AudioMetadata[]> {
			return await audioStorage.listAudioFiles();
		},

		async getAudioFile(id: string): Promise<AudioMetadata | null> {
			return await audioStorage.getAudioFile(id);
		},

		async clearAllAudioFiles(): Promise<number> {
			return await audioStorage.clearAllAudioFiles();
		},

		async getAudioDirectoryPath(): Promise<string> {
			return audioStorage.getAudioDirectoryPath();
		},

		async getDirectorySize(): Promise<number> {
			return await audioStorage.getDirectorySize();
		},

		async initializeAudioStorage(): Promise<void> {
			return await audioStorage.initialize();
		},

		async transcribeAudioFile(
			audioFilePath: string,
			model: string = 'tiny',
			language?: string
		): Promise<TranscriptionResult> {
			try {
				console.log(`Transcribing audio file: ${audioFilePath}`);
				return await TranscriptionService.transcribeWithWhisper(
					audioFilePath,
					model,
					language
				);
			} catch (error) {
				console.error('Failed to transcribe audio file:', error);
				throw error;
			}
		},

		async checkTranscriptionAvailability(): Promise<boolean> {
			return await TranscriptionService.checkWhisperAvailability();
		},

		async getAvailableTranscriptionModels(): Promise<string[]> {
			return TranscriptionService.getAvailableModels();
		}
	} as const;

	public constructor(window: BrowserWindow) {
		this.rendererAudioRpc = createElectronSideBirpc<
			RenderedAudioFunctions,
			typeof this.functions
		>('audioRpc', 'audioRpc', window, this.functions);
	}
}

export type ElectronAudioFunctions =
	typeof ElectronAudioRpc.prototype.functions;

export function registerAudioRpc(window: BrowserWindow) {
	new ElectronAudioRpc(window);
}
