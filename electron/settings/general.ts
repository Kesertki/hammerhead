import { store } from './store';
import type { GeneralSettings } from '../../src/types';
import { DEFAULT_GENERAL_SETTINGS } from '../../src/types';

export async function getGeneralSettings(): Promise<GeneralSettings> {
    try {
        return store.get('generalSettings', DEFAULT_GENERAL_SETTINGS);
    } catch {
        return DEFAULT_GENERAL_SETTINGS;
    }
}

export async function setGeneralSettings(settings: GeneralSettings) {
    store.set('generalSettings', settings);
}
