import { store } from './store';

export interface VoiceSettings {
	model: string;
	language: string;
}

export async function getVoiceSettings(): Promise<VoiceSettings | null> {
	try {
		return store.get('voiceSettings', {
			model: 'tiny',
			language: ''
		});
	} catch {
		return {
			model: 'tiny',
			language: ''
		};
	}
}

export async function setVoiceSettings(settings: VoiceSettings) {
	store.set('voiceSettings', settings);
}
