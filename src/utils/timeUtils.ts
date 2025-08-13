/**
 * Format duration in milliseconds to a human-readable relative time string
 * using the native Intl.RelativeTimeFormat API for proper localization
 */
export function formatDuration(durationMs: number, locale: string): string {
    const rtf = new Intl.RelativeTimeFormat(locale, { 
        numeric: 'always', 
        style: 'long' 
    });
    
    // Convert milliseconds to appropriate unit
    const seconds = durationMs / 1000;
    
    if (seconds < 1) {
        // For sub-second durations, round up to 1 second
        return rtf.format(-1, 'second');
    } else if (seconds < 60) {
        // For durations less than 10 seconds, show with decimal places
        const value = seconds < 10 ? Math.round(seconds * 100) / 100 : Math.round(seconds);
        return rtf.format(-value, 'second');
    } else if (seconds < 3600) {
        return rtf.format(-Math.round(seconds / 60), 'minute');
    } else if (seconds < 86400) {
        return rtf.format(-Math.round(seconds / 3600), 'hour');
    } else {
        return rtf.format(-Math.round(seconds / 86400), 'day');
    }
}

/**
 * Alternative approach: Format duration as a positive duration string
 * This might be more appropriate for "thought for X seconds" context
 */
export function formatDurationPositive(durationMs: number, locale: string): string {
    const seconds = durationMs / 1000;
    
    if (seconds < 1) {
        return new Intl.NumberFormat(locale, {
            maximumFractionDigits: 0,
            style: 'unit',
            unit: 'millisecond',
            unitDisplay: 'long'
        }).format(Math.round(durationMs));
    } else if (seconds < 60) {
        const value = seconds < 10 ? Math.round(seconds * 100) / 100 : Math.round(seconds);
        return new Intl.NumberFormat(locale, {
            maximumFractionDigits: seconds < 10 ? 2 : 0,
            style: 'unit',
            unit: 'second',
            unitDisplay: 'long'
        }).format(value);
    } else if (seconds < 3600) {
        return new Intl.NumberFormat(locale, {
            maximumFractionDigits: 0,
            style: 'unit',
            unit: 'minute',
            unitDisplay: 'long'
        }).format(Math.round(seconds / 60));
    } else if (seconds < 86400) {
        return new Intl.NumberFormat(locale, {
            maximumFractionDigits: 0,
            style: 'unit',
            unit: 'hour',
            unitDisplay: 'long'
        }).format(Math.round(seconds / 3600));
    } else {
        return new Intl.NumberFormat(locale, {
            maximumFractionDigits: 0,
            style: 'unit',
            unit: 'day',
            unitDisplay: 'long'
        }).format(Math.round(seconds / 86400));
    }
}
