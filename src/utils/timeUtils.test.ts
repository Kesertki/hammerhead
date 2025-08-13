import { describe, expect, it } from 'vitest';
import { formatDuration, formatDurationPositive } from './timeUtils';

describe('timeUtils', () => {
    describe('formatDurationPositive', () => {
        it('formats milliseconds correctly', () => {
            const result = formatDurationPositive(500, 'en-US');
            expect(result).toBe('500 milliseconds');
        });

        it('formats seconds with decimal precision for values under 10 seconds', () => {
            const result = formatDurationPositive(2500, 'en-US');
            expect(result).toBe('2.5 seconds');
        });

        it('formats seconds without decimal precision for values over 10 seconds', () => {
            const result = formatDurationPositive(45000, 'en-US');
            expect(result).toBe('45 seconds');
        });

        it('formats minutes correctly', () => {
            const result = formatDurationPositive(120000, 'en-US'); // 2 minutes
            expect(result).toBe('2 minutes');
        });

        it('formats hours correctly', () => {
            const result = formatDurationPositive(3600000, 'en-US'); // 1 hour
            expect(result).toBe('1 hour');
        });

        it('formats days correctly', () => {
            const result = formatDurationPositive(86400000, 'en-US'); // 1 day
            expect(result).toBe('1 day');
        });

        it('handles different locales', () => {
            const duration = 2500; // 2.5 seconds

            const enResult = formatDurationPositive(duration, 'en-US');
            const esResult = formatDurationPositive(duration, 'es');
            const frResult = formatDurationPositive(duration, 'fr');

            // Check that results contain the expected values for each locale
            expect(enResult).toContain('2.5');
            expect(enResult).toContain('second');

            // Different locales may use different decimal separators and translations
            expect(esResult).toMatch(/2[.,]5/); // Spanish may use comma or period
            expect(frResult).toMatch(/2[.,]5/); // French may use comma or period
        });

        it('handles edge cases', () => {
            expect(formatDurationPositive(0, 'en-US')).toBe('0 milliseconds');
            expect(formatDurationPositive(999, 'en-US')).toBe('999 milliseconds');
            expect(formatDurationPositive(1000, 'en-US')).toBe('1 second');
        });
    });

    describe('formatDuration', () => {
        it('formats sub-second durations as 1 second ago', () => {
            const result = formatDuration(500, 'en-US');
            expect(result).toBe('1 second ago');
        });

        it('formats seconds with decimal precision for values under 10 seconds', () => {
            const result = formatDuration(2500, 'en-US');
            expect(result).toBe('2.5 seconds ago');
        });

        it('formats seconds without decimal precision for values over 10 seconds', () => {
            const result = formatDuration(45000, 'en-US');
            expect(result).toBe('45 seconds ago');
        });

        it('formats minutes correctly', () => {
            const result = formatDuration(120000, 'en-US'); // 2 minutes
            expect(result).toBe('2 minutes ago');
        });

        it('formats hours correctly', () => {
            const result = formatDuration(3600000, 'en-US'); // 1 hour
            expect(result).toBe('1 hour ago');
        });

        it('formats days correctly', () => {
            const result = formatDuration(86400000, 'en-US'); // 1 day
            expect(result).toBe('1 day ago');
        });

        it('handles different locales for relative time', () => {
            const duration = 45000; // 45 seconds

            const enResult = formatDuration(duration, 'en-US');
            const esResult = formatDuration(duration, 'es');

            expect(enResult).toBe('45 seconds ago');
            expect(esResult).toBe('hace 45 segundos');
        });

        it('handles edge cases', () => {
            expect(formatDuration(0, 'en-US')).toBe('1 second ago');
            expect(formatDuration(999, 'en-US')).toBe('1 second ago');
        });
    });
});
