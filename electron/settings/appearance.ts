import { store } from './store';
import type { AppearanceSettings } from '../../src/types';
import { DEFAULT_APPEARANCE_SETTINGS } from '../../src/types';

export async function getAppearanceSettings(): Promise<AppearanceSettings> {
    try {
        return store.get('appearanceSettings', DEFAULT_APPEARANCE_SETTINGS);
    } catch {
        return DEFAULT_APPEARANCE_SETTINGS;
    }
}

export async function setAppearanceSettings(settings: AppearanceSettings) {
    store.set('appearanceSettings', settings);
}
