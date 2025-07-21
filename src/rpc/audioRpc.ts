import { ElectronAudioFunctions } from '@/electron/rpc/audioRpc.ts';
import { createRendererSideBirpc } from '../utils/createRendererSideBirpc.ts';

const renderedFunctions = {
	// Add any functions that the renderer might expose to the main process
} as const;

export type RenderedAudioFunctions = typeof renderedFunctions;

export const electronAudioRpc = createRendererSideBirpc<
	ElectronAudioFunctions,
	RenderedAudioFunctions
>('audioRpc', 'audioRpc', renderedFunctions);

// Initialize audio storage on startup
electronAudioRpc
	.initializeAudioStorage()
	.then(() => {
		console.log('Audio storage initialized');
	})
	.catch((error) => {
		console.error('Failed to initialize audio storage:', error);
	});
