import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initialize i18n with default settings first
i18n
    // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
    // learn more: https://github.com/i18next/i18next-http-backend
    // want your translations to be loaded from a professional CDN? => https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn
    .use(Backend)
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        lng: 'en', // default language
        fallbackLng: 'en',
        debug: true,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
    });

// Load language setting from Electron and update i18n
const loadLanguageFromSettings = async () => {
    try {
        if (typeof window !== 'undefined' && window.electronAPI) {
            const settings = await window.electronAPI.getGeneralSettings();
            if (settings && settings.language) {
                await i18n.changeLanguage(settings.language);
            }
        }
    } catch (error) {
        console.error('Failed to load language from settings:', error);
        // Continue with default language if loading fails
    }
};

// Initialize language from settings
loadLanguageFromSettings();

export default i18n;
