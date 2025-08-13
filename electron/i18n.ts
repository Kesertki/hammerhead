import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'node:path';
import { getGeneralSettings } from './settings';

// Get the path to locales based on whether we're in development or production
const getLocalesPath = () => {
    if (process.env.NODE_ENV === 'development') {
        // In development, use the public/locales folder
        return path.join(process.cwd(), 'public', 'locales');
    } else {
        // In production, locales are in resources/app/public/locales
        return path.join(process.resourcesPath, 'app', 'public', 'locales');
    }
};

export const mainI18n = i18next.createInstance();

// Initialize i18n for the main process
export const initMainI18n = async () => {
    await mainI18n.use(Backend).init({
        lng: 'en', // default language
        fallbackLng: 'en',
        debug: false, // Set to true for debugging

        backend: {
            loadPath: path.join(getLocalesPath(), '{{lng}}', '{{ns}}.json'),
        },

        interpolation: {
            escapeValue: false, // Not needed for server-side
        },
    });

    // Load saved language from settings
    try {
        const settings = await getGeneralSettings();
        if (settings && settings.language) {
            await mainI18n.changeLanguage(settings.language);
        }
    } catch (error) {
        console.error('Failed to load language settings in main process:', error);
    }
};

// Function to change language in main process
export const changeMainLanguage = async (language: string) => {
    await mainI18n.changeLanguage(language);
};

// Helper function to get translation as string
export const t = (key: string, options?: any): string => {
    return mainI18n.t(key, options) as string;
};
