// Test navigation history functionality
import { describe, it, expect, beforeEach } from 'vitest';
import { setNavigationHistory, getPreviousRoute, clearNavigationHistory } from '../utils/navigationHistory';

describe('Navigation History', () => {
    beforeEach(() => {
        clearNavigationHistory();
    });

    it('should track non-settings routes', () => {
        setNavigationHistory('/chats/123');
        expect(getPreviousRoute()).toBe('/chats/123');
    });

    it('should not track settings routes', () => {
        setNavigationHistory('/chats/123');
        setNavigationHistory('/settings/general');

        // Should still return the chat route, not the settings route
        expect(getPreviousRoute()).toBe('/chats/123');
    });

    it('should track multiple non-settings routes', () => {
        setNavigationHistory('/');
        setNavigationHistory('/chats/123');
        setNavigationHistory('/chats/456');

        expect(getPreviousRoute()).toBe('/chats/456');
    });

    it('should default to root when cleared', () => {
        setNavigationHistory('/chats/123');
        clearNavigationHistory();

        expect(getPreviousRoute()).toBe('/');
    });

    it('should ignore settings routes completely', () => {
        setNavigationHistory('/settings/mcp');
        expect(getPreviousRoute()).toBe('/');

        setNavigationHistory('/settings/voice');
        expect(getPreviousRoute()).toBe('/');
    });
});
